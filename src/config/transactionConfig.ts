/**
 * Centralized SAP Business One Transaction Configuration & Editing Rules
 * Defines authoritative rules for all 13 inventory transaction types:
 * - Field editability (quantity, unit price, location, source doc)
 * - Costing calculation method (incoming manual vs outgoing automatic MAC)
 * - Validation constraints
 */

export enum SapTransactionCode {
  RECEIPT = 1,
  ISSUE = 2,
  RECEIPT_FROM_PRODUCTION = 3,
  ISSUE_FOR_PRODUCTION = 4,
  TRANSFER_OUT = 5,
  TRANSFER_IN = 6,
  GOODS_RECEIPT_PO = 7,
  LANDED_COST = 8,
  COUNT_POSTING = 9,
  REVALUATION = 10,
  CUSTOMER_DELIVERY = 11,
  RETURN_TO_VENDOR = 12,
  RETURN_FROM_CUSTOMER = 13,
}

export type ValuationDirection = 'INCOMING' | 'OUTGOING' | 'TRANSFER' | 'VALUATION_ONLY';

export interface SapTransactionRule {
  code: SapTransactionCode;
  typeKey: string;
  nameAr: string;
  nameEn: string;
  direction: ValuationDirection;
  
  // Field Editability Rules
  isQuantityEditable: boolean;
  isUnitPriceEditable: boolean; // STRICTLY false for outgoing/transfers/production/returns
  isLocationRequired: boolean;
  isDestinationLocationRequired: boolean;
  requiresSourceDocument: boolean;
  sourceDocumentType?: 'PRODUCTION_ORDER' | 'GOODS_RECEIPT_PO' | 'CUSTOMER_DELIVERY' | 'PURCHASE_RECEIPT';
  
  // Costing & Valuation Principles
  costBasis: 'MANUAL_ENTRY' | 'LOCATION_MAC' | 'PRODUCTION_ACTUAL_COST' | 'SOURCE_LOCATION_MAC' | 'ORIGINAL_RECEIPT_COST' | 'ORIGINAL_DELIVERY_COST' | 'ZERO_SCRAP';
  descriptionAr: string;
  descriptionEn: string;
}

