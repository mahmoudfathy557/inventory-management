import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Factory,
  ShieldCheck,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber, exportToExcel } from '../../utils/formatters';

export const ScrapReport: React.FC = () => {
  const { language, productionReceipts, ledgerEntries } = useApp();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');

  // Extract scrap records from receipts and ledger
  const scrapLines = productionReceipts
    .filter(r => (r.scrapQuantity || 0) > 0)
    .map(r => ({
      id: r.id,
      date: r.date,
      orderNumber: r.productionOrderNumber,
      productName: r.productName,
      productCode: r.productCode,
      scrapItem: `${isAr ? 'عادم وهالك تشغيل' : 'Scrap & Waste'} ${r.productName}`,
      scrapQuantity: r.scrapQuantity,
      uom: r.uom,
      warehouse: isAr ? 'مستودع السكراب والهالك (Scrap WH)' : 'Scrap Warehouse',
      standardCostEGP: 0,
      totalScrapValueEGP: 0, // Rule 22: Scrap is valued at 0 EGP in MVP
      receiptNumber: r.receiptNumber,
      notes: r.notes || (isAr ? 'هالك تشغيل اعتيادي ممتص في تكلفة المنتج التام' : 'Standard scrap absorbed into FG')
    }));

  const filteredLines = scrapLines.filter(l => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.orderNumber.toLowerCase().includes(q) ||
        l.productName.toLowerCase().includes(q) ||
        l.scrapItem.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalScrapQty = filteredLines.reduce((acc, l) => acc + l.scrapQuantity, 0);

  const handleExport = () => {
    const headers = [
      isAr ? 'التاريخ' : 'Date',
      isAr ? 'رقم أمر الإنتاج' : 'Order No',
      isAr ? 'المنتج التام' : 'Product',
      isAr ? 'بند الهالك' : 'Scrap Item',
      isAr ? 'كمية الهالك' : 'Scrap Qty',
      isAr ? 'الوحدة' : 'UOM',
      isAr ? 'المستودع' : 'Warehouse',
      isAr ? 'التكلفة المعيارية' : 'Std Cost',
      isAr ? 'إجمالي قيمة الهالك' : 'Total Scrap Value',
      isAr ? 'ملاحظات المعالجة' : 'Accounting Rule'
    ];

    const rows = filteredLines.map(l => [
      l.date,
      l.orderNumber,
      l.productName,
      l.scrapItem,
      l.scrapQuantity,
      l.uom,
      l.warehouse,
      0,
      0,
      isAr ? 'قاعدة MVP: الهالك بقيمة معيارية = 0 ج.م' : 'MVP Rule: 0 EGP valuation'
    ]);

    exportToExcel(headers, rows, 'Scrap_Report_Section_33');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAr ? 'تقرير الهالك والسكراب الصناعي (Section 33)' : 'Industrial Scrap & Waste Report (Section 33)'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'سجل كميات الهالك ومستودعات التخزين مع تطبيق قاعدة MVP: الهالك بقيمة معيارية = 0 ج.م'
              : 'Record of industrial scrap and waste quantities under MVP rule: Standard Value = 0 EGP.'}
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isAr ? 'تصدير إكسيل (Excel)' : 'Export Excel'}</span>
        </button>
      </div>

      {/* Accounting Notice (Section 22 rule) */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <div className="text-purple-900">
            <span className="font-bold">
              {isAr ? 'المعالجة المحاسبية لتكلفة الهالك (Section 22 MVP Rule): ' : 'Scrap Accounting Rule (Section 22): '}
            </span>
            <span>
              {isAr
                ? 'يتم تحميل 100% من تكلفة الخامات المستهلكة على المنتج التام، ويسجل الهالك بقيمة صفرية (0 EGP).'
                : 'Finished Product absorbs 100% of material costs; Scrap is recorded at Standard Value = 0 EGP.'}
            </span>
          </div>
        </div>
        <div className="font-mono font-bold text-purple-900 shrink-0 bg-white px-3 py-1 rounded-lg border border-purple-200">
          {formatNumber(totalScrapQty, language)} {isAr ? 'كجم إجمالي الهالك' : 'KG Scrap'}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث برقم الأمر أو اسم المنتج أو بند الهالك...' : 'Search by order no, product, scrap item...'}
            className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="p-2.5">{isAr ? 'رقم أمر الإنتاج' : 'Order No'}</th>
                <th className="p-2.5">{isAr ? 'المنتج التام' : 'Product'}</th>
                <th className="p-2.5">{isAr ? 'بند الهالك' : 'Scrap Item'}</th>
                <th className="p-2.5 text-center text-purple-700">{isAr ? 'كمية الهالك' : 'Scrap Qty'}</th>
                <th className="p-2.5">{isAr ? 'مستودع الهالك' : 'Warehouse'}</th>
                <th className="p-2.5 text-slate-600">{isAr ? 'التكلفة المعيارية' : 'Std Cost'}</th>
                <th className="p-2.5 font-bold text-slate-800">{isAr ? 'قيمة الهالك الإجمالية' : 'Total Scrap Value'}</th>
                <th className="p-2.5">{isAr ? 'المعالجة المطبقة' : 'MVP Rule Applied'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLines.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-2.5 font-mono text-slate-600">{l.date}</td>
                  <td className="p-2.5 font-mono font-bold text-blue-700">{l.orderNumber}</td>
                  <td className="p-2.5 text-slate-800 font-medium">{l.productName}</td>
                  <td className="p-2.5 text-purple-900 font-semibold">{l.scrapItem}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-purple-700 bg-purple-50/40">
                    {formatNumber(l.scrapQuantity, language)} {l.uom}
                  </td>
                  <td className="p-2.5 text-slate-600">{l.warehouse}</td>
                  <td className="p-2.5 font-mono text-slate-500">0.00 ج.م</td>
                  <td className="p-2.5 font-mono font-bold text-slate-700">0.00 ج.م</td>
                  <td className="p-2.5 text-[11px] text-emerald-700 font-medium">
                    {isAr ? '✓ مستوعب بالكامل في تكلفة المنتج التام' : '✓ 100% absorbed in FG cost'}
                  </td>
                </tr>
              ))}
              {filteredLines.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {isAr ? 'لا توجد كميات هالك مسجلة' : 'No scrap records found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
