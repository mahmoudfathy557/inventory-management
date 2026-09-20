import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Printer,
  Ban,
  X,
  Warehouse as WhIcon,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { DocumentPrintModal } from '../components/common/DocumentPrintModal';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { InventoryTransfer } from '../types';

export const InventoryTransfersView: React.FC = () => {
  const {
    language,
    transfers,
    addTransfer,
    cancelTransaction,
    warehouses,
    locations,
    rawMaterials,
    products,
    currentUser
  } = useApp();
  const isAr = language === 'ar';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [printTransfer, setPrintTransfer] = useState<InventoryTransfer | null>(null);

  // Form state
  const [fromWhId, setFromWhId] = useState(warehouses[0]?.id || 'wh-raw');
  const [toWhId, setToWhId] = useState(warehouses[1]?.id || 'wh-wip');
  const [fromLocId, setFromLocId] = useState('');
  const [toLocId, setToLocId] = useState(locations[0]?.id || 'loc-stage-1');
  const [selectedItemId, setSelectedItemId] = useState(rawMaterials[0]?.id || '');
  const [quantity, setQuantity] = useState(1000);
  const [reference, setReference] = useState('أمر تشغيل خط البثق');
  const [notes, setNotes] = useState('');

  const selectedItem = rawMaterials.find(m => m.id === selectedItemId) || products.find(p => p.id === selectedItemId);
  const unitCostEGP = selectedItem?.movingAverageCost || 110;
  const totalValueEGP = quantity * unitCostEGP;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || quantity <= 0) return;

    addTransfer({
      date: new Date().toISOString().split('T')[0],
      fromWarehouseId: fromWhId,
      fromLocationId: fromLocId,
      toWarehouseId: toWhId,
      toLocationId: toLocId,
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.nameAr,
      quantity,
      uom: selectedItem.defaultUOM || 'KG',
      unitCostEGP,
      totalValueEGP,
      reference,
      notes: notes || 'تحويل داخلي لخطوط الإنتاج',
      createdBy: currentUser?.fullName || 'System User'
    });

    setIsCreateOpen(false);
  };

  const getWhName = (id: string) => {
    const wh = warehouses.find(w => w.id === id);
    return wh ? (isAr ? wh.nameAr : wh.nameEn) : id;
  };

  const columns: Column<InventoryTransfer>[] = [
    {
      key: 'transferNumber',
      headerAr: 'رقم التحويل',
      headerEn: 'Transfer No',
      render: t => (
        <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
          {t.transferNumber}
        </span>
      ),
      exportValue: t => t.transferNumber
    },
    {
      key: 'date',
      headerAr: 'التاريخ',
      headerEn: 'Date',
      render: t => <span className="font-mono text-slate-700">{t.date}</span>,
      exportValue: t => t.date
    },
    {
      key: 'fromWarehouseId',
      headerAr: 'من مستودع',
      headerEn: 'From Warehouse',
      render: t => <span className="font-medium text-slate-800">{getWhName(t.fromWarehouseId)}</span>,
      exportValue: t => getWhName(t.fromWarehouseId)
    },
    {
      key: 'toWarehouseId',
      headerAr: 'إلى مستودع / موقع',
      headerEn: 'To Warehouse',
      render: t => (
        <span className="font-medium text-blue-700 font-semibold">{getWhName(t.toWarehouseId)}</span>
      ),
      exportValue: t => getWhName(t.toWarehouseId)
    },
    {
      key: 'itemName',
      headerAr: 'الصنف المحول',
      headerEn: 'Item Name',
      render: t => (
        <div>
          <div className="font-semibold text-slate-800">{t.itemName}</div>
          <div className="text-[11px] text-slate-500 font-mono">{t.itemCode}</div>
        </div>
      ),
      exportValue: t => t.itemName
    },
    {
      key: 'quantity',
      headerAr: 'الكمية المحولة',
      headerEn: 'Quantity',
      render: t => (
        <span className="font-mono font-bold text-slate-900">
          {formatNumber(t.quantity, language)} {t.uom}
        </span>
      ),
      exportValue: t => t.quantity
    },
    {
      key: 'totalValueEGP',
      headerAr: 'قيمة التحويل (EGP)',
      headerEn: 'Total Value',
      render: t => <span className="font-mono text-slate-700">{formatCurrency(t.totalValueEGP, language)}</span>,
      exportValue: t => t.totalValueEGP
    },
    {
      key: 'status',
      headerAr: 'الحالة',
      headerEn: 'Status',
      render: t => <StatusChip status={t.status} size="sm" />,
      exportValue: t => t.status
    },
    {
      key: 'actions',
      headerAr: 'الإجراءات',
      headerEn: 'Actions',
      sortable: false,
      render: t => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setPrintTransfer(t)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-blue-600"
            title={isAr ? 'طباعة إذن التحويل' : 'Print Transfer Note'}
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          {t.status === 'POSTED' && (
            <button
              onClick={() => {
                if (confirm(isAr ? 'هل تريد إلغاء وعكس إذن التحويل هذا؟' : 'Cancel this transfer?')) {
                  cancelTransaction('إذن تحويل مخزني', t.transferNumber, 'إلغاء أمر تحويل');
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
    <div className="space-y-5" id="view-inventory-transfers">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isAr ? 'التحويل المخزني بين المستودعات ومواقع الإنتاج' : 'Inventory Transfers'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'وفقاً للبند 15: تحريك الكميات والقيم بين المخازن وصالات الإنتاج دون تغيير إجمالي قيمة مخزون الشركة'
              : 'Transfer inventory between raw materials, WIP, and production stages without altering company total valuation.'}
          </p>
        </div>

        <button
          id="btn-new-transfer"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إصدار إذن تحويل مخزني' : 'New Transfer'}</span>
        </button>
      </div>

      <DataTable
        id="transfers-table"
        data={transfers}
        columns={columns}
        keyExtractor={t => t.id}
        searchFields={['transferNumber', 'itemName', 'reference']}
        titleAr="سجل أذونات التحويل بين المواقع"
        titleEn="Stock Transfer Register"
        exportFileName="Stock_Transfers"
      />

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">
                  {isAr ? 'إصدار إذن تحويل مخزني داخلي' : 'Create Stock Transfer'}
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
              {/* Item Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'الصنف المراد تحويله *' : 'Item to Transfer *'}
                </label>
                <select
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  required
                >
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nameAr} - الرصيد: {m.currentQty} {m.defaultUOM} (متوسط: {formatCurrency(m.movingAverageCost, language)})
                    </option>
                  ))}
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} - الرصيد: {p.currentQty} {p.defaultUOM}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block text-xs">
                    {isAr ? 'المصدر (From):' : 'Source:'}
                  </span>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1">
                      {isAr ? 'المستودع المصدر *' : 'From Warehouse *'}
                    </label>
                    <select
                      value={fromWhId}
                      onChange={e => setFromWhId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-200 space-y-2">
                  <span className="font-bold text-sky-900 block text-xs">
                    {isAr ? 'الوجهة (To):' : 'Destination:'}
                  </span>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1">
                      {isAr ? 'مستودع الوجهة *' : 'To Warehouse *'}
                    </label>
                    <select
                      value={toWhId}
                      onChange={e => setToWhId(e.target.value)}
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
                    <label className="block text-slate-600 text-[11px] mb-1">
                      {isAr ? 'موقع الإنتاج / المرحلة' : 'Production Location'}
                    </label>
                    <select
                      value={toLocId}
                      onChange={e => setToLocId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.nameAr} ({l.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? `الكمية المحولة (${selectedItem?.defaultUOM || 'KG'}) *` : 'Transfer Qty *'}
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

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'المرجع / أمر التشغيل' : 'Reference'}
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* Cost Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-600 font-sans">
                  {isAr ? 'قيمة التحويل المنقولة (بدون تغيير القيمة الكلية للشركة):' : 'Transferred Value (Company Total Unchanged):'}
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(totalValueEGP, language)}
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
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  {isAr ? 'ترحيل التحويل المخزني' : 'Post Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Voucher */}
      {printTransfer && (
        <DocumentPrintModal
          isOpen={true}
          onClose={() => setPrintTransfer(null)}
          titleAr="إذن تحويل مخزني بين المستودعات والمواقع"
          titleEn="Inventory Transfer Note"
          documentNumber={printTransfer.transferNumber}
          documentDate={printTransfer.date}
          status={printTransfer.status}
          createdBy={printTransfer.createdBy}
          createdDate={printTransfer.createdDate}
          notes={printTransfer.notes}
          details={[
            { labelAr: 'المستودع المصدر', labelEn: 'From Warehouse', value: getWhName(printTransfer.fromWarehouseId) },
            { labelAr: 'مستودع الوجهة', labelEn: 'To Warehouse', value: getWhName(printTransfer.toWarehouseId) },
            { labelAr: 'الصنف المحول', labelEn: 'Item Transferred', value: printTransfer.itemName },
            { labelAr: 'الكمية المحولة', labelEn: 'Transfer Qty', value: `${printTransfer.quantity} ${printTransfer.uom}` },
            { labelAr: 'تكلفة الوحدة', labelEn: 'Unit Cost', value: formatCurrency(printTransfer.unitCostEGP, language) }
          ]}
          financialSummary={[
            { labelAr: 'إجمالي قيمة التحويل', labelEn: 'Total Transfer Value', value: printTransfer.totalValueEGP }
          ]}
        />
      )}
    </div>
  );
};
