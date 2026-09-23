import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  User,
  UserRole,
  Warehouse,
  ProductionLocation,
  UOM,
  Currency,
  CurrencyRate,
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
  OdooSyncLog,
  ItemCategory,
  ItemWarehouseStock
} from '../types';
import {
  INITIAL_WAREHOUSES,
  INITIAL_LOCATIONS,
  INITIAL_UOMS,
  INITIAL_CURRENCIES,
  INITIAL_CURRENCY_RATES,
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
  INITIAL_ITEM_CATEGORIES,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_MATERIAL_ISSUES,
  INITIAL_PRODUCTION_RECEIPTS,
  INITIAL_CUSTOMER_DELIVERIES,
  INITIAL_COST_ADJUSTMENTS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_ODOO_CONFIG,
  INITIAL_ODOO_LOGS,
  SAMPLE_RAW_MATERIALS,
  SAMPLE_PRODUCTS,
  SAMPLE_MACHINES,
  SAMPLE_SUPPLIERS,
  SAMPLE_CUSTOMERS,
  SAMPLE_BOMS,
  SAMPLE_RECEIPTS,
  SAMPLE_LANDED_COSTS,
  SAMPLE_TRANSFERS,
  SAMPLE_PRODUCTION_ORDERS,
  SAMPLE_MATERIAL_ISSUES,
  SAMPLE_PRODUCTION_RECEIPTS,
  SAMPLE_CUSTOMER_DELIVERIES,
  SAMPLE_COST_ADJUSTMENTS,
  SAMPLE_LEDGER_ENTRIES,
  SAMPLE_AUDIT_LOGS
} from '../data/initialData';
import { odooService } from '../services/odooService';
import { authService } from '../services/authService';
import { offlineSyncQueue } from '../services/offlineSyncQueue';
import {
  SEED_USERS,
  SEED_WAREHOUSES,
  SEED_LOCATIONS,
  SEED_UOMS,
  SEED_CURRENCIES,
  SEED_RAW_MATERIALS,
  SEED_PRODUCTS,
  SEED_MACHINES,
  SEED_SUPPLIERS,
  SEED_CUSTOMERS,
  SEED_BOMS,
  SEED_RECEIPTS,
  SEED_LANDED_COSTS,
  SEED_TRANSFERS,
  SEED_ISSUES,
  SEED_PRODUCTION_ORDERS,
  SEED_MATERIAL_ISSUES,
  SEED_PRODUCTION_RECEIPTS,
  SEED_CUSTOMER_DELIVERIES,
  SEED_COST_ADJUSTMENTS,
  SEED_LEDGER_ENTRIES,
  SEED_AUDIT_LOGS
} from '../data/seedData';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;

  // Master Data
  warehouses: Warehouse[];
  locations: ProductionLocation[];
  uoms: UOM[];
  currencies: Currency[];
  currencyRates: CurrencyRate[];
  saveCurrencyRate: (rate: Omit<CurrencyRate, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteCurrencyRate: (id: string) => void;
  getExchangeRateForDate: (currencyCode: string, date?: string) => { rate: number; rateDate: string; isExact: boolean; source?: string };
  clearSeedDataAndStartScratch: () => void;
  itemCategories: ItemCategory[];
  saveItemCategory: (category: ItemCategory) => void;
  deleteItemCategory: (id: string) => void;
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
  seedFullCoverageData: () => void;

  // Warehouse-Level Valuation (Item + Warehouse = Independent Valuation Layer)
  getItemWarehouseValuation: (itemId: string, warehouseId: string) => ItemWarehouseStock;
  getAllItemWarehouseStocks: (itemId: string) => ItemWarehouseStock[];

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

const OLD_STORAGE_PREFIX = 'mfg_inv_odoo_v1_';
const STORAGE_PREFIX = 'mfg_inv_odoo_v2_';

// Automatic clean-slate migration:
// Clears all demo inventory, raw materials, products, receipts, production orders, scrap, ledger entries, etc.
// Preserves users, current session, warehouses, UOMs, currencies, and Odoo config.
(function initializeCleanState() {
  if (typeof window === 'undefined') return;
  const migratedKey = 'mfg_clean_slate_v2_applied';
  if (!localStorage.getItem(migratedKey)) {
    try {
      // 1. Preserve existing users if present
      const existingV1Users = localStorage.getItem(OLD_STORAGE_PREFIX + 'users');
      if (existingV1Users && !localStorage.getItem(STORAGE_PREFIX + 'users')) {
        localStorage.setItem(STORAGE_PREFIX + 'users', existingV1Users);
      }
      const existingV1User = localStorage.getItem(OLD_STORAGE_PREFIX + 'user');
      if (existingV1User && !localStorage.getItem(STORAGE_PREFIX + 'user')) {
        localStorage.setItem(STORAGE_PREFIX + 'user', existingV1User);
      }
      const existingLang = localStorage.getItem(OLD_STORAGE_PREFIX + 'lang');
      if (existingLang && !localStorage.getItem(STORAGE_PREFIX + 'lang')) {
        localStorage.setItem(STORAGE_PREFIX + 'lang', existingLang);
      }
      const existingOdoo = localStorage.getItem(OLD_STORAGE_PREFIX + 'odooConfig');
      if (existingOdoo && !localStorage.getItem(STORAGE_PREFIX + 'odooConfig')) {
        localStorage.setItem(STORAGE_PREFIX + 'odooConfig', existingOdoo);
      }

      // 2. Clear all demo/sample inventory, product, and transactional keys to empty arrays
      const entityKeysToClear = [
        'rawMaterials',
        'products',
        'boms',
        'machines',
        'suppliers',
        'customers',
        'receipts',
        'landedCosts',
        'issues',
        'transfers',
        'productionOrders',
        'materialIssues',
        'productionReceipts',
        'customerDeliveries',
        'costAdjustments',
        'ledgerEntries',
        'auditLogs'
      ];

      entityKeysToClear.forEach(key => {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify([]));
        localStorage.removeItem(OLD_STORAGE_PREFIX + key);
      });

      // 3. Remove all remaining old v1 keys from localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(OLD_STORAGE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }

      localStorage.setItem(migratedKey, 'true');
    } catch (err) {
      console.warn('Storage clean slate initialization note:', err);
    }
  }
})();

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

/**
 * Auto-heals and normalizes inventory ledger entries:
 * Specifically for LANDED_COST transactions where balanceQty, runningInventoryValueEGP,
 * or MAC might have been stored as 0 due to asynchronous state batching in prior versions.
 */
