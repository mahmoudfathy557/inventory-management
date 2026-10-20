import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Printer,
  Ban,
  X,
  AlertOctagon,
  ArrowRightLeft,
  Scale,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/common/ConfirmDialog';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { DocumentPrintModal } from '../components/common/DocumentPrintModal';
import { LocationValuationCard } from '../components/common/LocationValuationCard';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { InventoryIssue } from '../types';
import { usePerceivedLoading } from '../hooks/usePerceivedLoading';
import { getAvailableUOMsForItem, getConversionFactorToBase, formatUOMTransactionLabel } from '../utils/uomHelper';
import { SmartFilterBar, ERPFilters } from '../components/common/SmartFilterBar';
import { SafeTransactionCancelModal } from '../components/inventory/SafeTransactionCancelModal';
import { DataImportExportModal } from '../components/common/DataImportExportModal';

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
    uoms,
    currentUser,
    getItemWarehouseValuation
  } = useApp();
  const confirm = useConfirm();
  const isAr = language === 'ar';

  const [erpFilters, setErpFilters] = useState<ERPFilters>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const filteredIssues = useMemo(() => {
    return (issues || []).filter(i => {
      // 1. Date filters
      if (erpFilters.dateFrom && i.createdDate < erpFilters.dateFrom) return false;
      if (erpFilters.dateTo && i.createdDate > erpFilters.dateTo) return false;

      // 2. Warehouse Type & ID
      if (erpFilters.warehouseType || erpFilters.warehouseId) {
        const wh = warehouses.find(w => w.id === i.fromWarehouseId);
        if (erpFilters.warehouseType && wh?.type !== erpFilters.warehouseType) return false;
        if (erpFilters.warehouseId && i.fromWarehouseId !== erpFilters.warehouseId) return false;
      }

      // 3. Item criteria
      if (erpFilters.itemType || erpFilters.itemGroupId || erpFilters.itemCode || erpFilters.itemDesc) {
        const item = rawMaterials.find(m => m.id === i.itemId || m.code === i.itemCode) || products.find(p => p.id === i.itemId || p.code === i.itemCode);
        if (!item) return false;
        
        if (erpFilters.itemType) {
          const resolvedItemType = (item as any).itemType || (item as any).productType;
          if (resolvedItemType !== erpFilters.itemType) return false;
        }
        if (erpFilters.itemGroupId && item.categoryId !== erpFilters.itemGroupId) return false;
        if (erpFilters.itemCode && !item.code.toLowerCase().includes(erpFilters.itemCode.toLowerCase())) return false;
        const itemNameStr = isAr ? item.nameAr : item.nameEn;
        if (erpFilters.itemDesc && !itemNameStr.toLowerCase().includes(erpFilters.itemDesc.toLowerCase())) return false;
      }

      // 4. Document properties
      if (erpFilters.docNum && !i.issueNumber.toLowerCase().includes(erpFilters.docNum.toLowerCase())) return false;
      if (erpFilters.createdBy && i.createdBy !== erpFilters.createdBy) return false;

      // 5. Status filter
      if (erpFilters.status) {
        if (i.status !== erpFilters.status) return false;
      } else {
        // By default, do not show cancelled transactions in active operational view
        if (i.status === 'CANCELLED') return false;
      }

      return true;
    });
  }, [issues, erpFilters, warehouses, rawMaterials, products, isAr]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [printIssue, setPrintIssue] = useState<InventoryIssue | null>(null);
  const [cancelModalIssue, setCancelModalIssue] = useState<InventoryIssue | null>(null);

  // Form states
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || 'wh-raw');
  const [selectedItemId, setSelectedItemId] = useState(rawMaterials[0]?.id || '');
  const [quantity, setQuantity] = useState(50);
  const [selectedUOM, setSelectedUOM] = useState('');
  const [reason, setReason] = useState('عينات فحص مخبري وتطوير (Lab Testing & Samples)');
  const [reference, setReference] = useState('REQ-LAB-01');
  const [notes, setNotes] = useState('');

  const selectedItem = rawMaterials.find(m => m.id === selectedItemId) || products.find(p => p.id === selectedItemId);
  const itemBaseUOM = selectedItem?.defaultUOM || 'KG';

  // Available UOMs for this item (Main primary UOM + all related secondary UOMs)
  const availableUOMs = getAvailableUOMsForItem(itemBaseUOM, uoms);

  // Update selected UOM whenever selected item changes
  useEffect(() => {
    if (selectedItem) {
      setSelectedUOM(selectedItem.defaultUOM || 'KG');
    }
  }, [selectedItemId]);

  const activeTransactionUOM = selectedUOM || itemBaseUOM;
  const conversionFactor = getConversionFactorToBase(activeTransactionUOM, itemBaseUOM, uoms);
  const baseQuantity = quantity * conversionFactor;

  // SAP Business One: Valuation MUST be retrieved strictly from the selected Warehouse/Location layer
  const currentLocationStock = getItemWarehouseValuation(selectedItemId, selectedWarehouseId);
  const locationOnHand = currentLocationStock.currentQty || 0;
  const locationValue = currentLocationStock.totalValue || 0;
  const locationMAC = currentLocationStock.movingAverageCost || 0;

  // Authoritative Unit Cost is strictly locked to current Location MAC immediately before posting
  const movingAverageCostEGP = locationMAC;
  const totalIssueValueEGP = baseQuantity * movingAverageCostEGP;
  const isInsufficient = baseQuantity > locationOnHand;

  const projectedNewOnHand = Math.max(0, locationOnHand - baseQuantity);
  const projectedNewValue = projectedNewOnHand === 0 ? 0 : Math.max(0, locationValue - totalIssueValueEGP);
  const projectedNewMAC = locationMAC; // Outgoing movement never changes MAC!

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || quantity <= 0) return;
    if (isInsufficient) return;

    addIssue({
      date: new Date().toISOString().split('T')[0],
      fromWarehouseId: selectedWarehouseId,
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.nameAr,
      quantity,
      uom: activeTransactionUOM,
      conversionFactor,
      baseQuantity,
      baseUOM: itemBaseUOM,
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
        <div>
          <span className="font-mono font-bold text-rose-700">
            -{formatNumber(i.quantity, language)} {i.uom}
          </span>
          {i.conversionFactor && i.conversionFactor !== 1 && (
            <div className="text-[10px] text-slate-500 font-mono">
              = {formatNumber(i.baseQuantity != null ? i.baseQuantity : (i.quantity * i.conversionFactor), language)} {i.baseUOM || 'KG'}
            </div>
          )}
        </div>
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
              onClick={() => setCancelModalIssue(i)}
              className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
              title={isAr ? 'إلغاء وعكس إذن الصرف (Safe Cancellation & Reversal)' : 'Safe Cancellation & Reversal'}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
          {i.status === 'CANCELLED' && (
            <button
              onClick={() => setCancelModalIssue(i)}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              title={isAr ? 'عرض تفاصيل الإلغاء والقيد العكسي' : 'View Reversal Details'}
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-issues-import-export"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition cursor-pointer"
            title={isAr ? 'تحميل قوالب واستيراد وتصدير أذون الصرف' : 'Import / Export Issues'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'استيراد وتصدير (Excel / CSV)' : 'Import / Export'}</span>
          </button>

          <button
            id="btn-new-issue"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إصدار إذن صرف مخزني' : 'New Issue'}</span>
          </button>
        </div>
      </div>

      {/* ERP Smart Filter Bar */}
      <SmartFilterBar
        filters={erpFilters}
        onChange={setErpFilters}
        config={{
          date: true,
          warehouseType: true,
          warehouse: true,
          itemType: true,
          itemGroup: true,
          itemCode: true,
          itemDesc: true,
          status: true,
          docNum: true,
          createdBy: true
        }}
        totalRecordsCount={issues.length}
        filteredRecordsCount={filteredIssues.length}
      />

      <DataTable
        id="issues-table"
        data={filteredIssues}
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3.5 sm:px-5 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-400/30 font-mono text-[10px] font-bold px-2 py-0.5">
                  Type 2 — SAP B1
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {isAr ? 'إصدار إذن صرف مخزني عام (Issued)' : 'Issue General Inventory'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'التكلفة مقفلة آلياً وتُسترجع من متوسط تكلفة الموقع لحظة الصرف' : 'Cost locked to Location MAC immediately before posting'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-0 text-xs">
                {/* Item Selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'الصنف المراد صرفه *' : 'Item to Issue *'}
                  </label>
                <select
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {rawMaterials.map(m => {
                    const st = getItemWarehouseValuation(m.id, selectedWarehouseId);
                    return (
                      <option key={m.id} value={m.id}>
                        {m.nameAr} - رصيد الموقع: {formatNumber(st.currentQty, language)} {m.defaultUOM} (متوسط: {formatCurrency(st.movingAverageCost, language)})
                      </option>
                    );
                  })}
                  {products.map(p => {
                    const st = getItemWarehouseValuation(p.id, selectedWarehouseId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.nameAr} - رصيد الموقع: {formatNumber(st.currentQty, language)} {p.defaultUOM} (متوسط: {formatCurrency(st.movingAverageCost, language)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Source Warehouse Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'مستودع / موقع الصرف (Source Location) *' : 'From Warehouse / Location *'}
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={e => setSelectedWarehouseId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.nameAr} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* SAP B1 Location Valuation Card */}
              <LocationValuationCard
                language={language}
                locationName={warehouses.find(w => w.id === selectedWarehouseId)?.nameAr || selectedWarehouseId}
                itemUOM={itemBaseUOM}
                currentOnHand={locationOnHand}
                currentValue={locationValue}
                currentMAC={locationMAC}
                transactionQuantity={baseQuantity}
                direction="OUTGOING"
                unitCost={movingAverageCostEGP}
                isCostLocked={true}
                lockReason={isAr ? 'متوسط تكلفة الموقع مقفل (SAP MAC Locked)' : 'Location MAC Locked'}
                projectedNewOnHand={projectedNewOnHand}
                projectedNewValue={projectedNewValue}
                projectedNewMAC={projectedNewMAC}
              />

              {/* Quantity, UOM, and Locked Unit Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{isAr ? 'وحدة القياس للحركة *' : 'Transaction UOM *'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({availableUOMs.length} {isAr ? 'متاحة' : 'avail'})</span>
                  </label>
                  <select
                    value={activeTransactionUOM}
                    onChange={e => setSelectedUOM(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                  >
                    {availableUOMs.map(u => (
                      <option key={u.id} value={u.code}>
                        {u.code} - {u.nameAr} {u.conversionFactor && u.conversionFactor !== 1 ? `(×${u.conversionFactor})` : `(${isAr ? 'أساسية' : 'Base'})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? `الكمية المصروفة (${activeTransactionUOM}) *` : `Issue Qty (${activeTransactionUOM}) *`}
                  </label>
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                    className={`w-full p-2.5 rounded-lg border font-mono font-bold text-base focus:ring-2 ${
                      isInsufficient
                        ? 'border-rose-400 bg-rose-50 text-rose-700 focus:ring-rose-500'
                        : 'border-slate-200 text-rose-700 focus:ring-rose-500'
                    }`}
                    required
                  />
                </div>

                {/* System-Controlled Read-Only Unit Cost Field */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{isAr ? 'تكلفة الوحدة المحسوبة *' : 'Unit Cost *'}</span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-700" />
                      <span>{isAr ? 'مقفل' : 'Locked'}</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(movingAverageCostEGP, language)}
                    disabled
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-100 font-mono font-bold text-slate-700 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Conversion Preview Badge */}
              {conversionFactor !== 1 && (
                <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'معادلة التحويل للوحدة الأساسية للمخزون:' : 'Base Conversion:'}</span>
                  </span>
                  <span className="font-mono font-bold text-blue-950 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {formatUOMTransactionLabel(quantity, activeTransactionUOM, itemBaseUOM, conversionFactor, language)}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'سبب ومبرر الصرف *' : 'Reason for Issue *'}
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800"
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
                    className="w-full p-2.5 rounded-lg border border-slate-200"
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
                    className="w-full p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-xs font-mono">
                <span className="text-amber-900 font-sans font-semibold">
                  {isAr ? 'إجمالي قيمة الصرف المحتسبة (الكمية × متوسط تكلفة الموقع):' : 'Calculated Total Value (Qty × Location MAC):'}
                </span>
                <span className="font-bold text-amber-950 text-sm">
                  {formatCurrency(totalIssueValueEGP, language)}
                </span>
              </div>

              </div>

              {/* Pinned Bottom Footer */}
              <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-amber-900 font-sans font-semibold">
                    {isAr ? 'إجمالي قيمة الصرف:' : 'Total Value:'}
                  </span>
                  <span className="font-bold text-amber-950 text-sm bg-white px-2.5 py-1 rounded-md border border-amber-200 shadow-xs">
                    {formatCurrency(totalIssueValueEGP, language)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-xs transition"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isInsufficient || quantity <= 0}
                    className={`px-5 py-2 rounded-lg font-bold text-white text-xs transition flex items-center gap-2 ${
                      isInsufficient || quantity <= 0
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 active:scale-98'
                    }`}
                  >
                    {isInsufficient ? (
                      <span>{isAr ? 'عجز في الرصيد - غير مسموح بالصرف' : 'Insufficient Location Stock'}</span>
                    ) : (
                      <span>{isAr ? 'ترحيل إذن الصرف' : 'Post Issue'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe One-Click Cancellation & Reversal Modal */}
      {cancelModalIssue && (
        <SafeTransactionCancelModal
          isOpen={true}
          onClose={() => setCancelModalIssue(null)}
          documentType="ISSUE"
          documentNumber={cancelModalIssue.issueNumber}
          onSuccess={() => setCancelModalIssue(null)}
        />
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

      <DataImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultEntity="issues"
      />
    </div>
  );
};
