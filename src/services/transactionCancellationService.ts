/**
 * Comprehensive Transaction Cancellation, Reversal, and Dependency Inspection Engine
 * Conforms to SAP Business One & Egyptian Tax Authority (ETA) ERP audit standards.
 */

import {
  InventoryReceipt,
  InventoryIssue,
  InventoryTransfer,
  ProductionOrder,
  MaterialIssue,
  ProductionReceipt,
  CustomerDelivery,
  LandedCost,
  InventoryCountPosting,
  InventoryRevaluation,
  ReturnToVendor,
  ReturnFromCustomer,
  ProductionOrderCostAdjustment,
  RawMaterial,
  Product,
  Warehouse,
  ProductionOrderStatus
} from '../types';
import { round2, round4 } from '../utils/formatters';

export type TransactionActionType = 'DELETE_DRAFT' | 'CANCEL_REVERSE' | 'ALREADY_CANCELLED' | 'BLOCKED';

export interface DependentDocInfo {
  id: string;
  documentType: string;
  documentTypeAr: string;
  documentTypeEn: string;
  documentNumber: string;
  status: string;
  impactDescriptionAr: string;
  impactDescriptionEn: string;
  canCascade: boolean;
}

export interface LocationBalanceImpact {
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  
  // Before
  currentOnHand: number;
  currentValue: number;
  currentMAC: number;
  
  // Delta
  qtyDelta: number; // e.g. -10 or +10
  valueDelta: number; // e.g. -1000 or +1000
  
  // After
  postOnHand: number;
  postValue: number;
  postMAC: number;
  
  isNegativeStockRisk: boolean;
  isNegativeValueRisk: boolean;
}

export interface CancellationPreview {
  found: boolean;
  documentId: string;
  documentType: string;
  documentTypeAr: string;
  documentTypeEn: string;
  documentNumber: string;
  documentDate: string;
  currentStatus: string;
  isDraft: boolean;
  isCancelled: boolean;
  supportedAction: TransactionActionType;
  
  // Reasons & Warnings
  canExecute: boolean;
  blockingReasonsAr: string[];
  blockingReasonsEn: string[];
  warningsAr: string[];
  warningsEn: string[];
  
  // Location and Valuation impact
  primaryImpact?: LocationBalanceImpact;
  secondaryImpact?: LocationBalanceImpact; // For Transfers (destination warehouse)
  
  // Financial Summary
  transactedQty: number;
  transactedUnitCost: number;
  transactedTotalValue: number;
  
  // Dependencies
  dependencies: DependentDocInfo[];
  canCascadeAll: boolean;
  
  // Extra Business Context
  productionOrderDetails?: {
    orderNumber: string;
    status: string;
    hasIssuedMaterials: boolean;
    hasReceivedGoods: boolean;
    issuedMaterialCost: number;
    receivedGoodsQty: number;
  };
}

export interface StateContext {
  receipts: InventoryReceipt[];
  issues: InventoryIssue[];
  transfers: InventoryTransfer[];
  productionOrders: ProductionOrder[];
  materialIssues: MaterialIssue[];
  productionReceipts: ProductionReceipt[];
  customerDeliveries: CustomerDelivery[];
  landedCosts: LandedCost[];
  countPostings: InventoryCountPosting[];
  revaluations: InventoryRevaluation[];
  returnsToVendor: ReturnToVendor[];
  returnsFromCustomer: ReturnFromCustomer[];
  costAdjustments: ProductionOrderCostAdjustment[];
  rawMaterials: RawMaterial[];
  products: Product[];
  warehouses: Warehouse[];
  getItemWarehouseValuation: (itemId: string, warehouseId: string) => {
    currentQty: number;
    movingAverageCost: number;
    totalValue: number;
  };
}

export class TransactionCancellationService {
  /**
   * Inspects a document and generates a complete safety, valuation, and dependency preview
   */
  public static inspectTransaction(
    documentTypeOrIdentifier: string,
    documentNumber: string,
    ctx: StateContext
  ): CancellationPreview {
    const docNum = (documentNumber || '').trim();
    const typeKey = (documentTypeOrIdentifier || '').toLowerCase();

    // 1. Identify Document
    // Receipt / Goods Receipt PO
    if (typeKey.includes('receipt') || typeKey.includes('إضافة') || typeKey.includes('po') || typeKey.includes('rcpt')) {
      const receipt = ctx.receipts.find(r => r.receiptNumber === docNum || r.id === docNum);
      if (receipt) return this.inspectReceipt(receipt, ctx);
    }

    // Landed Cost
    if (typeKey.includes('landed') || typeKey.includes('إنزال') || typeKey.includes('lc-') || typeKey.includes('cost')) {
      const lc = ctx.landedCosts.find(l => l.landedCostNumber === docNum || l.id === docNum);
      if (lc) return this.inspectLandedCost(lc, ctx);
    }

    // Issue
    if (typeKey.includes('issue') || typeKey.includes('صرف') || typeKey.includes('iss-') || typeKey.includes('inv-iss')) {
      const issue = ctx.issues.find(i => i.issueNumber === docNum || i.id === docNum);
      if (issue) return this.inspectIssue(issue, ctx);
    }

    // Transfer
    if (typeKey.includes('transfer') || typeKey.includes('تحويل') || typeKey.includes('trf-')) {
      const trf = ctx.transfers.find(t => t.transferNumber === docNum || t.id === docNum);
      if (trf) return this.inspectTransfer(trf, ctx);
    }

    // Material Issue for Production
    if (typeKey.includes('mat-iss') || typeKey.includes('صرف إنتاج') || typeKey.includes('مادة إنتاج') || typeKey.includes('material')) {
      const mi = ctx.materialIssues.find(m => m.issueNumber === docNum || m.id === docNum);
      if (mi) return this.inspectMaterialIssue(mi, ctx);
    }

    // Production Receipt
    if (typeKey.includes('prod-rcpt') || typeKey.includes('استلام إنتاج') || typeKey.includes('pr-')) {
      const pr = ctx.productionReceipts.find(p => p.receiptNumber === docNum || p.id === docNum);
      if (pr) return this.inspectProductionReceipt(pr, ctx);
    }

    // Production Order
    if (typeKey.includes('production order') || typeKey.includes('أمر إنتاج') || typeKey.includes('po-') || typeKey.includes('order')) {
      const po = ctx.productionOrders.find(p => p.orderNumber === docNum || p.id === docNum);
      if (po) return this.inspectProductionOrder(po, ctx);
    }

    // Customer Delivery
    if (typeKey.includes('delivery') || typeKey.includes('تسليم') || typeKey.includes('del-')) {
      const del = ctx.customerDeliveries.find(d => d.deliveryNumber === docNum || d.id === docNum);
      if (del) return this.inspectCustomerDelivery(del, ctx);
    }

    // Count Posting
    if (typeKey.includes('count') || typeKey.includes('جرد') || typeKey.includes('icp-')) {
      const cp = ctx.countPostings.find(c => c.countNumber === docNum || c.id === docNum);
      if (cp) return this.inspectCountPosting(cp, ctx);
    }

    // Revaluation
    if (typeKey.includes('reval') || typeKey.includes('تقييم') || typeKey.includes('irv-')) {
      const rev = ctx.revaluations.find(r => r.revaluationNumber === docNum || r.id === docNum);
      if (rev) return this.inspectRevaluation(rev, ctx);
    }

    // Return to Vendor
    if (typeKey.includes('rtv') || typeKey.includes('مردود مورد') || typeKey.includes('return to vendor')) {
      const rtv = ctx.returnsToVendor.find(r => r.returnNumber === docNum || r.id === docNum);
      if (rtv) return this.inspectReturnToVendor(rtv, ctx);
    }

    // Return from Customer
    if (typeKey.includes('rfc') || typeKey.includes('مردود عميل') || typeKey.includes('return from customer')) {
      const rfc = ctx.returnsFromCustomer.find(r => r.returnNumber === docNum || r.id === docNum);
      if (rfc) return this.inspectReturnFromCustomer(rfc, ctx);
    }

    // Universal fallback: scan by documentNumber across all tables
    const fallbackReceipt = ctx.receipts.find(r => r.receiptNumber === docNum);
    if (fallbackReceipt) return this.inspectReceipt(fallbackReceipt, ctx);

    const fallbackIssue = ctx.issues.find(i => i.issueNumber === docNum);
    if (fallbackIssue) return this.inspectIssue(fallbackIssue, ctx);

    const fallbackTransfer = ctx.transfers.find(t => t.transferNumber === docNum);
    if (fallbackTransfer) return this.inspectTransfer(fallbackTransfer, ctx);

    const fallbackPO = ctx.productionOrders.find(p => p.orderNumber === docNum);
    if (fallbackPO) return this.inspectProductionOrder(fallbackPO, ctx);

    const fallbackDelivery = ctx.customerDeliveries.find(d => d.deliveryNumber === docNum);
    if (fallbackDelivery) return this.inspectCustomerDelivery(fallbackDelivery, ctx);

    const fallbackLC = ctx.landedCosts.find(l => l.landedCostNumber === docNum);
    if (fallbackLC) return this.inspectLandedCost(fallbackLC, ctx);

    return {
      found: false,
      documentId: '',
      documentType: documentTypeOrIdentifier,
      documentTypeAr: 'مستند غير معروف',
      documentTypeEn: 'Unknown Document',
      documentNumber: docNum,
      documentDate: '',
      currentStatus: 'NOT_FOUND',
      isDraft: false,
      isCancelled: false,
      supportedAction: 'BLOCKED',
      canExecute: false,
      blockingReasonsAr: [`لم يتم العثور على المستند برقم ${docNum}`],
      blockingReasonsEn: [`Document ${docNum} not found in current ERP state`],
      warningsAr: [],
      warningsEn: [],
      transactedQty: 0,
      transactedUnitCost: 0,
      transactedTotalValue: 0,
      dependencies: [],
      canCascadeAll: false
    };
  }

