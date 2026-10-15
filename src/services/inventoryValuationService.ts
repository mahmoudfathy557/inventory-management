/**
 * Client-Side Service for SAP Business One Inventory Movements & Valuation Engine
 */

import { SapTransactionCode, SAP_TRANSACTION_RULES, validateTransactionCostPermissions } from '../config/transactionConfig';
import { authService } from './authService';

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
  locationId: string;
  warehouseId?: string;
  destLocationId?: string;
  destWarehouseId?: string;
  
  quantity: number;
  unitPrice?: number;
  uom?: string;
  
  productionOrderId?: string;
  productionOrderNumber?: string;
  goodQuantity?: number;
  scrapQuantity?: number;
  
  landedCostAmount?: number;
  revaluationAmount?: number;
  revaluationType?: 'TOTAL_VALUE' | 'UNIT_COST';
  newUnitCost?: number;
  
  sourceDocumentType?: string;
  sourceDocumentNumber?: string;
  sourceDocumentId?: string;
  
  reference?: string;
  notes?: string;
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
  
  timestamp: string;
  message: string;
}

export interface ReconciliationReport {
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
}

export class InventoryValuationService {
  /**
   * Posts an authoritative inventory transaction through the backend valuation engine
   */
  public static async postTransaction(payload: InventoryPostingPayload): Promise<InventoryPostingResult> {
    // 1. Client-Side Defensive Check
    const validation = validateTransactionCostPermissions(payload.transactionCode, {
      unitPrice: payload.unitPrice,
      varianceQty: payload.quantity
    });
    if (!validation.allowed) {
      throw new Error(validation.reason || 'Cost permission violation');
    }

    const token = authService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/inventory/post-transaction', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMsg = `Server error ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error) {
          errorMsg = errJson.error;
        }
      } catch {}
      throw new Error(errorMsg);
    }

    return await response.json();
  }

  /**
   * Fetches authoritative Item + Location balance from backend
   */
  public static async fetchLocationBalance(itemId: string, locationId: string): Promise<LocationValuationBalance | null> {
    try {
      const response = await fetch(`/api/inventory/balances/${encodeURIComponent(itemId)}/${encodeURIComponent(locationId)}`);
      if (response.ok) {
        const json = await response.json();
        return json.balance || null;
      }
    } catch (e) {
      console.warn('Could not fetch location balance from server:', e);
    }
    return null;
  }

  /**
   * Triggers authoritative reconciliation of historical transactions
   */
  public static async runReconciliation(): Promise<{ success: boolean; report: ReconciliationReport }> {
    const token = authService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/inventory/reconcile', {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      let errorMsg = `Reconciliation failed (${response.status})`;
      try {
        const err = await response.json();
        if (err && err.error) errorMsg = err.error;
      } catch {}
      throw new Error(errorMsg);
    }

    return await response.json();
  }
}