export const SAP_TRANSACTION_RULES: Record<SapTransactionCode, SapTransactionRule> = {
  [SapTransactionCode.RECEIPT]: {
    code: SapTransactionCode.RECEIPT,
    typeKey: 'RECEIPT',
    nameAr: 'استلام مخزني عام (Receipt)',
    nameEn: 'General Receipt',
    direction: 'INCOMING',
    isQuantityEditable: true,
    isUnitPriceEditable: true, // Editable because it is an incoming purchase/receipt
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: false,
    costBasis: 'MANUAL_ENTRY',
    descriptionAr: 'توريد مخزني عام. يُدخل المستخدم الكمية وسعر الوحدة. يعاد احتساب متوسط التكلفة لموقع التخزين المختار.',
    descriptionEn: 'General incoming receipt. User inputs qty and unit price. System updates qty, inventory value and recalculates location MAC.'
  },
  [SapTransactionCode.ISSUE]: {
    code: SapTransactionCode.ISSUE,
    typeKey: 'ISSUE',
    nameAr: 'صرف مخزني عام (Issued)',
    nameEn: 'General Issue',
    direction: 'OUTGOING',
    isQuantityEditable: true,
    isUnitPriceEditable: false, // STRICTLY READ-ONLY & LOCKED
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: false,
    costBasis: 'LOCATION_MAC',
    descriptionAr: 'صرف مخزني عام. التكلفة مقفلة تماماً وتُحتسب آلياً من متوسط تكلفة الموقع المختار لحظة الصرف.',
    descriptionEn: 'General inventory issue. Unit cost is locked and automatically retrieved from current location MAC before posting.'
  },
  [SapTransactionCode.RECEIPT_FROM_PRODUCTION]: {
    code: SapTransactionCode.RECEIPT_FROM_PRODUCTION,
    typeKey: 'RECEIPT_FROM_PRODUCTION',
    nameAr: 'استلام من الإنتاج (Receipt From Production)',
    nameEn: 'Receipt From Production',
    direction: 'INCOMING',
    isQuantityEditable: true,
    isUnitPriceEditable: false, // Calculated from actual production material cost pool
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: true,
    sourceDocumentType: 'PRODUCTION_ORDER',
    costBasis: 'PRODUCTION_ACTUAL_COST',
    descriptionAr: 'استلام منتج تام من أمر إنتاج. تُجمع تكاليف الصرف الفعلية المرتبطة بالأمر وتُوزع حصراً على المنتج الجيد. الهالك يقيم بقيمة 0 ج.م.',
    descriptionEn: 'Finished goods receipt from Production Order. Allocates actual posted material issue cost pool to good finished units only. Scrap value = 0.'
  },
  [SapTransactionCode.ISSUE_FOR_PRODUCTION]: {
    code: SapTransactionCode.ISSUE_FOR_PRODUCTION,
    typeKey: 'ISSUE_FOR_PRODUCTION',
    nameAr: 'صرف خامات للتشغيل (Issued For Production)',
    nameEn: 'Issued For Production',
    direction: 'OUTGOING',
    isQuantityEditable: true,
    isUnitPriceEditable: false, // STRICTLY READ-ONLY & LOCKED
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: true,
    sourceDocumentType: 'PRODUCTION_ORDER',
    costBasis: 'LOCATION_MAC',
    descriptionAr: 'صرف مواد خام لأمر إنتاج. التكلفة مقفلة وتُحسب من متوسط تكلفة موقع الصرف، وتُسجل التكلفة الفعلية على أمر الإنتاج.',
    descriptionEn: 'Raw material issue to production order. Unit cost locked to source location MAC. Actual cost posted against production order.'
  },
  [SapTransactionCode.TRANSFER_OUT]: {
    code: SapTransactionCode.TRANSFER_OUT,
    typeKey: 'TRANSFER_OUT',
    nameAr: 'تحويل صادر (Transfer Out)',
    nameEn: 'Transfer Out',
    direction: 'TRANSFER',
    isQuantityEditable: true,
    isUnitPriceEditable: false, // Uses source location MAC
    isLocationRequired: true,
    isDestinationLocationRequired: true,
    requiresSourceDocument: false,
    costBasis: 'SOURCE_LOCATION_MAC',
    descriptionAr: 'الطرف الصادر للتحويل المخزني. يخصم الكمية والقيمة بمتوسط تكلفة الموقع المصدر.',
    descriptionEn: 'Outward side of stock transfer. Deducts qty and value using source location MAC.'
  },
  [SapTransactionCode.TRANSFER_IN]: {
    code: SapTransactionCode.TRANSFER_IN,
    typeKey: 'TRANSFER_IN',
    nameAr: 'تحويل وارد (Transfer In)',
    nameEn: 'Transfer In',
    direction: 'TRANSFER',
    isQuantityEditable: false, // Linked to Transfer Out
    isUnitPriceEditable: false, // Value transferred from Transfer Out
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: false,
    costBasis: 'SOURCE_LOCATION_MAC',
    descriptionAr: 'الطرف الوارد للتحويل المخزني. يضيف الكمية والقيمة المنقولة ويعيد احتساب متوسط تكلفة الموقع الوجهة.',
    descriptionEn: 'Inward side of stock transfer. Receives transferred qty and value, recalculating destination location MAC.'
  },
  [SapTransactionCode.GOODS_RECEIPT_PO]: {
    code: SapTransactionCode.GOODS_RECEIPT_PO,
    typeKey: 'GOODS_RECEIPT_PO',
    nameAr: 'استلام بضاعة أمر شراء (Goods Receipt PO)',
    nameEn: 'Goods Receipt PO',
    direction: 'INCOMING',
    isQuantityEditable: true,
    isUnitPriceEditable: true, // User enters purchase invoice/PO price
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: false,
    costBasis: 'MANUAL_ENTRY',
    descriptionAr: 'استلام مشتريات من المورد. يُدخل المستخدم الكمية وسعر الشراء. يُحدث الرصيد ومتوسط التكلفة.',
    descriptionEn: 'Purchased inventory receipt against PO. User inputs qty and unit purchase price. Updates stock and recalculates MAC.'
  },
  [SapTransactionCode.LANDED_COST]: {
    code: SapTransactionCode.LANDED_COST,
    typeKey: 'LANDED_COST',
    nameAr: 'تكاليف إنزال واقتناء (Landed Cost)',
    nameEn: 'Landed Cost',
    direction: 'VALUATION_ONLY',
    isQuantityEditable: false, // STRICTLY NO QUANTITY CHANGE!
    isUnitPriceEditable: false, // Amount allocated directly
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: true,
    sourceDocumentType: 'GOODS_RECEIPT_PO',
    costBasis: 'MANUAL_ENTRY', // User enters landed cost amount
    descriptionAr: 'تحميل مصاريف إضافية (شحن، جمارك) على إذن استلام بضاعة سابق. لا يغير الكمية إطلاقاً، بل يزيد قيمة المخزون المتبقي ويعيد احتساب MAC.',
    descriptionEn: 'Capitalizes acquisition costs (freight, customs) onto Goods Receipt PO. Updates inventory value and MAC of remaining on-hand stock without altering quantity.'
  },
  [SapTransactionCode.COUNT_POSTING]: {
    code: SapTransactionCode.COUNT_POSTING,
    typeKey: 'COUNT_POSTING',
    nameAr: 'تسوية فروقات الجرد (Count Posting)',
    nameEn: 'Count Posting / Inventory Counting',
    direction: 'INCOMING', // Dynamically handled: positive variance = INCOMING, negative variance = OUTGOING
    isQuantityEditable: true,
    isUnitPriceEditable: false, // Dynamic: editable only if positive variance! Locked if negative variance!
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: false,
    costBasis: 'LOCATION_MAC', // For negative; MANUAL_ENTRY for positive
    descriptionAr: 'تسوية الجرد الفعلي. الفائض الموجب يتطلب سعر وحدة ويعيد احتساب MAC؛ العجز السالب مقفل بسعر متوسط التكلفة الحالي آلياً.',
    descriptionEn: 'Physical inventory count adjustment. Positive variance requires entered price; negative variance is strictly locked to location MAC.'
  },
  [SapTransactionCode.REVALUATION]: {
    code: SapTransactionCode.REVALUATION,
    typeKey: 'REVALUATION',
    nameAr: 'إعادة تقييم المخزون (Revaluation)',
    nameEn: 'Inventory Revaluation',
    direction: 'VALUATION_ONLY',
    isQuantityEditable: false, // STRICTLY NO QUANTITY CHANGE!
    isUnitPriceEditable: false,
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: false,
    costBasis: 'MANUAL_ENTRY', // Adjustment amount is entered
    descriptionAr: 'تعديل قيمة المخزون بدون تغيير الكمية. يعيد احتساب متوسط التكلفة بالقسمة على الرصيد الحالي الموجب.',
    descriptionEn: 'Direct adjustment of inventory value without changing quantity. Recalculates MAC using updated value / on-hand quantity.'
  },
  [SapTransactionCode.CUSTOMER_DELIVERY]: {
    code: SapTransactionCode.CUSTOMER_DELIVERY,
    typeKey: 'CUSTOMER_DELIVERY',
    nameAr: 'إذن تسليم عميل (Delivery to Customer)',
    nameEn: 'Delivery to Customer',
    direction: 'OUTGOING',
    isQuantityEditable: true,
    isUnitPriceEditable: false, // STRICTLY READ-ONLY & LOCKED
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: false,
    costBasis: 'LOCATION_MAC',
    descriptionAr: 'صرف بضاعة لتسليم العميل. تكلفة البضاعة المباعة مقفلة وتُسجل من متوسط تكلفة موقع الصرف لحظة الترحيل.',
    descriptionEn: 'Finished product delivery to customer. Unit cost is strictly locked to current location MAC. COGS preserved for customer return tracking.'
  },
  [SapTransactionCode.RETURN_TO_VENDOR]: {
    code: SapTransactionCode.RETURN_TO_VENDOR,
    typeKey: 'RETURN_TO_VENDOR',
    nameAr: 'مرتجع إلى مورد (Return to Vendor)',
    nameEn: 'Return to Vendor',
    direction: 'OUTGOING',
    isQuantityEditable: true,
    isUnitPriceEditable: false, // STRICTLY READ-ONLY: uses effective receipt cost
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: true,
    sourceDocumentType: 'PURCHASE_RECEIPT',
    costBasis: 'ORIGINAL_RECEIPT_COST',
    descriptionAr: 'إرجاع بضاعة مشتراة إلى المورد. التكلفة مقفلة وتُستمد من التكلفة الفعلية للشحنة الأصلية (شاملة مصاريف الإنزال). الكمية محددة بالرصيد المتاح للإرجاع.',
    descriptionEn: 'Return of purchased stock to vendor. Cost is locked and derived from original receipt effective cost. Return qty cannot exceed original qty less previous returns.'
  },
  [SapTransactionCode.RETURN_FROM_CUSTOMER]: {
    code: SapTransactionCode.RETURN_FROM_CUSTOMER,
    typeKey: 'RETURN_FROM_CUSTOMER',
    nameAr: 'مرتجع من عميل (Return from Customer)',
    nameEn: 'Return from Customer',
    direction: 'INCOMING',
    isQuantityEditable: true,
    isUnitPriceEditable: false, // STRICTLY READ-ONLY: uses original delivery cost
    isLocationRequired: true,
    isDestinationLocationRequired: false,
    requiresSourceDocument: true,
    sourceDocumentType: 'CUSTOMER_DELIVERY',
    costBasis: 'ORIGINAL_DELIVERY_COST',
    descriptionAr: 'استلام مرتجع بضاعة من العميل. التكلفة مقفلة ومطابقة لتكلفة إذن التسليم الأصلي. يعاد احتساب متوسط تكلفة الموقع المستلم.',
    descriptionEn: 'Customer sales return into stock. Cost is locked to historical delivery issue cost. Recalculates receiving location MAC. Cannot exceed delivered quantity.'
  }
};

