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
  Cell
} from 'recharts';
import { Boxes, TrendingUp, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface InventoryLevelChartsProps {
  onNavigate?: (tab: string) => void;
}

export const InventoryLevelCharts: React.FC<InventoryLevelChartsProps> = ({ onNavigate }) => {
  const { language, rawMaterials, products, warehouses } = useApp();
  const isAr = language === 'ar';

  const [filterType, setFilterType] = useState<'ALL' | 'RAW' | 'FG' | 'LOW'>('ALL');

  // Prepare inventory level comparison data (Current Stock vs Reorder Level)
  const allStockItems = [
    ...rawMaterials.map(m => ({
      id: m.id,
      code: m.code,
      name: isAr ? m.nameAr : m.nameEn,
      category: isAr ? 'خامات أولية' : 'Raw Material',
      type: 'RAW',
      currentQty: m.currentQty || 0,
      reorderLevel: m.reorderLevel || 0,
      minStock: m.minStock || 0,
      maxStock: m.maxStock || 0,
      uom: m.defaultUOM,
      totalValue: m.totalValue || 0,
      isLow: (m.currentQty || 0) <= (m.reorderLevel || 0)
    })),
    ...products.map(p => ({
      id: p.id,
      code: p.code,
      name: isAr ? p.nameAr : p.nameEn,
      category: isAr ? 'منتج تام' : 'Finished Good',
      type: 'FG',
      currentQty: p.currentQty || 0,
      reorderLevel: 50, // Standard baseline for FG
      minStock: 20,
      maxStock: 500,
      uom: p.defaultUOM,
      totalValue: p.totalValue || 0,
      isLow: (p.currentQty || 0) <= 50
    }))
  ];

  const filteredItems = allStockItems.filter(item => {
    if (filterType === 'RAW') return item.type === 'RAW';
    if (filterType === 'FG') return item.type === 'FG';
    if (filterType === 'LOW') return item.isLow;
    return true;
  }).slice(0, 10); // Display top 10 for optimal readability

  // Valuation Pie Chart Data
  const rawTotalValue = rawMaterials.reduce((sum, m) => sum + (m.totalValue || 0), 0);
  const fgTotalValue = products.reduce((sum, p) => sum + (p.totalValue || 0), 0);
  const totalVal = rawTotalValue + fgTotalValue;

  const valuationData = [
    {
      name: isAr ? 'مستودع الخامات والمواد الأولية' : 'Raw Materials',
      value: rawTotalValue,
      color: '#2563eb', // Blue-600
      count: rawMaterials.length
    },
    {
      name: isAr ? 'مستودع المنتجات التامة الصنع' : 'Finished Goods',
      value: fgTotalValue,
      color: '#059669', // Emerald-600
      count: products.length
    }
  ];

  // Custom Tooltip for Stock Level Bar Chart
  const CustomStockTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px] z-50">
          <div className="font-bold border-b border-slate-700 pb-1 flex items-center justify-between">
            <span className="text-slate-200">{data.name}</span>
            <span className="font-mono text-[10px] text-blue-300">({data.code})</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{isAr ? 'الرصيد المتاح:' : 'Current Stock:'}</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatNumber(data.currentQty, language)} {data.uom}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{isAr ? 'حد إعادة الطلب:' : 'Reorder Level:'}</span>
            <span className="font-mono font-bold text-amber-400">
              {formatNumber(data.reorderLevel, language)} {data.uom}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{isAr ? 'القيمة الإجمالية:' : 'Total Value:'}</span>
            <span className="font-mono font-bold text-blue-300">
              {formatCurrency(data.totalValue, language)}
            </span>
          </div>
          <div className="pt-1 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px]">
            {data.isLow ? (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {isAr ? 'تنبيه: الرصيد حرج دون حد الطلب' : 'Critical: Low Stock'}
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAr ? 'الرصيد في المستوى الآمن' : 'Stock Level Healthy'}
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Valuation Pie Chart
  const CustomValuationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = totalVal > 0 ? ((data.value / totalVal) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 z-50">
          <div className="font-bold text-slate-200">{data.name}</div>
          <div className="font-mono text-emerald-400 font-bold text-sm">
            {formatCurrency(data.value, language)}
          </div>
          <div className="text-slate-400 text-[11px]">
            {isAr ? `الحصة من إجمالي المخزون: ${percent}%` : `Share of Total Inventory: ${percent}%`}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="section-inventory-charts">
      {/* Stock Level vs Reorder Level Bar Chart (2 columns) */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'مستويات الأرصدة الحالية مقارنة بنقطة إعادة الطلب' : 'Real-Time Stock vs Reorder Level'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? 'مراقبة فورية للأرصدة المتاحة ومؤشرات الأمان لتفادي نفاذ الخامات' : 'Real-time stock quantities vs safety replenishment thresholds'}
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filterType === 'ALL' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilterType('RAW')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filterType === 'RAW' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الخامات' : 'Raw'}
            </button>
            <button
              onClick={() => setFilterType('FG')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filterType === 'FG' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'المنتجات' : 'Products'}
            </button>
            <button
              onClick={() => setFilterType('LOW')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filterType === 'LOW' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              {isAr ? 'الأصناف الحرجة' : 'Low Stock'}
            </button>
          </div>
        </div>

        {/* Recharts Bar Container */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredItems}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="code"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip content={<CustomStockTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => {
                  if (value === 'currentQty') return isAr ? 'الرصيد المتاح بالمخزن' : 'Current Available Stock';
                  if (value === 'reorderLevel') return isAr ? 'حد إعادة الطلب (Safety Level)' : 'Reorder Safety Point';
                  return value;
                }}
              />
              <Bar
                dataKey="currentQty"
                name="currentQty"
                radius={[4, 4, 0, 0]}
              >
                {filteredItems.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isLow ? '#f43f5e' : '#3b82f6'}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="reorderLevel"
                name="reorderLevel"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Quick Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              <span>{isAr ? 'رصيد كافٍ' : 'Healthy Stock'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>{isAr ? 'تحت حد الطلب' : 'Low Stock Alert'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>{isAr ? 'نقطة الأمان' : 'Safety Reorder'}</span>
            </span>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('receipts')}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              {isAr ? 'إصدار أذونات توريد ←' : 'Create Inbound Receipts →'}
            </button>
          )}
        </div>
      </div>

      {/* Valuation Donut Chart (1 column) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'توزيع القيمة المالية للمخزون' : 'Inventory Valuation Breakdown'}</span>
          </h3>
          <p className="text-xs text-slate-500">
            {isAr ? 'النسبة المئوية للقيمة حسب نوع الصنف والمستودع' : 'Share of valuation between raw materials & finished products'}
          </p>
        </div>

        {/* Donut Chart */}
        <div className="h-56 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={valuationData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {valuationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomValuationTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[11px] text-slate-400 font-medium">{isAr ? 'الإجمالي' : 'Total'}</span>
            <span className="text-xs font-bold font-mono text-slate-900 max-w-[90px] truncate">
              {formatCurrency(totalVal, language)}
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
          {valuationData.map((item, idx) => {
            const share = totalVal > 0 ? ((item.value / totalVal) * 100).toFixed(1) : '0';
            return (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-slate-800">{item.name}</span>
                </div>
                <div className="text-left font-mono">
                  <div className="font-bold text-slate-900">{formatCurrency(item.value, language)}</div>
                  <div className="text-[10px] text-slate-500">{share}% ({item.count} {isAr ? 'صنف' : 'items'})</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
