import React, { useState, useEffect } from 'react';
import { X, Layers, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RawMaterial, ItemType } from '../../types';

interface RawMaterialModalProps {
  isOpen: boolean;
  material?: RawMaterial | null;
  onClose: () => void;
}

export const RawMaterialModal: React.FC<RawMaterialModalProps> = ({ isOpen, material, onClose }) => {
  const { language, warehouses, uoms, saveRawMaterial } = useApp();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Partial<RawMaterial>>({
    code: '',
    nameAr: '',
    nameEn: '',
    description: '',
    itemType: ItemType.RAW_MATERIAL,
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
      setFormData(material);
    } else {
      setFormData({
        id: `rm-${Date.now()}`,
        code: `RM-${Math.floor(100 + Math.random() * 900)}`,
        nameAr: '',
        nameEn: '',
        description: '',
        itemType: ItemType.RAW_MATERIAL,
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
  }, [material, isOpen, warehouses]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    const finalItem: RawMaterial = {
      id: material?.id || formData.id || `rm-${Date.now()}`,
      code: formData.code.trim(),
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      description: formData.description || '',
      itemType: ItemType.RAW_MATERIAL,
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
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {material
                  ? isAr ? 'تعديل بيانات مادة خام' : 'Edit Raw Material'
                  : isAr ? 'إضافة مادة خام جديدة' : 'Add New Raw Material'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'تعريف كود الصنف ووحدات القياس وحدود المخزون ومستودع الحفظ' : 'Item details, UOMs, stock bounds, and default warehouse'}
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

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'وحدة القياس الأساسية' : 'Default UOM'}
              </label>
              <select
                value={formData.defaultUOM || 'KG'}
                onChange={e => setFormData(prev => ({ ...prev, defaultUOM: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
              >
                {uoms.map(u => (
                  <option key={u.id} value={u.code}>{u.code} ({u.nameAr})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'وحدة القياس البديلة' : 'Alternative UOM'}
              </label>
              <select
                value={formData.alternativeUOM || 'TON'}
                onChange={e => setFormData(prev => ({ ...prev, alternativeUOM: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
              >
                {uoms.map(u => (
                  <option key={u.id} value={u.code}>{u.code} ({u.nameAr})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'معامل التحويل للوحدة البديلة' : 'Conversion Factor'}
              </label>
              <input
                type="number"
                step="any"
                value={formData.conversionFactor || 1}
                onChange={e => setFormData(prev => ({ ...prev, conversionFactor: parseFloat(e.target.value) || 1 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
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
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ البيانات' : 'Save Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
