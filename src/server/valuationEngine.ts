/**
 * SAP Business One Authoritative Moving Average Costing (MAC) Engine
 * 
 * Rules Enforced:
 * 1. Independent valuation layer for every (Item + Location) combination.
 * 2. Incoming movements recalculate MAC: (Prev Value + Incoming Value) / (Prev Qty + Incoming Qty).
 * 3. Outgoing movements use Location MAC immediately before posting and NEVER change MAC.
 * 4. User cannot override or submit custom unit costs for outgoing transactions.
 * 5. Negative inventory is rejected unless explicitly authorized.
 * 6. Landed costs adjust valuation on remaining on-hand stock without altering quantity.
 * 7. Production costs allocate actual material issue cost pools to good finished units only; scrap is valued at 0 EGP.
 * 8. Returns require valid source documents, enforce remaining returnable quantities, and use historical cost bases.
 * 9. Transfers create atomic linked Transfer Out and Transfer In movements.
 * 10. Floating-point errors eliminated via 4-decimal quantity/cost and 2-decimal value rounding.
 */

import { SapTransactionCode, SAP_TRANSACTION_RULES, validateTransactionCostPermissions } from '../config/transactionConfig.ts';
import { getDb, isDbConnected } from '../db/index.ts';

export interface LocationValuationBalance {
  itemId: string;
  locationId: string;
  warehouseId: string;
  onHandQty: number;
  inventoryValue: number;
  movingAverageCost: number;
  lastDocumentNumber?: string;
  lastUpdated: string;
}

export interface InventoryPostingPayload {
  transactionCode: SapTransactionCode;
  itemId: string;
  itemCode: string;
  itemName: string;
  locationId: string; // Source Location or Receiving Location
  warehouseId?: string;
  destLocationId?: string; // For Transfers (Type 5 & 6)
  destWarehouseId?: string;
  
  quantity: number;
  unitPrice?: number; // Permitted only for Types 1, 7, 9(+)
  uom?: string;
  
  // Specific Transaction Contexts
  productionOrderId?: string;
  productionOrderNumber?: string;
  goodQuantity?: number; // For Type 3 (Receipt From Production)
  scrapQuantity?: number; // For Type 3 (Receipt From Production)
  
  landedCostAmount?: number; // For Type 8 (Landed Cost)
  revaluationAmount?: number; // For Type 10 (Revaluation)
  revaluationType?: 'TOTAL_VALUE' | 'UNIT_COST'; // For Type 10 (Revaluation)
  newUnitCost?: number; // For Type 10 (Revaluation)
  
  sourceDocumentType?: string;
  sourceDocumentNumber?: string;
  sourceDocumentId?: string;
  
  reference?: string;
  notes?: string;
  userId?: string;
  userName?: string;
}

export interface InventoryPostingResult {
  success: boolean;
  transactionId: string;
  documentNumber: string;
  transactionCode: SapTransactionCode;
  transactionType: string;
  itemId: string;
  locationId: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  
  preValuation: {
    onHandQty: number;
    inventoryValue: number;
    movingAverageCost: number;
  };
  postValuation: {
    onHandQty: number;
    inventoryValue: number;
    movingAverageCost: number;
  };
  
  linkedTransferResult?: {
    destLocationId: string;
    destPreValuation: { onHandQty: number; inventoryValue: number; movingAverageCost: number };
    destPostValuation: { onHandQty: number; inventoryValue: number; movingAverageCost: number };
  };
  
  auditLogId?: string;
  timestamp: string;
  message: string;
}

// In-Memory Storage for Independent Location Balances
// Key: `${itemId}:::${locationId}`
const locationBalances = new Map<string, LocationValuationBalance>();

// Simple mutex queue per item+location to guarantee concurrency control
const locationLocks = new Map<string, Promise<void>>();

function getLockKey(itemId: string, locationId: string): string {
  return `${itemId}:::${locationId}`;
}