  // ==============================================================
  // 1 & 7: RECEIPT / GOODS RECEIPT PO
  // ==============================================================
  private static inspectReceipt(receipt: InventoryReceipt, ctx: StateContext): CancellationPreview {
    const isCancelled = receipt.status === 'CANCELLED';
    const isDraft = (receipt as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];
    const dependencies: DependentDocInfo[] = [];

    const effectiveQty = receipt.baseQuantity || receipt.quantity;
    const effectiveValue = receipt.totalValueEGP + (receipt.landedCostAllocatedEGP || 0);
    const targetWh = ctx.warehouses.find(w => w.id === receipt.warehouseId);
    const whStock = ctx.getItemWarehouseValuation(receipt.itemId, receipt.warehouseId);

    // Negative stock check: reversing a receipt subtracts stock
    const postOnHand = round4(whStock.currentQty - effectiveQty);
    const postValue = Math.max(0, round2(whStock.totalValue - effectiveValue));
    const postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : whStock.movingAverageCost;

    if (!isCancelled && !isDraft) {
      if (postOnHand < 0) {
        blockingReasonsAr.push(
          `لا يمكن إلغاء إذن الإضافة لأن الرصيد الحالي بالمستودع (${whStock.currentQty}) أقل من كمية الإذن (${effectiveQty}). تم استهلاك جزء من هذه الكمية بعمليات صرف أو تحويلات لاحقة.`
        );
        blockingReasonsEn.push(
          `Cannot cancel receipt: current on-hand stock (${whStock.currentQty}) is less than receipt quantity (${effectiveQty}). Part of this stock was already consumed by subsequent issues/transfers.`
        );
      }

      // Check linked Landed Costs
      const linkedLandedCosts = ctx.landedCosts.filter(
        lc => (lc.originalReceiptId === receipt.id || lc.originalReceiptNumber === receipt.receiptNumber) &&
              lc.status !== 'CANCELLED'
      );
      for (const lc of linkedLandedCosts) {
        dependencies.push({
          id: lc.id,
          documentType: 'LANDED_COST',
          documentTypeAr: 'تكلفة إنزال مرتبطة',
          documentTypeEn: 'Linked Landed Cost',
          documentNumber: lc.landedCostNumber,
          status: lc.status,
          impactDescriptionAr: `تحميل تكاليف إنزال بمبلغ ${lc.amountEGP} ج.م على هذا الإذن`,
          impactDescriptionEn: `Landed cost allocation of ${lc.amountEGP} EGP attached to this receipt`,
          canCascade: true
        });
      }

      // Check linked Vendor Returns
      const linkedReturns = ctx.returnsToVendor.filter(
        r => (r.originalReceiptId === receipt.id || r.originalReceiptNumber === receipt.receiptNumber) &&
             r.status !== 'CANCELLED'
      );
      for (const ret of linkedReturns) {
        dependencies.push({
          id: ret.id,
          documentType: 'RETURN_TO_VENDOR',
          documentTypeAr: 'مردود مورد مرتبط',
          documentTypeEn: 'Linked Vendor Return',
          documentNumber: ret.returnNumber,
          status: ret.status,
          impactDescriptionAr: `تم عمل مردودات للمورد بكمية ${ret.returnQuantity} من هذا الإذن`,
          impactDescriptionEn: `Vendor return of ${ret.returnQuantity} already recorded from this receipt`,
          canCascade: false
        });
        blockingReasonsAr.push(
          `يوجد مردود مورد نشط (${ret.returnNumber}) مرتبط بهذا الإذن. يجب إلغاء مردود المورد أولاً.`
        );
        blockingReasonsEn.push(
          `Active vendor return (${ret.returnNumber}) is linked to this receipt. Cancel the vendor return first.`
        );
      }

      if (dependencies.length > 0 && blockingReasonsAr.length === 0) {
        warningsAr.push(
          `سيتم إلغاء تكاليف الإنزال المرتبطة (${linkedLandedCosts.length} مستند) آلياً مع هذا الإذن.`
        );
        warningsEn.push(
          `Linked landed costs (${linkedLandedCosts.length} doc) will be automatically cancelled with this receipt.`
        );
      }

      if (Math.abs(whStock.movingAverageCost - postMAC) > 0.001) {
        warningsAr.push(
          `سيتم إعادة احتساب متوسط التكلفة المتحرك بالمستودع من ${whStock.movingAverageCost.toFixed(3)} إلى ${postMAC.toFixed(3)} ج.م.`
        );
        warningsEn.push(
          `Warehouse MAC will be recomputed from ${whStock.movingAverageCost.toFixed(3)} to ${postMAC.toFixed(3)} EGP.`
        );
      }
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: receipt.id,
      documentType: 'RECEIPT',
      documentTypeAr: 'إذن إضافة مخزني',
      documentTypeEn: 'Inventory Receipt',
      documentNumber: receipt.receiptNumber,
      documentDate: receipt.date,
      currentStatus: receipt.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      primaryImpact: {
        warehouseId: receipt.warehouseId,
        warehouseName: targetWh?.nameAr || receipt.warehouseId,
        itemId: receipt.itemId,
        itemCode: receipt.itemCode,
        itemName: receipt.itemName,
        uom: receipt.baseUOM || receipt.uom,
        currentOnHand: whStock.currentQty,
        currentValue: whStock.totalValue,
        currentMAC: whStock.movingAverageCost,
        qtyDelta: -effectiveQty,
        valueDelta: -effectiveValue,
        postOnHand,
        postValue,
        postMAC,
        isNegativeStockRisk: postOnHand < 0,
        isNegativeValueRisk: postValue < 0
      },
      transactedQty: effectiveQty,
      transactedUnitCost: receipt.unitPriceEGP,
      transactedTotalValue: effectiveValue,
      dependencies,
      canCascadeAll: dependencies.every(d => d.canCascade)
    };
  }

