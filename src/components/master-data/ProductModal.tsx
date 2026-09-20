import React, { useState, useEffect } from 'react';
import { X, Package, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ItemType } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  product?: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, product, onClose }) => {
  const { language, warehouses, uoms, saveProduct } = useApp();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Partial<Product>>({
    code: '',
    nameAr: '',
    nameEn: '',
    description: '',
    productType: ItemType.FINISHED_PRODUCT,
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
      setFormData(product);
    } else {
      setFormData({
        id: `fp-${Date.now()}`,
        code: `FP-${Math.floor(100 + Math.random() * 900)}`,
        nameAr: '',
        nameEn: '',
        description: '',
        productType: ItemType.FINISHED_PRODUCT,
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
  }, [product, isOpen, warehouses]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    const finalItem: Product = {
      id: product?.id || formData.id || `fp-${Date.now()}`,
      code: formData.code.trim(),
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      description: formData.description || '',
      productType: formData.productType || ItemType.FINISHED_PRODUCT,
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
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {product
                  ? isAr ? 'تعديل بيانات المنتج' : 'Edit Product'
                  : isAr ? 'إضافة منتج جديد' : 'Add New Product'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'منتج تام جاهز للبيع أو منتج وسيط نصف مصنع' : 'Finished goods or semi-finished items'}
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
                  productType: e.target.value as (ItemType.FINISHED_PRODUCT | ItemType.SEMI_FINISHED)
                }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value={ItemType.FINISHED_PRODUCT}>
                  {isAr ? 'منتج تام الصنع (Finished Goods)' : 'Finished Goods'}
                </option>
                <option value={ItemType.SEMI_FINISHED}>
                  {isAr ? 'منتج نصف مصنع / وسيط (Semi-Finished)' : 'Semi-Finished Goods'}
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

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'وحدة القياس الأساسية' : 'Default UOM'}
              </label>
              <select
                value={formData.defaultUOM || 'KG'}
                onChange={e => setFormData(prev => ({ ...prev, defaultUOM: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
              >
                {uoms.map(u => (
                  <option key={u.id} value={u.code}>{u.code} ({u.nameAr})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'وحدة البيع / القياس البديلة' : 'Alternative UOM'}
              </label>
              <select
                value={formData.alternativeUOM || 'MTR'}
                onChange={e => setFormData(prev => ({ ...prev, alternativeUOM: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
              >
                {uoms.map(u => (
                  <option key={u.id} value={u.code}>{u.code} ({u.nameAr})</option>
                ))}
              </select>
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
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ المنتج' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
