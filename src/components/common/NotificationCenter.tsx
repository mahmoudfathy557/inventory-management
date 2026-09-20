import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Factory,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  X,
  Filter,
  Layers,
  Sparkles,
  Info,
  Search,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationSeverity, NotificationType, ProductionOrderStatus } from '../../types';
import { formatNumber } from '../../utils/formatters';

interface NotificationCenterProps {
  onNavigate?: (tab: any) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const {
    language,
    currentUser,
    rawMaterials,
    products,
    productionOrders,
    receipts,
    landedCosts,
    odooConfig
  } = useApp();
  const isAr = language === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'PRODUCTION' | 'INVENTORY' | 'QUALITY' | 'UNREAD'>('ALL');
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const storageKey = currentUser ? `notifications_read_${currentUser.id}` : 'notifications_read_guest';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');

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

  // Persist read status per user
  const persistReadIds = (newReadIds: string[]) => {
    setReadIds(newReadIds);
    try {
      const storageKey = currentUser ? `notifications_read_${currentUser.id}` : 'notifications_read_guest';
      localStorage.setItem(storageKey, JSON.stringify(newReadIds));
    } catch (e) {
      console.error('Failed to persist read notifications', e);
    }
  };

  // Generate real-time dynamic notifications from the live business engine
  const dynamicNotifications: AppNotification[] = useMemo(() => {
    const list: AppNotification[] = [];

    // 1. Inventory Alerts: Critical Low Stock & Reorder Levels
    rawMaterials.forEach(m => {
      const qty = m.currentQty || 0;
      if (qty === 0) {
        list.push({
          id: `stock-zero-${m.id}`,
          type: 'INVENTORY_ALERT',
          severity: 'CRITICAL',
          titleAr: `نفاذ تام للمخزون: ${m.nameAr}`,
          titleEn: `Out of Stock: ${m.nameEn}`,
          messageAr: `وصل رصيد المادة الخام (${m.code}) إلى صفر كجم. يتطلب إصدار إذن توريد عاجل لتفادي توقف خطوط الإنتاج.`,
          messageEn: `Stock for raw material (${m.code}) reached 0 KG. Immediate inbound receipt required.`,
          timestamp: '2026-09-20T14:30:00',
          targetTab: 'receipts',
          targetId: m.id,
          read: readIds.includes(`stock-zero-${m.id}`),
          actionLabelAr: 'إصدار إذن إضافة',
          actionLabelEn: 'Create Receipt'
        });
      } else if (qty <= (m.reorderLevel || 0)) {
        list.push({
          id: `stock-low-${m.id}`,
          type: 'INVENTORY_ALERT',
          severity: 'WARNING',
          titleAr: `تنبيه حد إعادة الطلب: ${m.nameAr}`,
          titleEn: `Reorder Level Alert: ${m.nameEn}`,
          messageAr: `الرصيد المتاح (${formatNumber(qty, language)} ${m.defaultUOM}) أقل من أو يساوي نقطة الأمان (${m.reorderLevel} ${m.defaultUOM}).`,
          messageEn: `Available stock (${formatNumber(qty, language)} ${m.defaultUOM}) is below safety threshold (${m.reorderLevel} ${m.defaultUOM}).`,
          timestamp: '2026-09-20T13:45:00',
          targetTab: 'receipts',
          targetId: m.id,
          read: readIds.includes(`stock-low-${m.id}`),
          actionLabelAr: 'طلب توريد خامات',
          actionLabelEn: 'Order Material'
        });
      }
    });

    // 2. Production Milestones: Pending Quality Approval
    const pendingQualityOrders = productionOrders.filter(
      o => o.status === ProductionOrderStatus.PENDING_QUALITY || o.qualityStatus === 'PENDING'
    );
    pendingQualityOrders.forEach(o => {
      list.push({
        id: `prod-quality-${o.id}`,
        type: 'QUALITY_ALERT',
        severity: 'WARNING',
        titleAr: `بانتظار فحص الجودة: ${o.orderNumber}`,
        titleEn: `Pending Quality Inspection: ${o.orderNumber}`,
        messageAr: `اكتمل تشغيل دفعة ${o.productName} (${formatNumber(o.actualFinishedQuantity, language)} كجم) وبانتظار اعتماد المختبر للإفراج المخزني.`,
        messageEn: `Production batch of ${o.productName} (${formatNumber(o.actualFinishedQuantity, language)} KG) is awaiting QA approval.`,
        timestamp: '2026-09-20T12:00:00',
        targetTab: 'quality',
        targetId: o.id,
        read: readIds.includes(`prod-quality-${o.id}`),
        actionLabelAr: 'فحص واعتماد',
        actionLabelEn: 'Inspect Batch'
      });
    });

    // 3. Production Milestones: In-Production / Active Work Orders
    const inProdOrders = productionOrders.filter(
      o => o.status === ProductionOrderStatus.IN_PRODUCTION || o.status === ProductionOrderStatus.MATERIAL_ISSUED
    );
    inProdOrders.forEach(o => {
      list.push({
        id: `prod-active-${o.id}`,
        type: 'PRODUCTION_MILESTONE',
        severity: 'INFO',
        titleAr: `تشغيل جاري في خط الإنتاج: ${o.orderNumber}`,
        titleEn: `Active WIP Production: ${o.orderNumber}`,
        messageAr: `تم صرف الخامات وبدء التشغيل لمرحلة (${o.productionStage}) على الماكينة (${o.machineName || 'الخط الرئيسي'}).`,
        messageEn: `Materials issued and processing active at stage (${o.productionStage}) on (${o.machineName || 'Main Line'}).`,
        timestamp: '2026-09-20T11:15:00',
        targetTab: 'production',
        targetId: o.id,
        read: readIds.includes(`prod-active-${o.id}`),
        actionLabelAr: 'متابعة التشغيل',
        actionLabelEn: 'Track Order'
      });
    });

    // 4. Production Milestones: Completed Orders
    const completedOrders = productionOrders.filter(
      o => o.status === ProductionOrderStatus.COMPLETED
    );
    completedOrders.slice(0, 3).forEach(o => {
      list.push({
        id: `prod-done-${o.id}`,
        type: 'PRODUCTION_MILESTONE',
        severity: 'SUCCESS',
        titleAr: `إنجاز أمر الإنتاج: ${o.orderNumber}`,
        titleEn: `Order Completed: ${o.orderNumber}`,
        messageAr: `تم إغلاق الأمر بنجاح وتسليم ${formatNumber(o.actualFinishedQuantity, language)} كجم إلى مستودع المنتجات التامة.`,
        messageEn: `Successfully completed with ${formatNumber(o.actualFinishedQuantity, language)} KG transferred to Finished Goods.`,
        timestamp: '2026-09-20T09:30:00',
        targetTab: 'production',
        targetId: o.id,
        read: readIds.includes(`prod-done-${o.id}`),
        actionLabelAr: 'عرض تفاصيل التكلفة',
        actionLabelEn: 'View Costing'
      });
    });

    // 5. Landed Cost Allocation Alerts
    const receiptIdsWithLanded = new Set(landedCosts.map(lc => lc.originalReceiptId));
    const pendingLandedReceipts = receipts.filter(r => !receiptIdsWithLanded.has(r.id) && r.currency !== 'EGP');
    if (pendingLandedReceipts.length > 0) {
      list.push({
        id: 'landed-cost-pending-notice',
        type: 'COST_ALERT',
        severity: 'INFO',
        titleAr: `أذونات توريد بانتظار توزيع تكاليف الإنزال`,
        titleEn: `Receipts Pending Landed Cost Allocation`,
        messageAr: `يوجد ${pendingLandedReceipts.length} إذن توريد مستورد يتطلب توزيع مصاريف الشحن والجمارك لتحديث متوسط التكلفة المتحرك.`,
        messageEn: `${pendingLandedReceipts.length} imported receipts need freight/customs landed cost allocation.`,
        timestamp: '2026-09-20T08:00:00',
        targetTab: 'landed-costs',
        read: readIds.includes('landed-cost-pending-notice'),
        actionLabelAr: 'توزيع التكاليف',
        actionLabelEn: 'Allocate Costs'
      });
    }

    // Sort: Unread first, then by severity (CRITICAL > WARNING > INFO > SUCCESS)
    const severityWeight: Record<NotificationSeverity, number> = {
      CRITICAL: 4,
      WARNING: 3,
      INFO: 2,
      SUCCESS: 1
    };

    return list.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return severityWeight[b.severity] - severityWeight[a.severity];
    });
  }, [rawMaterials, products, productionOrders, receipts, landedCosts, readIds, language]);

  // Filtered Notifications
  const filteredList = dynamicNotifications.filter(n => {
    // Category filter
    if (filterCategory === 'PRODUCTION' && n.type !== 'PRODUCTION_MILESTONE') return false;
    if (filterCategory === 'INVENTORY' && n.type !== 'INVENTORY_ALERT') return false;
    if (filterCategory === 'QUALITY' && n.type !== 'QUALITY_ALERT') return false;
    if (filterCategory === 'UNREAD' && n.read) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAr = n.titleAr.toLowerCase().includes(q) || n.messageAr.toLowerCase().includes(q);
      const matchEn = n.titleEn.toLowerCase().includes(q) || n.messageEn.toLowerCase().includes(q);
      if (!matchAr && !matchEn) return false;
    }

    return true;
  });

  const unreadCount = dynamicNotifications.filter(n => !n.read).length;
  const criticalCount = dynamicNotifications.filter(n => !n.read && n.severity === 'CRITICAL').length;

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!readIds.includes(id)) {
      persistReadIds([...readIds, id]);
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = dynamicNotifications.map(n => n.id);
    persistReadIds(allIds);
  };

  const handleClearRead = () => {
    // Keep only read IDs that are currently visible
    setReadIds([]);
    try {
      const storageKey = currentUser ? `notifications_read_${currentUser.id}` : 'notifications_read_guest';
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = (item: AppNotification) => {
    handleMarkAsRead(item.id);
    if (item.targetTab && onNavigate) {
      onNavigate(item.targetTab);
      setIsOpen(false);
    }
  };

  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: AlertTriangle,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          labelAr: 'حرج',
          labelEn: 'Critical'
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          labelAr: 'تنبيه',
          labelEn: 'Warning'
        };
      case 'SUCCESS':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          labelAr: 'مكتمل',
          labelEn: 'Milestone'
        };
      default:
        return {
          icon: Info,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          labelAr: 'إشعار',
          labelEn: 'Info'
        };
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'PRODUCTION_MILESTONE':
        return <Factory className="w-4 h-4 text-purple-600" />;
      case 'INVENTORY_ALERT':
        return <Boxes className="w-4 h-4 text-blue-600" />;
      case 'QUALITY_ALERT':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <>
      {/* Bell Trigger Button */}
      <button
        id="btn-header-notification-center"
        type="button"
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }`}
        title={isAr ? 'مركز الإشعارات وتنبيهات الإنتاج والمخزون' : 'Notifications & Alerts'}
        aria-label="Notification Center"
      >
        <Bell className="w-4 h-4" />

        {/* Dynamic Badge Counter */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs ${
              criticalCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-blue-600'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Modal Dialog (rendered in body portal) */}
      {isOpen &&
        createPortal(
          <div
            id="modal-notification-center"
            className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl sm:max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-center-title"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-500/30 text-blue-300">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold flex items-center gap-2">
                    <h3 id="notification-center-title">
                      {isAr ? 'مركز التنبيهات والعمليات التشغيلية' : 'Operational Notifications & Alerts'}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500 text-xs font-mono font-bold">
                        {unreadCount} {isAr ? 'تنبيه جديد' : 'new'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentUser
                      ? (isAr ? `تنبيهات مخصصة للمستخدم: ${currentUser.fullName}` : `Live notifications for: ${currentUser.fullName}`)
                      : (isAr ? 'سجل أحداث وتنبيهات النظام اللحظية' : 'Live system events and critical inventory alerts')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    id="btn-notifications-mark-all-read"
                    onClick={handleMarkAllAsRead}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title={isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                  >
                    <CheckCheck className="w-4 h-4 text-blue-300" />
                    <span>{isAr ? 'قراءة الكل' : 'Mark all read'}</span>
                  </button>
                )}
                <button
                  type="button"
                  id="btn-close-notification-modal"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
              {/* Search Bar */}
              <div className="relative">
                <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث في التنبيهات والأصوام والمستندات...' : 'Search alerts by keyword, product, or order number...'}
                  className={`w-full py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs ${
                    isAr ? 'pr-9 pl-8' : 'pl-9 pr-8'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 ${isAr ? 'left-2' : 'right-2'}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5">
                <button
                  type="button"
                  onClick={() => setFilterCategory('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    filterCategory === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'} ({dynamicNotifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('UNREAD')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    filterCategory === 'UNREAD'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {isAr ? 'غير المقروء' : 'Unread'} ({unreadCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('PRODUCTION')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    filterCategory === 'PRODUCTION'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  {isAr ? 'أوامر الإنتاج' : 'Production'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('INVENTORY')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    filterCategory === 'INVENTORY'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {isAr ? 'المخزون والخامات' : 'Inventory'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('QUALITY')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    filterCategory === 'QUALITY'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  {isAr ? 'مراقبة الجودة' : 'Quality'}
                </button>
              </div>
            </div>

            {/* Notifications Scroll List */}
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2 sm:p-3 space-y-2">
              {filteredList.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="p-3 bg-slate-100 rounded-2xl w-fit mx-auto text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {searchQuery
                      ? (isAr ? 'لا توجد تنبيهات تطابق كلمة البحث' : 'No alerts match your search query')
                      : (isAr ? 'لا توجد تنبيهات في هذا التصنيف' : 'All clear! No notifications in this category')}
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {isAr
                      ? 'كافة مؤشرات الإنتاج، ومستويات المخزون، وفحوصات الجودة تعمل ضمن الحدود التشغيلية السليمة.'
                      : 'Production milestones, stock safety levels, and quality checks are operating normally.'}
                  </p>
                </div>
              ) : (
                filteredList.map(item => {
                  const badge = getSeverityBadge(item.severity);
                  const BadgeIcon = badge.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 sm:p-4 rounded-xl transition cursor-pointer flex flex-col sm:flex-row sm:items-start gap-3 group border ${
                        item.read
                          ? 'bg-white hover:bg-slate-50 border-slate-200 opacity-80'
                          : 'bg-blue-50/50 hover:bg-blue-50/80 border-blue-200 shadow-2xs'
                      }`}
                    >
                      {/* Leading Category / Severity Icon */}
                      <div className="flex items-center gap-2.5 sm:block shrink-0">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                          {getTypeIcon(item.type)}
                        </div>
                        <span className={`sm:hidden px-2 py-0.5 rounded-md text-xs font-bold border ${badge.bg}`}>
                          {isAr ? badge.labelAr : badge.labelEn}
                        </span>
                      </div>

                      {/* Content Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-bold text-sm ${item.read ? 'text-slate-800' : 'text-slate-950'}`}>
                            {isAr ? item.titleAr : item.titleEn}
                          </h4>
                          <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-md text-xs font-bold border ${badge.bg}`}>
                            {isAr ? badge.labelAr : badge.labelEn}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {isAr ? item.messageAr : item.messageEn}
                        </p>

                        {/* Action & Footer Bar */}
                        <div className="flex items-center justify-between pt-1.5 text-xs text-slate-500">
                          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(item.timestamp).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {item.actionLabelAr && (
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-700 font-bold group-hover:underline flex items-center gap-1 text-xs"
                              >
                                <span>{isAr ? item.actionLabelAr : item.actionLabelEn}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {!item.read && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkAsRead(item.id, e)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                                title={isAr ? 'تحديد كمقروء' : 'Mark as read'}
                              >
                                <span>✓</span>
                                <span className="hidden sm:inline">{isAr ? 'كمقروء' : 'Read'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Bar */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="font-medium">
                {isAr
                  ? `إجمالي التنبيهات: ${dynamicNotifications.length} (${unreadCount} غير مقروء)`
                  : `Total Notifications: ${dynamicNotifications.length} (${unreadCount} unread)`}
              </span>
              {readIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRead}
                  className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إعادة ضبط حالة المقروء' : 'Reset Read State'}</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