  // ==============================================================
  // 2: INVENTORY ISSUE
  // ==============================================================
  private static inspectIssue(issue: InventoryIssue, ctx: StateContext): CancellationPreview {
    const isCancelled = issue.status === 'CANCELLED';
    const isDraft = (issue as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];

    const effectiveQty = issue.baseQuantity || issue.quantity;
    const effectiveValue = issue.totalIssueValueEGP;
    const targetWh = ctx.warehouses.find(w => w.id === issue.fromWarehouseId);
    const whStock = ctx.getItemWarehouseValuation(issue.itemId, issue.fromWarehouseId);

    // Reversing an issue adds stock back at the original issue cost!
    const postOnHand = round4(whStock.currentQty + effectiveQty);
    const postValue = round2(whStock.totalValue + effectiveValue);
    const postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : issue.movingAverageCostEGP;

    if (!isCancelled && !isDraft) {
      warningsAr.push(
        `سيتم إعادة ${effectiveQty} ${issue.baseUOM || issue.uom} إلى مستودع ${targetWh?.nameAr || issue.fromWarehouseId} بسعر الصرف التاريخي (${issue.movingAverageCostEGP.toFixed(2)} ج.م).`
      );
      warningsEn.push(
        `Stock will be restored (${effectiveQty} ${issue.baseUOM || issue.uom}) to ${targetWh?.nameEn || issue.fromWarehouseId} at original historical cost (${issue.movingAverageCostEGP.toFixed(2)} EGP).`
      );
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: issue.id,
      documentType: 'ISSUE',
      documentTypeAr: 'إذن صرف مخزني',
      documentTypeEn: 'Inventory Issue',
      documentNumber: issue.issueNumber,
      documentDate: issue.date,
      currentStatus: issue.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      primaryImpact: {
        warehouseId: issue.fromWarehouseId,
        warehouseName: targetWh?.nameAr || issue.fromWarehouseId,
        itemId: issue.itemId,
        itemCode: issue.itemCode,
        itemName: issue.itemName,
        uom: issue.baseUOM || issue.uom,
        currentOnHand: whStock.currentQty,
        currentValue: whStock.totalValue,
        currentMAC: whStock.movingAverageCost,
        qtyDelta: effectiveQty,
        valueDelta: effectiveValue,
        postOnHand,
        postValue,
        postMAC,
        isNegativeStockRisk: false,
        isNegativeValueRisk: false
      },
      transactedQty: effectiveQty,
      transactedUnitCost: issue.movingAverageCostEGP,
      transactedTotalValue: effectiveValue,
      dependencies: [],
      canCascadeAll: true
    };
  }

  // ==============================================================
  // 5 & 6: INVENTORY TRANSFER (Atomic Double-Leg)
  // ==============================================================
  private static inspectTransfer(trf: InventoryTransfer, ctx: StateContext): CancellationPreview {
    const isCancelled = trf.status === 'CANCELLED';
    const isDraft = (trf as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];

    const effectiveQty = trf.baseQuantity || trf.quantity;
    const effectiveValue = trf.totalValueEGP;

    const fromWh = ctx.warehouses.find(w => w.id === trf.fromWarehouseId);
    const toWh = ctx.warehouses.find(w => w.id === trf.toWarehouseId);

    const fromStock = ctx.getItemWarehouseValuation(trf.itemId, trf.fromWarehouseId);
    const toStock = ctx.getItemWarehouseValuation(trf.itemId, trf.toWarehouseId);

    // Reversing a transfer means:
    // Dest warehouse (toWarehouseId) loses stock (-qty, -val)
    // Source warehouse (fromWarehouseId) gains stock (+qty, +val)
    const postToOnHand = round4(toStock.currentQty - effectiveQty);
    const postToValue = Math.max(0, round2(toStock.totalValue - effectiveValue));
    const postToMAC = postToOnHand > 0 ? round4(postToValue / postToOnHand) : toStock.movingAverageCost;

    const postFromOnHand = round4(fromStock.currentQty + effectiveQty);
    const postFromValue = round2(fromStock.totalValue + effectiveValue);
    const postFromMAC = postFromOnHand > 0 ? round4(postFromValue / postFromOnHand) : fromStock.movingAverageCost;

    if (!isCancelled && !isDraft) {
      if (postToOnHand < 0) {
        blockingReasonsAr.push(
          `لا يمكن إلغاء التحويل لأن المستودع المحول إليه (${toWh?.nameAr || trf.toWarehouseId}) رصيده الحالي (${toStock.currentQty}) أقل من الكمية المحولة (${effectiveQty}). تم استهلاك البضاعة أو نقلها لمكان آخر.`
        );
        blockingReasonsEn.push(
          `Cannot reverse transfer: destination warehouse (${toWh?.nameEn || trf.toWarehouseId}) current on-hand (${toStock.currentQty}) is less than transferred qty (${effectiveQty}). Stock was consumed.`
        );
      }

      warningsAr.push(
        `سيتم عكس طرفي التحويل معاً وبشكل ذري: خصم ${effectiveQty} من مستودع الاستلام (${toWh?.nameAr}) وإعادتها لمستودع الصرف (${fromWh?.nameAr}).`
      );
      warningsEn.push(
        `Both sides of the transfer will be reversed atomically: deducting ${effectiveQty} from destination (${toWh?.nameEn}) and returning to source (${fromWh?.nameEn}).`
      );
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: trf.id,
      documentType: 'TRANSFER',
      documentTypeAr: 'إذن تحويل مخزني مزدوج',
      documentTypeEn: 'Inventory Transfer (Atomic Legs)',
      documentNumber: trf.transferNumber,
      documentDate: trf.date,
      currentStatus: trf.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      // Primary impact is destination warehouse (where stock must be deducted)
      primaryImpact: {
        warehouseId: trf.toWarehouseId,
        warehouseName: toWh?.nameAr || trf.toWarehouseId,
        itemId: trf.itemId,
        itemCode: trf.itemCode,
        itemName: trf.itemName,
        uom: trf.baseUOM || trf.uom,
        currentOnHand: toStock.currentQty,
        currentValue: toStock.totalValue,
        currentMAC: toStock.movingAverageCost,
        qtyDelta: -effectiveQty,
        valueDelta: -effectiveValue,
        postOnHand: postToOnHand,
        postValue: postToValue,
        postMAC: postToMAC,
        isNegativeStockRisk: postToOnHand < 0,
        isNegativeValueRisk: postToValue < 0
      },
      // Secondary impact is source warehouse (where stock is restored)
      secondaryImpact: {
        warehouseId: trf.fromWarehouseId,
        warehouseName: fromWh?.nameAr || trf.fromWarehouseId,
        itemId: trf.itemId,
        itemCode: trf.itemCode,
        itemName: trf.itemName,
        uom: trf.baseUOM || trf.uom,
        currentOnHand: fromStock.currentQty,
        currentValue: fromStock.totalValue,
        currentMAC: fromStock.movingAverageCost,
        qtyDelta: effectiveQty,
        valueDelta: effectiveValue,
        postOnHand: postFromOnHand,
        postValue: postFromValue,
        postMAC: postFromMAC,
        isNegativeStockRisk: false,
        isNegativeValueRisk: false
      },
      transactedQty: effectiveQty,
      transactedUnitCost: trf.unitCostEGP,
      transactedTotalValue: effectiveValue,
      dependencies: [],
      canCascadeAll: true
    };
  }

