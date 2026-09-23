import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/src/context/AppContext';
import { 
  Filter, 
  X, 
  Calendar, 
  Package, 
  Layers, 
  Store, 
  Truck, 
  Tag, 
  FileText, 
  User, 
  CheckCircle2, 
  RefreshCw, 
  Search,
  ChevronDown
} from 'lucide-react';

export interface ERPFilters {
  dateFrom?: string;
  dateTo?: string;
  warehouseType?: string;
  warehouseId?: string;
  itemType?: string;
  itemGroupId?: string;
  itemCode?: string;
  itemDesc?: string;
  supplierId?: string;
  status?: string;
  docType?: string;
  docNum?: string;
  createdBy?: string;
  landedCostStatus?: string;
}

export interface FilterBarConfig {
  date?: boolean;
  warehouseType?: boolean;
  warehouse?: boolean;
  itemType?: boolean;
  itemGroup?: boolean;
  itemCode?: boolean;
  itemDesc?: boolean;
  supplier?: boolean;
  status?: boolean;
  docType?: boolean;
  docNum?: boolean;
  createdBy?: boolean;
  landedCostStatus?: boolean;
}

interface SmartFilterBarProps {
  filters: ERPFilters;
  onChange: (updatedFilters: ERPFilters) => void;
  config: FilterBarConfig;
  totalRecordsCount: number;
  filteredRecordsCount: number;
  onResetView?: () => void;
}

