import React from 'react';
import { Building2, ShieldCheck, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatNumber } from '../../utils/formatters';
import { CompanyLogo } from '../common/CompanyLogo';

interface AuditPrintHeaderProps {
  reportTitleAr: string;
  reportTitleEn: string;
  reportSubtitleAr?: string;
  reportSubtitleEn?: string;
  activeFilterSummaryAr?: string;
  activeFilterSummaryEn?: string;
}

export const AuditPrintHeader: React.FC<AuditPrintHeaderProps> = ({
  reportTitleAr,
  reportTitleEn,
  reportSubtitleAr,
  reportSubtitleEn,
  activeFilterSummaryAr,
  activeFilterSummaryEn
}) => {
  const { language, currentUser } = useApp();
  const isAr = language === 'ar';

  const currentDate = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const documentRefNumber = `AUD-EGY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="print-only mb-6 border-b-2 border-slate-900 pb-4 text-slate-900" id="audit-print-header">
      {/* Top Enterprise Banner */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-300">
        <div className="flex items-start gap-3.5">
          <CompanyLogo className="w-12 h-12 text-slate-900 shrink-0" light={true} />
          <div className="space-y-1">
            <div className="text-base font-extrabold tracking-tight uppercase text-slate-900">
              {isAr
                ? 'الشركة العربية للدائن'
                : 'Arab Co. For Plastic'}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {isAr
                ? 'قطاع الشؤون المالية وحسابات التكاليف — الإدارة العامة للرقابة والتدقيق المخزني'
                : 'Financial Affairs & Cost Accounting Sector — General Audit & Inventory Control'}
            </div>
            <div className="text-[10px] text-slate-500">
              {isAr
                ? 'المنطقة الصناعية الثالثة، السادس من أكتوبر | س.ت: 89412 | ب.ض: 239-482-109'
                : '3rd Industrial Zone, 6th of October City, Egypt | CR: 89412 | Tax ID: 239-482-109'}
            </div>
          </div>
        </div>

        <div className="text-left font-mono text-[11px] space-y-1 shrink-0">
          <div className="font-bold text-xs text-slate-900 border border-slate-400 px-2 py-0.5 rounded bg-slate-100 inline-block">
            {isAr ? 'وثيقة تدقيق رسمية معتمدة' : 'Official Certified Audit'}
          </div>
          <div className="text-slate-600">
            <span className="font-semibold">{isAr ? 'كود المستند:' : 'Doc Ref:'} </span>
            <span className="font-bold text-slate-900">{documentRefNumber}</span>
          </div>
          <div className="text-slate-600">
            <span className="font-semibold">{isAr ? 'معيار الجودة:' : 'Standard:'} </span>
            <span>EAS 2 / IAS 2 & ISO 9001:2015</span>
          </div>
        </div>
      </div>

      {/* Main Report Title */}
      <div className="my-3 text-center space-y-1">
        <h1 className="text-lg font-black text-slate-950 tracking-tight">
          {isAr ? reportTitleAr : reportTitleEn}
        </h1>
        {(reportSubtitleAr || reportSubtitleEn) && (
          <p className="text-xs font-semibold text-slate-700">
            {isAr ? reportSubtitleAr : reportSubtitleEn}
          </p>
        )}
      </div>

      {/* Audit Metadata Summary Grid */}
      <div className="grid grid-cols-4 gap-2 text-[10px] bg-slate-100/90 p-2.5 rounded-lg border border-slate-300 font-medium">
        <div>
          <span className="text-slate-500 font-semibold block">{isAr ? 'تاريخ وساعة الإصدار:' : 'Issue Timestamp:'}</span>
          <span className="font-bold text-slate-900">{currentDate} - {currentTime}</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block">{isAr ? 'المسؤول / المدقق:' : 'Auditor / Issuer:'}</span>
          <span className="font-bold text-slate-900">
            {currentUser?.fullName || (isAr ? 'مدقق النظام المعتمد' : 'Certified System Auditor')} ({currentUser?.role || 'FINANCE_USER'})
          </span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block">{isAr ? 'طريقة تقييم المخزون:' : 'Costing Method:'}</span>
          <span className="font-bold text-slate-900">
            {isAr ? 'متوسط التكلفة المتحرك (MAC)' : 'Moving Average Cost (MAC)'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block">{isAr ? 'نطاق التصفية المطبق:' : 'Active Filter Scope:'}</span>
          <span className="font-bold text-slate-900 truncate block">
            {isAr ? (activeFilterSummaryAr || 'كافة المستودعات والأصناف') : (activeFilterSummaryEn || 'All Warehouses & Items')}
          </span>
        </div>
      </div>
    </div>
  );
};