function healLedgerEntries(
  entries: InventoryLedgerEntry[],
  rawMats: RawMaterial[],
  prods: Product[],
  rcpts: InventoryReceipt[]
): InventoryLedgerEntry[] {
  if (!entries || entries.length === 0) return entries;
  let hasChanges = false;

  const healed = entries.map((entry, idx) => {
    if (entry.transactionType === TransactionType.LANDED_COST) {
      if (
        entry.balanceQty === 0 ||
        entry.runningInventoryValueEGP === 0 ||
        entry.movingAverageCostEGP === 0 ||
        !entry.uom ||
        entry.itemCode === entry.itemId
      ) {
        hasChanges = true;
        // Find preceding entry for the same item in the ledger
        let prevEntry: InventoryLedgerEntry | undefined;
        for (let j = idx - 1; j >= 0; j--) {
          if (entries[j].itemId === entry.itemId) {
            prevEntry = entries[j];
            break;
          }
        }

        const item = rawMats.find(m => m.id === entry.itemId) || prods.find(p => p.id === entry.itemId);
        const receipt = rcpts.find(
          r => r.receiptNumber === entry.reference || r.id === entry.reference || r.itemId === entry.itemId
        );

        const balanceQty = (prevEntry && prevEntry.balanceQty > 0)
          ? prevEntry.balanceQty
          : (item?.currentQty || receipt?.baseQuantity || receipt?.quantity || entry.balanceQty);

        const baseVal = (prevEntry && prevEntry.runningInventoryValueEGP > 0)
          ? prevEntry.runningInventoryValueEGP
          : (receipt?.totalValueEGP || (balanceQty * (item?.movingAverageCost || 0)));

        const runningVal = entry.runningInventoryValueEGP > 0
          ? entry.runningInventoryValueEGP
          : (baseVal + (entry.transactionValueEGP || 0));

        const mac = entry.movingAverageCostEGP > 0
          ? entry.movingAverageCostEGP
          : (balanceQty > 0 ? (runningVal / balanceQty) : (item?.movingAverageCost || 0));

        const uom = entry.uom || prevEntry?.uom || receipt?.baseUOM || receipt?.uom || item?.defaultUOM || 'KG';
        const itemCode = (item?.code) || prevEntry?.itemCode || receipt?.itemCode || entry.itemCode;
        const itemName = (item?.nameAr) || prevEntry?.itemName || receipt?.itemName || entry.itemName;

        return {
          ...entry,
          balanceQty,
          runningInventoryValueEGP: runningVal,
          movingAverageCostEGP: mac,
          uom,
          itemCode,
          itemName
        };
      }
    }
    return entry;
  });

  return hasChanges ? healed : entries;
}

/**
 * Computes warehouse-specific valuation layers (Item + Warehouse = Independent Valuation Layer)
 * Strictly adheres to SAP Business One inventory valuation rules:
 * - Each warehouse maintains independent currentQty, movingAverageCost, and totalValue
 * - Transfers take source warehouse's MAC and recalculate destination warehouse's MAC
 * - Landed costs allocate value to the receiving warehouse layer
 */
