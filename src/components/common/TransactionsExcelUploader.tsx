import React, { useState, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PackagePlus,
  Layers,
  ArrowRightLeft,
  Factory,
  SendHorizontal,
  DollarSign,
  Search,
  Filter,
  Check,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Database,
  Info,
  X,
  ExternalLink,
  Sparkles,
  ChevronRight,
  FileText,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, Language } from '../../types';
import {
  EntityKey,
  ENTITY_DEFINITIONS,
  generateTemplate,
  parseImportFile,
  validateImportData,
  ImportValidationResult,
  ImportError
} from '../../services/dataImportExportService';

export type TransactionEntityKey =
  | 'receipts'
  | 'issues'
  | 'transfers'
  | 'productionOrders'
  | 'customerDeliveries'
  | 'landedCosts';

export interface TransactionTypeOption {
  key: TransactionEntityKey;
  labelAr: string;
  labelEn: string;
  subtitleAr: string;
  subtitleEn: string;
  icon: React.ElementType;
  colorClass: string;
  targetViewNav: string;
  badgeAr: string;
  badgeEn: string;
}

export const TRANSACTION_TYPE_OPTIONS: TransactionTypeOption[] = [
  {
    key: 'receipts',
    labelAr: 'أذون إضافة واستلام مخزني (GRPO)',
    labelEn: 'Inventory Receipts / Add Stock',
    subtitleAr: 'تسجيل شراء واستلام المواد الخام والمنتجات مع احتساب متوسط التكلفة التلقائي',
    subtitleEn: 'Receive incoming goods, assign to warehouses, and update moving average cost',
    icon: PackagePlus,
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100',
    targetViewNav: 'receipts',
    badgeAr: 'وارد مخازن + تكلفة',
    badgeEn: 'Inflow + Cost'
  },
  {
    key: 'issues',
    labelAr: 'أذون صرف مخزني عام',
    labelEn: 'Inventory Issues (Dispatches)',
    subtitleAr: 'صرف خامات ومواد من المستودع لتشغيل أو صيانة مع قفل متوسط التكلفة لحظياً',
    subtitleEn: 'Dispatches from warehouse for operations, locking location cost',
    icon: Layers,
    colorClass: 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100',
    targetViewNav: 'issues',
    badgeAr: 'صرف واستهلاك',
    badgeEn: 'Consumption'
  },
  {
    key: 'transfers',
    labelAr: 'سندات التحويل المخزني',
    labelEn: 'Inter-Warehouse Transfers',
    subtitleAr: 'نقل الخامات أو المنتجات بين عنابر ومستودعات المصنع المختلفة مع نقل القيمة',
    subtitleEn: 'Move stock between source and destination warehouses with valuation sync',
    icon: ArrowRightLeft,
    colorClass: 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100',
    targetViewNav: 'transfers',
    badgeAr: 'نقل بين المستودعات',
    badgeEn: 'Stock Transfer'
  },
  {
    key: 'productionOrders',
    labelAr: 'أوامر الإنتاج والتصنيع (Work Orders)',
    labelEn: 'Production & Manufacturing Orders',
    subtitleAr: 'إصدار خطط وجداول التشغيل الصناعية، ربط شجرة المنتج BOM وتعيين الماكينات',
    subtitleEn: 'Issue work orders, allocate finished products, BOM recipes, and machines',
    icon: Factory,
    colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100',
    targetViewNav: 'production-orders',
    badgeAr: 'تشغيل وتصنيع',
    badgeEn: 'Manufacturing'
  },
  {
    key: 'customerDeliveries',
    labelAr: 'سندات تسليم العملاء (المبيعات)',
    labelEn: 'Customer Deliveries (Sales Outflow)',
    subtitleAr: 'تسليم المنتجات التامة للعملاء، خصم الرصيد واحتساب تكلفة المبيعات COGS',
    subtitleEn: 'Dispatch finished goods to clients, deplete inventory, calculate COGS',
    icon: SendHorizontal,
    colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-300 hover:bg-cyan-100',
    targetViewNav: 'customer-deliveries',
    badgeAr: 'تسليم مبيعات',
    badgeEn: 'Sales Dispatch'
  },
  {
    key: 'landedCosts',
    labelAr: 'تكاليف الإنزال الإضافية (Landed Cost)',
    labelEn: 'Landed Costs (Customs & Freight)',
    subtitleAr: 'توزيع مصاريف الشحن والتخليص الجمركي على أذون الاستلام وإعادة تسعير المخزون',
    subtitleEn: 'Capitalize freight and customs onto inventory receipts, re-evaluating MAC',
    icon: DollarSign,
    colorClass: 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100',
    targetViewNav: 'landed-cost',
    badgeAr: 'جمارك وشحن إضافي',
    badgeEn: 'Landed Cost'
  }
];

