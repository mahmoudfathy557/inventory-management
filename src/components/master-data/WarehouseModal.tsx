import React, { useState, useEffect } from 'react';
import { X, Building2, Save, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Warehouse, WarehouseType } from '../../types';
import { generateNextSequentialCode, generateDuplicateName } from '../../utils/codeGenerator';

interface WarehouseModalProps {
  isOpen: boolean;
  warehouse?: Warehouse | null;
  isDuplicate?: boolean;
  onClose: () => void;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  warehouse,
  isDuplicate = false,
  onClose
}) => {
  const { language, warehouses, saveWarehouse } = useApp();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Partial<Warehouse>>({
    code: '',
    nameAr: '',
    nameEn: '',
    type: WarehouseType.RAW_MATERIALS,
    active: true,
    notes: ''
  });

  useEffect(() => {
    if (warehouse) {
      if (isDuplicate) {
        const existingCodes = warehouses.map(w => w.code);
        setFormData({
          ...warehouse,
          id: `wh-${Date.now()}`,
          code: generateNextSequentialCode(warehouse.code, existingCodes),
          nameAr: generateDuplicateName(warehouse.nameAr, true),
          nameEn: generateDuplicateName(warehouse.nameEn || '', false)
        });
      } else {
        setFormData(warehouse);
      }
    } else {
      setFormData({
        id: `wh-${Date.now()}`,
        code: `WH-NEW-${Math.floor(10 + Math.random() * 90)}`,
        nameAr: '',
        nameEn: '',
        type: WarehouseType.RAW_MATERIALS,
        active: true,
        notes: ''
      });
    }
  }, [warehouse, isOpen, isDuplicate, warehouses]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    const finalWh: Warehouse = {
      id: (isDuplicate ? null : warehouse?.id) || formData.id || `wh-${Date.now()}`,
      code: formData.code.trim(),
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      type: formData.type || WarehouseType.RAW_MATERIALS,
      active: formData.active ?? true,
      notes: formData.notes || ''
    };

    saveWarehouse(finalWh);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDuplicate
                ? 'bg-amber-50 text-amber-600'
                : 'bg-blue-50 text-blue-600'
            }`}>
              {isDuplicate ? <Copy className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isDuplicate
                    ? isAr ? 'نسخ وتكرار مستودع تخزين' : 'Duplicate Warehouse'
                    : warehouse
                    ? isAr ? 'تعديل بيانات المستودع' : 'Edit Warehouse'
                    : isAr ? 'إضافة مستودع تخزين جديد' : 'Add New Warehouse'}
                </h3>
                {isDuplicate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {isAr ? 'نسخ سريع' : 'Quick Duplicate'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isDuplicate
                  ? isAr ? 'تم نسخ بيانات المستودع وتوليد كود تسلسلي جديد. يمكنك تعديل الاسم والموقع والحفظ مباشرة.' : 'Cloned warehouse with next sequential code. Edit name/notes and save.'
                  : isAr ? 'مستودع مواد خام، تشغيل WIP، منتج تام، أو هالك' : 'Raw, WIP, Finished Goods, or Scrap warehouse'}
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
              {isAr ? 'كود المستودع *' : 'Warehouse Code *'}
            </label>
            <input
              type="text"
              required
              value={formData.code || ''}
              onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="مثال: WH-RAW-02"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'نوع المستودع والغرض *' : 'Warehouse Type *'}
            </label>
            <select
              value={formData.type || WarehouseType.RAW_MATERIALS}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as WarehouseType }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value={WarehouseType.RAW_MATERIALS}>
                {isAr ? 'مستودع مواد خام (Raw Materials)' : 'Raw Materials'}
              </option>
              <option value={WarehouseType.WIP}>
                {isAr ? 'مستودع تشغيل وإنتاج (WIP Production)' : 'WIP / Production Floor'}
              </option>
              <option value={WarehouseType.FINISHED_GOODS}>
                {isAr ? 'مستودع منتجات تامة (Finished Goods)' : 'Finished Goods'}
              </option>
              <option value={WarehouseType.SCRAP}>
                {isAr ? 'مستودع هالك وسكراب (Scrap & Waste)' : 'Scrap & Waste'}
              </option>
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
              placeholder="مثال: مستودع المواد الخام الثانوي"
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
              placeholder="e.g. Secondary Raw Warehouse"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'ملاحظات المستودع' : 'Notes & Location Details'}
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="موقع المستودع أو المشرف المسؤول..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                isDuplicate
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isDuplicate ? <Copy className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>
                {isDuplicate
                  ? isAr ? 'إضافة وتكويد المستودع المنسوخ' : 'Add Cloned Warehouse'
                  : isAr ? 'حفظ المستودع' : 'Save Warehouse'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
