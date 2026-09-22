import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  History,
  TrendingUp,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Coins,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CurrencyRate } from '../../types';

interface CurrencyRatesManagerProps {
  onOpenCurrencyModal?: () => void;
}

export const CurrencyRatesManager: React.FC<CurrencyRatesManagerProps> = ({
  onOpenCurrencyModal
}) => {
  const {
    language,
    currencies,
    currencyRates,
    saveCurrencyRate,
    deleteCurrencyRate,
    getExchangeRateForDate
  } = useApp();

  const isAr = language === 'ar';

  // Form state for adding/updating a rate manually by date
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(() => {
    const nonBase = currencies.find(c => !c.isBase);
    return nonBase ? nonBase.code : 'USD';
  });
  const [rateDate, setRateDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [rateValue, setRateValue] = useState<string>('49.50');
  const [source, setSource] = useState<string>('البنك المركزي المصري');
  const [notes, setNotes] = useState<string>('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [filterCurrency, setFilterCurrency] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Rate calculator / checker state
  const [calcCurrency, setCalcCurrency] = useState<string>('USD');
  const [calcDate, setCalcDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Non-base currencies available for rates
  const nonBaseCurrencies = currencies.filter(c => !c.isBase);

  // Filtered rates list
  const filteredRates = currencyRates
    .filter(r => {
      const matchesCurrency = filterCurrency === 'ALL' || r.currencyCode === filterCurrency;
      const matchesSearch =
        searchTerm === '' ||
        r.currencyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.rateDate.includes(searchTerm) ||
        (r.source && r.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCurrency && matchesSearch;
    })
    .sort((a, b) => b.rateDate.localeCompare(a.rateDate));

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(rateValue);
    if (!selectedCurrencyCode || isNaN(rateNum) || rateNum <= 0) return;

    saveCurrencyRate({
      currencyCode: selectedCurrencyCode,
      rateDate: rateDate || new Date().toISOString().split('T')[0],
      rate: rateNum,
      source: source.trim() || (isAr ? 'يدوي' : 'Manual'),
      notes: notes.trim()
    });

    setFormSuccessMessage(
      isAr
        ? `تم تسجيل سعر الصرف بنجاح: 1 ${selectedCurrencyCode} = ${rateNum} ج.م لتاريخ ${rateDate}`
        : `Rate saved successfully: 1 ${selectedCurrencyCode} = ${rateNum} EGP for date ${rateDate}`
    );

    setTimeout(() => {
      setFormSuccessMessage(null);
    }, 4000);

    // Reset notes only, keep date & currency for convenience
    setNotes('');
  };

  // Quick helper to see if a rate is the latest for that currency
  const isLatestRate = (rate: CurrencyRate) => {
    const forCurr = currencyRates
      .filter(r => r.currencyCode === rate.currencyCode)
      .sort((a, b) => b.rateDate.localeCompare(a.rateDate));
    return forCurr.length > 0 && forCurr[0].id === rate.id;
  };

  const calculatedLookup = getExchangeRateForDate(calcCurrency, calcDate);

  return (
    <div className="space-y-6">
      {/* 1. Header & Instructions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {isAr ? 'إدارة أسعار صرف العملات بالتواريخ' : 'Exchange Rates by Date Configuration'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'تسجيل وضبط أسعار الصرف يدوياً لكل تاريخ لتقييم المشتريات وتكاليف الاستيراد بدقة'
                  : 'Manually configure exchange rates per date for accurate purchase and landed cost valuation'}
              </p>
            </div>
          </div>
        </div>

        {onOpenCurrencyModal && (
          <button
            onClick={onOpenCurrencyModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer self-start md:self-auto"
          >
            <Coins className="w-4 h-4" />
            <span>{isAr ? 'إدارة العملات النقدية' : 'Manage Currencies'}</span>
          </button>
        )}
      </div>

      {/* 2. Top Grid: Manual Rate Entry Form + Rate Lookup Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Manual Entry Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                {isAr ? 'تسجيل سعر صرف يدوي بتاريخ محدد' : 'Record Manual Rate by Date'}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {isAr ? 'العملة الأساسية: EGP' : 'Base Currency: EGP'}
            </span>
          </div>

          {formSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveRate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Currency Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'العملة الأجنبية *' : 'Foreign Currency *'}
                </label>
                <select
                  value={selectedCurrencyCode}
                  onChange={e => setSelectedCurrencyCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                >
                  {nonBaseCurrencies.map(c => (
                    <option key={c.id} value={c.code}>
                      {c.code} - {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'تاريخ السعر *' : 'Rate Date *'}
                </label>
                <input
                  type="date"
                  value={rateDate}
                  onChange={e => setRateDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Exchange Rate Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'سعر الصرف (مقابل 1 EGP) *' : 'Rate to EGP *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={rateValue}
                    onChange={e => setRateValue(e.target.value)}
                    placeholder="49.50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center text-[10px] font-mono text-slate-400 font-semibold pointer-events-none">
                    EGP
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'مصدر السعر' : 'Rate Source'}
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder={isAr ? 'البنك المركزي المصري / بنك مصر / يدوي' : 'Central Bank / Bank Misr'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات وتفاصيل' : 'Notes / Reference'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={isAr ? 'مثال: سعر إغلاق الجلسة الأسبوعية' : 'e.g., Weekly closing rate'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Helper presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">
                {isAr ? 'مصادر شائعة:' : 'Quick Sources:'}
              </span>
              {[
                'البنك المركزي المصري',
                'البنك الأهلي المصري',
                'بنك مصر',
                'سعر الفاتورة الجمركية',
                'يدوي من الفاتورة'
              ].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-mono">
                1 {selectedCurrencyCode} = <span className="font-bold text-slate-800">{rateValue || '0'}</span> EGP ({rateDate})
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isAr ? 'حفظ السعر لهذا التاريخ' : 'Save Rate for Date'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Date Rate Inspector / Calculator */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">
                {isAr ? 'فاحص السعر الفعلي حسب التاريخ' : 'Date Rate Lookup Inspector'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {isAr
                ? 'يفحص النظام السعر الفعلي المستخدم لأي إذن استلام أو تكلفة إنزال تمت في هذا التاريخ'
                : 'Checks the exact effective rate applied to transactions on a specific date'}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  {isAr ? 'اختر العملة' : 'Select Currency'}
                </label>
                <select
                  value={calcCurrency}
                  onChange={e => setCalcCurrency(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                >
                  {nonBaseCurrencies.map(c => (
                    <option key={c.id} value={c.code}>
                      {c.code} ({c.nameAr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  {isAr ? 'تاريخ المعاملة' : 'Transaction Date'}
                </label>
                <input
                  type="date"
                  value={calcDate}
                  onChange={e => setCalcDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/90 rounded-xl border border-slate-700/80 space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{isAr ? 'السعر الفعلي المطبق:' : 'Effective Rate:'}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                calculatedLookup.isExact ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {calculatedLookup.isExact ? (isAr ? 'مطابق لليوم' : 'Exact Date') : (isAr ? 'أقرب سعر سابق' : 'Closest Preceding')}
              </span>
            </div>

            <div className="text-xl font-black font-mono text-emerald-400 flex items-baseline gap-1">
              <span>{calculatedLookup.rate}</span>
              <span className="text-xs text-slate-400">EGP</span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-700">
              <span>{isAr ? 'تاريخ السعر:' : 'Rate Date:'} {calculatedLookup.rateDate}</span>
              <span className="truncate max-w-[120px]">{calculatedLookup.source}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Currency Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {currencies.map(curr => {
          const ratesCount = currencyRates.filter(r => r.currencyCode === curr.code).length;
          return (
            <div
              key={curr.id}
              className={`p-3.5 rounded-2xl border transition space-y-2 ${
                curr.isBase
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-white border-slate-200 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                  {curr.code}
                </span>
                {curr.isBase ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {isAr ? 'الأساسية' : 'Base'}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedCurrencyCode(curr.code);
                      setFilterCurrency(curr.code);
                    }}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    {ratesCount} {isAr ? 'أسعار مسجلة' : 'rates'}
                  </button>
                )}
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-800">{curr.nameAr}</h4>
                <p className="text-[10px] text-slate-500 font-mono">{curr.nameEn}</p>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex items-baseline justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-400">{isAr ? 'السعر الحالي:' : 'Current:'}</span>
                <span className="font-bold text-slate-900">{curr.exchangeRate} EGP</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Rates Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isAr ? 'سجل أسعار الصرف التاريخية' : 'Historical Exchange Rates Log'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {filteredRates.length} {isAr ? 'سعر صرف مسجل' : 'rates recorded'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency Filter */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterCurrency}
                onChange={e => setFilterCurrency(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{isAr ? 'كل العملات' : 'All Currencies'}</option>
                {nonBaseCurrencies.map(c => (
                  <option key={c.id} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute inset-y-0 right-2.5 my-auto pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isAr ? 'بحث بالتاريخ أو المصدر...' : 'Search date, source...'}
                className="pr-8 pl-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">{isAr ? 'تاريخ السعر' : 'Rate Date'}</th>
                <th className="py-2.5 px-3">{isAr ? 'العملة' : 'Currency'}</th>
                <th className="py-2.5 px-3">{isAr ? 'سعر الصرف مقابل الجنيه' : 'Exchange Rate'}</th>
                <th className="py-2.5 px-3">{isAr ? 'المصدر' : 'Source'}</th>
                <th className="py-2.5 px-3">{isAr ? 'ملاحظات' : 'Notes'}</th>
                <th className="py-2.5 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-2.5 px-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <span>{isAr ? 'لا توجد أسعار صرف مسجلة مطابقة للبحث' : 'No exchange rates found'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRates.map(rate => {
                  const latest = isLatestRate(rate);
                  return (
                    <tr key={rate.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                        {rate.rateDate}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {rate.currencyCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                        1 {rate.currencyCode} = {rate.rate} EGP
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {rate.source || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate">
                        {rate.notes || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        {latest ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            {isAr ? 'السعر الأحدث' : 'Latest'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {isAr ? 'تاريخي' : 'Historical'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                isAr
                                  ? `هل تريد حذف سعر الصرف للعملة ${rate.currencyCode} بتاريخ ${rate.rateDate}؟`
                                  : `Delete rate for ${rate.currencyCode} on ${rate.rateDate}?`
                              )
                            ) {
                              deleteCurrencyRate(rate.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={isAr ? 'حذف هذا السعر' : 'Delete Rate'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
