export type Language = 'ar' | 'en';

export enum WarehouseType {
  RAW_MATERIALS = 'RAW_MATERIALS',
  FINISHED_GOODS = 'FINISHED_GOODS',
  SCRAP = 'SCRAP',
  WIP = 'WIP'
}

export enum ItemType {
  RAW_MATERIAL = 'RAW_MATERIAL',
  SEMI_FINISHED = 'SEMI_FINISHED',
  FINISHED_PRODUCT = 'FINISHED_PRODUCT'
}

export enum ProductionOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  RELEASED = 'RELEASED',
  IN_PRODUCTION = 'IN_PRODUCTION',
  MATERIAL_ISSUED = 'MATERIAL_ISSUED',
  PENDING_QUALITY = 'PENDING_QUALITY',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum QualityStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RELEASED = 'RELEASED'
}

export enum TransactionType {
  OPENING_BALANCE = 'OPENING_BALANCE',
  PURCHASE_RECEIPT = 'PURCHASE_RECEIPT',
  LANDED_COST = 'LANDED_COST',
  INVENTORY_ISSUE = 'INVENTORY_ISSUE',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  MATERIAL_ISSUE_PRODUCTION = 'MATERIAL_ISSUE_PRODUCTION',
  SEMI_FINISHED_RECEIPT = 'SEMI_FINISHED_RECEIPT',
  FINISHED_GOODS_RECEIPT = 'FINISHED_GOODS_RECEIPT',
  CUSTOMER_DELIVERY = 'CUSTOMER_DELIVERY',
  SCRAP = 'SCRAP',
  COST_ADJUSTMENT = 'COST_ADJUSTMENT',
  REVERSAL = 'REVERSAL'
}

export enum CostCategory {
  DIRECT_MANUFACTURING = 'DIRECT_MANUFACTURING',
  FACTORY_OVERHEAD = 'FACTORY_OVERHEAD',
  MACHINE_COST = 'MACHINE_COST',
  ENERGY_COST = 'ENERGY_COST',
  MAINTENANCE_COST = 'MAINTENANCE_COST',
  OPERATIONAL_COST = 'OPERATIONAL_COST',
  ADMINISTRATIVE_COST = 'ADMINISTRATIVE_COST',
  OTHER = 'OTHER'
}

export enum CostAllocationMethod {
  DIRECT_AMOUNT = 'DIRECT_AMOUNT',
  PER_QUANTITY = 'PER_QUANTITY',
  PERCENTAGE_MATERIAL = 'PERCENTAGE_MATERIAL',
  PERCENTAGE_PRODUCTION = 'PERCENTAGE_PRODUCTION',
  MANUAL = 'MANUAL'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  INVENTORY_USER = 'INVENTORY_USER',
  PRODUCTION_USER = 'PRODUCTION_USER',
  QUALITY_USER = 'QUALITY_USER',
  FINANCE_USER = 'FINANCE_USER',
  MANAGEMENT_USER = 'MANAGEMENT_USER'
}

export interface PermissionSet {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canPost: boolean;
  canCancel: boolean;
  canPrint: boolean;
  canExport: boolean;
  canDeleteDraft: boolean;
  canViewCost: boolean;
  canViewReports: boolean;
  canManageMasterData: boolean;
  canManagePermissions: boolean;
  canManageOdoo: boolean;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  permissionOverrides?: Partial<PermissionSet>;
}

export interface Warehouse {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: WarehouseType;
  active: boolean;
  notes?: string;
}

export interface ProductionLocation {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  warehouseId: string;
  stageName?: string;
  active: boolean;
  notes?: string;
}

export interface UOM {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  baseUOM?: string;
  conversionFactor: number; // e.g. 1 TON = 1000 KG
  active: boolean;
}

export interface Currency {
  id: string;
  code: string; // EGP, USD, EUR, GBP
  nameAr: string;
  nameEn: string;
  exchangeRate: number; // Against base EGP (EGP = 1.0)
  rateDate: string;
  isBase: boolean;
  active: boolean;
}

