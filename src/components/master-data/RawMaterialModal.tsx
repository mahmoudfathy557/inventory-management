import React, { useState, useEffect } from 'react';
import { X, Layers, Save, Bookmark, Plus, CheckCircle2, Copy, Scale, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RawMaterial, ItemType, VALUATION_METHOD_LABELS, ItemCategory } from '../../types';
import { ItemCategoryModal } from './ItemCategoryModal';
import { generateNextSequentialCode, generateDuplicateName } from '../../utils/codeGenerator';
import { getPrimaryUOMs, getAvailableUOMsForItem } from '../../utils/uomHelper';

interface RawMaterialModalProps {
  isOpen: boolean;
  material?: RawMaterial | null;
  isDuplicate?: boolean;
  onClose: () => void;
}

export const RawMaterialModal: React.FC<RawMaterialModalProps> = ({
  isOpen,
  material,
  isDuplicate = false,
  onClose
}) => {
  const { language, rawMaterials, warehouses, uoms, itemCategories, saveRawMaterial } = useApp();
  const isAr = language === 'ar';
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<RawMaterial>>({
    code: '',
    nameAr: '',
    nameEn: '',
    description: '',
    itemType: ItemType.RAW_MATERIAL,
    categoryId: '',
    categoryCode: '',
    categoryNameAr: '',
    categoryNameEn: '',
    valuationMethod: undefined,
    defaultUOM: 'KG',
    alternativeUOM: 'TON',
    conversionFactor: 1000,
    defaultWarehouseId: 'wh-raw',
    minStock: 100,
    maxStock: 5000,
    reorderLevel: 300,
    active: true,
    currentQty: 0,
    movingAverageCost: 0,
    totalValue: 0,
    notes: ''
  });

  useEffect(() => {
    if (material) {
      if (isDuplicate) {
        const existingCodes = rawMaterials.map(r => r.code);
        const nextCode = generateNextSequentialCode(material.code, existingCodes);
        setFormData({
          ...material,
          id: `rm-${Date.now()}`,
          code: nextCode,
          nameAr: generateDuplicateName(material.nameAr, true),
          nameEn: generateDuplicateName(material.nameEn || '', false),
          currentQty: 0,
          totalValue: 0
        });
      } else {
        setFormData(material);
      }
    } else {
      setFormData({
        id: `rm-${Date.now()}`,
        code: `RM-${Math.floor(100 + Math.random() * 900)}`,
        nameAr: '',
        nameEn: '',
        description: '',
        itemType: ItemType.RAW_MATERIAL,
        categoryId: '',
        categoryCode: '',
        categoryNameAr: '',
        categoryNameEn: '',
        valuationMethod: undefined,
        defaultUOM: 'KG',
        alternativeUOM: 'TON',
        conversionFactor: 1000,
        defaultWarehouseId: warehouses.find(w => w.type === 'RAW_MATERIALS')?.id || 'wh-raw',
        minStock: 100,
        maxStock: 5000,
        reorderLevel: 300,
        active: true,
        currentQty: 0,
        movingAverageCost: 0,
        totalValue: 0,
        notes: ''
      });
    }
  }, [material, isOpen, isDuplicate, rawMaterials, warehouses]);

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

    const finalItem: RawMaterial = {
      id: (isDuplicate ? null : material?.id) || formData.id || `rm-${Date.now()}`,
      code: formData.code.trim(),
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      description: formData.description || '',
      itemType: ItemType.RAW_MATERIAL,
      categoryId: formData.categoryId || undefined,
      categoryCode: formData.categoryCode || undefined,
      categoryNameAr: formData.categoryNameAr || undefined,
      categoryNameEn: formData.categoryNameEn || undefined,
      valuationMethod: activeMethod || undefined,
      defaultUOM: formData.defaultUOM || 'KG',
      alternativeUOM: formData.alternativeUOM || formData.defaultUOM || 'KG',
      conversionFactor: Number(formData.conversionFactor) || 1,
      defaultWarehouseId: formData.defaultWarehouseId || 'wh-raw',
      minStock: Number(formData.minStock) || 0,
      maxStock: Number(formData.maxStock) || 0,
      reorderLevel: Number(formData.reorderLevel) || 0,
      active: formData.active ?? true,
      currentQty: Number(formData.currentQty) || 0,
      movingAverageCost: Number(formData.movingAverageCost) || 0,
      totalValue: (Number(formData.currentQty) || 0) * (Number(formData.movingAverageCost) || 0),
      notes: formData.notes || ''
    };

    saveRawMaterial(finalItem);
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
                : 'bg-blue-50 text-blue-600'
            }`}>
              {isDuplicate ? <Copy className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isDuplicate
                    ? isAr ? 'نسخ وتكرار مادة خام (صنف جديد)' : 'Duplicate Raw Material'
                    : material
                    ? isAr ? 'تعديل بيانات مادة خام' : 'Edit Raw Material'
                    : isAr ? 'إضافة مادة خام جديدة' : 'Add New Raw Material'}
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
                  : isAr ? 'تعريف كود الصنف ووحدات القياس وحدود المخزون ومستودع الحفظ' : 'Item details, UOMs, stock bounds, and default warehouse'}
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
                <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                <span>{isAr ? 'مجموعة الصنف وتصنيف المخزون (Item Category)' : 'Item Category & Group'}</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{isAr ? '-- اختر مجموعة الصنف --' : '-- Select Category --'}</option>
                  {itemCategories
                    .filter(c => c.applicableType === 'ALL' || c.applicableType === ItemType.RAW_MATERIAL || !c.applicableType)
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
                {isAr ? 'كود المادة الخام *' : 'Material Code *'}
              </label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="مثال: RM-HDPE-100"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'المستودع الافتراضي' : 'Default Warehouse'}
              </label>
              <select
                value={formData.defaultWarehouseId || ''}
                onChange={e => setFormData(prev => ({ ...prev, defaultWarehouseId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {isAr ? w.nameAr : w.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'الاسم بالعربية *' : 'Arabic Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.nameAr || ''}
                onChange={e => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                placeholder="مثال: بولي إيثيلين عالي الكثافة"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'الاسم بالإنجليزية' : 'English Name'}
              </label>
              <input
                type="text"
                value={formData.nameEn || ''}
                onChange={e => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder="e.g. HDPE Granules"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <div>
                <label className="block text-slate-800 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-orange-600" />
                    <span>{isAr ? 'وحدة القياس الرئيسية للصنف (Primary Base UOM) *' : 'Item Primary Base UOM *'}</span>
                  </span>
                  <span className="text-[10px] font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {isAr ? 'أساس رصيد وتكلفة المخزون' : 'Stock & Cost Basis'}
                  </span>
                </label>
                <select
                  value={formData.defaultUOM || 'KG'}
                  onChange={e => setFormData(prev => ({ ...prev, defaultUOM: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white font-mono font-bold text-slate-800"
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
                      <span>{isAr ? 'الوحدات الفرعية التابعة المتاحة تلقائياً في الحركات المخزنية:' : 'Derived Units for Transactions:'}</span>
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

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'حد إعادة الطلب (Reorder Level)' : 'Reorder Level'}
              </label>
              <input
                type="number"
                value={formData.reorderLevel || 0}
                onChange={e => setFormData(prev => ({ ...prev, reorderLevel: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'الحد الأدنى للمخزون' : 'Min Stock'}
              </label>
              <input
                type="number"
                value={formData.minStock || 0}
                onChange={e => setFormData(prev => ({ ...prev, minStock: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'الحد الأقصى للمخزون' : 'Max Stock'}
              </label>
              <input
                type="number"
                value={formData.maxStock || 0}
                onChange={e => setFormData(prev => ({ ...prev, maxStock: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'الوصف وملاحظات الجودة' : 'Description & Specs'}
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المواصفات الفنية أو المورد المفضل..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rm-active"
              checked={formData.active ?? true}
              onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rm-active" className="text-slate-700 font-medium">
              {isAr ? 'صنف نشط ومتاح في دورات الشراء والإنتاج' : 'Active and available for procurement and manufacturing'}
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
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isDuplicate ? <Copy className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>
                {isDuplicate
                  ? isAr ? 'إضافة وتكويد الخامة المنسوخة' : 'Add Cloned Material'
                  : isAr ? 'حفظ البيانات' : 'Save Material'}
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
