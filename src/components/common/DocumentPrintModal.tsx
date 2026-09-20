import React from 'react';
import { PrintPreviewModal, PrintPreviewColumn, PrintPreviewMetadataItem } from './PrintPreviewModal';

export interface DocumentPrintModalProps {
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
  // Map table headers to PrintPreviewColumn
  const columns: PrintPreviewColumn[] | undefined = tableHeaders?.map((th, idx) => ({
    key: `col_${idx}`,
    headerAr: th.ar,
    headerEn: th.en
  }));

  // Map details to PrintPreviewMetadataItem
  const metadata: PrintPreviewMetadataItem[] = details.map((d) => ({
    labelAr: d.labelAr,
    labelEn: d.labelEn,
    value: d.value
  }));

  // Infer status variant
  const getStatusVariant = (st: string): 'success' | 'warning' | 'info' | 'neutral' => {
    const s = st.toLowerCase();
    if (s.includes('مكتمل') || s.includes('معتمد') || s.includes('مقبول') || s.includes('passed') || s.includes('posted') || s.includes('received')) {
      return 'success';
    }
    if (s.includes('انتظار') || s.includes('draft') || s.includes('pending') || s.includes('تشغيل')) {
      return 'warning';
    }
    return 'info';
  };

  return (
    <PrintPreviewModal
      isOpen={isOpen}
      onClose={onClose}
      reportTitleAr={titleAr}
      reportTitleEn={titleEn}
      reportSubtitleAr="سند مستندي رسمي معتمد وموثق وفق معايير الجودة والرقابة الصناعية"
      reportSubtitleEn="Official Document Certified under Industrial Quality & Inventory Standards"
      documentNumber={documentNumber}
      documentDate={documentDate}
      statusBadge={{
        labelAr: status,
        labelEn: status,
        variant: getStatusVariant(status)
      }}
      metadata={metadata}
      columns={columns}
      rows={tableRows}
      financialSummary={financialSummary}
      notes={notes}
      signatures={{
        preparedBy: {
          name: createdBy || 'م. أحمد كمال',
          titleAr: 'تحرير السند (المُعد)',
          titleEn: 'Prepared By',
          date: createdDate || documentDate
        },
        reviewedBy: {
          name: 'د. سمير شريف',
          titleAr: 'مدير الجودة والفحص الفني',
          titleEn: 'Quality Control Review',
          date: documentDate
        },
        approvedBy: {
          name: approvedBy || 'أ. خالد منصور',
          titleAr: 'الاعتماد المحاسبي والإداري',
          titleEn: 'Management Approval',
          date: approvalDate || documentDate
        }
      }}
      defaultOrientation={tableHeaders && tableHeaders.length > 5 ? 'landscape' : 'portrait'}
    />
  );
};
