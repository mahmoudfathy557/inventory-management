import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  X,
  Factory,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileSpreadsheet,
  Copy,
  Check,
  Sparkles,
  Layers,
  Settings2,
  Eye,
  Building2,
  FileText,
  Sliders,
  Calendar,
  Clock,
  User,
  Hash,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export interface PrintPreviewColumn {
  key: string;
  headerAr: string;
  headerEn: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  isMono?: boolean;
}

export interface PrintPreviewSummaryItem {
  labelAr: string;
  labelEn: string;
  value: string | number;
  isCurrency?: boolean;
  isNumber?: boolean;
  highlight?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface PrintPreviewMetadataItem {
  labelAr: string;
  labelEn: string;
  value: string | number;
  isMono?: boolean;
}

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Titles & Identifiers
  reportTitleAr: string;
  reportTitleEn: string;
  reportSubtitleAr?: string;
  reportSubtitleEn?: string;
  documentNumber?: string;
  documentDate?: string;
  statusBadge?: {
    labelAr: string;
    labelEn: string;
    variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  };
  categoryLabelAr?: string;
  categoryLabelEn?: string;
  filterScopeAr?: string;
  filterScopeEn?: string;
  // Metadata & Details Grid
  metadata?: PrintPreviewMetadataItem[];
  // Table Data
  columns?: PrintPreviewColumn[];
  rows?: (string | number | React.ReactNode)[][];
  // Summary & Totals
  summaryCards?: PrintPreviewSummaryItem[];
  financialSummary?: { labelAr: string; labelEn: string; value: number }[];
  // Notes & Directives
  notes?: string;
  // Signatures
  signatures?: {
    preparedBy?: { name: string; titleAr: string; titleEn: string; date?: string };
    reviewedBy?: { name: string; titleAr: string; titleEn: string; date?: string };
    approvedBy?: { name: string; titleAr: string; titleEn: string; date?: string };
  };
  // Custom Content injection
  customContent?: React.ReactNode;
  // Layout defaults
  defaultOrientation?: 'landscape' | 'portrait';
  onExportCSV?: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  reportTitleAr,
  reportTitleEn,
  reportSubtitleAr,
  reportSubtitleEn,
  documentNumber,
  documentDate,
  statusBadge,
  categoryLabelAr,
  categoryLabelEn,
  filterScopeAr,
  filterScopeEn,
  metadata,
  columns,
  rows,
  summaryCards,
  financialSummary,
  notes,
  signatures,
  customContent,
  defaultOrientation = 'landscape',
  onExportCSV
}) => {
  const { language, currentUser } = useApp();
  const isAr = language === 'ar';

  // Preview display settings
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(defaultOrientation);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [colorMode, setColorMode] = useState<'color' | 'monochrome'>('color');
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showSummaryCards, setShowSummaryCards] = useState<boolean>(true);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Sync orientation with prop change when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrientation(defaultOrientation);
      setZoomScale(100);
    }
  }, [isOpen, defaultOrientation]);

  // Handle keyboard shortcuts (Escape to close, Ctrl+P / Cmd+P to print)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleTriggerPrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const docRef =
    documentNumber ||
    `AUD-REF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const currentDateFormatted =
    documentDate ||
    new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  const currentTimeFormatted = new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const textToCopy = `