export interface CurrencyRate {
  id: string;
  currencyCode: string; // e.g. USD, EUR, SAR, GBP
  rateDate: string; // YYYY-MM-DD
  rate: number; // Against base currency (e.g. 50.45 EGP)
  source?: string; // e.g. "البنك المركزي", "سعر مخصص", "الفاتورة"
  notes?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface RawMaterial {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  itemType: ItemType.RAW_MATERIAL;
  defaultUOM: string;
  alternativeUOM?: string;
  conversionFactor: number;
  defaultWarehouseId: string;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  active: boolean;
  notes?: string;
  // Live stock cache
  currentQty: number;
  movingAverageCost: number;
  totalValue: number;
}

export interface Product {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  productType: ItemType.FINISHED_PRODUCT | ItemType.SEMI_FINISHED;
  defaultUOM: string;
  alternativeUOM?: string;
  defaultWarehouseId: string;
  active: boolean;
  notes?: string;
  // Live stock cache
  currentQty: number;
  movingAverageCost: number;
  totalValue: number;
}

export interface Machine {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  productionStage: string;
  defaultLocationId: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  defaultCurrency: string;
  paymentTerms?: string;
  active: boolean;
  notes?: string;
}

export interface Customer {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  defaultCurrency: string;
  paymentTerms?: string;
  active: boolean;
  notes?: string;
  odooPartnerId?: number;
}

export interface BOMLine {
  id: string;
  rawMaterialId: string;
  rawMaterialCode: string;
  rawMaterialName: string;
  quantity: number; // Required qty per finished unit
  uom: string;
  percentage?: number;
  sequence: number;
  productionStage?: string;
  mandatory: boolean;
}

export interface BOM {
  id: string;
  code: string;
  productId: string;
  productCode: string;
  productName: string;
  nameAr: string;
  nameEn: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'DRAFT' | 'APPROVED' | 'INACTIVE';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
  lines: BOMLine[];
}

export interface InventoryReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  currency: string;
  exchangeRate: number;
  itemId: string;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  uom: string;
  unitPrice: number; // In transaction currency
  unitPriceEGP: number; // Calculated
  totalValueEGP: number;
  landedCostAllocatedEGP: number;
  status: 'POSTED' | 'CANCELLED';
  reference?: string;
  notes?: string;
  createdBy: string;
  createdDate: string;
  approvedBy?: string;
  approvalDate?: string;
}

export interface LandedCost {
  id: string;
  landedCostNumber: string;
  date: string;
  originalReceiptId: string;
  originalReceiptNumber: string;
  itemId: string;
  itemName: string;
  costType: string; // 'Customs Duties', 'Freight', 'Handling', etc.
  amount: number;
  currency: string;
  exchangeRate: number;
  amountEGP: number;
  allocationMethod: string;
  notes?: string;
  createdBy: string;
  createdDate: string;
  status: 'POSTED' | 'CANCELLED';
}

export interface InventoryIssue {
  id: string;
  issueNumber: string;
  date: string;
  fromWarehouseId: string;
  fromLocationId?: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  movingAverageCostEGP: number;
  totalIssueValueEGP: number;
  reason: string;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdDate: string;
  status: 'POSTED' | 'CANCELLED';
}

export interface InventoryTransfer {
  id: string;
  transferNumber: string;
  date: string;
  fromWarehouseId: string;
  fromLocationId?: string;
  toWarehouseId: string;
  toLocationId?: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  unitCostEGP: number;
  totalValueEGP: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdDate: string;
  status: 'POSTED' | 'CANCELLED';
}

export interface ProductionOrderMaterialLine {
  id: string;
  rawMaterialId: string;
  rawMaterialCode: string;
  rawMaterialName: string;
  uom: string;
  plannedQty: number;
  availableQty: number;
  actualIssuedQty: number;
  movingAverageCostEGP: number;
  actualCostEGP: number;
}

export interface ProductionOrderModification {
  version: number;
  date: string;
  modifiedBy: string;
  approvedBy?: string;
  reason: string;
  changesSummary: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productionDate: string;
  productId: string;
  productCode: string;
  productName: string;
  plannedQuantity: number;
  actualFinishedQuantity: number;
  actualScrapQuantity: number;
  uom: string;
  bomId: string;
  bomCode: string;
  bomVersion: string;
  machineId?: string;
  machineName?: string;
  productionStage: string;
  wipWarehouseId: string;
  wipLocationId?: string;
  expectedFinishedQuantity: number;
  expectedScrapQuantity: number;
  status: ProductionOrderStatus;
  version: number;
  modifications: ProductionOrderModification[];
  materials: ProductionOrderMaterialLine[];
  // Costing
  actualMaterialCostEGP: number;
  additionalCostEGP: number;
  totalProductionCostEGP: number;
  finishedGoodsUnitCostEGP: number;
  scrapValueEGP: number; // 0 in MVP
  // Quality & Finished Goods
  receiptNumber?: string;
  qualityStatus: QualityStatus;
  qualityNotes?: string;
  qualityApprovedBy?: string;
  qualityApprovalDate?: string;
  finishedGoodsWarehouseId?: string;
  notes?: string;
  createdBy: string;
  createdDate: string;
  approvedBy?: string;
  approvalDate?: string;
}

export interface MaterialIssue {
  id: string;
  issueNumber: string;
  productionOrderId: string;
  productionOrderNumber: string;
  date: string;
  rawMaterialId: string;
  rawMaterialCode: string;
  rawMaterialName: string;
  plannedQuantity: number;
  actualQuantity: number;
  uom: string;
  movingAverageCostEGP: number;
  totalActualCostEGP: number;
  warehouseId: string;
  machineName?: string;
  productionStage?: string;
  createdBy: string;
  status: 'POSTED' | 'CANCELLED';
}

