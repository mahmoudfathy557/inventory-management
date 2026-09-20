import React from 'react';
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Factory,
  PackageCheck,
  RotateCw,
  ArrowUpRight,
  ShieldCheck,
  SendHorizontal,
  Clock,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { StatusChip } from '../components/common/StatusChip';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onOpenWalkthrough: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenWalkthrough }) => {
  const {
    language,
    rawMaterials,
    products,
    warehouses,
    productionOrders,
    ledgerEntries,
    odooConfig
  } = useApp();
  const isAr = language === 'ar';

  // KPI Calculations
  const rawMaterialValue = rawMaterials.reduce((acc, m) => acc + (m.totalValue || 0), 0);
  const finishedGoodsValue = products.reduce((acc, p) => acc + (p.totalValue || 0), 0);
  const totalInventoryValue = rawMaterialValue + finishedGoodsValue;

  const totalRawQty = rawMaterials.reduce((acc, m) => acc + (m.currentQty || 0), 0);
  const totalFGQty = products.reduce((acc, p) => acc + (p.currentQty || 0), 0);

  // Scrap total quantity from ledger
  const totalScrapQty = ledgerEntries
    .filter(e => e.transactionType === 'SCRAP')
    .reduce((acc, e) => acc + e.qtyIn, 0);

  const openOrdersCount = productionOrders.filter(
    o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'CLOSED'
  ).length;

  const pendingQualityOrders = productionOrders.filter(
    o => o.status === 'PENDING_QUALITY' || o.qualityStatus === 'PENDING'
  );

  // Low stock items
  const lowStockItems = rawMaterials.filter(m => (m.currentQty || 0) <= m.reorderLevel);

  // Warehouse breakdown
  const warehouseBreakdown = warehouses.map(wh => {
    let val = 0;
    let qty = 0;
    if (wh.type === 'RAW_MATERIALS') {
      val = rawMaterialValue;
      qty = totalRawQty;
    } else if (wh.type === 'FINISHED_GOODS') {
      val = finishedGoodsValue;
      qty = totalFGQty;
    } else if (wh.type === 'SCRAP') {
      val = 0; // Rule 22: Scrap is 0 EGP in MVP
      qty = totalScrapQty;
    } else {
      val = 0;
      qty = 0;
    }
    return {
      ...wh,
      value: val,
      qty
    };
  });

  return (
    <div className="space-y-6" id="view-dashboard">
      {/* Walkthrough Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isAr ? 'سيناريو الدورة المعيارية الجاهز (Section 47)' : 'Section 47 Verified MVP Flow'}</span>
          </div>
          <h2 className="text-lg font-bold">
            {isAr
              ? 'نظام مراقبة المخزون وأوامر الإنتاج الصناعي ومتوسط التكلفة المتحرك'
              : 'Manufacturing Inventory & Production Control Engine'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isAr
              ? 'تم تحميل دورة العمل الكاملة: استلام خامات (1000 كجم) ⇽ تكلفة إنزال ⇽ تحويل للتشغيل ⇽ أمر إنتاج 900 كجم ⇽ استيعاب التكلفة ⇽ اعتماد الجودة ⇽ تسليم العميل ومزامنة أودو.'
              : 'Pre-loaded end-to-end flow: 1,000 KG receipt + landed cost + WIP transfer + production order + 100% cost allocation + quality approval + customer delivery + Odoo sync.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 flex-shrink-0">
          <button
            id="dash-btn-walkthrough"
            onClick={onOpenWalkthrough}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isAr ? 'شرح الدورة التفاعلية' : 'Walkthrough Tour'}</span>
          </button>
          <button
            id="dash-btn-audit-report"
            onClick={() => onNavigate('reports')}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
          >
            <span>{isAr ? 'دفتر الأستاذ' : 'Audit Ledger'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards (Section 28) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{isAr ? 'إجمالي قيمة المخزون (EGP)' : 'Total Inventory Value'}</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatCurrency(totalInventoryValue, language)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold font-mono">
              {formatNumber(totalRawQty + totalFGQty, language)}
            </span>
            <span>{isAr ? 'كجم إجمالي الكميات' : 'KG total units'}</span>
          </div>
        </div>

        {/* Raw Materials Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{isAr ? 'قيمة المواد الخام' : 'Raw Materials Value'}</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatCurrency(rawMaterialValue, language)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>{rawMaterials.length} {isAr ? 'أصناف خامات مسجلة' : 'Raw materials'}</span>
          </div>
        </div>

        {/* Finished Goods Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{isAr ? 'قيمة المنتجات التامة' : 'Finished Goods Value'}</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatCurrency(finishedGoodsValue, language)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span>{formatNumber(totalFGQty, language)} {isAr ? 'كجم منتج تام متاح' : 'KG in stock'}</span>
          </div>
        </div>

        {/* Scrap & Production Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{isAr ? 'كمية الهالك (قيمة 0 ج.م)' : 'Scrap Qty (0 EGP Value)'}</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatNumber(totalScrapQty, language)} <span className="text-xs font-normal">كجم</span>
          </div>
          <div className="text-[11px] text-purple-700 font-medium">
            {isAr ? 'قاعدة MVP: الهالك بقيمة معيارية صفر' : 'MVP Rule: 0 EGP Valuation'}
          </div>
        </div>
      </div>

      {/* Operational Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Quality Queue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-xs text-slate-800">
                {isAr ? 'طلبات فحص واعتماد الجودة' : 'Quality Approvals Pending'}
              </h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              pendingQualityOrders.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {pendingQualityOrders.length}
            </span>
          </div>

          <div className="py-3 flex-1">
            {pendingQualityOrders.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">
                {isAr ? 'جميع أوامر الإنتاج معتمدة ومفرجة' : 'No batches waiting for quality'}
              </div>
            ) : (
              <div className="space-y-2">
                {pendingQualityOrders.slice(0, 2).map(o => (
                  <div key={o.id} className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{o.orderNumber}</div>
                      <div className="text-slate-500">{o.productName} ({o.actualFinishedQuantity} كجم)</div>
                    </div>
                    <button
                      onClick={() => onNavigate('quality')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                    >
                      {isAr ? 'فحص الآن' : 'Inspect'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('quality')}
            className="w-full py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 text-center"
          >
            {isAr ? 'شاشة الرقابة على الجودة' : 'Go to Quality Control'}
          </button>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-xs text-slate-800">
                {isAr ? 'تنبيهات نقطة إعادة الطلب' : 'Reorder Level Alerts'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {lowStockItems.length}
            </span>
          </div>

          <div className="py-3 flex-1">
            {lowStockItems.length === 0 ? (
              <div className="text-xs text-emerald-600 py-4 text-center flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'كافة الخامات أعلى من نقطة إعادة الطلب' : 'All items above reorder level'}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map(item => (
                  <div key={item.id} className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-rose-900">{item.nameAr}</div>
                      <div className="text-[11px] text-rose-600 font-mono">
                        {isAr ? 'الرصيد: ' : 'Stock: '} {item.currentQty} {item.defaultUOM} (حد الطلب: {item.reorderLevel})
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('receipts')}
                      className="px-2 py-1 bg-white text-rose-700 rounded border border-rose-300 text-[11px] font-bold"
                    >
                      {isAr ? 'إذن إضافة' : 'Order'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('receipts')}
            className="w-full py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 text-center"
          >
            {isAr ? 'إصدار إذن إضافة مخزني' : 'Create Inventory Receipt'}
          </button>
        </div>

        {/* Odoo Sync Status Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-xs text-slate-800">
                {isAr ? 'حالة تكامل أودو (Odoo Sync)' : 'Odoo Live Status'}
              </h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              odooConfig.isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {odooConfig.isConnected ? (isAr ? 'متصل ومفعل' : 'Connected') : (isAr ? 'غير متصل' : 'Offline')}
            </span>
          </div>

          <div className="py-3 flex-1 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{isAr ? 'الخادم المتصل:' : 'Server:'}</span>
              <span className="font-mono text-slate-800 truncate max-w-[170px]">{odooConfig.serverUrl}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{isAr ? 'قاعدة البيانات:' : 'Database:'}</span>
              <span className="font-mono text-slate-800">{odooConfig.database}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{isAr ? 'آخر مزامنة:' : 'Last Sync:'}</span>
              <span className="font-mono text-slate-500">{odooConfig.lastSyncDate || '2026-09-20'}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('odoo-sync')}
            className="w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 text-center"
          >
            {isAr ? 'فتح لوحة مزامنة أودو' : 'Open Odoo Sync Hub'}
          </button>
        </div>
      </div>

      {/* Warehouse Inventory Distribution (Section 2) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {isAr ? 'هيكل المستودعات والمواقع والتقييم المالي' : 'Warehouse & Location Structure Valuation'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? 'توزيع الأرصدة والقيم حسب المستودع ومتوسط التكلفة المتحرك' : 'Valuation by warehouse under moving average costing'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            {isAr ? 'عرض تقرير رصيد المخزون الكامل ←' : 'View Full Inventory Balance →'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {warehouseBreakdown.map(wh => (
            <div key={wh.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">
                  {isAr ? wh.nameAr : wh.nameEn}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  {wh.code}
                </span>
              </div>
              <div className="text-base font-bold font-mono text-slate-900">
                {formatCurrency(wh.value, language)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/80 pt-1.5">
                <span>{isAr ? 'الكمية الإجمالية:' : 'Total Qty:'}</span>
                <span className="font-bold font-mono text-slate-700">
                  {formatNumber(wh.qty, language)} كجم
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Ledger Audit Transactions Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-xs text-slate-800">
              {isAr ? 'آخر حركات دفتر أستاذ المخزون (Inventory Ledger Audit Stream)' : 'Recent Ledger Audit Transactions'}
            </h3>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            {isAr ? 'فحص سجل التدقيق الكامل ←' : 'Full Audit Trail →'}
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
          {ledgerEntries.slice(-5).reverse().map(entry => (
            <div key={entry.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px]">
                  {entry.documentNumber}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{entry.itemName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{entry.warehouseName}</span>
                    <span>•</span>
                    <span className="font-mono">{entry.date}</span>
                    <span>•</span>
                    <span>{entry.createdBy}</span>
                  </div>
                </div>
              </div>

              <div className="text-left font-mono">
                <div className={`font-bold ${entry.qtyIn > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {entry.qtyIn > 0 ? `+${formatNumber(entry.qtyIn, language)}` : `-${formatNumber(entry.qtyOut, language)}`} كجم
                </div>
                <div className="text-[11px] text-slate-500">
                  {isAr ? 'متوسط: ' : 'MAC: '} {formatCurrency(entry.movingAverageCostEGP, language)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