interface TransactionsExcelUploaderProps {
  initialType?: TransactionEntityKey;
  onNavigateToView?: (viewId: string) => void;
  className?: string;
  isModalMode?: boolean;
  onCloseModal?: () => void;
}

export const TransactionsExcelUploader: React.FC<TransactionsExcelUploaderProps> = ({
  initialType = 'receipts',
  onNavigateToView,
  className = '',
  isModalMode = false,
  onCloseModal
}) => {
  const {
    language,
    currentUser,
    warehouses,
    locations,
    uoms,
    rawMaterials,
    products,
    suppliers,
    customers,
    receipts,
    machines,
    addReceipt,
    addIssue,
    addTransfer,
    createProductionOrder,
    addCustomerDelivery,
    addLandedCost
  } = useApp();

  const isAr = language === 'ar';
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const [selectedType, setSelectedType] = useState<TransactionEntityKey>(initialType);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [tableFilter, setTableFilter] = useState<'ALL' | 'VALID' | 'ERRORS'>('ALL');
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [commitSuccessStats, setCommitSuccessStats] = useState<{
    postedCount: number;
    transactionLabel: string;
    targetViewNav: string;
    sampleNumbers: string[];
    timestamp: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync if initialType changes from outside
  React.useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType]);

  const activeOption = useMemo(() => {
    return (
      TRANSACTION_TYPE_OPTIONS.find(o => o.key === selectedType) ||
      TRANSACTION_TYPE_OPTIONS[0]
    );
  }, [selectedType]);

  const activeDefinition = useMemo(() => {
    return ENTITY_DEFINITIONS[selectedType];
  }, [selectedType]);

  // Handle template download
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    try {
      const { blob, filename } = generateTemplate(selectedType, format, {
        withSampleData: true,
        language
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Error generating template');
    }
  };

  // Handle file processing
  const handleFileProcess = async (file: File) => {
    setUploadedFile(file);
    setIsParsing(true);
    setCommitSuccessStats(null);
    setCommitError(null);

    try {
      const parsed = await parseImportFile(file);
      const validation = validateImportData(selectedType, parsed.rawRows, {
        warehouses,
        locations,
        uoms,
        rawMaterials,
        products,
        suppliers,
        customers,
        receipts,
        isAr
      });
      setValidationResult(validation);
    } catch (err: any) {
      setCommitError(err.message || (isAr ? 'فشل في قراءة أو فحص الملف.' : 'Failed to parse file.'));
      setValidationResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setValidationResult(null);
    setCommitSuccessStats(null);
    setCommitError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Execute Direct Registration into System
  const handleRegisterTransactions = async () => {
    if (!isAdmin) {
      setCommitError(
        isAr
          ? 'عفواً، هذه العملية مصرحة لمدير النظام (Admin) فقط لا غير.'
          : 'Registration restricted to System Administrator.'
      );
      return;
    }

    if (!validationResult || validationResult.validRows.length === 0) {
      setCommitError(
        isAr
          ? 'لا توجد حركات صالحة ومطابقة للسكيما للتسجيل.'
          : 'No valid rows matching the template schema.'
      );
      return;
    }

    setIsCommitting(true);
    setCommitError(null);

    try {
      const rows = validationResult.validRows;
      let registered = 0;
      const generatedNumbers: string[] = [];

      for (const row of rows) {
        switch (selectedType) {
          case 'receipts': {
            const sup = suppliers.find(s => s.code === row.supplierCode);
            const raw = rawMaterials.find(m => m.code === row.itemCode);
            const prod = products.find(p => p.code === row.itemCode);
            const wh = warehouses.find(w => w.code === row.warehouseCode) || warehouses[0];
            const item = raw || prod;
            const rate = Number(row.exchangeRate || 1);
            const unitPrice = Number(row.unitPrice || 0);
            const generatedNo =
              row.receiptNumber ||
              `REC-IMP-${Date.now().toString().slice(-6)}-${registered + 1}`;

            addReceipt({
              receiptNumber: generatedNo,
              date: row.date || new Date().toISOString().slice(0, 10),
              supplierId: sup?.id || 'SUP-DIRECT',
              supplierName: row.supplierName || sup?.nameAr || 'مورد محلي معتمد',
              currency: row.currency || 'EGP',
              exchangeRate: rate,
              itemId: item?.id || `item-${row.itemCode}`,
              itemCode: row.itemCode,
              itemName: row.itemName || item?.nameAr || row.itemCode,
              itemType: (raw ? 'RAW_MATERIAL' : 'FINISHED_PRODUCT') as any,
              warehouseId: wh?.id || 'WH-RAW-01',
              quantity: Number(row.quantity),
              uom: row.uom || item?.defaultUOM || 'KG',
              unitPrice,
              unitPriceEGP: unitPrice * rate,
              totalValueEGP: Number(row.quantity) * unitPrice * rate,
              reference: row.reference || 'Uploaded via Excel',
              notes: row.notes || 'استيراد جماعي عبر أداة Transactions Uploader',
              createdBy: currentUser?.fullName || 'Admin Uploader'
            } as any);

            generatedNumbers.push(generatedNo);
            registered++;
            break;
          }

          case 'issues': {
            const item =
              rawMaterials.find(m => m.code === row.itemCode) ||
              products.find(p => p.code === row.itemCode);
            const wh = warehouses.find(w => w.code === row.fromWarehouseCode) || warehouses[0];
            const qty = Number(row.quantity);
            const cost = item ? item.movingAverageCost : 100;
            const generatedNo =
              row.issueNumber ||
              `ISS-IMP-${Date.now().toString().slice(-6)}-${registered + 1}`;

            addIssue({
              issueNumber: generatedNo,
              date: row.date || new Date().toISOString().slice(0, 10),
              fromWarehouseId: wh?.id || 'WH-RAW-01',
              itemId: item?.id || `item-${row.itemCode}`,
              itemCode: row.itemCode,
              itemName: item?.nameAr || row.itemCode,
              quantity: qty,
              uom: row.uom || item?.defaultUOM || 'KG',
              movingAverageCostEGP: cost,
              totalIssueValueEGP: qty * cost,
              reason: row.reason || 'صرف تشغيلي معتمد (مرفوع من إكسيل)',
              reference: row.reference || 'Uploaded via Excel',
              notes: row.notes || 'تسجيل تلقائي عبر أداة رفع الحركات',
              createdBy: currentUser?.fullName || 'Admin Uploader'
            } as any);

            generatedNumbers.push(generatedNo);
            registered++;
            break;
          }

          case 'transfers': {
            const item =
              rawMaterials.find(m => m.code === row.itemCode) ||
              products.find(p => p.code === row.itemCode);
            const fromWh = warehouses.find(w => w.code === row.fromWarehouseCode) || warehouses[0];
            const toWh =
              warehouses.find(w => w.code === row.toWarehouseCode) ||
              warehouses[1] ||
              warehouses[0];
            const qty = Number(row.quantity);
            const cost = item ? item.movingAverageCost : 100;
            const generatedNo =
              row.transferNumber ||
              `TRN-IMP-${Date.now().toString().slice(-6)}-${registered + 1}`;

            addTransfer({
              transferNumber: generatedNo,
              date: row.date || new Date().toISOString().slice(0, 10),
              fromWarehouseId: fromWh?.id || 'WH-RAW-01',
              toWarehouseId: toWh?.id || 'WH-WIP-PLANT1',
              itemId: item?.id || `item-${row.itemCode}`,
              itemCode: row.itemCode,
              itemName: item?.nameAr || row.itemCode,
              quantity: qty,
              uom: row.uom || item?.defaultUOM || 'KG',
              unitCostEGP: cost,
              totalValueEGP: qty * cost,
              reference: row.reference || 'Uploaded via Excel',
              notes: row.notes || 'تحويل مخزني جماعي مرفوع من إكسيل',
              createdBy: currentUser?.fullName || 'Admin Uploader'
            } as any);

            generatedNumbers.push(generatedNo);
            registered++;
            break;
          }

          case 'productionOrders': {
            const prod = products.find(p => p.code === row.productCode);
            const mc = machines.find(m => m.code === row.machineCode);
            const qty = Number(row.plannedQuantity);
            const generatedNo =
              row.orderNumber ||
              `PRD-IMP-${Date.now().toString().slice(-6)}-${registered + 1}`;

            createProductionOrder({
              orderNumber: generatedNo,
              productionDate: row.productionDate || new Date().toISOString().slice(0, 10),
              productId: prod?.id || `prod-${row.productCode}`,
              productCode: row.productCode,
              productName: prod?.nameAr || row.productCode,
              plannedQuantity: qty,
              uom: row.uom || prod?.defaultUOM || 'PCS',
              bomId: row.bomCode ? `bom-${row.bomCode}` : '',
              bomCode: row.bomCode || '',
              bomVersion: '1.0',
              machineId: mc?.id,
              machineName: mc?.nameAr,
              productionStage: row.productionStage || 'التشغيل والتجميع الصناعي',
              wipWarehouseId: row.wipWarehouseCode
                ? warehouses.find(w => w.code === row.wipWarehouseCode)?.id || 'WH-WIP-PLANT1'
                : 'WH-WIP-PLANT1',
              expectedFinishedQuantity: qty,
              expectedScrapQuantity: 0,
              materials: [],
              notes: row.notes || 'أمر إنتاج مدخل مجمع عبر أداة رفع Excel',
              createdBy: currentUser?.fullName || 'Admin Uploader'
            } as any);

            generatedNumbers.push(generatedNo);
            registered++;
            break;
          }

          case 'customerDeliveries': {
            const cust = customers.find(c => c.code === row.customerCode);
            const prod = products.find(p => p.code === row.itemCode);
            const wh = warehouses.find(w => w.code === row.fromWarehouseCode) || warehouses[0];
            const qty = Number(row.quantity);
            const sellPrice = Number(row.unitSellingPrice || 0);
            const generatedNo =
              row.deliveryNumber ||
              `DEL-IMP-${Date.now().toString().slice(-6)}-${registered + 1}`;

            addCustomerDelivery({
              deliveryNumber: generatedNo,
              date: row.date || new Date().toISOString().slice(0, 10),
              customerId: cust?.id || 'CUST-DIRECT',
              customerName: row.customerName || cust?.nameAr || 'عميل محلي',
              fromWarehouseId: wh?.id || 'WH-FG-01',
              itemId: prod?.id || `prod-${row.itemCode}`,
              itemCode: row.itemCode,
              productName: prod?.nameAr || row.itemCode,
              quantity: qty,
              uom: row.uom || prod?.defaultUOM || 'PCS',
              sellingPriceEGP: sellPrice,
              totalSellingPriceEGP: qty * sellPrice,
              cogsUnitCostEGP: prod ? prod.movingAverageCost : 100,
              totalCOGSValueEGP: qty * (prod ? prod.movingAverageCost : 100),
              reference: row.reference || 'Uploaded via Excel',
              notes: row.notes || 'تسليم مبيعات للعميل مرفوع من إكسيل',
              createdBy: currentUser?.fullName || 'Admin Uploader'
            } as any);

            generatedNumbers.push(generatedNo);
            registered++;
            break;
          }

          case 'landedCosts': {
            const rate = Number(row.exchangeRate || 1);
            const amt = Number(row.amount || 0);
            const amtEGP = amt * rate;
            const targetRec = receipts.find(
              r => r.receiptNumber.toUpperCase() === String(row.originalReceiptNumber).toUpperCase()
            );
            const generatedNo =
              row.landedCostNumber ||
              `LND-IMP-${Date.now().toString().slice(-6)}-${registered + 1}`;

            addLandedCost({
              landedCostNumber: generatedNo,
              date: row.date || new Date().toISOString().slice(0, 10),
              receiptId: targetRec?.id || 'REC-001',
              originalReceiptNumber: row.originalReceiptNumber,
              costType: row.costType || 'مصاريف شحن ونقل وجمارك',
              amount: amt,
              currency: row.currency || 'EGP',
              exchangeRate: rate,
              amountEGP: amtEGP,
              allocationMethod: row.allocationMethod || 'DIRECT_AMOUNT',
              notes: row.notes || 'تكلفة إنزال مخصصة عبر ملف إكسيل',
              createdBy: currentUser?.fullName || 'Admin Uploader'
            } as any);

            generatedNumbers.push(generatedNo);
            registered++;
            break;
          }
        }
      }

      setCommitSuccessStats({
        postedCount: registered,
        transactionLabel: isAr ? activeOption.labelAr : activeOption.labelEn,
        targetViewNav: activeOption.targetViewNav,
        sampleNumbers: generatedNumbers.slice(0, 5),
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US')
      });
      setValidationResult(null);
      setUploadedFile(null);
    } catch (err: any) {
      setCommitError(err.message || 'حدث خطأ أثناء ترحيل الحركات إلى النظام.');
    } finally {
      setIsCommitting(false);
    }
  };

  const filteredPreviewRows = useMemo(() => {
    if (!validationResult) return [];
    if (tableFilter === 'VALID') return validationResult.validRows;
    if (tableFilter === 'ERRORS') return validationResult.errorRows.map(r => r.rowData);
    // ALL
    return [
      ...validationResult.validRows,
      ...validationResult.errorRows.map(r => r.rowData)
    ];
  }, [validationResult, tableFilter]);

  return (
    <div
      className={`space-y-6 ${className}`}
      dir={isAr ? 'rtl' : 'ltr'}
      id="transactions-excel-uploader"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 end-0 -mt-12 -me-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'أداة الإدخال السريع للحركات المخزنية والصناعية (Transactions Fast-Uploader)' : 'Fast Transactions Excel Uploader'}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] border border-amber-400/30 font-bold">
                {isAr ? 'أدمن فقط' : 'Admin'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <span>
                {isAr
                  ? 'رفع وتسجيل حركات Transactions بالـ Excel فوراً في النظام'
                  : 'Upload & Instantly Post Transactions from Excel'}
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'ارفع ملفاتك المحلية مباشرة (أذون إضافة واستلام، صرف، تحويلات، أوامر إنتاج، تسليمات بيع، أو تكاليف إنزال) لتسجيلها فوراً في دفتر الأستاذ والمخزون وحساب التكاليف آلياً دون أي تعارض مع السكيما.'
                : 'Upload Excel/CSV sheets for goods receipts, issues, transfers, work orders, sales deliveries, or landed costs to post them instantly into the ledger and re-evaluate stock.'}
            </p>
          </div>

          {/* Quick Stats or Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              title={isAr ? 'تحميل قالب Excel متوافق جاهز للتعبئة' : 'Download Compatible Excel Template'}
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'تحميل Template المعاملة (.xlsx)' : 'Download Template (.xlsx)'}</span>
            </button>

            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              title={isAr ? 'تحميل قالب CSV مع دعم كامل للعربية UTF-8' : 'Download UTF-8 CSV Template'}
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>{isAr ? 'قالب CSV' : 'CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Privilege Restriction Alert */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">{isAr ? 'تنبيه الأمان والصلاحيات: ' : 'Admin Role Required: '}</span>
            {isAr
              ? 'أنت تتصفح بصفتك مستخدم بدون صلاحية الإدارة العليا (Admin). يمكنك تنزيل القوالب والاطلاع على السكيما، ولكن ترحيل وتسجيل الحركات على النظام متاح حصرياً لمدير النظام.'
              : 'You are signed in as a standard operator. You may download templates and preview schemas, but committing transactions directly to the ERP ledger is restricted to Administrators.'}
          </div>
        </div>
      )}

      {/* Step 1: Choose Transaction Type */}
      <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                1
              </span>
              <span>{isAr ? 'اختر نوع الحركة المخزنية أو العملية المراد رفعها:' : 'Step 1: Select Transaction Type to Upload:'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'يتم ربط كل نوع حركة مباشرة بالقالب والسكيما البرمجية الخاصة به لضمان مطابقة الأعمدة'
                : 'Each transaction type binds directly to its dedicated database schema and validation logic'}
            </p>
          </div>

          <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 self-start sm:self-auto">
            {activeDefinition.columns.length} {isAr ? 'حقول سكيما' : 'schema fields'}
          </div>
        </div>

        {/* 6 Transaction Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {TRANSACTION_TYPE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = selectedType === opt.key;

            return (
              <button
                key={opt.key}
                onClick={() => {
                  if (selectedType !== opt.key) {
                    setSelectedType(opt.key);
                    handleReset();
                  }
                }}
                className={`p-4 rounded-xl border text-start transition flex flex-col justify-between space-y-3 cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {isAr ? opt.labelAr : opt.labelEn}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {opt.key}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isAr ? opt.badgeAr : opt.badgeEn}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                  {isAr ? opt.subtitleAr : opt.subtitleEn}
                </p>

                {isSelected && (
                  <div className="text-[10px] font-bold text-blue-700 flex items-center gap-1 pt-1 border-t border-blue-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'المعاملة المحددة حالياً' : 'Currently Active Type'}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Schema Guide & Template Download Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                2
              </span>
              <span>{isAr ? `تنزيل الـ Template المتوافق لحركة (${activeOption.labelAr}):` : `Step 2: Download Template for (${activeOption.labelEn}):`}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'يحتوي القالب على شيت إدخال البيانات وشيت دليل السكيما وشرح الشروط والأعمدة المطلوبة'
                : 'Contains the exact localized headers, validation rules, and sample values.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تنزيل قالب Excel جاهز (.xlsx)' : 'Download Excel (.xlsx)'}</span>
            </button>

            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>{isAr ? 'قالب CSV' : 'CSV'}</span>
            </button>
          </div>
        </div>

        {/* Column Schema Quick Preview */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>{isAr ? 'الأعمدة المتوافقة المطلوبة في ملف الإكسيل:' : 'Compatible Columns Expected in Uploaded File:'}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeDefinition.columns.map((c, i) => (
              <div
                key={i}
                className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border ${
                  c.required
                    ? 'bg-amber-50 text-amber-900 border-amber-200 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title={isAr ? c.descriptionAr : c.descriptionEn}
              >
                <span>{isAr ? c.labelAr : c.labelEn}</span>
                <span className="text-[10px] opacity-70 font-mono">
                  [{c.type}]
                </span>
                {c.required && (
                  <span className="text-[10px] text-amber-700 bg-amber-200/60 px-1 rounded">
                    {isAr ? 'إلزامي' : 'Req'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: Drag & Drop Upload Zone */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
              3
            </span>
            <span>{isAr ? 'رفع ملف الـ Excel أو الـ CSV:' : 'Step 3: Upload Excel or CSV File:'}</span>
          </h3>

          {uploadedFile && (
            <button
              onClick={handleReset}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إلغاء الملف والبدء من جديد' : 'Reset File'}</span>
            </button>
          )}
        </div>

        {/* Dropzone */}
        {!uploadedFile && !commitSuccessStats && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[1.005]'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-white'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                {isAr
                  ? 'اضغط لاختيار ملف الـ Excel أو اسحبه وأفلته هنا مباشرة'
                  : 'Click to select or drag and drop your spreadsheet here'}
              </p>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'الصيغ المدعومة: Excel (.xlsx, .xls) و CSV مع دعم كامل لترميز اللغة العربية UTF-8'
                  : 'Supported formats: .xlsx, .xls, .csv (UTF-8 encoding preserved)'}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                {isAr ? `تأكد أن الأعمدة متوافقة مع حركة: ${activeOption.labelAr}` : `Matches: ${activeOption.labelEn}`}
              </span>
            </div>
          </div>
        )}

        {/* Loading Spinner during parsing */}
        {isParsing && (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              {isAr ? 'جاري فحص ومطابقة الملف مع سكيما المعاملات...' : 'Parsing and validating against schema...'}
            </p>
          </div>
        )}

        {/* Success Report After Commit */}
        {commitSuccessStats && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-emerald-950">
                  {isAr
                    ? `تم تسجيل وترحيل ${commitSuccessStats.postedCount} حركة بنجاح على السيستم!`
                    : `Successfully posted ${commitSuccessStats.postedCount} transactions directly to the ERP!`}
                </h4>
                <p className="text-xs text-emerald-800">
                  {isAr
                    ? `تم قيد السندات في دفتر أستاذ المخزون، تحديث متوسط التكلفة، وتعديل كميات المستودعات في تمام الساعة ${commitSuccessStats.timestamp}.`
                    : `Vouchers registered, ledger entries created, and valuation recalculated at ${commitSuccessStats.timestamp}.`}
                </p>
              </div>
            </div>

            {/* Generated Vouchers List Preview */}
            {commitSuccessStats.sampleNumbers.length > 0 && (
              <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                <span className="text-xs font-bold text-slate-700">
                  {isAr ? 'أرقام السندات المسجلة حديثاً في السيستم:' : 'Sample registered voucher numbers:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {commitSuccessStats.sampleNumbers.map((no, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono text-xs font-bold"
                    >
                      {no}
                    </span>
                  ))}
                  {commitSuccessStats.postedCount > commitSuccessStats.sampleNumbers.length && (
                    <span className="px-2 py-1 text-xs text-emerald-700">
                      +{commitSuccessStats.postedCount - commitSuccessStats.sampleNumbers.length} {isAr ? 'سندات إضافية' : 'more'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action to Jump to View or Upload Another Batch */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onNavigateToView && (
                <button
                  onClick={() => onNavigateToView(commitSuccessStats.targetViewNav)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <span>{isAr ? `الانتقال إلى شاشة (${commitSuccessStats.transactionLabel})` : 'Go to Transaction Ledger'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 transition cursor-pointer"
              >
                {isAr ? 'رفع دفعة حركات أخرى' : 'Upload Another Batch'}
              </button>

              {isModalMode && onCloseModal && (
                <button
                  onClick={onCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Commit Error Alert */}
        {commitError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">{isAr ? 'تعذر إتمام عملية التسجيل:' : 'Registration Error:'}</p>
              <p>{commitError}</p>
            </div>
          </div>
        )}

        {/* Validation Result Preview & Registration Action */}
        {validationResult && (
          <div className="space-y-4">
            {/* File Info & KPI Chips */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{uploadedFile?.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {((uploadedFile?.size || 0) / 1024).toFixed(1)} KB — {validationResult.totalRows} {isAr ? 'صف حركة مكتشف' : 'detected rows'}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setTableFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    tableFilter === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isAr ? 'الكل:' : 'All:'} {validationResult.totalRows}
                </button>

                <button
                  onClick={() => setTableFilter('VALID')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                    tableFilter === 'VALID'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مطابق وجاهز للتسجيل:' : 'Valid:'} {validationResult.stats.validCount}</span>
                </button>

                {validationResult.stats.errorCount > 0 && (
                  <button
                    onClick={() => setTableFilter('ERRORS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                      tableFilter === 'ERRORS'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isAr ? 'أخطاء:' : 'Errors:'} {validationResult.stats.errorCount}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error Notifications List if any */}
            {validationResult.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {isAr
                      ? `تم اكتشاف ${validationResult.errors.length} خطأ أو نقص في السكيما في بعض الصفوف:`
                      : `Found ${validationResult.errors.length} schema issues:`}
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pe-2">
                  {validationResult.errors.slice(0, 10).map((err, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-amber-800 bg-amber-100/70 p-1.5 rounded flex items-center justify-between"
                    >
                      <span>
                        {isAr ? `صف ${err.row}: ` : `Row ${err.row}: `}
                        {err.message}
                      </span>
                      <span className="font-mono text-[10px] text-amber-900 bg-amber-200 px-1 rounded">
                        {err.field}
                      </span>
                    </div>
                  ))}
                  {validationResult.errors.length > 10 && (
                    <div className="text-[10px] text-amber-700 italic">
                      +{validationResult.errors.length - 10} {isAr ? 'أخطاء أخرى' : 'more issues'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview Table of Detected Rows */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-72 overflow-x-auto overflow-y-auto">
                <table className="w-full text-xs text-start border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-center w-12">#</th>
                      <th className="p-2.5 text-center w-20">{isAr ? 'الحالة' : 'Status'}</th>
                      {activeDefinition.columns.map((col, idx) => (
                        <th key={idx} className="p-2.5 text-start whitespace-nowrap">
                          {isAr ? col.labelAr : col.labelEn}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredPreviewRows.slice(0, 50).map((row, rowIdx) => {
                      const isErr = validationResult.errorRows.some(
                        er => er.rowNumber === (row._rowNumber || rowIdx + 1)
                      );

                      return (
                        <tr
                          key={rowIdx}
                          className={`hover:bg-slate-50 transition ${
                            isErr ? 'bg-rose-50/40 text-rose-900' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center font-mono text-slate-500">
                            {row._rowNumber || rowIdx + 1}
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            {isErr ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                {isAr ? 'خطأ' : 'Error'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                {isAr ? 'صالح' : 'Valid'}
                              </span>
                            )}
                          </td>
                          {activeDefinition.columns.map((col, colIdx) => (
                            <td
                              key={colIdx}
                              className="p-2.5 whitespace-nowrap font-mono text-slate-700 max-w-xs truncate"
                            >
                              {String(row[col.key] ?? '')}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredPreviewRows.length > 50 && (
                <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-200">
                  {isAr
                    ? `تم عرض أول 50 حركة من أصل ${filteredPreviewRows.length}`
                    : `Showing first 50 rows of ${filteredPreviewRows.length}`}
                </div>
              )}
            </div>

            {/* Post / Register Action Buttons Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl">
              <div className="space-y-0.5">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isAr
                      ? `جاهز لتسجيل (${validationResult.stats.validCount}) حركة على السيستم مباشرة`
                      : `Ready to post (${validationResult.stats.validCount}) transactions`}
                  </span>
                </span>
                <p className="text-[11px] text-slate-400">
                  {isAr
                    ? 'سيتم تسجيل السندات فوراً، حساب متوسط التكلفة وتحديث دفاتر المخزون'
                    : 'Will create vouchers, update moving average cost and warehouse stock instantly'}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleReset}
                  disabled={isCommitting}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  id="btn-register-transactions-now"
                  onClick={handleRegisterTransactions}
                  disabled={isCommitting || validationResult.stats.validCount === 0 || !isAdmin}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                    isCommitting || validationResult.stats.validCount === 0 || !isAdmin
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {isCommitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isAr ? 'جاري تسجيل وترحيل الحركات...' : 'Posting transactions...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        {isAr
                          ? `تسجيل ${validationResult.stats.validCount} حركة في السيستم الآن`
                          : `Post ${validationResult.stats.validCount} Transactions Now`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
