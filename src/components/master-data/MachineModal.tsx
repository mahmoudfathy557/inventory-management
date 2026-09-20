import React, { useState, useEffect } from 'react';
import { X, Cog, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Machine } from '../../types';

interface MachineModalProps {
  isOpen: boolean;
  machine?: Machine | null;
  onClose: () => void;
}

export const MachineModal: React.FC<MachineModalProps> = ({ isOpen, machine, onClose }) => {
  const { language, locations, saveMachine } = useApp();
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
      setFormData(machine);
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
  }, [machine, isOpen, locations]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    const finalMc: Machine = {
      id: machine?.id || formData.id || `mc-${Date.now()}`,
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
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Cog className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {machine
                  ? isAr ? 'تعديل بيانات الماكينة ومركز العمل' : 'Edit Machine'
                  : isAr ? 'إضافة ماكينة / خط إنتاج جديد' : 'Add Machine'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'ربط الماكينة بموقع ومرحلة الإنتاج' : 'Work center machine and production routing'}
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
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ الماكينة' : 'Save Machine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
