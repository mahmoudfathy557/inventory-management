import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  User,
  UserRole,
  Warehouse,
  ProductionLocation,
  UOM,
  Currency,
  RawMaterial,
  Product,
  Machine,
  Supplier,
  Customer,
  BOM,
  InventoryReceipt,
  LandedCost,
  InventoryIssue,
  InventoryTransfer,
  ProductionOrder,
  ProductionOrderStatus,
  QualityStatus,
  MaterialIssue,
  ProductionReceipt,
  CustomerDelivery,
  ProductionOrderCostAdjustment,
  InventoryLedgerEntry,
  TransactionType,
  ItemType,
  AuditLogEntry,
  OdooConfig,
  OdooSyncLog
} from '../types';
import {
  INITIAL_WAREHOUSES,
  INITIAL_LOCATIONS,
  INITIAL_UOMS,
  INITIAL_CURRENCIES,
  INITIAL_RAW_MATERIALS,
  INITIAL_PRODUCTS,
  INITIAL_MACHINES,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_BOMS,
  INITIAL_USERS,
  INITIAL_RECEIPTS,
  INITIAL_LANDED_COSTS,
  INITIAL_TRANSFERS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_MATERIAL_ISSUES,
  INITIAL_PRODUCTION_RECEIPTS,
  INITIAL_CUSTOMER_DELIVERIES,
  INITIAL_COST_ADJUSTMENTS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_ODOO_CONFIG,
  INITIAL_ODOO_LOGS
} from '../data/initialData';
import { odooService } from '../services/odooService';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;

  // Master Data
  warehouses: Warehouse[];
  locations: ProductionLocation[];
  uoms: UOM[];
  currencies: Currency[];
  rawMaterials: RawMaterial[];
  products: Product[];
  machines: Machine[];
  suppliers: Supplier[];
  customers: Customer[];
  boms: BOM[];

  // Transactions
  receipts: InventoryReceipt[];
  landedCosts: LandedCost[];
  issues: InventoryIssue[];
  transfers: InventoryTransfer[];
  productionOrders: ProductionOrder[];
  materialIssues: MaterialIssue[];
  productionReceipts: ProductionReceipt[];
  customerDeliveries: CustomerDelivery[];
  costAdjustments: ProductionOrderCostAdjustment[];

  // Ledger & Audit
  ledgerEntries: InventoryLedgerEntry[];
  auditLogs: AuditLogEntry[];

  // Odoo
  odooConfig: OdooConfig;
  odooLogs: OdooSyncLog[];
  setOdooConfig: React.Dispatch<React.SetStateAction<OdooConfig>>;

  // Action methods
  addReceipt: (receipt: Omit<InventoryReceipt, 'id' | 'receiptNumber' | 'createdDate' | 'status' | 'landedCostAllocatedEGP'>) => InventoryReceipt;
  addLandedCost: (cost: Omit<LandedCost, 'id' | 'landedCostNumber' | 'createdDate' | 'status'>) => LandedCost;
  addIssue: (issue: Omit<InventoryIssue, 'id' | 'issueNumber' | 'createdDate' | 'status'>) => InventoryIssue;
  addTransfer: (transfer: Omit<InventoryTransfer, 'id' | 'transferNumber' | 'createdDate' | 'status'>) => InventoryTransfer;
  createProductionOrder: (order: Omit<ProductionOrder, 'id' | 'orderNumber' | 'createdDate' | 'version' | 'modifications' | 'status' | 'actualFinishedQuantity' | 'actualScrapQuantity' | 'qualityStatus' | 'actualMaterialCostEGP' | 'additionalCostEGP' | 'totalProductionCostEGP' | 'finishedGoodsUnitCostEGP' | 'scrapValueEGP'>) => ProductionOrder;
  modifyProductionOrder: (orderId: string, changes: Partial<ProductionOrder>, reason: string) => void;
  issueMaterialToProduction: (issue: Omit<MaterialIssue, 'id' | 'issueNumber' | 'status'>) => MaterialIssue;
  recordProductionReceipt: (receipt: Omit<ProductionReceipt, 'id' | 'receiptNumber' | 'status' | 'scrapUnitCostEGP'>) => ProductionReceipt;
  approveQuality: (productionOrderId: string, decision: QualityStatus, reason: string) => void;
  addCustomerDelivery: (delivery: Omit<CustomerDelivery, 'id' | 'deliveryNumber' | 'createdDate' | 'status'>) => CustomerDelivery;
  addCostAdjustment: (adjustment: Omit<ProductionOrderCostAdjustment, 'id' | 'adjustmentNumber' | 'status' | 'originalProductionCostEGP' | 'revisedProductionCostEGP' | 'quantityProduced' | 'quantityInStock' | 'quantityIssuedOrSold' | 'inventoryAdjustmentEGP' | 'cogsAdjustmentEGP'>) => ProductionOrderCostAdjustment;
  cancelTransaction: (documentType: string, documentNumber: string, reason: string) => void;
  resetToSampleMVP: () => void;

  // Master Data Add/Update/Delete
  saveRawMaterial: (material: RawMaterial) => void;
  deleteRawMaterial: (id: string) => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  saveBOM: (bom: BOM) => void;
  deleteBOM: (id: string) => void;
  saveMachine: (machine: Machine) => void;
  deleteMachine: (id: string) => void;
  saveSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  saveCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  saveWarehouse: (wh: Warehouse) => void;
  deleteWarehouse: (id: string) => void;
  saveLocation: (loc: ProductionLocation) => void;
  deleteLocation: (id: string) => void;
  saveUOM: (uom: UOM) => void;
  deleteUOM: (id: string) => void;
  saveCurrency: (currency: Currency) => void;
  deleteCurrency: (id: string) => void;
  saveUser: (user: User) => void;
  deleteUser: (id: string) => void;

  // Odoo Actions
  testOdooConnection: () => Promise<boolean>;
  syncOdooEntity: (entity: 'CUSTOMERS' | 'INVENTORY' | 'PRODUCTION') => Promise<void>;
  fullOdooSync: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_PREFIX = 'mfg_inv_odoo_v1_';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(`Error loading localStorage key: ${key}`, e);
  }
  return fallback;
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving localStorage key: ${key}`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => loadStorage<Language>('lang', 'ar'));
  const [currentUser, setCurrentUserState] = useState<User>(() => loadStorage<User>('user', INITIAL_USERS[0]));
  const [users, setUsers] = useState<User[]>(() => loadStorage<User[]>('users', INITIAL_USERS));

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => loadStorage('warehouses', INITIAL_WAREHOUSES));
  const [locations, setLocations] = useState<ProductionLocation[]>(() => loadStorage('locations', INITIAL_LOCATIONS));
  const [uoms, setUoms] = useState<UOM[]>(() => loadStorage('uoms', INITIAL_UOMS));
  const [currencies, setCurrencies] = useState<Currency[]>(() => loadStorage('currencies', INITIAL_CURRENCIES));
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => loadStorage('rawMaterials', INITIAL_RAW_MATERIALS));
  const [products, setProducts] = useState<Product[]>(() => loadStorage('products', INITIAL_PRODUCTS));
  const [machines, setMachines] = useState<Machine[]>(() => loadStorage('machines', INITIAL_MACHINES));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStorage('suppliers', INITIAL_SUPPLIERS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStorage('customers', INITIAL_CUSTOMERS));
  const [boms, setBoms] = useState<BOM[]>(() => loadStorage('boms', INITIAL_BOMS));

  const [receipts, setReceipts] = useState<InventoryReceipt[]>(() => loadStorage('receipts', INITIAL_RECEIPTS));
  const [landedCosts, setLandedCosts] = useState<LandedCost[]>(() => loadStorage('landedCosts', INITIAL_LANDED_COSTS));
  const [issues, setIssues] = useState<InventoryIssue[]>(() => loadStorage('issues', []));
  const [transfers, setTransfers] = useState<InventoryTransfer[]>(() => loadStorage('transfers', INITIAL_TRANSFERS));
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(() => loadStorage('productionOrders', INITIAL_PRODUCTION_ORDERS));
  const [materialIssues, setMaterialIssues] = useState<MaterialIssue[]>(() => loadStorage('materialIssues', INITIAL_MATERIAL_ISSUES));
  const [productionReceipts, setProductionReceipts] = useState<ProductionReceipt[]>(() => loadStorage('productionReceipts', INITIAL_PRODUCTION_RECEIPTS));
  const [customerDeliveries, setCustomerDeliveries] = useState<CustomerDelivery[]>(() => loadStorage('customerDeliveries', INITIAL_CUSTOMER_DELIVERIES));
  const [costAdjustments, setCostAdjustments] = useState<ProductionOrderCostAdjustment[]>(() => loadStorage('costAdjustments', INITIAL_COST_ADJUSTMENTS));

  const [ledgerEntries, setLedgerEntries] = useState<InventoryLedgerEntry[]>(() => loadStorage('ledgerEntries', INITIAL_LEDGER_ENTRIES));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadStorage('auditLogs', INITIAL_AUDIT_LOGS));

  const [odooConfig, setOdooConfig] = useState<OdooConfig>(() => loadStorage('odooConfig', INITIAL_ODOO_CONFIG));
  const [odooLogs, setOdooLogs] = useState<OdooSyncLog[]>(() => loadStorage('odooLogs', INITIAL_ODOO_LOGS));

  // Sync to local storage
  useEffect(() => { saveStorage('lang', language); }, [language]);
  useEffect(() => { saveStorage('user', currentUser); }, [currentUser]);
  useEffect(() => { saveStorage('users', users); }, [users]);
  useEffect(() => { saveStorage('warehouses', warehouses); }, [warehouses]);
  useEffect(() => { saveStorage('locations', locations); }, [locations]);
  useEffect(() => { saveStorage('uoms', uoms); }, [uoms]);
  useEffect(() => { saveStorage('currencies', currencies); }, [currencies]);
  useEffect(() => { saveStorage('rawMaterials', rawMaterials); }, [rawMaterials]);
  useEffect(() => { saveStorage('products', products); }, [products]);
  useEffect(() => { saveStorage('machines', machines); }, [machines]);
  useEffect(() => { saveStorage('suppliers', suppliers); }, [suppliers]);
  useEffect(() => { saveStorage('customers', customers); }, [customers]);
  useEffect(() => { saveStorage('boms', boms); }, [boms]);
  useEffect(() => { saveStorage('receipts', receipts); }, [receipts]);
  useEffect(() => { saveStorage('landedCosts', landedCosts); }, [landedCosts]);
  useEffect(() => { saveStorage('issues', issues); }, [issues]);
  useEffect(() => { saveStorage('transfers', transfers); }, [transfers]);
  useEffect(() => { saveStorage('productionOrders', productionOrders); }, [productionOrders]);
  useEffect(() => { saveStorage('materialIssues', materialIssues); }, [materialIssues]);
  useEffect(() => { saveStorage('productionReceipts', productionReceipts); }, [productionReceipts]);
  useEffect(() => { saveStorage('customerDeliveries', customerDeliveries); }, [customerDeliveries]);
  useEffect(() => { saveStorage('costAdjustments', costAdjustments); }, [costAdjustments]);
  useEffect(() => { saveStorage('ledgerEntries', ledgerEntries); }, [ledgerEntries]);
  useEffect(() => { saveStorage('auditLogs', auditLogs); }, [auditLogs]);
  useEffect(() => { saveStorage('odooConfig', odooConfig); }, [odooConfig]);
  useEffect(() => { saveStorage('odooLogs', odooLogs); }, [odooLogs]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    logAudit('USER_SWITCH', 'جلسة مستخدم', user.id, `تم تبديل المستخدم الحالي إلى ${user.fullName} (${user.role})`);
  };

  const logAudit = (action: string, docType: string, docNum: string, details: string, oldVal?: string, newVal?: string) => {
    const now = new Date();
    const entry: AuditLogEntry = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      userName: currentUser.fullName,
      action,
      documentType: docType,
      documentNumber: docNum,
      oldValue: oldVal,
      newValue: newVal,
      details
    };
    setAuditLogs(prev => [entry, ...prev]);
  };

  // 1. ADD INVENTORY RECEIPT (Receipt / Add Inventory)
  const addReceipt = (data: Omit<InventoryReceipt, 'id' | 'receiptNumber' | 'createdDate' | 'status' | 'landedCostAllocatedEGP'>) => {
    const nextNum = `REC-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(4, '0')}`;
    const newReceipt: InventoryReceipt = {
      ...data,
      id: 'rec-' + Date.now(),
      receiptNumber: nextNum,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'POSTED',
      landedCostAllocatedEGP: 0
    };

    // Update Item Moving Average Cost:
    // If Raw Material:
    let newQty = 0;
    let newTotalVal = 0;
    let newMAC = 0;

    if (data.itemType === ItemType.RAW_MATERIAL) {
      setRawMaterials(prev => prev.map(item => {
        if (item.id === data.itemId) {
          const oldQty = item.currentQty || 0;
          const oldVal = item.totalValue || 0;
          newQty = oldQty + data.quantity;
          newTotalVal = oldVal + data.totalValueEGP;
          newMAC = newQty > 0 ? newTotalVal / newQty : 0;
          return {
            ...item,
            currentQty: newQty,
            totalValue: newTotalVal,
            movingAverageCost: newMAC
          };
        }
        return item;
      }));
    } else {
      setProducts(prev => prev.map(prod => {
        if (prod.id === data.itemId) {
          const oldQty = prod.currentQty || 0;
          const oldVal = prod.totalValue || 0;
          newQty = oldQty + data.quantity;
          newTotalVal = oldVal + data.totalValueEGP;
          newMAC = newQty > 0 ? newTotalVal / newQty : 0;
          return {
            ...prod,
            currentQty: newQty,
            totalValue: newTotalVal,
            movingAverageCost: newMAC
          };
        }
        return prod;
      }));
    }

    // Add to Inventory Ledger (Section 36)
    const wh = warehouses.find(w => w.id === data.warehouseId);
    const ledgerEntry: InventoryLedgerEntry = {
      id: 'ledg-' + Date.now(),
      date: newReceipt.createdDate,
      itemId: data.itemId,
      itemCode: data.itemCode,
      itemName: data.itemName,
      itemType: data.itemType,
      warehouseId: data.warehouseId,
      warehouseName: wh ? (language === 'ar' ? wh.nameAr : wh.nameEn) : 'المستودع',
      locationId: data.locationId,
      transactionType: TransactionType.PURCHASE_RECEIPT,
      documentNumber: nextNum,
      reference: data.reference || data.supplierName,
      qtyIn: data.quantity,
      qtyOut: 0,
      balanceQty: newQty,
      unitCostEGP: data.unitPriceEGP,
      transactionValueEGP: data.totalValueEGP,
      runningInventoryValueEGP: newTotalVal,
      movingAverageCostEGP: newMAC,
      createdBy: currentUser.fullName,
      notes: data.notes
    };

    setLedgerEntries(prev => [...prev, ledgerEntry]);
    setReceipts(prev => [newReceipt, ...prev]);

    logAudit('POST_RECEIPT', 'إذن إضافة مخزني', nextNum, `استلام ${data.quantity} ${data.uom} من صنف ${data.itemName} بقيمة ${data.totalValueEGP.toLocaleString('en-US')} ج.م`);

    return newReceipt;
  };

  // 2. ADD LANDED COST (Section 13: adds value without adding quantity, recalculates MAC)
  const addLandedCost = (data: Omit<LandedCost, 'id' | 'landedCostNumber' | 'createdDate' | 'status'>) => {
    const nextNum = `LC-${new Date().getFullYear()}-${String(landedCosts.length + 1).padStart(4, '0')}`;
    const newLandedCost: LandedCost = {
      ...data,
      id: 'lc-' + Date.now(),
      landedCostNumber: nextNum,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'POSTED'
    };

    // Update the original receipt allocated amount
    setReceipts(prev => prev.map(r => {
      if (r.id === data.originalReceiptId) {
        return {
          ...r,
          landedCostAllocatedEGP: (r.landedCostAllocatedEGP || 0) + data.amountEGP
        };
      }
      return r;
    }));

    // Update Item Moving Average Cost (Quantity unchanged, Value increases)
    let currentQty = 0;
    let newTotalVal = 0;
    let newMAC = 0;
    let targetWhId = 'wh-raw';

    setRawMaterials(prev => prev.map(item => {
      if (item.id === data.itemId) {
        currentQty = item.currentQty || 0;
        newTotalVal = (item.totalValue || 0) + data.amountEGP;
        newMAC = currentQty > 0 ? newTotalVal / currentQty : item.movingAverageCost;
        targetWhId = item.defaultWarehouseId;
        return {
          ...item,
          totalValue: newTotalVal,
          movingAverageCost: newMAC
        };
      }
      return item;
    }));

    // Add to Inventory Ledger (Section 13 & 36)
    const wh = warehouses.find(w => w.id === targetWhId);
    const ledgerEntry: InventoryLedgerEntry = {
      id: 'ledg-' + Date.now(),
      date: newLandedCost.createdDate,
      itemId: data.itemId,
      itemCode: data.itemId,
      itemName: data.itemName,
      itemType: ItemType.RAW_MATERIAL,
      warehouseId: targetWhId,
      warehouseName: wh ? (language === 'ar' ? wh.nameAr : wh.nameEn) : 'مستودع الخام',
      transactionType: TransactionType.LANDED_COST,
      documentNumber: nextNum,
      reference: data.originalReceiptNumber,
      qtyIn: 0,
      qtyOut: 0,
      balanceQty: currentQty,
      unitCostEGP: 0,
      transactionValueEGP: data.amountEGP,
      runningInventoryValueEGP: newTotalVal,
      movingAverageCostEGP: newMAC,
      createdBy: currentUser.fullName,
      notes: `${data.costType} - زيادة القيمة وتحديث متوسط التكلفة بدون زيادة الكمية`
    };

    setLedgerEntries(prev => [...prev, ledgerEntry]);
    setLandedCosts(prev => [newLandedCost, ...prev]);

    logAudit('POST_LANDED_COST', 'تكلفة إنزال', nextNum, `إضافة ${data.amountEGP.toLocaleString('en-US')} ج.م على الصنف ${data.itemName}. متوسط التكلفة الجديد: ${newMAC.toFixed(3)} ج.م`);

    return newLandedCost;
  };

  // 3. INVENTORY ISSUE (Section 14: decreases qty and value using current MAC)
  const addIssue = (data: Omit<InventoryIssue, 'id' | 'issueNumber' | 'createdDate' | 'status'>) => {
    const nextNum = `ISS-${new Date().getFullYear()}-${String(issues.length + 1).padStart(4, '0')}`;
    const newIssue: InventoryIssue = {
      ...data,
      id: 'iss-' + Date.now(),
      issueNumber: nextNum,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'POSTED'
    };

    let newQty = 0;
    let newTotalVal = 0;
    const mac = data.movingAverageCostEGP;

    setRawMaterials(prev => prev.map(item => {
      if (item.id === data.itemId) {
        newQty = Math.max(0, (item.currentQty || 0) - data.quantity);
        newTotalVal = newQty * mac;
        return {
          ...item,
          currentQty: newQty,
          totalValue: newTotalVal
        };
      }
      return item;
    }));

    const wh = warehouses.find(w => w.id === data.fromWarehouseId);
    const ledgerEntry: InventoryLedgerEntry = {
      id: 'ledg-' + Date.now(),
      date: newIssue.createdDate,
      itemId: data.itemId,
      itemCode: data.itemCode,
      itemName: data.itemName,
      itemType: ItemType.RAW_MATERIAL,
      warehouseId: data.fromWarehouseId,
      warehouseName: wh ? (language === 'ar' ? wh.nameAr : wh.nameEn) : 'المستودع',
      locationId: data.fromLocationId,
      transactionType: TransactionType.INVENTORY_ISSUE,
      documentNumber: nextNum,
      reference: data.reason,
      qtyIn: 0,
      qtyOut: data.quantity,
      balanceQty: newQty,
      unitCostEGP: mac,
      transactionValueEGP: data.totalIssueValueEGP,
      runningInventoryValueEGP: newTotalVal,
      movingAverageCostEGP: mac,
      createdBy: currentUser.fullName,
      notes: data.notes
    };

    setLedgerEntries(prev => [...prev, ledgerEntry]);
    setIssues(prev => [newIssue, ...prev]);

    logAudit('POST_ISSUE', 'إذن صرف مخزني', nextNum, `صرف ${data.quantity} ${data.uom} من صنف ${data.itemName} بقيمة ${data.totalIssueValueEGP.toLocaleString('en-US')} ج.م`);

    return newIssue;
  };

  // 4. INVENTORY TRANSFER (Section 15: moves stock between warehouses without changing total company inventory value)
  const addTransfer = (data: Omit<InventoryTransfer, 'id' | 'transferNumber' | 'createdDate' | 'status'>) => {
    const nextNum = `TR-${new Date().getFullYear()}-${String(transfers.length + 1).padStart(4, '0')}`;
    const newTransfer: InventoryTransfer = {
      ...data,
      id: 'tr-' + Date.now(),
      transferNumber: nextNum,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'POSTED'
    };

    const fromWh = warehouses.find(w => w.id === data.fromWarehouseId);
    const toWh = warehouses.find(w => w.id === data.toWarehouseId);

    // Ledger 1: Transfer Out
    const ledgerOut: InventoryLedgerEntry = {
      id: 'ledg-out-' + Date.now(),
      date: newTransfer.createdDate,
      itemId: data.itemId,
      itemCode: data.itemCode,
      itemName: data.itemName,
      itemType: ItemType.RAW_MATERIAL,
      warehouseId: data.fromWarehouseId,
      warehouseName: fromWh ? (language === 'ar' ? fromWh.nameAr : fromWh.nameEn) : 'المستودع المصدر',
      locationId: data.fromLocationId,
      transactionType: TransactionType.TRANSFER_OUT,
      documentNumber: nextNum,
      reference: `تحويل إلى ${toWh ? (language === 'ar' ? toWh.nameAr : toWh.nameEn) : ''}`,
      qtyIn: 0,
      qtyOut: data.quantity,
      balanceQty: 0, // balance in source location
      unitCostEGP: data.unitCostEGP,
      transactionValueEGP: data.totalValueEGP,
      runningInventoryValueEGP: 0,
      movingAverageCostEGP: data.unitCostEGP,
      createdBy: currentUser.fullName,
      notes: data.notes
    };

    // Ledger 2: Transfer In
    const ledgerIn: InventoryLedgerEntry = {
      id: 'ledg-in-' + (Date.now() + 1),
      date: newTransfer.createdDate,
      itemId: data.itemId,
      itemCode: data.itemCode,
      itemName: data.itemName,
      itemType: ItemType.RAW_MATERIAL,
      warehouseId: data.toWarehouseId,
      warehouseName: toWh ? (language === 'ar' ? toWh.nameAr : toWh.nameEn) : 'المستودع الوجهة',
      locationId: data.toLocationId,
      transactionType: TransactionType.TRANSFER_IN,
      documentNumber: nextNum,
      reference: `تحويل من ${fromWh ? (language === 'ar' ? fromWh.nameAr : fromWh.nameEn) : ''}`,
      qtyIn: data.quantity,
      qtyOut: 0,
      balanceQty: data.quantity,
      unitCostEGP: data.unitCostEGP,
      transactionValueEGP: data.totalValueEGP,
      runningInventoryValueEGP: data.totalValueEGP,
      movingAverageCostEGP: data.unitCostEGP,
      createdBy: currentUser.fullName,
      notes: data.notes
    };

    setLedgerEntries(prev => [...prev, ledgerOut, ledgerIn]);
    setTransfers(prev => [newTransfer, ...prev]);

    logAudit('POST_TRANSFER', 'تحويل مخزني', nextNum, `تحويل ${data.quantity} ${data.uom} من ${fromWh?.nameAr} إلى ${toWh?.nameAr}`);

    return newTransfer;
  };

  // 5. PRODUCTION ORDER (Section 17 & 18)
  const createProductionOrder = (data: Omit<ProductionOrder, 'id' | 'orderNumber' | 'createdDate' | 'version' | 'modifications' | 'status' | 'actualFinishedQuantity' | 'actualScrapQuantity' | 'qualityStatus' | 'actualMaterialCostEGP' | 'additionalCostEGP' | 'totalProductionCostEGP' | 'finishedGoodsUnitCostEGP' | 'scrapValueEGP'>) => {
    const nextNum = `PO-${new Date().getFullYear()}-${String(productionOrders.length + 1).padStart(4, '0')}`;
    const newOrder: ProductionOrder = {
      ...data,
      id: 'po-' + Date.now(),
      orderNumber: nextNum,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: ProductionOrderStatus.APPROVED, // Auto-approved for rapid workflow or editable
      version: 1,
      modifications: [],
      actualFinishedQuantity: 0,
      actualScrapQuantity: 0,
      qualityStatus: QualityStatus.PENDING,
      actualMaterialCostEGP: 0,
      additionalCostEGP: 0,
      totalProductionCostEGP: 0,
      finishedGoodsUnitCostEGP: 0,
      scrapValueEGP: 0
    };

    setProductionOrders(prev => [newOrder, ...prev]);
    logAudit('CREATE_PRODUCTION_ORDER', 'أمر إنتاج', nextNum, `إنشاء أمر إنتاج لعدد ${data.plannedQuantity} ${data.uom} منتج ${data.productName}`);

    return newOrder;
  };

  // Section 18: Production Order Modification with Versioning
  const modifyProductionOrder = (orderId: string, changes: Partial<ProductionOrder>, reason: string) => {
    setProductionOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const newVersion = (order.version || 1) + 1;
        const modRecord = {
          version: newVersion,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          modifiedBy: currentUser.fullName,
          approvedBy: currentUser.fullName,
          reason,
          changesSummary: Object.keys(changes).join(', ')
        };
        const updated = {
          ...order,
          ...changes,
          version: newVersion,
          modifications: [...(order.modifications || []), modRecord]
        };
        logAudit('MODIFY_PRODUCTION_ORDER', 'تعديل أمر إنتاج', order.orderNumber, `تعديل مع إصدار نسخة جديدة v${newVersion}: ${reason}`);
        return updated;
      }
      return order;
    }));
  };

  // 6. MATERIAL ISSUE TO PRODUCTION (Section 19: Consumes actual raw materials at moving average cost)
  const issueMaterialToProduction = (data: Omit<MaterialIssue, 'id' | 'issueNumber' | 'status'>) => {
    const nextNum = `MI-${new Date().getFullYear()}-${String(materialIssues.length + 1).padStart(4, '0')}`;
    const newIssue: MaterialIssue = {
      ...data,
      id: 'mi-' + Date.now(),
      issueNumber: nextNum,
      status: 'POSTED'
    };

    // Update raw materials stock and calculate cost
    let newQty = 0;
    let newTotalVal = 0;
    const mac = data.movingAverageCostEGP;

    setRawMaterials(prev => prev.map(item => {
      if (item.id === data.rawMaterialId) {
        newQty = Math.max(0, (item.currentQty || 0) - data.actualQuantity);
        newTotalVal = newQty * mac;
        return {
          ...item,
          currentQty: newQty,
          totalValue: newTotalVal
        };
      }
      return item;
    }));

    // Update Production Order accumulated material cost
    setProductionOrders(prev => prev.map(order => {
      if (order.id === data.productionOrderId) {
        const currentMatCost = (order.actualMaterialCostEGP || 0) + data.totalActualCostEGP;
        const totalProdCost = currentMatCost + (order.additionalCostEGP || 0);
        const updatedMaterials = (order.materials || []).map(mat => {
          if (mat.rawMaterialId === data.rawMaterialId) {
            return {
              ...mat,
              actualIssuedQty: (mat.actualIssuedQty || 0) + data.actualQuantity,
              actualCostEGP: (mat.actualCostEGP || 0) + data.totalActualCostEGP
            };
          }
          return mat;
        });

        return {
          ...order,
          status: ProductionOrderStatus.MATERIAL_ISSUED,
          materials: updatedMaterials,
          actualMaterialCostEGP: currentMatCost,
          totalProductionCostEGP: totalProdCost
        };
      }
      return order;
    }));

    // Ledger Entry for Consumption
    const wh = warehouses.find(w => w.id === data.warehouseId);
    const ledgerEntry: InventoryLedgerEntry = {
      id: 'ledg-' + Date.now(),
      date: newIssue.date,
      itemId: data.rawMaterialId,
      itemCode: data.rawMaterialCode,
      itemName: data.rawMaterialName,
      itemType: ItemType.RAW_MATERIAL,
      warehouseId: data.warehouseId,
      warehouseName: wh ? (language === 'ar' ? wh.nameAr : wh.nameEn) : 'مستودع التشغيل',
      transactionType: TransactionType.MATERIAL_ISSUE_PRODUCTION,
      documentNumber: nextNum,
      reference: data.productionOrderNumber,
      qtyIn: 0,
      qtyOut: data.actualQuantity,
      balanceQty: newQty,
      unitCostEGP: mac,
      transactionValueEGP: data.totalActualCostEGP,
      runningInventoryValueEGP: newTotalVal,
      movingAverageCostEGP: mac,
      createdBy: currentUser.fullName,
      notes: `صرف خامات لأمر الإنتاج ${data.productionOrderNumber}`
    };

    setLedgerEntries(prev => [...prev, ledgerEntry]);
    setMaterialIssues(prev => [newIssue, ...prev]);

    logAudit('MATERIAL_ISSUE', 'صرف خامات إنتاج', nextNum, `صرف ${data.actualQuantity} ${data.uom} من ${data.rawMaterialName} لأمر ${data.productionOrderNumber}`);

    return newIssue;
  };

  // 7. RECEIPT FROM PRODUCTION (Section 21, 22, 23: Finished Goods receives full material cost, Scrap = 0 EGP, Quality Pending)
  const recordProductionReceipt = (data: Omit<ProductionReceipt, 'id' | 'receiptNumber' | 'status' | 'scrapUnitCostEGP'>) => {
    const nextNum = `PR-${new Date().getFullYear()}-${String(productionReceipts.length + 1).padStart(4, '0')}`;
    const newReceipt: ProductionReceipt = {
      ...data,
      id: 'pr-' + Date.now(),
      receiptNumber: nextNum,
      scrapUnitCostEGP: 0, // Rule 22: Scrap has standard value = 0 EGP in MVP
      status: 'POSTED'
    };

    // Update Production Order status to PENDING_QUALITY
    setProductionOrders(prev => prev.map(order => {
      if (order.id === data.productionOrderId) {
        return {
          ...order,
          receiptNumber: nextNum,
          actualFinishedQuantity: data.finishedQuantity,
          actualScrapQuantity: data.scrapQuantity,
          qualityStatus: QualityStatus.PENDING,
          status: ProductionOrderStatus.PENDING_QUALITY,
          finishedGoodsUnitCostEGP: data.finishedGoodsUnitCostEGP,
          scrapValueEGP: 0,
          finishedGoodsWarehouseId: data.finishedGoodsWarehouseId
        };
      }
      return order;
    }));

    setProductionReceipts(prev => [newReceipt, ...prev]);
    logAudit('PRODUCTION_RECEIPT', 'استلام إنتاج', nextNum, `استلام ${data.finishedQuantity} ${data.uom} منتج تام و ${data.scrapQuantity} ${data.uom} هالك بقيمة 0 ج.م بانتظار فحص الجودة`);

    return newReceipt;
  };

  // 8. QUALITY APPROVAL (Section 24: Quality Manager approves receipt into Finished Goods Warehouse)
  const approveQuality = (productionOrderId: string, decision: QualityStatus, reason: string) => {
    const order = productionOrders.find(o => o.id === productionOrderId);
    const receipt = productionReceipts.find(r => r.productionOrderId === productionOrderId);
    if (!order || !receipt) return;

    const approvalDate = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // If Approved: Finalize FG inventory addition and recalculate Finished Goods Moving Average Cost
    if (decision === QualityStatus.APPROVED) {
      let newFGQty = 0;
      let newFGVal = 0;
      let newFGMAC = 0;

      setProducts(prev => prev.map(prod => {
        if (prod.id === order.productId) {
          const oldQty = prod.currentQty || 0;
          const oldVal = prod.totalValue || 0;
          newFGQty = oldQty + receipt.finishedQuantity;
          newFGVal = oldVal + receipt.totalMaterialCostEGP;
          newFGMAC = newFGQty > 0 ? newFGVal / newFGQty : 0;
          return {
            ...prod,
            currentQty: newFGQty,
            totalValue: newFGVal,
            movingAverageCost: newFGMAC
          };
        }
        return prod;
      }));

      // Finished Goods Warehouse Ledger Entry
      const fgWh = warehouses.find(w => w.id === receipt.finishedGoodsWarehouseId);
      const fgLedger: InventoryLedgerEntry = {
        id: 'ledg-fg-' + Date.now(),
        date: approvalDate,
        itemId: order.productId,
        itemCode: order.productCode,
        itemName: order.productName,
        itemType: ItemType.FINISHED_PRODUCT,
        warehouseId: receipt.finishedGoodsWarehouseId,
        warehouseName: fgWh ? (language === 'ar' ? fgWh.nameAr : fgWh.nameEn) : 'مستودع المنتجات التامة',
        transactionType: TransactionType.FINISHED_GOODS_RECEIPT,
        documentNumber: receipt.receiptNumber,
        reference: order.orderNumber,
        qtyIn: receipt.finishedQuantity,
        qtyOut: 0,
        balanceQty: newFGQty,
        unitCostEGP: receipt.finishedGoodsUnitCostEGP,
        transactionValueEGP: receipt.totalMaterialCostEGP,
        runningInventoryValueEGP: newFGVal,
        movingAverageCostEGP: newFGMAC,
        createdBy: currentUser.fullName,
        notes: `استلام منتج تام بعد اعتماد الجودة (${reason || 'مطابق للمواصفات القياسية'})`
      };

      // Scrap Warehouse Ledger Entry (0 EGP Value)
      const scrapWh = warehouses.find(w => w.id === receipt.scrapWarehouseId);
      const scrapLedger: InventoryLedgerEntry = {
        id: 'ledg-sc-' + (Date.now() + 1),
        date: approvalDate,
        itemId: order.productId,
        itemCode: `SCRAP-${order.productCode}`,
        itemName: `هالك تصنيع - ${order.productName}`,
        itemType: ItemType.RAW_MATERIAL,
        warehouseId: receipt.scrapWarehouseId,
        warehouseName: scrapWh ? (language === 'ar' ? scrapWh.nameAr : scrapWh.nameEn) : 'مستودع الهالك',
        transactionType: TransactionType.SCRAP,
        documentNumber: receipt.receiptNumber,
        reference: order.orderNumber,
        qtyIn: receipt.scrapQuantity,
        qtyOut: 0,
        balanceQty: receipt.scrapQuantity,
        unitCostEGP: 0,
        transactionValueEGP: 0,
        runningInventoryValueEGP: 0,
        movingAverageCostEGP: 0,
        createdBy: currentUser.fullName,
        notes: 'هالك تصنيع مسجل بقيمة معيارية 0 ج.م حسب معيار MVP'
      };

      setLedgerEntries(prev => [...prev, fgLedger, scrapLedger]);

      // Update Production Order
      setProductionOrders(prev => prev.map(o => {
        if (o.id === productionOrderId) {
          return {
            ...o,
            qualityStatus: QualityStatus.APPROVED,
            status: ProductionOrderStatus.COMPLETED,
            qualityApprovedBy: currentUser.fullName,
            qualityApprovalDate: approvalDate,
            qualityNotes: reason
          };
        }
        return o;
      }));

      // Update Production Receipt
      setProductionReceipts(prev => prev.map(r => {
        if (r.productionOrderId === productionOrderId) {
          return {
            ...r,
            qualityStatus: QualityStatus.APPROVED,
            qualityApprovedBy: currentUser.fullName,
            qualityApprovalDate: approvalDate,
            qualityDecisionReason: reason
          };
        }
        return r;
      }));

      logAudit('QUALITY_APPROVAL', 'اعتماد الجودة', receipt.receiptNumber, `اعتماد استلام ${receipt.finishedQuantity} كجم منتج تام بعد الفحص المخبري`);
    } else {
      // Rejected
      setProductionOrders(prev => prev.map(o => {
        if (o.id === productionOrderId) {
          return {
            ...o,
            qualityStatus: QualityStatus.REJECTED,
            qualityApprovedBy: currentUser.fullName,
            qualityApprovalDate: approvalDate,
            qualityNotes: `مرفوض: ${reason}`
          };
        }
        return o;
      }));

      setProductionReceipts(prev => prev.map(r => {
        if (r.productionOrderId === productionOrderId) {
          return {
            ...r,
            qualityStatus: QualityStatus.REJECTED,
            qualityApprovedBy: currentUser.fullName,
            qualityApprovalDate: approvalDate,
            qualityDecisionReason: reason
          };
        }
        return r;
      }));

      logAudit('QUALITY_REJECTION', 'رفض الجودة', receipt.receiptNumber, `رفض استلام الدفعة لعدم المطابقة: ${reason}`);
    }
  };

  // 9. CUSTOMER DELIVERY / FINISHED GOODS ISSUE (Section 25: Delivery at current FG MAC)
  const addCustomerDelivery = (data: Omit<CustomerDelivery, 'id' | 'deliveryNumber' | 'createdDate' | 'status'>) => {
    const nextNum = `DEL-${new Date().getFullYear()}-${String(customerDeliveries.length + 1).padStart(4, '0')}`;
    const newDelivery: CustomerDelivery = {
      ...data,
      id: 'del-' + Date.now(),
      deliveryNumber: nextNum,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'POSTED',
      odooSynced: odooConfig.isConnected
    };

    let newQty = 0;
    let newTotalVal = 0;
    const mac = data.movingAverageCostEGP;

    setProducts(prev => prev.map(prod => {
      if (prod.id === data.productId) {
        newQty = Math.max(0, (prod.currentQty || 0) - data.quantity);
        newTotalVal = newQty * mac;
        return {
          ...prod,
          currentQty: newQty,
          totalValue: newTotalVal
        };
      }
      return prod;
    }));

    const wh = warehouses.find(w => w.id === data.warehouseId);
    const ledgerEntry: InventoryLedgerEntry = {
      id: 'ledg-' + Date.now(),
      date: newDelivery.createdDate,
      itemId: data.productId,
      itemCode: data.productCode,
      itemName: data.productName,
      itemType: ItemType.FINISHED_PRODUCT,
      warehouseId: data.warehouseId,
      warehouseName: wh ? (language === 'ar' ? wh.nameAr : wh.nameEn) : 'مستودع المنتجات التامة',
      transactionType: TransactionType.CUSTOMER_DELIVERY,
      documentNumber: nextNum,
      reference: `${data.customerName} - ${data.reference || ''}`,
      qtyIn: 0,
      qtyOut: data.quantity,
      balanceQty: newQty,
      unitCostEGP: mac,
      transactionValueEGP: data.totalDeliveryValueEGP,
      runningInventoryValueEGP: newTotalVal,
      movingAverageCostEGP: mac,
      createdBy: currentUser.fullName,
      notes: data.notes
    };

    setLedgerEntries(prev => [...prev, ledgerEntry]);
    setCustomerDeliveries(prev => [newDelivery, ...prev]);

    logAudit('CUSTOMER_DELIVERY', 'تسليم عميل', nextNum, `صرف ${data.quantity} ${data.uom} للعميل ${data.customerName} بتكلفة مبيعات ${data.totalDeliveryValueEGP.toLocaleString('en-US')} ج.م`);

    return newDelivery;
  };

  // 10. FUTURE COST ADJUSTMENT & IMPACT CALCULATION (Section 40-48)
  const addCostAdjustment = (data: Omit<ProductionOrderCostAdjustment, 'id' | 'adjustmentNumber' | 'status' | 'originalProductionCostEGP' | 'revisedProductionCostEGP' | 'quantityProduced' | 'quantityInStock' | 'quantityIssuedOrSold' | 'inventoryAdjustmentEGP' | 'cogsAdjustmentEGP'>) => {
    const nextNum = `CA-${new Date().getFullYear()}-${String(costAdjustments.length + 1).padStart(4, '0')}`;
    const order = productionOrders.find(o => o.id === data.productionOrderId);

    const origCost = order ? order.totalProductionCostEGP : 0;
    const addedAmount = data.amountEGP;
    const revisedCost = origCost + addedAmount;
    const qtyProduced = order ? order.actualFinishedQuantity || order.plannedQuantity : 0;

    // Find how much has been delivered to customers from this product
    const product = products.find(p => p.id === (order ? order.productId : ''));
    const qtyInStock = product ? product.currentQty : 0;
    const qtyIssuedOrSold = Math.max(0, qtyProduced - qtyInStock);

    // Impact Allocation Rule (Section 43 & 48)
    const stockRatio = qtyProduced > 0 ? (qtyInStock / qtyProduced) : 0;
    const soldRatio = qtyProduced > 0 ? (qtyIssuedOrSold / qtyProduced) : 0;

    const inventoryAdj = addedAmount * stockRatio;
    const cogsAdj = addedAmount * soldRatio;

    const newAdjustment: ProductionOrderCostAdjustment = {
      ...data,
      id: 'ca-' + Date.now(),
      adjustmentNumber: nextNum,
      status: 'POSTED',
      originalProductionCostEGP: origCost,
      revisedProductionCostEGP: revisedCost,
      quantityProduced: qtyProduced,
      quantityInStock: qtyInStock,
      quantityIssuedOrSold: qtyIssuedOrSold,
      inventoryAdjustmentEGP: inventoryAdj,
      cogsAdjustmentEGP: cogsAdj,
      approvedBy: currentUser.fullName,
      approvalDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    // Update production order additional cost
    setProductionOrders(prev => prev.map(o => {
      if (o.id === data.productionOrderId) {
        const newAdditional = (o.additionalCostEGP || 0) + addedAmount;
        const newTotal = (o.actualMaterialCostEGP || 0) + newAdditional;
        const newUnitCost = qtyProduced > 0 ? newTotal / qtyProduced : o.finishedGoodsUnitCostEGP;
        return {
          ...o,
          additionalCostEGP: newAdditional,
          totalProductionCostEGP: newTotal,
          finishedGoodsUnitCostEGP: newUnitCost
        };
      }
      return o;
    }));

    // Update Product Moving Average Cost with the inventory portion
    if (product && qtyInStock > 0 && inventoryAdj > 0) {
      setProducts(prev => prev.map(p => {
        if (p.id === product.id) {
          const updatedVal = (p.totalValue || 0) + inventoryAdj;
          const updatedMAC = qtyInStock > 0 ? updatedVal / qtyInStock : p.movingAverageCost;
          return {
            ...p,
            totalValue: updatedVal,
            movingAverageCost: updatedMAC
          };
        }
        return p;
      }));

      // Ledger entry for cost adjustment on inventory
      const ledgerEntry: InventoryLedgerEntry = {
        id: 'ledg-' + Date.now(),
        date: newAdjustment.date,
        itemId: product.id,
        itemCode: product.code,
        itemName: product.nameAr,
        itemType: ItemType.FINISHED_PRODUCT,
        warehouseId: product.defaultWarehouseId,
        warehouseName: 'مستودع المنتجات التامة',
        transactionType: TransactionType.COST_ADJUSTMENT,
        documentNumber: nextNum,
        reference: order?.orderNumber,
        qtyIn: 0,
        qtyOut: 0,
        balanceQty: qtyInStock,
        unitCostEGP: 0,
        transactionValueEGP: inventoryAdj,
        runningInventoryValueEGP: (product.totalValue || 0) + inventoryAdj,
        movingAverageCostEGP: ((product.totalValue || 0) + inventoryAdj) / qtyInStock,
        createdBy: currentUser.fullName,
        notes: `تعديل تكلفة إضافية (${data.costType}) للمخزون القائم: ${inventoryAdj.toLocaleString('en-US')} ج.م، ولتكلفة المبيعات: ${cogsAdj.toLocaleString('en-US')} ج.م`
      };
      setLedgerEntries(prev => [...prev, ledgerEntry]);
    }

    setCostAdjustments(prev => [newAdjustment, ...prev]);
    logAudit('POST_COST_ADJUSTMENT', 'تعديل تكاليف الإنتاج', nextNum, `إضافة تكلفة ${addedAmount.toLocaleString('en-US')} ج.م على أمر الإنتاج ${order?.orderNumber} (${data.costType})`);

    return newAdjustment;
  };

  // 11. CANCEL / REVERSE TRANSACTION (Section 1: Posted transactions cannot be deleted; use Cancel / Reverse)
  const cancelTransaction = (docType: string, docNum: string, reason: string) => {
    // Record Reversal in Audit Trail
    logAudit('REVERSE_TRANSACTION', docType, docNum, `إلغاء وعكس العملية المستندية: ${reason}`);

    // Update status in respective table
    if (docType.includes('إذن إضافة') || docType.includes('Receipt')) {
      setReceipts(prev => prev.map(r => r.receiptNumber === docNum ? { ...r, status: 'CANCELLED' } : r));
    } else if (docType.includes('إنزال') || docType.includes('Landed')) {
      setLandedCosts(prev => prev.map(lc => lc.landedCostNumber === docNum ? { ...lc, status: 'CANCELLED' } : lc));
    } else if (docType.includes('صرف') || docType.includes('Issue')) {
      setIssues(prev => prev.map(i => i.issueNumber === docNum ? { ...i, status: 'CANCELLED' } : i));
    } else if (docType.includes('تحويل') || docType.includes('Transfer')) {
      setTransfers(prev => prev.map(t => t.transferNumber === docNum ? { ...t, status: 'CANCELLED' } : t));
    } else if (docType.includes('أمر إنتاج') || docType.includes('Production Order')) {
      setProductionOrders(prev => prev.map(po => po.orderNumber === docNum ? { ...po, status: ProductionOrderStatus.CANCELLED } : po));
    } else if (docType.includes('تسليم عميل') || docType.includes('Delivery')) {
      setCustomerDeliveries(prev => prev.map(d => d.deliveryNumber === docNum ? { ...d, status: 'CANCELLED' } : d));
    }

    // Add REVERSAL ledger entry to keep history clean and transparent
    const ledgerEntry: InventoryLedgerEntry = {
      id: 'ledg-rev-' + Date.now(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      itemId: 'REVERSAL',
      itemCode: 'REV',
      itemName: `عكس قيد ${docType} ${docNum}`,
      itemType: ItemType.RAW_MATERIAL,
      warehouseId: 'REV',
      warehouseName: 'قيد عكسي',
      transactionType: TransactionType.REVERSAL,
      documentNumber: docNum,
      reference: 'إلغاء مستند',
      qtyIn: 0,
      qtyOut: 0,
      balanceQty: 0,
      unitCostEGP: 0,
      transactionValueEGP: 0,
      runningInventoryValueEGP: 0,
      movingAverageCostEGP: 0,
      createdBy: currentUser.fullName,
      notes: `تم الإلغاء والعكس بسبب: ${reason}`
    };
    setLedgerEntries(prev => [...prev, ledgerEntry]);
  };

  // Master Data Save Helpers
  const saveRawMaterial = (item: RawMaterial) => {
    setRawMaterials(prev => {
      const exists = prev.find(p => p.id === item.id);
      if (exists) return prev.map(p => p.id === item.id ? item : p);
      return [...prev, item];
    });
    logAudit('SAVE_RAW_MATERIAL', 'خامات أولية', item.code, `حفظ بيانات المادة الخام ${item.nameAr}`);
  };

  const saveProduct = (product: Product) => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) return prev.map(p => p.id === product.id ? product : p);
      return [...prev, product];
    });
    logAudit('SAVE_PRODUCT', 'منتجات', product.code, `حفظ بيانات المنتج ${product.nameAr}`);
  };

  const saveBOM = (bom: BOM) => {
    setBoms(prev => {
      const exists = prev.find(b => b.id === bom.id);
      if (exists) return prev.map(b => b.id === bom.id ? bom : b);
      return [...prev, bom];
    });
    logAudit('SAVE_BOM', 'قائمة المواد BOM', bom.code, `حفظ أو تحديث قائمة مواد ${bom.nameAr}`);
  };

  const saveMachine = (machine: Machine) => {
    setMachines(prev => {
      const exists = prev.find(m => m.id === machine.id);
      if (exists) return prev.map(m => m.id === machine.id ? machine : m);
      return [...prev, machine];
    });
    logAudit('SAVE_MACHINE', 'ماكينات', machine.code, `حفظ بيانات الماكينة ${machine.nameAr}`);
  };

  const saveSupplier = (supplier: Supplier) => {
    setSuppliers(prev => {
      const exists = prev.find(s => s.id === supplier.id);
      if (exists) return prev.map(s => s.id === supplier.id ? supplier : s);
      return [...prev, supplier];
    });
    logAudit('SAVE_SUPPLIER', 'موردين', supplier.code, `حفظ بيانات المورد ${supplier.nameAr}`);
  };

  const saveCustomer = (customer: Customer) => {
    setCustomers(prev => {
      const exists = prev.find(c => c.id === customer.id);
      if (exists) return prev.map(c => c.id === customer.id ? customer : c);
      return [...prev, customer];
    });
    logAudit('SAVE_CUSTOMER', 'عملاء', customer.code, `حفظ بيانات العميل ${customer.nameAr}`);
  };

  const saveWarehouse = (wh: Warehouse) => {
    setWarehouses(prev => {
      const exists = prev.find(w => w.id === wh.id);
      if (exists) return prev.map(w => w.id === wh.id ? wh : w);
      return [...prev, wh];
    });
    logAudit('SAVE_WAREHOUSE', 'مستودعات', wh.code, `حفظ بيانات المستودع ${wh.nameAr}`);
  };

  const saveLocation = (loc: ProductionLocation) => {
    setLocations(prev => {
      const exists = prev.find(l => l.id === loc.id);
      if (exists) return prev.map(l => l.id === loc.id ? loc : l);
      return [...prev, loc];
    });
    logAudit('SAVE_LOCATION', 'مواقع الإنتاج', loc.code, `حفظ بيانات موقع الإنتاج ${loc.nameAr}`);
  };

  const deleteRawMaterial = (id: string) => {
    const item = rawMaterials.find(r => r.id === id);
    setRawMaterials(prev => prev.filter(r => r.id !== id));
    logAudit('DELETE_RAW_MATERIAL', 'خامات أولية', item?.code || id, `حذف المادة الخام ${item?.nameAr || id}`);
  };

  const deleteProduct = (id: string) => {
    const item = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    logAudit('DELETE_PRODUCT', 'منتجات', item?.code || id, `حذف المنتج ${item?.nameAr || id}`);
  };

  const deleteBOM = (id: string) => {
    const item = boms.find(b => b.id === id);
    setBoms(prev => prev.filter(b => b.id !== id));
    logAudit('DELETE_BOM', 'قوائم المواد', item?.code || id, `حذف قائمة المواد BOM ${item?.nameAr || id}`);
  };

  const deleteMachine = (id: string) => {
    const item = machines.find(m => m.id === id);
    setMachines(prev => prev.filter(m => m.id !== id));
    logAudit('DELETE_MACHINE', 'ماكينات', item?.code || id, `حذف الماكينة ${item?.nameAr || id}`);
  };

  const deleteSupplier = (id: string) => {
    const item = suppliers.find(s => s.id === id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    logAudit('DELETE_SUPPLIER', 'موردين', item?.code || id, `حذف المورد ${item?.nameAr || id}`);
  };

  const deleteCustomer = (id: string) => {
    const item = customers.find(c => c.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    logAudit('DELETE_CUSTOMER', 'عملاء', item?.code || id, `حذف العميل ${item?.nameAr || id}`);
  };

  const deleteWarehouse = (id: string) => {
    const item = warehouses.find(w => w.id === id);
    setWarehouses(prev => prev.filter(w => w.id !== id));
    logAudit('DELETE_WAREHOUSE', 'مستودعات', item?.code || id, `حذف المستودع ${item?.nameAr || id}`);
  };

  const deleteLocation = (id: string) => {
    const item = locations.find(l => l.id === id);
    setLocations(prev => prev.filter(l => l.id !== id));
    logAudit('DELETE_LOCATION', 'مواقع الإنتاج', item?.code || id, `حذف موقع الإنتاج ${item?.nameAr || id}`);
  };

  const saveUOM = (uom: UOM) => {
    setUoms(prev => {
      const exists = prev.find(u => u.id === uom.id);
      if (exists) return prev.map(u => u.id === uom.id ? u : uom);
      return [...prev, uom];
    });
    logAudit('SAVE_UOM', 'وحدات القياس', uom.code, `حفظ وحدة القياس ${uom.nameAr}`);
  };

  const deleteUOM = (id: string) => {
    const item = uoms.find(u => u.id === id);
    setUoms(prev => prev.filter(u => u.id !== id));
    logAudit('DELETE_UOM', 'وحدات القياس', item?.code || id, `حذف وحدة القياس ${item?.nameAr || id}`);
  };

  const saveCurrency = (currency: Currency) => {
    setCurrencies(prev => {
      const exists = prev.find(c => c.id === currency.id);
      if (exists) return prev.map(c => c.id === currency.id ? currency : c);
      return [...prev, currency];
    });
    logAudit('SAVE_CURRENCY', 'العملات', currency.code, `حفظ العملة ${currency.nameAr}`);
  };

  const deleteCurrency = (id: string) => {
    const item = currencies.find(c => c.id === id);
    setCurrencies(prev => prev.filter(c => c.id !== id));
    logAudit('DELETE_CURRENCY', 'العملات', item?.code || id, `حذف العملة ${item?.nameAr || id}`);
  };

  const saveUser = (user: User) => {
    setUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) return prev.map(u => u.id === user.id ? user : u);
      return [...prev, user];
    });
    logAudit('SAVE_USER', 'المستخدمين', user.username, `حفظ بيانات المستخدم ${user.fullName}`);
  };

  const deleteUser = (id: string) => {
    const item = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    logAudit('DELETE_USER', 'المستخدمين', item?.username || id, `حذف المستخدم ${item?.fullName || id}`);
  };

  // ODOO INTEGRATION ACTIONS
  const testOdooConnection = async (): Promise<boolean> => {
    const res = await odooService.testConnection(odooConfig);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setOdooConfig(prev => ({
      ...prev,
      isConnected: res.success,
      lastTestedDate: now
    }));

    const log: OdooSyncLog = {
      id: 'sync-' + Date.now(),
      timestamp: now,
      model: 'res.partner',
      action: 'SYNC',
      recordsCount: res.uid ? 1 : 0,
      status: res.success ? 'SUCCESS' : 'FAILED',
      details: res.message
    };
    setOdooLogs(prev => [log, ...prev]);
    return res.success;
  };

  const syncOdooEntity = async (entity: 'CUSTOMERS' | 'INVENTORY' | 'PRODUCTION') => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    let log: OdooSyncLog;

    if (entity === 'CUSTOMERS') {
      const res = await odooService.syncCustomers(odooConfig, customers);
      if (res.importedCustomers && res.importedCustomers.length > 0) {
        setCustomers(prev => {
          const existingCodes = new Set(prev.map(c => c.code));
          const toAdd = res.importedCustomers!.filter(c => !existingCodes.has(c.code));
          return [...toAdd, ...prev];
        });
      }
      log = {
        id: 'sync-' + Date.now(),
        timestamp: now,
        model: 'res.partner',
        action: 'SYNC',
        recordsCount: res.recordsCount,
        status: res.success ? 'SUCCESS' : 'FAILED',
        details: res.details
      };
    } else if (entity === 'INVENTORY') {
      const res = await odooService.syncInventory(odooConfig, rawMaterials, products);
      log = {
        id: 'sync-' + Date.now(),
        timestamp: now,
        model: 'stock.quant',
        action: 'EXPORT',
        recordsCount: res.recordsCount,
        status: res.success ? 'SUCCESS' : 'FAILED',
        details: res.details
      };
    } else {
      const res = await odooService.syncProduction(odooConfig, productionOrders);
      log = {
        id: 'sync-' + Date.now(),
        timestamp: now,
        model: 'mrp.production',
        action: 'SYNC',
        recordsCount: res.recordsCount,
        status: res.success ? 'SUCCESS' : 'FAILED',
        details: res.details
      };
    }

    setOdooLogs(prev => [log, ...prev]);
    setOdooConfig(prev => ({ ...prev, lastSyncDate: now, isConnected: true }));
  };

  const fullOdooSync = async () => {
    await syncOdooEntity('CUSTOMERS');
    await syncOdooEntity('INVENTORY');
    await syncOdooEntity('PRODUCTION');
  };

  // Reset to Sample MVP Walkthrough (Section 47)
  const resetToSampleMVP = () => {
    localStorage.clear();
    setWarehouses(INITIAL_WAREHOUSES);
    setLocations(INITIAL_LOCATIONS);
    setRawMaterials(INITIAL_RAW_MATERIALS);
    setProducts(INITIAL_PRODUCTS);
    setMachines(INITIAL_MACHINES);
    setSuppliers(INITIAL_SUPPLIERS);
    setCustomers(INITIAL_CUSTOMERS);
    setBoms(INITIAL_BOMS);
    setReceipts(INITIAL_RECEIPTS);
    setLandedCosts(INITIAL_LANDED_COSTS);
    setIssues([]);
    setTransfers(INITIAL_TRANSFERS);
    setProductionOrders(INITIAL_PRODUCTION_ORDERS);
    setMaterialIssues(INITIAL_MATERIAL_ISSUES);
    setProductionReceipts(INITIAL_PRODUCTION_RECEIPTS);
    setCustomerDeliveries(INITIAL_CUSTOMER_DELIVERIES);
    setCostAdjustments(INITIAL_COST_ADJUSTMENTS);
    setLedgerEntries(INITIAL_LEDGER_ENTRIES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setOdooConfig(INITIAL_ODOO_CONFIG);
    setOdooLogs(INITIAL_ODOO_LOGS);
    logAudit('RESET_SYSTEM', 'النظام', 'RESET', 'تمت إعادة ضبط النظام إلى دورة العمل المعيارية النموذجية');
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currentUser,
        setCurrentUser,
        users,
        setUsers,
        warehouses,
        locations,
        uoms,
        currencies,
        rawMaterials,
        products,
        machines,
        suppliers,
        customers,
        boms,
        receipts,
        landedCosts,
        issues,
        transfers,
        productionOrders,
        materialIssues,
        productionReceipts,
        customerDeliveries,
        costAdjustments,
        ledgerEntries,
        auditLogs,
        odooConfig,
        odooLogs,
        setOdooConfig,
        addReceipt,
        addLandedCost,
        addIssue,
        addTransfer,
        createProductionOrder,
        modifyProductionOrder,
        issueMaterialToProduction,
        recordProductionReceipt,
        approveQuality,
        addCustomerDelivery,
        addCostAdjustment,
        cancelTransaction,
        resetToSampleMVP,
        saveRawMaterial,
        deleteRawMaterial,
        saveProduct,
        deleteProduct,
        saveBOM,
        deleteBOM,
        saveMachine,
        deleteMachine,
        saveSupplier,
        deleteSupplier,
        saveCustomer,
        deleteCustomer,
        saveWarehouse,
        deleteWarehouse,
        saveLocation,
        deleteLocation,
        saveUOM,
        deleteUOM,
        saveCurrency,
        deleteCurrency,
        saveUser,
        deleteUser,
        testOdooConnection,
        syncOdooEntity,
        fullOdooSync
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
