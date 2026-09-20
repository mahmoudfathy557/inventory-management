import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  Layers,
  Building2,
  TrendingUp,
  X,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber, exportToExcel } from '../../utils/formatters';
import { ItemType, TransactionType } from '../../types';

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
    ledgerEntries
  } = useApp();
  const isAr = language === 'ar';

  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [drillDownItem, setDrillDownItem] = useState<{ id: string; name: string; code: string } | null>(null);

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
        const closingQty = Math.max(0, totalIn - totalOut);
        const closingValue = closingQty * item.mac;

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
          movingAverageCost: item.mac,
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
      isAr ? 'الوحدة' : 'UOM',
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

    exportToExcel(headers, rows, 'Inventory_Balance_Report_Section_29');
  };

  // Drilldown entries for selected item
  const drillDownEntries = useMemo(() => {
    if (!drillDownItem) return [];
    return ledgerEntries.filter(e => e.itemId === drillDownItem.id);
  }, [drillDownItem, ledgerEntries]);

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

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isAr ? 'تصدير إكسيل (Excel)' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
      <div className="flex flex-wrap items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
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
                <th className="p-2.5 text-center">{isAr ? 'الوحدة' : 'UOM'}</th>
                <th className="p-2.5 text-center text-emerald-700 bg-emerald-50/50">{isAr ? 'وارد مشتريات' : 'Receipts'}</th>
                <th className="p-2.5 text-center text-blue-700 bg-blue-50/50">{isAr ? 'وارد إنتاج' : 'Prod Rec'}</th>
                <th className="p-2.5 text-center text-amber-700 bg-amber-50/50">{isAr ? 'تحويل وارد' : 'Trans In'}</th>
                <th className="p-2.5 text-center text-rose-700 bg-rose-50/50">{isAr ? 'استهلاك تصنيع' : 'Prod Cons'}</th>
                <th className="p-2.5 text-center text-orange-700 bg-orange-50/50">{isAr ? 'منصرف عام' : 'Issues'}</th>
                <th className="p-2.5 text-center text-purple-700 bg-purple-50/50">{isAr ? 'هالك' : 'Scrap'}</th>
                <th className="p-2.5 font-bold font-mono text-slate-900 bg-slate-100">{isAr ? 'الرصيد الختامي' : 'Closing Qty'}</th>
                <th className="p-2.5 text-slate-800">{isAr ? 'متوسط التكلفة' : 'MAC'}</th>
                <th className="p-2.5 font-bold text-emerald-800">{isAr ? 'القيمة الختامية' : 'Closing Value'}</th>
                <th className="p-2.5 text-center">{isAr ? 'تدقيق' : 'Audit'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((r, idx) => (
                <tr key={`${r.itemId}-${r.warehouseId}-${idx}`} className="hover:bg-slate-50/80 transition">
                  <td className="p-2.5 font-mono font-bold text-blue-700">{r.itemCode}</td>
                  <td className="p-2.5 font-medium text-slate-800">{r.itemName}</td>
                  <td className="p-2.5 text-slate-600">{r.warehouseName}</td>
                  <td className="p-2.5 text-center text-slate-500 font-mono">{r.uom}</td>
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
                    {formatNumber(r.closingQty, language)}
                  </td>
                  <td className="p-2.5 font-mono text-slate-700">
                    {formatCurrency(r.movingAverageCost, language)}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-emerald-700">
                    {formatCurrency(r.closingValue, language)}
                  </td>
                  <td className="p-2.5 text-center">
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
      {drillDownItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 shadow-xl border border-slate-200 max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{isAr ? 'تفاصيل حركات الصنف (Drill-Down)' : 'Transaction History'}</span>
                  <span className="font-mono text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {drillDownItem.code}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{drillDownItem.name}</p>
              </div>
              <button
                onClick={() => setDrillDownItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="p-2">{isAr ? 'رقم المستند' : 'Doc No'}</th>
                    <th className="p-2">{isAr ? 'نوع الحركة' : 'Type'}</th>
                    <th className="p-2">{isAr ? 'المستودع' : 'Warehouse'}</th>
                    <th className="p-2 text-center text-emerald-700">{isAr ? 'وارد' : 'In'}</th>
                    <th className="p-2 text-center text-rose-700">{isAr ? 'منصرف' : 'Out'}</th>
                    <th className="p-2 text-center font-bold">{isAr ? 'رصيد الحركة' : 'Balance'}</th>
                    <th className="p-2">{isAr ? 'متوسط التكلفة' : 'MAC'}</th>
                    <th className="p-2 font-bold text-emerald-800">{isAr ? 'القيمة التراكمية' : 'Running Value'}</th>
                    <th className="p-2">{isAr ? 'المستخدم' : 'User'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drillDownEntries.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-mono">{e.date}</td>
                      <td className="p-2 font-mono font-bold text-blue-600">{e.documentNumber}</td>
                      <td className="p-2 text-slate-700">{e.transactionType}</td>
                      <td className="p-2 text-slate-600">{e.warehouseName}</td>
                      <td className="p-2 text-center font-mono text-emerald-700">
                        {e.qtyIn > 0 ? formatNumber(e.qtyIn, language) : '-'}
                      </td>
                      <td className="p-2 text-center font-mono text-rose-700">
                        {e.qtyOut > 0 ? formatNumber(e.qtyOut, language) : '-'}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-slate-900">
                        {formatNumber(e.balanceQty, language)}
                      </td>
                      <td className="p-2 font-mono text-slate-600">
                        {formatCurrency(e.movingAverageCostEGP, language)}
                      </td>
                      <td className="p-2 font-mono font-bold text-emerald-700">
                        {formatCurrency(e.runningInventoryValueEGP, language)}
                      </td>
                      <td className="p-2 text-slate-500">{e.createdBy}</td>
                    </tr>
                  ))}
                  {drillDownEntries.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400">
                        {isAr ? 'لا توجد حركات مسجلة لهذا الصنف' : 'No recorded movements for this item'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setDrillDownItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
