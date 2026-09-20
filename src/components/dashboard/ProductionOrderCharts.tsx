import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line
} from 'recharts';
import { Factory, Clock, AlertCircle, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { ProductionOrderStatus } from '../../types';

interface ProductionOrderChartsProps {
  onNavigate?: (tab: string) => void;
}

export const ProductionOrderCharts: React.FC<ProductionOrderChartsProps> = ({ onNavigate }) => {
  const { language, productionOrders } = useApp();
  const isAr = language === 'ar';

  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  // Filter pending / active orders
  const pendingOrders = productionOrders.filter(o => {
    if (statusFilter === 'ACTIVE') {
      return o.status !== ProductionOrderStatus.COMPLETED &&
             o.status !== ProductionOrderStatus.CLOSED &&
             o.status !== ProductionOrderStatus.CANCELLED;
    }
    if (statusFilter === 'QUALITY') {
      return o.status === ProductionOrderStatus.PENDING_QUALITY || o.qualityStatus === 'PENDING';
    }
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  // Data for Pending Production Orders Progress (Planned vs Finished vs Scrap)
  const ordersChartData = pendingOrders.slice(0, 8).map(o => {
    const planned = o.plannedQuantity || 0;
    const actual = o.actualFinishedQuantity || 0;
    const scrap = o.actualScrapQuantity || 0;
    const progressPercent = planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : 0;

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      productName: o.productName,
      status: o.status,
      plannedQuantity: planned,
      actualFinishedQuantity: actual,
      scrapQuantity: scrap,
      progressPercent,
      uom: o.uom,
      materialCost: o.actualMaterialCostEGP || 0,
      stage: o.productionStage,
      machine: o.machineName || '-'
    };
  });

  // Calculate status distribution for Pie Chart
  const statusCounts: Record<string, { count: number; plannedKg: number; labelAr: string; labelEn: string; color: string }> = {
    [ProductionOrderStatus.PENDING_APPROVAL]: {
      count: 0,
      plannedKg: 0,
      labelAr: 'بانتظار الاعتماد',
      labelEn: 'Pending Approval',
      color: '#f59e0b' // Amber-500
    },
    [ProductionOrderStatus.APPROVED]: {
      count: 0,
      plannedKg: 0,
      labelAr: 'معتمد وجاهز للإطلاق',
      labelEn: 'Approved / Ready',
      color: '#3b82f6' // Blue-500
    },
    [ProductionOrderStatus.IN_PRODUCTION]: {
      count: 0,
      plannedKg: 0,
      labelAr: 'قيد التشغيل والتصنيع',
      labelEn: 'In Production (WIP)',
      color: '#8b5cf6' // Purple-500
    },
    [ProductionOrderStatus.PENDING_QUALITY]: {
      count: 0,
      plannedKg: 0,
      labelAr: 'بانتظار فحص الجودة',
      labelEn: 'Pending QA Inspection',
      color: '#ec4899' // Pink-500
    },
    [ProductionOrderStatus.COMPLETED]: {
      count: 0,
      plannedKg: 0,
      labelAr: 'مكتمل ومفرّج للمخزن',
      labelEn: 'Completed',
      color: '#10b981' // Emerald-500
    }
  };

  productionOrders.forEach(o => {
    let key = o.status as string;
    if (o.status === ProductionOrderStatus.RELEASED || o.status === ProductionOrderStatus.MATERIAL_ISSUED) {
      key = ProductionOrderStatus.IN_PRODUCTION;
    }
    if (o.status === ProductionOrderStatus.DRAFT) {
      key = ProductionOrderStatus.PENDING_APPROVAL;
    }

    if (statusCounts[key]) {
      statusCounts[key].count += 1;
      statusCounts[key].plannedKg += o.plannedQuantity;
    }
  });

  const pipelinePieData = Object.keys(statusCounts)
    .filter(k => statusCounts[k].count > 0)
    .map(k => ({
      name: isAr ? statusCounts[k].labelAr : statusCounts[k].labelEn,
      value: statusCounts[k].count,
      kg: statusCounts[k].plannedKg,
      color: statusCounts[k].color,
      statusKey: k
    }));

  const totalOpenOrders = pendingOrders.length;
  const totalPlannedInPipeline = pendingOrders.reduce((sum, o) => sum + o.plannedQuantity, 0);
  const totalProducedInPipeline = pendingOrders.reduce((sum, o) => sum + o.actualFinishedQuantity, 0);
  const totalScrapInPipeline = pendingOrders.reduce((sum, o) => sum + o.actualScrapQuantity, 0);
  const overallCompletion = totalPlannedInPipeline > 0
    ? Math.round((totalProducedInPipeline / totalPlannedInPipeline) * 100)
    : 0;

  // Custom Tooltip for Production Orders
  const CustomOrderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[220px] z-50">
          <div className="font-bold border-b border-slate-700 pb-1 flex items-center justify-between">
            <span className="text-blue-300 font-mono">{data.orderNumber}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
              {data.stage}
            </span>
          </div>
          <div className="text-slate-300 font-medium">{data.productName}</div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{isAr ? 'الكمية المخططة:' : 'Planned Qty:'}</span>
            <span className="font-mono font-bold text-blue-400">
              {formatNumber(data.plannedQuantity, language)} {data.uom}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{isAr ? 'المنجز الفعلي:' : 'Finished Output:'}</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatNumber(data.actualFinishedQuantity, language)} {data.uom}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{isAr ? 'الهالك والعادم:' : 'Scrap Qty:'}</span>
            <span className="font-mono font-bold text-rose-400">
              {formatNumber(data.scrapQuantity, language)} {data.uom}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{isAr ? 'نسبة الإنجاز:' : 'Completion Rate:'}</span>
            <span className="font-mono font-bold text-amber-300">
              {data.progressPercent}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="section-production-charts">
      {/* Production Progress Bar Chart (2 columns) */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Factory className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'متابعة إنجاز أوامر الإنتاج الجارية والمخططة' : 'Pending & Active Production Orders'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? 'مقارنة الكمية المستهدفة بالمخرجات التامة ونسب الهالك لكل أمر تشغيل' : 'Tracking planned batch quantity vs finished outputs and scrap'}
            </p>
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                statusFilter === 'ACTIVE' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'النشطة والجارية' : 'Active Orders'}
            </button>
            <button
              onClick={() => setStatusFilter('QUALITY')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                statusFilter === 'QUALITY' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              {isAr ? 'بانتظار الجودة' : 'Pending QA'}
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                statusFilter === 'ALL' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
          </div>
        </div>

        {/* Chart Container */}
        {ordersChartData.length === 0 ? (
          <div className="h-72 w-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="text-xs">{isAr ? 'لا توجد أوامر إنتاج معلقة في هذا التصنيف' : 'No pending production orders in this view'}</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ordersChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="orderNumber"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip content={<CustomOrderTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => {
                    if (value === 'plannedQuantity') return isAr ? 'المخطط إنتاجه (Planned)' : 'Planned Target Qty';
                    if (value === 'actualFinishedQuantity') return isAr ? 'المنجز الفعلي (Finished)' : 'Finished Output';
                    if (value === 'scrapQuantity') return isAr ? 'الهالك والعادم (Scrap)' : 'Scrap / Waste';
                    return value;
                  }}
                />
                <Bar
                  dataKey="plannedQuantity"
                  name="plannedQuantity"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actualFinishedQuantity"
                  name="actualFinishedQuantity"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="scrapQuantity"
                  name="scrapQuantity"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bottom Production Execution Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-500">{isAr ? 'أوامر قيد المتابعة' : 'Open Orders'}</div>
            <div className="font-bold font-mono text-slate-900">{totalOpenOrders}</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100">
            <div className="text-[10px] text-blue-700">{isAr ? 'إجمالي المخطط (WIP)' : 'Total Planned'}</div>
            <div className="font-bold font-mono text-blue-900">{formatNumber(totalPlannedInPipeline, language)} كجم</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
            <div className="text-[10px] text-emerald-700">{isAr ? 'المنجز الفعلي' : 'Finished Output'}</div>
            <div className="font-bold font-mono text-emerald-900">{formatNumber(totalProducedInPipeline, language)} كجم</div>
          </div>
          <div className="p-2 rounded-lg bg-purple-50/70 border border-purple-100">
            <div className="text-[10px] text-purple-700">{isAr ? 'معدل الإنجاز الإجمالي' : 'Execution Rate'}</div>
            <div className="font-bold font-mono text-purple-900">{overallCompletion}%</div>
          </div>
        </div>
      </div>

      {/* Production Lifecycle Distribution Donut (1 column) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'توزيع خط أنابيب دورة الإنتاج' : 'Production Pipeline Status'}</span>
          </h3>
          <p className="text-xs text-slate-500">
            {isAr ? 'حالات أوامر التشغيل عبر مراحل الاعتماد والتصنيع والجودة' : 'Order counts across approval, execution, and quality gates'}
          </p>
        </div>

        {/* Donut Chart */}
        <div className="h-56 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pipelinePieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {pipelinePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any, item: any) => [
                  `${value} ${isAr ? 'أمر إنتاج' : 'orders'} (${formatNumber(item.payload.kg, language)} كجم)`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[11px] text-slate-400 font-medium">{isAr ? 'إجمالي الأوامر' : 'Total Orders'}</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              {productionOrders.length}
            </span>
          </div>
        </div>

        {/* Pipeline Stage Indicators */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
          {pipelinePieData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-slate-800">{item.name}</span>
              </div>
              <div className="font-mono font-bold text-slate-900">
                {item.value} <span className="text-[10px] text-slate-500 font-normal">({formatNumber(item.kg, language)} كجم)</span>
              </div>
            </div>
          ))}
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('production')}
            className="w-full py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 text-center cursor-pointer transition"
          >
            {isAr ? 'فتح لوحة أوامر الإنتاج الكاملة ←' : 'Open Production Management →'}
          </button>
        )}
      </div>
    </div>
  );
};
