import React, { useState } from 'react';
import {
  Factory,
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Printer,
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber, exportToCSV } from '../../utils/formatters';
import { StatusChip } from '../common/StatusChip';
import { ProductionOrder, ProductionOrderStatus } from '../../types';

interface ProductionMonitoringReportProps {
  onSelectOrder?: (order: ProductionOrder) => void;
}

export const ProductionMonitoringReport: React.FC<ProductionMonitoringReportProps> = ({ onSelectOrder }) => {
  const { language, productionOrders } = useApp();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<ProductionOrder | null>(null);

  const filteredOrders = productionOrders.filter(o => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.bomCode.toLowerCase().includes(q) ||
        (o.machineName || '').toLowerCase().includes(q) ||
        o.createdBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const headers = [
      isAr ? 'رقم أمر الإنتاج' : 'Order No',
      isAr ? 'التاريخ' : 'Date',
      isAr ? 'المنتج التام' : 'Product',
      isAr ? 'الكمية المخططة' : 'Planned Qty',
      isAr ? 'المنجز الفعلي' : 'Actual Produced',
      isAr ? 'كمية الهالك' : 'Scrap Qty',
      isAr ? 'قائمة المواد (BOM)' : 'BOM Code',
      isAr ? 'الماكينة / الخط' : 'Machine',
      isAr ? 'المرحلة الإنتاجية' : 'Stage',
      isAr ? 'تكلفة الخامات الفعلية' : 'Actual Material Cost',
      isAr ? 'حالة الأمر' : 'Status',
      isAr ? 'حالة الجودة' : 'Quality Status',
      isAr ? 'المُنشئ' : 'Created By',
      isAr ? 'المُعتمد' : 'Approved By'
    ];

    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.productionDate,
      o.productName,
      o.plannedQuantity,
      o.actualFinishedQuantity || 0,
      o.actualScrapQuantity || 0,
      o.bomCode,
      o.machineName || '-',
      o.productionStage,
      o.actualMaterialCostEGP || 0,
      o.status,
      o.qualityStatus,
      o.createdBy,
      o.approvedBy || '-'
    ]);

    exportToCSV(headers, rows, 'Production_Order_Monitoring');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAr ? 'تقرير متابعة أوامر الإنتاج والتصنيع (Section 31)' : 'Production Order Monitoring Report (Section 31)'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'متابعة شاملة لتقدم التشغيل، خطة الإنتاج مقابل الفعلي، ونسب الهالك وتكلفة الخامات المستوعبة'
              : 'End-to-end monitoring of production progress, planned vs actual output, scrap quantity, and absorbed material costs.'}
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          title={isAr ? 'تصدير أوامر الإنتاج إلى ملف CSV' : 'Export Production Orders to CSV'}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث برقم الأمر، المنتج، الماكينة، المستخدم...' : 'Search order no, product, machine, creator...'}
            className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">{isAr ? 'حالة الأمر:' : 'Status:'}</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
          >
            <option value="ALL">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value={ProductionOrderStatus.DRAFT}>{isAr ? 'مسودة (Draft)' : 'Draft'}</option>
            <option value={ProductionOrderStatus.APPROVED}>{isAr ? 'معتمد (Approved)' : 'Approved'}</option>
            <option value={ProductionOrderStatus.MATERIAL_ISSUED}>{isAr ? 'تم صرف الخامات (In Prod)' : 'Material Issued'}</option>
            <option value={ProductionOrderStatus.PENDING_QUALITY}>{isAr ? 'بانتظار الجودة (Pending Quality)' : 'Pending Quality'}</option>
            <option value={ProductionOrderStatus.COMPLETED}>{isAr ? 'مكتمل (Completed)' : 'Completed'}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">{isAr ? 'رقم الأمر' : 'Order No'}</th>
                <th className="p-2.5">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="p-2.5">{isAr ? 'المنتج التام' : 'Product'}</th>
                <th className="p-2.5 text-center">{isAr ? 'المخطط' : 'Planned'}</th>
                <th className="p-2.5 text-center text-emerald-700">{isAr ? 'المنجز الفعلي' : 'Actual Produced'}</th>
                <th className="p-2.5 text-center text-purple-700">{isAr ? 'الهالك' : 'Scrap'}</th>
                <th className="p-2.5">{isAr ? 'BOM / الماكينة' : 'BOM / Machine'}</th>
                <th className="p-2.5">{isAr ? 'تكلفة الخامات' : 'Material Cost'}</th>
                <th className="p-2.5 text-center">{isAr ? 'حالة الأمر' : 'Status'}</th>
                <th className="p-2.5 text-center">{isAr ? 'الجودة' : 'Quality'}</th>
                <th className="p-2.5">{isAr ? 'المُنشئ / المعتمد' : 'Creator / Approver'}</th>
                <th className="p-2.5 text-center">{isAr ? 'تفاصيل' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {o.orderNumber}
                      </span>
                      {o.version && o.version > 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                          v{o.version}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2.5 font-mono text-slate-600">{o.productionDate}</td>
                  <td className="p-2.5">
                    <div className="font-semibold text-slate-900">{o.productName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{o.productCode}</div>
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                    {formatNumber(o.plannedQuantity, language)} {o.uom}
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                    {formatNumber(o.actualFinishedQuantity || 0, language)} {o.uom}
                  </td>
                  <td className="p-2.5 text-center font-mono text-purple-700 font-semibold">
                    {formatNumber(o.actualScrapQuantity || 0, language)} {o.uom}
                  </td>
                  <td className="p-2.5">
                    <div className="text-slate-700 font-medium">{o.bomCode}</div>
                    <div className="text-[11px] text-slate-500">{o.machineName || o.productionStage}</div>
                  </td>
                  <td className="p-2.5 font-mono font-bold text-slate-900">
                    {o.actualMaterialCostEGP > 0 ? formatCurrency(o.actualMaterialCostEGP, language) : '-'}
                  </td>
                  <td className="p-2.5 text-center">
                    <StatusChip status={o.status} size="sm" />
                  </td>
                  <td className="p-2.5 text-center">
                    <StatusChip status={o.qualityStatus} size="sm" />
                  </td>
                  <td className="p-2.5 text-xs text-slate-600">
                    <div>{o.createdBy}</div>
                    {o.approvedBy && <div className="text-[10px] text-emerald-600 font-medium">✓ {o.approvedBy}</div>}
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => setSelectedOrderDetail(o)}
                      className="p-1 rounded text-blue-600 hover:bg-blue-50 transition"
                      title={isAr ? 'عرض التفاصيل والتدقيق' : 'View order details'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    {isAr ? 'لا توجد أوامر إنتاج مطابقة لمعايير البحث' : 'No production orders match the search criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-Down Detail Modal (Section 31: Allow drill-down to the complete Production Order) */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {selectedOrderDetail.orderNumber}
                </span>
                <StatusChip status={selectedOrderDetail.status} size="sm" />
                <StatusChip status={selectedOrderDetail.qualityStatus} size="sm" />
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[11px]">{isAr ? 'المنتج' : 'Product'}</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedOrderDetail.productName}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[11px]">{isAr ? 'الكمية المخططة' : 'Planned'}</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {formatNumber(selectedOrderDetail.plannedQuantity, language)} {selectedOrderDetail.uom}
                  </div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <div className="text-emerald-700 text-[11px]">{isAr ? 'المنجز الفعلي' : 'Produced'}</div>
                  <div className="font-mono font-bold text-emerald-900 mt-0.5">
                    {formatNumber(selectedOrderDetail.actualFinishedQuantity || 0, language)} {selectedOrderDetail.uom}
                  </div>
                </div>
                <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                  <div className="text-purple-700 text-[11px]">{isAr ? 'الهالك (قيمة 0 ج.م)' : 'Scrap (0 EGP)'}</div>
                  <div className="font-mono font-bold text-purple-900 mt-0.5">
                    {formatNumber(selectedOrderDetail.actualScrapQuantity || 0, language)} {selectedOrderDetail.uom}
                  </div>
                </div>
              </div>

              {/* Material Lines Breakdown */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 font-bold text-slate-800 border-b border-slate-200">
                  {isAr ? 'مكونات الخامات المنصرفة للأمر (BOM Materials Consumed)' : 'BOM Materials Consumed'}
                </div>
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2">{isAr ? 'الخامة' : 'Material'}</th>
                      <th className="p-2 text-center">{isAr ? 'المخطط' : 'Planned'}</th>
                      <th className="p-2 text-center">{isAr ? 'المنصرف الفعلي' : 'Actual Issued'}</th>
                      <th className="p-2 text-center">{isAr ? 'الفارق' : 'Variance'}</th>
                      <th className="p-2">{isAr ? 'متوسط التكلفة' : 'MAC'}</th>
                      <th className="p-2 font-bold text-emerald-800">{isAr ? 'التكلفة الإجمالية' : 'Actual Cost'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrderDetail.materials.map(m => {
                      const variance = (m.actualIssuedQty || 0) - m.plannedQty;
                      return (
                        <tr key={m.id}>
                          <td className="p-2 font-medium text-slate-800">
                            {m.rawMaterialName} <span className="font-mono text-slate-400 text-[11px]">({m.rawMaterialCode})</span>
                          </td>
                          <td className="p-2 text-center font-mono">{formatNumber(m.plannedQty, language)} {m.uom}</td>
                          <td className="p-2 text-center font-mono font-bold text-blue-700">
                            {formatNumber(m.actualIssuedQty, language)} {m.uom}
                          </td>
                          <td className={`p-2 text-center font-mono font-bold ${variance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {variance > 0 ? `+${formatNumber(variance, language)}` : formatNumber(variance, language)}
                          </td>
                          <td className="p-2 font-mono text-slate-700">{formatCurrency(m.movingAverageCostEGP, language)}</td>
                          <td className="p-2 font-mono font-bold text-emerald-700">{formatCurrency(m.actualCostEGP, language)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MVP Cost Allocation Bridge (Section 22 & 42) */}
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'توزيع التكلفة وقاعدة MVP (Section 22)' : 'MVP Cost Allocation'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">{isAr ? 'تكلفة الخامات الفعلية:' : 'Material Cost:'} </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(selectedOrderDetail.actualMaterialCostEGP || 0, language)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{isAr ? 'نصيب المنتج التام (100%):' : 'FG Share (100%):'} </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(selectedOrderDetail.actualMaterialCostEGP || 0, language)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{isAr ? 'تكلفة وحدة المنتج:' : 'Unit FG Cost:'} </span>
                    <span className="font-mono font-bold text-emerald-800">
                      {formatCurrency(selectedOrderDetail.finishedGoodsUnitCostEGP || 0, language)} / {selectedOrderDetail.uom}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{isAr ? 'قيمة الهالك المعيارية:' : 'Scrap Value:'} </span>
                    <span className="font-mono font-bold text-purple-700">0.00 ج.م (قيمة صفرية)</span>
                  </div>
                </div>
              </div>

              {/* Modifications history (Section 18) */}
              {selectedOrderDetail.modifications && selectedOrderDetail.modifications.length > 0 && (
                <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-3 space-y-2">
                  <div className="font-bold text-purple-900 text-xs">
                    {isAr ? 'سجل النسخ والتعديلات المعتمدة (Version History - Section 18)' : 'Version History (Section 18)'}
                  </div>
                  <div className="space-y-1.5">
                    {selectedOrderDetail.modifications.map((mod, i) => (
                      <div key={i} className="text-[11px] bg-white p-2 rounded border border-purple-100 flex items-center justify-between">
                        <div>
                          <span className="font-bold font-mono text-purple-700">v{mod.version}</span>
                          <span className="mx-2 text-slate-400">|</span>
                          <span className="text-slate-700">{mod.reason}</span>
                        </div>
                        <div className="text-slate-400 font-mono text-[10px]">
                          {mod.date} بواسطة {mod.modifiedBy}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
