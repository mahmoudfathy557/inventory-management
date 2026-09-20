import React, { useState } from 'react';
import {
  BookOpen,
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  Building2,
  TrendingUp,
  Layers,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Factory,
  BarChart3,
  Shield,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { formatCurrency, formatNumber, exportToExcel } from '../utils/formatters';
import { InventoryLedgerEntry } from '../types';

import { InventoryBalanceReport } from '../components/reports/InventoryBalanceReport';
import { ProductionMonitoringReport } from '../components/reports/ProductionMonitoringReport';
import { MaterialConsumptionReport } from '../components/reports/MaterialConsumptionReport';
import { ScrapReport } from '../components/reports/ScrapReport';
import { LandedCostReport } from '../components/reports/LandedCostReport';
import { GlobalAuditReport } from '../components/reports/GlobalAuditReport';
import { ProductionCostImpactReport } from '../components/reports/ProductionCostImpactReport';

type ReportTab =
  | 'ledger'
  | 'balance'
  | 'production'
  | 'consumption'
  | 'scrap'
  | 'landed'
  | 'cost-impact'
  | 'audit-log';

export const InventoryAuditView: React.FC = () => {
  const {
    language,
    ledgerEntries,
    rawMaterials,
    products,
    warehouses
  } = useApp();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<ReportTab>('balance');

  // Ledger Filter states
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('ALL');
  const [selectedItemId, setSelectedItemId] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter entries for ledger
  const filteredEntries = ledgerEntries.filter(entry => {
    if (selectedWarehouseId !== 'ALL' && entry.warehouseId !== selectedWarehouseId) {
      return false;
    }
    if (selectedItemId !== 'ALL' && entry.itemId !== selectedItemId) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        entry.documentNumber.toLowerCase().includes(q) ||
        entry.itemName.toLowerCase().includes(q) ||
        (entry.notes || '').toLowerCase().includes(q) ||
        entry.createdBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalIn = filteredEntries.reduce((sum, e) => sum + e.qtyIn, 0);
  const totalOut = filteredEntries.reduce((sum, e) => sum + e.qtyOut, 0);
  const lastEntry = filteredEntries[filteredEntries.length - 1];
  const netValuation = lastEntry ? lastEntry.runningInventoryValueEGP : 0;

  const handleExportLedger = () => {
    const headers = [
      isAr ? 'التاريخ' : 'Date',
      isAr ? 'رقم المستند' : 'Doc Number',
      isAr ? 'نوع الحركة' : 'Transaction Type',
      isAr ? 'الصنف' : 'Item',
      isAr ? 'المستودع' : 'Warehouse',
      isAr ? 'الوارد' : 'Qty In',
      isAr ? 'المنصرف' : 'Qty Out',
      isAr ? 'رصيد الكمية' : 'Balance Qty',
      isAr ? 'متوسط التكلفة' : 'MAC Cost',
      isAr ? 'قيمة المخزون الجاري' : 'Running Value',
      isAr ? 'المُحرر' : 'Created By'
    ];

    const rows = filteredEntries.map(e => [
      e.date,
      e.documentNumber,
      e.transactionType,
      e.itemName,
      e.warehouseName,
      e.qtyIn,
      e.qtyOut,
      e.balanceQty,
      e.movingAverageCostEGP,
      e.runningInventoryValueEGP,
      e.createdBy
    ]);

    exportToExcel(headers, rows, 'Inventory_Audit_Ledger');
  };

  const ledgerColumns: Column<InventoryLedgerEntry>[] = [
    {
      key: 'date',
      headerAr: 'التاريخ',
      headerEn: 'Date',
      render: e => <span className="font-mono text-xs">{e.date}</span>,
      exportValue: e => e.date
    },
    {
      key: 'documentNumber',
      headerAr: 'رقم المستند',
      headerEn: 'Document No',
      render: e => (
        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {e.documentNumber}
        </span>
      ),
      exportValue: e => e.documentNumber
    },
    {
      key: 'transactionType',
      headerAr: 'نوع الحركة',
      headerEn: 'Transaction Type',
      render: e => <StatusChip status={e.transactionType} size="sm" />,
      exportValue: e => e.transactionType
    },
    {
      key: 'itemName',
      headerAr: 'الصنف المستهدف',
      headerEn: 'Item Name',
      render: e => (
        <div>
          <div className="font-semibold text-slate-900">{e.itemName}</div>
          <div className="text-[10px] text-slate-400 font-mono">{e.itemCode}</div>
        </div>
      ),
      exportValue: e => e.itemName
    },
    {
      key: 'warehouseName',
      headerAr: 'المستودع',
      headerEn: 'Warehouse',
      render: e => <span className="text-slate-700">{e.warehouseName}</span>,
      exportValue: e => e.warehouseName
    },
    {
      key: 'qtyIn',
      headerAr: 'الوارد (+)',
      headerEn: 'Qty In',
      render: e =>
        e.qtyIn > 0 ? (
          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            +{formatNumber(e.qtyIn, language)} {e.uom}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        ),
      exportValue: e => e.qtyIn
    },
    {
      key: 'qtyOut',
      headerAr: 'المنصرف (-)',
      headerEn: 'Qty Out',
      render: e =>
        e.qtyOut > 0 ? (
          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
            -{formatNumber(e.qtyOut, language)} {e.uom}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        ),
      exportValue: e => e.qtyOut
    },
    {
      key: 'balanceQty',
      headerAr: 'الرصيد التراكمي',
      headerEn: 'Balance Qty',
      render: e => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
          {formatNumber(e.balanceQty, language)} {e.uom}
        </span>
      ),
      exportValue: e => e.balanceQty
    },
    {
      key: 'movingAverageCostEGP',
      headerAr: 'متوسط التكلفة MAC',
      headerEn: 'MAC Cost (EGP)',
      render: e => (
        <span className="font-mono font-semibold text-slate-700">
          {formatCurrency(e.movingAverageCostEGP, language)}
        </span>
      ),
      exportValue: e => e.movingAverageCostEGP
    },
    {
      key: 'runningInventoryValueEGP',
      headerAr: 'القيمة الجارية للمخزون',
      headerEn: 'Running Valuation',
      render: e => (
        <span className="font-mono font-bold text-blue-900">
          {formatCurrency(e.runningInventoryValueEGP, language)}
        </span>
      ),
      exportValue: e => e.runningInventoryValueEGP
    }
  ];

  const reportTabs = [
    {
      id: 'balance' as ReportTab,
      labelAr: 'أرصدة المخزون وحركات الصنف (Sec 29)',
      labelEn: 'Inventory Balances (Sec 29)',
      icon: Layers
    },
    {
      id: 'ledger' as ReportTab,
      labelAr: 'دفتر أستاذ المخزون العام (Ledger)',
      labelEn: 'Audit Ledger',
      icon: BookOpen
    },
    {
      id: 'production' as ReportTab,
      labelAr: 'متابعة أوامر الإنتاج (Sec 31)',
      labelEn: 'Production Monitoring (Sec 31)',
      icon: Factory
    },
    {
      id: 'consumption' as ReportTab,
      labelAr: 'استهلاك المواد وفروقاتها (Sec 32)',
      labelEn: 'Material Consumption (Sec 32)',
      icon: BarChart3
    },
    {
      id: 'scrap' as ReportTab,
      labelAr: 'الهالك والسكراب الصناعي (Sec 33)',
      labelEn: 'Industrial Scrap (Sec 33)',
      icon: AlertTriangle
    },
    {
      id: 'landed' as ReportTab,
      labelAr: 'تكاليف الإنزال (Sec 34)',
      labelEn: 'Landed Costs (Sec 34)',
      icon: DollarSign
    },
    {
      id: 'cost-impact' as ReportTab,
      labelAr: 'تحليل أثر تكلفة التصنيع (Sec 44 & 48)',
      labelEn: 'Cost Impact Analysis (Sec 44)',
      icon: Sparkles
    },
    {
      id: 'audit-log' as ReportTab,
      labelAr: 'سجل التدقيق الشامل (Sec 35)',
      labelEn: 'Global Audit Log (Sec 35)',
      icon: Shield
    }
  ];

  return (
    <div className="space-y-5" id="view-inventory-reports">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>{isAr ? 'مركز التقارير والتدقيق المخزني والصناعي' : 'Reports & Audit Control Center'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'المنظومة المتكاملة لتقارير أرصدة المخزون، دورة التصنيع، استهلاك الخامات، الهالك، تكاليف الإنزال، وسجل التدقيق'
              : 'Complete reports suite: inventory balances, production tracking, material consumption, scrap, landed cost, and audit logs.'}
          </p>
        </div>
      </div>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto flex items-center gap-1">
        {reportTabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isAr ? t.labelAr : t.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      {activeTab === 'balance' && <InventoryBalanceReport />}
      {activeTab === 'production' && <ProductionMonitoringReport />}
      {activeTab === 'consumption' && <MaterialConsumptionReport />}
      {activeTab === 'scrap' && <ScrapReport />}
      {activeTab === 'landed' && <LandedCostReport />}
      {activeTab === 'cost-impact' && <ProductionCostImpactReport />}
      {activeTab === 'audit-log' && <GlobalAuditReport />}

      {/* Ledger Tab Content */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                {isAr ? 'تصفية حسب المستودع / الصالة:' : 'Filter by Warehouse:'}
              </label>
              <select
                value={selectedWarehouseId}
                onChange={e => setSelectedWarehouseId(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="ALL">{isAr ? 'جميع المستودعات والصالات' : 'All Warehouses'}</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.nameAr} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                {isAr ? 'تصفية حسب الصنف / كرت الصنف:' : 'Filter by Item Card:'}
              </label>
              <select
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="ALL">{isAr ? 'جميع الأصناف والمواد الخام' : 'All Items'}</option>
                <optgroup label={isAr ? 'المواد الخام' : 'Raw Materials'}>
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nameAr}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={isAr ? 'المنتجات التامة' : 'Finished Goods'}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                {isAr ? 'بحث سريع في المستندات:' : 'Quick Search:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={isAr ? 'رقم المستند، الصنف، اسم المحرر...' : 'Doc number, item, user...'}
                  className="w-full p-2 pl-8 rounded-lg border border-slate-200"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Real-time Audit Ledger Reconciliation Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-medium">{isAr ? 'إجمالي الحركات الموثقة' : 'Audited Entries'}</div>
              <div className="text-lg font-bold font-mono text-slate-900">{filteredEntries.length}</div>
            </div>
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <div className="text-[11px] text-emerald-800 font-medium">{isAr ? 'إجمالي كميات الوارد' : 'Total Qty In'}</div>
              <div className="text-lg font-bold font-mono text-emerald-700">+{formatNumber(totalIn, language)} كجم</div>
            </div>
            <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
              <div className="text-[11px] text-rose-800 font-medium">{isAr ? 'إجمالي كميات المنصرف' : 'Total Qty Out'}</div>
              <div className="text-lg font-bold font-mono text-rose-700">-{formatNumber(totalOut, language)} كجم</div>
            </div>
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
              <div className="text-[11px] text-blue-800 font-medium">{isAr ? 'قيمة الرصيد الحالي' : 'Current Valuation'}</div>
              <div className="text-lg font-bold font-mono text-blue-800">
                {formatCurrency(netValuation, language)}
              </div>
            </div>
          </div>

          {/* Main Ledger Table */}
          <DataTable
            id="audit-ledger-table"
            data={filteredEntries}
            columns={ledgerColumns}
            keyExtractor={e => e.id}
            searchFields={['documentNumber', 'itemName']}
            titleAr="دفتر أستاذ المخزون التفصيلي"
            titleEn="Item Inventory Ledger"
            exportFileName="Inventory_Ledger"
          />
        </div>
      )}
    </div>
  );
};
