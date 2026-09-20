import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Trash2,
  RotateCcw,
  Zap,
  Server,
  ToggleLeft,
  ToggleRight,
  Database,
  Radio,
  Cpu
} from 'lucide-react';
import { useOfflineSyncQueue } from '../../hooks/useOfflineSyncQueue';
import { OdooConfig, QueuedSyncItem } from '../../types';

interface BackgroundSyncQueueManagerProps {
  odooConfig: OdooConfig;
  isAr: boolean;
}

export const BackgroundSyncQueueManager: React.FC<BackgroundSyncQueueManagerProps> = ({
  odooConfig,
  isAr
}) => {
  const {
    items,
    stats,
    pendingCount,
    isSyncing,
    isOnline,
    simulatedOffline,
    toggleSimulateOffline,
    triggerSync,
    retryItem,
    deleteItem,
    clearSynced
  } = useOfflineSyncQueue(odooConfig);

  const [filter, setFilter] = useState<'ALL' | 'QUEUED' | 'SYNCED' | 'FAILED'>('ALL');

  const filteredItems = items.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const getStatusBadge = (status: QueuedSyncItem['status']) => {
    switch (status) {
      case 'SYNCED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'تمت المزامنة بنجاح' : 'Synced with Odoo'}</span>
          </span>
        );
      case 'SYNCING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
            <span>{isAr ? 'جاري المزامنة...' : 'Syncing...'}</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{isAr ? 'فشلت المحاولة' : 'Failed'}</span>
          </span>
        );
      case 'QUEUED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAr ? 'معلق في الطابور (أوفلاين)' : 'Queued (Offline)'}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
      {/* Panel Header */}
      <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">
                {isAr
                  ? 'طابور المزامنة في الخلفية مع أودو (Background Sync Service Worker)'
                  : 'Service Worker Background Sync & IndexedDB Queue'}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-700">
                PWA SyncManager
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'حفظ وتجميع حركات التحويل المخزني وأذونات الصرف والإضافة أوفلاين في IndexedDB ومزامنتها تلقائياً مع خادم Odoo'
                : 'Queues stock transfers & receipts in IndexedDB while offline and auto-syncs via Service Worker'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleSimulateOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
              simulatedOffline
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={
              isAr
                ? 'محاكاة انقطاع الإنترنت لاختبار تسجيل حركات التحويل وتجميعها في الطابور'
                : 'Simulate offline status to test transaction queuing'
            }
          >
            {simulatedOffline ? (
              <ToggleRight className="w-4 h-4 text-slate-950" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {isAr
                ? simulatedOffline
                  ? 'وضع المحاكاة أوفلاين نشط'
                  : 'محاكاة وضع الأوفلاين'
                : simulatedOffline
                ? 'Simulated Offline ON'
                : 'Simulate Offline'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => triggerSync()}
            disabled={isSyncing || !isOnline}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing
                ? isAr
                  ? 'جاري المزامنة مع أودو...'
                  : 'Syncing with Odoo...'
                : isAr
                ? 'مزامنة الطابور الآن'
                : 'Sync Queue Now'}
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span>{isAr ? 'حالة الشبكة الحالية' : 'Network Connectivity'}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-bold">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">{isAr ? 'متصل بالإنترنت' : 'Connected (Online)'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span className="text-amber-700">{isAr ? 'غير متصل (أوفلاين)' : 'Disconnected (Offline)'}</span>
              </>
            )}
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>{isAr ? 'خدمة الخلفية SW' : 'Service Worker'}</span>
          </div>
          <div className="mt-1 font-bold text-slate-800 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{isAr ? 'مسجلة وجاهزة' : 'Active & Ready'}</span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{isAr ? 'في الانتظار (Queued)' : 'Queued'}</span>
          </div>
          <div className="mt-1 font-extrabold text-amber-600 text-base">{stats.queued}</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isAr ? 'تمت المزامنة' : 'Synced'}</span>
          </div>
          <div className="mt-1 font-extrabold text-emerald-600 text-base">{stats.synced}</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>{isAr ? 'فشلت' : 'Failed'}</span>
          </div>
          <div className="mt-1 font-extrabold text-rose-600 text-base">{stats.failed}</div>
        </div>
      </div>

      {/* Filter Tabs & Queue Controls */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'QUEUED', 'SYNCED', 'FAILED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                filter === f
                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f === 'ALL' && (isAr ? 'الكل' : 'All')}
              {f === 'QUEUED' && `${isAr ? 'المعلقة' : 'Queued'} (${stats.queued})`}
              {f === 'SYNCED' && `${isAr ? 'المكتملة' : 'Synced'} (${stats.synced})`}
              {f === 'FAILED' && `${isAr ? 'الفاشلة' : 'Failed'} (${stats.failed})`}
            </button>
          ))}
        </div>

        {stats.synced > 0 && (
          <button
            type="button"
            onClick={clearSynced}
            className="px-2.5 py-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'تفريغ العناصر المكتملة' : 'Clear Synced Items'}</span>
          </button>
        )}
      </div>

      {/* Queue Items List */}
      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto text-xs">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Database className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">
              {isAr ? 'لا توجد حركات في هذا التصنيف' : 'No items found in this filter'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              {isAr
                ? 'أي عمليات تحويل مخزني، أو صرف مواد، أو استلام بضاعة تتم أثناء انقطاع الاتصال بالإنترنت ستظهر هنا تلقائياً وتتم مزامنتها مع أودو.'
                : 'Stock transfers, material issues, and goods receipts recorded while offline will appear here and sync to Odoo.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {isAr ? item.titleAr : item.titleEn}
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {item.documentNumber}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span>
                    <span className="text-slate-400">{isAr ? 'وقت الإدراج:' : 'Queued:'} </span>
                    {new Date(item.queuedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                  </span>
                  <span>•</span>
                  <span>
                    <span className="text-slate-400">{isAr ? 'نموذج أودو:' : 'Odoo Model:'} </span>
                    <span className="font-mono text-slate-700">{item.odooModel}</span>
                  </span>
                  {item.retryCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-700 font-semibold">
                        {isAr ? `محاولات: ${item.retryCount}/${item.maxRetries}` : `Retries: ${item.retryCount}/${item.maxRetries}`}
                      </span>
                    </>
                  )}
                </div>

                {item.payload && (
                  <div className="mt-1 p-2 rounded-lg bg-slate-100 text-[11px] text-slate-700 flex flex-wrap items-center gap-3">
                    {item.payload.itemName && (
                      <div>
                        <span className="text-slate-500">{isAr ? 'الصنف: ' : 'Item: '}</span>
                        <span className="font-bold">{item.payload.itemName}</span>
                      </div>
                    )}
                    {item.payload.quantity && (
                      <div>
                        <span className="text-slate-500">{isAr ? 'الكمية: ' : 'Qty: '}</span>
                        <span className="font-bold">{item.payload.quantity} {item.payload.uom || ''}</span>
                      </div>
                    )}
                    {item.payload.fromWarehouseName && (
                      <div>
                        <span className="text-slate-500">{isAr ? 'المسار: ' : 'Route: '}</span>
                        <span>{item.payload.fromWarehouseName} ➔ {item.payload.toWarehouseName}</span>
                      </div>
                    )}
                  </div>
                )}

                {item.error && (
                  <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <span className="font-bold">{isAr ? 'خطأ المزامنة: ' : 'Error: '}</span>
                    {item.error}
                  </div>
                )}
              </div>

              {/* Row Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {item.status === 'FAILED' && (
                  <button
                    type="button"
                    onClick={() => retryItem(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                    title={isAr ? 'إعادة محاولة المزامنة' : 'Retry Synchronization'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title={isAr ? 'حذف من الطابور' : 'Delete from queue'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
