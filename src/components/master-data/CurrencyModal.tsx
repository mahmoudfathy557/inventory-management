import React, { useState, useEffect } from 'react';
import { X, DollarSign, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Currency } from '../../types';

interface CurrencyModalProps {
  isOpen: boolean;
  currency?: Currency | null;
  onClose: () => void;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({ isOpen, currency, onClose }) => {
  const { language, saveCurrency } = useApp();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Partial<Currency>>({
    code: '',
    nameAr: '',
    nameEn: '',
    exchangeRate: 1,
    rateDate: new Date().toISOString().split('T')[0],
    isBase: false,
    active: true
  });

  useEffect(() => {
    if (currency) {
      setFormData(currency);
    } else {
      setFormData({
        id: `curr-${Date.now()}`,
        code: '',
        nameAr: '',
        nameEn: '',
        exchangeRate: 50.0,
        rateDate: new Date().toISOString().split('T')[0],
        isBase: false,
        active: true
      });
    }
  }, [currency, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    const finalCurr: Currency = {
      id: currency?.id || formData.id || `curr-${Date.now()}`,
      code: formData.code.trim().toUpperCase(),
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
      exchangeRate: Number(formData.exchangeRate) || 1,
      rateDate: formData.rateDate || new Date().toISOString().split('T')[0],
      isBase: formData.isBase ?? false,
      active: formData.active ?? true
    };

    saveCurrency(finalCurr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {currency
                  ? isAr ? 'تعديل بيانات العملة وسعر الصرف' : 'Edit Currency'
                  : isAr ? 'إضافة عملة نقدية جديدة' : 'Add Currency'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'أسعار الصرف لتقييم المشتريات ومصروفات الإنزال' : 'Exchange rates for multi-currency transactions'}
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
              {isAr ? 'رمز العملة (ISO Code) *' : 'Currency Code *'}
            </label>
            <input
              type="text"
              required
              value={formData.code || ''}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="USD, EUR, SAR, EGP"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-bold"
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
              placeholder="دولار أمريكي"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              placeholder="US Dollar"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'سعر الصرف مقابل EGP *' : 'Rate to EGP *'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.exchangeRate || 1}
                onChange={e => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'تاريخ السعر' : 'Rate Date'}
              </label>
              <input
                type="date"
                value={formData.rateDate || ''}
                onChange={e => setFormData({ ...formData, rateDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isBase ?? false}
                onChange={e => setFormData({ ...formData, isBase: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700 font-medium">
                {isAr ? 'العملة الأساسية للنظام (EGP)' : 'Base Currency (1.0)'}
              </span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active ?? true}
                onChange={e => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700 font-medium">
                {isAr ? 'نشط' : 'Active'}
              </span>
            </label>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800">{isAr ? 'المعامل:' : 'Conversion:'}</span> 1 {formData.code || 'CURR'} = {formData.exchangeRate || 1} EGP
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
              <span>{isAr ? 'حفظ العملة' : 'Save Currency'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