export function computeItemWarehouseStockMap(
  item: RawMaterial | Product,
  entries: InventoryLedgerEntry[],
  defaultWhId?: string
): Record<string, ItemWarehouseStock> {
  const itemEntries = (entries || []).filter(e => e.itemId === item.id);
  const whMap: Record<string, ItemWarehouseStock> = {};
  const fallbackWh = defaultWhId || item.defaultWarehouseId || 'wh-raw';

  // If no ledger entries exist yet, use item's initial state
  if (itemEntries.length === 0) {
    if (item.warehouseStock && Object.keys(item.warehouseStock).length > 0) {
      return item.warehouseStock;
    }
    whMap[fallbackWh] = {
      warehouseId: fallbackWh,
      currentQty: item.currentQty || 0,
      movingAverageCost: item.movingAverageCost || 0,
      totalValue: item.totalValue || ((item.currentQty || 0) * (item.movingAverageCost || 0))
    };
    return whMap;
  }

  // Sort chronologically
  const sorted = [...itemEntries].sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  for (const entry of sorted) {
    const whId = entry.warehouseId;
    if (!whId) continue;
    if (!whMap[whId]) {
      whMap[whId] = {
        warehouseId: whId,
        warehouseName: entry.warehouseName,
        currentQty: 0,
        movingAverageCost: 0,
        totalValue: 0
      };
    }

    const ws = whMap[whId];

    if (entry.transactionType === TransactionType.LANDED_COST) {
      // Landed cost increases valuation layer without changing quantity
      const addedVal = entry.transactionValueEGP || 0;
      ws.totalValue += addedVal;
      ws.movingAverageCost = ws.currentQty > 0 ? (ws.totalValue / ws.currentQty) : (entry.movingAverageCostEGP || ws.movingAverageCost);
    } else if (entry.transactionType === TransactionType.COST_ADJUSTMENT) {
      const addedVal = entry.transactionValueEGP || 0;
      ws.totalValue += addedVal;
      ws.movingAverageCost = ws.currentQty > 0 ? (ws.totalValue / ws.currentQty) : ws.movingAverageCost;
    } else {
      if (entry.qtyIn > 0) {
        const inVal = entry.transactionValueEGP || (entry.qtyIn * entry.unitCostEGP);
        const newQty = ws.currentQty + entry.qtyIn;
        const newVal = ws.totalValue + inVal;
        ws.currentQty = newQty;
        ws.totalValue = newVal;
        ws.movingAverageCost = newQty > 0 ? (newVal / newQty) : (entry.unitCostEGP || 0);
      }
      if (entry.qtyOut > 0) {
        const outVal = entry.transactionValueEGP || (entry.qtyOut * ws.movingAverageCost);
        ws.currentQty = Math.max(0, ws.currentQty - entry.qtyOut);
        ws.totalValue = Math.max(0, ws.totalValue - outVal);
        if (ws.currentQty === 0) {
          ws.totalValue = 0;
        }
        // MAC in warehouse remains unchanged on outward consumption/transfer
      }
    }
  }

  if (Object.keys(whMap).length === 0) {
    whMap[fallbackWh] = {
      warehouseId: fallbackWh,
      currentQty: 0,
      movingAverageCost: 0,
      totalValue: 0
    };
  }

  return whMap;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => loadStorage<Language>('lang', 'ar'));
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    // Check auth token or stored user
    const token = authService.getToken();
    const storedUser = authService.getStoredUser();
    if (token && storedUser) return storedUser;
    // Check saved user in storage
    const saved = loadStorage<User | null>('user', null);
    if (saved && saved.id) return saved;
    return null;
  });
  const [users, setUsers] = useState<User[]>(() => loadStorage<User[]>('users', INITIAL_USERS));

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => loadStorage('warehouses', INITIAL_WAREHOUSES));
  const [locations, setLocations] = useState<ProductionLocation[]>(() => loadStorage('locations', INITIAL_LOCATIONS));
  const [uoms, setUoms] = useState<UOM[]>(() => {
    const loaded = loadStorage<UOM[]>('uoms', INITIAL_UOMS);
    if (!loaded || loaded.length === 0) return INITIAL_UOMS;
    const codes = new Set(loaded.map(u => u.code.toUpperCase()));
    const merged: UOM[] = loaded.map(u => ({
      ...u,
      uomType: u.uomType || (u.baseUOM && u.baseUOM !== u.code ? 'SECONDARY' : 'PRIMARY')
    }));
    for (const init of INITIAL_UOMS) {
      if (!codes.has(init.code.toUpperCase())) {
        merged.push(init);
      }
    }
    return merged;
  });
  const [currencies, setCurrencies] = useState<Currency[]>(() => loadStorage('currencies', INITIAL_CURRENCIES));
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>(() => loadStorage('currencyRates', INITIAL_CURRENCY_RATES));
  const [itemCategories, setItemCategories] = useState<ItemCategory[]>(() => loadStorage('itemCategories', INITIAL_ITEM_CATEGORIES));

  const [ledgerEntries, setLedgerEntries] = useState<InventoryLedgerEntry[]>(() => {
    const loaded = loadStorage<InventoryLedgerEntry[]>('ledgerEntries', INITIAL_LEDGER_ENTRIES);
    const loadedRMs = loadStorage<RawMaterial[]>('rawMaterials', INITIAL_RAW_MATERIALS);
    const loadedProds = loadStorage<Product[]>('products', INITIAL_PRODUCTS);
    const loadedRcpts = loadStorage<InventoryReceipt[]>('receipts', INITIAL_RECEIPTS);
    return healLedgerEntries(loaded, loadedRMs, loadedProds, loadedRcpts);
  });

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => {
    const loaded = loadStorage<RawMaterial[]>('rawMaterials', INITIAL_RAW_MATERIALS);
    const loadedLedger = loadStorage<InventoryLedgerEntry[]>('ledgerEntries', INITIAL_LEDGER_ENTRIES);
    return loaded.map(item => {
      const whMap = computeItemWarehouseStockMap(item, loadedLedger, item.defaultWarehouseId);
      const hasEntries = loadedLedger.some(e => e.itemId === item.id);
      if (hasEntries) {
        const totalQty = Object.values(whMap).reduce((s, w) => s + w.currentQty, 0);
        const totalVal = Object.values(whMap).reduce((s, w) => s + w.totalValue, 0);
        const mac = totalQty > 0 ? totalVal / totalQty : item.movingAverageCost;
        return {
          ...item,
          currentQty: totalQty,
          totalValue: totalVal,
          movingAverageCost: mac,
          warehouseStock: whMap
        };
      }
      return {
        ...item,
        warehouseStock: item.warehouseStock || whMap
      };
    });
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = loadStorage<Product[]>('products', INITIAL_PRODUCTS);
    const loadedLedger = loadStorage<InventoryLedgerEntry[]>('ledgerEntries', INITIAL_LEDGER_ENTRIES);
    return loaded.map(item => {
      const whMap = computeItemWarehouseStockMap(item, loadedLedger, item.defaultWarehouseId);
      const hasEntries = loadedLedger.some(e => e.itemId === item.id);
      if (hasEntries) {
        const totalQty = Object.values(whMap).reduce((s, w) => s + w.currentQty, 0);
        const totalVal = Object.values(whMap).reduce((s, w) => s + w.totalValue, 0);
        const mac = totalQty > 0 ? totalVal / totalQty : item.movingAverageCost;
        return {
          ...item,
          currentQty: totalQty,
          totalValue: totalVal,
          movingAverageCost: mac,
          warehouseStock: whMap
        };
      }
      return {
        ...item,
        warehouseStock: item.warehouseStock || whMap
      };
    });
  });

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
  useEffect(() => { saveStorage('currencyRates', currencyRates); }, [currencyRates]);
  useEffect(() => { saveStorage('itemCategories', itemCategories); }, [itemCategories]);
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

  // Sync to PostgreSQL backend via Drizzle API
  useEffect(() => {
    const timer = setTimeout(() => {
      authService.syncFullStateToBackend({
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
        auditLogs
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    warehouses,
    rawMaterials,
    products,
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
    auditLogs
  ]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      logAudit('USER_SWITCH', 'جلسة مستخدم', user.id, `تم تسجيل دخول / تبديل المستخدم الحالي إلى ${user.fullName} (${user.role})`);
    }
  };

  const logout = () => {
    if (currentUser) {
      logAudit('USER_LOGOUT', 'جلسة مستخدم', currentUser.id, `تم تسجيل خروج المستخدم ${currentUser.fullName}`);
    }
    authService.clearAuth();
    setCurrentUserState(null);
  };

  const logAudit = (action: string, docType: string, docNum: string, details: string, oldVal?: string, newVal?: string) => {
    const now = new Date();
    const entry: AuditLogEntry = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      userName: currentUser?.fullName || 'System Admin',
      action,
      documentType: docType,
      documentNumber: docNum,
      oldValue: oldVal,
      newValue: newVal,
      details
    };
    setAuditLogs(prev => [entry, ...prev]);
  };

  // ==========================================
  // WAREHOUSE-LEVEL VALUATION ENGINE (SAP B1 Rule: Item + Warehouse = Independent Valuation Layer)
  // ==========================================
  const getItemWarehouseValuation = (itemId: string, warehouseId: string): ItemWarehouseStock => {
    const item = rawMaterials.find(m => m.id === itemId) || products.find(p => p.id === itemId);
    if (!item) {
      return { warehouseId, currentQty: 0, movingAverageCost: 0, totalValue: 0 };
    }
    if (item.warehouseStock && item.warehouseStock[warehouseId]) {
      return item.warehouseStock[warehouseId];
    }
    const computedMap = computeItemWarehouseStockMap(item, ledgerEntries, item.defaultWarehouseId);
    if (computedMap[warehouseId]) {
      return computedMap[warehouseId];
    }
    if (item.defaultWarehouseId === warehouseId) {
      return {
        warehouseId,
        currentQty: item.currentQty || 0,
        movingAverageCost: item.movingAverageCost || 0,
        totalValue: item.totalValue || 0
      };
    }
    return { warehouseId, currentQty: 0, movingAverageCost: 0, totalValue: 0 };
  };

  const getAllItemWarehouseStocks = (itemId: string): ItemWarehouseStock[] => {
    const item = rawMaterials.find(m => m.id === itemId) || products.find(p => p.id === itemId);
    if (!item) return [];
    const whMap = (item.warehouseStock && Object.keys(item.warehouseStock).length > 0)
      ? item.warehouseStock
      : computeItemWarehouseStockMap(item, ledgerEntries, item.defaultWarehouseId);
    return Object.values(whMap);
  };

  // 1. ADD INVENTORY RECEIPT (Receipt / Add Inventory into specific Warehouse)
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

    const targetWhId = data.warehouseId;
    const baseQtyToAdd = data.baseQuantity != null ? data.baseQuantity : (data.quantity * (data.conversionFactor || 1));
    const wh = warehouses.find(w => w.id === targetWhId);

    // Calculate updated warehouse stock layer
    const currentWh = getItemWarehouseValuation(data.itemId, targetWhId);
    const existingWhQty = currentWh.currentQty || 0;
    const existingWhVal = currentWh.totalValue || 0;

    const newWhQty = existingWhQty + baseQtyToAdd;
    const newWhVal = existingWhVal + data.totalValueEGP;
    const newWhMAC = newWhQty > 0 ? (newWhVal / newWhQty) : data.unitPriceEGP;

    const applyWarehouseStockUpdate = (item: RawMaterial | Product) => {
      const existingStock = item.warehouseStock || {};
      const updatedStock: Record<string, ItemWarehouseStock> = {
        ...existingStock,
        [targetWhId]: {
          warehouseId: targetWhId,
          warehouseName: wh ? (language === 'ar' ? wh.nameAr : wh.nameEn) : targetWhId,
          currentQty: newWhQty,
          movingAverageCost: newWhMAC,
          totalValue: newWhVal
        }
      };
      const totalQty = Object.values(updatedStock).reduce((s, w) => s + w.currentQty, 0);
      const totalVal = Object.values(updatedStock).reduce((s, w) => s + w.totalValue, 0);
      const totalMAC = totalQty > 0 ? totalVal / totalQty : 0;
      return {
        ...item,
        currentQty: totalQty,
        totalValue: totalVal,
        movingAverageCost: totalMAC,
        warehouseStock: updatedStock
      };
    };

    if (data.itemType === ItemType.RAW_MATERIAL) {
      setRawMaterials(prev => prev.map(item => item.id === data.itemId ? (applyWarehouseStockUpdate(item) as RawMaterial) : item));
    } else {
      setProducts(prev => prev.map(prod => prod.id === data.itemId ? (applyWarehouseStockUpdate(prod) as Product) : prod));
    }

    // Add to Inventory Ledger with warehouse-specific balance and MAC
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
      uom: data.baseUOM || data.uom || 'KG',
      qtyIn: baseQtyToAdd,
      qtyOut: 0,
      balanceQty: newWhQty,
      unitCostEGP: data.unitPriceEGP,
      transactionValueEGP: data.totalValueEGP,
      runningInventoryValueEGP: newWhVal,
      movingAverageCostEGP: newWhMAC,
      createdBy: currentUser?.fullName || 'System User',
      notes: [
        data.notes,
        data.conversionFactor && data.conversionFactor !== 1
          ? `توريد بـ: ${data.quantity} ${data.uom} (= ${baseQtyToAdd} ${data.baseUOM || ''})`
          : undefined
      ].filter(Boolean).join(' | ')
    };

    setLedgerEntries(prev => [...prev, ledgerEntry]);
    setReceipts(prev => [newReceipt, ...prev]);

    logAudit('POST_RECEIPT', 'إذن إضافة مخزني', nextNum, `استلام ${data.quantity} ${data.uom} ${data.conversionFactor && data.conversionFactor !== 1 ? `(${baseQtyToAdd} ${data.baseUOM || ''}) ` : ''}من صنف ${data.itemName} بقيمة ${data.totalValueEGP.toLocaleString('en-US')} ج.م في ${wh?.nameAr || targetWhId}`);

    offlineSyncQueue.enqueueItem({
      actionType: 'GOODS_RECEIPT',
      titleAr: `إذن إضافة مخزني: ${data.itemName}`,
      titleEn: `Goods Receipt: ${data.itemName}`,
      documentNumber: nextNum,
      payload: newReceipt,
      odooModel: 'stock.picking (incoming)',
      odooOperation: 'odoo_goods_receipt_create'
    }).catch(err => console.warn('[AppContext] Offline queue error:', err));

    return newReceipt;
  };

  // 2. ADD LANDED COST (Section 13: adds value to specific warehouse without adding quantity, recalculates warehouse MAC)
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

    // Find receipt and item synchronously from current state
    const origReceipt = receipts.find(r => r.id === data.originalReceiptId);
    const targetItem = rawMaterials.find(m => m.id === data.itemId) || products.find(p => p.id === data.itemId);

    const targetWhId = origReceipt?.warehouseId || targetItem?.defaultWarehouseId || 'wh-raw';
    const wh = warehouses.find(w => w.id === targetWhId);
    const itemCode = targetItem?.code || origReceipt?.itemCode || data.itemId;
    const itemName = (language === 'ar' ? targetItem?.nameAr : targetItem?.nameEn) || origReceipt?.itemName || data.itemName;
    const itemUom = origReceipt?.baseUOM || origReceipt?.uom || targetItem?.defaultUOM || 'KG';

    // Synchronously compute current warehouse quantity and updated warehouse value/MAC
    const curWhStock = getItemWarehouseValuation(data.itemId, targetWhId);
    const currentWhQty = curWhStock.currentQty > 0 ? curWhStock.currentQty : (origReceipt?.baseQuantity || origReceipt?.quantity || 0);
    const oldWhVal = curWhStock.totalValue > 0 ? curWhStock.totalValue : (origReceipt?.totalValueEGP || 0);
    const newWhVal = oldWhVal + data.amountEGP;
    const newWhMAC = currentWhQty > 0 ? (newWhVal / currentWhQty) : curWhStock.movingAverageCost;

    const applyLandedCostUpdate = (item: RawMaterial | Product) => {
      const existingStock = item.warehouseStock || {};
      const updatedStock: Record<string, ItemWarehouseStock> = {
        ...existingStock,
        [targetWhId]: {
          warehouseId: targetWhId,
          warehouseName: wh ? (language === 'ar' ? wh.nameAr : wh.nameEn) : targetWhId,
          currentQty: currentWhQty,
          movingAverageCost: newWhMAC,
          totalValue: newWhVal
        }
      };
      const totalQty = Object.values(updatedStock).reduce((s, w) => s + w.currentQty, 0);
      const totalVal = Object.values(updatedStock).reduce((s, w) => s + w.totalValue, 0);
      const totalMAC = totalQty > 0 ? totalVal / totalQty : 0;
      return {
        ...item,
        currentQty: totalQty,
        totalValue: totalVal,
        movingAverageCost: totalMAC,
        warehouseStock: updatedStock
      };
    };

    if (rawMaterials.some(m => m.id === data.itemId)) {
      setRawMaterials(prev => prev.map(item => item.id === data.itemId ? (applyLandedCostUpdate(item) as RawMaterial) : item));
    } else {
      setProducts(prev => prev.map(item => item.id === data.itemId ? (applyLandedCostUpdate(item) as Product) : item));
    }

    // Add to Inventory Ledger for this specific warehouse layer
    const ledgerEntry: InventoryLedgerEntry = {
      id: 'ledg-' + Date.now(),
      date: newLandedCost.createdDate,
      itemId: data.itemId,
      itemCode: itemCode,
      itemName: itemName,
      itemType: targetItem ? ((targetItem as any).itemType || ItemType.RAW_MATERIAL) : ItemType.RAW_MATERIAL,
      warehouseId: targetWhId,
      warehouseName: wh ? (language === 'ar' ? wh.nameAr : wh.nameEn) : (language === 'ar' ? 'مستودع المواد الخام الرئيسي' : 'Main Raw Materials Warehouse'),
      transactionType: TransactionType.LANDED_COST,
      documentNumber: nextNum,
      reference: data.originalReceiptNumber,
      uom: itemUom,
      qtyIn: 0,
      qtyOut: 0,
      balanceQty: currentWhQty,
      unitCostEGP: 0,
      transactionValueEGP: data.amountEGP,
      runningInventoryValueEGP: newWhVal,
      movingAverageCostEGP: newWhMAC,
      createdBy: currentUser?.fullName || 'System User',
      notes: `${data.costType} - زيادة القيمة وتحديث متوسط التكلفة لمستودع ${wh?.nameAr || targetWhId} بدون زيادة الكمية (+${data.amountEGP.toLocaleString('en-US')} ج.م)`
    };

    setLedgerEntries(prev => [...prev, ledgerEntry]);
    setLandedCosts(prev => [newLandedCost, ...prev]);

    logAudit('POST_LANDED_COST', 'تكلفة إنزال', nextNum, `إضافة ${data.amountEGP.toLocaleString('en-US')} ج.م على الصنف ${itemName} في مستودع ${wh?.nameAr || targetWhId}. متوسط التكلفة الجديد: ${newWhMAC.toFixed(3)} ج.م`);

    return newLandedCost;
  };

  // 3. INVENTORY ISSUE (Section 14: decreases qty and value from specific warehouse using current warehouse MAC)
  const addIssue = (data: Omit<InventoryIssue, 'id' | 'issueNumber' | 'createdDate' | 'status'>) => {
    const nextNum = `ISS-${new Date().getFullYear()}-${String(issues.length + 1).padStart(4, '0')}`;
    const newIssue: InventoryIssue = {
      ...data,
      id: 'iss-' + Date.now(),
      issueNumber: nextNum,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'POSTED'
    };

    const fromWhId = data.fromWarehouseId;
    const wh = warehouses.find(w => w.id === fromWhId);
    const whStock = getItemWarehouseValuation(data.itemId, fromWhId);
    const mac = whStock.movingAverageCost > 0 ? whStock.movingAverageCost : (data.movingAverageCostEGP || 0);
    const baseQtyToIssue = data.baseQuantity != null ? data.baseQuantity : (data.quantity * (data.conversionFactor || 1));
    const totalIssueVal = baseQtyToIssue * mac;

    const newWhQty = Math.max(0, (whStock.currentQty || 0) - baseQtyToIssue);
    const newWhVal = Math.max(0, (whStock.totalValue || 0) - totalIssueVal);

    const applyIssueUpdate = (item: RawMaterial | Product) => {
      const existingStock = item.warehouseStock || {};
      const updatedStock: Record<string, ItemWarehouseStock> = {
        ...existingStock,
        [fromWhId]: {
          warehouseId: fromWhId,
          warehouseName: wh ? (language === 'ar' ? wh.nameAr : wh.nameEn) : fromWhId,
          currentQty: newWhQty,
          movingAverageCost: mac,
          totalValue: newWhVal
        }
      };
      const totalQty = Object.values(updatedStock).reduce((s, w) => s + w.currentQty, 0);
      const totalVal = Object.values(updatedStock).reduce((s, w) => s + w.totalValue, 0);
      const totalMAC = totalQty > 0 ? totalVal / totalQty : 0;
      return {
        ...item,
        currentQty: totalQty,
        totalValue: totalVal,
        movingAverageCost: totalMAC,
        warehouseStock: updatedStock
      };
    };

    if (rawMaterials.some(m => m.id === data.itemId)) {
      setRawMaterials(prev => prev.map(item => item.id === data.itemId ? (applyIssueUpdate(item) as RawMaterial) : item));
    } else {
      setProducts(prev => prev.map(item => item.id === data.itemId ? (applyIssueUpdate(item) as Product) : item));
    }

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
      uom: data.baseUOM || data.uom || 'KG',
      qtyIn: 0,
      qtyOut: baseQtyToIssue,
      balanceQty: newWhQty,
      unitCostEGP: mac,
      transactionValueEGP: totalIssueVal,
      runningInventoryValueEGP: newWhVal,
      movingAverageCostEGP: mac,
      createdBy: currentUser?.fullName || 'System User',
      notes: [
        data.notes,
        data.conversionFactor && data.conversionFactor !== 1
          ? `صرف بـ: ${data.quantity} ${data.uom} (= ${baseQtyToIssue} ${data.baseUOM || ''})`
          : undefined
      ].filter(Boolean).join(' | ')
    };

    setLedgerEntries(prev => [...prev, ledgerEntry]);
    setIssues(prev => [newIssue, ...prev]);

    logAudit('POST_ISSUE', 'إذن صرف مخزني', nextNum, `صرف ${data.quantity} ${data.uom} ${data.conversionFactor && data.conversionFactor !== 1 ? `(${baseQtyToIssue} ${data.baseUOM || ''}) ` : ''}من صنف ${data.itemName} بقيمة ${totalIssueVal.toLocaleString('en-US')} ج.م من مستودع ${wh?.nameAr || fromWhId}`);

    offlineSyncQueue.enqueueItem({
      actionType: 'MATERIAL_ISSUE',
      titleAr: `إذن صرف مخزني: ${data.itemName}`,
      titleEn: `Material Issue: ${data.itemName}`,
      documentNumber: nextNum,
      payload: newIssue,
      odooModel: 'stock.picking (internal_issue)',
      odooOperation: 'odoo_material_issue_create'
    }).catch(err => console.warn('[AppContext] Offline queue error:', err));

    return newIssue;
  };

  // 4. INVENTORY TRANSFER (CRITICAL RULE: Transfer uses Source MAC; Recalculates Destination MAC)
  const addTransfer = (data: Omit<InventoryTransfer, 'id' | 'transferNumber' | 'createdDate' | 'status'>) => {
    const nextNum = `TR-${new Date().getFullYear()}-${String(transfers.length + 1).padStart(4, '0')}`;
    const newTransfer: InventoryTransfer = {
      ...data,
      id: 'tr-' + Date.now(),
      transferNumber: nextNum,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'POSTED'
    };

    const fromWhId = data.fromWarehouseId;
    const toWhId = data.toWarehouseId;
    const fromWh = warehouses.find(w => w.id === fromWhId);
    const toWh = warehouses.find(w => w.id === toWhId);
    const baseQtyToTransfer = data.baseQuantity != null ? data.baseQuantity : (data.quantity * (data.conversionFactor || 1));

    // Source Warehouse: Item + Warehouse layer
    const sourceWhStock = getItemWarehouseValuation(data.itemId, fromWhId);
    const sourceUnitCost = sourceWhStock.movingAverageCost > 0 ? sourceWhStock.movingAverageCost : (data.unitCostEGP || 0);
    const transferTotalValue = baseQtyToTransfer * sourceUnitCost;

    const sourceNewQty = Math.max(0, (sourceWhStock.currentQty || 0) - baseQtyToTransfer);
    const sourceNewVal = Math.max(0, (sourceWhStock.totalValue || 0) - transferTotalValue);
    const sourceNewMAC = sourceWhStock.movingAverageCost; // Source warehouse unit cost does NOT change!

    // Destination Warehouse: Item + Warehouse layer
    const destWhStock = getItemWarehouseValuation(data.itemId, toWhId);
    const destOldQty = destWhStock.currentQty || 0;
    const destOldVal = destWhStock.totalValue || 0;
    const destNewQty = destOldQty + baseQtyToTransfer;
    const destNewVal = destOldVal + transferTotalValue;
    // New Destination MAC = (Existing Dest Value + Incoming Transfer Value) / (Existing Dest Qty + Incoming Transfer Qty)
    const destNewMAC = destNewQty > 0 ? (destNewVal / destNewQty) : sourceUnitCost;

    // Update item warehouse stock state
    const applyTransferUpdate = (item: RawMaterial | Product) => {
      const existingStock = item.warehouseStock || {};
      const updatedStock: Record<string, ItemWarehouseStock> = {
        ...existingStock,
        [fromWhId]: {
          warehouseId: fromWhId,
          warehouseName: fromWh ? (language === 'ar' ? fromWh.nameAr : fromWh.nameEn) : fromWhId,
          currentQty: sourceNewQty,
          movingAverageCost: sourceNewMAC,
          totalValue: sourceNewVal
        },
        [toWhId]: {
          warehouseId: toWhId,
          warehouseName: toWh ? (language === 'ar' ? toWh.nameAr : toWh.nameEn) : toWhId,
          currentQty: destNewQty,
          movingAverageCost: destNewMAC,
          totalValue: destNewVal
        }
      };
      const totalQty = Object.values(updatedStock).reduce((s, w) => s + w.currentQty, 0);
      const totalVal = Object.values(updatedStock).reduce((s, w) => s + w.totalValue, 0);
      const totalMAC = totalQty > 0 ? totalVal / totalQty : 0;
      return {
        ...item,
        currentQty: totalQty,
        totalValue: totalVal,
        movingAverageCost: totalMAC,
        warehouseStock: updatedStock
      };
    };

    const targetItem = rawMaterials.find(m => m.id === data.itemId) || products.find(p => p.id === data.itemId);
    const itemType = targetItem ? ((targetItem as any).itemType || ItemType.RAW_MATERIAL) : ItemType.RAW_MATERIAL;

    if (rawMaterials.some(m => m.id === data.itemId)) {
      setRawMaterials(prev => prev.map(item => item.id === data.itemId ? (applyTransferUpdate(item) as RawMaterial) : item));
    } else {
      setProducts(prev => prev.map(item => item.id === data.itemId ? (applyTransferUpdate(item) as Product) : item));
    }

    // Ledger 1: Transfer Out from Source Warehouse
    const ledgerOut: InventoryLedgerEntry = {
      id: 'ledg-out-' + Date.now(),
      date: newTransfer.createdDate,
      itemId: data.itemId,
      itemCode: data.itemCode,
      itemName: data.itemName,
      itemType,
      warehouseId: fromWhId,
      warehouseName: fromWh ? (language === 'ar' ? fromWh.nameAr : fromWh.nameEn) : 'المستودع المصدر',
      locationId: data.fromLocationId,
      transactionType: TransactionType.TRANSFER_OUT,
      documentNumber: nextNum,
      reference: `تحويل إلى ${toWh ? (language === 'ar' ? toWh.nameAr : toWh.nameEn) : toWhId}`,
      uom: data.baseUOM || data.uom || 'KG',
      qtyIn: 0,
      qtyOut: baseQtyToTransfer,
      balanceQty: sourceNewQty,
      unitCostEGP: sourceUnitCost,
      transactionValueEGP: transferTotalValue,
      runningInventoryValueEGP: sourceNewVal,
      movingAverageCostEGP: sourceNewMAC,
      createdBy: currentUser?.fullName || 'System User',
      notes: [
        data.notes,
        `صرف تحويل إلى ${toWh?.nameAr || toWhId} بسعر تكلفة المصدر (${sourceUnitCost.toFixed(2)} ج.م)`
      ].filter(Boolean).join(' | ')
    };

    // Ledger 2: Transfer In to Destination Warehouse
    const ledgerIn: InventoryLedgerEntry = {
      id: 'ledg-in-' + (Date.now() + 1),
      date: newTransfer.createdDate,
      itemId: data.itemId,
      itemCode: data.itemCode,
      itemName: data.itemName,
      itemType,
      warehouseId: toWhId,
      warehouseName: toWh ? (language === 'ar' ? toWh.nameAr : toWh.nameEn) : 'المستودع الوجهة',
      locationId: data.toLocationId,
      transactionType: TransactionType.TRANSFER_IN,
      documentNumber: nextNum,
      reference: `تحويل من ${fromWh ? (language === 'ar' ? fromWh.nameAr : fromWh.nameEn) : fromWhId}`,
      uom: data.baseUOM || data.uom || 'KG',
      qtyIn: baseQtyToTransfer,
      qtyOut: 0,
      balanceQty: destNewQty,
      unitCostEGP: sourceUnitCost,
      transactionValueEGP: transferTotalValue,
      runningInventoryValueEGP: destNewVal,
      movingAverageCostEGP: destNewMAC,
      createdBy: currentUser?.fullName || 'System User',
      notes: [
        data.notes,
        `استلام تحويل من ${fromWh?.nameAr || fromWhId} (متوسط تكلفة الوجهة الجديد: ${destNewMAC.toFixed(2)} ج.م)`
      ].filter(Boolean).join(' | ')
    };

    setLedgerEntries(prev => [...prev, ledgerOut, ledgerIn]);
    setTransfers(prev => [newTransfer, ...prev]);

    logAudit('POST_TRANSFER', 'تحويل مخزني', nextNum, `تحويل ${data.quantity} ${data.uom} من ${fromWh?.nameAr} إلى ${toWh?.nameAr} بتكلفة ${sourceUnitCost.toFixed(2)} ج.م (متوسط الوجهة الجديد: ${destNewMAC.toFixed(2)} ج.م)`);

    offlineSyncQueue.enqueueItem({
      actionType: 'STOCK_TRANSFER',
      titleAr: `تحويل مخزني: ${data.itemName}`,
      titleEn: `Stock Transfer: ${data.itemName}`,
      documentNumber: nextNum,
      payload: {
        ...newTransfer,
        fromWarehouseName: fromWh?.nameAr || 'المستودع المصدر',
        toWarehouseName: toWh?.nameAr || 'مستودع الوجهة'
      },
      odooModel: 'stock.picking (internal_transfer)',
      odooOperation: 'odoo_stock_transfer_create'
    }).catch(err => console.warn('[AppContext] Offline queue error:', err));

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
          modifiedBy: currentUser?.fullName || 'System User',
          approvedBy: currentUser?.fullName || 'System User',
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

    // Update raw materials stock and calculate cost for specific warehouse
    const targetWhId = data.warehouseId;
    const wh = warehouses.find(w => w.id === targetWhId);
    const whStock = getItemWarehouseValuation(data.rawMaterialId, targetWhId);
    const mac = whStock.movingAverageCost > 0 ? whStock.movingAverageCost : data.movingAverageCostEGP;
    const baseQtyToIssue = data.baseQuantity != null ? data.baseQuantity : (data.actualQuantity * (data.conversionFactor || 1));
    const totalActualCost = baseQtyToIssue * mac;

    const newWhQty = Math.max(0, (whStock.currentQty || 0) - baseQtyToIssue);
    const newWhVal = Math.max(0, (whStock.totalValue || 0) - totalActualCost);

    setRawMaterials(prev => prev.map(item => {
      if (item.id === data.rawMaterialId) {
        const existingStock = item.warehouseStock || {};
        const updatedStock: Record<string, ItemWarehouseStock> = {
          ...existingStock,
          [targetWhId]: {
            warehouseId: targetWhId,
            warehouseName: wh ? (language === 'ar' ? wh.nameAr : wh.nameEn) : targetWhId,
            currentQty: newWhQty,
            movingAverageCost: mac,
            totalValue: newWhVal
          }
        };
        const totalQty = Object.values(updatedStock).reduce((s, w) => s + w.currentQty, 0);
        const totalVal = Object.values(updatedStock).reduce((s, w) => s + w.totalValue, 0);
        const totalMAC = totalQty > 0 ? totalVal / totalQty : 0;
        return {
          ...item,
          currentQty: totalQty,
          totalValue: totalVal,
          movingAverageCost: totalMAC,
          warehouseStock: updatedStock
        };
      }
      return item;
    }));

    // Update Production Order accumulated material cost
    setProductionOrders(prev => prev.map(order => {
      if (order.id === data.productionOrderId) {
        const currentMatCost = (order.actualMaterialCostEGP || 0) + totalActualCost;
        const totalProdCost = currentMatCost + (order.additionalCostEGP || 0);
        const updatedMaterials = (order.materials || []).map(mat => {
          if (mat.rawMaterialId === data.rawMaterialId) {
            return {
              ...mat,
              actualIssuedQty: (mat.actualIssuedQty || 0) + baseQtyToIssue,
              actualCostEGP: (mat.actualCostEGP || 0) + totalActualCost
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
      uom: data.baseUOM || data.uom || 'KG',
      qtyIn: 0,
      qtyOut: baseQtyToIssue,
      balanceQty: newWhQty,
      unitCostEGP: mac,
      transactionValueEGP: totalActualCost,
      runningInventoryValueEGP: newWhVal,
      movingAverageCostEGP: mac,
      createdBy: currentUser?.fullName || 'System User',
      notes: [
        `صرف خامات لأمر الإنتاج ${data.productionOrderNumber}`,
        data.conversionFactor && data.conversionFactor !== 1
          ? `(${data.actualQuantity} ${data.uom} = ${baseQtyToIssue} ${data.baseUOM || ''})`
          : undefined
      ].filter(Boolean).join(' ')
    };

    setLedgerEntries(prev => [...prev, ledgerEntry]);
    setMaterialIssues(prev => [newIssue, ...prev]);

    logAudit('MATERIAL_ISSUE', 'صرف خامات إنتاج', nextNum, `صرف ${data.actualQuantity} ${data.uom} ${data.conversionFactor && data.conversionFactor !== 1 ? `(${baseQtyToIssue} ${data.baseUOM || ''}) ` : ''}من ${data.rawMaterialName} لأمر ${data.productionOrderNumber}`);

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
      const fgBaseQty = receipt.baseQuantity != null ? receipt.baseQuantity : (receipt.finishedQuantity * (receipt.conversionFactor || 1));

      setProducts(prev => prev.map(prod => {
        if (prod.id === order.productId) {
          const oldQty = prod.currentQty || 0;
          const oldVal = prod.totalValue || 0;
          newFGQty = oldQty + fgBaseQty;
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
        uom: receipt.baseUOM || receipt.uom || 'KG',
        qtyIn: fgBaseQty,
        qtyOut: 0,
        balanceQty: newFGQty,
        unitCostEGP: receipt.finishedGoodsUnitCostEGP,
        transactionValueEGP: receipt.totalMaterialCostEGP,
        runningInventoryValueEGP: newFGVal,
        movingAverageCostEGP: newFGMAC,
        createdBy: currentUser?.fullName || 'Quality Officer',
        notes: `استلام منتج تام بعد اعتماد الجودة (${reason || 'مطابق للمواصفات القياسية'})${receipt.conversionFactor && receipt.conversionFactor !== 1 ? ` [${receipt.finishedQuantity} ${receipt.uom} = ${fgBaseQty} ${receipt.baseUOM || ''}]` : ''}`
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
        uom: receipt.baseUOM || receipt.uom || 'KG',
        qtyIn: receipt.scrapQuantity,
        qtyOut: 0,
        balanceQty: receipt.scrapQuantity,
        unitCostEGP: 0,
        transactionValueEGP: 0,
        runningInventoryValueEGP: 0,
        movingAverageCostEGP: 0,
        createdBy: currentUser?.fullName || 'Quality Officer',
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
            qualityApprovedBy: currentUser?.fullName || 'Quality Officer',
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
            qualityApprovedBy: currentUser?.fullName || 'Quality Officer',
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
            qualityApprovedBy: currentUser?.fullName || 'Quality Officer',
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
            qualityApprovedBy: currentUser?.fullName || 'Quality Officer',
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
    const baseQtyToDeliver = data.baseQuantity != null ? data.baseQuantity : (data.quantity * (data.conversionFactor || 1));

    setProducts(prev => prev.map(prod => {
      if (prod.id === data.productId) {
        newQty = Math.max(0, (prod.currentQty || 0) - baseQtyToDeliver);
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
      uom: data.baseUOM || data.uom || 'KG',
      qtyIn: 0,
      qtyOut: baseQtyToDeliver,
      balanceQty: newQty,
      unitCostEGP: mac,
      transactionValueEGP: data.totalDeliveryValueEGP,
      runningInventoryValueEGP: newTotalVal,
      movingAverageCostEGP: mac,
      createdBy: currentUser?.fullName || 'System User',
      notes: [
        data.notes,
        data.conversionFactor && data.conversionFactor !== 1
          ? `صرف بـ: ${data.quantity} ${data.uom} (= ${baseQtyToDeliver} ${data.baseUOM || ''})`
          : undefined
      ].filter(Boolean).join(' | ')
    };

    setLedgerEntries(prev => [...prev, ledgerEntry]);
    setCustomerDeliveries(prev => [newDelivery, ...prev]);

    logAudit('CUSTOMER_DELIVERY', 'تسليم عميل', nextNum, `صرف ${data.quantity} ${data.uom} ${data.conversionFactor && data.conversionFactor !== 1 ? `(${baseQtyToDeliver} ${data.baseUOM || ''}) ` : ''}للعميل ${data.customerName} بتكلفة مبيعات ${data.totalDeliveryValueEGP.toLocaleString('en-US')} ج.م`);

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
      approvedBy: currentUser?.fullName || 'Cost Accountant',
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
        createdBy: currentUser?.fullName || 'Cost Accountant',
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
      createdBy: currentUser?.fullName || 'System User',
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

  const saveItemCategory = (category: ItemCategory) => {
    setItemCategories(prev => {
      const exists = prev.find(c => c.id === category.id);
      if (exists) return prev.map(c => c.id === category.id ? category : c);
      return [...prev, category];
    });
    logAudit('SAVE_ITEM_CATEGORY', 'مجموعات الأصناف وطرق التقييم', category.code, `حفظ مجموعة الأصناف ${category.nameAr} بطريقة تقييم ${category.valuationMethod}`);
  };

  const deleteItemCategory = (id: string) => {
    const item = itemCategories.find(c => c.id === id);
    setItemCategories(prev => prev.filter(c => c.id !== id));
    logAudit('DELETE_ITEM_CATEGORY', 'مجموعات الأصناف وطرق التقييم', item?.code || id, `حذف مجموعة الأصناف ${item?.nameAr || id}`);
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

    if (!currency.isBase && currency.exchangeRate && currency.rateDate) {
      saveCurrencyRate({
        currencyCode: currency.code,
        rateDate: currency.rateDate,
        rate: currency.exchangeRate,
        source: 'بطاقة العملة',
        notes: `تحديث سعر صرف العملة ${currency.nameAr}`
      });
    }

    logAudit('SAVE_CURRENCY', 'العملات', currency.code, `حفظ العملة ${currency.nameAr}`);
  };

  const deleteCurrency = (id: string) => {
    const item = currencies.find(c => c.id === id);
    setCurrencies(prev => prev.filter(c => c.id !== id));
    logAudit('DELETE_CURRENCY', 'العملات', item?.code || id, `حذف العملة ${item?.nameAr || id}`);
  };

  // Currency Exchange Rates History Management (By Date)
  const saveCurrencyRate = (rateData: Omit<CurrencyRate, 'id' | 'createdAt'> & { id?: string }) => {
    const code = (rateData.currencyCode || 'USD').trim().toUpperCase();
    const date = rateData.rateDate || new Date().toISOString().split('T')[0];
    const rateVal = Number(rateData.rate) || 1;
    const rateId = rateData.id || `rate-${code.toLowerCase()}-${date}-${Date.now().toString(36)}`;

    const newRate: CurrencyRate = {
      id: rateId,
      currencyCode: code,
      rateDate: date,
      rate: rateVal,
      source: rateData.source || 'يدوي من لوحة التحكم',
      notes: rateData.notes || '',
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.fullName || 'مدير النظام'
    };

    setCurrencyRates(prev => {
      const idx = prev.findIndex(r => r.id === newRate.id || (r.currencyCode === code && r.rateDate === date));
      let updated: CurrencyRate[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = newRate;
      } else {
        updated = [newRate, ...prev];
      }
      return updated.sort((a, b) => b.rateDate.localeCompare(a.rateDate));
    });

    // Sync parent currency's exchangeRate if this rate is on or newer than currency's current rateDate
    setCurrencies(prevCurrs => {
      return prevCurrs.map(c => {
        if (c.code === code && !c.isBase) {
          if (!c.rateDate || date >= c.rateDate) {
            return {
              ...c,
              exchangeRate: rateVal,
              rateDate: date
            };
          }
        }
        return c;
      });
    });

    logAudit(
      'SAVE_CURRENCY_RATE',
      'سعر الصرف اليومي',
      code,
      `تسجيل سعر صرف تاريخي: 1 ${code} = ${rateVal} ج.م لتاريخ ${date}`
    );
  };

  const deleteCurrencyRate = (id: string) => {
    const item = currencyRates.find(r => r.id === id);
    if (!item) return;
    setCurrencyRates(prev => prev.filter(r => r.id !== id));
    logAudit(
      'DELETE_CURRENCY_RATE',
      'سعر الصرف اليومي',
      item.currencyCode,
      `حذف سعر صرف ${item.currencyCode} المسجل بتاريخ ${item.rateDate}`
    );
  };

  const getExchangeRateForDate = (
    currencyCode: string,
    targetDate?: string
  ): { rate: number; rateDate: string; isExact: boolean; source?: string } => {
    const code = (currencyCode || 'EGP').trim().toUpperCase();
    const date = targetDate || new Date().toISOString().split('T')[0];

    if (code === 'EGP') {
      return { rate: 1.0, rateDate: date, isExact: true, source: 'العملة الأساسية (EGP)' };
    }

    const matchingRates = currencyRates
      .filter(r => r.currencyCode === code)
      .sort((a, b) => b.rateDate.localeCompare(a.rateDate));

    if (matchingRates.length === 0) {
      const parentCurr = currencies.find(c => c.code === code);
      return {
        rate: parentCurr?.exchangeRate || 1.0,
        rateDate: parentCurr?.rateDate || date,
        isExact: false,
        source: 'سعر البطاقة الافتراضي'
      };
    }

    // Exact match for the given date
    const exact = matchingRates.find(r => r.rateDate === date);
    if (exact) {
      return { rate: exact.rate, rateDate: exact.rateDate, isExact: true, source: exact.source };
    }

    // Closest rate on or before targetDate
    const onOrBefore = matchingRates.find(r => r.rateDate <= date);
    if (onOrBefore) {
      return { rate: onOrBefore.rate, rateDate: onOrBefore.rateDate, isExact: false, source: onOrBefore.source };
    }

    // Closest available rate (e.g. earliest)
    const fallback = matchingRates[0];
    return { rate: fallback.rate, rateDate: fallback.rateDate, isExact: false, source: fallback.source };
  };

  // Clear seed data so the user starts completely from scratch with a clean slate
  const clearSeedDataAndStartScratch = () => {
    setReceipts([]);
    setLandedCosts([]);
    setIssues([]);
    setTransfers([]);
    setProductionOrders([]);
    setMaterialIssues([]);
    setProductionReceipts([]);
    setCustomerDeliveries([]);
    setCostAdjustments([]);
    setLedgerEntries([]);
    setAuditLogs([]);
    setItemCategories([]);
    setRawMaterials([]);
    setProducts([]);
    setBoms([]);
    setMachines([]);
    setSuppliers([]);
    setCustomers([]);

    const keys = [
      'receipts', 'landedCosts', 'issues', 'transfers', 'productionOrders',
      'materialIssues', 'productionReceipts', 'customerDeliveries', 'costAdjustments',
      'ledgerEntries', 'auditLogs', 'itemCategories', 'rawMaterials', 'products', 'boms',
      'machines', 'suppliers', 'customers'
    ];
    keys.forEach(k => {
      try {
        localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify([]));
      } catch (_) {}
    });

    try {
      localStorage.setItem(STORAGE_PREFIX + 'cleared_seed_scratch', 'true');
    } catch (_) {}

    // Call backend reset to ensure PostgreSQL database tables are also cleared
    try {
      fetch('/api/data/reset-scratch', {
        method: 'POST',
        headers: authService.getAuthHeaders(),
      }).catch(() => {});
    } catch (_) {}

    logAudit(
      'SYSTEM_RESET',
      currentUser?.fullName || 'مدير النظام',
      'START_FROM_SCRATCH',
      'تم مسح كافة البيانات وحركات المخزون والإنتاج للبدء من الصفر بقاعدة بيانات نظيفة'
    );
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
    setRawMaterials(SAMPLE_RAW_MATERIALS);
    setProducts(SAMPLE_PRODUCTS);
    setMachines(SAMPLE_MACHINES);
    setSuppliers(SAMPLE_SUPPLIERS);
    setCustomers(SAMPLE_CUSTOMERS);
    setBoms(SAMPLE_BOMS);
    setReceipts(SAMPLE_RECEIPTS);
    setLandedCosts(SAMPLE_LANDED_COSTS);
    setIssues([]);
    setTransfers(SAMPLE_TRANSFERS);
    setProductionOrders(SAMPLE_PRODUCTION_ORDERS);
    setMaterialIssues(SAMPLE_MATERIAL_ISSUES);
    setProductionReceipts(SAMPLE_PRODUCTION_RECEIPTS);
    setCustomerDeliveries(SAMPLE_CUSTOMER_DELIVERIES);
    setCostAdjustments(SAMPLE_COST_ADJUSTMENTS);
    setLedgerEntries(SAMPLE_LEDGER_ENTRIES);
    setAuditLogs(SAMPLE_AUDIT_LOGS);
    setOdooConfig(INITIAL_ODOO_CONFIG);
    setOdooLogs(INITIAL_ODOO_LOGS);
    logAudit('RESET_SYSTEM', 'النظام', 'RESET', 'تمت إعادة ضبط النظام إلى دورة العمل المعيارية النموذجية');
  };

  // 100% Coverage Seeding with All Auth Roles and Master/Transaction entities
  const seedFullCoverageData = () => {
    localStorage.clear();
    setUsers(SEED_USERS);
    setWarehouses(SEED_WAREHOUSES);
    setLocations(SEED_LOCATIONS);
    setUoms(SEED_UOMS);
    setCurrencies(SEED_CURRENCIES);
    setRawMaterials(SEED_RAW_MATERIALS);
    setProducts(SEED_PRODUCTS);
    setMachines(SEED_MACHINES);
    setSuppliers(SEED_SUPPLIERS);
    setCustomers(SEED_CUSTOMERS);
    setBoms(SEED_BOMS);
    setReceipts(SEED_RECEIPTS);
    setLandedCosts(SEED_LANDED_COSTS);
    setTransfers(SEED_TRANSFERS);
    setIssues(SEED_ISSUES);
    setProductionOrders(SEED_PRODUCTION_ORDERS);
    setMaterialIssues(SEED_MATERIAL_ISSUES);
    setProductionReceipts(SEED_PRODUCTION_RECEIPTS);
    setCustomerDeliveries(SEED_CUSTOMER_DELIVERIES);
    setCostAdjustments(SEED_COST_ADJUSTMENTS);
    setLedgerEntries(SEED_LEDGER_ENTRIES);
    setAuditLogs(SEED_AUDIT_LOGS);
    setOdooConfig(INITIAL_ODOO_CONFIG);
    setOdooLogs(INITIAL_ODOO_LOGS);
    logAudit('SEED_FULL_COVERAGE', 'قاعدة البيانات', 'SEED_100', 'تم تحميل بيانات البذر التجريبية بنسبة تغطية 100% لكافة الأدوار والمستودعات والعمليات');
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currentUser,
        setCurrentUser,
        isAuthenticated: !!currentUser,
        logout,
        users,
        setUsers,
        seedFullCoverageData,
        getItemWarehouseValuation,
        getAllItemWarehouseStocks,
        warehouses,
        locations,
        uoms,
        currencies,
        currencyRates,
        saveCurrencyRate,
        deleteCurrencyRate,
        getExchangeRateForDate,
        clearSeedDataAndStartScratch,
        itemCategories,
        saveItemCategory,
        deleteItemCategory,
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
