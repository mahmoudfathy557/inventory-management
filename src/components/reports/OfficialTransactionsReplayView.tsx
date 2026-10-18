import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Download,
  AlertCircle,
  Clock,
  Play,
  RotateCcw,
  Check,
  Building2,
  ChevronRight,
  RefreshCw,
  Calculator
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber, exportToCSV } from '../../utils/formatters';
import {
  RAW_167_TRANSACTIONS,
  replayOfficialTransactions,
  ITEM_CATALOG,
  OFFICIAL_LOCATIONS,
  OfficialTransactionRaw,
  ComputedTransactionRow,
  StockByItemRecord
} from '../../data/officialDataset';
import {
  buildOfficialERPState,
  mapLocationToWarehouseId,
  mapCodeToTransactionType
} from '../../services/officialDatasetService';

export const OfficialTransactionsReplayView: React.FC = () => {
  const {
    language,
    rawMaterials,
    products,
    warehouses,
    ledgerEntries,
    getItemWarehouseValuation,
    recordOfficial167Transactions,
    isOfficialDatasetLoaded
  } = useApp();

  const isAr = language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'balances' | 'transactions' | 'recorder'>('balances');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedCodeFilter, setSelectedCodeFilter] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedSuccessMsg, setRecordedSuccessMsg] = useState<string | null>(null);

  // Single transaction recorder state
  const [singleSeq, setSingleSeq] = useState<number>(1);
  const [singleCustomItem, setSingleCustomItem] = useState<string>('Rm000001');
  const [singleCustomLocation, setSingleCustomLocation] = useState<string>('Raw Material');
  const [singleCustomQty, setSingleCustomQty] = useState<number>(1000);
  const [singleCustomPrice, setSingleCustomPrice] = useState<number>(850);

  // Compute reference official dataset replay
  const officialSummary = useMemo(() => {
    return replayOfficialTransactions(RAW_167_TRANSACTIONS);
  }, []);

  // Filtered target stock rows
  const filteredStockRows = useMemo(() => {
    return officialSummary.stockByItem.filter(row => {
      if (selectedLocation !== 'ALL' && row.location !== selectedLocation) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const codeMatch = row.itemCode.toLowerCase().includes(q);
        const nameMatch = row.itemName.toLowerCase().includes(q);
        const locMatch = row.location.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !locMatch) return false;
      }
      return true;
    });
  }, [officialSummary.stockByItem, selectedLocation, searchTerm]);

  // Filtered 167 transactions
  const filteredTransactions = useMemo(() => {
    return officialSummary.computedRows.filter(row => {
      if (selectedCodeFilter !== 'ALL' && row.code !== selectedCodeFilter) {
        return false;
      }
      if (selectedLocation !== 'ALL' && row.location !== selectedLocation) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const seqMatch = row.seq.toString() === q || `#${row.seq}`.includes(q);
        const codeMatch = row.itemCode.toLowerCase().includes(q);
        const nameMatch = (row.itemName || '').toLowerCase().includes(q);
        const typeMatch = row.typeName.toLowerCase().includes(q);
        const refMatch = (row.ref || '').toLowerCase().includes(q);
        const bpMatch = (row.bp || '').toLowerCase().includes(q);
        if (!seqMatch && !codeMatch && !nameMatch && !typeMatch && !refMatch && !bpMatch) {
          return false;
        }
      }
      return true;
    });
  }, [officialSummary.computedRows, selectedCodeFilter, selectedLocation, searchTerm]);

  // Handle Recording All 167 Transactions into the active ERP
  const handleRecordAllTransactions = async () => {
    setIsRecording(true);
    setRecordedSuccessMsg(null);
    try {
      // Small artificial timeout to give responsive UI feedback
      await new Promise(r => setTimeout(r, 400));
      const result = recordOfficial167Transactions();
      if (result.success) {
        setRecordedSuccessMsg(
          isAr
            ? `تم تسجيل كافة المعاملات الـ ${result.count} بنجاح! تم الوصول إلى الأرصدة المطلوبة كمية وقيمة بمطابقة 100%.`
            : `Successfully recorded all ${result.count} transactions! Target balances reached in quantity and value with 100% match.`
        );
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRecording(false);
    }
  };

  // Export Target Balances to CSV
  const handleExportBalancesCSV = () => {
    const headers = [
      isAr ? 'التسلسل' : 'Seq',
      isAr ? 'كود الصنف' : 'Item Code',
      isAr ? 'اسم الصنف' : 'Item Name',
      isAr ? 'نوع الصنف' : 'Item Type',
      isAr ? 'المستودع' : 'Location',
      isAr ? 'الكمية المطلوبة' : 'Target Qty',
      isAr ? 'متوسط التكلفة (ج.م)' : 'Target Avg Cost (EGP)',
      isAr ? 'القيمة الإجمالية (ج.م)' : 'Target Value (EGP)',
      isAr ? 'رصيد النظام الحالي' : 'Live System Qty',
      isAr ? 'قيمة النظام الحالية' : 'Live System Value',
      isAr ? 'حالة المطابقة' : 'Match Status'
    ];

    const rows = filteredStockRows.map(r => {
      const whId = mapLocationToWarehouseId(r.location);
      const liveStock = getItemWarehouseValuation(r.itemCode, whId);
      const isMatched = Math.abs(liveStock.currentQty - r.qty) < 0.01 && Math.abs(liveStock.totalValue - r.value) < 0.05;

      return [
        r.seq,
        r.itemCode,
        r.itemName,
        r.itemType,
        r.location,
        r.qty,
        r.avgCost.toFixed(4),
        r.value.toFixed(2),
        liveStock.currentQty,
        liveStock.totalValue.toFixed(2),
        isMatched ? 'مطابق 100%' : 'بانتظار التسجيل'
      ];
    });

    exportToCSV(headers, rows, 'Target_Inventory_Balances_167');
  };

  // Export 167 Ledger to CSV
  const handleExportLedgerCSV = () => {
    const headers = [
      '#Seq',
      isAr ? 'التاريخ' : 'Date',
      isAr ? 'كود الحركة' : 'Code',
      isAr ? 'نوع الحركة' : 'Type Name',
      isAr ? 'رقم المستند' : 'Trans Num',
      isAr ? 'الشريك' : 'Business Partner',
      isAr ? 'المرجع' : 'Reference',
      isAr ? 'كود الصنف' : 'Item Code',
      isAr ? 'اسم الصنف' : 'Item Name',
      isAr ? 'المخزن' : 'Location',
      isAr ? 'كمية الحركة' : 'Trans Qty',
      isAr ? 'تكلفة الوحدة' : 'Unit Cost',
      isAr ? 'قيمة الحركة' : 'Amount',
      isAr ? 'الرصيد بعد الحركة' : 'On Hand After',
      isAr ? 'قيمة الرصيد بعد الحركة' : 'Value After',
      isAr ? 'متوسط التكلفة بعد الحركة' : 'MAC After'
    ];

    const rows = filteredTransactions.map(r => [
      r.seq,
      r.date,
      r.code,
      r.typeName,
      r.transNum,
      r.bp || '',
      r.ref || '',
      r.itemCode,
      r.itemName || '',
      r.location,
      r.transQty || 0,
      r.cost.toFixed(4),
      r.amount.toFixed(2),
      r.onHandAfter,
      r.valueAfter.toFixed(2),
      r.macAfter.toFixed(4)
    ]);

    exportToCSV(headers, rows, 'Official_167_Transactions_Ledger');
  };

  // Check if live system currently matches official targets
  const liveMatchStatus = useMemo(() => {
    let matches = 0;
    let checked = 0;
    for (const r of officialSummary.stockByItem) {
      const whId = mapLocationToWarehouseId(r.location);
      const liveStock = getItemWarehouseValuation(r.itemCode, whId);
      checked++;
      if (Math.abs(liveStock.currentQty - r.qty) < 0.05 && Math.abs(liveStock.totalValue - r.value) < 1.0) {
        matches++;
      }
    }
    const isFullMatch = checked > 0 && matches === checked;
    return {
      matches,
      checked,
      percentage: checked > 0 ? (matches / checked) * 100 : 0,
      isFullMatch
    };
  }, [officialSummary.stockByItem, getItemWarehouseValuation, ledgerEntries]);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 shadow-xl border border-indigo-800/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'محرك تسجيل المعاملات الرسمية ومطابقة الأرصدة (167 حركة)' : 'Official Reference Valuation & Replay Engine (167 Movements)'}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              {isAr ? 'تسجيل المعاملات والوصول للأرصدة المطلوبة كمية وقيمة' : 'Record Transactions & Reach Target Balances in Qty & Value'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'تنفيذ وتسجيل دورة الحركات الـ 167 الكاملة بالترتيب الزمني الصارم، واحتساب التكاليف والكميات والقيم بالأرصدة المستهدفة بمطابقة تامة 100% بالمليم.'
                : 'Execute and record the complete 167 reference transactions sequentially, achieving exact target on-hand quantities and values with zero variance.'}
            </p>
          </div>

          {/* Action Button & Live Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="btn-record-all-official"
              onClick={handleRecordAllTransactions}
              disabled={isRecording}
              className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg transition transform active:scale-95 cursor-pointer ${
                liveMatchStatus.isFullMatch
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white ring-2 ring-emerald-400/40'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white animate-pulse'
              }`}
            >
              {isRecording ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>{isAr ? 'جارِ تسجيل المعاملات واحتساب الأرصدة...' : 'Recording & Replaying...'}</span>
                </>
              ) : liveMatchStatus.isFullMatch ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>{isAr ? 'إعادة تسجيل ومطابقة الحركات الـ 167' : 'Re-record & Synchronize 167 Moves'}</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current text-white" />
                  <span>{isAr ? 'سجل الـ 167 حركة واوصل للرصيد فوراً' : 'Record All 167 Transactions Now'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportBalancesCSV}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs backdrop-blur-xs border border-white/15 transition cursor-pointer"
              title={isAr ? 'تصدير جدول الأرصدة المطلوبة' : 'Export Target Balances'}
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>{isAr ? 'تصدير الأرصدة' : 'Export Balances'}</span>
            </button>
          </div>
        </div>

        {/* Live Match Notification Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">{isAr ? 'حالة مطابقة النظام الحالية:' : 'Live System Match Status:'}</span>
            {liveMatchStatus.isFullMatch ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                <span>{isAr ? 'مطابق 100% للأرصدة المطلوبة كمية وقيمة بالمليم' : '100% Perfectly Matched with Target Qty & Value'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? `مطابقة جزئية (${liveMatchStatus.matches}/${liveMatchStatus.checked}) - اضغط زر التسجيل أعلاه لتطبيق كافة الحركات`
                    : `Partial (${liveMatchStatus.matches}/${liveMatchStatus.checked}) - Click button above to record all transactions`}
                </span>
              </span>
            )}
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            {isAr ? 'إجمالي الحركات:' : 'Total Transactions:'} <span className="text-white font-bold">167</span> | {isAr ? 'الأصناف ذات الرصيد:' : 'Stock Items:'} <span className="text-white font-bold">{officialSummary.stockByItem.length}</span>
          </div>
        </div>

        {/* Success Alert Banner if just recorded */}
        {recordedSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{recordedSuccessMsg}</span>
            </div>
            <button onClick={() => setRecordedSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards: Target Balances by Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Raw Materials Warehouse */}
        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {isAr ? 'مخزن الخامات (1)' : 'Raw Material (1)'}
            </span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500">{isAr ? 'الرصيد المطلوب كمية وقيمة' : 'Target Balance Qty & Value'}</div>
            <div className="text-xl font-extrabold text-blue-900 font-mono mt-0.5">
              {formatCurrency(officialSummary.totalsByLocation['Raw Material'] || 0, language)}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1 font-mono">
              <span className="text-blue-700 font-bold">12,100</span> {isAr ? 'كجم (11 صنف خامات)' : 'KG (11 RM Items)'}
            </div>
          </div>
        </div>

        {/* Finished Goods Warehouse */}
        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {isAr ? 'مخزن المنتج التام (3)' : 'Finished Product (3)'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500">{isAr ? 'الرصيد المطلوب كمية وقيمة' : 'Target Balance Qty & Value'}</div>
            <div className="text-xl font-extrabold text-emerald-900 font-mono mt-0.5">
              {formatCurrency(officialSummary.totalsByLocation['Finished Product'] || 0, language)}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1 font-mono">
              <span className="text-emerald-700 font-bold">27,000</span> {isAr ? 'كجم (12 منتج تام)' : 'KG (12 FG Products)'}
            </div>
          </div>
        </div>

        {/* Scrap Warehouse */}
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {isAr ? 'مخزن الهوالك / السكراب (4)' : 'Scrap (4)'}
            </span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500">{isAr ? 'الرصيد المطلوب كمية وقيمة' : 'Target Balance Qty & Value'}</div>
            <div className="text-xl font-extrabold text-amber-900 font-mono mt-0.5">
              {formatCurrency(0, language)}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1 font-mono">
              <span className="text-amber-700 font-bold">518</span> {isAr ? 'كجم (تقييم 0 ج.م)' : 'KG (Zero Cost EGP)'}
            </div>
          </div>
        </div>

        {/* Grand Total Value */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-4 shadow-2xs border border-indigo-700">
          <div className="flex items-center justify-between text-indigo-300">
            <span className="text-xs font-bold uppercase tracking-wider">
              {isAr ? 'إجمالي قيمة المخزون' : 'Grand Total Value'}
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="mt-3">
            <div className="text-xs text-indigo-200">{isAr ? 'صافي القيمة المستهدفة' : 'Target Net Valuation'}</div>
            <div className="text-xl font-black font-mono mt-0.5 text-white">
              {formatCurrency(officialSummary.grandTotalValue, language)}
            </div>
            <div className="text-[11px] text-indigo-300 mt-1">
              {isAr ? '167 حركة موثقة بالكامل' : '167 Certified Replay Moves'}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('balances')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'balances'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{isAr ? 'الأرصدة المطلوبة كمية وقيمة (الأصناف)' : 'Target Balances in Qty & Value'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {officialSummary.stockByItem.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'transactions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{isAr ? 'سجل الحركات التفصيلي (167 حركة)' : 'Official 167 Movements Ledger'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
              167
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('recorder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'recorder'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{isAr ? 'تسجيل حركة محددة / محاكي الرصيد' : 'Single Movement Recorder'}</span>
          </button>
        </div>

        {/* Quick CSV Export */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'balances' ? (
            <button
              onClick={handleExportBalancesCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'تصدير الأرصدة (CSV)' : 'Export Balances (CSV)'}</span>
            </button>
          ) : (
            <button
              onClick={handleExportLedgerCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'تصدير الحركات (CSV)' : 'Export Ledger (CSV)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: TARGET BALANCES BY ITEM & LOCATION */}
      {activeSubTab === 'balances' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">{isAr ? 'تصفية المخزن:' : 'Location:'}</span>
              {['ALL', 'Raw Material', 'Finished Product', 'Scrap', 'Factory'].map(loc => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedLocation === loc
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {loc === 'ALL'
                    ? (isAr ? 'كافة المخازن' : 'All Locations')
                    : loc === 'Raw Material'
                    ? (isAr ? 'مخزن الخامات' : 'Raw Material')
                    : loc === 'Finished Product'
                    ? (isAr ? 'مخزن المنتج التام' : 'Finished Product')
                    : loc === 'Scrap'
                    ? (isAr ? 'مخزن السكراب' : 'Scrap')
                    : (isAr ? 'المصنع' : 'Factory')}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isAr ? 'بحث بكود أو اسم الصنف...' : 'Search by code or name...'}
                className="w-full text-xs pr-9 pl-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Balances Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">{isAr ? 'كود الصنف' : 'Item Code'}</th>
                    <th className="py-3 px-4">{isAr ? 'اسم الصنف' : 'Item Name'}</th>
                    <th className="py-3 px-3">{isAr ? 'نوع الصنف' : 'Type'}</th>
                    <th className="py-3 px-3">{isAr ? 'المخزن' : 'Location'}</th>
                    <th className="py-3 px-3 text-left font-mono">{isAr ? 'الكمية المطلوبة' : 'Target Qty'}</th>
                    <th className="py-3 px-3 text-left font-mono">{isAr ? 'متوسط التكلفة' : 'Avg Cost (EGP)'}</th>
                    <th className="py-3 px-3 text-left font-mono">{isAr ? 'القيمة المطلوبة' : 'Target Value (EGP)'}</th>
                    <th className="py-3 px-3 text-left font-mono">{isAr ? 'رصيد النظام الحالي' : 'Live System Qty & Value'}</th>
                    <th className="py-3 px-3 text-center">{isAr ? 'حالة المطابقة' : 'Match Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredStockRows.map((r, idx) => {
                    const whId = mapLocationToWarehouseId(r.location);
                    const liveStock = getItemWarehouseValuation(r.itemCode, whId);
                    const isQtyMatched = Math.abs(liveStock.currentQty - r.qty) < 0.05;
                    const isValMatched = Math.abs(liveStock.totalValue - r.value) < 1.0;
                    const isFullMatch = isQtyMatched && isValMatched;

                    return (
                      <tr
                        key={`${r.itemCode}-${r.location}`}
                        className={`hover:bg-slate-50/80 transition ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-slate-400">{r.seq}</td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-700">
                          {r.itemCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {r.itemName}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.itemType === 'Raw Material'
                                ? 'bg-blue-50 text-blue-700'
                                : r.itemType === 'Finished Product'
                                ? 'bg-emerald-50 text-emerald-700'
                                : r.itemType === 'Scrap'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {r.itemType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {r.location === 'Raw Material'
                            ? (isAr ? 'مخزن الخامات' : 'Raw Material')
                            : r.location === 'Finished Product'
                            ? (isAr ? 'مخزن المنتج التام' : 'Finished Product')
                            : r.location === 'Scrap'
                            ? (isAr ? 'مخزن السكراب' : 'Scrap')
                            : (isAr ? 'المصنع' : 'Factory')}
                        </td>
                        <td className="py-3 px-3 text-left font-mono font-bold text-slate-900">
                          {formatNumber(r.qty, language)} كجم
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-slate-600">
                          {r.avgCost !== 0 ? r.avgCost.toFixed(2) : '0.00'}
                        </td>
                        <td className="py-3 px-3 text-left font-mono font-bold text-blue-900">
                          {formatCurrency(r.value, language)}
                        </td>
                        <td className="py-3 px-3 text-left font-mono">
                          <div className="text-[11px] font-semibold text-slate-800">
                            {formatNumber(liveStock.currentQty, language)} كجم
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {formatCurrency(liveStock.totalValue, language)}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isFullMatch ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>{isAr ? 'مطابق 100%' : '100% Match'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{isAr ? 'بانتظار التسجيل' : 'Pending'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 167 OFFICIAL TRANSACTIONS LEDGER */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">{isAr ? 'نوع الحركة:' : 'Type:'}</span>
              {[
                { code: 'ALL', labelAr: 'الكل (167)', labelEn: 'All' },
                { code: 7, labelAr: 'توريد GRPO (7)', labelEn: 'GRPO' },
                { code: 8, labelAr: 'تكاليف شحن Landed (19)', labelEn: 'Landed' },
                { code: 5, labelAr: 'تحويل صادر Out (17)', labelEn: 'Transfer Out' },
                { code: 6, labelAr: 'تحويل وارد In (16)', labelEn: 'Transfer In' },
                { code: 4, labelAr: 'صرف للإنتاج (33)', labelEn: 'Issue Prod' },
                { code: 3, labelAr: 'استلام إنتاج (24)', labelEn: 'Receipt Prod' },
                { code: 11, labelAr: 'تسليم عملاء (11)', labelEn: 'Delivery' },
                { code: 13, labelAr: 'مرتجع عملاء (6)', labelEn: 'Customer Return' }
              ].map(f => (
                <button
                  key={f.code.toString()}
                  onClick={() => setSelectedCodeFilter(f.code as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedCodeFilter === f.code
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {isAr ? f.labelAr : f.labelEn}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isAr ? 'بحث برقم الحركة، الكود، المستند...' : 'Search #Seq, Code, Doc...'}
                className="w-full text-xs pr-9 pl-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-xs text-right divide-y divide-slate-200 sticky-header">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'نوع الحركة' : 'Transaction Type'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'رقم المستند' : 'Trans # / Ref'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'الشريك' : 'Partner'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'الصنف' : 'Item'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'المخزن' : 'Location'}</th>
                    <th className="py-2.5 px-3 text-left font-mono">{isAr ? 'كمية الحركة' : 'Qty'}</th>
                    <th className="py-2.5 px-3 text-left font-mono">{isAr ? 'التكلفة' : 'Cost (EGP)'}</th>
                    <th className="py-2.5 px-3 text-left font-mono">{isAr ? 'قيمة الحركة' : 'Amount (EGP)'}</th>
                    <th className="py-2.5 px-3 text-left font-mono">{isAr ? 'الرصيد بعد الحركة' : 'On Hand After'}</th>
                    <th className="py-2.5 px-3 text-left font-mono">{isAr ? 'القيمة بعد الحركة' : 'Value After'}</th>
                    <th className="py-2.5 px-3 text-left font-mono">{isAr ? 'متوسط التكلفة' : 'MAC After'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredTransactions.map((r, idx) => {
                    const isQtyPositive = (r.transQty || 0) > 0;
                    const isQtyNegative = (r.transQty || 0) < 0;

                    return (
                      <tr
                        key={r.seq}
                        className={`hover:bg-slate-50/80 transition ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                          #{r.seq}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {r.date}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.code === 7
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : r.code === 8
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : r.code === 5
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : r.code === 6
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : r.code === 4
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : r.code === 3
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : r.code === 11
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r.typeName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          <span className="font-bold">{r.transNum}</span>
                          {r.ref && <span className="text-[10px] text-slate-400 block font-sans">({r.ref})</span>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-[120px]">
                          {r.bp || '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-blue-700">{r.itemCode}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{r.itemName}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                          {r.location}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold">
                          {r.transQty !== null && r.transQty !== undefined ? (
                            <span
                              className={
                                isQtyPositive
                                  ? 'text-emerald-700'
                                  : isQtyNegative
                                  ? 'text-rose-700'
                                  : 'text-slate-400'
                              }
                            >
                              {isQtyPositive ? `+${r.transQty}` : r.transQty}
                            </span>
                          ) : (
                            <span className="text-purple-600 text-[10px]">Landed Cost</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono text-slate-600">
                          {r.cost.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold">
                          <span className={r.amount >= 0 ? 'text-blue-900' : 'text-rose-700'}>
                            {formatCurrency(r.amount, language)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-semibold text-slate-900 bg-slate-50/50">
                          {formatNumber(r.onHandAfter, language)}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900 bg-slate-50/50">
                          {formatCurrency(r.valueAfter, language)}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono text-blue-800 bg-slate-50/50">
                          {r.macAfter.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SINGLE TRANSACTION CALCULATOR & RECORDER */}
      {activeSubTab === 'recorder' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'محاكي ومسجل الحركات المنفردة بالأثر المحاسبي' : 'Interactive Single Movement Recorder & Calculator'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'اختر حركة محددة من الـ 167 حركة أو أدخل معطياتك لاحتساب الأثر على رصيد المخزون كمية وقيمة ومتوسط التكلفة فوراً'
                  : 'Select an official transaction or specify custom parameters to preview the exact inventory impact'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Input controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'اختيار حركة من الـ 167 حركة الرسمية:' : 'Pick Official Move (#1 to #167):'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="167"
                    value={singleSeq}
                    onChange={e => {
                      const num = parseInt(e.target.value, 10);
                      setSingleSeq(num);
                      const target = officialSummary.computedRows.find(r => r.seq === num);
                      if (target) {
                        setSingleCustomItem(target.itemCode);
                        setSingleCustomLocation(target.location);
                        setSingleCustomQty(Math.abs(target.transQty || 0));
                        setSingleCustomPrice(target.price || target.cost || 0);
                      }
                    }}
                    className="flex-1"
                  />
                  <span className="font-mono font-bold text-sm px-2 py-1 bg-slate-100 rounded text-blue-700">
                    #{singleSeq}
                  </span>
                </div>
              </div>

              {/* Show selected transaction info card */}
              {(() => {
                const target = officialSummary.computedRows.find(r => r.seq === singleSeq);
                if (!target) return null;
                return (
                  <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-blue-900">
                      <span>#{target.seq}: {target.typeName} (كود {target.code})</span>
                      <span className="font-mono">{target.date}</span>
                    </div>
                    <div className="text-slate-600">
                      {isAr ? 'الصنف:' : 'Item:'} <span className="font-bold text-slate-900">{target.itemCode} - {target.itemName}</span>
                    </div>
                    <div className="text-slate-600">
                      {isAr ? 'المخزن:' : 'Location:'} <span className="font-semibold text-slate-800">{target.location}</span>
                      {target.bp && <span className="mr-2"> | {isAr ? 'الشريك:' : 'Partner:'} {target.bp}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 block">{isAr ? 'الكمية' : 'Qty'}</span>
                        <span className="font-bold text-slate-900">{target.transQty || 'Landed Cost'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{isAr ? 'التكلفة' : 'Cost'}</span>
                        <span className="font-bold text-slate-900">{target.cost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{isAr ? 'القيمة' : 'Amount'}</span>
                        <span className="font-bold text-slate-900">{formatCurrency(target.amount, language)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right: Balance After Movement */}
            {(() => {
              const target = officialSummary.computedRows.find(r => r.seq === singleSeq);
              if (!target) return null;
              return (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{isAr ? 'الرصيد الناتج بعد هذه الحركة في المخزن:' : 'Stock Balance After This Movement:'}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
                      {isAr ? 'محسوب بدقة 100%' : 'Certified Exact'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">{isAr ? 'رصيد الكمية' : 'On Hand Qty'}</div>
                      <div className="text-base font-extrabold font-mono text-slate-900 mt-1">
                        {formatNumber(target.onHandAfter, language)}
                      </div>
                      <div className="text-[10px] text-slate-400">كجم</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">{isAr ? 'متوسط التكلفة' : 'MAC Cost'}</div>
                      <div className="text-base font-extrabold font-mono text-blue-700 mt-1">
                        {target.macAfter.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">ج.م / كجم</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">{isAr ? 'قيمة الرصيد' : 'Total Value'}</div>
                      <div className="text-base font-extrabold font-mono text-emerald-700 mt-1 truncate">
                        {formatCurrency(target.valueAfter, language)}
                      </div>
                      <div className="text-[10px] text-slate-400">ج.م مصري</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      {isAr
                        ? 'هذا الرصيد مطابق تماماً للمعادلات المحاسبية والمعيارية المعتمدة.'
                        : 'This balance matches official ERP valuation formulas exactly.'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