  // ==============================================================
  // 8: LANDED COST
  // ==============================================================
  private static inspectLandedCost(lc: LandedCost, ctx: StateContext): CancellationPreview {
    const isCancelled = lc.status === 'CANCELLED';
    const isDraft = (lc as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];

    const parentReceipt = ctx.receipts.find(
      r => r.id === lc.originalReceiptId || r.receiptNumber === lc.originalReceiptNumber
    );

    const targetWhId = parentReceipt?.warehouseId || 'wh-raw';
    const targetWh = ctx.warehouses.find(w => w.id === targetWhId);
    const whStock = ctx.getItemWarehouseValuation(lc.itemId, targetWhId);

    // Reversing landed cost removes value WITHOUT moving physical quantity!
    const postOnHand = whStock.currentQty; // No quantity change
    const postValue = Math.max(0, round2(whStock.totalValue - lc.amountEGP));
    const postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : whStock.movingAverageCost;

    if (!isCancelled && !isDraft) {
      if (postValue < 0) {
        blockingReasonsAr.push('قيمة المخزون الناتجة عن عكس مصروف الإنزال ستكون سالبة.');
        blockingReasonsEn.push('Inventory valuation resulting from landed cost reversal would become negative.');
      }

      warningsAr.push(
        `تعديل مالي فقط: سيتم خفض قيمة المخزون بمبلغ ${lc.amountEGP.toFixed(2)} ج.م وتعديل متوسط التكلفة من ${whStock.movingAverageCost.toFixed(3)} إلى ${postMAC.toFixed(3)} ج.م دون التأثير على الكمية (${whStock.currentQty}).`
      );
      warningsEn.push(
        `Financial adjustment only: inventory value will be reduced by ${lc.amountEGP.toFixed(2)} EGP, updating MAC from ${whStock.movingAverageCost.toFixed(3)} to ${postMAC.toFixed(3)} EGP with zero quantity change.`
      );
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: lc.id,
      documentType: 'LANDED_COST',
      documentTypeAr: 'تكلفة إنزال ومصاريف شحن',
      documentTypeEn: 'Landed Cost Adjustment',
      documentNumber: lc.landedCostNumber,
      documentDate: lc.date,
      currentStatus: lc.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      primaryImpact: {
        warehouseId: targetWhId,
        warehouseName: targetWh?.nameAr || targetWhId,
        itemId: lc.itemId,
        itemCode: parentReceipt?.itemCode || lc.itemId,
        itemName: lc.itemName,
        uom: parentReceipt?.baseUOM || 'KG',
        currentOnHand: whStock.currentQty,
        currentValue: whStock.totalValue,
        currentMAC: whStock.movingAverageCost,
        qtyDelta: 0,
        valueDelta: -lc.amountEGP,
        postOnHand,
        postValue,
        postMAC,
        isNegativeStockRisk: false,
        isNegativeValueRisk: postValue < 0
      },
      transactedQty: 0,
      transactedUnitCost: 0,
      transactedTotalValue: lc.amountEGP,
      dependencies: parentReceipt ? [{
        id: parentReceipt.id,
        documentType: 'RECEIPT',
        documentTypeAr: 'إذن الإضافة الأصلي',
        documentTypeEn: 'Original Receipt',
        documentNumber: parentReceipt.receiptNumber,
        status: parentReceipt.status,
        impactDescriptionAr: `سيتم إزالة تخصيص تكلفة الإنزال من إذن الإضافة الأصلي`,
        impactDescriptionEn: `Landed cost allocation will be cleared from original receipt`,
        canCascade: false
      }] : [],
      canCascadeAll: true
    };
  }

