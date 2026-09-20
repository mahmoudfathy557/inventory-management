import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  X,
  Package,
  Boxes,
  Factory,
  Building2,
  MapPin,
  FileText,
  ArrowRightLeft,
  ArrowUpRight,
  SendHorizontal,
  Receipt,
  CornerDownLeft,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Tag,
  Layers,
  Sparkles,
  Command
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language, WarehouseType } from '../../types';
import { NavItem } from '../Sidebar';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { StatusChip } from './StatusChip';

export type SearchCategory = 'all' | 'products' | 'orders' | 'warehouses' | 'documents';

interface SearchResultItem {
  id: string;
  type: 'product' | 'raw-material' | 'production-order' | 'warehouse' | 'location' | 'receipt' | 'transfer' | 'issue';
  category: SearchCategory;
  titleAr: string;
  titleEn: string;
  code: string;
  subtitleAr?: string;
  subtitleEn?: string;
  badgeAr?: string;
  badgeEn?: string;
  badgeColor?: string;
  status?: string;
  targetTab: NavItem;
  meta?: Record<string, any>;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: NavItem) => void;
}

const RECENT_SEARCHES_KEY = 'mfg_erp_recent_searches_v1';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const {
    language,
    products,
    rawMaterials,
    productionOrders,
    warehouses,
    locations,
    receipts,
    transfers,
    issues
  } = useApp();
  const isAr = language === 'ar';

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build the searchable unified index
  const allSearchableItems: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [];

    // 1. Finished & Semi-Finished Products
    products.forEach(p => {
      const isLowStock = p.currentQty <= 0;
      items.push({
        id: `prod-${p.id}`,
        type: 'product',
        category: 'products',
        code: p.code,
        titleAr: p.nameAr,
        titleEn: p.nameEn,
        subtitleAr: `الرصيد: ${formatNumber(p.currentQty, 'ar')} ${p.defaultUOM} | متوسط التكلفة: ${formatCurrency(p.movingAverageCost, 'ar')}`,
        subtitleEn: `Stock: ${formatNumber(p.currentQty, 'en')} ${p.defaultUOM} | MAC: ${formatCurrency(p.movingAverageCost, 'en')}`,
        badgeAr: p.productType === 'FINISHED_PRODUCT' ? 'منتج تام' : 'منتج نصف مصنع',
        badgeEn: p.productType === 'FINISHED_PRODUCT' ? 'Finished Good' : 'Semi-Finished',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        status: p.active ? (isLowStock ? 'LOW_STOCK' : 'ACTIVE') : 'INACTIVE',
        targetTab: 'master-data',
        meta: {
          product: p,
          currentQty: p.currentQty,
          movingAverageCost: p.movingAverageCost,
          totalValue: p.totalValue,
          defaultUOM: p.defaultUOM,
          uom: p.defaultUOM
        }
      });
    });

    // 2. Raw Materials
    rawMaterials.forEach(rm => {
      const isLowStock = rm.currentQty <= (rm.minStock || 0);
      items.push({
        id: `rm-${rm.id}`,
        type: 'raw-material',
        category: 'products',
        code: rm.code,
        titleAr: rm.nameAr,
        titleEn: rm.nameEn,
        subtitleAr: `المخزون الحالي: ${formatNumber(rm.currentQty, 'ar')} ${rm.defaultUOM} | متوسط التكلفة: ${formatCurrency(rm.movingAverageCost, 'ar')}`,
        subtitleEn: `Stock: ${formatNumber(rm.currentQty, 'en')} ${rm.defaultUOM} | MAC: ${formatCurrency(rm.movingAverageCost, 'en')}`,
        badgeAr: 'خامة أولية',
        badgeEn: 'Raw Material',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        status: isLowStock ? 'LOW_STOCK' : 'ACTIVE',
        targetTab: 'master-data',
        meta: {
          rawMaterial: rm,
          currentQty: rm.currentQty,
          minStock: rm.minStock,
          maxStock: rm.maxStock,
          movingAverageCost: rm.movingAverageCost,
          totalValue: rm.totalValue,
          defaultUOM: rm.defaultUOM,
          uom: rm.defaultUOM
        }
      });
    });

    // 3. Production Orders
    productionOrders.forEach(po => {
      items.push({
        id: `po-${po.id}`,
        type: 'production-order',
        category: 'orders',
        code: po.orderNumber,
        titleAr: `${po.orderNumber} - ${po.productName}`,
        titleEn: `${po.orderNumber} - ${po.productName}`,
        subtitleAr: `مخطط: ${formatNumber(po.plannedQuantity, 'ar')} ${po.uom} | تام: ${formatNumber(po.actualFinishedQuantity, 'ar')} | إجمالي التكلفة: ${formatCurrency(po.totalProductionCostEGP, 'ar')}`,
        subtitleEn: `Planned: ${formatNumber(po.plannedQuantity, 'en')} ${po.uom} | Finished: ${formatNumber(po.actualFinishedQuantity, 'en')} | Cost: ${formatCurrency(po.totalProductionCostEGP, 'en')}`,
        badgeAr: po.productionStage || 'مرحلة التصنيع',
        badgeEn: po.productionStage || 'Manufacturing Stage',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        status: po.status,
        targetTab: 'production',
        meta: {
          order: po,
          plannedQuantity: po.plannedQuantity,
          actualFinishedQuantity: po.actualFinishedQuantity,
          actualScrapQuantity: po.actualScrapQuantity,
          qualityStatus: po.qualityStatus,
          totalCost: po.totalProductionCostEGP,
          unitCost: po.finishedGoodsUnitCostEGP,
          uom: po.uom
        }
      });
    });

    // 4. Warehouses
    warehouses.forEach(w => {
      const whLocations = locations.filter(loc => loc.warehouseId === w.id);
      const getWarehouseBadge = (type: WarehouseType) => {
        switch (type) {
          case WarehouseType.RAW_MATERIALS:
            return { ar: 'مستودع خامات', en: 'Raw Materials WH' };
          case WarehouseType.FINISHED_GOODS:
            return { ar: 'مستودع منتج تام', en: 'Finished Goods WH' };
          case WarehouseType.WIP:
            return { ar: 'تشغيل تحت التنفيذ (WIP)', en: 'WIP Location' };
          case WarehouseType.SCRAP:
            return { ar: 'مستودع هالك وخردة', en: 'Scrap & Waste WH' };
          default:
            return { ar: 'مستودع تخزين', en: 'Storage WH' };
        }
      };
      const whBadge = getWarehouseBadge(w.type);

      items.push({
        id: `wh-${w.id}`,
        type: 'warehouse',
        category: 'warehouses',
        code: w.code,
        titleAr: w.nameAr,
        titleEn: w.nameEn,
        subtitleAr: `النوع: ${whBadge.ar} | المواقع التابعة: ${whLocations.length} مواقع تشغيل`,
        subtitleEn: `Type: ${whBadge.en} | Linked Locations: ${whLocations.length} locations`,
        badgeAr: whBadge.ar,
        badgeEn: whBadge.en,
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        status: w.active ? 'ACTIVE' : 'INACTIVE',
        targetTab: 'master-data',
        meta: {
          warehouse: w,
          locations: whLocations
        }
      });
    });

    // 5. Production Locations
    locations.forEach(loc => {
      const parentWh = warehouses.find(w => w.id === loc.warehouseId);
      items.push({
        id: `loc-${loc.id}`,
        type: 'location',
        category: 'warehouses',
        code: loc.code,
        titleAr: loc.nameAr,
        titleEn: loc.nameEn,
        subtitleAr: `المستودع الأب: ${parentWh?.nameAr || 'غير محدد'} | ${loc.stageName || 'موقع تشغيلي'}`,
        subtitleEn: `Parent WH: ${parentWh?.nameEn || 'Unassigned'} | ${loc.stageName || 'Operational Location'}`,
        badgeAr: loc.stageName || 'موقع خط إنتاج',
        badgeEn: loc.stageName || 'Production Line Loc',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        status: loc.active ? 'ACTIVE' : 'INACTIVE',
        targetTab: 'master-data',
        meta: {
          location: loc,
          parentWarehouse: parentWh
        }
      });
    });

    // 6. Documents & Movements (Receipts, Transfers, Issues)
    receipts.forEach(rec => {
      items.push({
        id: `rec-${rec.id}`,
        type: 'receipt',
        category: 'documents',
        code: rec.receiptNumber,
        titleAr: `إذن إضافة مخزني ${rec.receiptNumber}`,
        titleEn: `Goods Receipt ${rec.receiptNumber}`,
        subtitleAr: `المورد: ${rec.supplierName} | الصنف: ${rec.itemName} (${formatNumber(rec.quantity, 'ar')} ${rec.uom})`,
        subtitleEn: `Supplier: ${rec.supplierName} | Item: ${rec.itemName} (${formatNumber(rec.quantity, 'en')} ${rec.uom})`,
        badgeAr: 'إذن إضافة',
        badgeEn: 'Receipt Voucher',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        status: rec.status,
        targetTab: 'receipts',
        meta: { receipt: rec }
      });
    });

    transfers.forEach(trf => {
      items.push({
        id: `trf-${trf.id}`,
        type: 'transfer',
        category: 'documents',
        code: trf.transferNumber,
        titleAr: `إذن تحويل مخزني ${trf.transferNumber}`,
        titleEn: `Internal Transfer ${trf.transferNumber}`,
        subtitleAr: `الصنف: ${trf.itemName} | الكمية: ${formatNumber(trf.quantity, 'ar')} ${trf.uom}`,
        subtitleEn: `Item: ${trf.itemName} | Qty: ${formatNumber(trf.quantity, 'en')} ${trf.uom}`,
        badgeAr: 'إذن تحويل',
        badgeEn: 'Transfer Voucher',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
        status: trf.status,
        targetTab: 'transfers',
        meta: { transfer: trf }
      });
    });

    issues.forEach(iss => {
      items.push({
        id: `iss-${iss.id}`,
        type: 'issue',
        category: 'documents',
        code: iss.issueNumber,
        titleAr: `إذن صرف مخزني ${iss.issueNumber}`,
        titleEn: `Inventory Issue ${iss.issueNumber}`,
        subtitleAr: `الصنف: ${iss.itemName} | السبب: ${iss.reason || 'صرف تشغيلي'}`,
        subtitleEn: `Item: ${iss.itemName} | Reason: ${iss.reason || 'Operational Issue'}`,
        badgeAr: 'إذن صرف',
        badgeEn: 'Issue Voucher',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        status: iss.status,
        targetTab: 'issues',
        meta: { issue: iss }
      });
    });

    return items;
  }, [products, rawMaterials, productionOrders, warehouses, locations, receipts, transfers, issues]);

  // Filter items by active query and category
  const filteredResults = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return allSearchableItems.filter(item => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      // If query is empty, allow top items in active category
      if (!cleanQuery) {
        return true;
      }

      // Match against code, Arabic title, English title, subtitle, badges, or meta details
      const matchCode = item.code.toLowerCase().includes(cleanQuery);
      const matchTitleAr = item.titleAr.toLowerCase().includes(cleanQuery);
      const matchTitleEn = item.titleEn.toLowerCase().includes(cleanQuery);
      const matchSubtitleAr = item.subtitleAr?.toLowerCase().includes(cleanQuery) || false;
      const matchSubtitleEn = item.subtitleEn?.toLowerCase().includes(cleanQuery) || false;
      const matchBadge = item.badgeAr?.toLowerCase().includes(cleanQuery) || item.badgeEn?.toLowerCase().includes(cleanQuery) || false;

      return matchCode || matchTitleAr || matchTitleEn || matchSubtitleAr || matchSubtitleEn || matchBadge;
    });
  }, [allSearchableItems, query, activeCategory]);

  // Compute category count breakdown for current query
  const categoryCounts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const counts: Record<SearchCategory, number> = {
      all: 0,
      products: 0,
      orders: 0,
      warehouses: 0,
      documents: 0
    };

    allSearchableItems.forEach(item => {
      const match =
        !cleanQuery ||
        item.code.toLowerCase().includes(cleanQuery) ||
        item.titleAr.toLowerCase().includes(cleanQuery) ||
        item.titleEn.toLowerCase().includes(cleanQuery) ||
        item.subtitleAr?.toLowerCase().includes(cleanQuery) ||
        item.subtitleEn?.toLowerCase().includes(cleanQuery);

      if (match) {
        counts.all += 1;
        counts[item.category] += 1;
      }
    });

    return counts;
  }, [allSearchableItems, query]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const selectedItem = filteredResults[selectedIndex] || null;

  // Handle saving search to history
  const handleSaveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    try {
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSelectItem = (item: SearchResultItem) => {
    if (query.trim()) {
      handleSaveRecentSearch(query.trim());
    }
    onClose();
    if (onNavigate) {
      onNavigate(item.targetTab);
    }
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedItem) {
        handleSelectItem(selectedItem);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const getItemIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4 text-emerald-600" />;
      case 'raw-material':
        return <Boxes className="w-4 h-4 text-blue-600" />;
      case 'production-order':
        return <Factory className="w-4 h-4 text-amber-600" />;
      case 'warehouse':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-indigo-600" />;
      case 'receipt':
        return <Receipt className="w-4 h-4 text-teal-600" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-sky-600" />;
      case 'issue':
        return <SendHorizontal className="w-4 h-4 text-rose-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 md:p-10 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
      id="global-search-modal-backdrop"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col my-auto max-h-[88vh] text-slate-900 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        id="global-search-palette-container"
      >
        {/* Top Search Input Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              id="input-global-search-palette"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث سريع في المنتجات، الخامات، أوامر الإنتاج، المستودعات، الحركات... (أو اضغط Esc للإغلاق)'
                  : 'Search products, raw materials, production orders, warehouses, receipts... (or Esc to close)'
              }
              className="w-full bg-transparent border-0 focus:ring-0 text-slate-900 text-sm sm:text-base font-medium placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
              title={isAr ? 'مسح البحث' : 'Clear search'}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/70 text-slate-600 text-xs font-mono font-semibold">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>

          <button
            id="btn-close-global-search"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            id="filter-cat-all"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{isAr ? 'كافة العناصر' : 'All Items'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeCategory === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {categoryCounts.all}
            </span>
          </button>

          <button
            id="filter-cat-products"
            onClick={() => setActiveCategory('products')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeCategory === 'products'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأصناف والمنتجات' : 'Products & Materials'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeCategory === 'products' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {categoryCounts.products}
            </span>
          </button>

          <button
            id="filter-cat-orders"
            onClick={() => setActiveCategory('orders')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeCategory === 'orders'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>{isAr ? 'أوامر الإنتاج' : 'Production Orders'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeCategory === 'orders' ? 'bg-amber-800 text-amber-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {categoryCounts.orders}
            </span>
          </button>

          <button
            id="filter-cat-warehouses"
            onClick={() => setActiveCategory('warehouses')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeCategory === 'warehouses'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'المستودعات والمواقع' : 'Warehouses & Locations'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeCategory === 'warehouses' ? 'bg-purple-800 text-purple-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {categoryCounts.warehouses}
            </span>
          </button>

          <button
            id="filter-cat-documents"
            onClick={() => setActiveCategory('documents')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeCategory === 'documents'
                ? 'bg-sky-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? 'المستندات والحركات' : 'Operations & Vouchers'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeCategory === 'documents' ? 'bg-sky-800 text-sky-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {categoryCounts.documents}
            </span>
          </button>
        </div>

        {/* Query History Chips when no query typed */}
        {!query && recentSearches.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {isAr ? 'عمليات البحث الأخيرة:' : 'Recent Searches:'}
              </span>
              {recentSearches.map(term => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-md text-slate-700 font-medium transition shrink-0"
                >
                  {term}
                </button>
              ))}
            </div>
            <button
              onClick={handleClearHistory}
              className="text-slate-400 hover:text-rose-600 font-semibold text-[11px] shrink-0 transition"
            >
              {isAr ? 'مسح السجل' : 'Clear'}
            </button>
          </div>
        )}

        {/* Main Content Area: Split View (List + Live Preview) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
          {/* Results List Pane */}
          <div
            ref={listRef}
            className="md:col-span-7 overflow-y-auto p-2 divide-y divide-slate-100 max-h-[50vh] md:max-h-[54vh] border-e border-slate-200"
          >
            {filteredResults.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-700 text-sm">
                    {isAr ? 'لم يتم العثور على نتائج مطابقة' : 'No matching results found'}
                  </div>
                  <div className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isAr
                      ? `لا توجد أصناف أو أوامر أو مستودعات تطابق "${query}". حاول استخدام كلمات مفتاحية أخرى أو الكود التعريفي.`
                      : `No products, orders, or warehouses matched "${query}". Try searching by code or category.`}
                  </div>
                </div>
              </div>
            ) : (
              filteredResults.map((item, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <div
                    key={item.id}
                    id={`search-item-${item.id}`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => handleSelectItem(item)}
                    className={`p-3 rounded-xl transition cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/90 border border-blue-200 shadow-2xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                        {getItemIcon(item.type)}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {item.code}
                          </span>
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {isAr ? item.titleAr : item.titleEn}
                          </span>
                          {item.badgeAr && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                            >
                              {isAr ? item.badgeAr : item.badgeEn}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 font-medium truncate">
                          {isAr ? item.subtitleAr : item.subtitleEn}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-center">
                      <button
                        onClick={e => handleCopyCode(item.code, e)}
                        className="p-1.5 rounded-md hover:bg-white text-slate-400 hover:text-slate-800 border border-transparent hover:border-slate-200 transition"
                        title={isAr ? 'نسخ الكود' : 'Copy Code'}
                      >
                        {copiedCode === item.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isAr ? 'rotate-180' : ''
                        } ${isSelected ? 'text-blue-600' : ''}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Live Preview / Quick Action Inspector Pane */}
          <div className="hidden md:flex md:col-span-5 flex-col justify-between bg-slate-50/60 p-5 overflow-y-auto max-h-[54vh]">
            {selectedItem ? (
              <div className="space-y-4">
                {/* Header Preview */}
                <div className="space-y-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                      {selectedItem.code}
                    </span>
                    {selectedItem.status && (
                      <StatusChip status={selectedItem.status} size="sm" />
                    )}
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900">
                    {isAr ? selectedItem.titleAr : selectedItem.titleEn}
                  </h4>
                  <div className="text-xs text-slate-500 font-medium">
                    {isAr ? selectedItem.badgeAr : selectedItem.badgeEn}
                  </div>
                </div>

                {/* Dynamic Attributes Breakdown */}
                {selectedItem.category === 'products' && selectedItem.meta && (
                  <div className="space-y-2.5 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          {isAr ? 'الرصيد المتاح بالمخازن:' : 'Current Stock:'}
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatNumber(selectedItem.meta.currentQty, language)} {selectedItem.meta.uom}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          {isAr ? 'متوسط التكلفة المتحرك (MAC):' : 'Moving Average Cost:'}
                        </span>
                        <span className="font-mono font-bold text-blue-700">
                          {formatCurrency(selectedItem.meta.movingAverageCost, language)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">
                          {isAr ? 'إجمالي قيمة المخزون:' : 'Total Stock Value:'}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 text-sm">
                          {formatCurrency(selectedItem.meta.totalValue, language)}
                        </span>
                      </div>
                    </div>

                    {selectedItem.meta.minStock !== undefined && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          {isAr ? 'حد إعادة الطلب (Min):' : 'Reorder Level (Min):'}
                        </span>
                        <span className="font-mono font-bold text-amber-700">
                          {formatNumber(selectedItem.meta.minStock, language)} {selectedItem.meta.uom}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {selectedItem.category === 'orders' && selectedItem.meta && (
                  <div className="space-y-2.5 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          {isAr ? 'الكمية المخططة:' : 'Planned Quantity:'}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatNumber(selectedItem.meta.plannedQuantity, language)} {selectedItem.meta.uom}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          {isAr ? 'الكمية التامة المنتجة:' : 'Actual Finished Goods:'}
                        </span>
                        <span className="font-mono font-bold text-emerald-700">
                          {formatNumber(selectedItem.meta.actualFinishedQuantity, language)} {selectedItem.meta.uom}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          {isAr ? 'كمية الهالك المسجلة:' : 'Actual Scrap Qty:'}
                        </span>
                        <span className="font-mono font-bold text-rose-600">
                          {formatNumber(selectedItem.meta.actualScrapQuantity, language)} {selectedItem.meta.uom}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          {isAr ? 'تكلفة الإنتاج الإجمالية:' : 'Total Production Cost:'}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(selectedItem.meta.totalCost, language)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          {isAr ? 'تكلفة الوحدة المنتجة:' : 'Unit Cost EGP:'}
                        </span>
                        <span className="font-mono font-bold text-blue-700">
                          {formatCurrency(selectedItem.meta.unitCost, language)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem.category === 'warehouses' && selectedItem.meta && (
                  <div className="space-y-2.5 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-slate-600 leading-relaxed">
                        {isAr ? selectedItem.subtitleAr : selectedItem.subtitleEn}
                      </div>
                      {selectedItem.meta.locations && selectedItem.meta.locations.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="text-[11px] font-bold text-slate-700 mb-1.5">
                            {isAr ? 'المواقع الداخلية التابعة:' : 'Sub-Locations:'}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedItem.meta.locations.map((loc: any) => (
                              <span
                                key={loc.id}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200"
                              >
                                {loc.code} ({isAr ? loc.nameAr : loc.nameEn})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedItem.category === 'documents' && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="text-slate-600 leading-relaxed font-medium">
                      {isAr ? selectedItem.subtitleAr : selectedItem.subtitleEn}
                    </div>
                  </div>
                )}

                {/* Action Trigger Button */}
                <div className="pt-2 space-y-2">
                  <button
                    id="btn-navigate-search-result"
                    onClick={() => handleSelectItem(selectedItem)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <span>{isAr ? 'الانتقال إلى القسم والتفاصيل' : 'Go to Section & Details'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={e => handleCopyCode(selectedItem.code, e)}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {copiedCode === selectedItem.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">{isAr ? 'تم نسخ الكود!' : 'Code Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isAr ? `نسخ الكود (${selectedItem.code})` : `Copy Code (${selectedItem.code})`}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs text-slate-400">
                {isAr ? 'حدد عنصراً من القائمة لمعاينته' : 'Select an item to view preview'}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Keyboard Shortcut Helper Footer */}
        <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-2xs font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-2xs font-mono text-[10px]">
                ↓
              </kbd>
              <span>{isAr ? 'للتنقل' : 'to navigate'}</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-2xs font-mono text-[10px]">
                ↵ Enter
              </kbd>
              <span>{isAr ? 'للاختيار والفتح' : 'to open'}</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-2xs font-mono text-[10px]">
                Esc
              </kbd>
              <span>{isAr ? 'للإغلاق' : 'to close'}</span>
            </span>
          </div>

          <div className="text-slate-500 hidden sm:block">
            {isAr ? 'نظام البحث الشامل المتكامل ERP' : 'Integrated ERP Command Palette'}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