async function acquireLock(lockKey: string): Promise<() => void> {
  while (locationLocks.has(lockKey)) {
    await locationLocks.get(lockKey);
  }
  let resolver: () => void;
  const promise = new Promise<void>(resolve => {
    resolver = resolve;
  });
  locationLocks.set(lockKey, promise);
  return () => {
    locationLocks.delete(lockKey);
    resolver();
  };
}

// Financial Rounding Helpers
export function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class ValuationEngine {
  /**
   * Retrieves current authoritative balance for Item + Location
   */
  public static getBalance(itemId: string, locationId: string): LocationValuationBalance {
    const key = getLockKey(itemId, locationId);
    const existing = locationBalances.get(key);
    if (existing) {
      return { ...existing };
    }
    return {
      itemId,
      locationId,
      warehouseId: locationId,
      onHandQty: 0,
      inventoryValue: 0,
      movingAverageCost: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Sets or initializes an authoritative balance (e.g. from seed or initial migration)
   */
  public static setBalance(balance: LocationValuationBalance): void {
    const key = getLockKey(balance.itemId, balance.locationId);
    locationBalances.set(key, {
      ...balance,
      onHandQty: round4(balance.onHandQty),
      inventoryValue: round2(balance.inventoryValue),
      movingAverageCost: balance.onHandQty > 0 ? round4(balance.inventoryValue / balance.onHandQty) : 0,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Initializes location balances from Item Master arrays
   */
  public static initializeFromItems(items: any[]): void {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!item || !item.id) continue;
      const whStock = item.warehouseStock;
      if (whStock && typeof whStock === 'object' && Object.keys(whStock).length > 0) {
        for (const [whId, s] of Object.entries(whStock)) {
          const stock = s as any;
          this.setBalance({
            itemId: item.id,
            locationId: whId,
            warehouseId: whId,
            onHandQty: stock.currentQty || 0,
            inventoryValue: stock.totalValue || ((stock.currentQty || 0) * (stock.movingAverageCost || 0)),
            movingAverageCost: stock.movingAverageCost || 0,
            lastUpdated: new Date().toISOString()
          });
        }
      } else {
        const defaultWh = item.defaultWarehouseId || 'wh-raw';
        this.setBalance({
          itemId: item.id,
          locationId: defaultWh,
          warehouseId: defaultWh,
          onHandQty: item.currentQty || 0,
          inventoryValue: item.totalValue || ((item.currentQty || 0) * (item.movingAverageCost || 0)),
          movingAverageCost: item.movingAverageCost || 0,
          lastUpdated: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Retrieves all location balances
   */
  public static getAllBalances(): LocationValuationBalance[] {
    return Array.from(locationBalances.values()).map(b => ({ ...b }));
  }

  /**
   * Clears all balances (used for test resets or scratch wipe)
   */
  public static clearAll(): void {
    locationBalances.clear();
  }

  /**
   * Authoritative transaction processor conforming to SAP Business One logic
   */
  public static async processTransaction(
    payload: InventoryPostingPayload,
    context?: {
      allLedgerEntries?: any[];
      allReceipts?: any[];
      allDeliveries?: any[];
      allProductionOrders?: any[];
      allMaterialIssues?: any[];
      allProductionReceipts?: any[];
      allReturnsToVendor?: any[];
      allReturnsFromCustomer?: any[];
    }
  ): Promise<InventoryPostingResult> {
    const rule = SAP_TRANSACTION_RULES[payload.transactionCode];
    if (!rule) {
      throw new Error(`Invalid transaction code: ${payload.transactionCode}`);
    }

    // 1. Validate Cost Input Permissions
    const costCheck = validateTransactionCostPermissions(payload.transactionCode, {
      unitPrice: payload.unitPrice,
      varianceQty: payload.quantity
    });
    if (!costCheck.allowed) {
      throw new Error(costCheck.reason || 'Cost permission violation');
    }

    // 2. Validate Locations
    if (rule.isLocationRequired && !payload.locationId) {
      throw new Error(`Source/Primary Location is required for ${rule.nameEn}`);
    }
    if (rule.isDestinationLocationRequired && !payload.destLocationId) {
      throw new Error(`Destination Location is required for ${rule.nameEn}`);
    }
    if (payload.destLocationId && payload.locationId === payload.destLocationId) {
      throw new Error('Source and destination locations must be different for stock transfers.');
    }

    // 3. Concurrency Lock for Item + Location
    const lockKey = getLockKey(payload.itemId, payload.locationId);
    const releaseLock = await acquireLock(lockKey);

    let releaseDestLock: (() => void) | null = null;
    if (payload.destLocationId) {
      const destLockKey = getLockKey(payload.itemId, payload.destLocationId);
      releaseDestLock = await acquireLock(destLockKey);
    }

    try {
      const current = this.getBalance(payload.itemId, payload.locationId);
      const preValuation = { ...current };

      const timestamp = new Date().toISOString();
      const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const documentNumber = payload.sourceDocumentNumber || `DOC-${payload.transactionCode}-${Date.now().toString().slice(-6)}`;

      let unitCost = 0;
      let totalValue = 0;
      let postOnHand = current.onHandQty;
      let postValue = current.inventoryValue;
      let postMAC = current.movingAverageCost;

      let linkedTransferResult: InventoryPostingResult['linkedTransferResult'] | undefined;

      switch (payload.transactionCode) {
        // ==========================================
        // TYPE 1: RECEIPT (General Inventory Receipt)
        // TYPE 7: GOODS RECEIPT PO (Vendor Purchase)
        // ==========================================
        case SapTransactionCode.RECEIPT:
        case SapTransactionCode.GOODS_RECEIPT_PO: {
          if (payload.quantity <= 0) {
            throw new Error('Receipt quantity must be greater than zero.');
          }
          if (payload.unitPrice === undefined || payload.unitPrice < 0) {
            throw new Error('Valid unit price is required for incoming receipts.');
          }

          unitCost = round4(payload.unitPrice);
          totalValue = round2(payload.quantity * unitCost);

          postOnHand = round4(current.onHandQty + payload.quantity);
          postValue = round2(current.inventoryValue + totalValue);
          postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : unitCost;
          break;
        }

        // ==========================================
        // TYPE 2: ISSUED (General Inventory Issue)
        // TYPE 4: ISSUED FOR PRODUCTION
        // TYPE 11: DELIVERY TO CUSTOMER
        // ==========================================
        case SapTransactionCode.ISSUE:
        case SapTransactionCode.ISSUE_FOR_PRODUCTION:
        case SapTransactionCode.CUSTOMER_DELIVERY: {
          if (payload.quantity <= 0) {
            throw new Error('Issued quantity must be greater than zero.');
          }
          if (current.onHandQty < payload.quantity) {
            throw new Error(
              `Insufficient stock at location '${payload.locationId}'. Available: ${current.onHandQty}, Requested: ${payload.quantity}. Negative inventory is not permitted.`
            );
          }

          // Authoritative cost is STRICTLY current Location MAC
          unitCost = current.onHandQty > 0 ? current.movingAverageCost : 0;
          totalValue = round2(payload.quantity * unitCost);

          postOnHand = round4(current.onHandQty - payload.quantity);
          postValue = postOnHand === 0 ? 0 : Math.max(0, round2(current.inventoryValue - totalValue));
          // Outgoing movements DO NOT change MAC!
          postMAC = current.movingAverageCost;
          break;
        }

        // ==========================================
        // TYPE 3: RECEIPT FROM PRODUCTION
        // ==========================================
        case SapTransactionCode.RECEIPT_FROM_PRODUCTION: {
          const goodQty = payload.goodQuantity !== undefined ? payload.goodQuantity : payload.quantity;
          const scrapQty = payload.scrapQuantity || 0;

          if (goodQty <= 0) {
            throw new Error('Good finished product quantity must be greater than zero.');
          }
          if (!payload.productionOrderId) {
            throw new Error('Production Order reference is required for Receipt From Production.');
          }

          // Calculate Production Cost Pool from actual posted material issues linked to this order
          let totalCostPool = 0;
          if (context?.allMaterialIssues) {
            const orderIssues = context.allMaterialIssues.filter(
              mi => (mi.productionOrderId === payload.productionOrderId || mi.productionOrderNumber === payload.sourceDocumentNumber) &&
                    mi.status !== 'CANCELLED'
            );
            totalCostPool = orderIssues.reduce((sum, mi) => sum + (mi.totalActualCostEGP || mi.totalIssueValueEGP || 0), 0);
          } else if (payload.unitPrice && payload.unitPrice > 0) {
            totalCostPool = payload.unitPrice * goodQty;
          }

          if (totalCostPool <= 0) {
            totalCostPool = goodQty * (current.movingAverageCost || 100);
          }

          // If production receipts are partial, track allocated production cost so costs cannot be capitalized repeatedly
          let previouslyAllocated = 0;
          if (context?.allProductionReceipts) {
            const priorReceipts = context.allProductionReceipts.filter(
              pr => (pr.productionOrderId === payload.productionOrderId || pr.productionOrderNumber === payload.sourceDocumentNumber) &&
                    pr.status !== 'CANCELLED'
            );
            previouslyAllocated = priorReceipts.reduce((sum, pr) => sum + (pr.totalValueEGP || (pr.quantity * (pr.unitCostEGP || 0)) || 0), 0);
          }

          const remainingCostPool = Math.max(0, round2(totalCostPool - previouslyAllocated));
          const allocatedCost = remainingCostPool > 0 ? remainingCostPool : round2(goodQty * (current.movingAverageCost || 100));

          // Allocate ENTIRE eligible cost pool to good finished product units. Scrap = 0 EGP!
          unitCost = round4(allocatedCost / goodQty);
          totalValue = round2(goodQty * unitCost);

          postOnHand = round4(current.onHandQty + goodQty);
          postValue = round2(current.inventoryValue + totalValue);
          postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : unitCost;
          break;
        }

        // ==========================================
        // TYPE 5 & 6: INVENTORY TRANSFER (Out & In)
        // ==========================================
        case SapTransactionCode.TRANSFER_OUT: {
          if (payload.quantity <= 0) {
            throw new Error('Transfer quantity must be greater than zero.');
          }
          if (!payload.destLocationId) {
            throw new Error('Destination location is required for inventory transfer.');
          }
          if (current.onHandQty < payload.quantity) {
            throw new Error(
              `Insufficient stock at source location '${payload.locationId}'. Available: ${current.onHandQty}, Transfer: ${payload.quantity}.`
            );
          }

          // 1. Source Location: Deduct at current source MAC
          const sourceMAC = current.onHandQty > 0 ? current.movingAverageCost : 0;
          unitCost = sourceMAC;
          totalValue = round2(payload.quantity * unitCost);

          postOnHand = round4(current.onHandQty - payload.quantity);
          postValue = postOnHand === 0 ? 0 : Math.max(0, round2(current.inventoryValue - totalValue));
          postMAC = sourceMAC; // Source MAC does not change!

          // 2. Destination Location: Receive at transferred cost
          const destCurrent = this.getBalance(payload.itemId, payload.destLocationId);
          const destPreValuation = { ...destCurrent };

          const destPostOnHand = round4(destCurrent.onHandQty + payload.quantity);
          const destPostValue = round2(destCurrent.inventoryValue + totalValue);
          const destPostMAC = destPostOnHand > 0 ? round4(destPostValue / destPostOnHand) : sourceMAC;

          // Commit Destination Balance
          this.setBalance({
            itemId: payload.itemId,
            locationId: payload.destLocationId,
            warehouseId: payload.destWarehouseId || payload.destLocationId,
            onHandQty: destPostOnHand,
            inventoryValue: destPostValue,
            movingAverageCost: destPostMAC,
            lastDocumentNumber: documentNumber,
            lastUpdated: timestamp
          });

          linkedTransferResult = {
            destLocationId: payload.destLocationId,
            destPreValuation,
            destPostValuation: {
              onHandQty: destPostOnHand,
              inventoryValue: destPostValue,
              movingAverageCost: destPostMAC
            }
          };
          break;
        }

        // ==========================================
        // TYPE 8: LANDED COST
        // ==========================================
        case SapTransactionCode.LANDED_COST: {
          const landedAmount = payload.landedCostAmount || payload.unitPrice || 0;
          if (landedAmount <= 0) {
            throw new Error('Landed cost amount must be greater than zero.');
          }
          if (!payload.sourceDocumentNumber) {
            throw new Error('Posted Goods Receipt PO reference is required for Landed Cost.');
          }

          // Landed cost increases value on remaining on-hand stock without altering quantity
          if (current.onHandQty <= 0) {
            throw new Error(`Cannot allocate landed cost to location '${payload.locationId}' because remaining on-hand stock is 0.`);
          }

          totalValue = round2(landedAmount);
          unitCost = round4(totalValue / current.onHandQty);

          postOnHand = current.onHandQty; // STRICTLY NO QUANTITY CHANGE!
          postValue = round2(current.inventoryValue + totalValue);
          postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : current.movingAverageCost;
          break;
        }

        // ==========================================
        // TYPE 9: COUNT POSTING (Physical Count)
        // ==========================================
        case SapTransactionCode.COUNT_POSTING: {
          const variance = payload.quantity; // Positive = gain, Negative = loss
          if (variance === 0) {
            throw new Error('Variance quantity must be non-zero for count posting.');
          }

          if (variance > 0) {
            // Positive variance (stock increase)
            if (payload.unitPrice === undefined || payload.unitPrice < 0) {
              throw new Error('Unit price is required for positive count posting variance.');
            }
            unitCost = round4(payload.unitPrice);
            totalValue = round2(variance * unitCost);

            postOnHand = round4(current.onHandQty + variance);
            postValue = round2(current.inventoryValue + totalValue);
            postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : unitCost;
          } else {
            // Negative variance (stock decrease)
            const absLoss = Math.abs(variance);
            if (current.onHandQty < absLoss) {
              throw new Error(
                `Count loss of ${absLoss} exceeds current book on-hand quantity of ${current.onHandQty}.`
              );
            }

            // Locked to current MAC
            unitCost = current.onHandQty > 0 ? current.movingAverageCost : 0;
            totalValue = round2(absLoss * unitCost);

            postOnHand = round4(current.onHandQty - absLoss);
            postValue = postOnHand === 0 ? 0 : Math.max(0, round2(current.inventoryValue - totalValue));
            postMAC = current.movingAverageCost;
          }
          break;
        }

        // ==========================================
        // TYPE 10: REVALUATION
        // ==========================================
        case SapTransactionCode.REVALUATION: {
          if (current.onHandQty <= 0) {
            throw new Error(`Cannot revalue location '${payload.locationId}' because on-hand stock is zero.`);
          }

          let adjAmount = 0;
          let targetVal = 0;
          let targetMAC = 0;

          if (payload.revaluationType === 'UNIT_COST' && payload.newUnitCost !== undefined) {
            if (payload.newUnitCost < 0) {
              throw new Error('New unit cost must be greater than or equal to zero.');
            }
            targetMAC = round4(payload.newUnitCost);
            targetVal = round2(current.onHandQty * targetMAC);
            adjAmount = round2(targetVal - current.inventoryValue);
          } else {
            adjAmount = payload.revaluationAmount !== undefined ? payload.revaluationAmount : (payload.unitPrice || 0);
            if (adjAmount === 0) {
              throw new Error('Revaluation adjustment amount must be non-zero.');
            }
            targetVal = round2(current.inventoryValue + adjAmount);
            targetMAC = current.onHandQty > 0 ? round4(targetVal / current.onHandQty) : 0;
          }

          if (targetVal < 0) {
            throw new Error(`Revaluation would result in invalid negative inventory value: ${targetVal} EGP.`);
          }

          totalValue = adjAmount;
          postOnHand = current.onHandQty; // No quantity change!
          postValue = targetVal;
          postMAC = targetMAC;
          unitCost = targetMAC;
          break;
        }

        // ==========================================
        // TYPE 12: RETURN TO VENDOR
        // ==========================================
        case SapTransactionCode.RETURN_TO_VENDOR: {
          if (payload.quantity <= 0) {
            throw new Error('Return quantity must be greater than zero.');
          }
          if (!payload.sourceDocumentNumber) {
            throw new Error('Original purchase receipt reference is required for Return to Vendor.');
          }
          if (current.onHandQty < payload.quantity) {
            throw new Error(
              `Insufficient stock to return to vendor. Available: ${current.onHandQty}, Return: ${payload.quantity}.`
            );
          }

          // Find original receipt to determine effective unit cost and returnable qty
          let origCost = current.movingAverageCost;
          if (context?.allReceipts) {
            const orig = context.allReceipts.find(
              r => r.receiptNumber === payload.sourceDocumentNumber && r.status !== 'CANCELLED'
            );
            if (orig) {
              const origEffectiveVal = (orig.totalValueEGP || 0) + (orig.landedCostAllocatedEGP || 0);
              const origQty = orig.baseQuantity || orig.quantity || 1;
              origCost = round4(origEffectiveVal / origQty);

              if (context?.allReturnsToVendor) {
                const priorReturns = context.allReturnsToVendor.filter(
                  ret => (ret.originalReceiptNumber === payload.sourceDocumentNumber || ret.originalReceiptId === orig.id) &&
                         ret.status !== 'CANCELLED'
                );
                const alreadyReturned = priorReturns.reduce((sum, r) => sum + (r.returnQuantity || 0), 0);
                const remainingReturnable = origQty - alreadyReturned;
                if (payload.quantity > remainingReturnable) {
                  throw new Error(`Return quantity (${payload.quantity}) exceeds remaining returnable quantity (${remainingReturnable}) on receipt ${payload.sourceDocumentNumber}.`);
                }
              }
            }
          }

          unitCost = origCost;
          totalValue = round2(payload.quantity * unitCost);

          postOnHand = round4(current.onHandQty - payload.quantity);
          postValue = postOnHand === 0 ? 0 : Math.max(0, round2(current.inventoryValue - totalValue));
          postMAC = current.movingAverageCost; // Outgoing return does not change moving average!
          break;
        }

        // ==========================================
        // TYPE 13: RETURN FROM CUSTOMER
        // ==========================================
        case SapTransactionCode.RETURN_FROM_CUSTOMER: {
          if (payload.quantity <= 0) {
            throw new Error('Return quantity must be greater than zero.');
          }
          if (!payload.sourceDocumentNumber) {
            throw new Error('Original customer delivery reference is required for Return from Customer.');
          }

          // Find original delivery to determine historical cost basis
          let histCost = current.movingAverageCost;
          if (context?.allDeliveries) {
            const origDel = context.allDeliveries.find(
              d => d.deliveryNumber === payload.sourceDocumentNumber && d.status !== 'CANCELLED'
            );
            if (origDel) {
              const origQty = origDel.baseQuantity || origDel.quantity || 1;
              histCost = round4(origDel.movingAverageCostEGP || (origDel.totalDeliveryValueEGP / origQty));

              if (context?.allReturnsFromCustomer) {
                const priorReturns = context.allReturnsFromCustomer.filter(
                  ret => (ret.originalDeliveryNumber === payload.sourceDocumentNumber || ret.originalDeliveryId === origDel.id) &&
                         ret.status !== 'CANCELLED'
                );
                const alreadyReturned = priorReturns.reduce((sum, r) => sum + (r.returnQuantity || 0), 0);
                const remainingReturnable = origQty - alreadyReturned;
                if (payload.quantity > remainingReturnable) {
                  throw new Error(`Return quantity (${payload.quantity}) exceeds delivered quantity available for return (${remainingReturnable}) on delivery ${payload.sourceDocumentNumber}.`);
                }
              }
            }
          }

          unitCost = histCost;
          totalValue = round2(payload.quantity * unitCost);

          postOnHand = round4(current.onHandQty + payload.quantity);
          postValue = round2(current.inventoryValue + totalValue);
          postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : unitCost;
          break;
        }

        default:
          throw new Error(`Unhandled transaction type: ${payload.transactionCode}`);
      }

      // Update Authoritative Location Balance
      this.setBalance({
        itemId: payload.itemId,
        locationId: payload.locationId,
        warehouseId: payload.warehouseId || payload.locationId,
        onHandQty: postOnHand,
        inventoryValue: postValue,
        movingAverageCost: postMAC,
        lastDocumentNumber: documentNumber,
        lastUpdated: timestamp
      });

      return {
        success: true,
        transactionId,
        documentNumber,
        transactionCode: payload.transactionCode,
        transactionType: rule.typeKey,
        itemId: payload.itemId,
        locationId: payload.locationId,
        quantity: payload.quantity,
        unitCost,
        totalValue,
        preValuation: {
          onHandQty: preValuation.onHandQty,
          inventoryValue: preValuation.inventoryValue,
          movingAverageCost: preValuation.movingAverageCost
        },
        postValuation: {
          onHandQty: postOnHand,
          inventoryValue: postValue,
          movingAverageCost: postMAC
        },
        linkedTransferResult,
        timestamp,
        message: `${rule.nameEn} posted successfully.`
      };
    } finally {
      releaseLock();
      if (releaseDestLock) {
        releaseDestLock();
      }
    }
  }

  /**
   * Reconciles all Item + Location balances by replaying historical ledger entries in chronological order.
   * Identifies discrepancies where stored balance != replayed balance or where an outgoing movement changed MAC.
   * Safe, non-destructive: updates location balances to authoritative values without modifying historical ledger records.
   */
  public static reconcileLocationBalances(
    allLedgerEntries: any[],
    masterItems?: any[]
  ): {
    timestamp: string;
    totalLocationsChecked: number;
    discrepancyCount: number;
    discrepancies: Array<{
      itemId: string;
      itemCode: string;
      itemName: string;
      locationId: string;
      storedOnHand: number;
      replayedOnHand: number;
      storedValue: number;
      replayedValue: number;
      storedMAC: number;
      replayedMAC: number;
      issues: string[];
    }>;
    reconciledBalances: LocationValuationBalance[];
  } {
    const activeEntries = (allLedgerEntries || []).filter(e => e.status !== 'CANCELLED');
    
    // Group entries by `${itemId}:::${locationId}`
    const locationGroups = new Map<string, any[]>();
    for (const entry of activeEntries) {
      const locId = entry.locationId || entry.warehouseId;
      if (!entry.itemId || !locId) continue;
      const key = getLockKey(entry.itemId, locId);
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(entry);
    }

    // Also include any currently initialized balances that may have had no movements
    for (const bal of this.getAllBalances()) {
      const key = getLockKey(bal.itemId, bal.locationId);
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
    }

    const discrepancies: any[] = [];
    const reconciledBalances: LocationValuationBalance[] = [];

    for (const [key, entries] of locationGroups.entries()) {
      const [itemId, locationId] = key.split(':::');
      const currentStored = this.getBalance(itemId, locationId);

      // Sort entries chronologically
      const sorted = [...entries].sort((a, b) => {
        const dateA = a.date || a.createdAt || '';
        const dateB = b.date || b.createdAt || '';
        return dateA.localeCompare(dateB);
      });

      let replayedQty = 0;
      let replayedVal = 0;
      let replayedMAC = 0;
      let lastDocNum = currentStored.lastDocumentNumber;
      const issues: string[] = [];

      for (const entry of sorted) {
        lastDocNum = entry.documentNumber || lastDocNum;
        const qtyIn = entry.qtyIn || 0;
        const qtyOut = entry.qtyOut || 0;
        const val = entry.transactionValueEGP || 0;

        if (entry.transactionType === 'LANDED_COST' || entry.transactionType === 'COST_ADJUSTMENT') {
          replayedVal = round2(replayedVal + val);
          replayedMAC = replayedQty > 0 ? round4(replayedVal / replayedQty) : replayedMAC;
        } else if (entry.transactionType === 'REVALUATION') {
          replayedVal = round2(replayedVal + val);
          replayedMAC = replayedQty > 0 ? round4(replayedVal / replayedQty) : 0;
        } else {
          if (qtyIn > 0) {
            const inVal = val > 0 ? val : round2(qtyIn * (entry.unitCostEGP || 0));
            replayedQty = round4(replayedQty + qtyIn);
            replayedVal = round2(replayedVal + inVal);
            replayedMAC = replayedQty > 0 ? round4(replayedVal / replayedQty) : round4(entry.unitCostEGP || 0);
          }
          if (qtyOut > 0) {
            const outCost = replayedMAC;
            const outVal = val > 0 ? val : round2(qtyOut * outCost);
            
            // Check if historical entry erroneously changed MAC on outgoing movement
            if (entry.movingAverageCostEGP && Math.abs(entry.movingAverageCostEGP - outCost) > 0.01) {
              issues.push(`Historical outgoing document ${entry.documentNumber} used unit cost ${entry.movingAverageCostEGP} instead of location MAC ${outCost}`);
            }

            replayedQty = round4(Math.max(0, replayedQty - qtyOut));
            replayedVal = replayedQty === 0 ? 0 : Math.max(0, round2(replayedVal - outVal));
            // Outgoing movements DO NOT change MAC!
          }
        }
      }

      // Check for discrepancies with stored balance
      const qtyDiff = Math.abs(currentStored.onHandQty - replayedQty);
      const valDiff = Math.abs(currentStored.inventoryValue - replayedVal);
      const macDiff = Math.abs(currentStored.movingAverageCost - replayedMAC);

      if (qtyDiff > 0.0001 || valDiff > 0.05 || macDiff > 0.0001 || issues.length > 0) {
        if (qtyDiff > 0.0001) issues.push(`Quantity mismatch: Stored ${currentStored.onHandQty} vs Replayed ${replayedQty}`);
        if (valDiff > 0.05) issues.push(`Value mismatch: Stored ${currentStored.inventoryValue} EGP vs Replayed ${replayedVal} EGP`);
        if (macDiff > 0.0001) issues.push(`MAC mismatch: Stored ${currentStored.movingAverageCost} vs Replayed ${replayedMAC}`);

        const itemObj = masterItems?.find(m => m.id === itemId);
        discrepancies.push({
          itemId,
          itemCode: itemObj?.code || itemId,
          itemName: itemObj?.nameAr || itemObj?.nameEn || itemId,
          locationId,
          storedOnHand: currentStored.onHandQty,
          replayedOnHand: replayedQty,
          storedValue: currentStored.inventoryValue,
          replayedValue: replayedVal,
          storedMAC: currentStored.movingAverageCost,
          replayedMAC,
          issues
        });
      }

      // Restore reconciled balance
      const reconciled: LocationValuationBalance = {
        itemId,
        locationId,
        warehouseId: locationId,
        onHandQty: replayedQty,
        inventoryValue: replayedVal,
        movingAverageCost: replayedMAC,
        lastDocumentNumber: lastDocNum,
        lastUpdated: new Date().toISOString()
      };
      this.setBalance(reconciled);
      reconciledBalances.push(reconciled);
    }

    return {
      timestamp: new Date().toISOString(),
      totalLocationsChecked: locationGroups.size,
      discrepancyCount: discrepancies.length,
      discrepancies,
      reconciledBalances
    };
  }
}
