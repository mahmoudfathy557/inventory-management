import React, { useState, useEffect } from 'react';
import { X, Bookmark, Save, Layers, ArrowRightLeft, DollarSign, CheckCircle2, Info, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ItemCategory, ValuationMethod, ItemType, VALUATION_METHOD_LABELS } from '../../types';
import { generateNextSequentialCode, generateDuplicateName } from '../../utils/codeGenerator';

interface ItemCategoryModalProps {
  isOpen: boolean;
  category?: ItemCategory | null;
  isDuplicate?: boolean;
  onClose: () => void;
  onSaved?: (savedCategory: ItemCategory) => void;
}

export const ItemCategoryModal: React.FC<ItemCategoryModalProps> = ({
  isOpen,
  category,
  isDuplicate = false,
  onClose,
  onSaved
}) => {
  const { language, itemCategories, saveItemCategory } = useApp();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Partial<ItemCategory>>({
    code: '',
    nameAr: '',
    nameEn: '',
    valuationMethod: ValuationMethod.MOVING_AVERAGE,
    applicableType: 'ALL',
    standardCostEGP: 0,
    description: '',
    notes: '',
    active: true
  });

  useEffect(() => {
    if (category) {
      if (isDuplicate) {
        const existingCodes = itemCategories.map(c => c.code);
        const nextCode = generateNextSequentialCode(category.code, existingCodes);
        setFormData({
          ...category,
          id: `cat-${Date.now()}`,
          code: nextCode,
          nameAr: generateDuplicateName(category.nameAr, true),
          nameEn: generateDuplicateName(category.nameEn || '', false)
        });
      } else {
        setFormData(category);
      }
    } else {
      setFormData({
        id: `cat-${Date.now()}`,
        code: `GRP-${Math.floor(100 + Math.random() * 900)}`,
        nameAr: '',
        nameEn: '',
        valuationMethod: ValuationMethod.MOVING_AVERAGE,
        applicableType: 'ALL',
        standardCostEGP: 0,
        description: '',
        notes: '',
        active: true
      });
    }
  }, [category, isOpen, isDuplicate, itemCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim() || !formData.nameAr?.trim()) return;

    const finalItem: ItemCategory = {
      id: (isDuplicate ? null : category?.id) || formData.id || `cat-${Date.now()}`,
      code: formData.code.trim().toUpperCase(),
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      valuationMethod: formData.valuationMethod || ValuationMethod.MOVING_AVERAGE,
      applicableType: formData.applicableType || 'ALL',
      standardCostEGP: Number(formData.standardCostEGP) || 0,
      description: formData.description?.trim() || '',
      notes: formData.notes?.trim() || '',
      active: formData.active ?? true,
      createdAt: (!isDuplicate && category?.createdAt) || new Date().toISOString()
    };

    saveItemCategory(finalItem);
    if (onSaved) {
      onSaved(finalItem);
    }
    onClose();
  };

  const methods = [
    {
      id: ValuationMethod.MOVING_AVERAGE,
      labelAr: 'Moving average cost (متوسط التكلفة المتحرك)',
      labelEn: 'Moving Average Cost (AVCO)',
      descAr: 'يتم إعادة حساب متوسط التكلفة المرجح للوحدة آلياً بعد كل إذن إضافة أو توريد جديد.',
      descEn: 'Dynamically recomputes weighted unit cost after each receipt or landed cost allocation.',
      color: 'blue'
    },
    {
      id: ValuationMethod.FIFO,
      labelAr: 'FIFO (الوارد أولاً صادر أولاً)',
      labelEn: 'First In, First Out (FIFO)',
      descAr: 'تسعير وصرف المخزون وفق تكلفة أقدم الشحنات الواردة بالترتيب الزمني.',
      descEn: 'Dispatches inventory priced according to earliest received stock lots.',
      color: 'emerald'
    },
    {
      id: ValuationMethod.STANDARD,
      labelAr: 'Standard (التكلفة المعيارية)',
      labelEn: 'Standard Costing',
      descAr: 'تثبيت تكلفة قياسية محددة مسبقاً وتوجيه الفروق بين الفعلي والمعياري لحساب الفروقات.',
      descEn: 'Applies fixed standard baseline and isolates procurement/production variances.',
      color: 'purple'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
              isDuplicate
                ? 'bg-amber-50 text-amber-600'
                : category
                ? 'bg-blue-50 text-blue-600'
                : 'bg-indigo-50 text-indigo-600'
            }`}>
              {isDuplicate ? <Copy className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isDuplicate
                    ? isAr ? 'نسخ وتكرار مجموعة مخزنية' : 'Duplicate Item Group'
                    : category
                    ? isAr ? 'تعديل مجموعة الصنف وطريقة التقييم' : 'Edit Item Group & Valuation'
                    : isAr ? 'تكويد مجموعة عناصر مخزنية جديدة' : 'New Item Group & Valuation'}
                </h3>
                {isDuplicate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {isAr ? 'نسخ سريع' : 'Quick Duplicate'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isDuplicate
                  ? isAr ? 'تم نسخ جميع الخصائص وتوليد كود تسلسلي جديد آلياً. يمكنك تعديل الاسم وحفظ المجموعة الجديدة مباشرة.' : 'All properties copied with next sequential code. Edit name and save directly.'
                  : isAr
                  ? 'تحديد تصنيف المجموعة وتعيين طريقة تقييم المخزون المعتمدة لعناصرها'
                  : 'Define category classification and its designated inventory valuation method'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Code and Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'كود المجموعة *' : 'Group Code *'}
              </label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="مثال: GRP-CARRIER, GRP-ADD, GRP-SCRAP"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isAr ? 'كود فريد يحدد المجموعة في سجلات المخزون' : 'Unique identifier for the group'}
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'نطاق التطبيق (نوع الأصناف المستهدفة)' : 'Applicable Item Scope'}
              </label>
              <select
                value={formData.applicableType || 'ALL'}
                onChange={e => setFormData(prev => ({ ...prev, applicableType: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">{isAr ? 'كافة عناصر المخزون (شامل)' : 'All Inventory Items'}</option>
                <option value={ItemType.RAW_MATERIAL}>{isAr ? 'خامات ومواد أولية (Raw Materials)' : 'Raw Materials'}</option>
                <option value={ItemType.FINISHED_PRODUCT}>{isAr ? 'منتجات تامة الصنع (Finished Goods)' : 'Finished Goods'}</option>
                <option value={ItemType.SEMI_FINISHED}>{isAr ? 'منتجات نصف مصنعة / وسيطة (Semi-Finished)' : 'Semi-Finished Goods'}</option>
                <option value={ItemType.SCRAP}>{isAr ? 'هالك ومخلفات إنتاج (Scrap & By-products)' : 'Scrap & Industrial Waste'}</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isAr ? 'تحديد أي أصناف ستظهر بها هذه المجموعة للاختيار' : 'Which item types can pick this group'}
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'اسم المجموعة بالعربية *' : 'Arabic Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.nameAr || ''}
                onChange={e => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                placeholder="مثال: مجموعة الحوامل (Carrier) أو الإضافات أو الهالك"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'اسم المجموعة بالإنجليزية' : 'English Name'}
              </label>
              <input
                type="text"
                value={formData.nameEn || ''}
                onChange={e => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder="e.g. Carrier, Additives, Scrap & Regrind"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              />
            </div>
          </div>

          {/* VALUATION METHOD SELECTOR */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'طريقة تقييم المخزون المعتمدة للمجموعة *' : 'Designated Valuation Method *'}</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {formData.valuationMethod}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {methods.map(m => {
                const isSelected = formData.valuationMethod === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setFormData(prev => ({ ...prev, valuationMethod: m.id }))}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? m.color === 'blue'
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500/20'
                          : m.color === 'emerald'
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? m.color === 'blue'
                                ? 'bg-blue-600 text-white'
                                : m.color === 'emerald'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.id === ValuationMethod.MOVING_AVERAGE
                            ? 'Moving Avg'
                            : m.id === ValuationMethod.FIFO
                            ? 'FIFO'
                            : 'Standard'}
                        </span>
                        {isSelected && (
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              m.color === 'blue'
                                ? 'text-blue-600'
                                : m.color === 'emerald'
                                ? 'text-emerald-600'
                                : 'text-purple-600'
                            }`}
                          />
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mb-1">
                        {isAr ? m.labelAr : m.labelEn}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {isAr ? m.descAr : m.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Standard Cost Baseline (Visible if STANDARD selected) */}
          {formData.valuationMethod === ValuationMethod.STANDARD && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                <DollarSign className="w-4 h-4" />
                <span>{isAr ? 'التكلفة المعيارية القياسية المرجعية (EGP)' : 'Standard Cost Baseline (EGP)'}</span>
              </div>
              <p className="text-[11px] text-purple-700">
                {isAr
                  ? 'القيمة المعيارية المعتمدة لحساب تكلفة الصنف بالجنيه المصري (تستخدم كأساس لتقييم حركات المخزون وحساب الفروقات Variance)'
                  : 'Standard baseline unit cost in EGP used to value transactions and isolate procurement/usage variances.'}
              </p>
              <div className="max-w-xs">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.standardCostEGP || ''}
                  onChange={e => setFormData(prev => ({ ...prev, standardCostEGP: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono bg-white"
                />
              </div>
            </div>
          )}

          {/* Description & Specs */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'الوصف وملاحظات التصنيف' : 'Description & Technical Notes'}
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={
                isAr
                  ? 'ملاحظات حول طبيعة المواد بهذه المجموعة، اشتراطات التخزين، أو سياسات التسعير...'
                  : 'Notes on material nature, storage conditions, or costing policies...'
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="cat-active"
              checked={formData.active ?? true}
              onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="cat-active" className="text-slate-700 font-medium">
              {isAr
                ? 'مجموعة نشطة ومتاحة للاختيار عند تكويد الخامات والمنتجات والهالك'
                : 'Active group available when coding raw materials, products, and scrap'}
            </label>
          </div>

          {/* Footer Actions */}
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
                  ? isAr ? 'إضافة وتكويد المجموعة المنسوخة' : 'Add Cloned Group'
                  : isAr ? 'حفظ المجموعة' : 'Save Group'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
