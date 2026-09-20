import React, { useState } from 'react';
import {
  RotateCw,
  Server,
  Key,
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  Package,
  Truck,
  Factory,
  ArrowRightLeft,
  Settings,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Zap,
  Wifi,
  WifiOff,
  Layers,
  Clock,
  AlertTriangle,
  RotateCcw,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BackgroundSyncQueueManager } from '../components/odoo/BackgroundSyncQueueManager';
import { OdooIntegrationSkeleton } from '../components/common/Skeleton';
import { usePerceivedLoading } from '../hooks/usePerceivedLoading';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { OdooConfig, OdooSyncLog } from '../types';

export const OdooIntegrationView: React.FC = () => {
  const { isLoading } = usePerceivedLoading(180);
  const {
    language,
    odooConfig,
    setOdooConfig,
    testOdooConnection,
    syncOdooEntity,
    fullOdooSync,
    odooLogs,
    customers,
    suppliers,
    products,
    rawMaterials,
    customerDeliveries,
    productionOrders
  } = useApp();
  const isAr = language === 'ar';

  const [formConfig, setFormConfig] = useState<OdooConfig>({ ...odooConfig });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncingEntity, setSyncingEntity] = useState<string | null>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setOdooConfig(formConfig);
    setTestResult({
      success: true,
      message: isAr ? 'تم حفظ إعدادات خادم أودو بنجاح' : 'Odoo connection parameters updated'
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await testOdooConnection();
      if (ok) {
        setTestResult({
          success: true,
          message: isAr
            ? `تم الاتصال بنجاح بخادم أودو (${formConfig.serverUrl}) وقاعدة البيانات (${formConfig.database}) الإصدار v16/v17 Enterprise`
            : `Connected to Odoo XML-RPC/JSON-RPC API (${formConfig.database})`
        });
      } else {
        setTestResult({
          success: false,
          message: isAr ? 'فشل الاتصال: تحقق من صحة الرابط ومفتاح الـ API' : 'Connection failed. Check URL or API Key.'
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleTriggerSync = async (entity: 'CUSTOMERS' | 'INVENTORY' | 'PRODUCTION') => {
    setSyncingEntity(entity);
    try {
      await syncOdooEntity(entity);
    } finally {
      setSyncingEntity(null);
    }
  };

  const handleFullSync = async () => {
    setSyncingEntity('ALL');
    try {
      await fullOdooSync();
    } finally {
      setSyncingEntity(null);
    }
  };

  const syncModules = [
    {
      id: 'CUSTOMERS' as const,
      odooModel: 'res.partner',
      titleAr: 'العملاء والموردين (Partners)',
      titleEn: 'Customers & Suppliers (res.partner)',
      descAr: 'مزامنة بيانات العملاء وسجلات الموردين وشروط الدفع والعناوين',
      descEn: 'Sync customer master data, suppliers, contact details, payment terms',
      localCount: customers.length + suppliers.length,
      icon: Users,
      color: 'blue'
    },
    {
      id: 'INVENTORY' as const,
      odooModel: 'stock.quant / product.product',
      titleAr: 'المخزون والتكاليف (Inventory & Quants)',
      titleEn: 'Inventory Quants & Products (stock.quant)',
      descAr: 'مزامنة الأرصدة الفعلية، كروت الأصناف، ومتوسط التكلفة المتحرك (standard_price)',
      descEn: 'Push stock levels, item cards, and Moving Average Cost to Odoo warehouse locations',
      localCount: products.reduce((a, b) => a + b.currentQty, 0) + rawMaterials.reduce((a, b) => a + b.currentQty, 0),
      icon: Package,
      color: 'emerald'
    },
    {
      id: 'PRODUCTION' as const,
      odooModel: 'mrp.production / mrp.bom',
      titleAr: 'أوامر التصنيع والتشغيل (MRP Production)',
      titleEn: 'Manufacturing Orders (mrp.production)',
      descAr: 'مزامنة أوامر الإنتاج وقوائم المواد BOM وكميات الهالك (Scrap at 0 EGP)',
      descEn: 'Sync manufacturing work orders, BOM consumption, and scrap batches',
      localCount: productionOrders.length,
      icon: Factory,
      color: 'sky'
    }
  ];

  if (isLoading) {
    return <OdooIntegrationSkeleton />;
  }

  return (
    <div className="space-y-6" id="view-odoo-integration">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isAr ? 'مركز التكامل المباشر مع نظام أودو (Odoo Enterprise Integration Hub)' : 'Odoo Live Integration Hub'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'تكامل ثنائي الاتجاه للمخزون، العملاء، التكاليف، وأوامر التصنيع عبر بروتوكول Odoo XML-RPC / REST API'
              : 'Seamless 2-way sync for customers, inventory quants, Moving Average Cost, and delivery orders.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFullSync}
            disabled={syncingEntity !== null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingEntity === 'ALL' ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'مزامنة شاملة لكل الكيانات' : 'Full 2-Way Sync'}</span>
          </button>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            odooConfig.isConnected
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-rose-100 text-rose-800 border border-rose-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${odooConfig.isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
            <span>{odooConfig.isConnected ? (isAr ? 'متصل بنظام أودو' : 'Odoo Connected') : (isAr ? 'غير متصل' : 'Disconnected')}</span>
          </span>
        </div>
      </div>

      {/* Configuration Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-700" />
            <h3 className="font-bold text-xs text-slate-800">
              {isAr ? 'إعدادات الاتصال وحساب أودو (Odoo Connection Parameters)' : 'Odoo Connection Credentials'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {isAr ? 'يدعم Odoo Community & Enterprise v14-v18' : 'Compatible with v14-v18'}
          </span>
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isAr ? 'رابط خادم أودو (Server URL) *' : 'Odoo Server URL *'}
            </label>
            <input
              type="text"
              value={formConfig.serverUrl}
              onChange={e => setFormConfig({ ...formConfig, serverUrl: e.target.value })}
              placeholder="https://mycompany.odoo.com"
              className="w-full p-2 rounded-lg border border-slate-200 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isAr ? 'اسم قاعدة البيانات (Database) *' : 'Database Name *'}
            </label>
            <input
              type="text"
              value={formConfig.database}
              onChange={e => setFormConfig({ ...formConfig, database: e.target.value })}
              placeholder="production_db"
              className="w-full p-2 rounded-lg border border-slate-200 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isAr ? 'البريد الإلكتروني / المستخدم *' : 'User / Email *'}
            </label>
            <input
              type="text"
              value={formConfig.username}
              onChange={e => setFormConfig({ ...formConfig, username: e.target.value })}
              placeholder="admin@company.com"
              className="w-full p-2 rounded-lg border border-slate-200 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isAr ? 'مفتاح الـ API / كلمة المرور *' : 'API Key / Token *'}
            </label>
            <input
              type="password"
              value={formConfig.apiKey}
              onChange={e => setFormConfig({ ...formConfig, apiKey: e.target.value })}
              placeholder="••••••••••••"
              className="w-full p-2 rounded-lg border border-slate-200 font-mono"
              required
            />
          </div>

          <div className="col-span-full flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSync"
                checked={formConfig.autoSync}
                onChange={e => setFormConfig({ ...formConfig, autoSync: e.target.checked })}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="autoSync" className="text-slate-700 font-medium">
                {isAr
                  ? 'تفعيل المزامنة التلقائية اللحظية عند ترحيل أذونات التسليم والإضافة'
                  : 'Enable instant auto-sync on transaction posting'}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-500 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? (isAr ? 'جاري الفحص...' : 'Testing...') : (isAr ? 'فحص الاتصال بخادم أودو' : 'Test Connection')}</span>
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs transition"
              >
                {isAr ? 'حفظ إعدادات أودو' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>

        {testResult && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Sync Modules Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-xs text-slate-800">
          {isAr ? 'وحدات وجداول المزامنة الثنائية المباشرة (Active Synchronization Modules)' : 'Bi-directional Synchronization Modules'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {syncModules.map(mod => {
            const Icon = mod.icon;
            const isSyncingThis = syncingEntity === mod.id;
            return (
              <div key={mod.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {mod.odooModel}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      {isAr ? mod.titleAr : mod.titleEn}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {isAr ? mod.descAr : mod.descEn}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {formatNumber(mod.localCount, language)} {isAr ? 'سجلات' : 'records'}
                  </span>

                  <button
                    onClick={() => handleTriggerSync(mod.id)}
                    disabled={isSyncingThis || syncingEntity !== null}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingThis ? 'animate-spin' : ''}`} />
                    <span>{isSyncingThis ? (isAr ? 'جاري المزامنة...' : 'Syncing...') : (isAr ? 'مزامنة فورية' : 'Sync Now')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Worker Background Sync & Offline Queue Manager */}
      <BackgroundSyncQueueManager odooConfig={odooConfig} isAr={isAr} />

      {/* Sync Audit Trail Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-purple-700" />
            <h3 className="font-bold text-xs text-slate-800">
              {isAr ? 'سجل عمليات المزامنة مع أودو (Odoo Sync Audit Logs)' : 'Odoo Synchronization Logs'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {odooLogs.length} {isAr ? 'عمليات موثقة' : 'logged jobs'}
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
          {odooLogs.map((log: OdooSyncLog) => (
            <div key={log.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {log.status === 'SUCCESS' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{log.model}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                      {log.action}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{log.details}</div>
                </div>
              </div>

              <div className="text-left font-mono text-[11px]">
                <div className="text-slate-700 font-semibold">{log.recordsCount} {isAr ? 'سجل' : 'items'}</div>
                <div className="text-slate-400">{log.timestamp.substring(11, 19)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
