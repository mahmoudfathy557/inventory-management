import React, { useState, useEffect } from 'react';
import { X, Scale, Save, Copy, CheckCircle2, ArrowRightLeft, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UOM, UOMType } from '../../types';
import { generateNextSequentialCode, generateDuplicateName } from '../../utils/codeGenerator';
import { getPrimaryUOMs, isPrimaryUOM } from '../../utils/uomHelper';

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

  const [uomType, setUomType] = useState<UOMType>('PRIMARY');
  const [formData, setFormData] = useState<Partial<UOM>>({
    code: '',
    nameAr: '',
    nameEn: '',
    baseUOM: '',
    conversionFactor: 1,
    active: true
  });

  const primaryUOMs = getPrimaryUOMs(uoms);

  useEffect(() => {
    if (uom) {
      const type: UOMType = uom.uomType || (isPrimaryUOM(uom) ? 'PRIMARY' : 'SECONDARY');
      setUomType(type);

      if (isDuplicate) {
        const existingCodes = uoms.map(u => u.code);
        setFormData({
          ...uom,
          uomType: type,
          id: `uom-${Date.now()}`,
          code: generateNextSequentialCode(uom.code, existingCodes),
          nameAr: generateDuplicateName(uom.nameAr, true),
          nameEn: generateDuplicateName(uom.nameEn || '', false)
        });
      } else {
        setFormData(uom);
      }
    } else {
      setUomType('PRIMARY');
      setFormData({
        id: `uom-${Date.now()}`,
        code: '',
        nameAr: '',
        nameEn: '',
        uomType: 'PRIMARY',
        baseUOM: '',
        conversionFactor: 1,
        active: true
      });
    }
  }, [uom, isOpen, isDuplicate, uoms]);

  if (!isOpen) return null;

  const handleTypeSelect = (selectedType: UOMType) => {
    setUomType(selectedType);
    if (selectedType === 'PRIMARY') {
      setFormData(prev => ({
        ...prev,
        uomType: 'PRIMARY',
        baseUOM: prev.code || '',
        conversionFactor: 1
      }));
    } else {
      const defaultBase = primaryUOMs[0]?.code || 'KG';
      setFormData(prev => ({
        ...prev,
        uomType: 'SECONDARY',
        baseUOM: prev.baseUOM && prev.baseUOM !== prev.code ? prev.baseUOM : defaultBase,
        conversionFactor: prev.conversionFactor && prev.conversionFactor !== 1 ? prev.conversionFactor : 1000
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    const cleanCode = formData.code.trim().toUpperCase();
    const finalBaseUOM = uomType === 'PRIMARY' ? cleanCode : (formData.baseUOM?.trim().toUpperCase() || 'KG');
    const finalFactor = uomType === 'PRIMARY' ? 1 : (Number(formData.conversionFactor) || 1);

    const finalUom: UOM = {
      id: (isDuplicate ? null : uom?.id) || formData.id || `uom-${Date.now()}`,
      code: cleanCode,
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      uomType,
      baseUOM: finalBaseUOM,
      conversionFactor: finalFactor,
      active: formData.active ?? true
    };

    saveUOM(finalUom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
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
                {isAr
                  ? 'الربط الشجري بين وحدات القياس الرئيسية والفرعية مع معاملات التحويل'
                  : 'Establish parent-child UOM relationship and conversion factors'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* UOM TYPE SELECTION */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-600" />
              <span>{isAr ? 'نوع وحدة القياس وطبيعة الربط *' : 'UOM Hierarchy Type *'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* PRIMARY */}
              <button
                type="button"
                onClick={() => handleTypeSelect('PRIMARY')}
                className={`p-3 rounded-xl border text-right transition flex flex-col justify-between cursor-pointer ${
                  uomType === 'PRIMARY'
                    ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-orange-600" />
                    <span>{isAr ? 'وحدة رئيسية (أساسية)' : 'Primary Base UOM'}</span>
                  </span>
                  {uomType === 'PRIMARY' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {isAr
                    ? 'الوحدة المرجعية للمخزون والتكاليف (كجم، متر، قطعة، لتر). تُختار عند تكويد الصنف.'
                    : 'Base inventory unit (KG, MTR, PCS). Selected during item coding.'}
                </p>
              </button>

              {/* SECONDARY */}
              <button
                type="button"
                onClick={() => handleTypeSelect('SECONDARY')}
                className={`p-3 rounded-xl border text-right transition flex flex-col justify-between cursor-pointer ${
                  uomType === 'SECONDARY'
                    ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'وحدة فرعية / تابعة' : 'Secondary / Sub UOM'}</span>
                  </span>
                  {uomType === 'SECONDARY' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {isAr
                    ? 'تابعة لوحدة رئيسية (طن=1000كجم، كرتونة=24قطعة). تتاح تلقائياً في شاشات الحركات.'
                    : 'Linked to a primary unit (Ton=1000kg). Available in movement forms.'}
                </p>
              </button>
            </div>
          </div>

          {/* BASIC INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'رمز الوحدة (Code) *' : 'UOM Code *'}
              </label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="KG, TON, GM, MTR, PCS"
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
                placeholder="كيلوجرام، طن متري، جرام..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'الاسم بالإنجليزية' : 'English Name'}
            </label>
            <input
              type="text"
              value={formData.nameEn || ''}
              onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder="Kilogram, Metric Ton, Gram, Linear Meter"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
          </div>

          {/* RELATIONSHIP & CONVERSION SECTION */}
          {uomType === 'SECONDARY' ? (
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-3">
              <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                <span>{isAr ? 'ربط الوحدة الفرعية بالوحدة الرئيسية ومعامل التحويل' : 'Parent Link & Conversion'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {isAr ? 'الوحدة الرئيسية التابعة لها *' : 'Parent Primary UOM *'}
                  </label>
                  <select
                    value={formData.baseUOM || (primaryUOMs[0]?.code || 'KG')}
                    onChange={e => setFormData({ ...formData, baseUOM: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono font-bold"
                  >
                    {primaryUOMs.map(p => (
                      <option key={p.id} value={p.code}>
                        {p.code} - {p.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {isAr ? 'معامل التحويل (Conversion Factor) *' : 'Conversion Factor *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    required
                    value={formData.conversionFactor || ''}
                    onChange={e => setFormData({ ...formData, conversionFactor: parseFloat(e.target.value) || 0 })}
                    placeholder="مثال: 1000 أو 0.001 أو 24"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              {/* Dynamic visual preview of the conversion rule */}
              <div className="p-2.5 bg-white rounded-lg border border-blue-200 text-[11px] text-blue-950 font-mono">
                <span className="font-bold font-sans text-slate-700">{isAr ? 'معادلة الربط:' : 'Rule:'} </span>
                كل 1 <strong className="text-blue-700 font-bold">{formData.code || 'UNIT'}</strong> = <strong className="text-emerald-700 font-bold">{formData.conversionFactor || 1}</strong> من <strong className="text-slate-900 font-bold">{formData.baseUOM || 'KG'}</strong>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'وحدة قياس رئيسية معتمدة' : 'Standard Primary Base Unit'}</span>
              </div>
              <p className="text-emerald-700 text-[10px]">
                {isAr
                  ? 'هذه الوحدة هي المرجع الأساسي للمخزون. معامل التحويل الخاص بها يساوي 1 تلقائياً، وتكون متاحة للاختيار عند تكويد أي مادة خام أو منتج تام.'
                  : 'This unit serves as the base reference for stock balances. Conversion factor is 1.'}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="uom-active"
              checked={formData.active ?? true}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <label htmlFor="uom-active" className="text-slate-700 font-medium cursor-pointer">
              {isAr ? 'وحدة قياس نشطة ومتاحة للاستخدام في النظام' : 'Active Unit of Measure'}
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
                isDuplicate
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isDuplicate ? <Copy className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>
                {isDuplicate
                  ? isAr ? 'إضافة وتكويد وحدة القياس المنسوخة' : 'Add Cloned UOM'
                  : isAr ? 'حفظ وحدة القياس' : 'Save UOM'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