  // ==============================================================
  // 4: ISSUED FOR PRODUCTION (Material Issue)
  // ==============================================================
  private static inspectMaterialIssue(mi: MaterialIssue, ctx: StateContext): CancellationPreview {
    const isCancelled = mi.status === 'CANCELLED';
    const isDraft = (mi as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];
    const dependencies: DependentDocInfo[] = [];

    const effectiveQty = mi.baseQuantity || mi.actualQuantity;
    const effectiveValue = mi.totalActualCostEGP;
    const targetWh = ctx.warehouses.find(w => w.id === mi.warehouseId);
    const whStock = ctx.getItemWarehouseValuation(mi.rawMaterialId, mi.warehouseId);

    // Reversing material issue returns raw materials back to warehouse!
    const postOnHand = round4(whStock.currentQty + effectiveQty);
    const postValue = round2(whStock.totalValue + effectiveValue);
    const postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : mi.movingAverageCostEGP;

    // Check if dependent finished goods receipts rely on this cost!
    const parentPO = ctx.productionOrders.find(
      po => po.id === mi.productionOrderId || po.orderNumber === mi.productionOrderNumber
    );

    const linkedReceipts = ctx.productionReceipts.filter(
      pr => (pr.productionOrderId === mi.productionOrderId || pr.productionOrderNumber === mi.productionOrderNumber) &&
            pr.status !== 'CANCELLED'
    );

    if (!isCancelled && !isDraft) {
      if (linkedReceipts.length > 0) {
        blockingReasonsAr.push(
          `لا يمكن إلغاء صرف المواد لأن أمر الإنتاج (${mi.productionOrderNumber}) تم استلام منتجات تامة الصنع منه (${linkedReceipts.length} إذن استلام). رسملة تكلفة المنتج التام تعتمد على المواد المنصرفة. يجب إلغاء استلامات الإنتاج التام أولاً.`
        );
        blockingReasonsEn.push(
          `Cannot cancel material issue: production order (${mi.productionOrderNumber}) has active finished product receipts (${linkedReceipts.length} receipts). Finished goods capitalization relies on issued materials. Cancel finished goods receipts first.`
        );

        for (const pr of linkedReceipts) {
          dependencies.push({
            id: pr.id,
            documentType: 'PRODUCTION_RECEIPT',
            documentTypeAr: 'إذن استلام إنتاج تام مرتبط',
            documentTypeEn: 'Dependent Finished Goods Receipt',
            documentNumber: pr.receiptNumber,
            status: pr.status,
            impactDescriptionAr: `استلام ${pr.finishedQuantity} ${pr.uom} بتكلفة معتمدة على هذه المادة`,
            impactDescriptionEn: `Receipt of ${pr.finishedQuantity} ${pr.uom} capitalized against this issue`,
            canCascade: false
          });
        }
      }

      warningsAr.push(
        `سيتم إعادة كمية ${effectiveQty} ${mi.baseUOM || mi.uom} من مادة ${mi.rawMaterialName} إلى مستودع ${targetWh?.nameAr || mi.warehouseId} بسعر ${mi.movingAverageCostEGP.toFixed(2)} ج.م.`
      );
      warningsEn.push(
        `Raw material ${mi.rawMaterialName} (${effectiveQty} ${mi.baseUOM || mi.uom}) will be returned to warehouse ${targetWh?.nameEn || mi.warehouseId} at cost ${mi.movingAverageCostEGP.toFixed(2)} EGP.`
      );
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: mi.id,
      documentType: 'MATERIAL_ISSUE_PRODUCTION',
      documentTypeAr: 'إذن صرف مواد للتشغيل',
      documentTypeEn: 'Material Issue For Production',
      documentNumber: mi.issueNumber,
      documentDate: mi.date,
      currentStatus: mi.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      primaryImpact: {
        warehouseId: mi.warehouseId,
        warehouseName: targetWh?.nameAr || mi.warehouseId,
        itemId: mi.rawMaterialId,
        itemCode: mi.rawMaterialCode,
        itemName: mi.rawMaterialName,
        uom: mi.baseUOM || mi.uom,
        currentOnHand: whStock.currentQty,
        currentValue: whStock.totalValue,
        currentMAC: whStock.movingAverageCost,
        qtyDelta: effectiveQty,
        valueDelta: effectiveValue,
        postOnHand,
        postValue,
        postMAC,
        isNegativeStockRisk: false,
        isNegativeValueRisk: false
      },
      transactedQty: effectiveQty,
      transactedUnitCost: mi.movingAverageCostEGP,
      transactedTotalValue: effectiveValue,
      dependencies,
      canCascadeAll: false,
      productionOrderDetails: parentPO ? {
        orderNumber: parentPO.orderNumber,
        status: parentPO.status,
        hasIssuedMaterials: true,
        hasReceivedGoods: linkedReceipts.length > 0,
        issuedMaterialCost: parentPO.actualMaterialCostEGP,
        receivedGoodsQty: parentPO.actualFinishedQuantity
      } : undefined
    };
  }

  // ==============================================================
  // 3: RECEIPT FROM PRODUCTION
  // ==============================================================
  private static inspectProductionReceipt(pr: ProductionReceipt, ctx: StateContext): CancellationPreview {
    const isCancelled = pr.status === 'CANCELLED';
    const isDraft = (pr as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];
    const dependencies: DependentDocInfo[] = [];

    const effectiveQty = pr.baseQuantity || pr.finishedQuantity;
    const effectiveValue = pr.totalMaterialCostEGP;
    const targetWh = ctx.warehouses.find(w => w.id === pr.finishedGoodsWarehouseId);
    const whStock = ctx.getItemWarehouseValuation(pr.productId, pr.finishedGoodsWarehouseId);

    // Reversing production receipt deducts finished product from FG warehouse
    const postOnHand = round4(whStock.currentQty - effectiveQty);
    const postValue = Math.max(0, round2(whStock.totalValue - effectiveValue));
    const postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : whStock.movingAverageCost;

    if (!isCancelled && !isDraft) {
      if (postOnHand < 0) {
        blockingReasonsAr.push(
          `لا يمكن إلغاء استلام الإنتاج لأن رصيد المنتج التام الحالي بمستودع (${targetWh?.nameAr || pr.finishedGoodsWarehouseId}) هو (${whStock.currentQty}) أقل من الكمية المستلمة (${effectiveQty}). تم تسليم المنتجات للعملاء.`
        );
        blockingReasonsEn.push(
          `Cannot cancel production receipt: current finished product stock (${whStock.currentQty}) is less than received qty (${effectiveQty}). Products were already delivered to customers.`
        );
      }

      // Check Customer Deliveries for this product
      const deliveries = ctx.customerDeliveries.filter(
        d => d.productId === pr.productId && d.status !== 'CANCELLED'
      );
      if (deliveries.length > 0 && whStock.currentQty < effectiveQty) {
        for (const d of deliveries.slice(0, 3)) {
          dependencies.push({
            id: d.id,
            documentType: 'CUSTOMER_DELIVERY',
            documentTypeAr: 'إذن تسليم عميل لاحق',
            documentTypeEn: 'Subsequent Customer Delivery',
            documentNumber: d.deliveryNumber,
            status: d.status,
            impactDescriptionAr: `تسليم كمية ${d.quantity} للعميل ${d.customerName}`,
            impactDescriptionEn: `Delivery of ${d.quantity} to ${d.customerName}`,
            canCascade: false
          });
        }
      }

      warningsAr.push(
        `تأكيد مبدأ التكلفة: كميات الهالك (Scrap: ${pr.scrapQuantity}) قيمتها صفرية دائماً ولا تتأثر بالعكس. سيتم إعادة أمر الإنتاج لحالة قيد التشغيل (IN_PROGRESS).`
      );
      warningsEn.push(
        `Scrap (${pr.scrapQuantity}) has 0 inventory value and remains unaffected. Production order will revert to IN_PROGRESS status.`
      );
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: pr.id,
      documentType: 'PRODUCTION_RECEIPT',
      documentTypeAr: 'إذن استلام إنتاج تام',
      documentTypeEn: 'Finished Goods Production Receipt',
      documentNumber: pr.receiptNumber,
      documentDate: pr.date,
      currentStatus: pr.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      primaryImpact: {
        warehouseId: pr.finishedGoodsWarehouseId,
        warehouseName: targetWh?.nameAr || pr.finishedGoodsWarehouseId,
        itemId: pr.productId,
        itemCode: pr.productCode,
        itemName: pr.productName,
        uom: pr.baseUOM || pr.uom,
        currentOnHand: whStock.currentQty,
        currentValue: whStock.totalValue,
        currentMAC: whStock.movingAverageCost,
        qtyDelta: -effectiveQty,
        valueDelta: -effectiveValue,
        postOnHand,
        postValue,
        postMAC,
        isNegativeStockRisk: postOnHand < 0,
        isNegativeValueRisk: postValue < 0
      },
      transactedQty: effectiveQty,
      transactedUnitCost: pr.finishedGoodsUnitCostEGP,
      transactedTotalValue: effectiveValue,
      dependencies,
      canCascadeAll: false
    };
  }

