import React, { useState, useEffect } from 'react';
import { X, Package, Save, Bookmark, Plus, CheckCircle2, Copy, Scale, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ItemType, VALUATION_METHOD_LABELS, ItemCategory } from '../../types';
import { ItemCategoryModal } from './ItemCategoryModal';
import { generateNextSequentialCode, generateDuplicateName } from '../../utils/codeGenerator';
import { getPrimaryUOMs } from '../../utils/uomHelper';

interface ProductModalProps {
  isOpen: boolean;
  product?: Product | null;
  isDuplicate?: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  product,
  isDuplicate = false,
  onClose
}) => {
  const { language, products, warehouses, uoms, itemCategories, saveProduct } = useApp();
  const isAr = language === 'ar';
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Product>>({
    code: '',
    nameAr: '',
    nameEn: '',
    description: '',
    productType: ItemType.FINISHED_PRODUCT,
    categoryId: '',
    categoryCode: '',
    categoryNameAr: '',
    categoryNameEn: '',
    valuationMethod: undefined,
    defaultUOM: 'KG',
    alternativeUOM: 'MTR',
    defaultWarehouseId: 'wh-fg',
    active: true,
    currentQty: 0,
    movingAverageCost: 0,
    totalValue: 0,
    notes: ''
  });

  useEffect(() => {
    if (product) {
      if (isDuplicate) {
        const existingCodes = products.map(p => p.code);
        const nextCode = generateNextSequentialCode(product.code, existingCodes);
        setFormData({
          ...product,
          id: `fp-${Date.now()}`,
          code: nextCode,
          nameAr: generateDuplicateName(product.nameAr, true),
          nameEn: generateDuplicateName(product.nameEn || '', false),
          currentQty: 0,
          totalValue: 0
        });
      } else {
        setFormData(product);
      }
    } else {
      setFormData({
        id: `fp-${Date.now()}`,
        code: `FP-${Math.floor(100 + Math.random() * 900)}`,
        nameAr: '',
        nameEn: '',
        description: '',
        productType: ItemType.FINISHED_PRODUCT,
        categoryId: '',
        categoryCode: '',
        categoryNameAr: '',
        categoryNameEn: '',
        valuationMethod: undefined,
        defaultUOM: 'KG',
        alternativeUOM: 'MTR',
        defaultWarehouseId: warehouses.find(w => w.type === 'FINISHED_GOODS')?.id || 'wh-fg',
        active: true,
        currentQty: 0,
        movingAverageCost: 0,
        totalValue: 0,
        notes: ''
      });
    }
  }, [product, isOpen, isDuplicate, products, warehouses]);

  if (!isOpen) return null;

  const handleCategoryChange = (catId: string) => {
    const selected = itemCategories.find(c => c.id === catId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        categoryId: selected.id,
        categoryCode: selected.code,
        categoryNameAr: selected.nameAr,
        categoryNameEn: selected.nameEn,
        valuationMethod: selected.valuationMethod
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categoryId: '',
        categoryCode: '',
        categoryNameAr: '',
        categoryNameEn: '',
        valuationMethod: undefined
      }));
    }
  };

  const selectedCategory = itemCategories.find(c => c.id === formData.categoryId);
  const activeMethod = selectedCategory?.valuationMethod || formData.valuationMethod;
  const valuationInfo = activeMethod ? VALUATION_METHOD_LABELS[activeMethod] : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    const finalItem: Product = {
      id: (isDuplicate ? null : product?.id) || formData.id || `fp-${Date.now()}`,
      code: formData.code.trim(),
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      description: formData.description || '',
      productType: formData.productType || ItemType.FINISHED_PRODUCT,
      categoryId: formData.categoryId || undefined,
      categoryCode: formData.categoryCode || undefined,
      categoryNameAr: formData.categoryNameAr || undefined,
      categoryNameEn: formData.categoryNameEn || undefined,
      valuationMethod: activeMethod || undefined,
      defaultUOM: formData.defaultUOM || 'KG',
      alternativeUOM: formData.alternativeUOM || 'MTR',
      defaultWarehouseId: formData.defaultWarehouseId || 'wh-fg',
      active: formData.active ?? true,
      currentQty: Number(formData.currentQty) || 0,
      movingAverageCost: Number(formData.movingAverageCost) || 0,
      totalValue: (Number(formData.currentQty) || 0) * (Number(formData.movingAverageCost) || 0),
      notes: formData.notes || ''
    };

    saveProduct(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDuplicate
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              {isDuplicate ? <Copy className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isDuplicate
                    ? isAr ? 'نسخ وتكرار منتج (تكويد صنف جديد)' : 'Duplicate Product'
                    : product
                    ? isAr ? 'تعديل بيانات المنتج' : 'Edit Product'
                    : isAr ? 'إضافة منتج جديد' : 'Add New Product'}
                </h3>
                {isDuplicate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {isAr ? 'نسخ سريع' : 'Quick Duplicate'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isDuplicate
                  ? isAr ? 'تم نسخ جميع الخصائص والمواصفات وتوليد كود تسلسلي جديد. عدّل الاسم والتفاصيل واحفظ مباشرة.' : 'Cloned with next sequential code. Edit name/specs and save as a new item.'
                  : isAr ? 'منتج تام جاهز للبيع أو منتج وسيط نصف مصنع أو هالك' : 'Finished goods, semi-finished, or scrap items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* ITEM CATEGORY & VALUATION METHOD */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'مجموعة الصنف وتصنيف المخزون (Item Category)' : 'Item Category & Group'}</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>{isAr ? 'إنشاء مجموعة جديدة' : 'New Group'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={formData.categoryId || ''}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">{isAr ? '-- اختر مجموعة الصنف --' : '-- Select Category --'}</option>
                  {itemCategories
                    .filter(c => c.applicableType === 'ALL' || c.applicableType === formData.productType || !c.applicableType)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.code} - {isAr ? cat.nameAr : cat.nameEn} ({cat.valuationMethod})
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isAr
                    ? 'يتم تحديد طريقة تقييم المخزون تلقائياً وفق المجموعة المختارة'
                    : 'Inventory valuation method is inherited from the assigned group'}
                </span>
              </div>

              {/* Valuation Method Card Preview */}
              <div>
                {valuationInfo ? (
                  <div className={`p-2.5 rounded-lg border text-[11px] ${valuationInfo.badgeBg} ${valuationInfo.border}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'طريقة التقييم المعتمدة:' : 'Valuation Method:'}</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-white/80 border ${valuationInfo.border} ${valuationInfo.badgeText}`}>
                        {activeMethod}
                      </span>
                    </div>
                    <div className={`font-bold ${valuationInfo.badgeText}`}>
                      {isAr ? valuationInfo.ar : valuationInfo.en}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {isAr ? valuationInfo.descAr : valuationInfo.descEn}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg border border-dashed border-slate-300 bg-white text-[11px] text-slate-400 text-center flex flex-col items-center justify-center h-full">
                    <span>{isAr ? 'لم يتم تحديد مجموعة صنف بعد' : 'No category selected yet'}</span>
                    <span className="text-[10px] text-slate-400">
                      {isAr ? 'اختر مجموعة لربط طريقة التقييم آلياً' : 'Select a group to bind valuation method'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'كود المنتج *' : 'Product Code *'}
              </label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="مثال: FP-PIPE-50MM"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'نوع الصنف' : 'Product Type'}
              </label>
              <select
                value={formData.productType || ItemType.FINISHED_PRODUCT}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  productType: e.target.value as any
                }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value={ItemType.FINISHED_PRODUCT}>
                  {isAr ? 'منتج تام الصنع (Finished Goods)' : 'Finished Goods'}
                </option>
                <option value={ItemType.SEMI_FINISHED}>
                  {isAr ? 'منتج نصف مصنع / وسيط (Semi-Finished)' : 'Semi-Finished Goods'}
                </option>
                <option value={ItemType.SCRAP}>
                  {isAr ? 'هالك ومخلفات إنتاج (Scrap & By-products)' : 'Scrap & Industrial Waste'}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'اسم المنتج بالعربية *' : 'Arabic Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.nameAr || ''}
                onChange={e => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                placeholder="مثال: أنابيب بولي إيثيلين 50 مم"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'اسم المنتج بالإنجليزية' : 'English Name'}
              </label>
              <input
                type="text"
                value={formData.nameEn || ''}
                onChange={e => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder="e.g. HDPE Pipe 50mm PN16"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'المستودع الرئيسي للاستلام' : 'Default Warehouse'}
              </label>
              <select
                value={formData.defaultWarehouseId || ''}
                onChange={e => setFormData(prev => ({ ...prev, defaultWarehouseId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {isAr ? w.nameAr : w.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 sm:col-span-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <div>
                <label className="block text-slate-800 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'وحدة القياس الرئيسية للمنتج (Primary Base UOM) *' : 'Product Primary Base UOM *'}</span>
                  </span>
                  <span className="text-[10px] font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {isAr ? 'أساس رصيد وتكلفة المخزون' : 'Stock & Cost Basis'}
                  </span>
                </label>
                <select
                  value={formData.defaultUOM || 'KG'}
                  onChange={e => setFormData(prev => ({ ...prev, defaultUOM: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono font-bold text-slate-800"
                >
                  {getPrimaryUOMs(uoms).map(u => (
                    <option key={u.id} value={u.code}>
                      {u.code} - {u.nameAr} ({u.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Show linked derived units dynamically */}
              {(() => {
                const currentPrimaryCode = formData.defaultUOM || 'KG';
                const relatedUnits = uoms.filter(u => u.baseUOM === currentPrimaryCode && u.code !== currentPrimaryCode);
                return (
                  <div className="text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isAr ? 'الوحدات الفرعية التابعة المتاحة تلقائياً في استلام وتسليم المنتج:' : 'Derived Units for Receipts & Deliveries:'}</span>
                    </div>
                    {relatedUnits.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {relatedUnits.map(ru => (
                          <span key={ru.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[10px] font-medium">
                            <strong>{ru.code}</strong> ({ru.nameAr}) = {ru.conversionFactor} {currentPrimaryCode}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        {isAr ? 'لا توجد وحدات فرعية مرتبطة بهذه الوحدة حالياً. يمكنك إضافتها من شاشة وحدات القياس.' : 'No linked sub-units yet.'}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'المواصفات الفنية والملاحظات' : 'Technical Specifications & Notes'}
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="معايير الجودة، الضغط التشغيلي، أو اشتراطات التسليم..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="p-active"
              checked={formData.active ?? true}
              onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="p-active" className="text-slate-700 font-medium">
              {isAr ? 'منتج متاح في خطة التصنيع والتسليم للعملاء' : 'Active and available for manufacturing & customer shipping'}
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                isDuplicate
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isDuplicate ? <Copy className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>
                {isDuplicate
                  ? isAr ? 'إضافة وتكويد المنتج المنسوخ' : 'Add Cloned Product'
                  : isAr ? 'حفظ المنتج' : 'Save Product'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Add Item Category Modal */}
      {isCategoryModalOpen && (
        <ItemCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSaved={(newCat) => {
            handleCategoryChange(newCat.id);
            setIsCategoryModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