=== ${isAr ? reportTitleAr : reportTitleEn} ===
${isAr ? 'رقم المستند/المرجع:' : 'Document Reference:'} ${docRef}
${isAr ? 'التاريخ:' : 'Date:'} ${currentDateFormatted} ${currentTimeFormatted}
${isAr ? 'المُعد/المسؤول:' : 'Prepared By:'} ${currentUser?.fullName || 'Admin'}
${metadata ? metadata.map(m => `${isAr ? m.labelAr : m.labelEn}: ${m.value}`).join('\n') : ''}
${summaryCards ? summaryCards.map(s => `${isAr ? s.labelAr : s.labelEn}: ${s.value}`).join('\n') : ''}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const getStatusBadgeStyle = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'danger':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getSummaryCardStyle = (variant?: string) => {
    if (colorMode === 'monochrome') {
      return 'bg-white border-slate-400 text-slate-900';
    }
    switch (variant) {
      case 'success':
        return 'bg-emerald-50/80 border-emerald-200 text-emerald-950';
      case 'warning':
        return 'bg-amber-50/80 border-amber-200 text-amber-950';
      case 'danger':
        return 'bg-rose-50/80 border-rose-200 text-rose-950';
      case 'info':
        return 'bg-blue-50/80 border-blue-200 text-blue-950';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  return (
    <div
      id="modal-print-preview"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:bg-white animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Container */}
      <div
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-7xl flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:h-auto print:border-0 print:shadow-none print:bg-white print:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-preview-modal-title"
      >
        {/* Top Floating Action & Configuration Toolbar (Screen Only) */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 no-print">
          {/* Left: Modal Title & Quick Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="print-preview-modal-title" className="font-bold text-sm sm:text-base text-white">
                  {isAr ? 'معاينة الطباعة الرسمية المعتمدة' : 'Official Certified Print Preview'}
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-500/30">
                  {orientation === 'landscape' ? (isAr ? 'عرضي A4' : 'A4 Landscape') : (isAr ? 'طولي A4' : 'A4 Portrait')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'عرض محاكي لشكل الصفحة المطبوعة وتوزيع البيانات قبل إصدار أمر الطباعة الفعلي'
                  : 'High-fidelity visual confirmation of layout, letterhead, and tables before printing'}
              </p>
            </div>
          </div>

          {/* Right: Primary Print Action & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Summary */}
            <button
              type="button"
              id="btn-preview-copy-summary"
              onClick={handleCopySummary}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title={isAr ? 'نسخ ملخص التقرير إلى الحافظة' : 'Copy summary to clipboard'}
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copiedSummary ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الملخص' : 'Copy')}</span>
            </button>

            {/* Export CSV if provided */}
            {onExportCSV && (
              <button
                type="button"
                id="btn-preview-export-csv"
                onClick={onExportCSV}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-emerald-600"
                title={isAr ? 'تصدير بيانات الجدول إلى ملف CSV' : 'Export Table Data to CSV'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isAr ? 'تصدير CSV' : 'CSV'}</span>
              </button>
            )}

            {/* Primary Print Button */}
            <button
              type="button"
              id="btn-trigger-print-now"
              onClick={handleTriggerPrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Ctrl + P"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة المستند الآن' : 'Print Now'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="btn-close-print-preview"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Interactive Format Bar (Screen Only) */}
        <div className="px-4 py-2.5 bg-slate-950 text-slate-300 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 no-print">
          {/* Orientation and View Style */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">
              {isAr ? 'تنسيق الصفحة:' : 'Layout:'}
            </span>

            {/* Orientation Toggle */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  orientation === 'landscape' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr ? 'عرضي (Landscape)' : 'Landscape'}
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  orientation === 'portrait' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr ? 'طولي (Portrait)' : 'Portrait'}
              </button>
            </div>

            {/* Color Mode Toggle */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setColorMode('color')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  colorMode === 'color' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr ? 'ألوان كاملة' : 'Full Color'}
              </button>
              <button
                type="button"
                onClick={() => setColorMode('monochrome')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  colorMode === 'monochrome' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isAr ? 'توفير الحبر وتحديد الخطوط بالأبيض والأسود' : 'High contrast ink-saving mode'}
              >
                {isAr ? 'توفير الحبر (B&W)' : 'Ink Saver'}
              </button>
            </div>
          </div>

          {/* Display Toggles */}
          <div className="flex items-center gap-3 overflow-x-auto text-[11px]">
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showHeader}
                onChange={(e) => setShowHeader(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-700"
              />
              <span>{isAr ? 'الترويسة الرسمية' : 'Letterhead'}</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-700"
              />
              <span>{isAr ? 'خانة التوقيعات' : 'Signatures'}</span>
            </label>

            {summaryCards && summaryCards.length > 0 && (
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showSummaryCards}
                  onChange={(e) => setShowSummaryCards(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span>{isAr ? 'بطاقات الإجماليات' : 'KPI Cards'}</span>
              </label>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(70, prev - 10))}
                className="p-1 text-slate-400 hover:text-white"
                title={isAr ? 'تصغير' : 'Zoom Out'}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px] w-9 text-center text-slate-300">{zoomScale}%</span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(140, prev + 10))}
                className="p-1 text-slate-400 hover:text-white"
                title={isAr ? 'تكبير' : 'Zoom In'}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(100)}
                className="px-1 text-[10px] text-blue-400 hover:underline"
              >
                100%
              </button>
            </div>
          </div>
        </div>

        {/* Paper Sheet Preview Workspace Area (Screen Scrollable) */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
          {/* Simulated Printed Paper Page Sheet */}
          <div
            id="printable-report-sheet"
            style={{
              transform: `scale(${zoomScale / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className={`bg-white text-slate-900 border border-slate-300 shadow-2xl p-6 sm:p-10 rounded-sm font-sans my-2 print:m-0 print:p-0 print:border-0 print:shadow-none print:transform-none ${
              orientation === 'landscape'
                ? 'w-full max-w-[1120px] min-h-[780px]'
                : 'w-full max-w-[840px] min-h-[1100px]'
            } ${colorMode === 'monochrome' ? 'grayscale contrast-125' : ''}`}
          >
            {/* 1. Official Enterprise Letterhead Header */}
            {showHeader && (
              <div className="border-b-2 border-slate-900 pb-4 mb-5 text-slate-900">
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-300">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shrink-0 print:border print:border-slate-800">
                      <Factory className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-base font-extrabold text-slate-950 tracking-tight">
                        {isAr
                          ? 'الشركة الحديثة للصناعات البلاستيكية والبوليمرات المتطورة'
                          : 'Modern Plastics & Advanced Industrial Polymers S.A.E.'}
                      </h1>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        {isAr
                          ? 'قطاع الإدارة المالية وحسابات التكاليف — الإدارة العامة للرقابة والتدقيق المخزني'
                          : 'Finance & Cost Accounting Directorate — General Audit & Inventory Control'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {isAr
                          ? 'المنطقة الصناعية الثالثة، السادس من أكتوبر | س.ت: 89412 | ب.ض: 239-482-109'
                          : '3rd Industrial Zone, 6th of October City, Egypt | CR: 89412 | Tax ID: 239-482-109'}
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-mono text-[11px] space-y-1 shrink-0">
                    <div className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-400 px-2.5 py-0.5 rounded inline-block">
                      {isAr ? 'وثيقة رسمية معتمدة' : 'Official Document'}
                    </div>
                    <div className="text-slate-600">
                      <span className="font-semibold">{isAr ? 'رقم المستند:' : 'Doc Ref:'} </span>
                      <span className="font-bold text-slate-900">{docRef}</span>
                    </div>
                    <div className="text-slate-600">
                      <span className="font-semibold">{isAr ? 'التاريخ:' : 'Date:'} </span>
                      <span>{currentDateFormatted}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Main Document Title & Subtitle Banner */}
            <div className="text-center my-4 py-3 bg-slate-100/90 rounded-xl border border-slate-300 print:bg-slate-100">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
                  {isAr ? reportTitleAr : reportTitleEn}
                </h2>
                {statusBadge && (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadgeStyle(
                      statusBadge.variant
                    )}`}
                  >
                    {isAr ? statusBadge.labelAr : statusBadge.labelEn}
                  </span>
                )}
              </div>
              {(reportSubtitleAr || reportSubtitleEn) && (
                <p className="text-xs font-semibold text-slate-700 mt-1 max-w-3xl mx-auto">
                  {isAr ? reportSubtitleAr : reportSubtitleEn}
                </p>
              )}
            </div>

            {/* 3. Scope & Audit Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 print:border-slate-300">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">
                  {isAr ? 'تاريخ ووقت التحرير:' : 'Issue Timestamp:'}
                </span>
                <span className="font-bold font-mono text-slate-900">
                  {currentDateFormatted} - {currentTimeFormatted}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">
                  {isAr ? 'المسؤول / المُعد:' : 'Prepared / Auditor:'}
                </span>
                <span className="font-bold text-slate-900">
                  {currentUser?.fullName || (isAr ? 'مدير النظام المعتمد' : 'System Admin')}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">
                  {isAr ? 'معيار التقييم المعتمد:' : 'Costing Standard:'}
                </span>
                <span className="font-bold text-slate-900">
                  {isAr ? 'متوسط التكلفة المتحرك (MAC)' : 'Moving Average Cost (MAC)'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">
                  {isAr ? 'نطاق التصفية المطبق:' : 'Active Filter Scope:'}
                </span>
                <span className="font-bold text-slate-900 truncate block">
                  {isAr
                    ? filterScopeAr || (categoryLabelAr ? `الفئة: ${categoryLabelAr}` : 'كافة المستودعات والأصناف')
                    : filterScopeEn || (categoryLabelEn ? `Category: ${categoryLabelEn}` : 'All Warehouses & Items')}
                </span>
              </div>
            </div>

            {/* 4. Optional Metadata Key-Value Grid */}
            {metadata && metadata.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs print:bg-white print:border-slate-300">
                {metadata.map((item, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="text-slate-500 text-[11px] font-semibold">
                      {isAr ? item.labelAr : item.labelEn}
                    </div>
                    <div
                      className={`text-slate-950 font-bold ${
                        item.isMono || typeof item.value === 'number' ? 'font-mono' : ''
                      }`}
                    >
                      {typeof item.value === 'number' ? formatNumber(item.value, language) : item.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Summary KPI Cards if provided */}
            {showSummaryCards && summaryCards && summaryCards.length > 0 && (
              <div
                className={`grid grid-cols-2 ${
                  summaryCards.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'
                } gap-2.5 my-4 print-avoid-break`}
              >
                {summaryCards.map((card, cIdx) => (
                  <div
                    key={cIdx}
                    className={`p-3 rounded-xl border ${getSummaryCardStyle(card.variant)} space-y-1 shadow-2xs`}
                  >
                    <div className="text-[11px] font-semibold opacity-80">
                      {isAr ? card.labelAr : card.labelEn}
                    </div>
                    <div className="text-base font-bold font-mono">
                      {card.isCurrency && typeof card.value === 'number'
                        ? formatCurrency(card.value, language)
                        : card.isNumber && typeof card.value === 'number'
                        ? formatNumber(card.value, language)
                        : card.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. Custom Content Injection if provided */}
            {customContent && <div className="my-4">{customContent}</div>}

            {/* 7. Primary Data Table */}
            {columns && rows && rows.length > 0 && (
              <div className="my-5 overflow-x-auto rounded-xl border border-slate-300">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-200 text-center w-10">#</th>
                      {columns.map((col, idx) => (
                        <th
                          key={idx}
                          style={{ width: col.width }}
                          className={`p-2.5 border-r border-slate-200 last:border-r-0 ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'left'
                              ? 'text-left'
                              : isAr
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {isAr ? col.headerAr : col.headerEn}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={rIdx % 2 === 1 ? 'bg-slate-50/70 print:bg-slate-50' : 'bg-white'}
                      >
                        <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px] text-slate-500 font-bold">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => {
                          const colMeta = columns[cIdx];
                          const isNumeric = typeof cell === 'number';
                          return (
                            <td
                              key={cIdx}
                              className={`p-2.5 border-r border-slate-200 last:border-r-0 text-slate-900 font-medium ${
                                colMeta?.isMono || isNumeric ? 'font-mono' : ''
                              } ${
                                colMeta?.align === 'center'
                                  ? 'text-center'
                                  : colMeta?.align === 'left'
                                  ? 'text-left'
                                  : isAr
                                  ? 'text-right'
                                  : 'text-left'
                              }`}
                            >
                              {isNumeric ? formatNumber(cell as number, language) : cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 8. Financial Summary & Totals Breakdown (Right-Aligned) */}
            {financialSummary && financialSummary.length > 0 && (
              <div className="my-4 flex justify-end print-avoid-break">
                <div className="w-80 bg-slate-50 rounded-xl p-3.5 border border-slate-300 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>{isAr ? 'الإجماليات والملخص المالي' : 'Financial Totals Summary'}</span>
                  </div>
                  {financialSummary.map((sum, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 last:border-b-0 last:pt-1 last:font-black"
                    >
                      <span className="text-slate-700 font-semibold">
                        {isAr ? sum.labelAr : sum.labelEn}:
                      </span>
                      <span className="font-bold font-mono text-slate-950 text-sm">
                        {formatCurrency(sum.value, language)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. Official Notes & Directives Callout */}
            {notes && (
              <div className="my-4 p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs print:bg-white print:border-slate-300 print-avoid-break">
                <span className="font-bold text-slate-900">{isAr ? 'ملاحظات وتوجيهات الرقابة: ' : 'Directives & Notes: '}</span>
                <span className="text-slate-700">{notes}</span>
              </div>
            )}

            {/* 10. 3-Column Formal Authorization & Signatures Block */}
            {showSignatures && (
              <div className="mt-8 pt-5 border-t-2 border-slate-900 print-avoid-break">
                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  {/* Prepared By */}
                  <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/40 space-y-4 print:bg-white">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      {signatures?.preparedBy?.titleAr || (isAr ? '١. إعداد / مدقق المخزون' : '1. Prepared By / Auditor')}
                    </div>
                    <div className="space-y-1 text-slate-700 text-[11px]">
                      <div className="font-bold">
                        {signatures?.preparedBy?.name || currentUser?.fullName || (isAr ? 'م. أحمد كمال' : 'Eng. Ahmed Kamal')}
                      </div>
                      <div className="font-mono text-slate-500 text-[10px]">
                        {signatures?.preparedBy?.date || currentDateFormatted}
                      </div>
                      <div className="pt-2">
                        <div className="h-8 border-b border-dashed border-slate-400"></div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{isAr ? 'التوقيع المعتمد' : 'Signature'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Reviewed By */}
                  <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/40 space-y-4 print:bg-white">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      {signatures?.reviewedBy?.titleAr || (isAr ? '٢. مراجعة / رئيس حسابات التكاليف' : '2. Cost Accounting Review')}
                    </div>
                    <div className="space-y-1 text-slate-700 text-[11px]">
                      <div className="font-bold">
                        {signatures?.reviewedBy?.name || (isAr ? 'أ. سمير إبراهيم' : 'Samir Ibrahim')}
                      </div>
                      <div className="font-mono text-slate-500 text-[10px]">
                        {signatures?.reviewedBy?.date || currentDateFormatted}
                      </div>
                      <div className="pt-2">
                        <div className="h-8 border-b border-dashed border-slate-400"></div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{isAr ? 'التوقيع المعتمد' : 'Signature'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Approved By */}
                  <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/40 space-y-4 print:bg-white">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      {signatures?.approvedBy?.titleAr || (isAr ? '٣. اعتماد / المدير المالي ومدير المصنع' : '3. Plant GM & CFO Approval')}
                    </div>
                    <div className="space-y-1 text-slate-700 text-[11px]">
                      <div className="font-bold">
                        {signatures?.approvedBy?.name || (isAr ? 'م. حسام الشناوي' : 'Hossam El-Shennawy')}
                      </div>
                      <div className="font-mono text-slate-500 text-[10px]">
                        {signatures?.approvedBy?.date || currentDateFormatted}
                      </div>
                      <div className="pt-2">
                        <div className="h-8 border-b border-dashed border-slate-400"></div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{isAr ? 'الخاتم والاعتماد' : 'Official Seal'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 11. Compliance Legal Disclaimer & Page Footer */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[10px] text-slate-500 print-avoid-break">
              <div>
                {isAr
                  ? 'وثيقة معتمدة ومطابقة للمعايير المحاسبية والصناعية EAS 2 / IAS 2 ونظام إدارة الجودة ISO 9001:2015'
                  : 'Certified document conforming with EAS 2 / IAS 2 Inventories Standard and ISO 9001:2015.'}
              </div>
              <div className="font-mono font-bold text-slate-700">
                {isAr ? 'صفحة ١ من ١ — نظام إدارة وتدقيق المخزون' : 'Page 1 of 1 — Manufacturing ERP'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Status Bar (Screen Only) */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isAr
                ? 'جاهز للطباعة بدقة عالية (A4) — يمكنك التبديل بين الوضع العرضي والطولي أو تعديل نسبة العرض'
                : 'Ready for High-Res Print (A4) — Switch between Landscape/Portrait or toggle ink-saver mode'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'تأكيد والطباعة الآن' : 'Confirm & Print'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