  // ==============================================================
  // PRODUCTION ORDER
  // ==============================================================
  private static inspectProductionOrder(po: ProductionOrder, ctx: StateContext): CancellationPreview {
    const isCancelled = po.status === ProductionOrderStatus.CANCELLED;
    const isDraft = po.status === ProductionOrderStatus.DRAFT;
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];
    const dependencies: DependentDocInfo[] = [];

    // Find linked material issues
    const issues = ctx.materialIssues.filter(
      mi => (mi.productionOrderId === po.id || mi.productionOrderNumber === po.orderNumber) &&
            mi.status !== 'CANCELLED'
    );
    for (const mi of issues) {
      dependencies.push({
        id: mi.id,
        documentType: 'MATERIAL_ISSUE_PRODUCTION',
        documentTypeAr: 'صرف مواد مرتبط',
        documentTypeEn: 'Linked Material Issue',
        documentNumber: mi.issueNumber,
        status: mi.status,
        impactDescriptionAr: `صرف ${mi.actualQuantity} ${mi.uom} من مادة ${mi.rawMaterialName}`,
        impactDescriptionEn: `Issued ${mi.actualQuantity} ${mi.uom} of ${mi.rawMaterialName}`,
        canCascade: true
      });
    }

    // Find linked production receipts
    const receipts = ctx.productionReceipts.filter(
      pr => (pr.productionOrderId === po.id || pr.productionOrderNumber === po.orderNumber) &&
            pr.status !== 'CANCELLED'
    );
    for (const pr of receipts) {
      dependencies.push({
        id: pr.id,
        documentType: 'PRODUCTION_RECEIPT',
        documentTypeAr: 'استلام إنتاج مرتبط',
        documentTypeEn: 'Linked Production Receipt',
        documentNumber: pr.receiptNumber,
        status: pr.status,
        impactDescriptionAr: `استلام ${pr.finishedQuantity} ${pr.uom} من المنتج التام`,
        impactDescriptionEn: `Received ${pr.finishedQuantity} ${pr.uom} finished product`,
        canCascade: true
      });
    }

