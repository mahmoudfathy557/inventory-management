import React from 'react';
import { useApp } from '../../context/AppContext';

interface StatusChipProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'md' }) => {
  const { language } = useApp();
  const isAr = language === 'ar';

  const statusConfig: Record<string, { ar: string; en: string; bg: string; text: string; border: string }> = {
    POSTED: { ar: 'مرحل ومسجل', en: 'Posted', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    CANCELLED: { ar: 'ملغي / معكوس', en: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    DRAFT: { ar: 'مسودة', en: 'Draft', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
    PENDING_APPROVAL: { ar: 'بانتظار الاعتماد', en: 'Pending Approval', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    APPROVED: { ar: 'معتمد', en: 'Approved', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    RELEASED: { ar: 'مُطلق للتشغيل', en: 'Released', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    IN_PRODUCTION: { ar: 'تحت التشغيل', en: 'In Production', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    MATERIAL_ISSUED: { ar: 'تم صرف الخامات', en: 'Material Issued', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    PENDING_QUALITY: { ar: 'بانتظار فحص الجودة', en: 'Pending Quality', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300' },
    COMPLETED: { ar: 'مكتمل بالكامل', en: 'Completed', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    CLOSED: { ar: 'مغلق', en: 'Closed', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    REJECTED: { ar: 'مرفوض', en: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    ACTIVE: { ar: 'نشط', en: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    INACTIVE: { ar: 'غير نشط', en: 'Inactive', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-300' }
  };

  const current = statusConfig[status] || {
    ar: status,
    en: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300'
  };

  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${current.bg} ${current.text} ${current.border} ${padding} whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      <span>{isAr ? current.ar : current.en}</span>
    </span>
  );
};