/**
 * Validates whether user is attempting to manipulate/override a locked unit cost.
 * Throws or returns an error message if unauthorized price override is detected.
 */
export function validateTransactionCostPermissions(
  typeCode: SapTransactionCode,
  payload: {
    unitPrice?: number;
    varianceQty?: number;
    submittedCost?: number;
  }
): { allowed: boolean; reason?: string } {
  const rule = SAP_TRANSACTION_RULES[typeCode];
  if (!rule) {
    return { allowed: false, reason: `Unknown transaction type code: ${typeCode}` };
  }

  // Count Posting special rule: Positive variance allows unit price, Negative variance FORBIDS manual price!
  if (typeCode === SapTransactionCode.COUNT_POSTING) {
    const isNegative = (payload.varianceQty || 0) < 0;
    if (isNegative && payload.unitPrice !== undefined && payload.unitPrice !== null) {
      return {
        allowed: false,
        reason: 'Unauthorized cost input: Negative count posting (stock decrease) must not accept manual unit price. Cost is strictly calculated from location MAC.'
      };
    }
    return { allowed: true };
  }

  // If transaction rule states unit price is NOT editable, reject any manual price override
  if (!rule.isUnitPriceEditable) {
    if (payload.unitPrice !== undefined && payload.unitPrice !== null && payload.unitPrice > 0) {
      return {
        allowed: false,
        reason: `Manual unit cost override rejected for ${rule.nameEn} (Type ${typeCode}). Outgoing and system-controlled transactions must use authoritative historical moving average cost.`
      };
    }
  }

  return { allowed: true };
}
