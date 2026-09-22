import React, { useState, useEffect } from 'react';
import { X, Scale, Save, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UOM } from '../../types';
import { generateNextSequentialCode, generateDuplicateName } from '../../utils/codeGenerator';

interface UOMModalProps {
  isOpen: boolean;
  uom?: UOM | null;
  isDuplicate?: boolean;
  onClose: () => void;
}

export const UOMModal: React.FC<UOMModalProps> = ({
  isOpen,
  uom,
  isDuplicate = false,
  onClose
}) => {
  const { language, uoms, saveUOM } = useApp();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Partial<UOM>>({
    code: '',
    nameAr: '',
    nameEn: '',
    baseUOM: 'KG',
    conversionFactor: 1,
    active: true
  });

  useEffect(() => {
    if (uom) {
      if (isDuplicate) {
        const existingCodes = uoms.map(u => u.code);
        setFormData({
          ...uom,
          id: `uom-${Date.now()}`,
          code: generateNextSequentialCode(uom.code, existingCodes),
          nameAr: generateDuplicateName(uom.nameAr, true),
          nameEn: generateDuplicateName(uom.nameEn || '', false)
        });
      } else {
        setFormData(uom);
      }
    } else {
      setFormData({
        id: `uom-${Date.now()}`,
        code: '',
        nameAr: '',
        nameEn: '',
        baseUOM: 'KG',
        conversionFactor: 1,
        active: true
      });
    }
  }, [uom, isOpen, isDuplicate, uoms]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    const finalUom: UOM = {
      id: (isDuplicate ? null : uom?.id) || formData.id || `uom-${Date.now()}`,
      code: formData.code.trim().toUpperCase(),
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      baseUOM: formData.baseUOM || 'KG',
      conversionFactor: Number(formData.conversionFactor) || 1,
      active: formData.active ?? true
    };

    saveUOM(finalUom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDuplicate
                ? 'bg-amber-50 text-amber-600'
                : 'bg-orange-50 text-orange-600'
            }`}>
              {isDuplicate ? <Copy className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isDuplicate
                    ? isAr ? 'نسخ وتكرار وحدة قياس' : 'Duplicate Unit of Measure'
                    : uom
                    ? isAr ? 'تعديل وحدة القياس' : 'Edit Unit of Measure'
                    : isAr ? 'إضافة وحدة قياس جديدة' : 'Add Unit of Measure'}
                </h3>
                {isDuplicate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {isAr ? 'نسخ سريع' : 'Quick Duplicate'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isDuplicate
                  ? isAr ? 'تم نسخ وحدة القياس وتوليد كود جديد. يمكنك تعديل الاسم ومعامل التحويل والحفظ مباشرة.' : 'Cloned UOM with new code. Edit name/factor and save.'
                  : isAr ? 'معاملات التحويل بين الوحدات (UOM Conversion)' : 'Define conversion rates to base UOM'}
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

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'رمز الوحدة (Code) *' : 'UOM Code *'}
            </label>
            <input
              type="text"
              required
              value={formData.code || ''}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="KG, TON, M, PCS, BAG"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono uppercase font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'الاسم بالعربية *' : 'Arabic Name *'}
            </label>
            <input
              type="text"
              required
              value={formData.nameAr || ''}
              onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
              placeholder="كيلوجرام، طن، متر طولي"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'الاسم بالإنجليزية' : 'English Name'}
            </label>
            <input
              type="text"
              value={formData.nameEn || ''}
              onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder="Kilogram, Metric Ton, Meter"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'الوحدة المرجعية الأساسية' : 'Base UOM'}
              </label>
              <input
                type="text"
                value={formData.baseUOM || 'KG'}
                onChange={e => setFormData({ ...formData, baseUOM: e.target.value.toUpperCase() })}
                placeholder="KG"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'معامل التحويل (Conversion Factor) *' : 'Conversion Factor *'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.conversionFactor || 1}
                onChange={e => setFormData({ ...formData, conversionFactor: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold text-orange-700"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800">{isAr ? 'معادلة التحويل:' : 'Rule:'}</span> 1 {formData.code || 'UNIT'} = {formData.conversionFactor || 1} {formData.baseUOM || 'KG'}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="uom-active"
              checked={formData.active ?? true}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="uom-active" className="text-slate-700 font-medium">
              {isAr ? 'وحدة قياس نشطة في النظام' : 'Active Unit of Measure'}
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
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isDuplicate ? <Copy className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>
                {isDuplicate
                  ? isAr ? 'إضافة وتكويد وحدة القياس المنسوخة' : 'Add Cloned UOM'
                  : isAr ? 'حفظ الوحدة' : 'Save UOM'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
