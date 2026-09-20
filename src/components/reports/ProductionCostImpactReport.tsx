import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  SendHorizontal
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber, exportToExcel } from '../../utils/formatters';

export const ProductionCostImpactReport: React.FC = () => {
  const { language, costAdjustments, productionOrders, customerDeliveries } = useApp();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');

  // Combine cost adjustments and production order costing chain
  const reportRows = costAdjustments.map(adj => {
    const po = productionOrders.find(o => o.id === adj.productionOrderId || o.orderNumber === adj.productionOrderNumber);
    const originalCost = adj.originalProductionCostEGP || (po?.actualMaterialCostEGP || 110000);
    const addedCost = adj.amountEGP;
    const revisedCost = adj.revisedProductionCostEGP || (originalCost + addedCost);
    const qtyProduced = adj.quantityProduced || (po?.actualFinishedQuantity || 900);
    const qtySold = adj.quantityIssuedOrSold || 400;
    const qtyInStock = adj.quantityInStock || (qtyProduced - qtySold);

    // Cost per unit before and after
    const originalUnitCost = qtyProduced > 0 ? originalCost / qtyProduced : 0;
    const revisedUnitCost = qtyProduced > 0 ? revisedCost / qtyProduced : 0;
    const unitDiff = revisedUnitCost - originalUnitCost;

    // Allocation to inventory vs COGS
    const inventoryAdj = adj.inventoryAdjustmentEGP || (qtyInStock * unitDiff);
    const cogsAdj = adj.cogsAdjustmentEGP || (qtySold * unitDiff);

    return {
      id: adj.id,
      adjustmentNumber: adj.adjustmentNumber,
      date: adj.date,
      productionOrderNumber: adj.productionOrderNumber,
      productName: po?.productName || (isAr ? 'أنابيب HDPE 50 مم' : 'HDPE Pipes 50mm'),
      costType: adj.costType,
      costCategory: adj.costCategory,
      originalProductionCost: originalCost,
      addedCost,
      revisedProductionCost: revisedCost,
      quantityProduced: qtyProduced,
      quantityInStock: qtyInStock,
      quantityIssuedOrSold: qtySold,
      inventoryAdjustment: inventoryAdj,
      cogsAdjustment: cogsAdj,
      remainingDiff: 0,
      user: adj.createdBy,
      approver: adj.approvedBy || (isAr ? 'مدير التكاليف' : 'Cost Manager'),
      status: adj.status
    };
  });

  const filteredRows = reportRows.filter(r => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.adjustmentNumber.toLowerCase().includes(q) ||
        r.productionOrderNumber.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.costType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalAddedCost = filteredRows.reduce((acc, r) => acc + r.addedCost, 0);
  const totalInvAdj = filteredRows.reduce((acc, r) => acc + r.inventoryAdjustment, 0);
  const totalCogsAdj = filteredRows.reduce((acc, r) => acc + r.cogsAdjustment, 0);

  const handleExport = () => {
    const headers = [
      isAr ? 'رقم تعديل التكلفة' : 'Cost Adj No',
      isAr ? 'أمر الإنتاج' : 'PO Number',
      isAr ? 'المنتج' : 'Product',
      isAr ? 'نوع التكلفة الإضافية' : 'Cost Type',
      isAr ? 'التكلفة الأصلية للأمر' : 'Original Cost',
      isAr ? 'التكلفة المضافة' : 'Added Cost',
      isAr ? 'التكلفة المعدلة الإجمالية' : 'Revised Cost',
      isAr ? 'الكمية المنتجة' : 'Qty Produced',
      isAr ? 'المتبقي بالمخزون' : 'In Stock Qty',
      isAr ? 'المباع للعملاء' : 'Sold Qty',
      isAr ? 'أثر تعديل المخزون' : 'Inventory Adj (EGP)',
      isAr ? 'أثر تكلفة المبيعات COGS' : 'COGS Adj (EGP)',
      isAr ? 'المُعد' : 'Creator',
      isAr ? 'المعتمد' : 'Approver'
    ];

    const rows = filteredRows.map(r => [
      r.adjustmentNumber,
      r.productionOrderNumber,
      r.productName,
      r.costType,
      r.originalProductionCost,
      r.addedCost,
      r.revisedProductionCost,
      r.quantityProduced,
      r.quantityInStock,
      r.quantityIssuedOrSold,
      r.inventoryAdjustment,
      r.cogsAdjustment,
      r.user,
      r.approver
    ]);

    exportToExcel(headers, rows, 'Production_Cost_Impact_Analysis_Section_44');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'تحليل أثر تكلفة أوامر الإنتاج على المخزون وتكلفة المبيعات COGS (Section 44 & 48)' : 'Production Cost Impact Analysis (Section 44)'}</span>
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'تتبع سلسلة التكاليف الصناعية والتشغيلية المضافة لاحقاً وتوزيع أثرها بين المخزون القائم وتكلفة المبيعات للبضاعة المباعة'
              : 'Trace post-production cost additions and their distribution between remaining finished inventory and Cost of Goods Sold (COGS).'}
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

      {/* Visual Chain Diagram (Section 44 architecture: PO -> Material Cost -> Addl Costs -> Revised Cost -> FG Inv -> COGS) */}
      <div className="p-3 bg-gradient-to-r from-purple-50 via-blue-50 to-emerald-50 rounded-xl border border-purple-200 text-xs">
        <div className="font-bold text-slate-800 mb-2">
          {isAr ? 'سلسلة تدفق وتتبع أثر التكلفة (Section 44 Traceability Chain):' : 'Traceability Chain:'}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-700">
          <span className="px-2.5 py-1 bg-white rounded border border-slate-200 font-mono">PO أصل أمر الإنتاج</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-180 sm:rotate-0" />
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded font-mono">تكلفة الخامات الأصلية</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-180 sm:rotate-0" />
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded font-mono">+ تكاليف إضافية (كهرباء/صيانة)</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-180 sm:rotate-0" />
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded font-mono">= إجمالي التكلفة المعدلة</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-180 sm:rotate-0" />
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-mono">أثر المخزون المتبقي</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-180 sm:rotate-0" />
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded font-mono">أثر تكلفة المبيعات (COGS المباع)</span>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
          <div className="text-[11px] text-purple-700 font-medium">{isAr ? 'إجمالي التكاليف الصناعية المضافة' : 'Total Added Costs'}</div>
          <div className="text-lg font-mono font-bold text-purple-900">{formatCurrency(totalAddedCost, language)}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
          <div className="text-[11px] text-emerald-700 font-medium">{isAr ? 'الأثر المحمل على المخزون القائم' : 'Inventory Value Impact'}</div>
          <div className="text-lg font-mono font-bold text-emerald-900">{formatCurrency(totalInvAdj, language)}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
          <div className="text-[11px] text-amber-700 font-medium">{isAr ? 'الأثر المحمل على تكلفة المبيعات COGS' : 'COGS Impact on Sold Units'}</div>
          <div className="text-lg font-mono font-bold text-amber-900">{formatCurrency(totalCogsAdj, language)}</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث برقم السند أو أمر الإنتاج والمنتج...' : 'Search by adj no, order no, product...'}
            className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">{isAr ? 'رقم التعديل' : 'Adj No'}</th>
                <th className="p-2.5">{isAr ? 'أمر الإنتاج' : 'PO No'}</th>
                <th className="p-2.5">{isAr ? 'المنتج التام' : 'Product'}</th>
                <th className="p-2.5">{isAr ? 'نوع التكلفة' : 'Cost Type'}</th>
                <th className="p-2.5 text-slate-600">{isAr ? 'التكلفة الأصلية' : 'Original Cost'}</th>
                <th className="p-2.5 text-purple-700 font-bold">{isAr ? 'التكلفة المضافة' : 'Added Cost'}</th>
                <th className="p-2.5 font-bold text-slate-900">{isAr ? 'التكلفة المعدلة' : 'Revised Cost'}</th>
                <th className="p-2.5 text-center">{isAr ? 'الإنتاج' : 'Produced'}</th>
                <th className="p-2.5 text-center text-emerald-700">{isAr ? 'المتبقي بالمخزن' : 'In Stock'}</th>
                <th className="p-2.5 text-center text-amber-700">{isAr ? 'المباع' : 'Sold'}</th>
                <th className="p-2.5 font-bold text-emerald-700">{isAr ? 'أثر المخزون' : 'Inv Adj'}</th>
                <th className="p-2.5 font-bold text-amber-700">{isAr ? 'أثر COGS' : 'COGS Adj'}</th>
                <th className="p-2.5">{isAr ? 'المعتمد' : 'Approver'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-2.5 font-mono font-bold text-purple-700 bg-purple-50/30">{r.adjustmentNumber}</td>
                  <td className="p-2.5 font-mono font-bold text-blue-700">{r.productionOrderNumber}</td>
                  <td className="p-2.5 text-slate-800 font-medium">{r.productName}</td>
                  <td className="p-2.5 text-slate-700">{r.costType}</td>
                  <td className="p-2.5 font-mono text-slate-600">{formatCurrency(r.originalProductionCost, language)}</td>
                  <td className="p-2.5 font-mono font-bold text-purple-700">{formatCurrency(r.addedCost, language)}</td>
                  <td className="p-2.5 font-mono font-bold text-slate-900">{formatCurrency(r.revisedProductionCost, language)}</td>
                  <td className="p-2.5 text-center font-mono">{formatNumber(r.quantityProduced, language)}</td>
                  <td className="p-2.5 text-center font-mono text-emerald-700 bg-emerald-50/30">
                    {formatNumber(r.quantityInStock, language)}
                  </td>
                  <td className="p-2.5 text-center font-mono text-amber-700 bg-amber-50/30">
                    {formatNumber(r.quantityIssuedOrSold, language)}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-emerald-700">{formatCurrency(r.inventoryAdjustment, language)}</td>
                  <td className="p-2.5 font-mono font-bold text-amber-700">{formatCurrency(r.cogsAdjustment, language)}</td>
                  <td className="p-2.5 text-slate-600 font-medium">{r.approver}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400">
                    {isAr ? 'لا توجد تعديلات تكاليف مسجلة حتى الآن' : 'No cost adjustment impact records found'}
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
