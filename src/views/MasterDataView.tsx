import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Boxes,
  Package,
  Building2,
  Users,
  Layers,
  Cog,
  Scale,
  DollarSign,
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Bookmark,
  ArrowRightLeft,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/common/ConfirmDialog';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  RawMaterial,
  Product,
  Warehouse,
  ProductionLocation,
  BOM,
  Machine,
  Customer,
  Supplier,
  UOM,
  Currency,
  User,
  WarehouseType,
  ItemCategory,
  ValuationMethod,
  VALUATION_METHOD_LABELS,
  ItemType
} from '../types';

import { RawMaterialModal } from '../components/master-data/RawMaterialModal';
import { ProductModal } from '../components/master-data/ProductModal';
import { BOMModal } from '../components/master-data/BOMModal';
import { WarehouseModal } from '../components/master-data/WarehouseModal';
import { LocationModal } from '../components/master-data/LocationModal';
import { MachineModal } from '../components/master-data/MachineModal';
import { PartnerModal } from '../components/master-data/PartnerModal';
import { UOMModal } from '../components/master-data/UOMModal';
import { CurrencyModal } from '../components/master-data/CurrencyModal';
import { UserModal } from '../components/master-data/UserModal';
import { ItemCategoryModal } from '../components/master-data/ItemCategoryModal';
import { CurrencyRatesManager } from '../components/master-data/CurrencyRatesManager';
import { ClearSeedDataModal } from '../components/common/ClearSeedDataModal';
import { MasterDataSkeleton } from '../components/common/Skeleton';
import { usePerceivedLoading } from '../hooks/usePerceivedLoading';

export type MasterDataTab =
  | 'categories'
  | 'raw'
  | 'products'
  | 'boms'
  | 'warehouses'
  | 'machines'
  | 'partners'
  | 'uoms'
  | 'currencies'
  | 'users';