export const SmartFilterBar: React.FC<SmartFilterBarProps> = ({
  filters,
  onChange,
  config,
  totalRecordsCount,
  filteredRecordsCount,
  onResetView
}) => {
  const { 
    language, 
    warehouses, 
    itemCategories, 
    suppliers, 
    users 
  } = useApp();
  
  const isAr = language === 'ar';

  // Local state for supplier autocomplete search
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Dynamic lists from master data
  const uniqueWarehouseTypes = useMemo(() => {
    const types = new Set<string>();
    warehouses.forEach(w => {
      if (w.type) types.add(w.type);
    });
    return Array.from(types);
  }, [warehouses]);

  // Cascading Filter: Filter warehouses based on warehouseType selection
  const availableWarehouses = useMemo(() => {
    if (filters.warehouseType) {
      return warehouses.filter(w => w.type === filters.warehouseType);
    }
    return warehouses;
  }, [warehouses, filters.warehouseType]);

  // If warehouseType changes, reset warehouseId if it's no longer valid
  useEffect(() => {
    if (filters.warehouseType && filters.warehouseId) {
      const isValid = availableWarehouses.some(w => w.id === filters.warehouseId);
      if (!isValid) {
        updateFilter('warehouseId', '');
      }
    }
  }, [filters.warehouseType]);

  // Sync local supplier autocomplete input with active supplierId selection
  useEffect(() => {
    if (filters.supplierId) {
      const selected = suppliers.find(s => s.id === filters.supplierId);
      if (selected) {
        setSupplierSearch(isAr ? selected.nameAr : selected.nameEn);
      }
    } else {
      setSupplierSearch('');
    }
  }, [filters.supplierId, suppliers, isAr]);

  const updateFilter = (key: keyof ERPFilters, value: string) => {
    onChange({
      ...filters,
      [key]: value === '' ? undefined : value
    });
  };

  const handleClearFilter = (key: keyof ERPFilters) => {
    updateFilter(key, '');
    if (key === 'supplierId') {
      setSupplierSearch('');
    }
  };

  const handleClearAll = () => {
    onChange({});
    setSupplierSearch('');
    if (onResetView) {
      onResetView();
    }
  };

  // Filter supplier autocomplete options
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim() || filters.supplierId) {
      return suppliers;
    }
    const q = supplierSearch.toLowerCase();
    return suppliers.filter(
      s => 
        s.code.toLowerCase().includes(q) ||
        s.nameAr.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q)
    );
  }, [suppliers, supplierSearch, filters.supplierId]);

  // Translate labels
  const t = {
    filterTitle: isAr ? 'نظام الفلترة والبحث الذكي' : 'Smart Filtering & Search System',
    dateFrom: isAr ? 'من تاريخ' : 'Date From',
    dateTo: isAr ? 'إلى تاريخ' : 'Date To',
    whType: isAr ? 'تصنيف المستودع' : 'Warehouse Type',
    wh: isAr ? 'المستودع' : 'Warehouse',
    whAll: isAr ? 'كافة المستودعات' : 'All Warehouses',
    itemType: isAr ? 'نوع الصنف' : 'Item Type',
    itemGroup: isAr ? 'مجموعة الصنف' : 'Item Group',
    itemCode: isAr ? 'كود الصنف' : 'Item Code',
    itemDesc: isAr ? 'وصف الصنف' : 'Item Description',
    supplier: isAr ? 'المورد' : 'Supplier',
    supplierPlaceholder: isAr ? 'بحث بالكود أو الاسم...' : 'Search code or name...',
    status: isAr ? 'حالة المستند' : 'Document Status',
    docType: isAr ? 'نوع المستند' : 'Document Type',
    docNum: isAr ? 'رقم المستند' : 'Document No',
    user: isAr ? 'المستخدم المنشئ' : 'Created By',
    clearAll: isAr ? 'إعادة ضبط' : 'Reset All',
    recordsFound: isAr ? 'سجلات مطابقة' : 'records found',
    totalOf: isAr ? 'من إجمالي' : 'out of',
    activeFilters: isAr ? 'المرشحات النشطة' : 'Active Filters',
    landedCostStatus: isAr ? 'حالة تكلفة الإنزال' : 'Landed Cost'
  };

  // Convert status keys to user-friendly labels
  const getStatusLabel = (status: string) => {
    if (isAr) {
      switch (status.toUpperCase()) {
        case 'POSTED': return 'مرحل / نشط';
        case 'DRAFT': return 'مسودة';
        case 'CANCELLED': case 'CANCELED': return 'ملغى / معكوس';
        case 'REVERSED': return 'تم العكس';
        default: return status;
      }
    } else {
      switch (status.toUpperCase()) {
        case 'POSTED': return 'Posted / Active';
        case 'DRAFT': return 'Draft';
        case 'CANCELLED': case 'CANCELED': return 'Canceled';
        case 'REVERSED': return 'Reversed';
        default: return status;
      }
    }
  };

  // Convert Item Type keys to labels
  const getItemTypeLabel = (type: string) => {
    if (isAr) {
      switch (type.toUpperCase()) {
        case 'RAW_MATERIAL': return 'خامة أولية';
        case 'SEMI_FINISHED': return 'منتج وسيط';
        case 'FINISHED_PRODUCT': return 'منتج تام';
        case 'SCRAP': return 'هالك / خردة';
        default: return type;
      }
    } else {
      switch (type.toUpperCase()) {
        case 'RAW_MATERIAL': return 'Raw Material';
        case 'SEMI_FINISHED': return 'Semi-Finished';
        case 'FINISHED_PRODUCT': return 'Finished Product';
        case 'SCRAP': return 'Scrap';
        default: return type;
      }
    }
  };

  // Convert Doc Type keys to labels
  const getDocTypeLabel = (type: string) => {
    if (isAr) {
      switch (type.toUpperCase()) {
        case 'PURCHASE_RECEIPT': return 'إذن توريد مشتريات';
        case 'LANDED_COST': return 'تكلفة إنزال';
        case 'INVENTORY_ISSUE': return 'إذن صرف مخزني';
        case 'TRANSFER_OUT': return 'تحويل صادر';
        case 'TRANSFER_IN': return 'تحويل وارد';
        case 'MATERIAL_ISSUE_PRODUCTION': return 'صرف خامات إنتاج';
        case 'FINISHED_GOODS_RECEIPT': return 'استلام منتج تام';
        case 'CUSTOMER_DELIVERY': return 'تسليم عميل';
        case 'SCRAP': return 'هالك';
        case 'COST_ADJUSTMENT': return 'تعديل تكلفة';
        case 'REVERSAL': return 'قيد عكسي';
        default: return type;
      }
    } else {
      switch (type.toUpperCase()) {
        case 'PURCHASE_RECEIPT': return 'Purchase Receipt';
        case 'LANDED_COST': return 'Landed Cost';
        case 'INVENTORY_ISSUE': return 'Inventory Issue';
        case 'TRANSFER_OUT': return 'Transfer Out';
        case 'TRANSFER_IN': return 'Transfer In';
        case 'MATERIAL_ISSUE_PRODUCTION': return 'Material Consumption';
        case 'FINISHED_GOODS_RECEIPT': return 'Production FG Receipt';
        case 'CUSTOMER_DELIVERY': return 'Customer Delivery';
        case 'SCRAP': return 'Scrap';
        case 'COST_ADJUSTMENT': return 'Cost Adjustment';
        case 'REVERSAL': return 'Reversal';
        default: return type;
      }
    }
  };

  // List of active filter elements to display as chips
  const activeChips = useMemo(() => {
    const list: { key: keyof ERPFilters; label: string; value: string }[] = [];
    
    if (filters.dateFrom) list.push({ key: 'dateFrom', label: t.dateFrom, value: filters.dateFrom });
    if (filters.dateTo) list.push({ key: 'dateTo', label: t.dateTo, value: filters.dateTo });
    if (filters.warehouseType) list.push({ key: 'warehouseType', label: t.whType, value: filters.warehouseType });
    if (filters.warehouseId) {
      const wh = warehouses.find(w => w.id === filters.warehouseId);
      list.push({ key: 'warehouseId', label: t.wh, value: wh ? (isAr ? wh.nameAr : wh.nameEn) : filters.warehouseId });
    }
    if (filters.itemType) list.push({ key: 'itemType', label: t.itemType, value: getItemTypeLabel(filters.itemType) });
    if (filters.itemGroupId) {
      const cat = itemCategories.find(c => c.id === filters.itemGroupId);
      list.push({ key: 'itemGroupId', label: t.itemGroup, value: cat ? (isAr ? cat.nameAr : cat.nameEn) : filters.itemGroupId });
    }
    if (filters.itemCode) list.push({ key: 'itemCode', label: t.itemCode, value: `"${filters.itemCode}"` });
    if (filters.itemDesc) list.push({ key: 'itemDesc', label: t.itemDesc, value: `"${filters.itemDesc}"` });
    if (filters.supplierId) {
      const sup = suppliers.find(s => s.id === filters.supplierId);
      list.push({ key: 'supplierId', label: t.supplier, value: sup ? (isAr ? sup.nameAr : sup.nameEn) : filters.supplierId });
    }
    if (filters.status) list.push({ key: 'status', label: t.status, value: getStatusLabel(filters.status) });
    if (filters.docType) list.push({ key: 'docType', label: t.docType, value: getDocTypeLabel(filters.docType) });
    if (filters.docNum) list.push({ key: 'docNum', label: t.docNum, value: `"${filters.docNum}"` });
    if (filters.createdBy) {
      const usr = users.find(u => u.id === filters.createdBy || u.fullName === filters.createdBy);
      list.push({ key: 'createdBy', label: t.user, value: usr ? usr.fullName : filters.createdBy });
    }
    if (filters.landedCostStatus) {
      const valLabel = filters.landedCostStatus === 'HAS_LC' 
        ? (isAr ? 'يوجد تكلفة إنزال' : 'Has Landed Cost')
        : (isAr ? 'بدون تكلفة إنزال' : 'No Landed Cost');
      list.push({ key: 'landedCostStatus', label: t.landedCostStatus, value: valLabel });
    }

    return list;
  }, [filters, warehouses, itemCategories, suppliers, users, isAr]);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 no-print">
      {/* Header and Summary count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">{t.filterTitle}</h3>
            <div className="text-[10px] text-slate-500 mt-0.5">
              <span>{filteredRecordsCount} {t.recordsFound}</span>
              {filteredRecordsCount !== totalRecordsCount && (
                <span className="mx-1">
                  ({t.totalOf} {totalRecordsCount})
                </span>
              )}
            </div>
          </div>
        </div>

        {(activeChips.length > 0 || onResetView) && (
          <button
            onClick={handleClearAll}
            className="px-2.5 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-100 font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{t.clearAll}</span>
          </button>
        )}
      </div>

      {/* Grid of structured input filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {/* Date From */}
        {config.date && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{t.dateFrom}</span>
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={e => updateFilter('dateFrom', e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        )}

        {/* Date To */}
        {config.date && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{t.dateTo}</span>
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={e => updateFilter('dateTo', e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        )}

        {/* Warehouse Type */}
        {config.warehouseType && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>{t.whType}</span>
            </label>
            <select
              value={filters.warehouseType || ''}
              onChange={e => updateFilter('warehouseType', e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{isAr ? 'كافة التصنيفات' : 'All Types'}</option>
              {uniqueWarehouseTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        )}

        {/* Warehouse */}
        {config.warehouse && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Store className="w-3 h-3 text-slate-400" />
              <span>{t.wh}</span>
            </label>
            <select
              value={filters.warehouseId || ''}
              onChange={e => updateFilter('warehouseId', e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{t.whAll}</option>
              {availableWarehouses.map(wh => (
                <option key={wh.id} value={wh.id}>
                  {isAr ? wh.nameAr : wh.nameEn}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Item Type */}
        {config.itemType && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Package className="w-3 h-3 text-slate-400" />
              <span>{t.itemType}</span>
            </label>
            <select
              value={filters.itemType || ''}
              onChange={e => updateFilter('itemType', e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{isAr ? 'كافة الأنواع' : 'All Types'}</option>
              <option value="RAW_MATERIAL">{getItemTypeLabel('RAW_MATERIAL')}</option>
              <option value="SEMI_FINISHED">{getItemTypeLabel('SEMI_FINISHED')}</option>
              <option value="FINISHED_PRODUCT">{getItemTypeLabel('FINISHED_PRODUCT')}</option>
              <option value="SCRAP">{getItemTypeLabel('SCRAP')}</option>
            </select>
          </div>
        )}

        {/* Item Group */}
        {config.itemGroup && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>{t.itemGroup}</span>
            </label>
            <select
              value={filters.itemGroupId || ''}
              onChange={e => updateFilter('itemGroupId', e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{isAr ? 'كافة المجموعات' : 'All Groups'}</option>
              {itemCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {isAr ? cat.nameAr : cat.nameEn}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Item Code */}
        {config.itemCode && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>{t.itemCode}</span>
            </label>
            <input
              type="text"
              value={filters.itemCode || ''}
              onChange={e => updateFilter('itemCode', e.target.value)}
              placeholder={isAr ? 'البحث بالكود...' : 'Search code...'}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        )}

        {/* Item Description */}
        {config.itemDesc && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>{t.itemDesc}</span>
            </label>
            <input
              type="text"
              value={filters.itemDesc || ''}
              onChange={e => updateFilter('itemDesc', e.target.value)}
              placeholder={isAr ? 'بحث بالاسم...' : 'Search name...'}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Supplier Search with Dynamic Dropdown Autocomplete */}
        {config.supplier && (
          <div className="space-y-1 relative">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Truck className="w-3 h-3 text-slate-400" />
              <span>{t.supplier}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={supplierSearch}
                onChange={e => {
                  setSupplierSearch(e.target.value);
                  updateFilter('supplierId', ''); // Reset ID when user types
                  setShowSupplierDropdown(true);
                }}
                onFocus={() => setShowSupplierDropdown(true)}
                placeholder={t.supplierPlaceholder}
                className="w-full text-xs p-2 pr-7 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Autocomplete Dropdown popup */}
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredSuppliers.map(sup => (
                  <button
                    key={sup.id}
                    type="button"
                    onClick={() => {
                      updateFilter('supplierId', sup.id);
                      setSupplierSearch(isAr ? sup.nameAr : sup.nameEn);
                      setShowSupplierDropdown(false);
                    }}
                    className="w-full text-right text-xs px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-700">
                      {isAr ? sup.nameAr : sup.nameEn}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 px-1 bg-slate-100 rounded">
                      {sup.code}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Click outside to close dropdown */}
            {showSupplierDropdown && (
              <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => setShowSupplierDropdown(false)}
              />
            )}
          </div>
        )}

        {/* Document Status */}
        {config.status && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-slate-400" />
              <span>{t.status}</span>
            </label>
            <select
              value={filters.status || ''}
              onChange={e => updateFilter('status', e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
            >
              <option value="">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
              <option value="POSTED">{getStatusLabel('POSTED')}</option>
              <option value="DRAFT">{getStatusLabel('DRAFT')}</option>
              <option value="CANCELLED">{getStatusLabel('CANCELLED')}</option>
            </select>
          </div>
        )}

        {/* Document Type */}
        {config.docType && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>{t.docType}</span>
            </label>
            <select
              value={filters.docType || ''}
              onChange={e => updateFilter('docType', e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{isAr ? 'كافة المستندات' : 'All Documents'}</option>
              <option value="PURCHASE_RECEIPT">{getDocTypeLabel('PURCHASE_RECEIPT')}</option>
              <option value="LANDED_COST">{getDocTypeLabel('LANDED_COST')}</option>
              <option value="INVENTORY_ISSUE">{getDocTypeLabel('INVENTORY_ISSUE')}</option>
              <option value="TRANSFER_OUT">{getDocTypeLabel('TRANSFER_OUT')}</option>
              <option value="TRANSFER_IN">{getDocTypeLabel('TRANSFER_IN')}</option>
              <option value="MATERIAL_ISSUE_PRODUCTION">{getDocTypeLabel('MATERIAL_ISSUE_PRODUCTION')}</option>
              <option value="FINISHED_GOODS_RECEIPT">{getDocTypeLabel('FINISHED_GOODS_RECEIPT')}</option>
              <option value="CUSTOMER_DELIVERY">{getDocTypeLabel('CUSTOMER_DELIVERY')}</option>
              <option value="SCRAP">{getDocTypeLabel('SCRAP')}</option>
              <option value="COST_ADJUSTMENT">{getDocTypeLabel('COST_ADJUSTMENT')}</option>
              <option value="REVERSAL">{getDocTypeLabel('REVERSAL')}</option>
            </select>
          </div>
        )}

        {/* Document Number */}
        {config.docNum && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-slate-400" />
              <span>{t.docNum}</span>
            </label>
            <input
              type="text"
              value={filters.docNum || ''}
              onChange={e => updateFilter('docNum', e.target.value)}
              placeholder={isAr ? 'رقم المستند...' : 'Doc number...'}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        )}

        {/* Created By User */}
        {config.createdBy && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>{t.user}</span>
            </label>
            <select
              value={filters.createdBy || ''}
              onChange={e => updateFilter('createdBy', e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{isAr ? 'كافة المستخدمين' : 'All Users'}</option>
              {users.map(u => (
                <option key={u.id} value={u.fullName}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Landed Cost Status */}
        {config.landedCostStatus && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>{t.landedCostStatus}</span>
            </label>
            <select
              value={filters.landedCostStatus || ''}
              onChange={e => updateFilter('landedCostStatus', e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{isAr ? 'الكل' : 'All'}</option>
              <option value="HAS_LC">{isAr ? 'يوجد تكلفة إنزال' : 'Has Landed Cost'}</option>
              <option value="NO_LC">{isAr ? 'بدون تكلفة إنزال' : 'No Landed Cost'}</option>
            </select>
          </div>
        )}
      </div>

      {/* Filter chips with individual clear X buttons */}
      {activeChips.length > 0 && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1">{t.activeFilters}:</span>
          {activeChips.map(chip => (
            <div 
              key={chip.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50/70 border border-blue-100 text-blue-700 text-[11px] font-bold shadow-2xs"
            >
              <span>{chip.label}:</span>
              <span className="text-blue-900 font-semibold">{chip.value}</span>
              <button
                type="button"
                onClick={() => handleClearFilter(chip.key)}
                className="hover:bg-blue-100 p-0.5 rounded-full transition cursor-pointer"
              >
                <X className="w-2.5 h-2.5 text-blue-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
