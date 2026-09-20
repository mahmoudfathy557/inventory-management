import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  Filter,
  PackageCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useOfflineSyncQueue } from '../../hooks/useOfflineSyncQueue';
import { QueuedSyncItem } from '../../types';

interface OfflineSyncStatusBadgeProps {
  className?: string;
}

export const OfflineSyncStatusBadge: React.FC<OfflineSyncStatusBadgeProps> = ({
  className = ''
}) => {
  const { language, odooConfig } = useApp();
  const isAr = language === 'ar';
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

  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'QUEUED' | 'SYNCED' | 'FAILED'>('ALL');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'QUEUED') return item.status === 'QUEUED' || item.status === 'SYNCING';
    if (selectedFilter === 'SYNCED') return item.status === 'SYNCED';
    if (selectedFilter === 'FAILED') return item.status === 'FAILED';
    return true;
  });

  const getStatusBadge = (status: QueuedSyncItem['status']) => {
    switch (status) {
      case 'SYNCED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{isAr ? 'تمت المزامنة' : 'Synced'}</span>
          </span>
        );
      case 'SYNCING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 animate-pulse">
            <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
            <span>{isAr ? 'جاري المزامنة...' : 'Syncing...'}</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>{isAr ? 'فشل' : 'Failed'}</span>
          </span>
        );
      case 'QUEUED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{isAr ? 'في الانتظار (أوفلاين)' : 'Queued (Offline)'}</span>
          </span>
        );
    }
  };

  return (
    <>
      {/* Header Pill Button */}
      <button
        id="btn-offline-sync-indicator"
        type="button"
        onClick={() => setIsOpen(true)}
        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
          !isOnline
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            : pendingCount > 0
            ? 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
        } ${className}`}
        title={
          isAr
            ? `حالة الاتصال وطابور المزامنة الخلفية مع أودو (${pendingCount} معلق)`
            : `Network Status & Background Odoo Sync Queue (${pendingCount} queued)`
        }
      >
        {/* Network & Pulsing dot */}
        <span className="relative flex h-2 w-2">
          {isOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </>
          )}
        </span>

        {/* Icon */}
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        )}

        {/* Text / Badge count */}
        <span className="hidden lg:inline text-[11px]">
          {!isOnline
            ? isAr
              ? 'وضع أوفلاين'
              : 'Offline Mode'
            : isAr
            ? 'متصل بأودو'
            : 'Odoo Connected'}
        </span>

        {pendingCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] animate-pulse">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Background Sync Queue Modal (rendered in body portal) */}
      {isOpen &&
        createPortal(
          <div
            id="modal-offline-sync-queue"
            className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl sm:max-w-3xl lg:max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sync-queue-modal-title"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="sync-queue-modal-title" className="font-bold text-base flex items-center gap-2">
                    <span>
                      {isAr
                        ? 'طابور المزامنة التلقائية الخلفية (Background Sync)'
                        : 'Background Sync Queue & Offline Manager'}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-md font-mono border border-slate-700">
                      IndexedDB + Service Worker
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isAr
                      ? 'مزامنة حركات التحويل المخزني وأوامر الإنتاج فور عودة الاتصال بخادم Odoo'
                      : 'Queues stock transfers & transactions offline and syncs with Odoo on reconnect'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-sync-modal"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats & Controls Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3.5 text-xs shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500">{isAr ? 'حالة الشبكة الحالية' : 'Network Connection'}</div>
                  <div className="font-bold flex items-center gap-1.5 mt-1">
                    {isOnline ? (
                      <>
                        <Wifi className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 text-sm">{isAr ? 'متصل بالإنترنت' : 'Online'}</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700 text-sm">{isAr ? 'غير متصل (أوفلاين)' : 'Offline'}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500">{isAr ? 'معلق في الطابور' : 'Queued Items'}</div>
                  <div className="font-bold text-amber-600 text-lg mt-0.5">{stats.queued}</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500">{isAr ? 'تمت مزامنتها بنجاح' : 'Synced to Odoo'}</div>
                  <div className="font-bold text-emerald-600 text-lg mt-0.5">{stats.synced}</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500">{isAr ? 'فشل المزامنة' : 'Sync Errors'}</div>
                  <div className="font-bold text-rose-600 text-lg mt-0.5">{stats.failed}</div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                {/* Offline Simulator Switch */}
                <button
                  type="button"
                  onClick={toggleSimulateOffline}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    simulatedOffline
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {simulatedOffline ? (
                    <ToggleRight className="w-5 h-5 text-amber-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                  )}
                  <span>
                    {isAr
                      ? simulatedOffline
                        ? 'محاكاة الأوفلاين مفعلة (تجربة طابور المزامنة)'
                        : 'تجربة وضع عدم الاتصال (Simulate Offline)'
                      : simulatedOffline
                      ? 'Simulated Offline Active'
                      : 'Simulate Offline Mode'}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  {stats.synced > 0 && (
                    <button
                      type="button"
                      onClick={clearSynced}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مسح المكتمل' : 'Clear Synced'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => triggerSync()}
                    disabled={isSyncing || !isOnline}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>
                      {isSyncing
                        ? isAr
                          ? 'جاري المزامنة...'
                          : 'Syncing...'
                        : isAr
                        ? 'مزامنة الكل مع أودو الآن'
                        : 'Sync All with Odoo'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isAr ? 'كافة السجلات' : 'All'} ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('QUEUED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedFilter === 'QUEUED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  {isAr ? 'في الانتظار' : 'Queued'} ({stats.queued})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('SYNCED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedFilter === 'SYNCED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {isAr ? 'تمت المزامنة' : 'Synced'} ({stats.synced})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('FAILED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedFilter === 'FAILED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  {isAr ? 'فشل المزامنة' : 'Failed'} ({stats.failed})
                </button>
              </div>
            </div>

            {/* Queue Items Table */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5 text-xs">
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <div className="p-3 bg-slate-100 rounded-2xl w-fit mx-auto text-slate-400">
                    <Layers className="w-10 h-10 mx-auto text-slate-400" />
                  </div>
                  <p className="font-bold text-sm text-slate-700">
                    {isAr ? 'لا توجد حركات في هذه الفئة' : 'No items found in this filter'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {isAr
                      ? 'عند إجراء تحويلات مخزنية أو أوامر إنتاج أثناء انقطاع الإنترنت، ستُحفظ هنا تلقائياً وتُرسل لخادم أودو بمجرد استعادة الاتصال.'
                      : 'When you post stock transfers offline, they will be safely queued here and synced to Odoo upon reconnection.'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {isAr ? item.titleAr : item.titleEn}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-bold border border-slate-200">
                            {item.documentNumber}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(item.queuedAt).toLocaleTimeString(
                              isAr ? 'ar-EG' : 'en-US',
                              { hour: '2-digit', minute: '2-digit', second: '2-digit' }
                            )}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-600 font-semibold">{item.odooModel}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status === 'FAILED' && (
                          <button
                            type="button"
                            onClick={() => retryItem(item.id)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg border border-sky-200 transition"
                            title={isAr ? 'إعادة المحاولة' : 'Retry'}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition"
                          title={isAr ? 'حذف من الطابور' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Details Snippet */}
                    {item.payload && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                        {item.payload.itemName && (
                          <div>
                            <span className="text-slate-400">{isAr ? 'الصنف:' : 'Item:'} </span>
                            <span className="font-bold text-slate-800">
                              {item.payload.itemName}
                            </span>
                          </div>
                        )}
                        {item.payload.quantity && (
                          <div>
                            <span className="text-slate-400">{isAr ? 'الكمية:' : 'Qty:'} </span>
                            <span className="font-bold text-slate-800">
                              {item.payload.quantity} {item.payload.uom || ''}
                            </span>
                          </div>
                        )}
                        {item.payload.totalValueEGP && (
                          <div>
                            <span className="text-slate-400">{isAr ? 'القيمة:' : 'Value:'} </span>
                            <span className="font-bold text-emerald-700 font-mono">
                              {item.payload.totalValueEGP.toLocaleString('en-US')} ج.م
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {item.error && (
                      <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{item.error}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs">
                <Server className="w-4 h-4 text-slate-500" />
                <span className="font-mono">
                  {isAr
                    ? `خادم أودو المستهدف: ${odooConfig?.serverUrl || 'https://demo.odoo.com'}`
                    : `Target Odoo Server: ${odooConfig?.serverUrl || 'https://demo.odoo.com'}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                {isAr ? 'إغلاق النافذة' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