    if (!isCancelled && !isDraft) {
      if (receipts.length > 0) {
        // Must check if finished products are still on hand
        for (const pr of receipts) {
          const fgStock = ctx.getItemWarehouseValuation(pr.productId, pr.finishedGoodsWarehouseId);
          if (fgStock.currentQty < pr.finishedQuantity) {
            blockingReasonsAr.push(
              `لا يمكن إلغاء أمر الإنتاج تلقائياً: المنتجات المستلمة (${pr.receiptNumber}) تم تسليمها أو استهلاكها والرصيد الحالي بالمستودع (${fgStock.currentQty}) غير كافٍ لعكس الاستلام (${pr.finishedQuantity}).`
            );
            blockingReasonsEn.push(
              `Cannot auto-cancel production order: finished goods from receipt (${pr.receiptNumber}) were consumed or delivered. On-hand (${fgStock.currentQty}) is less than (${pr.finishedQuantity}).`
            );
          }
        }
      }

      if (dependencies.length > 0) {
        warningsAr.push(
          `أمر الإنتاج يحتوي على ${issues.length} إذن صرف مواد و${receipts.length} إذن استلام منتج تام. سيتم فحص وعكس كافة القيود المرتبطة بأمان بالتتابع.`
        );
        warningsEn.push(
          `Production order has ${issues.length} material issue(s) and ${receipts.length} receipt(s). All linked entries will be safely reversed in sequence.`
        );
      }
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: po.id,
      documentType: 'PRODUCTION_ORDER',
      documentTypeAr: 'أمر تشغيل وإنتاج',
      documentTypeEn: 'Production Order',
      documentNumber: po.orderNumber,
      documentDate: po.productionDate,
      currentStatus: po.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      transactedQty: po.plannedQuantity,
      transactedUnitCost: po.finishedGoodsUnitCostEGP,
      transactedTotalValue: po.totalProductionCostEGP,
      dependencies,
      canCascadeAll: blockingReasonsAr.length === 0,
      productionOrderDetails: {
        orderNumber: po.orderNumber,
        status: po.status,
        hasIssuedMaterials: issues.length > 0,
        hasReceivedGoods: receipts.length > 0,
        issuedMaterialCost: po.actualMaterialCostEGP,
        receivedGoodsQty: po.actualFinishedQuantity
      }
    };
  }

  // ==============================================================
  // 11: CUSTOMER DELIVERY
  // ==============================================================
  private static inspectCustomerDelivery(d: CustomerDelivery, ctx: StateContext): CancellationPreview {
    const isCancelled = d.status === 'CANCELLED';
    const isDraft = (d as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];
    const dependencies: DependentDocInfo[] = [];

    const effectiveQty = d.baseQuantity || d.quantity;
    const effectiveValue = d.totalDeliveryValueEGP;
    const targetWh = ctx.warehouses.find(w => w.id === d.warehouseId);
    const whStock = ctx.getItemWarehouseValuation(d.productId, d.warehouseId);

    // Reversing customer delivery restores finished goods to warehouse at historical delivery COGS cost
    const postOnHand = round4(whStock.currentQty + effectiveQty);
    const postValue = round2(whStock.totalValue + effectiveValue);
    const postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : d.movingAverageCostEGP;

    // Check linked Customer Returns
    const linkedReturns = ctx.returnsFromCustomer.filter(
      r => (r.originalDeliveryId === d.id || r.originalDeliveryNumber === d.deliveryNumber) &&
           r.status !== 'CANCELLED'
    );
    for (const rfc of linkedReturns) {
      dependencies.push({
        id: rfc.id,
        documentType: 'RETURN_FROM_CUSTOMER',
        documentTypeAr: 'مردود عميل مرتبط',
        documentTypeEn: 'Linked Customer Return',
        documentNumber: rfc.returnNumber,
        status: rfc.status,
        impactDescriptionAr: `تم إرجاع كمية ${rfc.returnQuantity} من هذا التسليم مسبقاً`,
        impactDescriptionEn: `Customer return of ${rfc.returnQuantity} already recorded from this delivery`,
        canCascade: false
      });
      blockingReasonsAr.push(
        `يوجد مردود مبيعات نشط (${rfc.returnNumber}) مرتبط بإذن التسليم هذا. يجب إلغاء مردود المبيعات أولاً لتفادي تكرار إرجاع المخزون.`
      );
      blockingReasonsEn.push(
        `Active sales return (${rfc.returnNumber}) exists for this delivery. Cancel the return first to prevent duplicate inventory entry.`
      );
    }

    if (!isCancelled && !isDraft) {
      warningsAr.push(
        `سيتم إلغاء قيد تكلفة البضاعة المباعة (COGS) وإعادة ${effectiveQty} ${d.baseUOM || d.uom} لمستودع ${targetWh?.nameAr || d.warehouseId} بسعر التكلفة التاريخي (${d.movingAverageCostEGP.toFixed(2)} ج.م).`
      );
      warningsEn.push(
        `COGS entry will be reversed, restoring ${effectiveQty} ${d.baseUOM || d.uom} to warehouse ${targetWh?.nameEn || d.warehouseId} at historical delivery cost (${d.movingAverageCostEGP.toFixed(2)} EGP).`
      );
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: d.id,
      documentType: 'CUSTOMER_DELIVERY',
      documentTypeAr: 'إذن تسليم عميل (مبيعات)',
      documentTypeEn: 'Customer Delivery (Sales)',
      documentNumber: d.deliveryNumber,
      documentDate: d.date,
      currentStatus: d.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      primaryImpact: {
        warehouseId: d.warehouseId,
        warehouseName: targetWh?.nameAr || d.warehouseId,
        itemId: d.productId,
        itemCode: d.productCode,
        itemName: d.productName,
        uom: d.baseUOM || d.uom,
        currentOnHand: whStock.currentQty,
        currentValue: whStock.totalValue,
        currentMAC: whStock.movingAverageCost,
        qtyDelta: effectiveQty,
        valueDelta: effectiveValue,
        postOnHand,
        postValue,
        postMAC,
        isNegativeStockRisk: false,
        isNegativeValueRisk: false
      },
      transactedQty: effectiveQty,
      transactedUnitCost: d.movingAverageCostEGP,
      transactedTotalValue: effectiveValue,
      dependencies,
      canCascadeAll: dependencies.length === 0
    };
  }

  // ==============================================================
  // 9: COUNT POSTING (Variance settlement)
  // ==============================================================
  private static inspectCountPosting(cp: InventoryCountPosting, ctx: StateContext): CancellationPreview {
    const isCancelled = cp.status === 'CANCELLED';
    const isDraft = (cp as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];

    const targetWh = ctx.warehouses.find(w => w.id === cp.warehouseId);
    const whStock = ctx.getItemWarehouseValuation(cp.itemId, cp.warehouseId);
    const variance = cp.varianceQuantity;
    const value = Math.abs(cp.totalAdjustmentValueEGP);

    // Reversing count posting inverts variance:
    // If original variance was positive (+5), reversal subtracts (-5)
    // If original variance was negative (-5), reversal adds (+5)
    const qtyDelta = -variance;
    const valueDelta = variance > 0 ? -value : value;

    const postOnHand = round4(whStock.currentQty + qtyDelta);
    const postValue = Math.max(0, round2(whStock.totalValue + valueDelta));
    const postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : whStock.movingAverageCost;

    if (!isCancelled && !isDraft) {
      if (postOnHand < 0) {
        blockingReasonsAr.push(
          `لا يمكن إلغاء تسوية الجرد: الرصيد الحالي (${whStock.currentQty}) أقل من كمية الزيادة المحتسبة بالجرد (${variance}).`
        );
        blockingReasonsEn.push(
          `Cannot reverse count posting: on-hand stock (${whStock.currentQty}) is less than count surplus (${variance}).`
        );
      }

      warningsAr.push(
        `سيتم عكس تسوية الجرد وإرجاع الكمية الدفترية الأصلية (${cp.bookQuantity} ${cp.uom}).`
      );
      warningsEn.push(
        `Count adjustment will be reversed, restoring original book quantity (${cp.bookQuantity} ${cp.uom}).`
      );
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: cp.id,
      documentType: 'COUNT_POSTING',
      documentTypeAr: 'تسوية جرد فعلي',
      documentTypeEn: 'Physical Count Posting',
      documentNumber: cp.countNumber,
      documentDate: cp.date,
      currentStatus: cp.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      primaryImpact: {
        warehouseId: cp.warehouseId,
        warehouseName: targetWh?.nameAr || cp.warehouseId,
        itemId: cp.itemId,
        itemCode: cp.itemCode,
        itemName: cp.itemName,
        uom: cp.uom,
        currentOnHand: whStock.currentQty,
        currentValue: whStock.totalValue,
        currentMAC: whStock.movingAverageCost,
        qtyDelta,
        valueDelta,
        postOnHand,
        postValue,
        postMAC,
        isNegativeStockRisk: postOnHand < 0,
        isNegativeValueRisk: postValue < 0
      },
      transactedQty: Math.abs(variance),
      transactedUnitCost: cp.unitCostEGP,
      transactedTotalValue: value,
      dependencies: [],
      canCascadeAll: true
    };
  }

  // ==============================================================
  // 10: INVENTORY REVALUATION (Value adjustment)
  // ==============================================================
  private static inspectRevaluation(rev: InventoryRevaluation, ctx: StateContext): CancellationPreview {
    const isCancelled = rev.status === 'CANCELLED';
    const isDraft = (rev as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];

    const targetWh = ctx.warehouses.find(w => w.id === rev.warehouseId);
    const whStock = ctx.getItemWarehouseValuation(rev.itemId, rev.warehouseId);

    // Reversing revaluation inverts the adjustment amount:
    const valueDelta = -rev.adjustmentAmountEGP;
    const postOnHand = whStock.currentQty; // No quantity change
    const postValue = Math.max(0, round2(whStock.totalValue + valueDelta));
    const postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : rev.currentMACEGP;

    if (!isCancelled && !isDraft) {
      if (postValue < 0) {
        blockingReasonsAr.push('إلغاء إعادة التقييم سيؤدي لقيمة مخزون سالبة.');
        blockingReasonsEn.push('Reversing revaluation would cause negative inventory value.');
      }
      warningsAr.push(
        `تعديل مالي: سيتم إرجاع قيمة المخزون إلى ما قبل التقييم (${rev.currentValueEGP.toFixed(2)} ج.م) ومتوسط التكلفة إلى (${rev.currentMACEGP.toFixed(3)} ج.م).`
      );
      warningsEn.push(
        `Financial adjustment: inventory value will revert to pre-revaluation (${rev.currentValueEGP.toFixed(2)} EGP) and MAC to (${rev.currentMACEGP.toFixed(3)} EGP).`
      );
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: rev.id,
      documentType: 'REVALUATION',
      documentTypeAr: 'إعادة تقييم المخزون',
      documentTypeEn: 'Inventory Revaluation',
      documentNumber: rev.revaluationNumber,
      documentDate: rev.date,
      currentStatus: rev.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      primaryImpact: {
        warehouseId: rev.warehouseId,
        warehouseName: targetWh?.nameAr || rev.warehouseId,
        itemId: rev.itemId,
        itemCode: rev.itemCode,
        itemName: rev.itemName,
        uom: 'UOM',
        currentOnHand: whStock.currentQty,
        currentValue: whStock.totalValue,
        currentMAC: whStock.movingAverageCost,
        qtyDelta: 0,
        valueDelta,
        postOnHand,
        postValue,
        postMAC,
        isNegativeStockRisk: false,
        isNegativeValueRisk: postValue < 0
      },
      transactedQty: 0,
      transactedUnitCost: 0,
      transactedTotalValue: Math.abs(rev.adjustmentAmountEGP),
      dependencies: [],
      canCascadeAll: true
    };
  }

  // ==============================================================
  // 12: RETURN TO VENDOR
  // ==============================================================
  private static inspectReturnToVendor(rtv: ReturnToVendor, ctx: StateContext): CancellationPreview {
    const isCancelled = rtv.status === 'CANCELLED';
    const isDraft = (rtv as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];

    const effectiveQty = rtv.returnQuantity;
    const effectiveValue = rtv.totalReturnValueEGP;
    const targetWh = ctx.warehouses.find(w => w.id === rtv.warehouseId);
    const whStock = ctx.getItemWarehouseValuation(rtv.itemId, rtv.warehouseId);

    // Reversing a vendor return brings the stock back to the warehouse!
    const postOnHand = round4(whStock.currentQty + effectiveQty);
    const postValue = round2(whStock.totalValue + effectiveValue);
    const postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : rtv.unitCostEGP;

    if (!isCancelled && !isDraft) {
      warningsAr.push(
        `سيتم عكس مردود المورد وإعادة ${effectiveQty} ${rtv.uom} للمستودع وإعادة فتح رصيد الإذن الأصلي (${rtv.originalReceiptNumber}).`
      );
      warningsEn.push(
        `Vendor return will be reversed, restoring ${effectiveQty} ${rtv.uom} to warehouse and updating original receipt returnable balance.`
      );
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: rtv.id,
      documentType: 'RETURN_TO_VENDOR',
      documentTypeAr: 'مردودات موردين',
      documentTypeEn: 'Return to Vendor',
      documentNumber: rtv.returnNumber,
      documentDate: rtv.date,
      currentStatus: rtv.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      primaryImpact: {
        warehouseId: rtv.warehouseId,
        warehouseName: targetWh?.nameAr || rtv.warehouseId,
        itemId: rtv.itemId,
        itemCode: rtv.itemCode,
        itemName: rtv.itemName,
        uom: rtv.uom,
        currentOnHand: whStock.currentQty,
        currentValue: whStock.totalValue,
        currentMAC: whStock.movingAverageCost,
        qtyDelta: effectiveQty,
        valueDelta: effectiveValue,
        postOnHand,
        postValue,
        postMAC,
        isNegativeStockRisk: false,
        isNegativeValueRisk: false
      },
      transactedQty: effectiveQty,
      transactedUnitCost: rtv.unitCostEGP,
      transactedTotalValue: effectiveValue,
      dependencies: [],
      canCascadeAll: true
    };
  }

  // ==============================================================
  // 13: RETURN FROM CUSTOMER
  // ==============================================================
  private static inspectReturnFromCustomer(rfc: ReturnFromCustomer, ctx: StateContext): CancellationPreview {
    const isCancelled = rfc.status === 'CANCELLED';
    const isDraft = (rfc as any).status === 'DRAFT';
    const blockingReasonsAr: string[] = [];
    const blockingReasonsEn: string[] = [];
    const warningsAr: string[] = [];
    const warningsEn: string[] = [];

    const effectiveQty = rfc.returnQuantity;
    const effectiveValue = rfc.totalReturnValueEGP;
    const targetWh = ctx.warehouses.find(w => w.id === rfc.warehouseId);
    const whStock = ctx.getItemWarehouseValuation(rfc.productId, rfc.warehouseId);

    // Reversing customer return removes the returned goods from warehouse
    const postOnHand = round4(whStock.currentQty - effectiveQty);
    const postValue = Math.max(0, round2(whStock.totalValue - effectiveValue));
    const postMAC = postOnHand > 0 ? round4(postValue / postOnHand) : whStock.movingAverageCost;

    if (!isCancelled && !isDraft) {
      if (postOnHand < 0) {
        blockingReasonsAr.push(
          `لا يمكن إلغاء مردود العميل لأن الكمية المرتجعة تم بيعها أو صرفها بالفعل. الرصيد الحالي بالمستودع (${whStock.currentQty}) أقل من كمية المردود (${effectiveQty}).`
        );
        blockingReasonsEn.push(
          `Cannot reverse customer return: returned goods were already re-issued or sold. On-hand (${whStock.currentQty}) is less than return qty (${effectiveQty}).`
        );
      }

      warningsAr.push(
        `سيتم عكس استلام المردود وخصم ${effectiveQty} ${rfc.uom} من رصيد المنتج التام.`
      );
      warningsEn.push(
        `Customer return receipt will be reversed, deducting ${effectiveQty} ${rfc.uom} from finished goods stock.`
      );
    }

    const canExecute = !isCancelled && blockingReasonsAr.length === 0;

    return {
      found: true,
      documentId: rfc.id,
      documentType: 'RETURN_FROM_CUSTOMER',
      documentTypeAr: 'مردودات عملاء',
      documentTypeEn: 'Return from Customer',
      documentNumber: rfc.returnNumber,
      documentDate: rfc.date,
      currentStatus: rfc.status,
      isDraft,
      isCancelled,
      supportedAction: isDraft ? 'DELETE_DRAFT' : (isCancelled ? 'ALREADY_CANCELLED' : (canExecute ? 'CANCEL_REVERSE' : 'BLOCKED')),
      canExecute,
      blockingReasonsAr,
      blockingReasonsEn,
      warningsAr,
      warningsEn,
      primaryImpact: {
        warehouseId: rfc.warehouseId,
        warehouseName: targetWh?.nameAr || rfc.warehouseId,
        itemId: rfc.productId,
        itemCode: rfc.productCode,
        itemName: rfc.productName,
        uom: rfc.uom,
        currentOnHand: whStock.currentQty,
        currentValue: whStock.totalValue,
        currentMAC: whStock.movingAverageCost,
        qtyDelta: -effectiveQty,
        valueDelta: -effectiveValue,
        postOnHand,
        postValue,
        postMAC,
        isNegativeStockRisk: postOnHand < 0,
        isNegativeValueRisk: postValue < 0
      },
      transactedQty: effectiveQty,
      transactedUnitCost: rfc.unitCostEGP,
      transactedTotalValue: effectiveValue,
      dependencies: [],
      canCascadeAll: true
    };
  }
}
