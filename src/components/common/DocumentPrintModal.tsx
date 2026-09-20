import React from 'react';
import { Printer, X, Factory, CheckCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface DocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleAr: string;
  titleEn: string;
  documentNumber: string;
  documentDate: string;
  status: string;
  createdBy: string;
  createdDate?: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
  details: { labelAr: string; labelEn: string; value: string | number }[];
  tableHeaders?: { ar: string; en: string }[];
  tableRows?: (string | number)[][];
  financialSummary?: { labelAr: string; labelEn: string; value: number }[];
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  isOpen,
  onClose,
  titleAr,
  titleEn,
  documentNumber,
  documentDate,
  status,
  createdBy,
  createdDate,
  approvedBy,
  approvalDate,
  notes,
  details,
  tableHeaders,
  tableRows,
  financialSummary
}) => {
  const { language } = useApp();
  const isAr = language === 'ar';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold">
              {isAr ? `معاينة وطباعة السند الرسمي (${documentNumber})` : `Print Official Document (${documentNumber})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة المستند' : 'Print Now'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-800 font-sans print:p-0 print:m-0" id="printable-voucher">
          {/* Company Letterhead */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                <Factory className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  الشركة الحديثة للصناعات البلاستيكية والبوليمرات
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Modern Plastics & Industrial Polymers Co. | سجل تجاري: 89412 - قنا / السادس من أكتوبر
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  نظام إدارة المخزون والتصنيع المتكامل - معتمد للرقابة الصناعية
                </p>
              </div>
            </div>

            <div className="text-left font-mono">
              <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {documentNumber}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {isAr ? 'تاريخ التحرير: ' : 'Date: '} {documentDate}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                {status}
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-4 py-2 bg-slate-100/70 rounded-lg border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              {isAr ? titleAr : titleEn}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isAr ? 'سند مستندي رسمي معتمد وفق معايير متوسط التكلفة المتحرك' : 'Official Document under Moving Average Costing Standard'}
            </p>
          </div>

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            {details.map((item, i) => (
              <div key={i} className="space-y-0.5">
                <div className="text-slate-500 text-[11px] font-medium">
                  {isAr ? item.labelAr : item.labelEn}
                </div>
                <div className="text-slate-900 font-semibold font-mono">
                  {typeof item.value === 'number' ? formatNumber(item.value, language) : item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Table Items if available */}
          {tableHeaders && tableRows && tableRows.length > 0 && (
            <div className="my-5 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    {tableHeaders.map((h, idx) => (
                      <th key={idx} className="p-2.5">
                        {isAr ? h.ar : h.en}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2.5 font-medium">
                          {typeof cell === 'number' ? formatNumber(cell, language) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financial Summary Breakdown */}
          {financialSummary && financialSummary.length > 0 && (
            <div className="my-4 flex justify-end">
              <div className="w-72 bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
                {financialSummary.map((sum, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between border-b border-slate-200/60 pb-1 last:border-b-0">
                    <span className="text-slate-600 font-medium">
                      {isAr ? sum.labelAr : sum.labelEn}:
                    </span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatCurrency(sum.value, language)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Mandatory Audit Footer (Section 1) */}
          {notes && (
            <div className="my-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs">
              <span className="font-bold text-slate-700">{isAr ? 'ملاحظات وتوجيهات: ' : 'Notes: '}</span>
              <span className="text-slate-600">{notes}</span>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
            <div className="space-y-6">
              <div className="text-slate-500 font-medium">{isAr ? 'تحرير المستند (المُعد)' : 'Prepared By'}</div>
              <div className="font-bold text-slate-800">{createdBy || 'م. أحمد كمال'}</div>
              <div className="text-[10px] text-slate-400 font-mono">{createdDate || '2026-09-20'}</div>
            </div>

            <div className="space-y-6 border-x border-slate-200">
              <div className="text-slate-500 font-medium">{isAr ? 'مدير الجودة / الفحص' : 'Quality Inspector'}</div>
              <div className="font-bold text-slate-800">{isAr ? 'د. سمير شريف' : 'Dr. Samir Sherif'}</div>
              <div className="text-[10px] text-emerald-600 font-medium">مطابق للمواصفات</div>
            </div>

            <div className="space-y-6">
              <div className="text-slate-500 font-medium">{isAr ? 'الاعتماد والمحاسبة' : 'Approved By'}</div>
              <div className="font-bold text-slate-800">{approvedBy || 'أ. خالد منصور'}</div>
              <div className="text-[10px] text-slate-400 font-mono">{approvalDate || '2026-09-20'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
