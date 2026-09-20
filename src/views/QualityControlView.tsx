import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  Printer,
  X,
  Search,
  Check,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { DocumentPrintModal } from '../components/common/DocumentPrintModal';
import { QualityControlSkeleton } from '../components/common/Skeleton';
import { usePerceivedLoading } from '../hooks/usePerceivedLoading';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { ProductionOrder, QualityStatus } from '../types';

export const QualityControlView: React.FC = () => {
  const { isLoading } = usePerceivedLoading(180);
  const {
    language,
    productionOrders,
    approveQuality,
    currentUser
  } = useApp();
  const isAr = language === 'ar';

  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [decision, setDecision] = useState<QualityStatus>(QualityStatus.APPROVED);
  const [inspectorNotes, setInspectorNotes] = useState('عينات الفحص مطابقة للمواصفة القياسية المصرية ES 842/2021');
  const [printCertOrder, setPrintCertOrder] = useState<ProductionOrder | null>(null);

  const pendingBatches = productionOrders.filter(
    o => o.qualityStatus === 'PENDING' || o.status === 'PENDING_QUALITY'
  );

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    approveQuality(selectedOrder.id, decision, inspectorNotes);
    setSelectedOrder(null);
  };

  const columns: Column<ProductionOrder>[] = [
    {
      key: 'orderNumber',
      headerAr: 'رقم أمر الإنتاج',
      headerEn: 'Order No',
      render: o => (
        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {o.orderNumber}
        </span>
      ),
      exportValue: o => o.orderNumber
    },
    {
      key: 'productName',
      headerAr: 'المنتج المفحوص',
      headerEn: 'Product',
      render: o => (
        <div>
          <div className="font-semibold text-slate-800">{o.productName}</div>
          <div className="text-[11px] text-slate-500 font-mono">{o.productCode}</div>
        </div>
      ),
      exportValue: o => o.productName
    },
    {
      key: 'actualFinishedQuantity',
      headerAr: 'كمية الدفعة (كجم)',
      headerEn: 'Batch Quantity',
      render: o => (
        <span className="font-mono font-bold text-slate-900">
          {formatNumber(o.actualFinishedQuantity || 0, language)} {o.uom}
        </span>
      ),
      exportValue: o => o.actualFinishedQuantity || 0
    },
    {
      key: 'finishedGoodsUnitCostEGP',
      headerAr: 'تكلفة الوحدة',
      headerEn: 'Unit Cost',
      render: o => (
        <span className="font-mono text-slate-700">
          {formatCurrency(o.finishedGoodsUnitCostEGP, language)}
        </span>
      ),
      exportValue: o => o.finishedGoodsUnitCostEGP
    },
    {
      key: 'qualityStatus',
      headerAr: 'قرار الجودة',
      headerEn: 'Quality Decision',
      render: o => <StatusChip status={o.qualityStatus} size="sm" />,
      exportValue: o => o.qualityStatus
    },
    {
      key: 'status',
      headerAr: 'حالة المخزون',
      headerEn: 'Stock Status',
      render: o => (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          o.qualityStatus === 'APPROVED'
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {o.qualityStatus === 'APPROVED'
            ? (isAr ? 'متاح للبيع والتسليم' : 'Available for Sale')
            : (isAr ? 'معلق ومحجوز (Hold)' : 'Quality Hold')}
        </span>
      ),
      exportValue: o => o.qualityStatus === 'APPROVED' ? 'Available' : 'Hold'
    },
    {
      key: 'actions',
      headerAr: 'إجراءات الفحص',
      headerEn: 'Actions',
      sortable: false,
      render: o => (
        <div className="flex items-center gap-1.5 justify-end">
          {o.qualityStatus === 'PENDING' ? (
            <button
              onClick={() => {
                setSelectedOrder(o);
                setDecision(QualityStatus.APPROVED);
              }}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'إجراء الفحص والاعتماد' : 'Inspect'}</span>
            </button>
          ) : (
            <button
              onClick={() => setPrintCertOrder(o)}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-emerald-700"
              title={isAr ? 'طباعة شهادة مطابقة الجودة' : 'Print Certificate'}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  if (isLoading) {
    return <QualityControlSkeleton />;
  }

  return (
    <div className="space-y-5" id="view-quality-control">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-slate-900">
          {isAr ? 'إدارة الرقابة وضبط الجودة (Quality Inspection & Release)' : 'Quality Control & Batch Release'}
        </h2>
        <p className="text-xs text-slate-500">
          {isAr
            ? 'وفقاً للبندين 23 و24: تخضع كافة مخرجات التشغيل لحجز الجودة (PENDING_QUALITY) ولا يسمح بصرفها للعملاء إلا بعد اعتماد مدير الجودة'
            : 'Enforces Section 23/24 quality hold on finished goods receipts before customer deliveries are authorized.'}
        </p>
      </div>

      {/* Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-amber-800">
              {isAr ? 'دفعات بانتظار قرار الفحص' : 'Pending Inspection'}
            </div>
            <div className="text-lg font-bold font-mono text-amber-950">
              {pendingBatches.length} {isAr ? 'أوامر' : 'orders'}
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-800">
              {isAr ? 'دفعات معتمدة ومفرجة للمستودع' : 'Approved & Released'}
            </div>
            <div className="text-lg font-bold font-mono text-emerald-950">
              {productionOrders.filter(o => o.qualityStatus === 'APPROVED').length} {isAr ? 'أوامر' : 'orders'}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-200 text-slate-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700">
              {isAr ? 'المواصفة المعتمدة' : 'Compliance Standard'}
            </div>
            <div className="text-xs font-bold text-slate-900">
              ISO 9001 / ES 842-2021
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        id="quality-table"
        data={productionOrders}
        columns={columns}
        keyExtractor={o => o.id}
        searchFields={['orderNumber', 'productName']}
        titleAr="سجل فحص واعتماد جودة التشغيل"
        titleEn="Quality Inspection Register"
        exportFileName="Quality_Inspections"
      />

      {/* Modal: Decision */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>
                {isAr
                  ? `فحص واعتماد دفعة أمر الإنتاج (${selectedOrder.orderNumber})`
                  : 'Quality Decision Voucher'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800 text-xs">{selectedOrder.productName}</div>
              <div className="text-slate-600 flex justify-between font-mono text-[11px]">
                <span>{isAr ? 'كمية الدفعة: ' : 'Quantity: '} {selectedOrder.actualFinishedQuantity} {selectedOrder.uom}</span>
                <span>{isAr ? 'تكلفة الوحدة: ' : 'Unit Cost: '} {formatCurrency(selectedOrder.finishedGoodsUnitCostEGP, language)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                {isAr ? 'قرار فحص الجودة الرسمي *' : 'Inspection Decision *'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision(QualityStatus.APPROVED)}
                  className={`p-3 rounded-xl border text-center transition font-bold flex items-center justify-center gap-1.5 ${
                    decision === QualityStatus.APPROVED
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'مطابق واعتماد الإفراج (Release)' : 'Approve & Release'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision(QualityStatus.REJECTED)}
                  className={`p-3 rounded-xl border text-center transition font-bold flex items-center justify-center gap-1.5 ${
                    decision === QualityStatus.REJECTED
                      ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>{isAr ? 'مرفوض وإعادة تشغيل' : 'Reject'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isAr ? 'تقرير وملاحظات مفتش الجودة' : 'Inspector Notes'}
              </label>
              <textarea
                rows={3}
                value={inspectorNotes}
                onChange={e => setInspectorNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleApproveSubmit}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isAr ? 'حفظ وتثبيت قرار الجودة' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Certificate */}
      {printCertOrder && (
        <DocumentPrintModal
          isOpen={true}
          onClose={() => setPrintCertOrder(null)}
          titleAr="شهادة فحص واعتماد جودة صناعية (Certificate of Quality Compliance)"
          titleEn="Certificate of Quality Compliance"
          documentNumber={`QC-CERT-${printCertOrder.orderNumber}`}
          documentDate={printCertOrder.productionDate}
          status="معتمد ومفرج للمستودع (APPROVED & RELEASED)"
          createdBy="د. سمير شريف (مدير الجودة)"
          notes={inspectorNotes}
          details={[
            { labelAr: 'المنتج المعتمد', labelEn: 'Product', value: printCertOrder.productName },
            { labelAr: 'كود المنتج', labelEn: 'Product Code', value: printCertOrder.productCode },
            { labelAr: 'رقم أمر الإنتاج', labelEn: 'Order Number', value: printCertOrder.orderNumber },
            { labelAr: 'الكمية المعتمدة', labelEn: 'Approved Qty', value: `${printCertOrder.actualFinishedQuantity} ${printCertOrder.uom}` },
            { labelAr: 'المستودع المستلم', labelEn: 'Destination WH', value: 'مستودع المنتجات التامة (FG)' },
            { labelAr: 'معيار الفحص', labelEn: 'Standard', value: 'ES 842/2021 & ISO 9001' }
          ]}
        />
      )}
    </div>
  );
};
