import React, { useState, useEffect } from 'react';
import { X, Cog, Save, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Machine } from '../../types';
import { generateNextSequentialCode, generateDuplicateName } from '../../utils/codeGenerator';

interface MachineModalProps {
  isOpen: boolean;
  machine?: Machine | null;
  isDuplicate?: boolean;
  onClose: () => void;
}

export const MachineModal: React.FC<MachineModalProps> = ({
  isOpen,
  machine,
  isDuplicate = false,
  onClose
}) => {
  const { language, machines, locations, saveMachine } = useApp();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Partial<Machine>>({
    code: '',
    nameAr: '',
    nameEn: '',
    description: '',
    defaultLocationId: '',
    productionStage: 'Production Stage 1',
    active: true
  });

  useEffect(() => {
    if (machine) {
      if (isDuplicate) {
        const existingCodes = machines.map(m => m.code);
        setFormData({
          ...machine,
          id: `mc-${Date.now()}`,
          code: generateNextSequentialCode(machine.code, existingCodes),
          nameAr: generateDuplicateName(machine.nameAr, true),
          nameEn: generateDuplicateName(machine.nameEn || '', false)
        });
      } else {
        setFormData(machine);
      }
    } else {
      setFormData({
        id: `mc-${Date.now()}`,
        code: `MC-EXT-${Math.floor(10 + Math.random() * 90)}`,
        nameAr: '',
        nameEn: '',
        description: '',
        defaultLocationId: locations[0]?.id || '',
        productionStage: locations[0]?.stageName || 'Production Stage 1',
        active: true
      });
    }
  }, [machine, isOpen, isDuplicate, machines, locations]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    const finalMc: Machine = {
      id: (isDuplicate ? null : machine?.id) || formData.id || `mc-${Date.now()}`,
      code: formData.code.trim(),
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      description: formData.description?.trim(),
      defaultLocationId: formData.defaultLocationId || locations[0]?.id || '',
      productionStage: formData.productionStage || 'Production Stage 1',
      active: formData.active ?? true
    };

    saveMachine(finalMc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDuplicate
                ? 'bg-amber-100 text-amber-800'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {isDuplicate ? <Copy className="w-4 h-4" /> : <Cog className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isDuplicate
                    ? isAr ? 'نسخ وتكرار ماكينة / خط إنتاج' : 'Duplicate Machine'
                    : machine
                    ? isAr ? 'تعديل بيانات الماكينة ومركز العمل' : 'Edit Machine'
                    : isAr ? 'إضافة ماكينة / خط إنتاج جديد' : 'Add Machine'}
                </h3>
                {isDuplicate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {isAr ? 'نسخ سريع' : 'Quick Duplicate'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isDuplicate
                  ? isAr ? 'تم نسخ بيانات الماكينة وتوليد كود تسلسلي جديد. يمكنك تعديل الاسم والمرحلة وحفظها مباشرة.' : 'Cloned machine with next sequential code. Edit name/specs and save.'
                  : isAr ? 'ربط الماكينة بموقع ومرحلة الإنتاج' : 'Work center machine and production routing'}
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
              {isAr ? 'كود الماكينة *' : 'Machine Code *'}
            </label>
            <input
              type="text"
              required
              value={formData.code || ''}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              placeholder="MC-EXT-01"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'اسم الماكينة / خط التشغيل بالعربية *' : 'Arabic Name *'}
            </label>
            <input
              type="text"
              required
              value={formData.nameAr || ''}
              onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
              placeholder="خط البثق الألماني الرئيسي"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              placeholder="Main Extrusion Line 1"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'الوصف والمواصفات الفنية' : 'Description'}
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="خط تشكيل حراري عالي السرعة..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'موقع الإنتاج المرتبط' : 'Production Location'}
              </label>
              <select
                value={formData.defaultLocationId || ''}
                onChange={e => setFormData(prev => ({ ...prev, defaultLocationId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {isAr ? l.nameAr : l.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'المرحلة التشغيلية' : 'Stage'}
              </label>
              <input
                type="text"
                value={formData.productionStage || ''}
                onChange={e => setFormData(prev => ({ ...prev, productionStage: e.target.value }))}
                placeholder="Production Stage 1"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="mc-active"
              checked={formData.active ?? true}
              onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="mc-active" className="text-slate-700 font-medium">
              {isAr ? 'الماكينة مفعلة وجاهزة للجدولة والتشغيل' : 'Active and available for production scheduling'}
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
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isDuplicate ? <Copy className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>
                {isDuplicate
                  ? isAr ? 'إضافة وتكويد الماكينة المنسوخة' : 'Add Cloned Machine'
                  : isAr ? 'حفظ الماكينة' : 'Save Machine'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