interface MasterDataViewProps {
  initialTab?: MasterDataTab;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ initialTab }) => {
  const { isLoading } = usePerceivedLoading(180);
  const {
    language,
    itemCategories,
    rawMaterials,
    products,
    warehouses,
    locations,
    boms,
    machines,
    customers,
    suppliers,
    uoms,
    currencies,
    users,
    deleteItemCategory,
    deleteRawMaterial,
    deleteProduct,
    deleteBOM,
    deleteWarehouse,
    deleteLocation,
    deleteMachine,
    deleteCustomer,
    deleteSupplier,
    deleteUOM,
    deleteCurrency,
    deleteUser
  } = useApp();
  const confirm = useConfirm();

  const isAr = language === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<MasterDataTab>(() => {
    if (initialTab) return initialTab;
    try {
      const saved = localStorage.getItem('mrp_master_data_subtab') as MasterDataTab | null;
      const validSubTabs: MasterDataTab[] = [
        'categories', 'raw', 'products', 'boms', 'warehouses',
        'machines', 'partners', 'uoms', 'currencies', 'users'
      ];
      if (saved && validSubTabs.includes(saved)) {
        return saved;
      }
    } catch {}
    return 'raw';
  });

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    try {
      localStorage.setItem('mrp_master_data_subtab', activeSubTab);
    } catch {}
  }, [activeSubTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerSubtype, setPartnerSubtype] = useState<'ALL' | 'CUSTOMERS' | 'SUPPLIERS'>('ALL');
  const [warehouseViewType, setWarehouseViewType] = useState<'ALL' | 'WH' | 'LOC'>('ALL');
  const [valuationMethodFilter, setValuationMethodFilter] = useState<'ALL' | ValuationMethod>('ALL');
  const [productTypeFilter, setProductTypeFilter] = useState<'ALL' | ItemType>('ALL');

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [isCategoryDuplicate, setIsCategoryDuplicate] = useState(false);

  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [selectedRaw, setSelectedRaw] = useState<RawMaterial | null>(null);
  const [isRawDuplicate, setIsRawDuplicate] = useState(false);

  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);
  const [isProdDuplicate, setIsProdDuplicate] = useState(false);

  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [isBOMDuplicate, setIsBOMDuplicate] = useState(false);

  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [selectedWh, setSelectedWh] = useState<Warehouse | null>(null);
  const [isWhDuplicate, setIsWhDuplicate] = useState(false);

  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<ProductionLocation | null>(null);
  const [isLocDuplicate, setIsLocDuplicate] = useState(false);

  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isMachineDuplicate, setIsMachineDuplicate] = useState(false);

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerModalType, setPartnerModalType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [selectedPartner, setSelectedPartner] = useState<Customer | Supplier | null>(null);
  const [isPartnerDuplicate, setIsPartnerDuplicate] = useState(false);

  const [isUOMModalOpen, setIsUOMModalOpen] = useState(false);
  const [selectedUOM, setSelectedUOM] = useState<UOM | null>(null);
  const [isUOMDuplicate, setIsUOMDuplicate] = useState(false);

  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [currencySubTab, setCurrencySubTab] = useState<'RATES_BY_DATE' | 'CURRENCIES'>('RATES_BY_DATE');
  const [isClearSeedModalOpen, setIsClearSeedModalOpen] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Tabs scroll container ref & arrows state
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollState = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Note: in RTL, scrollLeft can be negative or 0 depending on browser engine
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 2) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    // Handle both RTL and LTR
    const isRtl = document.dir === 'rtl' || language === 'ar';
    if (isRtl) {
      // In modern browsers with RTL, scrollLeft can be 0 at leftmost, or negative
      const absScroll = Math.abs(scrollLeft);
      setCanScrollRight(absScroll > 5);
      setCanScrollLeft(absScroll < maxScroll - 5);
    } else {
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < maxScroll - 5);
    }
  }, [language]);

  useEffect(() => {
    checkScrollState();
    const el = tabsContainerRef.current;
    if (!el) return;

    // Enable mouse wheel horizontal scrolling
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY, behavior: 'auto' });
      }
    };

    el.addEventListener('scroll', checkScrollState, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', checkScrollState);
    return () => {
      el.removeEventListener('scroll', checkScrollState);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [checkScrollState]);

  // Auto-scroll active tab into view when selected
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const activeBtn = el.querySelector<HTMLElement>('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    setTimeout(checkScrollState, 350);
  }, [activeSubTab, checkScrollState]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const isRtl = document.dir === 'rtl' || language === 'ar';
    const amount = 240;
    // Calculate delta based on direction and RTL
    let delta = direction === 'left' ? -amount : amount;
    if (isRtl) {
      // In RTL, navigating left moves forward into content, right moves back
      delta = direction === 'left' ? -amount : amount;
    }
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkScrollState, 350);
  };

  const triggerDelete = (title: string, message: string, itemName: string, onConfirm: () => void) => {
    void confirm({
      title,
      message,
      itemName,
      confirmLabel: isAr ? 'تأكيد الحذف' : 'Confirm Delete',
      variant: 'danger',
    }).then(ok => {
      if (ok) onConfirm();
    });
  };

  if (isLoading) {
    return <MasterDataSkeleton />;
  }

  return (
    <div className="space-y-5" id="view-master-data">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>{isAr ? 'البيانات الأساسية ودليل التشغيل (Master Data CRUD Hub)' : 'Master Data Hub'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {isAr ? 'شامل الإضافة والتعديل والحذف' : 'Full CRUD Enabled'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? 'إدارة متكاملة لبطاقات الخامات، المنتجات، قوائم التشغيل BOM، المستودعات، الماكينات، الشركاء، وحدات القياس، والعملات'
              : 'Create, update, and manage products, raw materials, BOMs, work centers, warehouses, and partners.'}
          </p>
        </div>

        {/* Dynamic Add Action Button & Clear Seed Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClearSeedModalOpen(true)}
            className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title={isAr ? 'مسح بيانات البذر والبدء من الصفر' : 'Clear seed data & start scratch'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'مسح البيانات والبدء من الصفر' : 'Clear & Start Scratch'}</span>
          </button>
          {activeSubTab === 'categories' && (
            <button
              onClick={() => { setSelectedCategory(null); setIsCategoryDuplicate(false); setIsCategoryModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تكويد مجموعة جديدة' : 'Add Item Group'}</span>
            </button>
          )}

          {activeSubTab === 'raw' && (
            <button
              onClick={() => { setSelectedRaw(null); setIsRawDuplicate(false); setIsRawModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة مادة خام' : 'Add Raw Material'}</span>
            </button>
          )}

          {activeSubTab === 'products' && (
            <button
              onClick={() => { setSelectedProd(null); setIsProdDuplicate(false); setIsProdModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة منتج' : 'Add Product'}</span>
            </button>
          )}

          {activeSubTab === 'boms' && (
            <button
              onClick={() => { setSelectedBOM(null); setIsBOMDuplicate(false); setIsBOMModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إنشاء قائمة مواد (BOM)' : 'Create BOM'}</span>
            </button>
          )}

          {activeSubTab === 'warehouses' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedWh(null); setIsWhDuplicate(false); setIsWhModalOpen(true); }}
                className="px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'مستودع جديد' : 'New Warehouse'}</span>
              </button>
              <button
                onClick={() => { setSelectedLoc(null); setIsLocDuplicate(false); setIsLocModalOpen(true); }}
                className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'موقع إنتاج / مرحلة' : 'New Stage/Loc'}</span>
              </button>
            </div>
          )}

          {activeSubTab === 'machines' && (
            <button
              onClick={() => { setSelectedMachine(null); setIsMachineDuplicate(false); setIsMachineModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة ماكينة' : 'Add Machine'}</span>
            </button>
          )}

          {activeSubTab === 'partners' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPartnerModalType('CUSTOMER'); setSelectedPartner(null); setIsPartnerDuplicate(false); setIsPartnerModalOpen(true); }}
                className="px-3 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة عميل' : 'Add Customer'}</span>
              </button>
              <button
                onClick={() => { setPartnerModalType('SUPPLIER'); setSelectedPartner(null); setIsPartnerDuplicate(false); setIsPartnerModalOpen(true); }}
                className="px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة مورد' : 'Add Supplier'}</span>
              </button>
            </div>
          )}

          {activeSubTab === 'uoms' && (
            <button
              onClick={() => { setSelectedUOM(null); setIsUOMDuplicate(false); setIsUOMModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة وحدة قياس' : 'Add UOM'}</span>
            </button>
          )}

          {activeSubTab === 'currencies' && (
            <button
              onClick={() => { setSelectedCurrency(null); setIsCurrencyModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة عملة' : 'Add Currency'}</span>
            </button>
          )}

          {activeSubTab === 'users' && (
            <button
              onClick={() => { setSelectedUser(null); setIsUserModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة مستخدم' : 'Add User'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Navigation Bar with Elegant Smooth Scroll Bar & Navigation Controls */}
      <div className="relative group/nav bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all cursor-pointer ${
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title={isAr ? 'تمرير لليسار' : 'Scroll left'}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all cursor-pointer ${
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title={isAr ? 'تمرير لليمين' : 'Scroll right'}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Gradient edge fades to subtly hint at more tabs */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-5 rounded-l-2xl transition-opacity duration-200 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent z-5 rounded-r-2xl transition-opacity duration-200 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Scrollable Tabs Track */}
        <div
          ref={tabsContainerRef}
          className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 px-2 text-xs custom-nav-scrollbar scroll-smooth"
        >
          <button
            data-active={activeSubTab === 'categories'}
            onClick={() => { setActiveSubTab('categories'); setSearchTerm(''); }}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm ring-2 ring-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50/80 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <Bookmark className="w-4 h-4 text-indigo-300" />
            <span>{isAr ? 'مجموعات الأصناف وطرق التقييم' : 'Item Groups & Valuation'}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'categories' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {itemCategories.length}
            </span>
          </button>

          <button
            data-active={activeSubTab === 'raw'}
            onClick={() => { setActiveSubTab('raw'); setSearchTerm(''); }}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'raw'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm ring-2 ring-blue-200'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50/80 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-300" />
            <span>{isAr ? 'المواد الخام' : 'Raw Materials'}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'raw' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {rawMaterials.length}
            </span>
          </button>

          <button
            data-active={activeSubTab === 'products'}
            onClick={() => { setActiveSubTab('products'); setSearchTerm(''); }}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'products'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm ring-2 ring-emerald-200'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50/80 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-300" />
            <span>{isAr ? 'المنتجات' : 'Products'}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'products' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {products.length}
            </span>
          </button>

          <button
            data-active={activeSubTab === 'boms'}
            onClick={() => { setActiveSubTab('boms'); setSearchTerm(''); }}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'boms'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-sm ring-2 ring-purple-200'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50/80 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <Boxes className="w-4 h-4 text-purple-300" />
            <span>{isAr ? 'قوائم المواد (BOM)' : 'BOM Formulas'}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'boms' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {boms.length}
            </span>
          </button>

          <button
            data-active={activeSubTab === 'warehouses'}
            onClick={() => { setActiveSubTab('warehouses'); setSearchTerm(''); }}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'warehouses'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-sm ring-2 ring-cyan-200'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50/80 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <Building2 className="w-4 h-4 text-cyan-300" />
            <span>{isAr ? 'المستودعات والمواقع' : 'Warehouses'}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'warehouses' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {warehouses.length + locations.length}
            </span>
          </button>

          <button
            data-active={activeSubTab === 'machines'}
            onClick={() => { setActiveSubTab('machines'); setSearchTerm(''); }}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'machines'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm ring-2 ring-amber-200'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50/80 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <Cog className="w-4 h-4 text-amber-300" />
            <span>{isAr ? 'الماكينات ومراكز التشغيل' : 'Machines'}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'machines' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {machines.length}
            </span>
          </button>

          <button
            data-active={activeSubTab === 'partners'}
            onClick={() => { setActiveSubTab('partners'); setSearchTerm(''); }}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'partners'
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm ring-2 ring-teal-200'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50/80 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <Users className="w-4 h-4 text-teal-300" />
            <span>{isAr ? 'الشركاء (عملاء وموردين)' : 'Partners'}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'partners' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {customers.length + suppliers.length}
            </span>
          </button>

          <button
            data-active={activeSubTab === 'uoms'}
            onClick={() => { setActiveSubTab('uoms'); setSearchTerm(''); }}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'uoms'
                ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-sm ring-2 ring-orange-200'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50/80 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <Scale className="w-4 h-4 text-orange-300" />
            <span>{isAr ? 'وحدات القياس' : 'UOM'}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'uoms' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {uoms.length}
            </span>
          </button>

          <button
            data-active={activeSubTab === 'currencies'}
            onClick={() => { setActiveSubTab('currencies'); setSearchTerm(''); }}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'currencies'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm ring-2 ring-emerald-200'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50/80 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-300" />
            <span>{isAr ? 'العملات والصرف' : 'Currencies'}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'currencies' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {currencies.length}
            </span>
          </button>

          <button
            data-active={activeSubTab === 'users'}
            onClick={() => { setActiveSubTab('users'); setSearchTerm(''); }}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-sm ring-2 ring-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50/80 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-300" />
            <span>{isAr ? 'المستخدمين والأدوار' : 'Users & Roles'}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {users.length}
            </span>
          </button>
        </div>
      </div>

      {/* Global Search Filter */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder={isAr ? 'بحث سريع بالكود، الاسم، أو الملاحظات...' : 'Search by code, name, or details...'}
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
      </div>

      {/* SUB-VIEW 0: ITEM CATEGORIES & VALUATION METHODS */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          {/* Method Filter & Statistics */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700">{isAr ? 'طريقة تقييم المخزون:' : 'Valuation Method:'}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['ALL', ValuationMethod.MOVING_AVERAGE, ValuationMethod.FIFO, ValuationMethod.STANDARD] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setValuationMethodFilter(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        valuationMethodFilter === m
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m === 'ALL'
                        ? (isAr ? 'الكل' : 'All')
                        : m === ValuationMethod.MOVING_AVERAGE
                        ? (isAr ? 'متوسط متحرك (Moving average)' : 'Moving Average')
                        : m === ValuationMethod.FIFO
                        ? (isAr ? 'الوارد أولاً صادر أولاً (FIFO)' : 'FIFO')
                        : (isAr ? 'التكلفة المعيارية (Standard)' : 'Standard')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>{isAr ? 'المجموعات المخزنية المعرفة:' : 'Defined Groups:'}</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {itemCategories.length}
                </span>
              </div>
            </div>
          </div>

          {/* If no categories yet */}
          {itemCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-indigo-200 p-10 text-center space-y-4 shadow-2xs">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <Bookmark className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isAr ? 'لم تقم بتكويد أي مجموعات مخزنية بعد' : 'No Item Groups Defined Yet'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isAr
                    ? 'يمكنك تكويد مجموعات المخزون وفق تصنيفات مصنعك (مثل: Carrier, Additives, Scrap, الخامات الأساسية...) وربط كل مجموعة بإحدى طرق تقييم المخزون الثلاث: Moving average cost أو FIFO أو Standard. ستظهر المجموعات تلقائياً عند تكويد أي خامة أو منتج أو هالك.'
                    : 'Create your inventory groups (e.g., Carrier, Additives, Scrap) and configure their valuation method (Moving average cost, FIFO, Standard). These groups will be available when coding raw materials, products, and scrap.'}
                </p>
              </div>
              <button
                onClick={() => { setSelectedCategory(null); setIsCategoryModalOpen(true); }}
                className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'تكويد أول مجموعة مخزنية الآن' : 'Create First Item Group'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemCategories
                .filter(cat => {
                  const matchSearch =
                    cat.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cat.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cat.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchVal =
                    valuationMethodFilter === 'ALL' || cat.valuationMethod === valuationMethodFilter;
                  return matchSearch && matchVal;
                })
                .map(cat => {
                  const valLabel = VALUATION_METHOD_LABELS[cat.valuationMethod];
                  const linkedRaw = rawMaterials.filter(r => r.categoryId === cat.id).length;
                  const linkedProd = products.filter(p => p.categoryId === cat.id).length;

                  return (
                    <div
                      key={cat.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3 relative group"
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                            {cat.code}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            cat.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {cat.active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelectedCategory(cat); setIsCategoryDuplicate(true); setIsCategoryModalOpen(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title={isAr ? 'نسخ وتكرار سريع' : 'Duplicate Category'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setSelectedCategory(cat); setIsCategoryDuplicate(false); setIsCategoryModalOpen(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title={isAr ? 'تعديل المجموعة' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDelete(
                              isAr ? 'حذف مجموعة الصنف' : 'Delete Item Group',
                              isAr ? 'هل أنت متأكد من حذف هذه المجموعة؟ سيتم فك ارتباط عناصر المخزون التابعة لها.' : 'Are you sure you want to delete this category?',
                              `${cat.code} - ${cat.nameAr}`,
                              () => deleteItemCategory(cat.id)
                            )}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title={isAr ? 'حذف المجموعة' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{cat.nameAr}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{cat.nameEn}</p>
                        {cat.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      {/* Valuation Method Card */}
                      <div className={`p-3 rounded-xl border ${valLabel.badgeBg} ${valLabel.border} space-y-1.5`}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{isAr ? 'طريقة التقييم المعتمدة:' : 'Valuation Method:'}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-white border ${valLabel.border} ${valLabel.badgeText}`}>
                            {cat.valuationMethod}
                          </span>
                        </div>
                        <div className={`text-xs font-bold ${valLabel.badgeText}`}>
                          {isAr ? valLabel.ar : valLabel.en}
                        </div>
                        <p className="text-[10.5px] text-slate-600 leading-relaxed">
                          {isAr ? valLabel.descAr : valLabel.descEn}
                        </p>
                        {cat.valuationMethod === ValuationMethod.STANDARD && typeof cat.standardCostEGP === 'number' && (
                          <div className="pt-1.5 mt-1 border-t border-purple-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-purple-800 font-medium">{isAr ? 'التكلفة القياسية المحددة:' : 'Standard Cost:'}</span>
                            <span className="font-mono font-bold text-purple-900">{formatCurrency(cat.standardCostEGP, language)}</span>
                          </div>
                        )}
                      </div>

                      {/* Scope & Count */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {isAr ? 'النطاق:' : 'Scope:'}{' '}
                          <strong className="text-slate-800">
                            {cat.applicableType === 'ALL' || !cat.applicableType
                              ? (isAr ? 'شامل كل الأصناف' : 'All Items')
                              : cat.applicableType === ItemType.RAW_MATERIAL
                              ? (isAr ? 'خامات فقط' : 'Raw Materials')
                              : cat.applicableType === ItemType.FINISHED_PRODUCT
                              ? (isAr ? 'منتجات تامة' : 'Finished Goods')
                              : cat.applicableType === ItemType.SEMI_FINISHED
                              ? (isAr ? 'نصف مصنعة' : 'Semi-Finished')
                              : (isAr ? 'هالك ومخلفات' : 'Scrap')}
                          </strong>
                        </span>
                        <span>
                          {isAr ? 'عناصر مرتبطة:' : 'Linked:'}{' '}
                          <strong className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {linkedRaw + linkedProd}
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 1: RAW MATERIALS */}
      {activeSubTab === 'raw' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rawMaterials
              .filter(m =>
                m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(m => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {m.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedRaw(m); setIsRawDuplicate(true); setIsRawModalOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                        title={isAr ? 'نسخ وتكرار سريع' : 'Duplicate Raw Material'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setSelectedRaw(m); setIsRawDuplicate(false); setIsRawModalOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title={isAr ? 'تعديل الصنف' : 'Edit'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => triggerDelete(
                          isAr ? 'حذف المادة الخام' : 'Delete Raw Material',
                          isAr ? 'هل أنت متأكد من حذف بطاقة المادة الخام؟' : 'Are you sure you want to delete this raw material?',
                          `${m.code} - ${m.nameAr}`,
                          () => deleteRawMaterial(m.id)
                        )}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title={isAr ? 'حذف الصنف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{m.nameAr}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{m.nameEn}</p>
                    {m.notes && <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{m.notes}</p>}
                  </div>

                  {/* Category & Valuation Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {m.categoryNameAr ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Bookmark className="w-2.5 h-2.5" />
                        <span>{isAr ? m.categoryNameAr : (m.categoryNameEn || m.categoryNameAr)}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] text-slate-400 bg-slate-50 border border-slate-200">
                        {isAr ? 'بدون مجموعة' : 'No Group'}
                      </span>
                    )}
                    {m.valuationMethod && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                        m.valuationMethod === ValuationMethod.FIFO
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : m.valuationMethod === ValuationMethod.STANDARD
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {m.valuationMethod}
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] font-sans block">{isAr ? 'الرصيد المتاح:' : 'Stock:'}</span>
                      <span className="font-bold text-slate-900">{formatNumber(m.currentQty, language)} {m.defaultUOM}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-sans block">{isAr ? 'متوسط التكلفة:' : 'Unit MAC:'}</span>
                      <span className="font-bold text-blue-700">{formatCurrency(m.movingAverageCost, language)}</span>
                    </div>
                    <div className="col-span-2 pt-1.5 border-t border-slate-200/80 flex justify-between items-center">
                      <span className="text-slate-500 text-[10px] font-sans">{isAr ? 'إجمالي التقييم المخزني:' : 'Total Value:'}</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(m.totalValue, language)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{isAr ? 'حد إعادة الطلب:' : 'Reorder:'} <strong className="font-mono text-slate-700">{m.reorderLevel} {m.defaultUOM}</strong></span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {m.active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: FINISHED PRODUCTS */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Product Type Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setProductTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                productTypeFilter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({products.length})
            </button>
            <button
              onClick={() => setProductTypeFilter(ItemType.FINISHED_PRODUCT)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                productTypeFilter === ItemType.FINISHED_PRODUCT
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {isAr ? 'منتجات تامة' : 'Finished Goods'} ({products.filter(p => p.productType === ItemType.FINISHED_PRODUCT).length})
            </button>
            <button
              onClick={() => setProductTypeFilter(ItemType.SEMI_FINISHED)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                productTypeFilter === ItemType.SEMI_FINISHED
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {isAr ? 'منتجات نصف مصنعة' : 'Semi-Finished'} ({products.filter(p => p.productType === ItemType.SEMI_FINISHED).length})
            </button>
            <button
              onClick={() => setProductTypeFilter(ItemType.SCRAP)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                productTypeFilter === ItemType.SCRAP
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {isAr ? 'هالك ومخلفات إنتاج' : 'Scrap & Waste'} ({products.filter(p => p.productType === ItemType.SCRAP).length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products
              .filter(p => {
                const matchSearch =
                  p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
                const matchType =
                  productTypeFilter === 'ALL' || p.productType === productTypeFilter;
                return matchSearch && matchType;
              })
              .map(p => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        {p.code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {p.productType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedProd(p); setIsProdDuplicate(true); setIsProdModalOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                        title={isAr ? 'نسخ وتكرار سريع' : 'Duplicate Product'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setSelectedProd(p); setIsProdDuplicate(false); setIsProdModalOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                        title={isAr ? 'تعديل المنتج' : 'Edit'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => triggerDelete(
                          isAr ? 'حذف المنتج' : 'Delete Product',
                          isAr ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?',
                          `${p.code} - ${p.nameAr}`,
                          () => deleteProduct(p.id)
                        )}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title={isAr ? 'حذف المنتج' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{p.nameAr}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{p.nameEn}</p>
                  </div>

                  {/* Category & Valuation Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.categoryNameAr ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Bookmark className="w-2.5 h-2.5" />
                        <span>{isAr ? p.categoryNameAr : (p.categoryNameEn || p.categoryNameAr)}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] text-slate-400 bg-slate-50 border border-slate-200">
                        {isAr ? 'بدون مجموعة' : 'No Group'}
                      </span>
                    )}
                    {p.valuationMethod && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                        p.valuationMethod === ValuationMethod.FIFO
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : p.valuationMethod === ValuationMethod.STANDARD
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {p.valuationMethod}
                      </span>
                    )}
                  </div>

                <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/80 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] font-sans block">{isAr ? 'الرصيد المتاح:' : 'In Stock:'}</span>
                    <span className="font-bold text-emerald-800">{formatNumber(p.currentQty, language)} {p.defaultUOM}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-sans block">{isAr ? 'متوسط تكلفة الوحدة:' : 'Unit MAC:'}</span>
                    <span className="font-bold text-blue-700">{formatCurrency(p.movingAverageCost, language)}</span>
                  </div>
                  <div className="col-span-2 pt-1.5 border-t border-emerald-200/60 flex justify-between items-center">
                    <span className="text-slate-500 text-[10px] font-sans">{isAr ? 'إجمالي تقييم المنتج:' : 'Total Value:'}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(p.totalValue, language)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: BOMS */}
      {activeSubTab === 'boms' && (
        <div className="space-y-4">
          {boms
            .filter(b =>
              b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              b.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
              b.productName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(b => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-lg border border-purple-200">
                      {b.code}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{b.nameAr}</h3>
                      <p className="text-xs text-slate-500 font-mono">{b.productName} • v{b.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setSelectedBOM(b); setIsBOMDuplicate(true); setIsBOMModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                      title={isAr ? 'نسخ وتكرار قائمة المواد' : 'Duplicate BOM'}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setSelectedBOM(b); setIsBOMDuplicate(false); setIsBOMModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                      title={isAr ? 'تعديل قائمة المواد' : 'Edit BOM'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => triggerDelete(
                        isAr ? 'حذف قائمة المواد BOM' : 'Delete BOM',
                        isAr ? 'هل أنت متأكد من حذف قائمة المواد الصناعية هذه؟' : 'Are you sure you want to delete this BOM?',
                        `${b.code} - ${b.nameAr}`,
                        () => deleteBOM(b.id)
                      )}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="p-2.5">{isAr ? 'المادة الخام' : 'Raw Material'}</th>
                        <th className="p-2.5">{isAr ? 'كود الصنف' : 'Code'}</th>
                        <th className="p-2.5">{isAr ? 'الكمية المطلوبة / وحدة تام' : 'Required Qty'}</th>
                        <th className="p-2.5">{isAr ? 'المرحلة الإنتاجية' : 'Stage'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {b.lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">{line.rawMaterialName}</td>
                          <td className="p-2.5 font-mono text-slate-600">{line.rawMaterialCode}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-700">{line.quantity} {line.uom}</td>
                          <td className="p-2.5 text-purple-700 font-semibold">{line.productionStage || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* SUB-VIEW 4: WAREHOUSES & LOCATIONS */}
      {activeSubTab === 'warehouses' && (
        <div className="space-y-6">
          {/* Sub toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWarehouseViewType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${warehouseViewType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setWarehouseViewType('WH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${warehouseViewType === 'WH' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {isAr ? 'المستودعات الرئيسية' : 'Warehouses'} ({warehouses.length})
            </button>
            <button
              onClick={() => setWarehouseViewType('LOC')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${warehouseViewType === 'LOC' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {isAr ? 'مواقع ومراحل الإنتاج' : 'Locations & Stages'} ({locations.length})
            </button>
          </div>

          {(warehouseViewType === 'ALL' || warehouseViewType === 'WH') && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'المستودعات الرئيسية للتخزين' : 'Main Storage Warehouses'}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {warehouses
                  .filter(w =>
                    w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    w.nameAr.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(w => (
                    <div
                      key={w.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                            {w.code}
                          </span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {w.type}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs">{w.nameAr}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{w.nameEn}</p>
                        {w.notes && <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">{w.notes}</p>}
                      </div>

                      <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => { setSelectedWh(w); setIsWhDuplicate(true); setIsWhModalOpen(true); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                          title={isAr ? 'نسخ وتكرار المستودع' : 'Duplicate Warehouse'}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedWh(w); setIsWhDuplicate(false); setIsWhModalOpen(true); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title={isAr ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDelete(
                            isAr ? 'حذف المستودع' : 'Delete Warehouse',
                            isAr ? 'هل أنت متأكد من حذف هذا المستودع؟' : 'Are you sure you want to delete this warehouse?',
                            `${w.code} - ${w.nameAr}`,
                            () => deleteWarehouse(w.id)
                          )}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {(warehouseViewType === 'ALL' || warehouseViewType === 'LOC') && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'مواقع ومراحل الإنتاج الفعلي (WIP Stages & Locations)' : 'Production Floor Locations & Stages'}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {locations
                  .filter(l =>
                    l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    l.nameAr.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(l => (
                    <div
                      key={l.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                            {l.code}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {l.stageName || 'مرحلة'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs">{l.nameAr}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{l.nameEn}</p>
                      </div>

                      <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => { setSelectedLoc(l); setIsLocDuplicate(true); setIsLocModalOpen(true); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                          title={isAr ? 'نسخ وتكرار موقع الإنتاج' : 'Duplicate Location'}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedLoc(l); setIsLocDuplicate(false); setIsLocModalOpen(true); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title={isAr ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDelete(
                            isAr ? 'حذف موقع الإنتاج' : 'Delete Location',
                            isAr ? 'هل أنت متأكد من حذف موقع الإنتاج؟' : 'Are you sure you want to delete this location?',
                            `${l.code} - ${l.nameAr}`,
                            () => deleteLocation(l.id)
                          )}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 5: MACHINES */}
      {activeSubTab === 'machines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines
            .filter(m =>
              m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              m.nameAr.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(m => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    {m.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedMachine(m); setIsMachineDuplicate(true); setIsMachineModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                      title={isAr ? 'نسخ وتكرار الماكينة' : 'Duplicate Machine'}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setSelectedMachine(m); setIsMachineDuplicate(false); setIsMachineModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                      title={isAr ? 'تعديل' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => triggerDelete(
                        isAr ? 'حذف الماكينة' : 'Delete Machine',
                        isAr ? 'هل أنت متأكد من حذف بيانات هذه الماكينة؟' : 'Are you sure you want to delete this machine?',
                        `${m.code} - ${m.nameAr}`,
                        () => deleteMachine(m.id)
                      )}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{m.nameAr}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{m.nameEn}</p>
                </div>

                <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'المرحلة الإنتاجية:' : 'Stage:'}</span>
                    <span className="font-bold text-slate-800">{m.productionStage || '-'}</span>
                  </div>
                  {m.description && (
                    <p className="text-[11px] text-slate-600 line-clamp-2 pt-1">{m.description}</p>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-amber-200/40">
                    <span className="text-slate-500">{isAr ? 'الحالة التشغيلية:' : 'Status:'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {m.active ? (isAr ? 'جاهزة للتشغيل' : 'Ready') : (isAr ? 'صيانة' : 'Maintenance')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* SUB-VIEW 6: PARTNERS (CUSTOMERS & SUPPLIERS) */}
      {activeSubTab === 'partners' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPartnerSubtype('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${partnerSubtype === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {isAr ? 'جميع الشركاء' : 'All Partners'}
            </button>
            <button
              onClick={() => setPartnerSubtype('CUSTOMERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${partnerSubtype === 'CUSTOMERS' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {isAr ? 'العملاء' : 'Customers'} ({customers.length})
            </button>
            <button
              onClick={() => setPartnerSubtype('SUPPLIERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${partnerSubtype === 'SUPPLIERS' ? 'bg-amber-700 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {isAr ? 'الموردين' : 'Suppliers'} ({suppliers.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(partnerSubtype === 'ALL' || partnerSubtype === 'CUSTOMERS') && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <h3 className="font-bold text-xs text-slate-900 flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>{isAr ? 'دليل العملاء المعتمدين (Customers)' : 'Approved Customers'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {customers.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {customers
                    .filter(c =>
                      c.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(c => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center text-xs hover:bg-slate-100/60 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{c.nameAr}</span>
                            <span className="font-mono text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded">
                              {c.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {c.nameEn} {c.taxNumber ? `• ضريبي: ${c.taxNumber}` : ''}
                          </div>
                          {c.phone && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.phone}</div>}
                        </div>
                        <div className="flex items-center gap-1">
                          {c.odooPartnerId && (
                            <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Odoo: {c.odooPartnerId}
                            </span>
                          )}
                          <button
                            onClick={() => { setPartnerModalType('CUSTOMER'); setSelectedPartner(c); setIsPartnerDuplicate(true); setIsPartnerModalOpen(true); }}
                            className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-white transition cursor-pointer"
                            title={isAr ? 'نسخ وتكرار سريع' : 'Duplicate Customer'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setPartnerModalType('CUSTOMER'); setSelectedPartner(c); setIsPartnerDuplicate(false); setIsPartnerModalOpen(true); }}
                            className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-white transition cursor-pointer"
                            title={isAr ? 'تعديل' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDelete(
                              isAr ? 'حذف العميل' : 'Delete Customer',
                              isAr ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this customer?',
                              `${c.code} - ${c.nameAr}`,
                              () => deleteCustomer(c.id)
                            )}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white transition"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {(partnerSubtype === 'ALL' || partnerSubtype === 'SUPPLIERS') && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <h3 className="font-bold text-xs text-slate-900 flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>{isAr ? 'دليل الموردين المعتمدين (Suppliers)' : 'Approved Suppliers'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {suppliers.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {suppliers
                    .filter(s =>
                      s.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(s => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center text-xs hover:bg-slate-100/60 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{s.nameAr}</span>
                            <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                              {s.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {s.nameEn} {s.taxNumber ? `• ضريبي: ${s.taxNumber}` : ''}
                          </div>
                          {s.paymentTerms && <div className="text-[10px] text-slate-400 mt-0.5">{s.paymentTerms}</div>}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            {s.defaultCurrency || 'EGP'}
                          </span>
                          <button
                            onClick={() => { setPartnerModalType('SUPPLIER'); setSelectedPartner(s); setIsPartnerDuplicate(true); setIsPartnerModalOpen(true); }}
                            className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-white transition cursor-pointer"
                            title={isAr ? 'نسخ وتكرار سريع' : 'Duplicate Supplier'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setPartnerModalType('SUPPLIER'); setSelectedPartner(s); setIsPartnerDuplicate(false); setIsPartnerModalOpen(true); }}
                            className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-white transition cursor-pointer"
                            title={isAr ? 'تعديل' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDelete(
                              isAr ? 'حذف المورد' : 'Delete Supplier',
                              isAr ? 'هل أنت متأكد من حذف هذا المورد؟' : 'Are you sure you want to delete this supplier?',
                              `${s.code} - ${s.nameAr}`,
                              () => deleteSupplier(s.id)
                            )}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white transition"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 7: UOM */}
      {activeSubTab === 'uoms' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {uoms
            .filter(u =>
              u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.nameAr.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(u => (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold border border-orange-200">
                      {u.code}
                    </span>
                    {(u.uomType === 'PRIMARY' || (!u.baseUOM || u.baseUOM === u.code || u.conversionFactor === 1)) ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {isAr ? 'وحدة رئيسية' : 'Primary'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {isAr ? 'وحدة تابعة' : 'Secondary'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedUOM(u); setIsUOMDuplicate(true); setIsUOMModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                      title={isAr ? 'نسخ وتكرار سريع' : 'Duplicate UOM'}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setSelectedUOM(u); setIsUOMDuplicate(false); setIsUOMModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                      title={isAr ? 'تعديل' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => triggerDelete(
                        isAr ? 'حذف وحدة القياس' : 'Delete UOM',
                        isAr ? 'هل أنت متأكد من حذف وحدة القياس؟' : 'Are you sure you want to delete this UOM?',
                        `${u.code} - ${u.nameAr}`,
                        () => deleteUOM(u.id)
                      )}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{u.nameAr}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{u.nameEn}</p>
                </div>

                {(u.uomType === 'PRIMARY' || (!u.baseUOM || u.baseUOM === u.code || u.conversionFactor === 1)) ? (
                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>{isAr ? 'وحدة أساسية للمخزون' : 'Base Inventory UOM'}</span>
                      <span className="font-mono text-emerald-700 font-bold">معامل = 1.0</span>
                    </div>
                    {/* List child units if any */}
                    {(() => {
                      const childUnits = uoms.filter(c => c.baseUOM === u.code && c.code !== u.code);
                      if (childUnits.length === 0) return null;
                      return (
                        <div className="text-[10px] text-slate-600 pt-1 border-t border-emerald-200/60">
                          <span className="font-semibold text-emerald-800">{isAr ? 'الوحدات الفرعية المرتبطة بها:' : 'Sub-units:'} </span>
                          {childUnits.map(c => `${c.nameAr} (${c.code})`).join('، ')}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs font-mono text-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-sans text-[11px] font-semibold text-blue-900">{isAr ? 'معادلة الربط والتحويل:' : 'Conversion:'}</span>
                      <span className="font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                        تابعة لـ {u.baseUOM}
                      </span>
                    </div>
                    1 {u.code} = <strong className="text-blue-700 font-bold">{u.conversionFactor}</strong> {u.baseUOM || 'KG'}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* SUB-VIEW 8: CURRENCIES & RATES BY DATE */}
      {activeSubTab === 'currencies' && (
        <div className="space-y-4">
          {/* Sub-navigation tabs for currencies */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setCurrencySubTab('RATES_BY_DATE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                currencySubTab === 'RATES_BY_DATE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isAr ? 'أسعار الصرف بالتواريخ (تكوين يدوي)' : 'Rates by Date Configuration'}</span>
            </button>

            <button
              onClick={() => setCurrencySubTab('CURRENCIES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                currencySubTab === 'CURRENCIES'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{isAr ? 'بطاقات العملات المعرفة' : 'Currencies Master List'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                {currencies.length}
              </span>
            </button>
          </div>

          {currencySubTab === 'RATES_BY_DATE' ? (
            <CurrencyRatesManager
              onOpenCurrencyModal={() => {
                setSelectedCurrency(null);
                setIsCurrencyModalOpen(true);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {currencies
                .filter(c =>
                  c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.nameAr.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(c => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          {c.code}
                        </span>
                        {c.isBase && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {isAr ? 'أساسية' : 'Base'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedCurrency(c); setIsCurrencyModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          title={isAr ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!c.isBase && (
                          <button
                            onClick={() => triggerDelete(
                              isAr ? 'حذف العملة' : 'Delete Currency',
                              isAr ? 'هل أنت متأكد من حذف هذه العملة؟' : 'Are you sure you want to delete this currency?',
                              `${c.code} - ${c.nameAr}`,
                              () => deleteCurrency(c.id)
                            )}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{c.nameAr}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{c.nameEn}</p>
                    </div>

                    <div className="p-2.5 bg-emerald-50/40 rounded-xl border border-emerald-200/60 text-xs font-mono flex justify-between items-center">
                      <span className="text-slate-500 font-sans">{isAr ? 'سعر الصرف مقابل EGP:' : 'Rate to EGP:'}</span>
                      <span className="font-bold text-emerald-800 text-sm">{c.exchangeRate} EGP</span>
                    </div>

                    {!c.isBase && (
                      <button
                        onClick={() => setCurrencySubTab('RATES_BY_DATE')}
                        className="w-full py-1.5 text-center text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isAr ? 'عرض وضبط الأسعار بالتواريخ' : 'Configure Rates by Date'}</span>
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 9: USERS & ROLES */}
      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users
            .filter(u =>
              u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.email.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(u => (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    @{u.username}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title={isAr ? 'تعديل الصلاحيات' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => triggerDelete(
                          isAr ? 'حذف المستخدم' : 'Delete User',
                          isAr ? 'هل أنت متأكد من حذف حساب هذا المستخدم؟' : 'Are you sure you want to delete this user?',
                          `${u.fullName} (@${u.username})`,
                          () => deleteUser(u.id)
                        )}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{u.fullName}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                  <span className="text-slate-500">{isAr ? 'الدور الوظيفي:' : 'Role:'}</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {u.role}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* MODALS */}
      <ItemCategoryModal
        isOpen={isCategoryModalOpen}
        category={selectedCategory}
        isDuplicate={isCategoryDuplicate}
        onClose={() => { setIsCategoryModalOpen(false); setSelectedCategory(null); setIsCategoryDuplicate(false); }}
      />

      <RawMaterialModal
        isOpen={isRawModalOpen}
        material={selectedRaw}
        isDuplicate={isRawDuplicate}
        onClose={() => { setIsRawModalOpen(false); setSelectedRaw(null); setIsRawDuplicate(false); }}
      />

      <ProductModal
        isOpen={isProdModalOpen}
        product={selectedProd}
        isDuplicate={isProdDuplicate}
        onClose={() => { setIsProdModalOpen(false); setSelectedProd(null); setIsProdDuplicate(false); }}
      />

      <BOMModal
        isOpen={isBOMModalOpen}
        bom={selectedBOM}
        isDuplicate={isBOMDuplicate}
        onClose={() => { setIsBOMModalOpen(false); setSelectedBOM(null); setIsBOMDuplicate(false); }}
      />

      <WarehouseModal
        isOpen={isWhModalOpen}
        warehouse={selectedWh}
        isDuplicate={isWhDuplicate}
        onClose={() => { setIsWhModalOpen(false); setSelectedWh(null); setIsWhDuplicate(false); }}
      />

      <LocationModal
        isOpen={isLocModalOpen}
        location={selectedLoc}
        isDuplicate={isLocDuplicate}
        onClose={() => { setIsLocModalOpen(false); setSelectedLoc(null); setIsLocDuplicate(false); }}
      />

      <MachineModal
        isOpen={isMachineModalOpen}
        machine={selectedMachine}
        isDuplicate={isMachineDuplicate}
        onClose={() => { setIsMachineModalOpen(false); setSelectedMachine(null); setIsMachineDuplicate(false); }}
      />

      <PartnerModal
        isOpen={isPartnerModalOpen}
        type={partnerModalType}
        partner={selectedPartner}
        isDuplicate={isPartnerDuplicate}
        onClose={() => { setIsPartnerModalOpen(false); setSelectedPartner(null); setIsPartnerDuplicate(false); }}
      />

      <UOMModal
        isOpen={isUOMModalOpen}
        uom={selectedUOM}
        isDuplicate={isUOMDuplicate}
        onClose={() => { setIsUOMModalOpen(false); setSelectedUOM(null); setIsUOMDuplicate(false); }}
      />

      <CurrencyModal
        isOpen={isCurrencyModalOpen}
        currency={selectedCurrency}
        onClose={() => { setIsCurrencyModalOpen(false); setSelectedCurrency(null); }}
      />

      <UserModal
        isOpen={isUserModalOpen}
        user={selectedUser}
        onClose={() => { setIsUserModalOpen(false); setSelectedUser(null); }}
      />

      <ClearSeedDataModal
        isOpen={isClearSeedModalOpen}
        onClose={() => setIsClearSeedModalOpen(false)}
      />
    </div>
  );
};
