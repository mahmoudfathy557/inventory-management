import React, { useState, useEffect } from 'react';
import { X, MapPin, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionLocation } from '../../types';

interface LocationModalProps {
  isOpen: boolean;
  location?: ProductionLocation | null;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, location, onClose }) => {
  const { language, warehouses, saveLocation } = useApp();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Partial<ProductionLocation>>({
    code: '',
    nameAr: '',
    nameEn: '',
    warehouseId: 'wh-wip',
    stageName: 'مرحلة 1',
    active: true,
    notes: ''
  });

  useEffect(() => {
    if (location) {
      setFormData(location);
    } else {
      setFormData({
        id: `loc-${Date.now()}`,
        code: `LOC-STG-${Math.floor(10 + Math.random() * 90)}`,
        nameAr: '',
        nameEn: '',
        warehouseId: warehouses.find(w => w.type === 'WIP')?.id || warehouses[0]?.id || 'wh-wip',
        stageName: 'مرحلة تشغيل',
        active: true,
        notes: ''
      });
    }
  }, [location, isOpen, warehouses]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    const finalLoc: ProductionLocation = {
      id: location?.id || formData.id || `loc-${Date.now()}`,
      code: formData.code.trim(),
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      warehouseId: formData.warehouseId || 'wh-wip',
      stageName: formData.stageName || 'مرحلة تشغيل',
      active: formData.active ?? true,
      notes: formData.notes || ''
    };

    saveLocation(finalLoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {location
                  ? isAr ? 'تعديل موقع إنتاج / مرحلة' : 'Edit Production Location'
                  : isAr ? 'إضافة موقع إنتاج / مرحلة تشغيل' : 'Add Production Location'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'موقع فعلي أو مرحلة تشغيلية داخل صالة التصنيع' : 'Floor stage or physical location within WIP'}
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
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'كود الموقع *' : 'Location Code *'}
            </label>
            <input
              type="text"
              required
              value={formData.code || ''}
              onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="مثال: LOC-STG-3"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'المستودع الرئيسي التابع له' : 'Parent Warehouse'}
            </label>
            <select
              value={formData.warehouseId || ''}
              onChange={e => setFormData(prev => ({ ...prev, warehouseId: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
              {isAr ? 'اسم المرحلة / الموقع بالعربية *' : 'Arabic Name *'}
            </label>
            <input
              type="text"
              required
              value={formData.nameAr || ''}
              onChange={e => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
              placeholder="مثال: مرحلة التبريد والمعايرة"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              placeholder="e.g. Cooling & Calibration Stage"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'تسمية المرحلة المختصرة' : 'Short Stage Name'}
            </label>
            <input
              type="text"
              value={formData.stageName || ''}
              onChange={e => setFormData(prev => ({ ...prev, stageName: e.target.value }))}
              placeholder="مرحلة 1"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ الموقع' : 'Save Location'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
