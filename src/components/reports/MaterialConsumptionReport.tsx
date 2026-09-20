import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Layers,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber, exportToCSV } from '../../utils/formatters';

export const MaterialConsumptionReport: React.FC = () => {
  const { language, productionOrders } = useApp();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');

  // Flatten consumption lines across production orders
  const consumptionLines = productionOrders.flatMap(po => {
    return (po.materials || []).map(mat => {
      const plannedCost = mat.plannedQty * (mat.movingAverageCostEGP || 110);
      const actualCost = mat.actualCostEGP || (mat.actualIssuedQty * (mat.movingAverageCostEGP || 110));
      const varianceQty = mat.actualIssuedQty - mat.plannedQty;
      const varianceVal = actualCost - plannedCost;

      return {
        orderId: po.id,
        orderNumber: po.orderNumber,
        productionDate: po.productionDate,
        productName: po.productName,
        productCode: po.productCode,
        finishedQty: po.actualFinishedQuantity || 0,
        scrapQty: po.actualScrapQuantity || 0,
        uom: po.uom,
        materialId: mat.rawMaterialId,
        materialCode: mat.rawMaterialCode,
        materialName: mat.rawMaterialName,
        matUom: mat.uom,
        plannedQty: mat.plannedQty,
        actualQty: mat.actualIssuedQty,
        varianceQty,
        macCost: mat.movingAverageCostEGP || 110,
        plannedCost,
        actualCost,
        varianceVal
      };
    });
  });

  const filteredLines = consumptionLines.filter(line => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        line.orderNumber.toLowerCase().includes(q) ||
        line.productName.toLowerCase().includes(q) ||
        line.materialName.toLowerCase().includes(q) ||
        line.materialCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalActualCost = filteredLines.reduce((acc, l) => acc + l.actualCost, 0);
  const totalVarianceVal = filteredLines.reduce((acc, l) => acc + l.varianceVal, 0);

  const handleExport = () => {
    const headers = [
      isAr ? 'رقم أمر الإنتاج' : 'Order No',
      isAr ? 'التاريخ' : 'Date',
      isAr ? 'المنتج التام' : 'Finished Product',
      isAr ? 'الخامة المستهلكة' : 'Raw Material',
      isAr ? 'كود الخامة' : 'Material Code',
      isAr ? 'الوحدة' : 'UOM',
      isAr ? 'الكمية المخططة' : 'Planned Qty',
      isAr ? 'الكمية الفعلية' : 'Actual Qty',
      isAr ? 'فارق الكمية' : 'Variance Qty',
      isAr ? 'متوسط التكلفة' : 'MAC (EGP)',
      isAr ? 'التكلفة المخططة' : 'Planned Cost',
      isAr ? 'التكلفة الفعلية' : 'Actual Cost',
      isAr ? 'فارق التكلفة' : 'Variance Value',
      isAr ? 'الكمية المنتجة' : 'Finished Qty',
      isAr ? 'كمية الهالك' : 'Scrap Qty'
    ];

    const rows = filteredLines.map(l => [
      l.orderNumber,
      l.productionDate,
      l.productName,
      l.materialName,
      l.materialCode,
      l.matUom,
      l.plannedQty,
      l.actualQty,
      l.varianceQty,
      l.macCost,
      l.plannedCost,
      l.actualCost,
      l.varianceVal,
      l.finishedQty,
      l.scrapQty
    ]);

    exportToCSV(headers, rows, 'Raw_Material_Consumption_Report');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAr ? 'تقرير استهلاك المواد الخام وفروقات التصنيع (Section 32)' : 'Raw Material Consumption Report (Section 32)'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'مقارنة استهلاك الخامات المخطط بالفعل مع التكلفة وفروقات الاستهلاك لكل أمر تشغيل'
              : 'Compare planned vs actual raw material consumption, MAC costing, and variances per production order.'}
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          title={isAr ? 'تصدير استهلاك الخامات إلى ملف CSV' : 'Export Material Consumption to CSV'}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="text-[11px] text-slate-500 font-medium">{isAr ? 'إجمالي خطوط الصرف' : 'Total Lines'}</div>
          <div className="text-lg font-mono font-bold text-slate-800">{filteredLines.length}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
          <div className="text-[11px] text-blue-700 font-medium">{isAr ? 'إجمالي التكلفة الفعلية للخامات' : 'Actual Material Cost'}</div>
          <div className="text-lg font-mono font-bold text-blue-900">{formatCurrency(totalActualCost, language)}</div>
        </div>
        <div className={`p-3 rounded-xl border ${totalVarianceVal > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className={`text-[11px] font-medium ${totalVarianceVal > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {isAr ? 'صافي فروقات التكلفة' : 'Net Variance Value'}
          </div>
          <div className={`text-lg font-mono font-bold ${totalVarianceVal > 0 ? 'text-rose-900' : 'text-emerald-900'}`}>
            {totalVarianceVal > 0 ? `+${formatCurrency(totalVarianceVal, language)}` : formatCurrency(totalVarianceVal, language)}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث برقم الأمر أو اسم الخامة والمنتج...' : 'Search by order no, material, product...'}
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
                <th className="p-2.5">{isAr ? 'رقم الأمر' : 'Order No'}</th>
                <th className="p-2.5">{isAr ? 'المنتج' : 'Product'}</th>
                <th className="p-2.5">{isAr ? 'الخامة' : 'Raw Material'}</th>
                <th className="p-2.5 text-center">{isAr ? 'مخطط' : 'Planned'}</th>
                <th className="p-2.5 text-center text-blue-700">{isAr ? 'فعلي' : 'Actual'}</th>
                <th className="p-2.5 text-center">{isAr ? 'فارق الكمية' : 'Variance Qty'}</th>
                <th className="p-2.5">{isAr ? 'متوسط التكلفة' : 'MAC (EGP)'}</th>
                <th className="p-2.5 font-bold text-slate-800">{isAr ? 'التكلفة الفعلية' : 'Actual Cost'}</th>
                <th className="p-2.5">{isAr ? 'فارق القيمة' : 'Variance Val'}</th>
                <th className="p-2.5 text-center text-emerald-700">{isAr ? 'المنتج التام' : 'Produced FG'}</th>
                <th className="p-2.5 text-center text-purple-700">{isAr ? 'الهالك' : 'Scrap'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLines.map((l, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-2.5 font-mono font-bold text-blue-700">{l.orderNumber}</td>
                  <td className="p-2.5 text-slate-800 font-medium">{l.productName}</td>
                  <td className="p-2.5">
                    <div className="font-semibold text-slate-900">{l.materialName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{l.materialCode}</div>
                  </td>
                  <td className="p-2.5 text-center font-mono text-slate-600">
                    {formatNumber(l.plannedQty, language)} {l.matUom}
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-blue-700">
                    {formatNumber(l.actualQty, language)} {l.matUom}
                  </td>
                  <td className={`p-2.5 text-center font-mono font-bold ${l.varianceQty > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {l.varianceQty > 0 ? `+${formatNumber(l.varianceQty, language)}` : formatNumber(l.varianceQty, language)}
                  </td>
                  <td className="p-2.5 font-mono text-slate-700">{formatCurrency(l.macCost, language)}</td>
                  <td className="p-2.5 font-mono font-bold text-slate-900">{formatCurrency(l.actualCost, language)}</td>
                  <td className={`p-2.5 font-mono font-bold ${l.varianceVal > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {l.varianceVal > 0 ? `+${formatCurrency(l.varianceVal, language)}` : formatCurrency(l.varianceVal, language)}
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                    {formatNumber(l.finishedQty, language)} {l.uom}
                  </td>
                  <td className="p-2.5 text-center font-mono text-purple-700">
                    {formatNumber(l.scrapQty, language)} {l.uom}
                  </td>
                </tr>
              ))}
              {filteredLines.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    {isAr ? 'لا توجد بيانات استهلاك مطابقة للبحث' : 'No consumption data found'}
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
