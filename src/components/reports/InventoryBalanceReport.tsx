import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Eye,
  Layers,
  Building2,
  TrendingUp,
  X,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber, exportToCSV } from '../../utils/formatters';
import { ItemType, TransactionType } from '../../types';
import { PrintPreviewModal, PrintPreviewColumn, PrintPreviewSummaryItem } from '../common/PrintPreviewModal';

interface InventoryBalanceRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  uom: string;
  warehouseId: string;
  warehouseName: string;
  openingQty: number;
  receiptsQty: number;
  transfersInQty: number;
  productionReceiptsQty: number;
  issuesQty: number;
  transfersOutQty: number;
  productionConsumptionQty: number;
  scrapQty: number;
  closingQty: number;
  movingAverageCost: number;
  closingValue: number;
}

export const InventoryBalanceReport: React.FC = () => {
  const {
    language,
    rawMaterials,
    products,
    warehouses,
    ledgerEntries,
    getItemWarehouseValuation,
    receipts,
    landedCosts,
    issues,
    transfers,
    productionOrders,
    materialIssues,
    productionReceipts,
    customerDeliveries
  } = useApp();
  const isAr = language === 'ar';

  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [drillDownItem, setDrillDownItem] = useState<{ id: string; name: string; code: string } | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [showCanceled, setShowCanceled] = useState<boolean>(false);

  const cancelledDocNums = useMemo(() => {
    const set = new Set<string>();
    (receipts || []).forEach(r => { if (r.status === 'CANCELLED') set.add(r.receiptNumber); });
    (landedCosts || []).forEach(lc => { if (lc.status === 'CANCELLED') set.add(lc.landedCostNumber); });
    (issues || []).forEach(i => { if (i.status === 'CANCELLED') set.add(i.issueNumber); });
    (transfers || []).forEach(t => { if (t.status === 'CANCELLED') set.add(t.transferNumber); });
    (productionOrders || []).forEach(po => { if ((po.status as string) === 'CANCELLED') set.add(po.orderNumber); });
    (materialIssues || []).forEach(mi => { if (mi.status === 'CANCELLED') set.add(mi.issueNumber); });
    (productionReceipts || []).forEach(pr => { if (pr.status === 'CANCELLED') set.add(pr.receiptNumber); });
    (customerDeliveries || []).forEach(d => { if (d.status === 'CANCELLED') set.add(d.deliveryNumber); });
    return set;
  }, [receipts, landedCosts, issues, transfers, productionOrders, materialIssues, productionReceipts, customerDeliveries]);

  // Compute balance rows for each item and warehouse combination
  const balanceRows: InventoryBalanceRow[] = useMemo(() => {
    const allItems = [
      ...rawMaterials.map(rm => ({
        id: rm.id,
        code: rm.code,
        name: isAr ? rm.nameAr : rm.nameEn,
        type: ItemType.RAW_MATERIAL,
        uom: rm.defaultUOM,
        mac: rm.movingAverageCost || 0,
        defaultWh: rm.defaultWarehouseId
      })),
      ...products.map(p => ({
        id: p.id,
        code: p.code,
        name: isAr ? p.nameAr : p.nameEn,
        type: p.productType,
        uom: p.defaultUOM,
        mac: p.movingAverageCost || 0,
        defaultWh: p.defaultWarehouseId
      }))
    ];

    const rows: InventoryBalanceRow[] = [];

    allItems.forEach(item => {
      // Find warehouses relevant to this item
      const relevantWarehouses = selectedWarehouse === 'ALL'
        ? warehouses
        : warehouses.filter(w => w.id === selectedWarehouse);

      relevantWarehouses.forEach(wh => {
        const itemEntries = ledgerEntries.filter(
          e => e.itemId === item.id && e.warehouseId === wh.id
        );

        if (itemEntries.length === 0 && item.defaultWh !== wh.id) {
          return; // Skip empty combinations
        }

        let receiptsQty = 0;
        let transfersInQty = 0;
        let productionReceiptsQty = 0;
        let issuesQty = 0;
        let transfersOutQty = 0;
        let productionConsumptionQty = 0;
        let scrapQty = 0;

        itemEntries.forEach(entry => {
          switch (entry.transactionType) {
            case TransactionType.PURCHASE_RECEIPT:
              receiptsQty += entry.qtyIn;
              break;
            case TransactionType.TRANSFER_IN:
              transfersInQty += entry.qtyIn;
              break;
            case TransactionType.FINISHED_GOODS_RECEIPT:
            case TransactionType.SEMI_FINISHED_RECEIPT:
              productionReceiptsQty += entry.qtyIn;
              break;
            case TransactionType.INVENTORY_ISSUE:
            case TransactionType.CUSTOMER_DELIVERY:
              issuesQty += entry.qtyOut;
              break;
            case TransactionType.TRANSFER_OUT:
              transfersOutQty += entry.qtyOut;
              break;
            case TransactionType.MATERIAL_ISSUE_PRODUCTION:
              productionConsumptionQty += entry.qtyOut;
              break;
            case TransactionType.SCRAP:
              scrapQty += entry.qtyIn;
              break;
            default:
              if (entry.qtyIn > 0) receiptsQty += entry.qtyIn;
              if (entry.qtyOut > 0) issuesQty += entry.qtyOut;
          }
        });

        const totalIn = receiptsQty + transfersInQty + productionReceiptsQty + scrapQty;
        const totalOut = issuesQty + transfersOutQty + productionConsumptionQty;
        const whStock = getItemWarehouseValuation(item.id, wh.id);
        const closingQty = whStock.currentQty;
        const movingAverageCost = whStock.movingAverageCost;
        const closingValue = whStock.totalValue;

        // Skip rows that have zero activity and zero stock
        if (totalIn === 0 && totalOut === 0 && closingQty === 0) return;

        rows.push({
          itemId: item.id,
          itemCode: item.code,
          itemName: item.name,
          itemType: item.type,
          uom: item.uom,
          warehouseId: wh.id,
          warehouseName: isAr ? wh.nameAr : wh.nameEn,
          openingQty: 0,
          receiptsQty,
          transfersInQty,
          productionReceiptsQty,
          issuesQty,
          transfersOutQty,
          productionConsumptionQty,
          scrapQty,
          closingQty,
          movingAverageCost,
          closingValue
        });
      });
    });

    return rows;
  }, [rawMaterials, products, warehouses, ledgerEntries, isAr, selectedWarehouse]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return balanceRows.filter(r => {
      if (selectedType !== 'ALL' && r.itemType !== selectedType) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          r.itemCode.toLowerCase().includes(q) ||
          r.itemName.toLowerCase().includes(q) ||
          r.warehouseName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [balanceRows, selectedType, searchTerm]);

  // Totals
  const totalClosingQty = filteredRows.reduce((acc, r) => acc + r.closingQty, 0);
  const totalClosingValue = filteredRows.reduce((acc, r) => acc + r.closingValue, 0);

  const handleExport = () => {
    const headers = [
      isAr ? 'كود الصنف' : 'Item Code',
      isAr ? 'اسم الصنف' : 'Item Name',
      isAr ? 'المستودع' : 'Warehouse',
      isAr ? 'نوع الصنف' : 'Item Type',
      isAr ? 'الوحدة الموحدة' : 'Unified Base UOM',
      isAr ? 'الوارد مشتريات' : 'Purchase Receipts',
      isAr ? 'تحويلات واردة' : 'Transfers In',
      isAr ? 'إنتاج تام وارد' : 'Prod Receipts',
      isAr ? 'منصرف عام وعملاء' : 'Issues',
      isAr ? 'تحويلات منصرفة' : 'Transfers Out',
      isAr ? 'استهلاك تصنيع' : 'Prod Consumption',
      isAr ? 'الهالك' : 'Scrap',
      isAr ? 'الرصيد الختامي' : 'Closing Qty',
      isAr ? 'متوسط التكلفة' : 'MAC',
      isAr ? 'قيمة الرصيد (ج.م)' : 'Closing Value (EGP)'
    ];

    const rows = filteredRows.map(r => [
      r.itemCode,
      r.itemName,
      r.warehouseName,
      r.itemType,
      r.uom,
      r.receiptsQty,
      r.transfersInQty,
      r.productionReceiptsQty,
      r.issuesQty,
      r.transfersOutQty,
      r.productionConsumptionQty,
      r.scrapQty,
      r.closingQty,
      r.movingAverageCost,
      r.closingValue
    ]);

    exportToCSV(headers, rows, 'Inventory_Balance_Report');
  };

  // Drilldown entries for selected item
  const drillDownEntries = useMemo(() => {
    if (!drillDownItem) return [];
    
    // Sort chronological first!
    const itemEntries = [...ledgerEntries]
      .filter(e => e.itemId === drillDownItem.id)
      .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

    // Track running balance and value defensively to protect against zeroed values
    let runningQty = 0;
    let runningVal = 0;
    let runningMAC = 0;

    const computed = itemEntries.map(entry => {
      const isCancelled = cancelledDocNums.has(entry.documentNumber);
      
      let balanceQty = runningQty;
      let runningInventoryVal = runningVal;
      let mac = runningMAC;

      if (!isCancelled) {
        // If it's a valid transaction, calculate its effect
        const isLandedCost = entry.transactionType === TransactionType.LANDED_COST;
        const isCostAdj = entry.transactionType === TransactionType.COST_ADJUSTMENT;

        if (isLandedCost || isCostAdj) {
          const addedVal = entry.transactionValueEGP || 0;
          runningVal += addedVal;
          if (runningQty > 0) {
            runningMAC = runningVal / runningQty;
          }
        } else {
          if (entry.qtyIn > 0) {
            const inVal = entry.transactionValueEGP || (entry.qtyIn * entry.unitCostEGP);
            runningQty += entry.qtyIn;
            runningVal += inVal;
            runningMAC = runningQty > 0 ? (runningVal / runningQty) : 0;
          }
          if (entry.qtyOut > 0) {
            const outVal = entry.transactionValueEGP || (entry.qtyOut * runningMAC);
            runningQty = Math.max(0, runningQty - entry.qtyOut);
            runningVal = Math.max(0, runningVal - outVal);
            if (runningQty === 0) {
              runningVal = 0;
              runningMAC = 0;
            }
          }
        }
        
        balanceQty = runningQty;
        runningInventoryVal = runningVal;
        mac = runningMAC;
      }

      return {
        ...entry,
        isCancelled,
        balanceQty,
        runningInventoryValueEGP: runningInventoryVal,
        movingAverageCostEGP: mac
      };
    });

    // Filter based on whether we should show canceled documents
    if (showCanceled) {
      return computed;
    } else {
      return computed.filter(e => !e.isCancelled);
    }
  }, [drillDownItem, ledgerEntries, cancelledDocNums, showCanceled]);

  return (
    <div className="space-y-4">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAr ? 'تقرير أرصدة المخزون والحركة التفصيلية (Section 29)' : 'Inventory Balance Report (Section 29)'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'متابعة حركة الوارد والمنصرف والتحويل والاستهلاك الختامي مع متوسط التكلفة وإمكانية التدقيق التفصيلي (Drill-down)'
              : 'Track detailed In/Out movements, transfers, production consumption, closing qty, MAC and drill-down to transactions.'}
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            id="btn-print-inventory-balance"
            onClick={() => setShowPrintPreview(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>{isAr ? 'طباعة الكشف' : 'Print Balance'}</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            title={isAr ? 'تصدير أرصدة المخزون إلى ملف CSV' : 'Export Inventory Balances to CSV'}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print-avoid-break">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="text-[11px] text-slate-500 font-medium">{isAr ? 'عدد السجلات المعروضة' : 'Displayed Items'}</div>
          <div className="text-lg font-mono font-bold text-slate-800">{filteredRows.length}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
          <div className="text-[11px] text-blue-700 font-medium">{isAr ? 'إجمالي الكميات الختامية' : 'Total Closing Qty'}</div>
          <div className="text-lg font-mono font-bold text-blue-900">{formatNumber(totalClosingQty, language)}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl col-span-2">
          <div className="text-[11px] text-emerald-700 font-medium">{isAr ? 'إجمالي القيمة التقديرية للرصيد' : 'Total Valuation'}</div>
          <div className="text-lg font-mono font-bold text-emerald-900">{formatCurrency(totalClosingValue, language)}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs no-print">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث بكود أو اسم الصنف والمستودع...' : 'Search item code, name, warehouse...'}
            className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">{isAr ? 'المستودع:' : 'Warehouse:'}</span>
          <select
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
          >
            <option value="ALL">{isAr ? 'جميع المستودعات' : 'All Warehouses'}</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {isAr ? w.nameAr : w.nameEn} ({w.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">{isAr ? 'نوع الصنف:' : 'Item Type:'}</span>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
          >
            <option value="ALL">{isAr ? 'الكل' : 'All Types'}</option>
            <option value={ItemType.RAW_MATERIAL}>{isAr ? 'خامات (Raw Material)' : 'Raw Material'}</option>
            <option value={ItemType.SEMI_FINISHED}>{isAr ? 'نصف مصنع (Semi-Finished)' : 'Semi-Finished'}</option>
            <option value={ItemType.FINISHED_PRODUCT}>{isAr ? 'منتج تام (Finished Product)' : 'Finished Product'}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">{isAr ? 'كود الصنف' : 'Code'}</th>
                <th className="p-2.5">{isAr ? 'اسم الصنف' : 'Item Name'}</th>
                <th className="p-2.5">{isAr ? 'المستودع' : 'Warehouse'}</th>
                <th className="p-2.5 text-center">{isAr ? 'الوحدة الموحدة' : 'Unified UOM'}</th>
                <th className="p-2.5 text-center text-emerald-700 bg-emerald-50/50">{isAr ? 'وارد مشتريات' : 'Receipts'}</th>
                <th className="p-2.5 text-center text-blue-700 bg-blue-50/50">{isAr ? 'وارد إنتاج' : 'Prod Rec'}</th>
                <th className="p-2.5 text-center text-amber-700 bg-amber-50/50">{isAr ? 'تحويل وارد' : 'Trans In'}</th>
                <th className="p-2.5 text-center text-rose-700 bg-rose-50/50">{isAr ? 'استهلاك تصنيع' : 'Prod Cons'}</th>
                <th className="p-2.5 text-center text-orange-700 bg-orange-50/50">{isAr ? 'منصرف عام' : 'Issues'}</th>
                <th className="p-2.5 text-center text-purple-700 bg-purple-50/50">{isAr ? 'هالك' : 'Scrap'}</th>
                <th className="p-2.5 font-bold font-mono text-slate-900 bg-slate-100">{isAr ? 'الرصيد الختامي' : 'Closing Qty'}</th>
                <th className="p-2.5 text-slate-800">{isAr ? 'متوسط التكلفة' : 'MAC'}</th>
                <th className="p-2.5 font-bold text-emerald-800">{isAr ? 'القيمة الختامية' : 'Closing Value'}</th>
                <th className="p-2.5 text-center no-print">{isAr ? 'تدقيق' : 'Audit'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((r, idx) => (
                <tr key={`${r.itemId}-${r.warehouseId}-${idx}`} className="hover:bg-slate-50/80 transition">
                  <td className="p-2.5 font-mono font-bold text-blue-700">{r.itemCode}</td>
                  <td className="p-2.5 font-medium text-slate-800">{r.itemName}</td>
                  <td className="p-2.5 text-slate-600">{r.warehouseName}</td>
                  <td className="p-2.5 text-center text-slate-700 font-mono font-bold bg-slate-50/50">{r.uom}</td>
                  <td className="p-2.5 text-center font-mono text-emerald-700 bg-emerald-50/30">
                    {r.receiptsQty > 0 ? formatNumber(r.receiptsQty, language) : '-'}
                  </td>
                  <td className="p-2.5 text-center font-mono text-blue-700 bg-blue-50/30">
                    {r.productionReceiptsQty > 0 ? formatNumber(r.productionReceiptsQty, language) : '-'}
                  </td>
                  <td className="p-2.5 text-center font-mono text-amber-700 bg-amber-50/30">
                    {r.transfersInQty > 0 ? formatNumber(r.transfersInQty, language) : '-'}
                  </td>
                  <td className="p-2.5 text-center font-mono text-rose-700 bg-rose-50/30">
                    {r.productionConsumptionQty > 0 ? formatNumber(r.productionConsumptionQty, language) : '-'}
                  </td>
                  <td className="p-2.5 text-center font-mono text-orange-700 bg-orange-50/30">
                    {r.issuesQty > 0 ? formatNumber(r.issuesQty, language) : '-'}
                  </td>
                  <td className="p-2.5 text-center font-mono text-purple-700 bg-purple-50/30">
                    {r.scrapQty > 0 ? formatNumber(r.scrapQty, language) : '-'}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-slate-900 bg-slate-50">
                    {formatNumber(r.closingQty, language)} <span className="text-[10px] text-slate-500 font-normal">{r.uom}</span>
                  </td>
                  <td className="p-2.5 font-mono text-slate-700">
                    {formatCurrency(r.movingAverageCost, language)}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-emerald-700">
                    {formatCurrency(r.closingValue, language)}
                  </td>
                  <td className="p-2.5 text-center no-print">
                    <button
                      onClick={() => setDrillDownItem({ id: r.itemId, name: r.itemName, code: r.itemCode })}
                      className="p-1 rounded text-blue-600 hover:bg-blue-50 transition"
                      title={isAr ? 'عرض الحركات التفصيلية (Drill-down)' : 'Drill-down transactions'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-slate-400">
                    {isAr ? 'لا توجد أصناف مطابقة لمعايير البحث والفلترة' : 'No items match your filter criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down Modal (Section 29 requirement: Allow drill-down into underlying transactions) */}
      {drillDownItem && (() => {
        const itemRow = filteredRows.find(r => r.itemId === drillDownItem.id);
        const itemUom = itemRow?.uom || 'KG';
        
        // Always calculate the KPIs based on non-cancelled (active) entries!
        const activeEntries = drillDownEntries.filter(e => !e.isCancelled);
        const totalLandedCostAllocated = activeEntries
          .filter(e => e.transactionType === TransactionType.LANDED_COST)
          .reduce((sum, e) => sum + (e.transactionValueEGP || 0), 0);
        const lastActiveEntry = activeEntries.length > 0 ? activeEntries[activeEntries.length - 1] : null;
        const currentBalance = lastActiveEntry ? lastActiveEntry.balanceQty : (itemRow?.closingQty || 0);
        const currentMAC = lastActiveEntry ? lastActiveEntry.movingAverageCostEGP : (itemRow?.movingAverageCost || 0);
        const currentValuation = lastActiveEntry ? lastActiveEntry.runningInventoryValueEGP : (itemRow?.closingValue || 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {isAr ? 'تفاصيل حركات الصنف وسجل التكلفة (Transaction History)' : 'Item Transaction & Costing History'}
                    </h4>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200">
                      {drillDownItem.code}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{drillDownItem.name}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {isAr ? 'الوحدة الموحدة: ' : 'Unified Base UOM: '} {itemUom}
                    </span>
                  </div>
                </div>

                {/* Show Canceled Toggle */}
                <div className="flex items-center gap-2 mx-4 no-print">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition shadow-2xs">
                    <input
                      type="checkbox"
                      checked={showCanceled}
                      onChange={(e) => setShowCanceled(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>{isAr ? 'إظهار العمليات المُلغاة' : 'Show Canceled Transactions'}</span>
                  </label>
                </div>

                <button
                  onClick={() => setDrillDownItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title={isAr ? 'إغلاق' : 'Close'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">{isAr ? 'رصيد المخزون الحالي' : 'Current Stock Balance'}</span>
                  <span className="font-mono font-bold text-sm text-slate-900 mt-0.5 block">
                    {formatNumber(currentBalance, language)} {itemUom}
                  </span>
                </div>
                <div className="bg-blue-50/60 rounded-xl p-2.5 border border-blue-100">
                  <span className="text-blue-700 block text-[11px] font-medium">{isAr ? 'متوسط التكلفة المتحرك (MAC)' : 'Current MAC'}</span>
                  <span className="font-mono font-bold text-sm text-blue-900 mt-0.5 block">
                    {formatCurrency(currentMAC, language)}
                  </span>
                </div>
                <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100">
                  <span className="text-emerald-700 block text-[11px] font-medium">{isAr ? 'إجمالي قيمة المخزون الجاري' : 'Total Inventory Valuation'}</span>
                  <span className="font-mono font-bold text-sm text-emerald-900 mt-0.5 block">
                    {formatCurrency(currentValuation, language)}
                  </span>
                </div>
                <div className="bg-purple-50/60 rounded-xl p-2.5 border border-purple-100">
                  <span className="text-purple-700 block text-[11px] font-medium">{isAr ? 'تكاليف الإنزال المضافة' : 'Landed Costs Added'}</span>
                  <span className="font-mono font-bold text-sm text-purple-900 mt-0.5 block">
                    {totalLandedCostAllocated > 0 ? `+${formatCurrency(totalLandedCostAllocated, language)}` : '0.00 ج.م'}
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10 backdrop-blur-xs">
                    <tr>
                      <th className="p-2.5">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="p-2.5">{isAr ? 'رقم المستند' : 'Doc No'}</th>
                      <th className="p-2.5">{isAr ? 'نوع الحركة' : 'Type'}</th>
                      <th className="p-2.5">{isAr ? 'المستودع' : 'Warehouse'}</th>
                      <th className="p-2.5 text-center text-emerald-700">{isAr ? 'وارد (كمية)' : 'In (Qty)'}</th>
                      <th className="p-2.5 text-center text-rose-700">{isAr ? 'منصرف (كمية)' : 'Out (Qty)'}</th>
                      <th className="p-2.5 text-center font-bold text-slate-900">{isAr ? 'رصيد الكمية' : 'Balance Qty'}</th>
                      <th className="p-2.5 text-center font-bold text-purple-800 bg-purple-50/50">{isAr ? 'قيمة الحركة' : 'Txn Value'}</th>
                      <th className="p-2.5 font-bold text-blue-900">{isAr ? 'متوسط التكلفة' : 'MAC'}</th>
                      <th className="p-2.5 font-bold text-emerald-800">{isAr ? 'القيمة التراكمية' : 'Running Value'}</th>
                      <th className="p-2.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-2.5">{isAr ? 'المستخدم' : 'User'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {drillDownEntries.map((e, idx) => {
                      const isLandedCost = e.transactionType === TransactionType.LANDED_COST;
                      const isPurchaseReceipt = e.transactionType === TransactionType.PURCHASE_RECEIPT;
                      const isOutMovement = e.qtyOut > 0;
                      const isCancelled = e.isCancelled;

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 transition-colors ${
                            isCancelled
                              ? 'bg-rose-50/20 text-slate-400 opacity-70 line-through decoration-slate-300'
                              : isLandedCost
                              ? 'bg-purple-50/20'
                              : ''
                          }`}
                        >
                          <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">{e.date}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                            {e.documentNumber}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {isLandedCost ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                <DollarSign className="w-3 h-3 text-purple-600" />
                                {isAr ? 'تكلفة إنزال (Landed Cost)' : 'Landed Cost'}
                              </span>
                            ) : isPurchaseReceipt ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {isAr ? 'إذن إضافة مشتريات' : 'Purchase Receipt'}
                              </span>
                            ) : (
                              <span className="font-medium text-slate-700">{e.transactionType}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600 whitespace-nowrap">{e.warehouseName}</td>

                          {/* In Column */}
                          <td className="p-2.5 text-center font-mono whitespace-nowrap">
                            {isLandedCost ? (
                              <span
                                className="text-[10px] font-mono font-bold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded"
                                title={isAr ? 'إضافة قيمة فقط دون زيادة الكمية' : 'Value-only adjustment without adding physical stock'}
                              >
                                {isAr ? '0 (تكلفة فقط)' : '0 (Cost Only)'}
                              </span>
                            ) : e.qtyIn > 0 ? (
                              <span className={`font-bold ${isCancelled ? 'text-slate-400' : 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded'}`}>
                                +{formatNumber(e.qtyIn, language)}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Out Column */}
                          <td className="p-2.5 text-center font-mono whitespace-nowrap">
                            {e.qtyOut > 0 ? (
                              <span className={`font-bold ${isCancelled ? 'text-slate-400' : 'text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded'}`}>
                                -{formatNumber(e.qtyOut, language)}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Balance Qty Column */}
                          <td className="p-2.5 text-center font-mono font-bold text-slate-900 whitespace-nowrap">
                            <span className={`${isCancelled ? 'text-slate-400 font-normal' : 'bg-slate-100 px-2 py-0.5 rounded'}`}>
                              {formatNumber(e.balanceQty, language)} {e.uom || itemUom}
                            </span>
                          </td>

                          {/* Transaction Value Column */}
                          <td className="p-2.5 text-center font-mono whitespace-nowrap">
                            {isCancelled ? (
                              <span className="text-slate-400 font-normal">—</span>
                            ) : isLandedCost ? (
                              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 shadow-2xs">
                                +{formatCurrency(e.transactionValueEGP, language)}
                              </span>
                            ) : isPurchaseReceipt || (e.qtyIn > 0 && e.transactionValueEGP > 0) ? (
                              <span className="font-bold text-emerald-700">
                                +{formatCurrency(e.transactionValueEGP, language)}
                              </span>
                            ) : isOutMovement && e.transactionValueEGP > 0 ? (
                              <span className="font-bold text-rose-700">
                                -{formatCurrency(e.transactionValueEGP, language)}
                              </span>
                            ) : e.transactionValueEGP > 0 ? (
                              <span className="font-semibold text-slate-700">
                                {formatCurrency(e.transactionValueEGP, language)}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Moving Average Cost (MAC) */}
                          <td className="p-2.5 font-mono font-semibold text-blue-950 whitespace-nowrap">
                            {isCancelled ? (
                              <span className="text-slate-400 font-normal">—</span>
                            ) : (
                              formatCurrency(e.movingAverageCostEGP, language)
                            )}
                          </td>

                          {/* Running Inventory Value */}
                          <td className="p-2.5 font-mono font-bold text-emerald-800 whitespace-nowrap">
                            {isCancelled ? (
                              <span className="text-slate-400 font-normal">—</span>
                            ) : (
                              <span className="bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100">
                                {formatCurrency(e.runningInventoryValueEGP, language)}
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="p-2.5 text-center whitespace-nowrap">
                            {isCancelled ? (
                              <span className="font-semibold text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shadow-2xs">
                                {isAr ? 'ملغى' : 'CANCELED'}
                              </span>
                            ) : (
                              <span className="font-semibold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                                {isAr ? 'نشط' : 'Active'}
                              </span>
                            )}
                          </td>

                          {/* Created By User */}
                          <td className="p-2.5 text-slate-500 whitespace-nowrap">{e.createdBy}</td>
                        </tr>
                      );
                    })}
                    {drillDownEntries.length === 0 && (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-400">
                          {isAr ? 'لا توجد حركات مسجلة لهذا الصنف' : 'No recorded movements for this item'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  {isAr
                    ? 'يتم تحديث الرصيد ومتوسط التكلفة المتحرك (MAC) آلياً مع كل إذن استلام أو تكلفة إنزال.'
                    : 'Inventory balance and Moving Average Cost (MAC) are automatically updated with each receipt and landed cost.'}
                </span>
                <button
                  onClick={() => setDrillDownItem(null)}
                  className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-2xs"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dedicated Print Preview Modal for Inventory Balances */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        reportTitleAr="تقرير أرصدة المخزون والحركة التفصيلية (Section 29)"
        reportTitleEn="Inventory Balance & Detailed Movements Report (Section 29)"
        reportSubtitleAr="كشف رسمي معتمد بالأرصدة الافتتاحية، حركات الوارد والمنصرف، الاستهلاك الصناعي ومتوسط التكلفة المتحرك (MAC)"
        reportSubtitleEn="Certified Official Statement of Opening Balances, Receipts, Issues, Industrial Consumption & MAC Valuation"
        documentNumber={`INV-BAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`}
        categoryLabelAr={selectedWarehouse === 'ALL' ? 'كافة المستودعات والصالات' : warehouses.find(w => w.id === selectedWarehouse)?.nameAr}
        categoryLabelEn={selectedWarehouse === 'ALL' ? 'All Warehouses' : warehouses.find(w => w.id === selectedWarehouse)?.nameEn}
        filterScopeAr={`المستودع: ${selectedWarehouse === 'ALL' ? 'الكل' : warehouses.find(w => w.id === selectedWarehouse)?.nameAr} | النوع: ${selectedType === 'ALL' ? 'كافة الأصناف' : selectedType}`}
        filterScopeEn={`Warehouse: ${selectedWarehouse === 'ALL' ? 'All' : warehouses.find(w => w.id === selectedWarehouse)?.nameEn} | Type: ${selectedType}`}
        summaryCards={[
          { labelAr: 'عدد السجلات المعروضة', labelEn: 'Items Count', value: filteredRows.length, isNumber: true, variant: 'default' },
          { labelAr: 'إجمالي الكميات الختامية', labelEn: 'Total Closing Qty', value: `${formatNumber(totalClosingQty, language)} كجم`, variant: 'info' },
          { labelAr: 'إجمالي القيمة التقديرية للرصيد', labelEn: 'Total Valuation', value: totalClosingValue, isCurrency: true, variant: 'success' },
          { labelAr: 'المستودعات المشمولة', labelEn: 'Warehouses In Scope', value: selectedWarehouse === 'ALL' ? warehouses.length : 1, isNumber: true, variant: 'default' }
        ]}
        financialSummary={[
          { labelAr: 'إجمالي قيمة المخزون الدفتري', labelEn: 'Total Book Value', value: totalClosingValue },
          { labelAr: 'إجمالي كمية المخزون الفعلي', labelEn: 'Total Physical Stock Qty', value: totalClosingQty }
        ]}
        notes={
          isAr
            ? 'تم إعداد هذا التقرير آلياً وفقاً لمعيار المحاسبة المصري رقم (2) وتدقيق متوسط التكلفة المتحرك مع كل حركة إضافة جديدة للمخازن.'
            : 'Generated in compliance with EAS 2 / IAS 2 standard with real-time Moving Average Costing (MAC) recalculated per receipt.'
        }
        columns={[
          { key: 'code', headerAr: 'كود الصنف', headerEn: 'Item Code', isMono: true, width: '90px' },
          { key: 'name', headerAr: 'اسم الصنف والمواصفة', headerEn: 'Item Name' },
          { key: 'wh', headerAr: 'المستودع', headerEn: 'Warehouse' },
          { key: 'uom', headerAr: 'الوحدة الموحدة', headerEn: 'Unified UOM', align: 'center', width: '70px' },
          { key: 'in', headerAr: 'وارد مشتريات', headerEn: 'Purch Receipts', align: 'right', isMono: true },
          { key: 'trIn', headerAr: 'تحويل وارد', headerEn: 'Transfer In', align: 'right', isMono: true },
          { key: 'prodIn', headerAr: 'وارد إنتاج', headerEn: 'Prod Receipts', align: 'right', isMono: true },
          { key: 'out', headerAr: 'صرف وتسليم', headerEn: 'Issues/Deliv', align: 'right', isMono: true },
          { key: 'trOut', headerAr: 'تحويل منصرف', headerEn: 'Transfer Out', align: 'right', isMono: true },
          { key: 'prodCons', headerAr: 'استهلاك تشغيل', headerEn: 'Consumption', align: 'right', isMono: true },
          { key: 'scrap', headerAr: 'هالك', headerEn: 'Scrap', align: 'right', isMono: true },
          { key: 'closing', headerAr: 'الرصيد الختامي', headerEn: 'Closing Qty', align: 'right', isMono: true },
          { key: 'mac', headerAr: 'متوسط التكلفة', headerEn: 'MAC (EGP)', align: 'right', isMono: true },
          { key: 'value', headerAr: 'قيمة الرصيد (ج.م)', headerEn: 'Total Value', align: 'right', isMono: true }
        ]}
        rows={filteredRows.map(r => [
          r.itemCode,
          r.itemName,
          r.warehouseName,
          r.uom,
          formatNumber(r.receiptsQty, language),
          formatNumber(r.transfersInQty, language),
          formatNumber(r.productionReceiptsQty, language),
          formatNumber(r.issuesQty, language),
          formatNumber(r.transfersOutQty, language),
          formatNumber(r.productionConsumptionQty, language),
          formatNumber(r.scrapQty, language),
          formatNumber(r.closingQty, language),
          formatCurrency(r.movingAverageCost, language),
          formatCurrency(r.closingValue, language)
        ])}
        onExportCSV={handleExport}
        defaultOrientation="landscape"
      />
    </div>
  );
};
