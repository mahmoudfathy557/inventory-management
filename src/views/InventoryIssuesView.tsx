import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Printer,
  Ban,
  X,
  AlertOctagon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/common/ConfirmDialog';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { DocumentPrintModal } from '../components/common/DocumentPrintModal';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { InventoryIssue } from '../types';
import { usePerceivedLoading } from '../hooks/usePerceivedLoading';

export const InventoryIssuesView: React.FC = () => {
  const { isLoading } = usePerceivedLoading(180);
  const {
    language,
    issues,
    addIssue,
    cancelTransaction,
    warehouses,
    rawMaterials,
    products,
    currentUser
  } = useApp();
  const confirm = useConfirm();
  const isAr = language === 'ar';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [printIssue, setPrintIssue] = useState<InventoryIssue | null>(null);

  // Form states
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || 'wh-raw');
  const [selectedItemId, setSelectedItemId] = useState(rawMaterials[0]?.id || '');
  const [quantity, setQuantity] = useState(50);
  const [reason, setReason] = useState('عينات فحص مخبري وتطوير (Lab Testing & Samples)');
  const [reference, setReference] = useState('REQ-LAB-01');
  const [notes, setNotes] = useState('');

  const selectedItem = rawMaterials.find(m => m.id === selectedItemId) || products.find(p => p.id === selectedItemId);
  const movingAverageCostEGP = selectedItem?.movingAverageCost || 110;
  const totalIssueValueEGP = quantity * movingAverageCostEGP;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || quantity <= 0) return;

    addIssue({
      date: new Date().toISOString().split('T')[0],
      fromWarehouseId: selectedWarehouseId,
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.nameAr,
      quantity,
      uom: selectedItem.defaultUOM || 'KG',
      movingAverageCostEGP,
      totalIssueValueEGP,
      reason,
      reference,
      notes,
      createdBy: currentUser?.fullName || 'System User'
    });

    setIsCreateOpen(false);
  };

  const columns: Column<InventoryIssue>[] = [
    {
      key: 'issueNumber',
      headerAr: 'رقم إذن الصرف',
      headerEn: 'Issue No',
      render: i => (
        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {i.issueNumber}
        </span>
      ),
      exportValue: i => i.issueNumber
    },
    {
      key: 'date',
      headerAr: 'التاريخ',
      headerEn: 'Date',
      render: i => <span className="font-mono text-slate-700">{i.date}</span>,
      exportValue: i => i.date
    },
    {
      key: 'itemName',
      headerAr: 'الصنف المصروف',
      headerEn: 'Item Name',
      render: i => (
        <div>
          <div className="font-semibold text-slate-800">{i.itemName}</div>
          <div className="text-[11px] text-slate-500 font-mono">{i.itemCode}</div>
        </div>
      ),
      exportValue: i => i.itemName
    },
    {
      key: 'quantity',
      headerAr: 'الكمية المصروفة',
      headerEn: 'Issued Qty',
      render: i => (
        <span className="font-mono font-bold text-rose-700">
          -{formatNumber(i.quantity, language)} {i.uom}
        </span>
      ),
      exportValue: i => i.quantity
    },
    {
      key: 'movingAverageCostEGP',
      headerAr: 'متوسط التكلفة',
      headerEn: 'Unit MAC',
      render: i => <span className="font-mono">{formatCurrency(i.movingAverageCostEGP, language)}</span>,
      exportValue: i => i.movingAverageCostEGP
    },
    {
      key: 'totalIssueValueEGP',
      headerAr: 'إجمالي قيمة الصرف',
      headerEn: 'Total Value',
      render: i => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(i.totalIssueValueEGP, language)}
        </span>
      ),
      exportValue: i => i.totalIssueValueEGP
    },
    {
      key: 'reason',
      headerAr: 'سبب الصرف',
      headerEn: 'Reason',
      render: i => <span className="text-slate-700 text-xs">{i.reason}</span>,
      exportValue: i => i.reason
    },
    {
      key: 'status',
      headerAr: 'الحالة',
      headerEn: 'Status',
      render: i => <StatusChip status={i.status} size="sm" />,
      exportValue: i => i.status
    },
    {
      key: 'actions',
      headerAr: 'الإجراءات',
      headerEn: 'Actions',
      sortable: false,
      render: i => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setPrintIssue(i)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-blue-600"
            title={isAr ? 'طباعة إذن الصرف' : 'Print Issue Voucher'}
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          {i.status === 'POSTED' && (
            <button
              onClick={async () => {
                const ok = await confirm({
                  title: isAr ? 'تأكيد الإلغاء' : 'Confirm Cancellation',
                  message: isAr ? 'هل تريد إلغاء وعكس إذن الصرف هذا؟' : 'Cancel this issue?',
                  confirmLabel: isAr ? 'تأكيد الإلغاء' : 'Confirm',
                  icon: Ban,
                  variant: 'danger',
                });
                if (ok) {
                  cancelTransaction('إذن صرف مخزني', i.issueNumber, 'إلغاء إذن صرف');
                }
              }}
              className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600"
              title={isAr ? 'إلغاء وعكس' : 'Cancel / Reverse'}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5" id="view-inventory-issues">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isAr ? 'إذن صرف مخزني عام (استهلاك غير إنتاجي / عينات / تجارب)' : 'Inventory Issues'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'وفقاً للبند 14: تخفيض كمية وقيمة المخزون باستخدام متوسط التكلفة المتحرك الحالي وتسجيل القيد في دفتر الأستاذ'
              : 'Decrease inventory quantity and value using current Moving Average Cost.'}
          </p>
        </div>

        <button
          id="btn-new-issue"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إصدار إذن صرف مخزني' : 'New Issue'}</span>
        </button>
      </div>

      <DataTable
        id="issues-table"
        data={issues}
        columns={columns}
        keyExtractor={i => i.id}
        searchFields={['issueNumber', 'itemName', 'reason', 'reference']}
        titleAr="سجل أذونات الصرف المخزني"
        titleEn="Inventory Issues Register"
        exportFileName="Inventory_Issues"
        isLoading={isLoading}
      />

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {isAr ? 'إصدار إذن صرف مخزني عام' : 'Create Inventory Issue'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'الصنف المراد صرفه *' : 'Item *'}
                </label>
                <select
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  required
                >
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nameAr} - رصيد: {m.currentQty} {m.defaultUOM} (متوسط: {formatCurrency(m.movingAverageCost, language)})
                    </option>
                  ))}
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} - رصيد: {p.currentQty} {p.defaultUOM}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'الصرف من مستودع *' : 'From Warehouse *'}
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={e => setSelectedWarehouseId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? `الكمية المصروفة (${selectedItem?.defaultUOM || 'KG'}) *` : 'Issue Quantity *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'سبب ومبرر الصرف *' : 'Reason for Issue *'}
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="عينات فحص مخبري ومراقبة جودة (Lab Testing & Samples)">عينات فحص مخبري ومراقبة جودة</option>
                  <option value="تجارب بحث وتطوير وصياغة جديدة (R&D Trials)">تجارب بحث وتطوير وصياغة جديدة</option>
                  <option value="صرف أعمال صيانة وتجهيز ماكينات (Maintenance Use)">صيانة وتجهيز ماكينات</option>
                  <option value="تسوية مخزنية وعجز جرد معتمد (Approved Stock Adjustment)">تسوية مخزنية وعجز جرد معتمد</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'رقم المرجع / الطلب' : 'Reference'}
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'ملاحظات' : 'Notes'}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-xs font-mono">
                <span className="text-amber-900 font-sans">
                  {isAr ? 'قيمة الصرف المحتسبة (بمتوسط التكلفة):' : 'Calculated Value @ MAC:'}
                </span>
                <span className="font-bold text-amber-950 text-sm">
                  {formatCurrency(totalIssueValueEGP, language)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {isAr ? 'ترحيل إذن الصرف' : 'Post Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printIssue && (
        <DocumentPrintModal
          isOpen={true}
          onClose={() => setPrintIssue(null)}
          titleAr="إذن صرف مخزني عام معتمد"
          titleEn="Inventory Issue Voucher"
          documentNumber={printIssue.issueNumber}
          documentDate={printIssue.date}
          status={printIssue.status}
          createdBy={printIssue.createdBy}
          notes={printIssue.notes}
          details={[
            { labelAr: 'الصنف المصروف', labelEn: 'Issued Item', value: printIssue.itemName },
            { labelAr: 'الكمية المصروفة', labelEn: 'Quantity', value: `${printIssue.quantity} ${printIssue.uom}` },
            { labelAr: 'متوسط التكلفة المطبق', labelEn: 'Moving Avg Cost', value: formatCurrency(printIssue.movingAverageCostEGP, language) },
            { labelAr: 'سبب ومبرر الصرف', labelEn: 'Reason', value: printIssue.reason },
            { labelAr: 'المرجع', labelEn: 'Reference', value: printIssue.reference || '-' }
          ]}
          financialSummary={[
            { labelAr: 'إجمالي قيمة الصرف', labelEn: 'Total Value', value: printIssue.totalIssueValueEGP }
          ]}
        />
      )}
    </div>
  );
};
