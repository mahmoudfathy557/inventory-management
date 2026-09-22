import React, { useState, useEffect } from 'react';
import { X, DollarSign, Save, Plus, Trash2, Calendar, History, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Currency } from '../../types';

interface CurrencyModalProps {
  isOpen: boolean;
  currency?: Currency | null;
  onClose: () => void;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({ isOpen, currency, onClose }) => {
  const { language, saveCurrency, currencyRates, saveCurrencyRate, deleteCurrencyRate } = useApp();
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

  // Inline new historical rate entry
  const [newRateValue, setNewRateValue] = useState<string>('');
  const [newRateDate, setNewRateDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newRateSource, setNewRateSource] = useState<string>('البنك المركزي المصري');

  useEffect(() => {
    if (currency) {
      setFormData(currency);
      setNewRateValue(currency.exchangeRate?.toString() || '1');
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
      setNewRateValue('50.0');
    }
  }, [currency, isOpen]);

  if (!isOpen) return null;

  const currentCode = (formData.code || '').trim().toUpperCase();
  const existingRates = currencyRates
    .filter(r => r.currencyCode === currentCode)
    .sort((a, b) => b.rateDate.localeCompare(a.rateDate));

  const handleAddInlineRate = (e: React.MouseEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(newRateValue);
    if (!currentCode || isNaN(rateNum) || rateNum <= 0) return;

    saveCurrencyRate({
      currencyCode: currentCode,
      rateDate: newRateDate || new Date().toISOString().split('T')[0],
      rate: rateNum,
      source: newRateSource.trim() || (isAr ? 'يدوي' : 'Manual'),
      notes: isAr ? 'تمت الإضافة من بطاقة العملة' : 'Added from currency card'
    });

    // Also update form's current display if newer
    setFormData(prev => ({
      ...prev,
      exchangeRate: rateNum,
      rateDate: newRateDate
    }));
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
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
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                {isAr ? 'سعر الصرف الحالي (مقابل EGP) *' : 'Current Rate to EGP *'}
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

          {/* Section: Historical Rates for this Currency */}
          {!formData.isBase && currentCode && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-emerald-600" />
                  {isAr ? 'سجل أسعار الصرف لهذه العملة بالتواريخ' : 'Exchange Rates History for this Currency'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {existingRates.length} {isAr ? 'سعر مسجل' : 'rates'}
                </span>
              </div>

              {/* Quick Add Inline Rate */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-[11px] font-semibold text-slate-700">
                  {isAr ? 'إضافة سعر جديد بتاريخ محدد:' : 'Add rate for date:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={newRateDate}
                    onChange={e => setNewRateDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Rate to EGP"
                    value={newRateValue}
                    onChange={e => setNewRateValue(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddInlineRate}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة سعر' : 'Add Rate'}</span>
                  </button>
                </div>
              </div>

              {/* Table of existing rates */}
              {existingRates.length > 0 && (
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {existingRates.map(r => (
                    <div key={r.id} className="p-2 flex items-center justify-between hover:bg-slate-50 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700">{r.rateDate}</span>
                        <span className="font-mono text-emerald-700 font-bold">1 {r.currencyCode} = {r.rate} EGP</span>
                        {r.source && <span className="text-slate-400 text-[10px]">({r.source})</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCurrencyRate(r.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title={isAr ? 'حذف هذا السعر' : 'Delete Rate'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800">{isAr ? 'المعامل الحالي:' : 'Current Conversion:'}</span> 1 {formData.code || 'CURR'} = {formData.exchangeRate || 1} EGP
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
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
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
