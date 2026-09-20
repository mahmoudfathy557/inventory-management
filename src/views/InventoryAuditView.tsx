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
  AlertTriangle,
  Download,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { formatCurrency, formatNumber, exportToCSV } from '../utils/formatters';
import { InventoryLedgerEntry, ItemType, TransactionType } from '../types';

import { InventoryBalanceReport } from '../components/reports/InventoryBalanceReport';
import { ProductionMonitoringReport } from '../components/reports/ProductionMonitoringReport';
import { MaterialConsumptionReport } from '../components/reports/MaterialConsumptionReport';
import { ScrapReport } from '../components/reports/ScrapReport';
import { LandedCostReport } from '../components/reports/LandedCostReport';
import { GlobalAuditReport } from '../components/reports/GlobalAuditReport';
import { ProductionCostImpactReport } from '../components/reports/ProductionCostImpactReport';
import { AuditPrintHeader } from '../components/reports/AuditPrintHeader';
import { AuditPrintFooter } from '../components/reports/AuditPrintFooter';
import { PrintPreviewModal, PrintPreviewColumn, PrintPreviewSummaryItem } from '../components/common/PrintPreviewModal';

import { InventoryAuditSkeleton } from '../components/common/Skeleton';
import { usePerceivedLoading } from '../hooks/usePerceivedLoading';

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
  const { isLoading } = usePerceivedLoading(180);
  const {
    language,
    ledgerEntries,
    rawMaterials,
    products,
    warehouses,
    productionOrders,
    productionReceipts,
    landedCosts,
    receipts,
    costAdjustments,
    auditLogs
  } = useApp();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<ReportTab>('balance');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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

  // Master Export to CSV for the currently active tab
  const handleExportCurrentTabToCSV = () => {
    switch (activeTab) {
      case 'balance': {
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

        const rows: (string | number)[][] = [];
        allItems.forEach(item => {
          warehouses.forEach(wh => {
            const itemEntries = ledgerEntries.filter(
              e => e.itemId === item.id && e.warehouseId === wh.id
            );
            if (itemEntries.length === 0 && item.defaultWh !== wh.id) return;

            let receiptsQty = 0;
            let transfersInQty = 0;
            let prodReceiptsQty = 0;
            let issuesQty = 0;
            let transfersOutQty = 0;
            let prodConsumptionQty = 0;
            let scrapQty = 0;

            itemEntries.forEach(e => {
              if (e.transactionType === TransactionType.PURCHASE_RECEIPT) receiptsQty += e.qtyIn;
              else if (e.transactionType === TransactionType.TRANSFER_IN) transfersInQty += e.qtyIn;
              else if (e.transactionType === TransactionType.FINISHED_GOODS_RECEIPT || e.transactionType === TransactionType.SEMI_FINISHED_RECEIPT) prodReceiptsQty += e.qtyIn;
              else if (e.transactionType === TransactionType.INVENTORY_ISSUE || e.transactionType === TransactionType.CUSTOMER_DELIVERY) issuesQty += e.qtyOut;
              else if (e.transactionType === TransactionType.TRANSFER_OUT) transfersOutQty += e.qtyOut;
              else if (e.transactionType === TransactionType.MATERIAL_ISSUE_PRODUCTION) prodConsumptionQty += e.qtyOut;
              else if (e.transactionType === TransactionType.SCRAP) scrapQty += e.qtyOut;
            });

            const lastLedger = itemEntries[itemEntries.length - 1];
            const closingQty = lastLedger ? lastLedger.balanceQty : 0;
            const mac = lastLedger ? lastLedger.movingAverageCostEGP : item.mac;
            const closingValue = closingQty * mac;

            rows.push([
              item.code,
              item.name,
              isAr ? wh.nameAr : wh.nameEn,
              item.type,
              item.uom,
              receiptsQty,
              transfersInQty,
              prodReceiptsQty,
              issuesQty,
              transfersOutQty,
              prodConsumptionQty,
              scrapQty,
              closingQty,
              mac,
              closingValue
            ]);
          });
        });

        const headers = [
          isAr ? 'كود الصنف' : 'Item Code',
          isAr ? 'اسم الصنف' : 'Item Name',
          isAr ? 'المستودع' : 'Warehouse',
          isAr ? 'النوع' : 'Type',
          isAr ? 'الوحدة' : 'UOM',
          isAr ? 'وارد مشتريات' : 'Purchase Receipts',
          isAr ? 'تحويلات واردة' : 'Transfers In',
          isAr ? 'وارد إنتاج تام' : 'Production Receipts',
          isAr ? 'صرف وتسليمات' : 'Issues & Deliveries',
          isAr ? 'تحويلات منصرفة' : 'Transfers Out',
          isAr ? 'استهلاك تشغيل' : 'Prod Consumption',
          isAr ? 'الهالك' : 'Scrap',
          isAr ? 'الرصيد الختامي' : 'Closing Balance',
          isAr ? 'متوسط التكلفة MAC' : 'MAC Cost (EGP)',
          isAr ? 'إجمالي قيمة المخزون (ج.م)' : 'Total Inventory Value (EGP)'
        ];

        exportToCSV(headers, rows, 'Audit_Inventory_Balances');
        break;
      }

      case 'ledger': {
        const headers = [
          isAr ? 'التاريخ' : 'Date',
          isAr ? 'رقم المستند' : 'Doc Number',
          isAr ? 'نوع الحركة' : 'Transaction Type',
          isAr ? 'الصنف' : 'Item',
          isAr ? 'كود الصنف' : 'Item Code',
          isAr ? 'المستودع' : 'Warehouse',
          isAr ? 'الوارد (+)' : 'Qty In',
          isAr ? 'المنصرف (-)' : 'Qty Out',
          isAr ? 'الرصيد التراكمي' : 'Balance Qty',
          isAr ? 'متوسط التكلفة MAC (ج.م)' : 'MAC Cost (EGP)',
          isAr ? 'قيمة المخزون الجاري (ج.م)' : 'Running Valuation (EGP)',
          isAr ? 'المُحرر' : 'Created By',
          isAr ? 'ملاحظات' : 'Notes'
        ];

        const rows = filteredEntries.map(e => [
          e.date,
          e.documentNumber,
          e.transactionType,
          e.itemName,
          e.itemCode,
          e.warehouseName,
          e.qtyIn,
          e.qtyOut,
          e.balanceQty,
          e.movingAverageCostEGP,
          e.runningInventoryValueEGP,
          e.createdBy,
          e.notes || ''
        ]);

        exportToCSV(headers, rows, 'Audit_Inventory_Ledger');
        break;
      }

      case 'production': {
        const headers = [
          isAr ? 'رقم أمر الإنتاج' : 'Order No',
          isAr ? 'التاريخ' : 'Date',
          isAr ? 'المنتج التام' : 'Product',
          isAr ? 'الكمية المخططة' : 'Planned Qty',
          isAr ? 'المنجز الفعلي' : 'Actual Produced',
          isAr ? 'كمية الهالك' : 'Scrap Qty',
          isAr ? 'قائمة المواد (BOM)' : 'BOM Code',
          isAr ? 'الماكينة / الخط' : 'Machine',
          isAr ? 'المرحلة الإنتاجية' : 'Stage',
          isAr ? 'تكلفة الخامات الفعلية (ج.م)' : 'Material Cost (EGP)',
          isAr ? 'حالة الأمر' : 'Status',
          isAr ? 'حالة الجودة' : 'Quality Status',
          isAr ? 'المُنشئ' : 'Created By'
        ];

        const rows = productionOrders.map(o => [
          o.orderNumber,
          o.productionDate,
          o.productName,
          o.plannedQuantity,
          o.actualFinishedQuantity || 0,
          o.actualScrapQuantity || 0,
          o.bomCode,
          o.machineName || '-',
          o.productionStage,
          o.actualMaterialCostEGP || 0,
          o.status,
          o.qualityStatus,
          o.createdBy
        ]);

        exportToCSV(headers, rows, 'Audit_Production_Orders');
        break;
      }

      case 'consumption': {
        const headers = [
          isAr ? 'رقم أمر الإنتاج' : 'Order No',
          isAr ? 'تاريخ التشغيل' : 'Date',
          isAr ? 'المنتج التام' : 'Product',
          isAr ? 'الخامة المستهلكة' : 'Material Name',
          isAr ? 'كود الخامة' : 'Material Code',
          isAr ? 'الوحدة' : 'UOM',
          isAr ? 'الكمية المخططة' : 'Planned Qty',
          isAr ? 'الكمية الفعلية المنصرفة' : 'Actual Issued Qty',
          isAr ? 'فرق الكمية' : 'Variance Qty',
          isAr ? 'متوسط التكلفة MAC' : 'Unit Cost MAC',
          isAr ? 'التكلفة المخططة' : 'Planned Cost (EGP)',
          isAr ? 'التكلفة الفعلية' : 'Actual Cost (EGP)',
          isAr ? 'انحراف التكلفة' : 'Cost Variance (EGP)'
        ];

        const rows = productionOrders.flatMap(po =>
          (po.materials || []).map(mat => {
            const plannedCost = mat.plannedQty * (mat.movingAverageCostEGP || 110);
            const actualCost = mat.actualCostEGP || (mat.actualIssuedQty * (mat.movingAverageCostEGP || 110));
            return [
              po.orderNumber,
              po.productionDate,
              po.productName,
              mat.rawMaterialName,
              mat.rawMaterialCode,
              mat.uom,
              mat.plannedQty,
              mat.actualIssuedQty,
              mat.actualIssuedQty - mat.plannedQty,
              mat.movingAverageCostEGP || 110,
              plannedCost,
              actualCost,
              actualCost - plannedCost
            ];
          })
        );

        exportToCSV(headers, rows, 'Audit_Material_Consumption_Variance');
        break;
      }

      case 'scrap': {
        const headers = [
          isAr ? 'التاريخ' : 'Date',
          isAr ? 'رقم أمر الإنتاج' : 'Order No',
          isAr ? 'المنتج التام' : 'Product',
          isAr ? 'بند الهالك' : 'Scrap Item',
          isAr ? 'كمية الهالك' : 'Scrap Qty',
          isAr ? 'الوحدة' : 'UOM',
          isAr ? 'المستودع' : 'Warehouse',
          isAr ? 'التكلفة المعيارية' : 'Standard Cost (EGP)',
          isAr ? 'المعالجة المحاسبية' : 'Accounting Rule'
        ];

        const rows = productionReceipts
          .filter(r => (r.scrapQuantity || 0) > 0)
          .map(r => [
            r.date,
            r.productionOrderNumber,
            r.productName,
            `${isAr ? 'عادم وهالك تشغيل' : 'Scrap & Waste'} ${r.productName}`,
            r.scrapQuantity,
            r.uom,
            isAr ? 'مستودع السكراب والهالك' : 'Scrap Warehouse',
            0,
            isAr ? 'قاعدة MVP: الهالك بقيمة معيارية = 0 ج.م' : 'MVP Rule: Standard Value = 0 EGP'
          ]);

        exportToCSV(headers, rows, 'Audit_Industrial_Scrap');
        break;
      }

      case 'landed': {
        const headers = [
          isAr ? 'رقم تكلفة الإنزال' : 'Landed Cost No',
          isAr ? 'التاريخ' : 'Date',
          isAr ? 'رقم إذن الاستلام' : 'Receipt No',
          isAr ? 'الصنف المستفيد' : 'Beneficiary Item',
          isAr ? 'نوع التكلفة' : 'Cost Type',
          isAr ? 'القيمة الأصلية للمخزون' : 'Original Value (EGP)',
          isAr ? 'تكلفة الإنزال المحملة' : 'Landed Cost (EGP)',
          isAr ? 'القيمة المعدلة للمخزون' : 'Adjusted Value (EGP)',
          isAr ? 'طريقة التوزيع' : 'Allocation Method',
          isAr ? 'المستخدم' : 'Created By'
        ];

        const rows = landedCosts.map(lc => {
          const originalReceipt = receipts.find(r => r.id === lc.originalReceiptId || r.receiptNumber === lc.originalReceiptNumber);
          const originalVal = originalReceipt ? originalReceipt.totalValueEGP : (lc.amountEGP * 10);
          return [
            lc.landedCostNumber,
            lc.date,
            lc.originalReceiptNumber,
            lc.itemName,
            lc.costType,
            originalVal,
            lc.amountEGP,
            originalVal + lc.amountEGP,
            lc.allocationMethod,
            lc.createdBy
          ];
        });

        exportToCSV(headers, rows, 'Audit_Landed_Cost_Allocation');
        break;
      }

      case 'cost-impact': {
        const headers = [
          isAr ? 'رقم التعديل' : 'Adj No',
          isAr ? 'التاريخ' : 'Date',
          isAr ? 'أمر الإنتاج' : 'PO Number',
          isAr ? 'نوع التكلفة' : 'Cost Type',
          isAr ? 'التكلفة الأصلية للأمر' : 'Original Cost (EGP)',
          isAr ? 'التكلفة المضافة' : 'Added Cost (EGP)',
          isAr ? 'التكلفة المعدلة' : 'Revised Cost (EGP)',
          isAr ? 'الكمية المنتجة' : 'Produced Qty',
          isAr ? 'المتبقي بالمخزون' : 'In Stock Qty',
          isAr ? 'المباع للعملاء' : 'Sold Qty',
          isAr ? 'أثر تعديل المخزون' : 'Inventory Adj (EGP)',
          isAr ? 'أثر تكلفة المبيعات COGS' : 'COGS Adj (EGP)',
          isAr ? 'المُعد' : 'Creator'
        ];

        const rows = costAdjustments.map(adj => {
          const po = productionOrders.find(o => o.id === adj.productionOrderId || o.orderNumber === adj.productionOrderNumber);
          const originalCost = adj.originalProductionCostEGP || (po?.actualMaterialCostEGP || 110000);
          const addedCost = adj.amountEGP;
          const revisedCost = adj.revisedProductionCostEGP || (originalCost + addedCost);
          const qtyProduced = adj.quantityProduced || (po?.actualFinishedQuantity || 900);
          const qtySold = adj.quantityIssuedOrSold || 400;
          const qtyInStock = adj.quantityInStock || (qtyProduced - qtySold);
          const unitDiff = qtyProduced > 0 ? (revisedCost / qtyProduced) - (originalCost / qtyProduced) : 0;
          return [
            adj.adjustmentNumber,
            adj.date,
            adj.productionOrderNumber,
            adj.costType,
            originalCost,
            addedCost,
            revisedCost,
            qtyProduced,
            qtyInStock,
            qtySold,
            adj.inventoryAdjustmentEGP || (qtyInStock * unitDiff),
            adj.cogsAdjustmentEGP || (qtySold * unitDiff),
            adj.createdBy
          ];
        });

        exportToCSV(headers, rows, 'Audit_Production_Cost_Impact');
        break;
      }

      case 'audit-log': {
        const headers = [
          isAr ? 'التاريخ والوقت' : 'Timestamp',
          isAr ? 'المستخدم' : 'User',
          isAr ? 'نوع الإجراء' : 'Action Type',
          isAr ? 'رقم المستند' : 'Document No',
          isAr ? 'التفاصيل وبيانات التدقيق' : 'Audit Details'
        ];

        const rows = auditLogs.map(l => [
          `${l.date} ${l.time}`,
          l.userName,
          l.action,
          l.documentNumber || '-',
          l.details
        ]);

        exportToCSV(headers, rows, 'Global_Security_Audit_Log');
        break;
      }
    }
  };

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

    exportToCSV(headers, rows, 'Inventory_Audit_Ledger');
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
      labelAr: 'أرصدة المخزون وحركات الصنف',
      labelEn: 'Inventory Balances',
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
      labelAr: 'متابعة أوامر الإنتاج والتشغيل',
      labelEn: 'Production Monitoring',
      icon: Factory
    },
    {
      id: 'consumption' as ReportTab,
      labelAr: 'استهلاك المواد وفروقات المعيار',
      labelEn: 'Material Consumption',
      icon: BarChart3
    },
    {
      id: 'scrap' as ReportTab,
      labelAr: 'الهالك والسكراب الصناعي',
      labelEn: 'Industrial Scrap',
      icon: AlertTriangle
    },
    {
      id: 'landed' as ReportTab,
      labelAr: 'تكاليف الشحن والإنزال (Landed Costs)',
      labelEn: 'Landed Costs',
      icon: DollarSign
    },
    {
      id: 'cost-impact' as ReportTab,
      labelAr: 'تحليل أثر تكلفة التصنيع',
      labelEn: 'Cost Impact Analysis',
      icon: Sparkles
    },
    {
      id: 'audit-log' as ReportTab,
      labelAr: 'سجل التدقيق والمطابقة الشامل',
      labelEn: 'Global Audit Log',
      icon: Shield
    }
  ];

  const tabTitles: Record<ReportTab, { titleAr: string; titleEn: string; subAr: string; subEn: string }> = {
    balance: {
      titleAr: 'تقرير تدقيق ومطابقة أرصدة المخزون العام وتكاليف الأصناف',
      titleEn: 'Inventory Balances & Item Valuation Audit Report',
      subAr: 'كشف تحليلي شامل لحركات الوارد والمنصرف والاستهلاك والرصيد الختامي ومتوسط التكلفة',
      subEn: 'Comprehensive breakdown of receipts, issues, production consumption, and closing stock valuation'
    },
    ledger: {
      titleAr: 'دفتر أستاذ المخزون التفصيلي وتتبع القيود والحركات',
      titleEn: 'Detailed Inventory Audit Ledger & Transaction Log',
      subAr: 'كشف زمني لكافة أذونات الإضافة، الصرف، التشغيل، والتسويات المخزنية المعتمدة',
      subEn: 'Chronological register of all approved receipts, issues, transfers, and inventory adjustments'
    },
    production: {
      titleAr: 'تقرير تدقيق ومتابعة أوامر الإنتاج والتشغيل الجاري (WIP)',
      titleEn: 'Production Work Orders & WIP Audit Report',
      subAr: 'متابعة مراحل التصنيع، الخامات المحملة، المنتجات التامة، وتكلفة الدفعة',
      subEn: 'Tracking manufacturing progress, component costs, finished outputs, and batch unit costs'
    },
    consumption: {
      titleAr: 'تقرير تدقيق استهلاك الخامات وانحرافات معايير التشغيل (BOM Variance)',
      titleEn: 'Material Consumption & BOM Variance Audit Report',
      subAr: 'مقارنة الكميات المعيارية بالاستهلاك الفعلي وتحليل نسب الانحراف الصناعي',
      subEn: 'Variance analysis comparing standard BOM recipes with actual physical consumption'
    },
    scrap: {
      titleAr: 'تقرير تدقيق ومراقبة الهالك الصناعي ومعدلات الفاقد',
      titleEn: 'Scrap & Industrial Loss Control Audit Report',
      subAr: 'حصر كميات الهالك، أسبابه، والفاقد المسموح به وغير المسموح به وتكلفته الإجمالية',
      subEn: 'Comprehensive scrap audit, loss reasons, allowable vs abnormal scrap, and cost impact'
    },
    landed: {
      titleAr: 'تقرير تدقيق وتوزيع تكاليف الشحن والإنزال على الخامات المستوردة',
      titleEn: 'Landed Cost Allocation & Inbound Valuation Audit Report',
      subAr: 'كشف توزيع الجمارك والشحن والنولون والتفريغ على تكلفة المخزون الوارد',
      subEn: 'Apportionment of customs, freight, shipping, and handling onto raw material unit costs'
    },
    'cost-impact': {
      titleAr: 'تقرير تحليل وتتبع أثر التكلفة الصناعية على تكلفة البضاعة المباعة (COGS)',
      titleEn: 'Manufacturing Cost Impact & COGS Bridge Audit Report',
      subAr: 'تأثير تغير أسعار الخامات والهالك وتكاليف العمالة على هوامش الربحية وتكلفة المنتجات',
      subEn: 'Impact of raw material pricing, scrap variance, and direct costs on gross margins'
    },
    'audit-log': {
      titleAr: 'سجل التدقيق الأمني والرقابي الشامل لكافة عمليات النظام',
      titleEn: 'Global Industrial Security & System Audit Trail',
      subAr: 'توثيق غير قابل للتعديل لعمليات الإنشاء، التعديل، الاعتماد، والترحيل مع هوية المستخدم',
      subEn: 'Immutable audit trail of all create, update, approval, and posting actions with user signatures'
    }
  };

  if (isLoading) {
    return <InventoryAuditSkeleton />;
  }

  return (
    <div className="space-y-5" id="view-inventory-reports">
      {/* Official Audit Print Header (Visible only on print / PDF hard copies) */}
      <AuditPrintHeader
        reportTitleAr={tabTitles[activeTab].titleAr}
        reportTitleEn={tabTitles[activeTab].titleEn}
        reportSubtitleAr={tabTitles[activeTab].subAr}
        reportSubtitleEn={tabTitles[activeTab].subEn}
        activeFilterSummaryAr={
          activeTab === 'ledger'
            ? selectedWarehouseId !== 'ALL' || selectedItemId !== 'ALL'
              ? `المستودع: ${selectedWarehouseId !== 'ALL' ? warehouses.find(w => w.id === selectedWarehouseId)?.nameAr : 'الكل'} | الصنف: ${selectedItemId !== 'ALL' ? (rawMaterials.find(r => r.id === selectedItemId)?.nameAr || products.find(p => p.id === selectedItemId)?.nameAr) : 'الكل'}`
              : 'كافة المستودعات والأصناف المسجلة'
            : undefined
        }
      />

      {/* Title Header (Screen Mode) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
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

        {/* Action Buttons: Export to CSV & Print Official Audit Report */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Main Export to CSV Button */}
          <button
            id="btn-export-audit-csv"
            onClick={handleExportCurrentTabToCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            title={isAr ? `تصدير تقرير (${reportTabs.find(t => t.id === activeTab)?.[isAr ? 'labelAr' : 'labelEn']}) إلى ملف CSV` : `Export (${reportTabs.find(t => t.id === activeTab)?.labelEn}) to CSV`}
          >
            <Download className="w-4 h-4 text-emerald-100" />
            <span>{isAr ? 'تصدير إلى CSV' : 'Export to CSV'}</span>
          </button>

          {/* Print Official Audit Report Trigger Button */}
          <button
            id="btn-print-audit-report"
            onClick={() => setShowPrintPreview(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            title={isAr ? 'طباعة التقرير المعتمد مع معاينة الطباعة (نسخة ورقية / PDF)' : 'Print Certified Audit Report with Print Preview (Hard Copy / PDF)'}
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
          </button>
        </div>
      </div>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto flex items-center gap-1 no-print">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs no-print">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print-avoid-break">
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

      {/* Official Audit Print Footer (Signatures & Approvals) */}
      <AuditPrintFooter />

      {/* Dedicated Print Preview Modal for All Audit Tabs */}
      {(() => {
        // Compute active tab preview data
        let pTitleAr = 'تقرير وتدقيق المخزون';
        let pTitleEn = 'Inventory Audit Report';
        let pSubAr = 'تقرير رسمي معتمد صادر عن نظام تدقيق المخزون وتكاليف الإنتاج';
        let pSubEn = 'Official certified report issued by Inventory & Manufacturing Costing Audit';
        let pCols: PrintPreviewColumn[] = [];
        let pRows: (string | number)[][] = [];
        let pCards: PrintPreviewSummaryItem[] = [];
        let pFinSummary: { labelAr: string; labelEn: string; value: number }[] = [];
        let pOrientation: 'landscape' | 'portrait' = 'landscape';

        if (activeTab === 'balance') {
          pTitleAr = 'تقرير أرصدة المخزون والحركات التفصيلية (Section 29)';
          pTitleEn = 'Inventory Balances & Movements Detailed Audit Report';
          pSubAr = 'كشف رسمي معتمد بالأرصدة الافتتاحية، حركات الوارد والمنصرف، الاستهلاك الصناعي وتقييم المخزون بمتوسط التكلفة المتحرك MAC';
          pSubEn = 'Certified statement of opening balances, receipts, issues, transfers, industrial consumption, and MAC valuation';
          pCols = [
            { key: 'code', headerAr: 'كود الصنف', headerEn: 'Item Code', isMono: true, width: '90px' },
            { key: 'name', headerAr: 'اسم الصنف', headerEn: 'Item Name' },
            { key: 'wh', headerAr: 'المستودع', headerEn: 'Warehouse' },
            { key: 'uom', headerAr: 'الوحدة', headerEn: 'UOM', align: 'center', width: '50px' },
            { key: 'in', headerAr: 'وارد مشتريات', headerEn: 'Purch Receipts', align: 'right', isMono: true },
            { key: 'trIn', headerAr: 'تحويل وارد', headerEn: 'Transfers In', align: 'right', isMono: true },
            { key: 'prodIn', headerAr: 'وارد إنتاج', headerEn: 'Prod Receipts', align: 'right', isMono: true },
            { key: 'out', headerAr: 'صرف وتسليم', headerEn: 'Issues/Deliv', align: 'right', isMono: true },
            { key: 'trOut', headerAr: 'تحويل منصرف', headerEn: 'Transfers Out', align: 'right', isMono: true },
            { key: 'prodCons', headerAr: 'استهلاك تشغيل', headerEn: 'Consumption', align: 'right', isMono: true },
            { key: 'scrap', headerAr: 'هالك', headerEn: 'Scrap', align: 'right', isMono: true },
            { key: 'closing', headerAr: 'الرصيد الختامي', headerEn: 'Closing Qty', align: 'right', isMono: true },
            { key: 'mac', headerAr: 'متوسط التكلفة', headerEn: 'MAC (EGP)', align: 'right', isMono: true },
            { key: 'val', headerAr: 'قيمة الرصيد', headerEn: 'Total Value', align: 'right', isMono: true }
          ];

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

          let totalClosingVal = 0;
          let totalClosingUnits = 0;

          allItems.forEach(item => {
            warehouses.forEach(wh => {
              const itemEntries = ledgerEntries.filter(
                e => e.itemId === item.id && e.warehouseId === wh.id
              );
              if (itemEntries.length === 0 && item.defaultWh !== wh.id) return;

              let receiptsQty = 0;
              let transfersInQty = 0;
              let prodReceiptsQty = 0;
              let issuesQty = 0;
              let transfersOutQty = 0;
              let prodConsumptionQty = 0;
              let scrapQty = 0;

              itemEntries.forEach(e => {
                if (e.transactionType === TransactionType.PURCHASE_RECEIPT) receiptsQty += e.qtyIn;
                else if (e.transactionType === TransactionType.TRANSFER_IN) transfersInQty += e.qtyIn;
                else if (e.transactionType === TransactionType.FINISHED_GOODS_RECEIPT || e.transactionType === TransactionType.SEMI_FINISHED_RECEIPT) prodReceiptsQty += e.qtyIn;
                else if (e.transactionType === TransactionType.INVENTORY_ISSUE || e.transactionType === TransactionType.CUSTOMER_DELIVERY) issuesQty += e.qtyOut;
                else if (e.transactionType === TransactionType.TRANSFER_OUT) transfersOutQty += e.qtyOut;
                else if (e.transactionType === TransactionType.MATERIAL_ISSUE_PRODUCTION) prodConsumptionQty += e.qtyOut;
                else if (e.transactionType === TransactionType.SCRAP) scrapQty += e.qtyOut;
              });

              const lastLedger = itemEntries[itemEntries.length - 1];
              const closingQty = lastLedger ? lastLedger.balanceQty : 0;
              const mac = lastLedger ? lastLedger.movingAverageCostEGP : item.mac;
              const closingValue = closingQty * mac;

              totalClosingVal += closingValue;
              totalClosingUnits += closingQty;

              pRows.push([
                item.code,
                item.name,
                isAr ? wh.nameAr : wh.nameEn,
                item.uom,
                formatNumber(receiptsQty, language),
                formatNumber(transfersInQty, language),
                formatNumber(prodReceiptsQty, language),
                formatNumber(issuesQty, language),
                formatNumber(transfersOutQty, language),
                formatNumber(prodConsumptionQty, language),
                formatNumber(scrapQty, language),
                formatNumber(closingQty, language),
                formatCurrency(mac, language),
                formatCurrency(closingValue, language)
              ]);
            });
          });

          pCards = [
            { labelAr: 'عدد السجلات', labelEn: 'Items Count', value: pRows.length, isNumber: true },
            { labelAr: 'إجمالي الوحدات الفعلية', labelEn: 'Total Physical Units', value: `${formatNumber(totalClosingUnits, language)} كجم`, variant: 'info' },
            { labelAr: 'إجمالي قيمة المخزون', labelEn: 'Total Valuation', value: totalClosingVal, isCurrency: true, variant: 'success' },
            { labelAr: 'المستودعات المشمولة', labelEn: 'Warehouses In Scope', value: warehouses.length, isNumber: true }
          ];
          pFinSummary = [
            { labelAr: 'إجمالي القيمة الدفترية للمخزون', labelEn: 'Total Inventory Valuation', value: totalClosingVal }
          ];
          pOrientation = 'landscape';
        } else if (activeTab === 'ledger') {
          pTitleAr = 'دفتر أستاذ المخزون والتدقيق المالي للحركات (General Stock Ledger)';
          pTitleEn = 'Inventory General Ledger & Transaction Audit Trail';
          pSubAr = 'كشف تتبعي زمني لكافة حركات الإضافة والصرف والتسوية مع الرصيد الجاري ومتوسط التكلفة';
          pSubEn = 'Chronological transaction audit trail with real-time running balance and MAC valuation';
          pCols = [
            { key: 'date', headerAr: 'التاريخ', headerEn: 'Date', width: '85px' },
            { key: 'doc', headerAr: 'رقم المستند', headerEn: 'Doc No', isMono: true, width: '100px' },
            { key: 'type', headerAr: 'نوع الحركة', headerEn: 'Transaction Type' },
            { key: 'item', headerAr: 'الصنف', headerEn: 'Item Name' },
            { key: 'wh', headerAr: 'المستودع', headerEn: 'Warehouse' },
            { key: 'in', headerAr: 'الوارد (+)', headerEn: 'Qty In', align: 'right', isMono: true },
            { key: 'out', headerAr: 'المنصرف (-)', headerEn: 'Qty Out', align: 'right', isMono: true },
            { key: 'bal', headerAr: 'الرصيد', headerEn: 'Balance', align: 'right', isMono: true },
            { key: 'mac', headerAr: 'متوسط التكلفة', headerEn: 'MAC (EGP)', align: 'right', isMono: true },
            { key: 'val', headerAr: 'قيمة الرصيد', headerEn: 'Valuation', align: 'right', isMono: true },
            { key: 'user', headerAr: 'المُحرر', headerEn: 'Created By' }
          ];

          pRows = filteredEntries.map(e => [
            e.date,
            e.documentNumber,
            e.transactionType,
            e.itemName,
            e.warehouseName,
            e.qtyIn > 0 ? `+${formatNumber(e.qtyIn, language)}` : '-',
            e.qtyOut > 0 ? `-${formatNumber(e.qtyOut, language)}` : '-',
            formatNumber(e.balanceQty, language),
            formatCurrency(e.movingAverageCostEGP, language),
            formatCurrency(e.runningInventoryValueEGP, language),
            e.createdBy
          ]);

          pCards = [
            { labelAr: 'إجمالي الحركات الموثقة', labelEn: 'Audited Entries', value: filteredEntries.length, isNumber: true },
            { labelAr: 'إجمالي كميات الوارد', labelEn: 'Total Qty In', value: `+${formatNumber(totalIn, language)} كجم`, variant: 'success' },
            { labelAr: 'إجمالي كميات المنصرف', labelEn: 'Total Qty Out', value: `-${formatNumber(totalOut, language)} كجم`, variant: 'warning' },
            { labelAr: 'قيمة الرصيد الجاري', labelEn: 'Current Valuation', value: netValuation, isCurrency: true, variant: 'info' }
          ];
          pFinSummary = [
            { labelAr: 'قيمة الرصيد الدفتري الجاري', labelEn: 'Running Inventory Valuation', value: netValuation }
          ];
          pOrientation = 'landscape';
        } else if (activeTab === 'production') {
          pTitleAr = 'تقرير متابعة وتدقيق أوامر الإنتاج والتشغيل (Work Orders)';
          pTitleEn = 'Production Work Orders Monitoring & Cost Audit Report';
          pSubAr = 'كشف تفصيلي لمخرجات التصنيع، الكميات المنجزة، نسب الهالك وتكاليف الخامات الفعلية';
          pSubEn = 'Comprehensive audit of production outputs, finished quantities, scrap rates, and material costs';
          pCols = [
            { key: 'orderNo', headerAr: 'رقم الأمر', headerEn: 'Order No', isMono: true, width: '100px' },
            { key: 'date', headerAr: 'التاريخ', headerEn: 'Date', width: '85px' },
            { key: 'product', headerAr: 'المنتج التام', headerEn: 'Product' },
            { key: 'bom', headerAr: 'BOM', headerEn: 'BOM Code', isMono: true },
            { key: 'planned', headerAr: 'المخطط', headerEn: 'Planned Qty', align: 'right', isMono: true },
            { key: 'actual', headerAr: 'المنجز الفعلي', headerEn: 'Finished Qty', align: 'right', isMono: true },
            { key: 'scrap', headerAr: 'الهالك', headerEn: 'Scrap Qty', align: 'right', isMono: true },
            { key: 'cost', headerAr: 'تكلفة الخامات', headerEn: 'Material Cost', align: 'right', isMono: true },
            { key: 'status', headerAr: 'الحالة', headerEn: 'Status', align: 'center' },
            { key: 'quality', headerAr: 'الجودة', headerEn: 'Quality', align: 'center' }
          ];

          pRows = productionOrders.map(o => [
            o.orderNumber,
            o.productionDate,
            o.productName,
            o.bomCode,
            `${formatNumber(o.plannedQuantity, language)} ${o.uom}`,
            `${formatNumber(o.actualFinishedQuantity || 0, language)} ${o.uom}`,
            `${formatNumber(o.actualScrapQuantity || 0, language)} ${o.uom}`,
            formatCurrency(o.actualMaterialCostEGP || 0, language),
            o.status,
            o.qualityStatus
          ]);

          const totalMatCost = productionOrders.reduce((sum, o) => sum + (o.actualMaterialCostEGP || 0), 0);
          pCards = [
            { labelAr: 'إجمالي أوامر الإنتاج', labelEn: 'Total Orders', value: productionOrders.length, isNumber: true },
            { labelAr: 'الأوامر المكتملة', labelEn: 'Completed Orders', value: productionOrders.filter(o => o.status === 'COMPLETED').length, isNumber: true, variant: 'success' },
            { labelAr: 'إجمالي تكلفة الخامات المستهلكة', labelEn: 'Total Material Cost', value: totalMatCost, isCurrency: true, variant: 'info' }
          ];
          pFinSummary = [
            { labelAr: 'إجمالي تكلفة المواد الخام المنصرفة للإنتاج', labelEn: 'Total Materials Issued to Production', value: totalMatCost }
          ];
          pOrientation = 'landscape';
        } else if (activeTab === 'consumption') {
          pTitleAr = 'تقرير تحليل واستهلاك الخامات الصناعية (BOM vs Actual Consumption)';
          pTitleEn = 'Material Consumption & Variance Analysis Report';
          pSubAr = 'مقارنة الكميات والتكاليف المخططة بالمنصرف الفعلي وتحديد انحرافات التشغيل';
          pSubEn = 'Comparison between planned BOM consumption and actual issued materials with cost variances';
          pCols = [
            { key: 'order', headerAr: 'رقم الأمر', headerEn: 'Order No', isMono: true },
            { key: 'date', headerAr: 'التاريخ', headerEn: 'Date', width: '85px' },
            { key: 'prod', headerAr: 'المنتج', headerEn: 'Product' },
            { key: 'mat', headerAr: 'الخامة المنصرفة', headerEn: 'Material' },
            { key: 'uom', headerAr: 'الوحدة', headerEn: 'UOM', align: 'center', width: '50px' },
            { key: 'planQ', headerAr: 'المخطط', headerEn: 'Planned Qty', align: 'right', isMono: true },
            { key: 'actQ', headerAr: 'الفعلي', headerEn: 'Actual Qty', align: 'right', isMono: true },
            { key: 'varQ', headerAr: 'الانحراف', headerEn: 'Qty Var', align: 'right', isMono: true },
            { key: 'mac', headerAr: 'متوسط التكلفة', headerEn: 'MAC (EGP)', align: 'right', isMono: true },
            { key: 'actCost', headerAr: 'التكلفة الفعلية', headerEn: 'Actual Cost', align: 'right', isMono: true },
            { key: 'varCost', headerAr: 'انحراف التكلفة', headerEn: 'Cost Var', align: 'right', isMono: true }
          ];

          const consumptionLines = productionOrders.flatMap(po => {
            return (po.materials || []).map(mat => {
              const plannedCost = mat.plannedQty * (mat.movingAverageCostEGP || 110);
              const actualCost = mat.actualCostEGP || (mat.actualIssuedQty * (mat.movingAverageCostEGP || 110));
              const varianceQty = mat.actualIssuedQty - mat.plannedQty;
              const varianceVal = actualCost - plannedCost;

              return {
                orderNumber: po.orderNumber,
                productionDate: po.productionDate,
                productName: po.productName,
                materialName: mat.rawMaterialName,
                uom: mat.uom,
                plannedQty: mat.plannedQty,
                actualQty: mat.actualIssuedQty,
                varianceQty,
                macCost: mat.movingAverageCostEGP || 110,
                plannedCost,
                actualCost,
                varianceVal
              };
            });
          });

          pRows = consumptionLines.map(l => [
            l.orderNumber,
            l.productionDate,
            l.productName,
            l.materialName,
            l.uom,
            formatNumber(l.plannedQty, language),
            formatNumber(l.actualQty, language),
            l.varianceQty > 0 ? `+${formatNumber(l.varianceQty, language)}` : formatNumber(l.varianceQty, language),
            formatCurrency(l.macCost, language),
            formatCurrency(l.actualCost, language),
            formatCurrency(l.varianceVal, language)
          ]);

          const totalPlanned = consumptionLines.reduce((s, l) => s + l.plannedCost, 0);
          const totalActual = consumptionLines.reduce((s, l) => s + l.actualCost, 0);

          pCards = [
            { labelAr: 'إجمالي بنود الاستهلاك', labelEn: 'Consumption Lines', value: consumptionLines.length, isNumber: true },
            { labelAr: 'إجمالي التكلفة المخططة', labelEn: 'Total Planned Cost', value: totalPlanned, isCurrency: true },
            { labelAr: 'إجمالي التكلفة الفعلية', labelEn: 'Total Actual Cost', value: totalActual, isCurrency: true, variant: 'info' },
            { labelAr: 'صافي انحراف التكلفة', labelEn: 'Net Cost Variance', value: totalActual - totalPlanned, isCurrency: true, variant: totalActual > totalPlanned ? 'danger' : 'success' }
          ];
          pFinSummary = [
            { labelAr: 'إجمالي الاستهلاك الفعلي للخامات', labelEn: 'Total Actual Material Cost', value: totalActual }
          ];
          pOrientation = 'landscape';
        } else if (activeTab === 'scrap') {
          pTitleAr = 'تقرير الهالك الصناعي ومراقبة الفاقد (Scrap & Loss Control)';
          pTitleEn = 'Industrial Scrap & Production Loss Audit Report';
          pSubAr = 'حصر وتحليل كميات الهالك وتكاليف الفاقد وتحديد أسباب ومراحل الهدر الصناعي';
          pSubEn = 'Detailed tracking of industrial scrap, loss stages, and zero-cost standard compliance';
          pCols = [
            { key: 'order', headerAr: 'رقم الأمر', headerEn: 'Order No', isMono: true },
            { key: 'date', headerAr: 'التاريخ', headerEn: 'Date', width: '85px' },
            { key: 'prod', headerAr: 'المنتج', headerEn: 'Product' },
            { key: 'scrapQ', headerAr: 'كمية الهالك', headerEn: 'Scrap Qty', align: 'right', isMono: true },
            { key: 'uom', headerAr: 'الوحدة', headerEn: 'UOM', align: 'center', width: '50px' },
            { key: 'unitCost', headerAr: 'تكلفة الوحدة', headerEn: 'Unit Cost', align: 'right', isMono: true },
            { key: 'totalLoss', headerAr: 'تكلفة الفاقد الإجمالية', headerEn: 'Total Loss Cost', align: 'right', isMono: true },
            { key: 'stage', headerAr: 'المرحلة', headerEn: 'Stage' },
            { key: 'reason', headerAr: 'سبب الهالك', headerEn: 'Scrap Reason' }
          ];

          const scrapRows = productionOrders.filter(o => (o.actualScrapQuantity || 0) > 0);
          pRows = scrapRows.map(o => {
            const scrapQty = o.actualScrapQuantity || 0;
            const unitCost = o.finishedGoodsUnitCostEGP || 0;
            const totalCost = scrapQty * unitCost;
            return [
              o.orderNumber,
              o.productionDate,
              o.productName,
              formatNumber(scrapQty, language),
              o.uom,
              formatCurrency(unitCost, language),
              formatCurrency(totalCost, language),
              o.productionStage || (isAr ? 'التشكيل والحقن' : 'Molding'),
              o.qualityNotes || o.notes || (isAr ? 'ضبط معايير التشغيل وبدء الخط' : 'Startup calibration')
            ];
          });

          const totalScrapQty = scrapRows.reduce((s, o) => s + (o.actualScrapQuantity || 0), 0);
          const totalScrapLoss = scrapRows.reduce((s, o) => s + ((o.actualScrapQuantity || 0) * (o.finishedGoodsUnitCostEGP || 0)), 0);

          pCards = [
            { labelAr: 'أوامر الإنتاج التي بها هالك', labelEn: 'Orders with Scrap', value: scrapRows.length, isNumber: true },
            { labelAr: 'إجمالي كمية الهالك', labelEn: 'Total Scrap Qty', value: `${formatNumber(totalScrapQty, language)} كجم`, variant: 'warning' },
            { labelAr: 'تكلفة الفاقد الصناعي التقديرية', labelEn: 'Estimated Scrap Cost Loss', value: totalScrapLoss, isCurrency: true, variant: 'danger' }
          ];
          pFinSummary = [
            { labelAr: 'إجمالي تكلفة الفاقد الصناعي التقديرية', labelEn: 'Total Estimated Industrial Scrap Loss', value: totalScrapLoss }
          ];
          pOrientation = 'landscape';
        } else if (activeTab === 'landed') {
          pTitleAr = 'تقرير التكاليف الإضافية وتوزيع مصاريف الشحن (Landed Cost)';
          pTitleEn = 'Landed Cost Distribution & Inbound Shipping Allocation Report';
          pSubAr = 'توزيع الجمارك والشحن والتأمين والمناولة على تكلفة الأصناف وتعديل متوسط التكلفة';
          pSubEn = 'Allocation of freight, customs, insurance, and handling charges into inventory unit costs';
          pCols = [
            { key: 'no', headerAr: 'رقم السند', headerEn: 'Landed No', isMono: true },
            { key: 'date', headerAr: 'التاريخ', headerEn: 'Date', width: '85px' },
            { key: 'po', headerAr: 'الشحنة / أمر الشراء', headerEn: 'Shipment / PO' },
            { key: 'type', headerAr: 'نوع المصروف', headerEn: 'Cost Type' },
            { key: 'method', headerAr: 'طريقة التوزيع', headerEn: 'Method' },
            { key: 'amount', headerAr: 'المبلغ الإجمالي', headerEn: 'Total Amount', align: 'right', isMono: true },
            { key: 'status', headerAr: 'الحالة', headerEn: 'Status', align: 'center' }
          ];

          pRows = landedCosts.map(lc => [
            lc.landedCostNumber,
            lc.date,
            lc.originalReceiptNumber || 'PO-2026',
            lc.costType,
            lc.allocationMethod,
            formatCurrency(lc.amountEGP, language),
            lc.status
          ]);

          const totalLanded = landedCosts.reduce((s, lc) => s + lc.amountEGP, 0);
          pCards = [
            { labelAr: 'إجمالي سندات التكلفة الإضافية', labelEn: 'Landed Cost Records', value: landedCosts.length, isNumber: true },
            { labelAr: 'إجمالي المصاريف الموزعة', labelEn: 'Total Allocated Landed Cost', value: totalLanded, isCurrency: true, variant: 'info' }
          ];
          pFinSummary = [
            { labelAr: 'إجمالي التكاليف الإضافية الموزعة على المخزون', labelEn: 'Total Landed Costs Capitalized to Inventory', value: totalLanded }
          ];
          pOrientation = 'portrait';
        } else if (activeTab === 'cost-impact') {
          pTitleAr = 'تقرير الأثر المالي لتعديلات التكلفة اللاحقة (Cost Adjustments & COGS Bridge)';
          pTitleEn = 'Cost Adjustment Impact on Inventory & COGS Bridge Report';
          pSubAr = 'تتبع أثر تسويات التكاليف اللاحقة على تقييم المخزون المتبقي وتكلفة البضاعة المباعة COGS';
          pSubEn = 'Tracking subsequent cost adjustments across on-hand inventory revaluation and COGS bridge';
          pCols = [
            { key: 'ref', headerAr: 'رقم التسوية', headerEn: 'Adj Ref', isMono: true },
            { key: 'date', headerAr: 'التاريخ', headerEn: 'Date', width: '85px' },
            { key: 'po', headerAr: 'أمر الإنتاج', headerEn: 'Production Order' },
            { key: 'type', headerAr: 'نوع التعديل', headerEn: 'Cost Type' },
            { key: 'added', headerAr: 'التكلفة المضافة', headerEn: 'Added Cost', align: 'right', isMono: true },
            { key: 'invAdj', headerAr: 'أثر المخزون المتبقي', headerEn: 'Inventory Reval', align: 'right', isMono: true },
            { key: 'cogsAdj', headerAr: 'أثر تكلفة المبيعات COGS', headerEn: 'COGS Adj', align: 'right', isMono: true },
            { key: 'auditor', headerAr: 'المعتمد', headerEn: 'Auditor' }
          ];

          pRows = costAdjustments.map(ca => [
            ca.adjustmentNumber || ca.id,
            ca.date,
            ca.productionOrderNumber,
            ca.costType,
            formatCurrency(ca.amountEGP, language),
            formatCurrency(ca.inventoryAdjustmentEGP, language),
            formatCurrency(ca.cogsAdjustmentEGP, language),
            ca.approvedBy || ca.createdBy
          ]);

          const totalAdded = costAdjustments.reduce((s, ca) => s + ca.amountEGP, 0);
          const totalInv = costAdjustments.reduce((s, ca) => s + ca.inventoryAdjustmentEGP, 0);
          const totalCogs = costAdjustments.reduce((s, ca) => s + ca.cogsAdjustmentEGP, 0);

          pCards = [
            { labelAr: 'إجمالي التسويات المسجلة', labelEn: 'Total Adjustments', value: costAdjustments.length, isNumber: true },
            { labelAr: 'إجمالي التكاليف الصناعية المضافة', labelEn: 'Total Added Manufacturing Costs', value: totalAdded, isCurrency: true },
            { labelAr: 'أثر تقييم المخزون المتبقي', labelEn: 'Inventory Revaluation Impact', value: totalInv, isCurrency: true, variant: 'info' },
            { labelAr: 'أثر تكلفة البضاعة المباعة (COGS)', labelEn: 'COGS Bridge Impact', value: totalCogs, isCurrency: true, variant: 'warning' }
          ];
          pFinSummary = [
            { labelAr: 'إجمالي التكاليف الصناعية المضافة', labelEn: 'Total Added Manufacturing Costs', value: totalAdded },
            { labelAr: 'تعديل قيمة المخزون الحالي', labelEn: 'Inventory Adjustment Amount', value: totalInv },
            { labelAr: 'تعديل تكلفة البضاعة المباعة COGS', labelEn: 'COGS Adjustment Amount', value: totalCogs }
          ];
          pOrientation = 'landscape';
        } else if (activeTab === 'audit-log') {
          pTitleAr = 'سجل الرقابة والتدقيق الأمني الموحد (System Audit Trail)';
          pTitleEn = 'Comprehensive System Audit Trail & Compliance Activity Log';
          pSubAr = 'توثيق شامل لكافة العمليات الحساسة، الترحيل المحاسبي، وتعديلات الصلاحيات';
          pSubEn = 'Complete audit trail of user actions, ledger postings, authorizations, and security events';
          pCols = [
            { key: 'time', headerAr: 'الوقت والتاريخ', headerEn: 'Timestamp', width: '130px', isMono: true },
            { key: 'user', headerAr: 'المستخدم / المسؤول', headerEn: 'User / Auditor' },
            { key: 'action', headerAr: 'نوع العملية', headerEn: 'Action Type' },
            { key: 'ref', headerAr: 'المستند المرجعي', headerEn: 'Doc Ref', isMono: true },
            { key: 'details', headerAr: 'تفاصيل العملية والتدقيق', headerEn: 'Audit Trail Details' }
          ];

          pRows = auditLogs.map(log => [
            `${log.date} ${log.time}`,
            log.userName,
            log.action,
            log.documentNumber || log.documentType || log.id,
            log.details
          ]);

          pCards = [
            { labelAr: 'إجمالي الأحداث الرقابية', labelEn: 'Total Audit Events', value: auditLogs.length, isNumber: true },
            { labelAr: 'المستخدمين النشطين', labelEn: 'Audited Users', value: new Set(auditLogs.map(l => l.userName)).size, isNumber: true, variant: 'info' }
          ];
          pFinSummary = [];
          pOrientation = 'landscape';
        }

        return (
          <PrintPreviewModal
            isOpen={showPrintPreview}
            onClose={() => setShowPrintPreview(false)}
            reportTitleAr={pTitleAr}
            reportTitleEn={pTitleEn}
            reportSubtitleAr={pSubAr}
            reportSubtitleEn={pSubEn}
            columns={pCols}
            rows={pRows}
            summaryCards={pCards}
            financialSummary={pFinSummary}
            defaultOrientation={pOrientation}
            onExportCSV={handleExportCurrentTabToCSV}
            notes={
              isAr
                ? 'وثيقة رسمية مستخرجة آلياً من نظام مراقبة المخزون وتكاليف التصنيع الصناعي ومطابقة لمعايير المحاسبة والتدقيق الداخلي.'
                : 'Official certified document extracted automatically from the Inventory & Manufacturing Costing Audit System.'
            }
          />
        );
      })()}
    </div>
  );
};
