import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Layers,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useOfflineSyncQueue } from '../../hooks/useOfflineSyncQueue';

export const OfflineStatusBanner: React.FC = () => {
  const { language, odooConfig } = useApp();
  const isAr = language === 'ar';
  const {
    items,
    stats,
    pendingCount,
    isSyncing,
    isOnline,
    realIsOnline,
    simulatedOffline,
    toggleSimulateOffline,
    triggerSync,
    retryItem
  } = useOfflineSyncQueue(odooConfig);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [prevSyncing, setPrevSyncing] = useState(false);

  // Show a brief success flash when syncing completes with 0 pending items
  useEffect(() => {
    if (prevSyncing && !isSyncing && pendingCount === 0 && stats.synced > 0) {
      setShowSuccessToast(true);
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
    setPrevSyncing(isSyncing);
  }, [isSyncing, pendingCount, stats.synced, prevSyncing]);

  // If online, no pending items, and not syncing, hide banner
  const shouldShow = !isOnline || isSyncing || pendingCount > 0 || stats.failed > 0 || showSuccessToast;

  if (!shouldShow) {
    return null;
  }

  // Success State Flash
  if (showSuccessToast && isOnline && pendingCount === 0 && !isSyncing) {
    return (
      <div
        id="offline-status-banner-success"
        role="status"
        aria-live="polite"
        className="w-full bg-emerald-700 text-white px-3 sm:px-4 py-2 text-xs flex items-center justify-between shadow-xs transition-all duration-300"
      >
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span className="font-bold">
            {isAr
              ? 'تمت مزامنة جميع الحركات المخزنية بنجاح مع Odoo عبر Service Worker'
              : 'All offline inventory transactions successfully synced with Odoo via Service Worker'}
          </span>
          <span className="hidden sm:inline text-emerald-200 text-[11px] font-mono">
            ({stats.synced} {isAr ? 'حركة مكتملة' : 'synced'})
          </span>
        </div>
      </div>
    );
  }

  // Syncing State
  if (isSyncing) {
    return (
      <div
        id="offline-status-banner-syncing"
        role="status"
        aria-live="polite"
        className="w-full bg-sky-900 border-b border-sky-800 text-sky-50 px-3 sm:px-4 py-2 text-xs shadow-xs transition-all"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded bg-sky-800 text-sky-200 shrink-0">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-300" />
            </div>
            <div className="truncate">
              <span className="font-bold text-white">
                {isAr
                  ? 'جاري مزامنة الطابور مع خادم Odoo في الخلفية...'
                  : 'Syncing Offline Queue with Odoo Background Worker...'}
              </span>
              <span className="mx-2 text-sky-300 opacity-60">|</span>
              <span className="text-sky-200 text-[11px]">
                {isAr
                  ? `جاري معالجة ${pendingCount || 1} حركة مخزنية مع Odoo stock.picking`
                  : `Processing ${pendingCount || 1} pending transaction(s) to Odoo stock.picking`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="px-2 py-0.5 rounded bg-sky-800/80 text-sky-200 text-[10px] font-mono">
              SW Background Sync
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Offline or Pending/Failed Queue Banner
  return (
    <div
      id="offline-status-banner"
      role="region"
      aria-label={isAr ? 'شريط حالة الاتصال والمزامنة' : 'Offline and Sync Status Banner'}
      className={`w-full border-b text-xs shadow-xs transition-all duration-200 ${
        !isOnline
          ? 'bg-amber-950 border-amber-800 text-amber-100'
          : stats.failed > 0
          ? 'bg-rose-950 border-rose-800 text-rose-100'
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Status Message */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                !isOnline
                  ? 'bg-amber-800/80 text-amber-200'
                  : stats.failed > 0
                  ? 'bg-rose-800/80 text-rose-200'
                  : 'bg-slate-800 text-slate-200'
              }`}
            >
              {!isOnline ? (
                <WifiOff className="w-4 h-4 text-amber-300 animate-pulse" />
              ) : stats.failed > 0 ? (
                <AlertTriangle className="w-4 h-4 text-rose-300" />
              ) : (
                <Database className="w-4 h-4 text-sky-300" />
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
              <div className="font-bold flex items-center gap-1.5">
                <span>
                  {!isOnline
                    ? isAr
                      ? 'أنت تعمل حالياً في وضع عدم الاتصال (Offline Mode)'
                      : 'You are currently working in Offline Mode'
                    : stats.failed > 0
                    ? isAr
                      ? 'توجد حركات فشلت مزامنتها مع Odoo'
                      : 'Failed transactions in Odoo sync queue'
                    : isAr
                    ? 'طابور المزامنة الخلفية مع أودو جاهز'
                    : 'Odoo Background Sync Queue Ready'}
                </span>
                {simulatedOffline && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-extrabold text-[10px]">
                    {isAr ? 'وضع محاكاة' : 'Simulated'}
                  </span>
                )}
              </div>

              <div className="text-[11px] opacity-85 truncate">
                {!isOnline
                  ? isAr
                    ? `يتم حفظ كافة الحركات محلياً في IndexedDB (${pendingCount} معلق) وتُزامن تلقائياً عبر Service Worker عند استعادة الشبكة.`
                    : `Operations are saved locally in IndexedDB (${pendingCount} queued) and auto-sync on reconnection.`
                  : stats.failed > 0
                  ? isAr
                    ? `${stats.failed} حركة فشلت في المزامنة. يرجى مراجعتها وإعادة المحاولة.`
                    : `${stats.failed} transaction(s) failed to sync. Review and retry.`
                  : isAr
                  ? `يوجد ${pendingCount} حركة مخزنية بانتظار المزامنة.`
                  : `${pendingCount} transaction(s) awaiting sync.`}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            {simulatedOffline ? (
              <button
                type="button"
                id="btn-disable-simulated-offline"
                onClick={toggleSimulateOffline}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                {isAr ? 'إنهاء وضع المحاكاة' : 'Exit Simulation'}
              </button>
            ) : null}

            {isOnline && pendingCount > 0 && (
              <button
                type="button"
                id="btn-banner-trigger-sync"
                onClick={() => triggerSync()}
                disabled={isSyncing}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isAr ? 'مزامنة الطابور الآن' : 'Sync Queue Now'}</span>
              </button>
            )}

            {/* Queue Drawer Expander Toggle */}
            {items.length > 0 && (
              <button
                type="button"
                id="btn-banner-toggle-queue-details"
                onClick={() => setIsExpanded(prev => !prev)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {isAr ? 'عرض عناصر الطابور' : 'Queue Details'} ({items.length})
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Queue Item Details Preview */}
        {isExpanded && items.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold text-slate-300">
                {isAr ? 'العناصر المسجلة في قاعدة IndexedDB المحلية:' : 'Items stored in local IndexedDB Queue:'}
              </span>
              <span>
                {isAr
                  ? `إجمالي: ${stats.total} | معلق: ${stats.queued} | فشل: ${stats.failed} | مكتمل: ${stats.synced}`
                  : `Total: ${stats.total} | Queued: ${stats.queued} | Failed: ${stats.failed} | Synced: ${stats.synced}`}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {items.map(item => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-white truncate">
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {item.documentNumber}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {item.odooModel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'QUEUED' && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px]">
                        {isAr ? 'في الانتظار' : 'Queued'}
                      </span>
                    )}
                    {item.status === 'SYNCING' && (
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold text-[10px] animate-pulse">
                        {isAr ? 'جاري المزامنة...' : 'Syncing...'}
                      </span>
                    )}
                    {item.status === 'FAILED' && (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold text-[10px]">
                          {isAr ? 'فشلت المحاولة' : 'Failed'}
                        </span>
                        <button
                          type="button"
                          onClick={() => retryItem(item.id)}
                          className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? 'إعادة' : 'Retry'}</span>
                        </button>
                      </div>
                    )}
                    {item.status === 'SYNCED' && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                        {isAr ? 'تمت المزامنة' : 'Synced'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
