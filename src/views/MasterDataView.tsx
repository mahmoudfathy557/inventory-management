import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
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
  WarehouseType
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
import { ConfirmDeleteModal } from '../components/master-data/ConfirmDeleteModal';

export type MasterDataTab =
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
  const {
    language,
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

  const isAr = language === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<MasterDataTab>(initialTab || 'raw');
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerSubtype, setPartnerSubtype] = useState<'ALL' | 'CUSTOMERS' | 'SUPPLIERS'>('ALL');
  const [warehouseViewType, setWarehouseViewType] = useState<'ALL' | 'WH' | 'LOC'>('ALL');

  // Modals state
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [selectedRaw, setSelectedRaw] = useState<RawMaterial | null>(null);

  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);

  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);

  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [selectedWh, setSelectedWh] = useState<Warehouse | null>(null);

  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<ProductionLocation | null>(null);

  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerModalType, setPartnerModalType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [selectedPartner, setSelectedPartner] = useState<Customer | Supplier | null>(null);

  const [isUOMModalOpen, setIsUOMModalOpen] = useState(false);
  const [selectedUOM, setSelectedUOM] = useState<UOM | null>(null);

  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Deletion confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    onConfirm: () => {}
  });

  const triggerDelete = (title: string, message: string, itemName: string, onConfirm: () => void) => {
    setDeleteConfirm({
      isOpen: true,
      title,
      message,
      itemName,
      onConfirm
    });
  };

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

        {/* Dynamic Add Action Button */}
        <div>
          {activeSubTab === 'raw' && (
            <button
              onClick={() => { setSelectedRaw(null); setIsRawModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة مادة خام' : 'Add Raw Material'}</span>
            </button>
          )}

          {activeSubTab === 'products' && (
            <button
              onClick={() => { setSelectedProd(null); setIsProdModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة منتج' : 'Add Product'}</span>
            </button>
          )}

          {activeSubTab === 'boms' && (
            <button
              onClick={() => { setSelectedBOM(null); setIsBOMModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إنشاء قائمة مواد (BOM)' : 'Create BOM'}</span>
            </button>
          )}

          {activeSubTab === 'warehouses' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedWh(null); setIsWhModalOpen(true); }}
                className="px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'مستودع جديد' : 'New Warehouse'}</span>
              </button>
              <button
                onClick={() => { setSelectedLoc(null); setIsLocModalOpen(true); }}
                className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'موقع إنتاج / مرحلة' : 'New Stage/Loc'}</span>
              </button>
            </div>
          )}

          {activeSubTab === 'machines' && (
            <button
              onClick={() => { setSelectedMachine(null); setIsMachineModalOpen(true); }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة ماكينة' : 'Add Machine'}</span>
            </button>
          )}

          {activeSubTab === 'partners' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPartnerModalType('CUSTOMER'); setSelectedPartner(null); setIsPartnerModalOpen(true); }}
                className="px-3 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة عميل' : 'Add Customer'}</span>
              </button>
              <button
                onClick={() => { setPartnerModalType('SUPPLIER'); setSelectedPartner(null); setIsPartnerModalOpen(true); }}
                className="px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة مورد' : 'Add Supplier'}</span>
              </button>
            </div>
          )}

          {activeSubTab === 'uoms' && (
            <button
              onClick={() => { setSelectedUOM(null); setIsUOMModalOpen(true); }}
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

      {/* Sub Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs scrollbar-none">
        <button
          onClick={() => { setActiveSubTab('raw'); setSearchTerm(''); }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'raw'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isAr ? 'المواد الخام' : 'Raw Materials'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {rawMaterials.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('products'); setSearchTerm(''); }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'products'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/60'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>{isAr ? 'المنتجات' : 'Products'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('boms'); setSearchTerm(''); }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'boms'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/60'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>{isAr ? 'قوائم المواد (BOM)' : 'BOM Formulas'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {boms.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('warehouses'); setSearchTerm(''); }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'warehouses'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{isAr ? 'المستودعات والمواقع' : 'Warehouses'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {warehouses.length + locations.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('machines'); setSearchTerm(''); }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'machines'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/60'
          }`}
        >
          <Cog className="w-3.5 h-3.5" />
          <span>{isAr ? 'الماكينات ومراكز التشغيل' : 'Machines'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {machines.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('partners'); setSearchTerm(''); }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'partners'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isAr ? 'الشركاء (عملاء وموردين)' : 'Partners'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {customers.length + suppliers.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('uoms'); setSearchTerm(''); }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'uoms'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/60'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{isAr ? 'وحدات القياس' : 'UOM'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {uoms.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('currencies'); setSearchTerm(''); }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'currencies'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/60'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>{isAr ? 'العملات والصرف' : 'Currencies'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {currencies.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('users'); setSearchTerm(''); }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isAr ? 'المستخدمين والأدوار' : 'Users & Roles'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {users.length}
          </span>
        </button>
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
                        onClick={() => { setSelectedRaw(m); setIsRawModalOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products
            .filter(p =>
              p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
            )
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
                      onClick={() => { setSelectedProd(p); setIsProdModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
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
                      onClick={() => { setSelectedBOM(b); setIsBOMModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
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
                          onClick={() => { setSelectedWh(w); setIsWhModalOpen(true); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
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
                          onClick={() => { setSelectedLoc(l); setIsLocModalOpen(true); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
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
                      onClick={() => { setSelectedMachine(m); setIsMachineModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
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
                            onClick={() => { setPartnerModalType('CUSTOMER'); setSelectedPartner(c); setIsPartnerModalOpen(true); }}
                            className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-white transition"
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
                            onClick={() => { setPartnerModalType('SUPPLIER'); setSelectedPartner(s); setIsPartnerModalOpen(true); }}
                            className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-white transition"
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
                  <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold border border-orange-200">
                    {u.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedUOM(u); setIsUOMModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition"
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

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                  1 {u.code} = <strong className="text-orange-700">{u.conversionFactor}</strong> {u.baseUOM || 'KG'}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* SUB-VIEW 8: CURRENCIES */}
      {activeSubTab === 'currencies' && (
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
              </div>
            ))}
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
      <RawMaterialModal
        isOpen={isRawModalOpen}
        material={selectedRaw}
        onClose={() => { setIsRawModalOpen(false); setSelectedRaw(null); }}
      />

      <ProductModal
        isOpen={isProdModalOpen}
        product={selectedProd}
        onClose={() => { setIsProdModalOpen(false); setSelectedProd(null); }}
      />

      <BOMModal
        isOpen={isBOMModalOpen}
        bom={selectedBOM}
        onClose={() => { setIsBOMModalOpen(false); setSelectedBOM(null); }}
      />

      <WarehouseModal
        isOpen={isWhModalOpen}
        warehouse={selectedWh}
        onClose={() => { setIsWhModalOpen(false); setSelectedWh(null); }}
      />

      <LocationModal
        isOpen={isLocModalOpen}
        location={selectedLoc}
        onClose={() => { setIsLocModalOpen(false); setSelectedLoc(null); }}
      />

      <MachineModal
        isOpen={isMachineModalOpen}
        machine={selectedMachine}
        onClose={() => { setIsMachineModalOpen(false); setSelectedMachine(null); }}
      />

      <PartnerModal
        isOpen={isPartnerModalOpen}
        type={partnerModalType}
        partner={selectedPartner}
        onClose={() => { setIsPartnerModalOpen(false); setSelectedPartner(null); }}
      />

      <UOMModal
        isOpen={isUOMModalOpen}
        uom={selectedUOM}
        onClose={() => { setIsUOMModalOpen(false); setSelectedUOM(null); }}
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

      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        itemName={deleteConfirm.itemName}
        onConfirm={deleteConfirm.onConfirm}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
