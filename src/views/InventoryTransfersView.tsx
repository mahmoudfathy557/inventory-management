import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Printer,
  Ban,
  X,
  Warehouse as WhIcon,
  HelpCircle,
  Scan,
  Camera,
  WifiOff,
  RefreshCw,
  Zap,
  Scale,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/common/ConfirmDialog';
import { useOfflineSyncQueue } from '../hooks/useOfflineSyncQueue';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { DocumentPrintModal } from '../components/common/DocumentPrintModal';
import { BarcodeTransferScannerModal } from '../components/inventory/BarcodeTransferScannerModal';
import { LocationValuationCard } from '../components/common/LocationValuationCard';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { InventoryTransfer } from '../types';
import { usePerceivedLoading } from '../hooks/usePerceivedLoading';
import { getAvailableUOMsForItem, getConversionFactorToBase, formatUOMTransactionLabel } from '../utils/uomHelper';
import { SmartFilterBar, ERPFilters } from '../components/common/SmartFilterBar';
import { SafeTransactionCancelModal } from '../components/inventory/SafeTransactionCancelModal';
import { DataImportExportModal } from '../components/common/DataImportExportModal';

export const InventoryTransfersView: React.FC = () => {
  const { isLoading } = usePerceivedLoading(180);
  const {
    language,
    transfers,
    addTransfer,
    cancelTransaction,
    warehouses,
    locations,
    rawMaterials,
    products,
    uoms,
    currentUser,
    odooConfig,
    getItemWarehouseValuation
  } = useApp();
  const confirm = useConfirm();
  const isAr = language === 'ar';

  const [erpFilters, setErpFilters] = useState<ERPFilters>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const filteredTransfers = useMemo(() => {
    return (transfers || []).filter(t => {
      // 1. Date filters
      if (erpFilters.dateFrom && t.createdDate < erpFilters.dateFrom) return false;
      if (erpFilters.dateTo && t.createdDate > erpFilters.dateTo) return false;

      // 2. Warehouse Type & ID (for Transfers, match source OR destination warehouse)
      if (erpFilters.warehouseType || erpFilters.warehouseId) {
        const fromWh = warehouses.find(w => w.id === t.fromWarehouseId);
        const toWh = warehouses.find(w => w.id === t.toWarehouseId);
        
        if (erpFilters.warehouseType) {
          const matchType = fromWh?.type === erpFilters.warehouseType || toWh?.type === erpFilters.warehouseType;
          if (!matchType) return false;
        }
        if (erpFilters.warehouseId) {
          const matchWh = t.fromWarehouseId === erpFilters.warehouseId || t.toWarehouseId === erpFilters.warehouseId;
          if (!matchWh) return false;
        }
      }

      // 3. Item criteria
      if (erpFilters.itemType || erpFilters.itemGroupId || erpFilters.itemCode || erpFilters.itemDesc) {
        const item = rawMaterials.find(m => m.id === t.itemId || m.code === t.itemCode) || products.find(p => p.id === t.itemId || p.code === t.itemCode);
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
      if (erpFilters.docNum && !t.transferNumber.toLowerCase().includes(erpFilters.docNum.toLowerCase())) return false;
      if (erpFilters.createdBy && t.createdBy !== erpFilters.createdBy) return false;

      // 5. Status filter
      if (erpFilters.status) {
        if (t.status !== erpFilters.status) return false;
      } else {
        // By default, do not show cancelled transactions in active operational view
        if (t.status === 'CANCELLED') return false;
      }

      return true;
    });
  }, [transfers, erpFilters, warehouses, rawMaterials, products, isAr]);

  const { pendingCount, isOnline, triggerSync, isSyncing } = useOfflineSyncQueue(odooConfig);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [printTransfer, setPrintTransfer] = useState<InventoryTransfer | null>(null);
  const [cancelModalTransfer, setCancelModalTransfer] = useState<InventoryTransfer | null>(null);

  // Form state
  const [fromWhId, setFromWhId] = useState(warehouses[0]?.id || 'wh-raw');
  const [toWhId, setToWhId] = useState(warehouses[1]?.id || 'wh-wip');
  const [fromLocId, setFromLocId] = useState('');
  const [toLocId, setToLocId] = useState(locations[0]?.id || 'loc-stage-1');
  const [selectedItemId, setSelectedItemId] = useState(rawMaterials[0]?.id || '');
  const [quantity, setQuantity] = useState(1000);
  const [selectedUOM, setSelectedUOM] = useState('');
  const [reference, setReference] = useState('أمر تشغيل خط البثق');
  const [notes, setNotes] = useState('');

  const selectedItem = rawMaterials.find(m => m.id === selectedItemId) || products.find(p => p.id === selectedItemId);
  const itemBaseUOM = selectedItem?.defaultUOM || 'KG';

  // Available UOMs for this item
  const availableUOMs = getAvailableUOMsForItem(itemBaseUOM, uoms);

  useEffect(() => {
    if (selectedItem) {
      setSelectedUOM(selectedItem.defaultUOM || 'KG');
    }
  }, [selectedItemId]);

  const activeTransactionUOM = selectedUOM || itemBaseUOM;
  const conversionFactor = getConversionFactorToBase(activeTransactionUOM, itemBaseUOM, uoms);
  const baseQuantity = quantity * conversionFactor;

  // SAP Business One: Valuation MUST be retrieved from the source Warehouse/Location layer
  const sourceStock = getItemWarehouseValuation(selectedItemId, fromWhId);
  const destStock = getItemWarehouseValuation(selectedItemId, toWhId);

  const sourceOnHand = sourceStock.currentQty || 0;
  const sourceValue = sourceStock.totalValue || 0;
  const sourceMAC = sourceStock.movingAverageCost || 0;

  const destOnHand = destStock.currentQty || 0;
  const destValue = destStock.totalValue || 0;
  const destMAC = destStock.movingAverageCost || 0;

  // Transfer cost MUST be source location's MAC immediately before posting
  const unitCostEGP = sourceMAC;
  const totalValueEGP = baseQuantity * unitCostEGP;

  const isSameLocation = fromWhId === toWhId;
  const isInsufficient = baseQuantity > sourceOnHand;

  // Projections
  const sourceProjectedOnHand = Math.max(0, sourceOnHand - baseQuantity);
  const sourceProjectedValue = sourceProjectedOnHand === 0 ? 0 : Math.max(0, sourceValue - totalValueEGP);
  const sourceProjectedMAC = sourceMAC; // Source MAC does not change!

  const destProjectedOnHand = destOnHand + baseQuantity;
  const destProjectedValue = destValue + totalValueEGP;
  const destProjectedMAC = destProjectedOnHand > 0 ? (destProjectedValue / destProjectedOnHand) : sourceMAC;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || quantity <= 0) return;
    if (isSameLocation || isInsufficient) return;

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
      uom: activeTransactionUOM,
      conversionFactor,
      baseQuantity,
      baseUOM: itemBaseUOM,
      unitCostEGP,
      totalValueEGP,
      reference,
      notes: notes || 'تحويل داخلي لخطوط الإنتاج',
      createdBy: currentUser?.fullName || 'System User'
    });

    setIsCreateOpen(false);
  };

  const handleApplyScannerTransfer = (transferData: {
    fromWarehouseId: string;
    toWarehouseId: string;
    toLocationId: string;
    items: Array<{
      item: any;
      quantity: number;
    }>;
    reference: string;
    notes: string;
  }) => {
    const today = new Date().toISOString().split('T')[0];

    transferData.items.forEach(scanned => {
      const uCost = scanned.item.movingAverageCost || 100;
      const tVal = scanned.quantity * uCost;

      addTransfer({
        date: today,
        fromWarehouseId: transferData.fromWarehouseId,
        fromLocationId: '',
        toWarehouseId: transferData.toWarehouseId,
        toLocationId: transferData.toLocationId,
        itemId: scanned.item.id,
        itemCode: scanned.item.code,
        itemName: isAr ? scanned.item.nameAr : scanned.item.nameEn,
        quantity: scanned.quantity,
        uom: scanned.item.defaultUOM || 'KG',
        unitCostEGP: uCost,
        totalValueEGP: tVal,
        reference: transferData.reference || 'تحويل تلقائي عبر مسح الباركود',
        notes: transferData.notes || 'تم مسح الأصناف والكميات عبر كاميرا الباركود',
        createdBy: currentUser?.fullName || 'Barcode Scanner'
      });
    });
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
        <div>
          <span className="font-mono font-bold text-slate-900">
            {formatNumber(t.quantity, language)} {t.uom}
          </span>
          {t.conversionFactor && t.conversionFactor !== 1 && (
            <div className="text-[10px] text-slate-500 font-mono">
              = {formatNumber(t.baseQuantity != null ? t.baseQuantity : (t.quantity * t.conversionFactor), language)} {t.baseUOM || 'KG'}
            </div>
          )}
        </div>
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
              onClick={() => setCancelModalTransfer(t)}
              className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
              title={isAr ? 'إلغاء وعكس إذن التحويل لكلا الطرفين (Atomic Reversal)' : 'Safe Cancellation & Reversal'}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
          {t.status === 'CANCELLED' && (
            <button
              onClick={() => setCancelModalTransfer(t)}
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-transfers-import-export"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition cursor-pointer"
            title={isAr ? 'تحميل قوالب واستيراد وتصدير التحويلات المخزنية' : 'Import / Export Transfers'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'استيراد وتصدير (Excel / CSV)' : 'Import / Export'}</span>
          </button>

          <button
            id="btn-open-barcode-scanner"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs border border-slate-700 transition"
            title={isAr ? 'مسح باركود الأصناف عبر الكاميرا' : 'Scan items via Camera Barcode'}
          >
            <Camera className="w-4 h-4 text-sky-400" />
            <span>{isAr ? 'ماسح الباركود (الكاميرا)' : 'Barcode Camera Scan'}</span>
          </button>

          <button
            id="btn-new-transfer"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إصدار إذن تحويل مخزني' : 'New Transfer'}</span>
          </button>
        </div>
      </div>

      {/* Offline Sync Service Worker Status Alert */}
      {(!isOnline || pendingCount > 0) && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold flex items-center gap-2">
                <span>
                  {isAr
                    ? 'خدمة المزامنة التلقائية في الخلفية (Background Sync Service) نشطة'
                    : 'Background Sync Service Worker Active'}
                </span>
                {!isOnline && (
                  <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded text-[10px] font-bold">
                    {isAr ? 'أوفلاين' : 'Offline'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800">
                {isAr
                  ? `أي تحويلات مخزنية يتم تسجيلها تُحفظ في قاعدة IndexedDB المحلية وتُزامن مع Odoo stock.picking فور توفر الشبكة (${pendingCount} معلق).`
                  : `Transfers are preserved locally in IndexedDB and queued for automatic Odoo sync on reconnect (${pendingCount} pending).`}
              </p>
            </div>
          </div>

          {isOnline && pendingCount > 0 && (
            <button
              type="button"
              onClick={() => triggerSync()}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 self-end sm:self-auto transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? (isAr ? 'جاري المزامنة...' : 'Syncing...') : (isAr ? 'مزامنة الطابور الآن' : 'Sync Queue Now')}</span>
            </button>
          )}
        </div>
      )}

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
        totalRecordsCount={transfers.length}
        filteredRecordsCount={filteredTransfers.length}
      />

      <DataTable
        id="transfers-table"
        data={filteredTransfers}
        columns={columns}
        keyExtractor={t => t.id}
        searchFields={['transferNumber', 'itemName', 'reference']}
        titleAr="سجل أذونات التحويل بين المواقع"
        titleEn="Stock Transfer Register"
        exportFileName="Stock_Transfers"
        isLoading={isLoading}
      />

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleCreateSubmit} className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
              {/* Pinned Top Header: Title & Item Selection */}
              <div className="shrink-0 bg-slate-900 text-white border-b border-slate-800">
                {/* Header Title Bar */}
                <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded bg-sky-500/20 text-sky-400 border border-sky-400/30 font-mono text-[10px] font-bold px-2 py-0.5">
                      Types 5 & 6 — SAP B1
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base">
                        {isAr ? 'إصدار إذن تحويل مخزني داخلي (Transfer Out & In)' : 'Create Stock Transfer'}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-400">
                        {isAr ? 'يتم الصرف بمتوسط تكلفة المصدر وإعادة احتساب متوسط تكلفة الوجهة آلياً' : 'Atomic linked Transfer Out & In using source location MAC'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Pinned Item Selection Bar */}
                <div className="px-4 py-2.5 sm:px-5 sm:py-2.5 bg-slate-800/95 border-t border-slate-700/60 text-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-xs text-sky-300">
                      {isAr ? 'الصنف المراد تحويله *' : 'Item to Transfer *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setIsScannerOpen(true);
                      }}
                      className="text-sky-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 bg-sky-950/70 hover:bg-sky-900 px-2.5 py-1 rounded-md border border-sky-500/30 transition shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isAr ? 'التحويل عبر مسح الباركود' : 'Use Barcode Scanner'}</span>
                    </button>
                  </div>
                  <select
                    value={selectedItemId}
                    onChange={e => setSelectedItemId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 font-medium text-white text-xs focus:ring-2 focus:ring-sky-500"
                    required
                  >
                    {rawMaterials.map(m => {
                      const st = getItemWarehouseValuation(m.id, fromWhId);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.nameAr} - رصيد المصدر: {formatNumber(st.currentQty, language)} {m.defaultUOM} (متوسط: {formatCurrency(st.movingAverageCost, language)})
                        </option>
                      );
                    })}
                    {products.map(p => {
                      const st = getItemWarehouseValuation(p.id, fromWhId);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.nameAr} - رصيد المصدر: {formatNumber(st.currentQty, language)} {p.defaultUOM} (متوسط: {formatCurrency(st.movingAverageCost, language)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-0 text-xs">
                {/* Source & Destination Warehouse Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 block text-xs">
                      {isAr ? 'المصدر (From):' : 'Source Location:'}
                    </span>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">
                        {isAr ? 'المستودع المصدر *' : 'From Warehouse *'}
                      </label>
                      <select
                        value={fromWhId}
                        onChange={e => setFromWhId(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
                      >
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.nameAr} ({w.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-200 space-y-1.5">
                    <span className="font-bold text-sky-900 block text-xs">
                      {isAr ? 'الوجهة (To):' : 'Destination Location:'}
                    </span>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">
                        {isAr ? 'مستودع الوجهة *' : 'To Warehouse *'}
                      </label>
                      <select
                        value={toWhId}
                        onChange={e => setToWhId(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
                      >
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.nameAr} ({w.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Same Location Validation Warning */}
                {isSameLocation && (
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs font-semibold">
                    {isAr
                      ? 'خطأ: يجب أن يكون مستودع المصدر مختلفاً عن مستودع الوجهة لإتمام التحويل.'
                      : 'Error: Source and destination locations must be different for inventory transfer.'}
                  </div>
                )}

                {/* Valuation Cards: Responsive 2 Columns Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Source Location Valuation Card */}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-700 text-xs block">
                      {isAr ? '1. تقييم المستودع المصدر (Transfer Out - يخصم بمتوسط التكلفة):' : '1. Source Warehouse Valuation (Transfer Out):'}
                    </span>
                    <LocationValuationCard
                      language={language}
                      locationName={warehouses.find(w => w.id === fromWhId)?.nameAr || fromWhId}
                      itemUOM={itemBaseUOM}
                      currentOnHand={sourceOnHand}
                      currentValue={sourceValue}
                      currentMAC={sourceMAC}
                      transactionQuantity={baseQuantity}
                      direction="TRANSFER"
                      unitCost={sourceMAC}
                      isCostLocked={true}
                      lockReason={isAr ? 'متوسط تكلفة المصدر مقفل (Source MAC Locked)' : 'Source MAC Locked'}
                      projectedNewOnHand={sourceProjectedOnHand}
                      projectedNewValue={sourceProjectedValue}
                      projectedNewMAC={sourceProjectedMAC}
                    />
                  </div>

                  {/* Destination Location Valuation Card */}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-700 text-xs block">
                      {isAr ? '2. تقييم مستودع الوجهة (Transfer In - يستلم القيمة ويعيد احتساب MAC):' : '2. Destination Warehouse Valuation (Transfer In):'}
                    </span>
                    <LocationValuationCard
                      language={language}
                      locationName={warehouses.find(w => w.id === toWhId)?.nameAr || toWhId}
                      itemUOM={itemBaseUOM}
                      currentOnHand={destOnHand}
                      currentValue={destValue}
                      currentMAC={destMAC}
                      transactionQuantity={baseQuantity}
                      direction="INCOMING"
                      unitCost={sourceMAC}
                      isCostLocked={true}
                      lockReason={isAr ? 'يستلم بتكلفة المصدر (Received at Transferred Cost)' : 'Received at Source Cost'}
                      projectedNewOnHand={destProjectedOnHand}
                      projectedNewValue={destProjectedValue}
                      projectedNewMAC={destProjectedMAC}
                    />
                  </div>
                </div>

                {/* Quantity, UOM, and Locked Transfer Unit Cost in 3 cols */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>{isAr ? 'وحدة القياس للحركة *' : 'Transfer UOM *'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({availableUOMs.length} {isAr ? 'متاحة' : 'avail'})</span>
                    </label>
                    <select
                      value={activeTransactionUOM}
                      onChange={e => setSelectedUOM(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
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
                      {isAr ? `الكمية المحولة (${activeTransactionUOM}) *` : `Transfer Qty (${activeTransactionUOM}) *`}
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
                          : 'border-slate-200 text-sky-700 focus:ring-sky-500'
                      }`}
                      required
                    />
                  </div>

                  {/* Locked System Transfer Cost */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>{isAr ? 'تكلفة التحويل المنقولة *' : 'Transfer Cost *'}</span>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {isAr ? 'تكلفة المصدر' : 'Source MAC'}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(unitCostEGP, language)}
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

                {/* Reference & Notes in 2 cols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {isAr ? 'المرجع / أمر التشغيل' : 'Reference'}
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
              </div>

              {/* Pinned Bottom Footer: Cost Preview & Actions */}
              <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                {/* Cost Preview */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-600 font-sans font-semibold">
                    {isAr ? 'قيمة التحويل المنقولة:' : 'Transferred Value:'}
                  </span>
                  <span className="font-bold text-slate-900 text-sm bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                    {formatCurrency(totalValueEGP, language)}
                  </span>
                </div>

                {/* Actions */}
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
                    disabled={isInsufficient || isSameLocation || quantity <= 0}
                    className={`px-5 py-2 rounded-lg font-bold text-white text-xs transition flex items-center gap-2 ${
                      isInsufficient || isSameLocation || quantity <= 0
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-98'
                    }`}
                  >
                    {isSameLocation ? (
                      <span>{isAr ? 'المصدر والوجهة متطابقان' : 'Same Location Error'}</span>
                    ) : isInsufficient ? (
                      <span>{isAr ? 'عجز في رصيد المصدر' : 'Insufficient Source Stock'}</span>
                    ) : (
                      <span>{isAr ? 'ترحيل التحويل المخزني (In & Out)' : 'Post Transfer'}</span>
                    )}
                  </button>
                </div>
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

      {/* Barcode Camera Scanner Integration */}
      <BarcodeTransferScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyTransfer={handleApplyScannerTransfer}
      />

      {/* Safe One-Click Cancellation & Reversal Modal */}
      {cancelModalTransfer && (
        <SafeTransactionCancelModal
          isOpen={true}
          onClose={() => setCancelModalTransfer(null)}
          documentType="TRANSFER"
          documentNumber={cancelModalTransfer.transferNumber}
          onSuccess={() => setCancelModalTransfer(null)}
        />
      )}

      <DataImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultEntity="transfers"
      />
    </div>
  );
};
