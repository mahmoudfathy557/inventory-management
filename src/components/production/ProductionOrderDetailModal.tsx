import React from 'react';
import {
  X,
  Factory,
  Layers,
  Sparkles,
  ShieldCheck,
  Printer,
  Clock,
  CheckCircle,
  GitCommit,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionOrder, ProductionOrderStatus } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { StatusChip } from '../common/StatusChip';

interface ProductionOrderDetailModalProps {
  isOpen: boolean;
  order: ProductionOrder | null;
  onClose: () => void;
  onPrint?: (order: ProductionOrder) => void;
  onOpenModify?: (order: ProductionOrder) => void;
}

export const ProductionOrderDetailModal: React.FC<ProductionOrderDetailModalProps> = ({
  isOpen,
  order,
  onClose,
  onPrint,
  onOpenModify
}) => {
  const { language } = useApp();
  const isAr = language === 'ar';

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-slate-200 flex flex-col space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-blue-700">{order.orderNumber}</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  v{order.version || 1}
                </span>
                <StatusChip status={order.status} size="sm" />
                <StatusChip status={order.qualityStatus} size="sm" />
              </div>
              <h3 className="text-xs font-semibold text-slate-800 mt-0.5">
                {order.productName} <span className="font-mono text-slate-400 font-normal">({order.productCode})</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPrint && (
              <button
                onClick={() => onPrint(order)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة بطاقة التشغيل' : 'Print Order'}</span>
              </button>
            )}
            {onOpenModify && (order.status === ProductionOrderStatus.DRAFT || order.status === ProductionOrderStatus.APPROVED) && (
              <button
                onClick={() => {
                  onClose();
                  onOpenModify(order);
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>{isAr ? 'طلب تعديل (نسخة جديدة)' : 'Modify (New Version)'}</span>
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-slate-500 text-[11px]">{isAr ? 'تاريخ الأمر' : 'Production Date'}</div>
            <div className="font-mono font-bold text-slate-900 mt-0.5">{order.productionDate}</div>
            <div className="text-[10px] text-slate-400 mt-1">{order.createdBy}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-slate-500 text-[11px]">{isAr ? 'الكمية المخططة' : 'Planned Quantity'}</div>
            <div className="font-mono font-bold text-slate-900 mt-0.5">
              {formatNumber(order.plannedQuantity, language)} {order.uom}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">BOM: {order.bomCode} (v{order.bomVersion})</div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <div className="text-emerald-700 text-[11px] font-medium">{isAr ? 'المنجز الفعلي' : 'Actual Finished'}</div>
            <div className="font-mono font-bold text-emerald-900 mt-0.5">
              {formatNumber(order.actualFinishedQuantity || 0, language)} {order.uom}
            </div>
            <div className="text-[10px] text-emerald-600 mt-1">
              {order.finishedGoodsUnitCostEGP > 0
                ? `${formatCurrency(order.finishedGoodsUnitCostEGP, language)} / ${order.uom}`
                : isAr ? 'بانتظار الاستلام' : 'Pending'}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
            <div className="text-purple-700 text-[11px] font-medium">{isAr ? 'الهالك الصناعي (Scrap)' : 'Industrial Scrap'}</div>
            <div className="font-mono font-bold text-purple-900 mt-0.5">
              {formatNumber(order.actualScrapQuantity || 0, language)} {order.uom}
            </div>
            <div className="text-[10px] text-purple-700 font-medium mt-1">
              {isAr ? 'قيمة معيارية: 0.00 ج.م' : 'Standard Val: 0 EGP'}
            </div>
          </div>
        </div>

        {/* Machine & Production Stage */}
        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">{isAr ? 'الماكينة / الخط:' : 'Machine:'} </span>
              <span className="font-semibold text-slate-800">{order.machineName || (isAr ? 'خط البثق الرئيسي' : 'Main Extruder')}</span>
            </div>
            <div>
              <span className="text-slate-500">{isAr ? 'مرحلة الإنتاج:' : 'Stage:'} </span>
              <span className="font-semibold text-slate-800">{order.productionStage}</span>
            </div>
          </div>
          {order.approvedBy && (
            <div className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isAr ? `معتمد بواسطة: ${order.approvedBy}` : `Approved by: ${order.approvedBy}`}</span>
            </div>
          )}
        </div>

        {/* Required Materials vs Issued Table (Section 17) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-50 px-3 py-2 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
            <span>{isAr ? 'الخامات المطلوبة والمصروفة فعلياً (Material Consumption Tracking)' : 'Material Consumption Tracking'}</span>
            <span className="text-[11px] text-slate-500 font-normal">{order.materials?.length || 0} {isAr ? 'خامات' : 'items'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">{isAr ? 'الخامة' : 'Raw Material'}</th>
                  <th className="p-2.5 text-center">{isAr ? 'الكمية المطلوبة' : 'Required Qty'}</th>
                  <th className="p-2.5 text-center text-blue-700">{isAr ? 'المنصرف الفعلي' : 'Actual Issued'}</th>
                  <th className="p-2.5 text-center">{isAr ? 'الفارق (Variance)' : 'Variance'}</th>
                  <th className="p-2.5 text-center">{isAr ? 'المتبقي' : 'Remaining'}</th>
                  <th className="p-2.5">{isAr ? 'متوسط التكلفة' : 'MAC'}</th>
                  <th className="p-2.5 font-bold text-slate-800">{isAr ? 'التكلفة الفعلية' : 'Actual Cost'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(order.materials || []).map(m => {
                  const variance = (m.actualIssuedQty || 0) - m.plannedQty;
                  const remaining = Math.max(0, m.plannedQty - (m.actualIssuedQty || 0));
                  return (
                    <tr key={m.id}>
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-900">{m.rawMaterialName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.rawMaterialCode}</div>
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-700">
                        {formatNumber(m.plannedQty, language)} {m.uom}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-blue-700">
                        {formatNumber(m.actualIssuedQty, language)} {m.uom}
                      </td>
                      <td className={`p-2.5 text-center font-mono font-bold ${variance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {variance > 0 ? `+${formatNumber(variance, language)}` : formatNumber(variance, language)}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-600">
                        {formatNumber(remaining, language)} {m.uom}
                      </td>
                      <td className="p-2.5 font-mono text-slate-700">
                        {formatCurrency(m.movingAverageCostEGP, language)}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">
                        {formatCurrency(m.actualCostEGP, language)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Bridge (Section 42: Material Cost + Additional Manufacturing Costs = Total Cost) */}
        <div className="bg-gradient-to-r from-blue-50/60 to-purple-50/60 p-4 rounded-xl border border-blue-200 text-xs space-y-3">
          <div className="font-bold text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'جسر التكلفة الصناعية (Section 42 Production Cost Bridge):' : 'Production Cost Bridge (Section 42):'}</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-800">
              {isAr ? 'قاعدة MVP: استيعاب 100% للمنتج التام' : '100% absorbed into FG'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <div className="text-slate-500 text-[11px]">{isAr ? 'تكلفة الخامات الفعلية' : 'Actual Material Cost'}</div>
              <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                {formatCurrency(order.actualMaterialCostEGP || 0, language)}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">{isAr ? 'تكاليف صناعية وتشغيلية إضافية' : 'Additional Mfg Costs'}</div>
              <div className="text-sm font-mono font-bold text-purple-700 mt-0.5">
                +{formatCurrency(order.additionalCostEGP || 0, language)}
              </div>
            </div>
            <div className="sm:border-r sm:pr-3 border-slate-100">
              <div className="text-slate-500 text-[11px]">{isAr ? 'إجمالي تكلفة أمر الإنتاج' : 'Total Production Cost'}</div>
              <div className="text-sm font-mono font-bold text-blue-900 mt-0.5">
                ={formatCurrency(order.totalProductionCostEGP || order.actualMaterialCostEGP || 0, language)}
              </div>
            </div>
            <div>
              <div className="text-emerald-700 text-[11px] font-semibold">{isAr ? 'تكلفة وحدة المنتج التام' : 'FG Unit Cost'}</div>
              <div className="text-sm font-mono font-bold text-emerald-800 mt-0.5">
                {order.finishedGoodsUnitCostEGP > 0
                  ? `${formatCurrency(order.finishedGoodsUnitCostEGP, language)} / ${order.uom}`
                  : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Version History (Section 18) */}
        {order.modifications && order.modifications.length > 0 && (
          <div className="border border-purple-200 bg-purple-50/30 p-3.5 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-purple-900 flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'سجل النسخ والتعديلات المعتمدة (Section 18 Version History):' : 'Version History:'}</span>
            </div>
            <div className="space-y-1.5">
              {order.modifications.map((mod, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      v{mod.version}
                    </span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-800 font-medium">{mod.reason}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-500 text-[11px]">{mod.changesSummary}</span>
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    {mod.date} ({mod.modifiedBy})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
