import React from 'react';
import { useApp } from '../../context/AppContext';

export const AuditPrintFooter: React.FC = () => {
  const { language, currentUser } = useApp();
  const isAr = language === 'ar';

  return (
    <div className="print-only mt-8 pt-4 border-t-2 border-slate-900 text-slate-900 print-avoid-break" id="audit-print-footer">
      {/* 3-Column Official Signatures Block */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Column 1: Prepared by */}
        <div className="border border-slate-400 rounded-lg p-3 bg-slate-50/50 space-y-4">
          <div className="text-xs font-bold text-slate-900 border-b border-slate-300 pb-1">
            {isAr ? '١. إعداد / مدقق المخزون والحركات' : '1. Prepared By / Inventory Auditor'}
          </div>
          <div className="space-y-1.5 text-[10px] text-slate-700">
            <div>
              <span className="font-semibold">{isAr ? 'الاسم:' : 'Name:'} </span>
              <span>{currentUser?.fullName || (isAr ? 'أمين المستودع العام' : 'Chief Warehouse Keeper')}</span>
            </div>
            <div>
              <span className="font-semibold">{isAr ? 'التاريخ:' : 'Date:'} </span>
              <span>____ / ____ / 2026</span>
            </div>
            <div className="pt-2">
              <span className="font-semibold block mb-1">{isAr ? 'التوقيع:' : 'Signature:'} </span>
              <div className="h-7 border-b border-dashed border-slate-400"></div>
            </div>
          </div>
        </div>

        {/* Column 2: Reviewed by */}
        <div className="border border-slate-400 rounded-lg p-3 bg-slate-50/50 space-y-4">
          <div className="text-xs font-bold text-slate-900 border-b border-slate-300 pb-1">
            {isAr ? '٢. مراجعة / رئيس حسابات التكاليف' : '2. Reviewed By / Cost Accounting Head'}
          </div>
          <div className="space-y-1.5 text-[10px] text-slate-700">
            <div>
              <span className="font-semibold">{isAr ? 'الاسم:' : 'Name:'} </span>
              <span>{isAr ? 'أ / إبراهيم العوضي' : 'Ibrahim El-Awady'}</span>
            </div>
            <div>
              <span className="font-semibold">{isAr ? 'التاريخ:' : 'Date:'} </span>
              <span>____ / ____ / 2026</span>
            </div>
            <div className="pt-2">
              <span className="font-semibold block mb-1">{isAr ? 'التوقيع:' : 'Signature:'} </span>
              <div className="h-7 border-b border-dashed border-slate-400"></div>
            </div>
          </div>
        </div>

        {/* Column 3: Approved by */}
        <div className="border border-slate-400 rounded-lg p-3 bg-slate-50/50 space-y-4">
          <div className="text-xs font-bold text-slate-900 border-b border-slate-300 pb-1">
            {isAr ? '٣. اعتماد / المدير المالي ومدير المصنع' : '3. Approved By / Plant GM & CFO'}
          </div>
          <div className="space-y-1.5 text-[10px] text-slate-700">
            <div>
              <span className="font-semibold">{isAr ? 'الاسم:' : 'Name:'} </span>
              <span>{isAr ? 'م / حسام الشناوي' : 'Hossam El-Shennawy'}</span>
            </div>
            <div>
              <span className="font-semibold">{isAr ? 'التاريخ:' : 'Date:'} </span>
              <span>____ / ____ / 2026</span>
            </div>
            <div className="pt-2">
              <span className="font-semibold block mb-1">{isAr ? 'خاتم الاعتماد الرسمي:' : 'Official Seal & Stamp:'} </span>
              <div className="h-7 border-b border-dashed border-slate-400"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Legal Disclaimer */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-200">
        <div>
          {isAr
            ? 'تنبيه سرية: هذا التقرير مستخرج إلكترونياً من قاعدة بيانات نظام مراقبة وتدقيق المخزون الصناعي وتكاليف الإنتاج ويخضع لضوابط التدقيق الداخلي.'
            : 'Confidentiality Notice: This report is automatically extracted from the Industrial Inventory & Costing Audit System and is governed by internal audit controls.'}
        </div>
        <div className="font-mono font-bold text-slate-700">
          {isAr ? 'صفحة مطبوعة من نظام المخزون المتكامل' : 'Printed page from Integrated Manufacturing ERP'}
        </div>
      </div>
    </div>
  );
};
