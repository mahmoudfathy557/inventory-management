import React, { useState } from 'react';
import {
  PackagePlus,
  Plus,
  Printer,
  DollarSign,
  Ban,
  Eye,
  X,
  CheckCircle,
  HelpCircle,
  Calculator,
  ArrowRightLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { DocumentPrintModal } from '../components/common/DocumentPrintModal';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { InventoryReceipt, ItemType } from '../types';
import { usePerceivedLoading } from '../hooks/usePerceivedLoading';
import { getAvailableUOMsForItem, getConversionFactorToBase, formatUOMTransactionLabel } from '../utils/uomHelper';

interface InventoryReceiptsViewProps {
  onOpenLandedCostModal?: (receiptId: string) => void;
}

export const InventoryReceiptsView: React.FC<InventoryReceiptsViewProps> = ({ onOpenLandedCostModal }) => {
  const { isLoading } = usePerceivedLoading(180);
  const {
    language,
    receipts,
    addReceipt,
    cancelTransaction,
    rawMaterials,
    products,
    warehouses,
    suppliers,
    currencies,
    uoms,
    currentUser,
    getExchangeRateForDate
  } = useApp();
  const isAr = language === 'ar';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [printReceipt, setPrintReceipt] = useState<InventoryReceipt | null>(null);
  const [cancelModalReceipt, setCancelModalReceipt] = useState<InventoryReceipt | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Form State
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedItemId, setSelectedItemId] = useState(rawMaterials[0]?.id || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || '');
  const [selectedCurrency, setSelectedCurrency] = useState('EGP');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [quantity, setQuantity] = useState(1000);
  const [selectedUOM, setSelectedUOM] = useState('');
  const [unitPrice, setUnitPrice] = useState(100);
  const [reference, setReference] = useState('PO-2026-');
  const [notes, setNotes] = useState('');

  const selectedItem = rawMaterials.find(m => m.id === selectedItemId) || products.find(p => p.id === selectedItemId);
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // UOM Resolution & Secondary UOMs Hierarchy
  const itemBaseUOM = selectedItem?.defaultUOM || 'KG';
  const availableUOMs = getAvailableUOMsForItem(itemBaseUOM, uoms);

  // When selected item changes, reset UOM to item's default UOM
  React.useEffect(() => {
    if (selectedItem) {
      setSelectedUOM(selectedItem.defaultUOM || 'KG');
    }
  }, [selectedItemId]);

  const activeTransactionUOM = selectedUOM || itemBaseUOM;
  const conversionFactor = getConversionFactorToBase(activeTransactionUOM, itemBaseUOM, uoms);
  const baseQuantity = quantity * conversionFactor;

  // Moving Average Simulation in Modal
  const unitPriceEGP = unitPrice * exchangeRate;
  const totalValueEGP = quantity * unitPriceEGP;

  const currentItemQty = selectedItem?.currentQty || 0;
  const currentItemVal = selectedItem?.totalValue || 0;
  const simulatedNewQty = currentItemQty + baseQuantity;
  const simulatedNewVal = currentItemVal + totalValueEGP;
  const simulatedNewMAC = simulatedNewQty > 0 ? simulatedNewVal / simulatedNewQty : 0;

  const handleCurrencyChange = (currCode: string) => {
    setSelectedCurrency(currCode);
    if (currCode === 'EGP') {
      setExchangeRate(1.0);
    } else {
      const lookup = getExchangeRateForDate(currCode, receiptDate);
      setExchangeRate(lookup.rate);
    }
  };

  const handleDateChange = (newDate: string) => {
    setReceiptDate(newDate);
    if (selectedCurrency !== 'EGP') {
      const lookup = getExchangeRateForDate(selectedCurrency, newDate);
      setExchangeRate(lookup.rate);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || quantity <= 0) return;

    addReceipt({
      date: receiptDate || new Date().toISOString().split('T')[0],
      supplierId: selectedSupplierId,
      supplierName: selectedSupplier ? (isAr ? selectedSupplier.nameAr : selectedSupplier.nameEn) : 'مورد غير محدد',
      currency: selectedCurrency,
      exchangeRate,
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.nameAr,
      itemType: (selectedItem as any).itemType || ItemType.RAW_MATERIAL,
      warehouseId: selectedWarehouseId,
      quantity,
      uom: activeTransactionUOM,
      conversionFactor,
      baseQuantity,
      baseUOM: itemBaseUOM,
      unitPrice,
      unitPriceEGP,
      totalValueEGP,
      reference,
      notes,
      createdBy: currentUser?.fullName || 'System User',
      approvedBy: currentUser?.fullName || 'System User',
      approvalDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    setIsCreateOpen(false);
  };

  const handleCancelSubmit = () => {
    if (!cancelModalReceipt || !cancelReason.trim()) return;
    cancelTransaction('إذن إضافة مخزني', cancelModalReceipt.receiptNumber, cancelReason);
    setCancelModalReceipt(null);
    setCancelReason('');
  };

  const columns: Column<InventoryReceipt>[] = [
    {
      key: 'receiptNumber',
      headerAr: 'رقم الإذن',
      headerEn: 'Receipt No',
      render: r => (
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {r.receiptNumber}
        </span>
      ),
      exportValue: r => r.receiptNumber
    },
    {
      key: 'date',
      headerAr: 'التاريخ',
      headerEn: 'Date',
      render: r => <span className="font-mono text-slate-700">{r.date}</span>,
      exportValue: r => r.date
    },
    {
      key: 'itemName',
      headerAr: 'الصنف / المادة',
      headerEn: 'Item Name',
      render: r => (
        <div>
          <div className="font-semibold text-slate-800">{r.itemName}</div>
          <div className="text-[11px] text-slate-500 font-mono">{r.itemCode}</div>
        </div>
      ),
      exportValue: r => r.itemName
    },
    {
      key: 'supplierName',
      headerAr: 'المورد',
      headerEn: 'Supplier',
      render: r => <span className="text-slate-700">{r.supplierName}</span>,
      exportValue: r => r.supplierName
    },
    {
      key: 'quantity',
      headerAr: 'الكمية المستلمة',
      headerEn: 'Received Qty',
      render: r => (
        <div className="space-y-0.5">
          <span className="font-mono font-bold text-emerald-700">
            +{formatNumber(r.quantity, language)} {r.uom}
          </span>
          {r.conversionFactor && r.conversionFactor !== 1 && (
            <div className="text-[10px] text-blue-600 font-mono">
              = {formatNumber(r.baseQuantity ?? (r.quantity * r.conversionFactor), language)} {r.baseUOM || 'KG'} (موحد)
            </div>
          )}
        </div>
      ),
      exportValue: r => r.quantity
    },
    {
      key: 'unitPriceEGP',
      headerAr: 'سعر الوحدة (EGP)',
      headerEn: 'Unit Price',
      render: r => <span className="font-mono">{formatCurrency(r.unitPriceEGP, language)}</span>,
      exportValue: r => r.unitPriceEGP
    },
    {
      key: 'totalValueEGP',
      headerAr: 'إجمالي القيمة (EGP)',
      headerEn: 'Total Value',
      render: r => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(r.totalValueEGP, language)}
        </span>
      ),
      exportValue: r => r.totalValueEGP
    },
    {
      key: 'landedCostAllocatedEGP',
      headerAr: 'تكلفة الإنزال المخصصة',
      headerEn: 'Landed Cost',
      render: r => (
        <span className={`font-mono text-xs ${r.landedCostAllocatedEGP > 0 ? 'text-purple-700 font-bold' : 'text-slate-400'}`}>
          {r.landedCostAllocatedEGP > 0 ? `+${formatCurrency(r.landedCostAllocatedEGP, language)}` : '0.00 ج.م'}
        </span>
      ),
      exportValue: r => r.landedCostAllocatedEGP
    },
    {
      key: 'status',
      headerAr: 'الحالة',
      headerEn: 'Status',
      render: r => <StatusChip status={r.status} size="sm" />,
      exportValue: r => r.status
    },
    {
      key: 'actions',
      headerAr: 'الإجراءات',
      headerEn: 'Actions',
      sortable: false,
      render: r => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setPrintReceipt(r)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-blue-600"
            title={isAr ? 'طباعة سند الاستلام' : 'Print Voucher'}
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {r.status === 'POSTED' && onOpenLandedCostModal && (
            <button
              onClick={() => onOpenLandedCostModal(r.id)}
              className="p-1.5 rounded-md hover:bg-purple-50 text-purple-600"
              title={isAr ? 'إضافة تكلفة إنزال على هذا الإذن' : 'Add Landed Cost'}
            >
              <DollarSign className="w-3.5 h-3.5" />
            </button>
          )}

          {r.status === 'POSTED' && (
            <button
              onClick={() => setCancelModalReceipt(r)}
              className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600"
              title={isAr ? 'إلغاء وعكس الإذن (Cancel / Reverse)' : 'Cancel & Reverse'}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5" id="view-inventory-receipts">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isAr ? 'إذن إضافة مخزني (استلام بضاعة / مواد خام)' : 'Inventory Receipts / Add Stock'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'تسجيل شراء واستلام المواد الخام والمنتجات مع إعادة حساب متوسط التكلفة المتحرك وتحديث دفتر الأستاذ'
              : 'Add physical inventory, purchase receipts, and recalculate Moving Average Cost automatically.'}
          </p>
        </div>

        <button
          id="btn-create-receipt"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إصدار إذن إضافة مخزني جديد' : 'New Receipt'}</span>
        </button>
      </div>

      {/* Receipts DataTable */}
      <DataTable
        id="receipts-table"
        data={receipts}
        columns={columns}
        keyExtractor={r => r.id}
        searchFields={['receiptNumber', 'itemName', 'supplierName', 'reference']}
        titleAr="سجل أذونات الإضافة المخزنية"
        titleEn="Inventory Receipts Ledger"
        exportFileName="Inventory_Receipts"
        isLoading={isLoading}
      />

      {/* Modal: Create Inventory Receipt */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">
                  {isAr ? 'إصدار إذن إضافة مخزني جديد (استلام خامات / بضاعة)' : 'New Inventory Receipt'}
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
              {/* Item selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'الصنف المستلم *' : 'Item / Raw Material *'}
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={e => setSelectedItemId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  >
                    <optgroup label={isAr ? 'المواد الخام' : 'Raw Materials'}>
                      {rawMaterials.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nameAr} ({m.code})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={isAr ? 'المنتجات التامة والنص مصنعة' : 'Finished & Semi-Finished'}>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nameAr} ({p.code})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'المورد المعتمد *' : 'Supplier *'}
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date, Warehouse, Currency, Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'تاريخ الاستلام *' : 'Receipt Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={receiptDate}
                    onChange={e => handleDateChange(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'المستودع المستلم *' : 'Target Warehouse *'}
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={e => setSelectedWarehouseId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.nameAr} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'العملة *' : 'Currency *'}
                  </label>
                  <select
                    value={selectedCurrency}
                    onChange={e => handleCurrencyChange(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold"
                  >
                    {currencies.map(c => (
                      <option key={c.id} value={c.code}>
                        {c.nameAr} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'سعر الصرف (EGP)' : 'Exchange Rate'}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={e => setExchangeRate(parseFloat(e.target.value) || 1)}
                    disabled={selectedCurrency === 'EGP'}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 disabled:opacity-60 font-mono text-xs font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Quantity, UOM & Unit Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'الكمية المستلمة *' : 'Received Quantity *'}
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'وحدة القياس المستلمة *' : 'Transaction UOM *'}
                  </label>
                  <select
                    value={activeTransactionUOM}
                    onChange={e => setSelectedUOM(e.target.value)}
                    className="w-full p-2 rounded-lg border border-blue-300 bg-blue-50/50 font-bold text-blue-900"
                    required
                  >
                    {availableUOMs.map(u => (
                      <option key={u.id} value={u.code}>
                        {u.code} - {isAr ? u.nameAr : u.nameEn} {u.conversionFactor && u.conversionFactor !== 1 ? `(×${u.conversionFactor})` : `(${isAr ? 'أساسية' : 'Base'})`}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {isAr ? `الوحدة الموحدة الأساسية للصنف: ${itemBaseUOM}` : `Item Base UOM: ${itemBaseUOM}`}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? `سعر شراء الوحدة (${selectedCurrency}) *` : `Unit Price (${selectedCurrency}) *`}
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.001"
                    value={unitPrice}
                    onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Conversion Preview Notice if secondary UOM */}
              {conversionFactor !== 1 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-800">
                    <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                    <span>
                      {formatUOMTransactionLabel(quantity, activeTransactionUOM, itemBaseUOM, conversionFactor, language)}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded">
                    {isAr ? 'الكمية بالوحدة الموحدة للمخزون:' : 'Unified Base Qty:'}{' '}
                    {formatNumber(baseQuantity, language)} {itemBaseUOM}
                  </div>
                </div>
              )}

              {/* References & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'المرجع (رقم الفاتورة / أمر التوريد)' : 'Reference / Invoice No'}
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
                    placeholder={isAr ? 'مثال: توريد الدفعة الأولى وفق المواصفات' : 'Any instructions'}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* Moving Average Live Simulation Box */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Calculator className="w-4 h-4" />
                  <span>{isAr ? 'محاكاة إعادة احتساب متوسط التكلفة المتحرك (Moving Average Cost)' : 'Moving Average Calculation Preview'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono border-t border-blue-200/60 pt-2">
                  <div>
                    <span className="text-slate-500">{isAr ? 'الرصيد السابق (موحد):' : 'Prev Stock:'}</span>
                    <div className="font-bold">{formatNumber(currentItemQty, language)} {itemBaseUOM}</div>
                    <div className="text-slate-500 text-[10px]">{formatCurrency(selectedItem?.movingAverageCost || 0, language)}/{itemBaseUOM}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">{isAr ? 'الإضافة الحالية (موحد):' : 'Addition:'}</span>
                    <div className="font-bold text-emerald-700">+{formatNumber(baseQuantity, language)} {itemBaseUOM}</div>
                    <div className="text-emerald-700 text-[10px]">{formatCurrency(totalValueEGP, language)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">{isAr ? 'متوسط التكلفة الجديد:' : 'New MAC:'}</span>
                    <div className="font-bold text-blue-700 text-xs">{formatCurrency(simulatedNewMAC, language)}/{itemBaseUOM}</div>
                    <div className="text-slate-500 text-[10px]">{formatNumber(simulatedNewQty, language)} {itemBaseUOM}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  {isAr ? 'ترحيل واعتماد إذن الإضافة' : 'Post Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cancel / Reverse */}
      {cancelModalReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <Ban className="w-5 h-5" />
              <span>{isAr ? 'إلغاء وعكس إذن الإضافة' : 'Cancel & Reverse Receipt'}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {isAr
                ? `وفقاً لمتطلبات النظام (Section 1): لا يمكن حذف العمليات المرحلة بشكل نهائي. سيتم إنشاء قيد عكسي معتمد وتغيير حالة الإذن ${cancelModalReceipt.receiptNumber} إلى ملغي.`
                : `Transactions cannot be deleted directly. A reversing entry will be recorded in the ledger.`}
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isAr ? 'سبب الإلغاء والعكس *' : 'Cancellation Reason *'}
              </label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder={isAr ? 'اكتب سبب إلغاء هذا المستند...' : 'Reason for cancellation...'}
                className="w-full p-2 rounded-lg border border-slate-200 h-20"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalReceipt(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
              >
                {isAr ? 'تراجع' : 'Close'}
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={!cancelReason.trim()}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50"
              >
                {isAr ? 'تأكيد الإلغاء والعكس' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Voucher */}
      {printReceipt && (
        <DocumentPrintModal
          isOpen={true}
          onClose={() => setPrintReceipt(null)}
          titleAr="إذن إضافة مخزني معتمد"
          titleEn="Official Inventory Receipt Voucher"
          documentNumber={printReceipt.receiptNumber}
          documentDate={printReceipt.date}
          status={printReceipt.status}
          createdBy={printReceipt.createdBy}
          createdDate={printReceipt.createdDate}
          approvedBy={printReceipt.approvedBy}
          approvalDate={printReceipt.approvalDate}
          notes={printReceipt.notes}
          details={[
            { labelAr: 'اسم الصنف', labelEn: 'Item Name', value: printReceipt.itemName },
            { labelAr: 'كود الصنف', labelEn: 'Item Code', value: printReceipt.itemCode },
            { labelAr: 'المورد', labelEn: 'Supplier', value: printReceipt.supplierName },
            {
              labelAr: 'الكمية المستلمة',
              labelEn: 'Received Qty',
              value: printReceipt.conversionFactor && printReceipt.conversionFactor !== 1
                ? `${printReceipt.quantity} ${printReceipt.uom} (= ${formatNumber(printReceipt.baseQuantity ?? (printReceipt.quantity * printReceipt.conversionFactor), language)} ${printReceipt.baseUOM || 'KG'} بالوحدة الموحدة)`
                : `${formatNumber(printReceipt.quantity, language)} ${printReceipt.uom}`
            },
            { labelAr: 'سعر الوحدة', labelEn: 'Unit Price', value: formatCurrency(printReceipt.unitPriceEGP, language) },
            { labelAr: 'رقم المرجع', labelEn: 'Reference', value: printReceipt.reference || '-' }
          ]}
          financialSummary={[
            { labelAr: 'قيمة الشراء الأساسية', labelEn: 'Purchase Subtotal', value: printReceipt.totalValueEGP },
            { labelAr: 'تكاليف الإنزال المخصصة', labelEn: 'Landed Cost', value: printReceipt.landedCostAllocatedEGP || 0 },
            { labelAr: 'إجمالي القيمة المخزنية', labelEn: 'Total Value EGP', value: printReceipt.totalValueEGP + (printReceipt.landedCostAllocatedEGP || 0) }
          ]}
        />
      )}
    </div>
  );
};
