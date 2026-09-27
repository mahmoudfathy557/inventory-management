import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Shield,
  Clock,
  User,
  Filter,
  Layers,
  Sparkles,
  Printer
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportToCSV } from '../../utils/formatters';
import { PrintPreviewModal } from '../common/PrintPreviewModal';

export const GlobalAuditReport: React.FC = () => {
  const { language, auditLogs, branding } = useApp();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const filteredLogs = auditLogs.filter(log => {
    if (selectedAction !== 'ALL' && !log.action.includes(selectedAction)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.userName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.documentNumber || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const headers = [
      isAr ? 'التاريخ والوقت' : 'Timestamp',
      isAr ? 'المستخدم' : 'User',
      isAr ? 'نوع العملية / الإجراء' : 'Action',
      isAr ? 'رقم المستند' : 'Document No',
      isAr ? 'التفاصيل وبيانات التغيير' : 'Details & Audit Changes'
    ];

    const rows = filteredLogs.map(l => [
      `${l.date} ${l.time}`,
      l.userName,
      l.action,
      l.documentNumber || '-',
      l.details
    ]);

    exportToCSV(headers, rows, 'Global_Audit_Log');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'سجل التدقيق الشامل للعمليات والتغييرات (Section 35)' : 'Global Audit Log (Section 35)'}</span>
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'تتبع تاريخي غير قابل للتعديل لجميع العمليات: إنشاء، تعديل، اعتمادات، إلغاءات، ترحيل المخزون، وتغييرات التكاليف'
              : 'Immutable audit trail tracking all creations, edits, approvals, cancellations, postings, and cost changes.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintPreview(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            title={isAr ? 'معاينة وطباعة تقرير التدقيق الرسمي مع شعار الشركة' : 'Print / Preview Audit Report with Company Logo'}
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'طباعة ومعاينة التقرير' : 'Print / Preview'}</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            title={isAr ? 'تصدير سجل التدقيق إلى ملف CSV' : 'Export Audit Log to CSV'}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث بالمستخدم، نوع الإجراء، رقم المستند، التفاصيل...' : 'Search user, action, doc no, details...'}
            className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">{isAr ? 'فئة الإجراء:' : 'Action Type:'}</span>
          <select
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
          >
            <option value="ALL">{isAr ? 'جميع العمليات' : 'All Actions'}</option>
            <option value="RECEIPT">{isAr ? 'إذن إضافة مخزني' : 'Receipt'}</option>
            <option value="ISSUE">{isAr ? 'إذن صرف خامات' : 'Issue'}</option>
            <option value="PRODUCTION">{isAr ? 'أوامر الإنتاج والتشغيل' : 'Production'}</option>
            <option value="QUALITY">{isAr ? 'اعتمادات الجودة' : 'Quality'}</option>
            <option value="LANDED_COST">{isAr ? 'تكلفة إنزال' : 'Landed Cost'}</option>
            <option value="CANCEL">{isAr ? 'إلغاء / عكس حركة' : 'Cancellation / Reversal'}</option>
            <option value="ODOO">{isAr ? 'مزامنة أودو' : 'Odoo Sync'}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">{isAr ? 'التاريخ والوقت' : 'Timestamp'}</th>
                <th className="p-2.5">{isAr ? 'المستخدم' : 'User'}</th>
                <th className="p-2.5">{isAr ? 'نوع العملية' : 'Action'}</th>
                <th className="p-2.5">{isAr ? 'رقم المستند' : 'Document No'}</th>
                <th className="p-2.5">{isAr ? 'التفاصيل وبيانات التدقيق' : 'Details & Trail'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-2.5 text-slate-600 whitespace-nowrap">{l.date} {l.time}</td>
                  <td className="p-2.5 font-sans font-medium text-slate-900">{l.userName}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-slate-800 font-mono">
                    {l.documentNumber || '-'}
                  </td>
                  <td className="p-2.5 font-sans text-slate-700 max-w-md">
                    {l.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                    {isAr ? 'لا توجد سجلات تدقيق مطابقة' : 'No audit log records found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Audit Print Preview Modal */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        reportTitleAr="سجل التدقيق الشامل للعمليات والتغييرات (Section 35)"
        reportTitleEn="Global Operations & Changes Audit Log Report (Section 35)"
        reportSubtitleAr="كشف رسمي معتمد بالتدقيق المحاسبي والعملياتي غير القابل للتعديل لكافة حركات المخزون والإنتاج"
        reportSubtitleEn="Certified Official Statement of Audit Trail and Operating Ledger for All Inventory & Manufacturing Movements"
        documentNumber={`AUD-LOG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`}
        categoryLabelAr={selectedAction === 'ALL' ? 'كافة فئات الإجراءات' : selectedAction}
        categoryLabelEn={selectedAction === 'ALL' ? 'All Action Types' : selectedAction}
        filterScopeAr={`الفئة: ${selectedAction} | عدد العمليات: ${filteredLogs.length}`}
        filterScopeEn={`Action Type: ${selectedAction} | Records: ${filteredLogs.length}`}
        summaryCards={[
          { labelAr: 'إجمالي السجلات المدققة', labelEn: 'Total Audited Records', value: filteredLogs.length, isNumber: true, variant: 'default' },
          { labelAr: 'حركات الإضافة والتسليم', labelEn: 'Receipts & Issues', value: filteredLogs.filter(l => l.action.includes('RECEIPT') || l.action.includes('ISSUE')).length, isNumber: true, variant: 'info' },
          { labelAr: 'أوامر الإنتاج والتشغيل', labelEn: 'Production Actions', value: filteredLogs.filter(l => l.action.includes('PROD')).length, isNumber: true, variant: 'success' },
          { labelAr: 'اعتمادات الجودة والتكاليف', labelEn: 'Quality & Landed Costs', value: filteredLogs.filter(l => l.action.includes('QUALITY') || l.action.includes('COST')).length, isNumber: true, variant: 'default' }
        ]}
        notes={
          isAr
            ? 'سجل تدقيق رقمي محمي ومطابق لمعايير الرقابة الداخلية وإجراءات ISO 9001، غير قابل للتعديل بعد الترحيل والاعتماد.'
            : 'Protected digital audit trail complying with internal control standards and ISO 9001 procedures.'
        }
        columns={[
          { key: 'date', headerAr: 'التاريخ والوقت', headerEn: 'Timestamp', isMono: true, width: '130px' },
          { key: 'user', headerAr: 'المستخدم المسؤول', headerEn: 'Authorized User', width: '140px' },
          { key: 'action', headerAr: 'نوع العملية', headerEn: 'Action Type', width: '120px' },
          { key: 'doc', headerAr: 'رقم المستند', headerEn: 'Document Ref', isMono: true, width: '120px' },
          { key: 'details', headerAr: 'تفاصيل العملية وبيانات التغيير', headerEn: 'Audit Details & Value Changes' }
        ]}
        rows={filteredLogs.map(l => [
          `${l.date} ${l.time}`,
          l.userName,
          l.action,
          l.documentNumber || '-',
          l.details
        ])}
      />
    </div>
  );
};