export interface ProductionReceipt {
  id: string;
  receiptNumber: string;
  productionOrderId: string;
  productionOrderNumber: string;
  date: string;
  productId: string;
  productCode: string;
  productName: string;
  finishedQuantity: number;
  scrapQuantity: number;
  uom: string;
  finishedGoodsWarehouseId: string;
  scrapWarehouseId: string;
  totalMaterialCostEGP: number;
  finishedGoodsUnitCostEGP: number;
  scrapUnitCostEGP: number; // Always 0 in MVP
  qualityStatus: QualityStatus;
  qualityApprovedBy?: string;
  qualityApprovalDate?: string;
  qualityDecisionReason?: string;
  notes?: string;
  createdBy: string;
  status: 'POSTED' | 'CANCELLED';
}

export interface CustomerDelivery {
  id: string;
  deliveryNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  uom: string;
  movingAverageCostEGP: number;
  totalDeliveryValueEGP: number;
  sellingPriceEGP?: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdDate: string;
  status: 'POSTED' | 'CANCELLED';
  odooSynced?: boolean;
}

export interface ProductionOrderCostAdjustment {
  id: string;
  adjustmentNumber: string;
  productionOrderId: string;
  productionOrderNumber: string;
  date: string;
  costCategory: CostCategory;
  costType: string; // e.g., 'Factory Electricity', 'Labor Setup'
  amount: number;
  currency: string;
  exchangeRate: number;
  amountEGP: number;
  allocationMethod: CostAllocationMethod;
  allocationBase?: string;
  costPeriod?: string;
  description: string;
  createdBy: string;
  approvedBy?: string;
  approvalDate?: string;
  status: 'DRAFT' | 'APPROVED' | 'POSTED' | 'CANCELLED';
  // Impact Breakdown
  originalProductionCostEGP: number;
  revisedProductionCostEGP: number;
  quantityProduced: number;
  quantityInStock: number;
  quantityIssuedOrSold: number;
  inventoryAdjustmentEGP: number;
  cogsAdjustmentEGP: number;
}

export interface InventoryLedgerEntry {
  id: string;
  date: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  locationName?: string;
  transactionType: TransactionType;
  documentNumber: string;
  reference?: string;
  uom?: string;
  qtyIn: number;
  qtyOut: number;
  balanceQty: number;
  unitCostEGP: number;
  transactionValueEGP: number;
  runningInventoryValueEGP: number;
  movingAverageCostEGP: number;
  createdBy: string;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  date: string;
  time: string;
  userName: string;
  action: string;
  documentType: string;
  documentNumber: string;
  oldValue?: string;
  newValue?: string;
  details: string;
}

export interface OdooConfig {
  serverUrl: string;
  database: string;
  username: string;
  apiKey: string;
  isConnected: boolean;
  lastTestedDate?: string;
  lastSyncDate?: string;
  autoSync: boolean;
  syncCustomers: boolean;
  syncInventory: boolean;
  syncProduction: boolean;
}

export interface OdooSyncLog {
  id: string;
  timestamp: string;
  model: 'res.partner' | 'stock.quant' | 'product.product' | 'mrp.production';
  action: 'IMPORT' | 'EXPORT' | 'SYNC';
  recordsCount: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details: string;
}

export type NotificationType = 'INVENTORY_ALERT' | 'PRODUCTION_MILESTONE' | 'QUALITY_ALERT' | 'COST_ALERT' | 'SYSTEM' | 'BACKGROUND_SYNC';
export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  timestamp: string;
  targetTab?: string;
  targetId?: string;
  read: boolean;
  roleTarget?: UserRole[];
  actionLabelAr?: string;
  actionLabelEn?: string;
}

// ==========================================
// BACKGROUND SYNC & OFFLINE QUEUE DATA TYPES
// ==========================================
export type OfflineSyncActionType =
  | 'STOCK_TRANSFER'
  | 'GOODS_RECEIPT'
  | 'MATERIAL_ISSUE'
  | 'PRODUCTION_RECEIPT'
  | 'CUSTOMER_DELIVERY'
  | 'COST_ADJUSTMENT';

export type OfflineSyncStatus = 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface QueuedSyncItem {
  id: string;
  actionType: OfflineSyncActionType;
  titleAr: string;
  titleEn: string;
  documentNumber: string;
  payload: any;
  queuedAt: string;
  status: OfflineSyncStatus;
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: string;
  syncedAt?: string;
  error?: string;
  odooModel: string; // e.g., 'stock.picking', 'stock.quant', 'mrp.production'
  odooOperation: string;
}

export interface SyncQueueStats {
  total: number;
  queued: number;
  syncing: number;
  synced: number;
  failed: number;
}
