import React, { useState, useEffect, useMemo } from 'react';
import { SmartFilterBar, ERPFilters } from '../components/common/SmartFilterBar';
import {
  Factory,
  Plus,
  Printer,
  Ban,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  X,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Eye,
  GitCommit,
  BarChart3,
  HelpCircle,
  ArrowRightLeft,
  Scale,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { DocumentPrintModal } from '../components/common/DocumentPrintModal';
import { LocationValuationCard } from '../components/common/LocationValuationCard';
import { ProductionOrderModificationModal } from '../components/production/ProductionOrderModificationModal';
import { ProductionOrderDetailModal } from '../components/production/ProductionOrderDetailModal';
import { ProductionCostImpactReport } from '../components/reports/ProductionCostImpactReport';
import { ProductionOrdersSkeleton } from '../components/common/Skeleton';
import { usePerceivedLoading } from '../hooks/usePerceivedLoading';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { getAvailableUOMsForItem, getConversionFactorToBase, formatUOMTransactionLabel } from '../utils/uomHelper';
import { SafeTransactionCancelModal } from '../components/inventory/SafeTransactionCancelModal';
import {
  ProductionOrder,
  ProductionOrderStatus,
  QualityStatus,
  CostCategory,
  CostAllocationMethod
} from '../types';

interface ProductionOrdersViewProps {
  onNavigateToQuality?: () => void;
  initialTab?: 'orders' | 'cost-adjustments';
}

export const ProductionOrdersView: React.FC<ProductionOrdersViewProps> = ({ onNavigateToQuality, initialTab = 'orders' }) => {
  const { isLoading } = usePerceivedLoading(180);
  const {
    language,
    productionOrders,
    costAdjustments,
    createProductionOrder,
    issueMaterialToProduction,
    recordProductionReceipt,
    addCostAdjustment,
    cancelTransaction,
    products,
    rawMaterials,
    boms,
    warehouses,
    uoms,
    currentUser,
    getItemWarehouseValuation
  } = useApp();
  const isAr = language === 'ar';

  const [erpFilters, setErpFilters] = useState<ERPFilters>({});

  const filteredOrders = useMemo(() => {
    return (productionOrders || []).filter(po => {
      // 1. Date filters
      if (erpFilters.dateFrom && po.productionDate < erpFilters.dateFrom) return false;
      if (erpFilters.dateTo && po.productionDate > erpFilters.dateTo) return false;

      // 2. Warehouse Type & ID
      if (erpFilters.warehouseType || erpFilters.warehouseId) {
        const wh = warehouses.find(w => w.id === po.wipWarehouseId);
        if (erpFilters.warehouseType && wh?.type !== erpFilters.warehouseType) return false;
        if (erpFilters.warehouseId && po.wipWarehouseId !== erpFilters.warehouseId) return false;
      }

      // 3. Item criteria
      if (erpFilters.itemType || erpFilters.itemGroupId || erpFilters.itemCode || erpFilters.itemDesc) {
        const item = products.find(p => p.id === po.productId);
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
      if (erpFilters.docNum && !po.orderNumber.toLowerCase().includes(erpFilters.docNum.toLowerCase())) return false;
      if (erpFilters.createdBy && po.createdBy !== erpFilters.createdBy) return false;

      // 5. Status filter
      if (erpFilters.status) {
        if (po.status !== erpFilters.status) return false;
      } else {
        // Default: exclude CANCELLED orders from standard view
        if ((po.status as string) === 'CANCELLED') return false;
      }

      return true;
    });
  }, [productionOrders, erpFilters, warehouses, products, isAr]);

  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'cost-adjustments'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isProduceModalOpen, setIsProduceModalOpen] = useState(false);
  const [isCostAdjOpen, setIsCostAdjOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<ProductionOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<ProductionOrder | null>(null);
  const [modifyOrder, setModifyOrder] = useState<ProductionOrder | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<ProductionOrder | null>(null);

  // Form states
  const [targetProductId, setTargetProductId] = useState(products[0]?.id || 'prod-001');
  const [plannedQty, setPlannedQty] = useState(900);
  const [selectedBomId, setSelectedBomId] = useState(boms[0]?.id || 'bom-001');
  const [prodWhId, setProdWhId] = useState(warehouses.find(w => w.type === 'WIP')?.id || 'wh-wip');
  const [fgWhId, setFgWhId] = useState(warehouses.find(w => w.type === 'FINISHED_GOODS')?.id || 'wh-fg');
  const [notes, setNotes] = useState('');

  // Issue modal state
  const [issueQty, setIssueQty] = useState(1000);
  const [issueUOM, setIssueUOM] = useState('');
  const [issueWarehouseId, setIssueWarehouseId] = useState('wh-raw');

  // Produce modal state
  const [finishedQty, setFinishedQty] = useState(900);
  const [produceUOM, setProduceUOM] = useState('');
  const [produceWarehouseId, setProduceWarehouseId] = useState('wh-fg');
  const [scrapQty, setScrapQty] = useState(100);
  const [laborCost, setLaborCost] = useState(0);
  const [overheadCost, setOverheadCost] = useState(0);

  // Cost Adj Modal
  const [adjAmount, setAdjAmount] = useState(5000);
  const [adjReason, setAdjReason] = useState('فاتورة كهرباء صناعية متأخرة خاصة بتشغيل الدفعة');

  const targetProduct = products.find(p => p.id === targetProductId);
  const activeBom = boms.find(b => b.id === selectedBomId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduct || !activeBom) return;

    createProductionOrder({
      productionDate: new Date().toISOString().split('T')[0],
      productId: targetProduct.id,
      productCode: targetProduct.code,
      productName: targetProduct.nameAr,
      plannedQuantity: plannedQty,
      uom: targetProduct.defaultUOM || 'KG',
      bomId: activeBom.id,
      bomCode: activeBom.code,
      bomVersion: activeBom.version,
      productionStage: 'التشغيل الصناعي',
      wipWarehouseId: prodWhId,
      finishedGoodsWarehouseId: fgWhId,
      expectedFinishedQuantity: plannedQty * 0.9,
      expectedScrapQuantity: plannedQty * 0.1,
      notes: notes || 'أمر إنتاج معتمد للمصنع',
      createdBy: currentUser?.fullName || 'Production Engineer',
      materials: activeBom.lines.map(l => ({
        id: 'mat-' + Math.random(),
        rawMaterialId: l.rawMaterialId,
        rawMaterialCode: l.rawMaterialCode,
        rawMaterialName: l.rawMaterialName,
        uom: l.uom,
        plannedQty: l.quantity * plannedQty,
        availableQty: 1000,
        actualIssuedQty: 0,
        movingAverageCostEGP: 110,
        actualCostEGP: 0
      }))
    });

    setIsCreateOpen(false);
  };

  // Active target raw material for issue modal
  const firstMatLine = selectedOrder?.materials?.[0];
  const activeRawMat = rawMaterials.find(m => m.id === firstMatLine?.rawMaterialId) || rawMaterials[0] || {
    id: 'rm-001',
    code: 'RM-PP-01',
    nameAr: 'بولي بروبيلين عالي الكثافة (PP)',
    defaultUOM: 'KG',
    movingAverageCost: 110
  };
  const rawMatBaseUOM = activeRawMat.defaultUOM || 'KG';
  const availableIssueUOMs = getAvailableUOMsForItem(rawMatBaseUOM, uoms);
  const activeIssueUOM = issueUOM || rawMatBaseUOM;
  const issueFactor = getConversionFactorToBase(activeIssueUOM, rawMatBaseUOM, uoms);
  const baseIssueQty = issueQty * issueFactor;

  // Authoritative SAP B1 Location Valuation for Issue Material to Production
  const activeIssueWh = warehouses.find(w => w.id === issueWarehouseId);
  const activeRawMatStock = getItemWarehouseValuation(activeRawMat.id, issueWarehouseId);
  const rawMatOnHand = activeRawMatStock.currentQty || 0;
  const rawMatValue = activeRawMatStock.totalValue || 0;
  const rawMatMAC = activeRawMatStock.movingAverageCost || 0;
  const issueTotalCost = baseIssueQty * rawMatMAC;
  const isIssueExceeding = baseIssueQty > rawMatOnHand;
  const rawMatProjOnHand = Math.max(0, rawMatOnHand - baseIssueQty);
  const rawMatProjValue = Math.max(0, rawMatValue - issueTotalCost);
  const rawMatProjMAC = rawMatMAC; // Outgoing issue retains current MAC

  // Active product output for produce modal
  const prodBaseUOM = selectedOrder?.uom || 'KG';
  const availableProduceUOMs = getAvailableUOMsForItem(prodBaseUOM, uoms);
  const activeProduceUOM = produceUOM || prodBaseUOM;
  const produceFactor = getConversionFactorToBase(activeProduceUOM, prodBaseUOM, uoms);
  const baseFinishedQty = finishedQty * produceFactor;
  const baseScrapQty = scrapQty * produceFactor;

  // Authoritative SAP B1 Cost Pool & Receipt Valuation
  // Cost Pool = sum of actual material issues linked to order + direct labor + overhead
  const orderMaterialCostPool = selectedOrder?.actualMaterialCostEGP || 0;
  const totalProductionCost = orderMaterialCostPool + laborCost + overheadCost;
  // Unit cost allocated exclusively to good finished product (Scrap receives zero)
  const finishedUnitCost = baseFinishedQty > 0 ? totalProductionCost / baseFinishedQty : 0;

  // Destination Finished Goods Warehouse Valuation
  const activeProduceWh = warehouses.find(w => w.id === produceWarehouseId);
  const fgWhStock = selectedOrder ? getItemWarehouseValuation(selectedOrder.productId, produceWarehouseId) : { currentQty: 0, totalValue: 0, movingAverageCost: 0 };
  const fgOnHand = fgWhStock.currentQty || 0;
  const fgValue = fgWhStock.totalValue || 0;
  const fgMAC = fgWhStock.movingAverageCost || 0;
  const fgProjOnHand = fgOnHand + baseFinishedQty;
  const fgProjValue = fgValue + totalProductionCost;
  const fgProjMAC = fgProjOnHand > 0 ? fgProjValue / fgProjOnHand : 0;

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || issueQty <= 0) return;
    if (isIssueExceeding) return;

    issueMaterialToProduction({
      productionOrderId: selectedOrder.id,
      productionOrderNumber: selectedOrder.orderNumber,
      date: new Date().toISOString().split('T')[0],
      rawMaterialId: activeRawMat.id,
      rawMaterialCode: activeRawMat.code,
      rawMaterialName: activeRawMat.nameAr,
      plannedQuantity: issueQty,
      actualQuantity: issueQty,
      uom: activeIssueUOM,
      conversionFactor: issueFactor,
      baseQuantity: baseIssueQty,
      baseUOM: rawMatBaseUOM,
      movingAverageCostEGP: rawMatMAC,
      totalActualCostEGP: issueTotalCost,
      warehouseId: issueWarehouseId,
      createdBy: currentUser?.fullName || 'Production Engineer'
    });

    setIsIssueModalOpen(false);
    setSelectedOrder(null);
  };

  const handleProduceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || finishedQty <= 0) return;

    recordProductionReceipt({
      productionOrderId: selectedOrder.id,
      productionOrderNumber: selectedOrder.orderNumber,
      date: new Date().toISOString().split('T')[0],
      productId: selectedOrder.productId,
      productCode: selectedOrder.productCode,
      productName: selectedOrder.productName,
      finishedQuantity: finishedQty,
      scrapQuantity: scrapQty,
      uom: activeProduceUOM,
      conversionFactor: produceFactor,
      baseQuantity: baseFinishedQty,
      baseUOM: prodBaseUOM,
      finishedGoodsWarehouseId: produceWarehouseId,
      scrapWarehouseId: 'wh-scrap',
      totalMaterialCostEGP: totalProductionCost,
      finishedGoodsUnitCostEGP: finishedUnitCost,
      qualityStatus: QualityStatus.PENDING,
      createdBy: currentUser?.fullName || 'Production Engineer',
      notes: 'استلام مخرجات تشغيل بانتظار فحص الجودة'
    });

    setIsProduceModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCostAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || adjAmount <= 0) return;

    addCostAdjustment({
      productionOrderId: selectedOrder.id,
      productionOrderNumber: selectedOrder.orderNumber,
      date: new Date().toISOString().split('T')[0],
      costCategory: CostCategory.DIRECT_MANUFACTURING,
      costType: 'تكاليف صيانة وتشغيل إضافية',
      amount: adjAmount,
      currency: 'EGP',
      exchangeRate: 1,
      amountEGP: adjAmount,
      allocationMethod: CostAllocationMethod.DIRECT_AMOUNT,
      description: adjReason || 'تعديل وتوزيع تكلفة متأخرة وفق البند 48',
      createdBy: currentUser?.fullName || 'Cost Accountant'
    });

    setIsCostAdjOpen(false);
    setSelectedOrder(null);
  };

  const columns: Column<ProductionOrder>[] = [
    {
      key: 'orderNumber',
      headerAr: 'رقم أمر الإنتاج',
      headerEn: 'Order No',
      render: o => (
        <button
          onClick={() => setDetailOrder(o)}
          className="flex items-center gap-1.5 hover:opacity-80 transition group text-right"
        >
          <span className="font-mono font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
            {o.orderNumber}
          </span>
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
            v{o.version || 1}
          </span>
        </button>
      ),
      exportValue: o => o.orderNumber
    },
    {
      key: 'productName',
      headerAr: 'المنتج المستهدف',
      headerEn: 'Product',
      render: o => (
        <div>
          <div className="font-semibold text-slate-900">{o.productName}</div>
          <div className="text-[11px] text-slate-500 font-mono">BOM: {o.bomCode}</div>
        </div>
      ),
      exportValue: o => o.productName
    },
    {
      key: 'plannedQuantity',
      headerAr: 'الكمية المخططة',
      headerEn: 'Planned Qty',
      render: o => (
        <span className="font-mono font-bold text-slate-800">
          {formatNumber(o.plannedQuantity, language)} {o.uom}
        </span>
      ),
      exportValue: o => o.plannedQuantity
    },
    {
      key: 'actualFinishedQuantity',
      headerAr: 'المنجز الفعلي',
      headerEn: 'Actual Produced',
      render: o => (
        <div>
          <span className="font-mono font-bold text-emerald-700">
            {formatNumber(o.actualFinishedQuantity || 0, language)} {o.uom}
          </span>
          {(o.actualScrapQuantity || 0) > 0 && (
            <div className="text-[11px] text-purple-700 font-mono">
              +{formatNumber(o.actualScrapQuantity || 0, language)} {o.uom} هالك (0 ج.م)
            </div>
          )}
        </div>
      ),
      exportValue: o => o.actualFinishedQuantity || 0
    },
    {
      key: 'finishedGoodsUnitCostEGP',
      headerAr: 'تكلفة وحدة المنتج (EGP)',
      headerEn: 'Unit Cost',
      render: o => (
        <span className="font-mono font-bold text-slate-900">
          {o.finishedGoodsUnitCostEGP > 0
            ? formatCurrency(o.finishedGoodsUnitCostEGP, language)
            : '-'}
        </span>
      ),
      exportValue: o => o.finishedGoodsUnitCostEGP
    },
    {
      key: 'totalProductionCostEGP',
      headerAr: 'إجمالي تكلفة الأمر (EGP)',
      headerEn: 'Total Cost',
      render: o => (
        <span className="font-mono text-slate-700">
          {o.totalProductionCostEGP > 0
            ? formatCurrency(o.totalProductionCostEGP, language)
            : '-'}
        </span>
      ),
      exportValue: o => o.totalProductionCostEGP
    },
    {
      key: 'qualityStatus',
      headerAr: 'حالة الجودة',
      headerEn: 'Quality',
      render: o => <StatusChip status={o.qualityStatus} size="sm" />,
      exportValue: o => o.qualityStatus
    },
    {
      key: 'status',
      headerAr: 'حالة الأمر',
      headerEn: 'Order Status',
      render: o => <StatusChip status={o.status} size="sm" />,
      exportValue: o => o.status
    },
    {
      key: 'actions',
      headerAr: 'الإجراءات والعمليات',
      headerEn: 'Actions',
      sortable: false,
      render: o => (
        <div className="flex items-center gap-1.5 justify-end">
          {/* Action: View Details */}
          <button
            onClick={() => setDetailOrder(o)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-blue-600"
            title={isAr ? 'عرض تفاصيل وتكاليف أمر الإنتاج' : 'View Details & Cost Bridge'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Action: Section 18 Order Modification */}
          <button
            onClick={() => setModifyOrder(o)}
            className="p-1.5 rounded-md hover:bg-purple-50 text-purple-600"
            title={isAr ? 'طلب تعديل أمر الإنتاج (Section 18 Versioning)' : 'Modify Order (New Version)'}
          >
            <GitCommit className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setPrintOrder(o)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-blue-600"
            title={isAr ? 'طباعة أمر التشغيل وبطاقة المتابعة' : 'Print Order Sheet'}
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Action: Issue Raw Materials */}
          {(o.status === ProductionOrderStatus.APPROVED || o.status === ProductionOrderStatus.DRAFT) && (
            <button
              onClick={() => {
                setSelectedOrder(o);
                setIssueQty(1000);
                setIsIssueModalOpen(true);
              }}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold flex items-center gap-1"
              title={isAr ? 'صرف الخامات لأمر الإنتاج' : 'Issue Materials'}
            >
              <Layers className="w-3 h-3" />
              <span>{isAr ? 'صرف خامات' : 'Issue'}</span>
            </button>
          )}

          {/* Action: Receive Output */}
          {o.status === ProductionOrderStatus.MATERIAL_ISSUED && (
            <button
              onClick={() => {
                setSelectedOrder(o);
                setFinishedQty(o.plannedQuantity);
                setScrapQty(100);
                setIsProduceModalOpen(true);
              }}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1"
              title={isAr ? 'استلام الإنتاج وتوزيع التكلفة' : 'Produce Output'}
            >
              <Factory className="w-3 h-3" />
              <span>{isAr ? 'استلام الإنتاج' : 'Produce'}</span>
            </button>
          )}

          {/* Action: Cost Adjustment Section 48 */}
          {(o.status === ProductionOrderStatus.COMPLETED || o.status === ProductionOrderStatus.PENDING_QUALITY) && (
            <button
              onClick={() => {
                setSelectedOrder(o);
                setIsCostAdjOpen(true);
              }}
              className="p-1.5 rounded-md hover:bg-purple-50 text-purple-600"
              title={isAr ? 'تعديل تكلفة متأخرة على الأمر (Section 48)' : 'Adjust Past Cost'}
            >
              <DollarSign className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Action: Safe Deletion (Draft) or Safe Cancellation & Reversal (Posted) */}
          {o.status === ProductionOrderStatus.DRAFT && (
            <button
              onClick={() => setCancelModalOrder(o)}
              className="p-1.5 rounded-md hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition"
              title={isAr ? 'حذف مسودة أمر الإنتاج دون أثر مخزني' : 'Delete Draft Order'}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
          {o.status !== ProductionOrderStatus.DRAFT && o.status !== ProductionOrderStatus.CANCELLED && (
            <button
              onClick={() => setCancelModalOrder(o)}
              className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
              title={isAr ? 'إلغاء وعكس أمر الإنتاج والتحقق من التبعيات' : 'Safe Cancellation & Reversal'}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
          {o.status === ProductionOrderStatus.CANCELLED && (
            <button
              onClick={() => setCancelModalOrder(o)}
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
    <div className="space-y-5" id="view-production-orders">
      {/* Title & Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isAr ? 'أوامر الإنتاج والتصنيع (Production Orders & Work in Progress)' : 'Production Orders'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'إدارة دورة التصنيع: اعتماد BOM، صرف الخامات بمتوسط التكلفة، استيعاب المنتج لكامل التكلفة، وقيمة الهالك = 0 ج.م'
              : 'End-to-end manufacturing: BOM selection, material issue at MAC, finished product absorbs full cost, scrap valued at 0 EGP.'}
          </p>
        </div>

        {activeSubTab === 'orders' ? (
          <button
            id="btn-create-prod-order"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء أمر إنتاج جديد' : 'New Production Order'}</span>
          </button>
        ) : (
          <button
            id="btn-create-cost-adj-top"
            onClick={() => {
              const targetOrder = productionOrders.find(o => o.status === 'COMPLETED') || productionOrders[0];
              setSelectedOrder(targetOrder || null);
              setIsCostAdjOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تسجيل تسوية تكلفة متأخرة' : 'New Cost Adjustment'}</span>
          </button>
        )}
      </div>

      {/* Sub-Tabs: Production Orders vs Cost Adjustments */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          id="tab-btn-orders"
          onClick={() => setActiveSubTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'orders'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>{isAr ? 'أوامر الإنتاج وتتبع التشغيل' : 'Production Orders & WIP'}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'orders' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {productionOrders.length}
          </span>
        </button>

        <button
          id="tab-btn-cost-adj"
          onClick={() => setActiveSubTab('cost-adjustments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'cost-adjustments'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? 'تعديلات التكاليف وأثر المبيعات (Section 44 & 48)' : 'Cost Bridge & COGS Impact'}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'cost-adjustments' ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {costAdjustments.length}
          </span>
        </button>
      </div>

      {activeSubTab === 'orders' ? (
        <>
          {/* Production & Costing Banner (Section 22 proof) */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                <Factory className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-blue-200">
                  {isAr ? 'قواعد التكلفة الصناعية المطبقة (Costing Rules Section 22):' : 'Section 22 Applied Costing Rules:'}
                </div>
                <div className="text-xs font-mono text-emerald-400">
                  1,000 KG Raw Materials @ 110,000 EGP ➔ 900 KG Finished Goods @ 122.222 EGP/KG + 100 KG Scrap @ 0 EGP
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-300">
                {isAr ? 'أي دفعة تامة تخضع أولاً لرقابة الجودة قبل السماح بالبيع' : 'Quality Hold enforces pending release'}
              </span>
            </div>
          </div>

          {/* ERP Smart Filter Bar */}
          <div className="my-3">
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
              totalRecordsCount={productionOrders.length}
              filteredRecordsCount={filteredOrders.length}
            />
          </div>

          {/* Production Orders DataTable */}
          <DataTable
            id="production-orders-table"
            data={filteredOrders}
            columns={columns}
            keyExtractor={o => o.id}
            searchFields={['orderNumber', 'productName', 'bomCode']}
            titleAr="سجل أوامر الإنتاج والتصنيع"
            titleEn="Production Orders Register"
            exportFileName="Production_Orders"
            isLoading={isLoading}
          />
        </>
      ) : (
        <div className="space-y-5" id="cost-adjustments-content">
          {/* Section 48 & 44 KPI strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 mb-1">{isAr ? 'عدد تسويات التكلفة' : 'Cost Adjustments Count'}</div>
              <div className="text-xl font-bold font-mono text-purple-700">{costAdjustments.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">{isAr ? 'وفق البند 48' : 'Under Section 48'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 mb-1">{isAr ? 'إجمالي التكاليف المضافة' : 'Total Added Costs'}</div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {formatCurrency(costAdjustments.reduce((acc, c) => acc + (c.amountEGP || 0), 0), language)}
              </div>
              <div className="text-[11px] text-purple-600 mt-1">{isAr ? 'فواتير ومصروفات متأخرة' : 'Late manufacturing expenses'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-emerald-200 bg-emerald-50/40 shadow-xs">
              <div className="text-xs text-emerald-800 mb-1">{isAr ? 'محمل على مخزون البضاعة التامة' : 'Absorbed by Remaining Stock'}</div>
              <div className="text-xl font-bold font-mono text-emerald-700">
                {formatCurrency(costAdjustments.reduce((acc, c) => acc + (c.inventoryAdjustmentEGP || 0), 0), language)}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">{isAr ? 'زيادة قيمة أصل المخزون بالمستودع' : 'Added to inventory valuation'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-blue-200 bg-blue-50/40 shadow-xs">
              <div className="text-xs text-blue-800 mb-1">{isAr ? 'محمل على تكلفة المبيعات (COGS)' : 'Charged to COGS (Delivered)'}</div>
              <div className="text-xl font-bold font-mono text-blue-700">
                {formatCurrency(costAdjustments.reduce((acc, c) => acc + (c.cogsAdjustmentEGP || 0), 0), language)}
              </div>
              <div className="text-[11px] text-blue-600 mt-1">{isAr ? 'أثر فوري على قائمة الدخل' : 'Direct P&L expense'}</div>
            </div>
          </div>

          {/* Section 48 Banner with direct Action */}
          <div className="p-4 rounded-xl bg-purple-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-purple-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-800 border border-purple-700 text-purple-200 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-purple-200">
                  {isAr ? 'معيار التوزيع النسبي للتكاليف المتأخرة (Section 48 Accounting Principle):' : 'Section 48 Late Cost Allocation:'}
                </div>
                <div className="text-xs text-purple-300">
                  {isAr
                    ? 'يتم توزيع أي تكلفة متأخرة على أوامر الإنتاج بنسبة الكمية المتبقية بالمخزن والكمية المسلمة للعملاء دون أي فاقد محاسبي.'
                    : 'Late adjustments distribute proportionally between stock on-hand and customer sales.'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const targetOrder = productionOrders.find(o => o.status === 'COMPLETED') || productionOrders[0];
                setSelectedOrder(targetOrder || null);
                setIsCostAdjOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition shadow-sm self-start md:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تسجيل تسوية تكلفة متأخرة جديدة' : 'New Cost Adjustment'}</span>
            </button>
          </div>

          {/* Embedded Section 44 & 48 Report */}
          <ProductionCostImpactReport />
        </div>
      )}

      {/* Modal: Create Production Order */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">
                  {isAr ? 'إنشاء أمر إنتاج جديد (Production Order)' : 'New Production Order'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'المنتج التام المراد تصنيعه *' : 'Target Finished Product *'}
                  </label>
                  <select
                    value={targetProductId}
                    onChange={e => setTargetProductId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nameAr} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'قائمة المواد المعتمدة (BOM) *' : 'Active BOM *'}
                  </label>
                  <select
                    value={selectedBomId}
                    onChange={e => setSelectedBomId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  >
                    {boms.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.code} - {b.productName} (الإصدار {b.version})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? `الكمية المخططة (${targetProduct?.defaultUOM || 'KG'}) *` : 'Planned Quantity *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={plannedQty}
                    onChange={e => setPlannedQty(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'مستودع التشغيل / صالة الإنتاج' : 'Production WIP Warehouse'}
                  </label>
                  <select
                    value={prodWhId}
                    onChange={e => setProdWhId(e.target.value)}
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

              {/* Warehouses configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'مستودع استلام المنتج التام' : 'Finished Goods Warehouse'}
                  </label>
                  <select
                    value={fgWhId}
                    onChange={e => setFgWhId(e.target.value)}
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

              {/* BOM Materials preview */}
              {activeBom && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-slate-700 font-bold text-[11px]">
                    {isAr ? 'الخامات المطلوبة وفق الـ BOM المعتمد:' : 'BOM Required Components:'}
                  </div>
                  <div className="divide-y divide-slate-200 text-[11px]">
                    {activeBom.lines.map((line, idx) => {
                      const reqQty = line.quantity * plannedQty;
                      return (
                        <div key={idx} className="py-1 flex justify-between font-mono">
                          <span className="text-slate-700 font-sans">{line.rawMaterialName}</span>
                          <span className="font-bold text-slate-900">
                            {formatNumber(reqQty, language)} {line.uom}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات وتوجيهات التشغيل' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isAr ? 'اعتماد أمر الإنتاج' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Materials to Production */}
      {isIssueModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-400/30 font-mono text-[10px] font-bold px-2 py-0.5">
                  Type 4 — SAP B1
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {isAr ? `صرف خامات لأمر الإنتاج (${selectedOrder.orderNumber})` : 'Issue Materials to Production'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'يتم الصرف بمتوسط تكلفة موقع الخامات الفعلي مع منع التعديل اليدوي' : 'System MAC at source warehouse locked & recorded against order pool'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'المادة الخام المستهدفة *' : 'Target Raw Material *'}
                  </label>
                  <input
                    type="text"
                    value={`${activeRawMat.nameAr} (${activeRawMat.code})`}
                    disabled
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-100 font-bold text-slate-700 cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'المستودع المصدر (موقع الخام) *' : 'Source Warehouse (Location) *'}
                  </label>
                  <select
                    value={issueWarehouseId}
                    onChange={e => setIssueWarehouseId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.nameAr} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source Location Valuation Card */}
              <LocationValuationCard
                language={language}
                locationName={activeIssueWh?.nameAr || issueWarehouseId}
                itemUOM={rawMatBaseUOM}
                currentOnHand={rawMatOnHand}
                currentValue={rawMatValue}
                currentMAC={rawMatMAC}
                transactionQuantity={baseIssueQty}
                direction="OUTGOING"
                unitCost={rawMatMAC}
                isCostLocked={true}
                lockReason={isAr ? 'متوسط تكلفة المستودع مقفل آلياً لصرف التشغيل (SAP B1 Type 4)' : 'Locked to source location MAC'}
                projectedNewOnHand={rawMatProjOnHand}
                projectedNewValue={rawMatProjValue}
                projectedNewMAC={rawMatProjMAC}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'وحدة القياس لصرف الخام *' : 'Issue UOM *'}
                  </label>
                  <select
                    value={activeIssueUOM}
                    onChange={e => setIssueUOM(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                  >
                    {availableIssueUOMs.map(u => (
                      <option key={u.id} value={u.code}>
                        {u.code} - {u.nameAr} {u.conversionFactor && u.conversionFactor !== 1 ? `(×${u.conversionFactor})` : `(${isAr ? 'أساسية' : 'Base'})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? `الكمية المصروفة (${activeIssueUOM}) *` : `Issued Qty (${activeIssueUOM}) *`}
                  </label>
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    value={issueQty}
                    onChange={e => setIssueQty(parseFloat(e.target.value) || 0)}
                    className={`w-full p-2.5 rounded-lg border font-mono font-bold text-base focus:ring-2 ${
                      isIssueExceeding
                        ? 'border-rose-400 bg-rose-50 text-rose-700 focus:ring-rose-500'
                        : 'border-slate-200 text-amber-700 focus:ring-amber-500'
                    }`}
                    required
                  />
                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className="text-slate-500">{isAr ? 'رصيد المستودع:' : 'Wh Stock:'}</span>
                    <span className={`font-mono font-bold ${isIssueExceeding ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatNumber(rawMatOnHand, language)} {rawMatBaseUOM}
                    </span>
                  </div>
                </div>

                {/* System Locked Issue Cost */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{isAr ? 'تكلفة الوحدة المنصرفة *' : 'Unit Cost (MAC) *'}</span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      {isAr ? 'مقفل' : 'Locked'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(rawMatMAC, language)}
                    disabled
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-100 font-mono font-bold text-slate-700 cursor-not-allowed select-none"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    {isAr ? 'محسوب آلياً من متوسط تكلفة المصدر' : 'System MAC from location'}
                  </div>
                </div>
              </div>

              {issueFactor !== 1 && (
                <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'معادلة التحويل للوحدة الأساسية:' : 'Base Conversion:'}</span>
                  </span>
                  <span className="font-mono font-bold text-blue-950 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {formatUOMTransactionLabel(issueQty, activeIssueUOM, rawMatBaseUOM, issueFactor, language)}
                  </span>
                </div>
              )}

              {/* Total Cost Added to Order Cost Pool */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex justify-between items-center text-xs font-mono text-amber-950">
                <span className="font-sans font-semibold">
                  {isAr ? 'إجمالي تكلفة الخامات المضافة لمجمع تكلفة الأمر:' : 'Total Value Added to Production Cost Pool:'}
                </span>
                <span className="font-bold text-sm">
                  {formatCurrency(issueTotalCost, language)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isIssueExceeding || issueQty <= 0}
                  className={`px-5 py-2 rounded-lg font-bold text-white transition flex items-center gap-2 ${
                    isIssueExceeding || issueQty <= 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20'
                  }`}
                >
                  {isIssueExceeding ? (
                    <span>{isAr ? 'عجز في رصيد المستودع' : 'Insufficient Stock'}</span>
                  ) : (
                    <span>{isAr ? 'تأكيد ترحيل صرف الخامات' : 'Post Material Issue'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Production Receipt */}
      {isProduceModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 font-mono text-[10px] font-bold px-2 py-0.5">
                  Type 3 — SAP B1
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {isAr ? `استلام مخرجات الإنتاج (${selectedOrder.orderNumber})` : 'Receive Production Output'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'احتساب التكلفة آلياً من مجمع تكاليف الصرف الفعلي مع تخصيص قيمة 0 للهالك' : 'Receipt cost calculated from actual issues pool; scrap receives zero value'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProduceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProduceSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'المنتج التام المستلم *' : 'Finished Product *'}
                  </label>
                  <input
                    type="text"
                    value={`${selectedOrder.productName} (${selectedOrder.productCode})`}
                    disabled
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-100 font-bold text-slate-700 cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'مستودع استلام المنتج التام *' : 'Finished Goods Warehouse *'}
                  </label>
                  <select
                    value={produceWarehouseId}
                    onChange={e => setProduceWarehouseId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {warehouses
                      .filter(w => w.type === 'FINISHED_GOODS')
                      .map(w => (
                        <option key={w.id} value={w.id}>
                          {w.nameAr} ({w.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Destination FG Warehouse Valuation Card */}
              <LocationValuationCard
                language={language}
                locationName={activeProduceWh?.nameAr || produceWarehouseId}
                itemUOM={prodBaseUOM}
                currentOnHand={fgOnHand}
                currentValue={fgValue}
                currentMAC={fgMAC}
                transactionQuantity={baseFinishedQty}
                direction="INCOMING"
                unitCost={finishedUnitCost}
                isCostLocked={true}
                lockReason={isAr ? 'تكلفة الإنتاج مجمعة آلياً من الخامات المنصرفة (SAP B1 Rule)' : 'Production cost derived from actual issues'}
                projectedNewOnHand={fgProjOnHand}
                projectedNewValue={fgProjValue}
                projectedNewMAC={fgProjMAC}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'وحدة الاستلام *' : 'Receipt UOM *'}
                  </label>
                  <select
                    value={activeProduceUOM}
                    onChange={e => setProduceUOM(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {availableProduceUOMs.map(u => (
                      <option key={u.id} value={u.code}>
                        {u.code} - {u.nameAr} {u.conversionFactor && u.conversionFactor !== 1 ? `(×${u.conversionFactor})` : `(${isAr ? 'أساسية' : 'Base'})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? `الكمية التامة السليمة (${activeProduceUOM}) *` : `Good Finished Qty (${activeProduceUOM}) *`}
                  </label>
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    value={finishedQty}
                    onChange={e => setFinishedQty(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{isAr ? `كمية الهالك (${activeProduceUOM})` : `Scrap Qty (${activeProduceUOM})`}</span>
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1 py-0.5 rounded border border-purple-200">
                      0.00 ج.م
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={scrapQty}
                    onChange={e => setScrapQty(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-mono font-bold text-purple-700"
                    required
                  />
                </div>
              </div>

              {produceFactor !== 1 && (
                <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'معادلة التحويل للوحدة الأساسية للمنتج:' : 'Base Conversion:'}</span>
                  </span>
                  <span className="font-mono font-bold text-blue-950 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {formatUOMTransactionLabel(finishedQty, activeProduceUOM, prodBaseUOM, produceFactor, language)}
                  </span>
                </div>
              )}

              {/* Direct Labor & Overhead */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'أجور عمالة تشغيل مباشرة (اختياري - ج.م)' : 'Direct Labor Cost (EGP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={laborCost}
                    onChange={e => setLaborCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'مصاريف صناعية غير مباشرة (اختياري - ج.م)' : 'Direct Overhead Cost (EGP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={overheadCost}
                    onChange={e => setOverheadCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              {/* SAP B1 Costing Engine Pool & Unit Allocation (Section 22 Rule) */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-mono space-y-2">
                <div className="text-[11px] font-bold text-emerald-900 font-sans flex items-center justify-between">
                  <span>{isAr ? '📐 مجمع تكاليف الإنتاج الفعلي (SAP B1 Cost Pool):' : '📐 SAP B1 Production Cost Pool:'}</span>
                  <span className="text-[10px] bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                    {isAr ? 'محسوب آلياً ومقفل' : 'Auto-Calculated & Locked'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs border-b border-emerald-200/60 pb-2">
                  <div>
                    <span className="font-sans text-slate-600 block">{isAr ? 'مجمع الخامات المصروفة فعلياً:' : 'Posted Issues Pool:'}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(orderMaterialCostPool, language)}</span>
                  </div>
                  <div>
                    <span className="font-sans text-slate-600 block">{isAr ? 'إجمالي تكلفة أمر التشغيل:' : 'Total Cost Pool:'}</span>
                    <span className="font-bold text-emerald-800">{formatCurrency(totalProductionCost, language)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-0.5">
                  <span className="font-sans text-slate-700 font-bold">
                    {isAr ? 'تكلفة الوحدة للمنتج التام السليم:' : 'Finished Unit Cost Allocated:'}
                  </span>
                  <span className="font-bold text-blue-800 text-sm bg-white px-2 py-1 rounded border border-blue-200">
                    {formatCurrency(finishedUnitCost, language)} / {prodBaseUOM}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-purple-900 pt-0.5 border-t border-emerald-200/40">
                  <span className="font-sans text-slate-600">{isAr ? 'تقييم كمية الهالك (Scrap Valuation):' : 'Scrap Valuation:'}</span>
                  <span className="font-bold font-sans">0.00 ج.م (قاعدة إلزامية: لا تحمّل تكلفة للهالك)</span>
                </div>
              </div>

              <div className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>
                  {isAr
                    ? 'تنبيه: سيتم إرسال الدفعة لقسم فحص الجودة (حالة PENDING_QUALITY) ولن يسمح ببيعها حتى الاعتماد.'
                    : 'Notice: Output will be held in PENDING_QUALITY until Quality Approval.'}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProduceModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={finishedQty <= 0}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  {isAr ? 'ترحيل استلام الإنتاج' : 'Post Production Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cost Adjustment (Section 48) */}
      {isCostAdjOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">
                  {isAr ? `تعديل تكاليف متأخرة على أمر الإنتاج (${selectedOrder.orderNumber})` : 'Cost Adjustment (Section 48)'}
                </h3>
              </div>
              <button
                onClick={() => setIsCostAdjOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCostAdjSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs">
                {isAr
                  ? 'وفقاً للبند 48: في حال ورود تكاليف متأخرة بعد إغلاق الدفعة، يتم توزيع الفارق نسبياً بين المخزون الباقي وتكلفة البضاعة المباعة (COGS).'
                  : 'Section 48: Late adjustments are allocated proportionally between remaining stock and COGS.'}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'أمر الإنتاج المستهدف *' : 'Target Production Order *'}
                </label>
                <select
                  value={selectedOrder.id}
                  onChange={e => {
                    const ord = productionOrders.find(o => o.id === e.target.value);
                    if (ord) setSelectedOrder(ord);
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-mono"
                >
                  {productionOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.productName} ({o.actualFinishedQuantity || o.plannedQuantity} {o.uom})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'مبلغ التكلفة الإضافية (EGP) *' : 'Additional Amount (EGP) *'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={adjAmount}
                  onChange={e => setAdjAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-mono font-bold text-base"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'سبب ومبرر التعديل *' : 'Adjustment Reason *'}
                </label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCostAdjOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  {isAr ? 'ترحيل تسوية التكلفة' : 'Post Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Sheet */}
      {printOrder && (
        <DocumentPrintModal
          isOpen={true}
          onClose={() => setPrintOrder(null)}
          titleAr="بطاقة أمر إنتاج وتشغيل صناعي (Production Traveler)"
          titleEn="Production Order & Traveler Sheet"
          documentNumber={printOrder.orderNumber}
          documentDate={printOrder.productionDate}
          status={printOrder.status}
          createdBy={printOrder.createdBy}
          notes={printOrder.notes}
          details={[
            { labelAr: 'المنتج المستهدف', labelEn: 'Target Product', value: printOrder.productName },
            { labelAr: 'كود المنتج', labelEn: 'Product Code', value: printOrder.productCode },
            { labelAr: 'رقم قائمة المواد (BOM)', labelEn: 'BOM Number', value: printOrder.bomCode },
            { labelAr: 'الكمية المخططة', labelEn: 'Planned Quantity', value: `${printOrder.plannedQuantity} ${printOrder.uom}` },
            { labelAr: 'الكمية المنجزة فعلياً', labelEn: 'Actual Produced', value: `${printOrder.actualFinishedQuantity || 0} ${printOrder.uom}` },
            { labelAr: 'كمية الهالك (0 ج.م)', labelEn: 'Scrap Quantity', value: `${printOrder.actualScrapQuantity || 0} ${printOrder.uom}` }
          ]}
          financialSummary={[
            { labelAr: 'تكلفة الخامات الفعلية المستهلكة', labelEn: 'Material Cost', value: printOrder.actualMaterialCostEGP || 0 },
            { labelAr: 'تكاليف إضافية / تسويات', labelEn: 'Additional Costs', value: printOrder.additionalCostEGP || 0 },
            { labelAr: 'إجمالي تكلفة أمر الإنتاج', labelEn: 'Total Production Cost', value: printOrder.totalProductionCostEGP || 0 },
            { labelAr: 'تكلفة وحدة المنتج التام المحسوبة', labelEn: 'Finished Unit Cost', value: printOrder.finishedGoodsUnitCostEGP || 0 }
          ]}
        />
      )}

      {/* Production Order Modification Modal (Section 18) */}
      <ProductionOrderModificationModal
        isOpen={!!modifyOrder}
        order={modifyOrder}
        onClose={() => setModifyOrder(null)}
      />

      {/* Production Order Detail & Cost Bridge Modal */}
      <ProductionOrderDetailModal
        isOpen={!!detailOrder}
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onPrint={setPrintOrder}
        onOpenModify={setModifyOrder}
      />

      {/* Safe One-Click Cancellation & Reversal Modal */}
      {cancelModalOrder && (
        <SafeTransactionCancelModal
          isOpen={true}
          onClose={() => setCancelModalOrder(null)}
          documentType="PRODUCTION_ORDER"
          documentNumber={cancelModalOrder.orderNumber}
          onSuccess={() => setCancelModalOrder(null)}
        />
      )}
    </div>
  );
};
