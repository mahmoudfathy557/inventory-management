import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  DollarSign,
  TrendingUp,
  Boxes,
  FileCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber, exportToExcel } from '../../utils/formatters';

export const LandedCostReport: React.FC = () => {
  const { language, landedCosts, receipts } = useApp();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');

  // Map landed costs with original receipt valuation details
  const reportRows = landedCosts.map(lc => {
    const originalReceipt = receipts.find(r => r.id === lc.originalReceiptId || r.receiptNumber === lc.originalReceiptNumber);
    const originalVal = originalReceipt ? originalReceipt.totalValueEGP : (lc.amountEGP * 10);
    const adjustedVal = originalVal + lc.amountEGP;

    return {
      id: lc.id,
      landedCostNumber: lc.landedCostNumber,
      date: lc.date,
      originalReceiptNumber: lc.originalReceiptNumber,
      itemId: lc.itemId,
      itemName: lc.itemName,
      costType: lc.costType,
      originalInventoryValueEGP: originalVal,
      landedCostAmountEGP: lc.amountEGP,
      adjustedInventoryValueEGP: adjustedVal,
      allocationMethod: lc.allocationMethod,
      currency: lc.currency,
      exchangeRate: lc.exchangeRate,
      amountOriginalCurr: lc.amount,
      user: lc.createdBy,
      status: lc.status
    };
  });

  const filteredRows = reportRows.filter(r => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.landedCostNumber.toLowerCase().includes(q) ||
        r.originalReceiptNumber.toLowerCase().includes(q) ||
        r.itemName.toLowerCase().includes(q) ||
        r.costType.toLowerCase().includes(q) ||
        r.user.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalLandedCostEGP = filteredRows.reduce((acc, r) => acc + r.landedCostAmountEGP, 0);

  const handleExport = () => {
    const headers = [
      isAr ? 'رقم تكلفة الإنزال' : 'Landed Cost No',
      isAr ? 'التاريخ' : 'Date',
      isAr ? 'رقم إذن الاستلام الأصلي' : 'Original Receipt',
      isAr ? 'الصنف المستفيد' : 'Item',
      isAr ? 'نوع التكلفة' : 'Cost Type',
      isAr ? 'القيمة الأصلية للمخزون' : 'Original Value (EGP)',
      isAr ? 'تكلفة الإنزال المحملة' : 'Landed Cost (EGP)',
      isAr ? 'القيمة المعدلة للمخزون' : 'Adjusted Value (EGP)',
      isAr ? 'طريقة التوزيع' : 'Allocation Method',
      isAr ? 'المستخدم المُحرر' : 'User'
    ];

    const rows = filteredRows.map(r => [
      r.landedCostNumber,
      r.date,
      r.originalReceiptNumber,
      r.itemName,
      r.costType,
      r.originalInventoryValueEGP,
      r.landedCostAmountEGP,
      r.adjustedInventoryValueEGP,
      r.allocationMethod,
      r.user
    ]);

    exportToExcel(headers, rows, 'Landed_Cost_Report_Section_34');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAr ? 'تقرير تكاليف الإنزال والمصروفات الملحقة (Section 34)' : 'Landed Cost Report (Section 34)'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'تتبع إضافة تكاليف الشحن والجمارك والموانئ إلى قيمة المخزون دون زيادة الكميات الفيزيائية وإعادة حساب MAC'
              : 'Track freight, customs, and port charges added to inventory valuation without increasing physical quantity.'}
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

      {/* KPI Highlight */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="text-[11px] text-slate-500 font-medium">{isAr ? 'عدد المستندات' : 'Documents Count'}</div>
          <div className="text-lg font-mono font-bold text-slate-800">{filteredRows.length}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl col-span-2">
          <div className="text-[11px] text-purple-700 font-medium">{isAr ? 'إجمالي تكاليف الإنزال الموزعة' : 'Total Landed Costs'}</div>
          <div className="text-lg font-mono font-bold text-purple-900">{formatCurrency(totalLandedCostEGP, language)}</div>
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
            placeholder={isAr ? 'بحث برقم التكلفة، رقم إذن الاستلام، الصنف، النوع...' : 'Search landed cost no, receipt no, item...'}
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
                <th className="p-2.5">{isAr ? 'رقم تكلفة الإنزال' : 'Landed Cost No'}</th>
                <th className="p-2.5">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="p-2.5">{isAr ? 'إذن الاستلام الأصلي' : 'Original Receipt'}</th>
                <th className="p-2.5">{isAr ? 'الصنف المستفيد' : 'Item'}</th>
                <th className="p-2.5">{isAr ? 'نوع التكلفة' : 'Cost Type'}</th>
                <th className="p-2.5 text-slate-600">{isAr ? 'القيمة الأصلية' : 'Original Value'}</th>
                <th className="p-2.5 text-purple-700 font-bold">{isAr ? 'تكلفة الإنزال' : 'Landed Cost'}</th>
                <th className="p-2.5 font-bold text-emerald-800">{isAr ? 'القيمة المعدلة' : 'Adjusted Value'}</th>
                <th className="p-2.5">{isAr ? 'طريقة التوزيع' : 'Allocation'}</th>
                <th className="p-2.5">{isAr ? 'المستخدم' : 'User'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-2.5 font-mono font-bold text-purple-700 bg-purple-50/30">
                    {r.landedCostNumber}
                  </td>
                  <td className="p-2.5 font-mono text-slate-600">{r.date}</td>
                  <td className="p-2.5 font-mono font-semibold text-blue-600">{r.originalReceiptNumber}</td>
                  <td className="p-2.5 font-medium text-slate-800">{r.itemName}</td>
                  <td className="p-2.5 text-slate-700">{r.costType}</td>
                  <td className="p-2.5 font-mono text-slate-600">{formatCurrency(r.originalInventoryValueEGP, language)}</td>
                  <td className="p-2.5 font-mono font-bold text-purple-700">{formatCurrency(r.landedCostAmountEGP, language)}</td>
                  <td className="p-2.5 font-mono font-bold text-emerald-700">{formatCurrency(r.adjustedInventoryValueEGP, language)}</td>
                  <td className="p-2.5 text-[11px] text-slate-500 font-mono">{r.allocationMethod}</td>
                  <td className="p-2.5 text-slate-600">{r.user}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    {isAr ? 'لا توجد تكاليف إنزال مسجلة' : 'No landed costs found'}
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
