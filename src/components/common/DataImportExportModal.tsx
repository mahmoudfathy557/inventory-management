import React, { useState, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Boxes,
  Package,
  Layers,
  Building2,
  MapPin,
  Scale,
  Cog,
  Users,
  DollarSign,
  PackagePlus,
  ArrowRightLeft,
  Factory,
  SendHorizontal,
  Search,
  Filter,
  Check,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Database,
  Info,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  EntityKey,
  ENTITY_DEFINITIONS,
  generateTemplate,
  exportEntityData,
  parseImportFile,
  validateImportData,
  ImportValidationResult
} from '../../services/dataImportExportService';

interface DataImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEntity?: EntityKey;
  initialTab?: 'templates' | 'import';
}

export const DataImportExportModal: React.FC<DataImportExportModalProps> = ({
  isOpen,
  onClose,
  defaultEntity = 'rawMaterials',
  initialTab = 'templates'
}) => {
  const {
    language,
    currentUser,
    rawMaterials,
    products,
    itemCategories,
    warehouses,
    locations,
    uoms,
    machines,
    suppliers,
    customers,
    currencies,
    users,
    receipts,
    issues,
    transfers,
    productionOrders,
    customerDeliveries,
    landedCosts,
    saveRawMaterial,
    saveProduct,
    saveItemCategory,
    saveWarehouse,
    saveLocation,
    saveUOM,
    saveMachine,
    saveSupplier,
    saveCustomer,
    saveCurrency,
    saveUser,
    saveBOM,
    addReceipt,
    addIssue,
    addTransfer,
    createProductionOrder,
    addCustomerDelivery,
    addLandedCost
  } = useApp();

  const isAr = language === 'ar';
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const [activeTab, setActiveTab] = useState<'templates' | 'import'>(initialTab);
  const [selectedEntity, setSelectedEntity] = useState<EntityKey>(defaultEntity);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'master' | 'operations'>('ALL');

  // Import workflow states
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'insert'>('upsert');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'VALID' | 'ERRORS'>('ALL');
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccessStats, setCommitSuccessStats] = useState<{
    added: number;
    updated: number;
    total: number;
    entityLabel: string;
  } | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default entity if modal reopens
  React.useEffect(() => {
    if (defaultEntity) {
      setSelectedEntity(defaultEntity);
    }
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [defaultEntity, initialTab, isOpen]);

  // List of all entities
  const allEntityKeys = Object.keys(ENTITY_DEFINITIONS) as EntityKey[];

  const filteredEntities = useMemo(() => {
    return allEntityKeys.filter(key => {
      const def = ENTITY_DEFINITIONS[key];
      const matchCat = categoryFilter === 'ALL' || def.category === categoryFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        def.labelAr.toLowerCase().includes(query) ||
        def.labelEn.toLowerCase().includes(query) ||
        def.descriptionAr.toLowerCase().includes(query) ||
        key.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }, [allEntityKeys, categoryFilter, searchQuery]);

  const currentDef = ENTITY_DEFINITIONS[selectedEntity] || ENTITY_DEFINITIONS.rawMaterials;

  // Icon helper
  const renderEntityIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Boxes':
        return <Boxes className={className} />;
      case 'Package':
        return <Package className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'Building2':
        return <Building2 className={className} />;
      case 'MapPin':
        return <MapPin className={className} />;
      case 'Scale':
        return <Scale className={className} />;
      case 'Cog':
        return <Cog className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'DollarSign':
        return <DollarSign className={className} />;
      case 'PackagePlus':
        return <PackagePlus className={className} />;
      case 'ArrowRightLeft':
        return <ArrowRightLeft className={className} />;
      case 'Factory':
        return <Factory className={className} />;
      case 'SendHorizontal':
        return <SendHorizontal className={className} />;
      default:
        return <Database className={className} />;
    }
  };

  // Get current live records for export
  const getLiveRecords = (key: EntityKey): any[] => {
    switch (key) {
      case 'rawMaterials':
        return rawMaterials;
      case 'products':
        return products;
      case 'categories':
        return itemCategories;
      case 'warehouses':
        return warehouses;
      case 'locations':
        return locations;
      case 'uoms':
        return uoms;
      case 'machines':
        return machines;
      case 'suppliers':
        return suppliers;
      case 'customers':
        return customers;
      case 'currencies':
        return currencies;
      case 'users':
        return users;
      case 'receipts':
        return receipts;
      case 'issues':
        return issues;
      case 'transfers':
        return transfers;
      case 'productionOrders':
        return productionOrders;
      case 'customerDeliveries':
        return customerDeliveries;
      case 'landedCosts':
        return landedCosts;
      default:
        return [];
    }
  };

  // Trigger file download in browser
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle template download
  const handleDownloadTemplate = (format: 'xlsx' | 'csv', withSampleData = true) => {
    try {
      const { blob, filename } = generateTemplate(selectedEntity, format, {
        withSampleData,
        language
      });
      triggerDownload(blob, filename);
    } catch (err: any) {
      alert(err.message || 'Error generating template');
    }
  };

  // Handle export live data
  const handleExportData = (format: 'xlsx' | 'csv') => {
    try {
      const records = getLiveRecords(selectedEntity);
      const { blob, filename } = exportEntityData(selectedEntity, records, format, { language });
      triggerDownload(blob, filename);
    } catch (err: any) {
      alert(err.message || 'Error exporting data');
    }
  };

  // Handle file drop / selection
  const handleFileProcess = async (file: File) => {
    setUploadedFile(file);
    setIsParsing(true);
    setCommitSuccessStats(null);
    setCommitError(null);

    try {
      const parsed = await parseImportFile(file);
      const validation = validateImportData(selectedEntity, parsed.rawRows, {
        warehouses,
        locations,
        uoms,
        categories: itemCategories,
        rawMaterials,
        products,
        suppliers,
        customers,
        receipts,
        isAr
      });
      setValidationResult(validation);
    } catch (err: any) {
      setCommitError(err.message || 'فشل في قراءة أو تحليل الملف.');
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

  // Reset import state
  const handleResetImport = () => {
    setUploadedFile(null);
    setValidationResult(null);
    setCommitSuccessStats(null);
    setCommitError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Execute Commit to AppContext
  const handleExecuteCommit = async (onlyValid = false) => {
    if (!isAdmin) {
      setCommitError(isAr ? 'عفواً، هذه العملية مصرحة لمدير النظام (Admin) فقط.' : 'Admin privileges required.');
      return;
    }
    if (!validationResult || validationResult.validRows.length === 0) {
      setCommitError(isAr ? 'لا توجد صفوف صالحة للاستيراد.' : 'No valid rows to import.');
      return;
    }

    setIsCommitting(true);
    setCommitError(null);

    try {
      const rowsToImport = validationResult.validRows;
      let addedCount = 0;
      let updatedCount = 0;

      // Group BOM rows if importing BOMs
      if (selectedEntity === 'boms') {
        const bomGroups: Record<string, { bomHeader: any; lines: any[] }> = {};
        rowsToImport.forEach(r => {
          const code = r.code;
          if (!bomGroups[code]) {
            bomGroups[code] = {
              bomHeader: {
                id: `bom-${code}`,
                code: r.code,
                productId: `prod-${r.productCode}`,
                productCode: r.productCode,
                productName: r.productCode,
                nameAr: r.nameAr,
                nameEn: r.nameEn || r.nameAr,
                version: r.version || '1.0',
                effectiveFrom: new Date().toISOString().slice(0, 10),
                status: r.status || 'APPROVED',
                approvalStatus: 'APPROVED',
                notes: r.notes || 'Imported via Excel'
              },
              lines: []
            };
          }
          if (r.rawMaterialCode && r.quantity) {
            bomGroups[code].lines.push({
              id: `line-${r.code}-${bomGroups[code].lines.length + 1}`,
              rawMaterialId: `raw-${r.rawMaterialCode}`,
              rawMaterialCode: r.rawMaterialCode,
              rawMaterialName: r.rawMaterialCode,
              quantity: Number(r.quantity),
              uom: r.uom || 'KG',
              sequence: Number(r.sequence || bomGroups[code].lines.length + 1),
              productionStage: r.productionStage || 'التشغيل',
              mandatory: r.mandatory !== false
            });
          }
        });

        Object.values(bomGroups).forEach(group => {
          const finalBOM = {
            ...group.bomHeader,
            lines: group.lines
          };
          saveBOM(finalBOM);
          addedCount++;
        });
      } else {
        // Handle all other entities
        for (const row of rowsToImport) {
          switch (selectedEntity) {
            case 'rawMaterials': {
              const existing = rawMaterials.find(m => m.code.toUpperCase() === row.code.toUpperCase());
              const cat = itemCategories.find(c => c.code === row.categoryCode);
              const wh = warehouses.find(w => w.code === row.defaultWarehouseCode);
              const initialQty = Number(row.currentQty || 0);
              const mac = Number(row.movingAverageCost || 0);

              const record = {
                id: existing ? existing.id : `raw-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: row.code,
                nameAr: row.nameAr,
                nameEn: row.nameEn || row.nameAr,
                itemType: 'RAW_MATERIAL' as any,
                categoryId: cat?.id,
                categoryCode: row.categoryCode,
                valuationMethod: row.valuationMethod || 'MOVING_AVERAGE',
                defaultUOM: row.defaultUOM,
                alternativeUOM: row.alternativeUOM,
                conversionFactor: Number(row.conversionFactor || 1),
                defaultWarehouseId: wh?.id || warehouses[0]?.id || 'WH-RAW-01',
                currentQty: initialQty,
                movingAverageCost: mac,
                totalValue: initialQty * mac,
                minStock: Number(row.minStock || 0),
                maxStock: Number(row.maxStock || 0),
                reorderLevel: Number(row.reorderLevel || 0),
                description: row.description,
                active: row.active !== false
              };
              saveRawMaterial(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'products': {
              const existing = products.find(p => p.code.toUpperCase() === row.code.toUpperCase());
              const wh = warehouses.find(w => w.code === row.defaultWarehouseCode);
              const cat = itemCategories.find(c => c.code === row.categoryCode);
              const initialQty = Number(row.currentQty || 0);
              const mac = Number(row.movingAverageCost || 0);

              const record = {
                id: existing ? existing.id : `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: row.code,
                nameAr: row.nameAr,
                nameEn: row.nameEn || row.nameAr,
                productType: row.productType || 'FINISHED_PRODUCT',
                categoryId: cat?.id,
                categoryCode: row.categoryCode,
                valuationMethod: row.valuationMethod || 'MOVING_AVERAGE',
                defaultUOM: row.defaultUOM,
                defaultWarehouseId: wh?.id || warehouses[0]?.id || 'WH-FG-01',
                currentQty: initialQty,
                movingAverageCost: mac,
                totalValue: initialQty * mac,
                description: row.description,
                active: row.active !== false
              };
              saveProduct(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'categories': {
              const existing = itemCategories.find(c => c.code.toUpperCase() === row.code.toUpperCase());
              const record = {
                id: existing ? existing.id : `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: row.code,
                nameAr: row.nameAr,
                nameEn: row.nameEn || row.nameAr,
                valuationMethod: row.valuationMethod || 'MOVING_AVERAGE',
                applicableType: row.applicableType || 'ALL',
                standardCostEGP: Number(row.standardCostEGP || 0),
                description: row.description,
                active: row.active !== false
              };
              saveItemCategory(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'warehouses': {
              const existing = warehouses.find(w => w.code.toUpperCase() === row.code.toUpperCase());
              const record = {
                id: existing ? existing.id : `wh-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: row.code,
                nameAr: row.nameAr,
                nameEn: row.nameEn || row.nameAr,
                type: row.type || 'RAW_MATERIALS',
                notes: row.notes,
                active: row.active !== false
              };
              saveWarehouse(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'locations': {
              const existing = locations.find(l => l.code.toUpperCase() === row.code.toUpperCase());
              const wh = warehouses.find(w => w.code === row.warehouseCode) || warehouses[0];
              const record = {
                id: existing ? existing.id : `loc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: row.code,
                nameAr: row.nameAr,
                nameEn: row.nameEn || row.nameAr,
                warehouseId: wh?.id || 'WH-RAW-01',
                stageName: row.stageName,
                notes: row.notes,
                active: row.active !== false
              };
              saveLocation(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'uoms': {
              const existing = uoms.find(u => u.code.toUpperCase() === row.code.toUpperCase());
              const record = {
                id: existing ? existing.id : `uom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: row.code,
                nameAr: row.nameAr,
                nameEn: row.nameEn || row.nameAr,
                uomType: row.uomType || 'PRIMARY',
                baseUOM: row.baseUOM,
                conversionFactor: Number(row.conversionFactor || 1),
                active: row.active !== false
              };
              saveUOM(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'machines': {
              const existing = machines.find(m => m.code.toUpperCase() === row.code.toUpperCase());
              const loc = locations.find(l => l.code === row.defaultLocationCode) || locations[0];
              const record = {
                id: existing ? existing.id : `mc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: row.code,
                nameAr: row.nameAr,
                nameEn: row.nameEn || row.nameAr,
                productionStage: row.productionStage || 'عام',
                defaultLocationId: loc?.id || 'LOC-A1',
                description: row.description,
                active: row.active !== false
              };
              saveMachine(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'suppliers': {
              const existing = suppliers.find(s => s.code.toUpperCase() === row.code.toUpperCase());
              const record = {
                id: existing ? existing.id : `sup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: row.code,
                nameAr: row.nameAr,
                nameEn: row.nameEn || row.nameAr,
                phone: row.phone,
                email: row.email,
                address: row.address,
                taxNumber: row.taxNumber,
                defaultCurrency: row.defaultCurrency || 'EGP',
                paymentTerms: row.paymentTerms,
                active: row.active !== false
              };
              saveSupplier(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'customers': {
              const existing = customers.find(c => c.code.toUpperCase() === row.code.toUpperCase());
              const record = {
                id: existing ? existing.id : `cust-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: row.code,
                nameAr: row.nameAr,
                nameEn: row.nameEn || row.nameAr,
                phone: row.phone,
                email: row.email,
                address: row.address,
                taxNumber: row.taxNumber,
                defaultCurrency: row.defaultCurrency || 'EGP',
                paymentTerms: row.paymentTerms,
                active: row.active !== false
              };
              saveCustomer(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'currencies': {
              const existing = currencies.find(c => c.code.toUpperCase() === row.code.toUpperCase());
              const record = {
                id: existing ? existing.id : `cur-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: row.code,
                nameAr: row.nameAr,
                nameEn: row.nameEn || row.nameAr,
                exchangeRate: Number(row.exchangeRate || 1),
                rateDate: row.rateDate || new Date().toISOString().slice(0, 10),
                isBase: row.isBase === true || row.code.toUpperCase() === 'EGP',
                active: row.active !== false
              };
              saveCurrency(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'users': {
              const existing = users.find(u => u.username.toUpperCase() === row.username.toUpperCase());
              const record = {
                id: existing ? existing.id : `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                username: row.username,
                fullName: row.fullName,
                email: row.email,
                role: row.role || UserRole.INVENTORY_USER,
                department: row.department,
                active: row.active !== false
              };
              saveUser(record as any);
              if (existing) updatedCount++;
              else addedCount++;
              break;
            }

            case 'receipts': {
              const sup = suppliers.find(s => s.code === row.supplierCode);
              const raw = rawMaterials.find(m => m.code === row.itemCode);
              const prod = products.find(p => p.code === row.itemCode);
              const wh = warehouses.find(w => w.code === row.warehouseCode) || warehouses[0];
              const item = raw || prod;
              const rate = Number(row.exchangeRate || 1);
              const unitPrice = Number(row.unitPrice || 0);

              addReceipt({
                receiptNumber: row.receiptNumber,
                date: row.date || new Date().toISOString().slice(0, 10),
                supplierId: sup?.id || 'SUP-DIRECT',
                supplierName: row.supplierName || sup?.nameAr || 'مورد محلي',
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
                reference: row.reference,
                notes: row.notes,
                createdBy: currentUser?.fullName || 'Admin Import'
              } as any);
              addedCount++;
              break;
            }

            case 'issues': {
              const item = rawMaterials.find(m => m.code === row.itemCode) || products.find(p => p.code === row.itemCode);
              const wh = warehouses.find(w => w.code === row.fromWarehouseCode) || warehouses[0];
              const qty = Number(row.quantity);
              const cost = item ? item.movingAverageCost : 100;

              addIssue({
                issueNumber: row.issueNumber,
                date: row.date || new Date().toISOString().slice(0, 10),
                fromWarehouseId: wh?.id || 'WH-RAW-01',
                itemId: item?.id || `item-${row.itemCode}`,
                itemCode: row.itemCode,
                itemName: item?.nameAr || row.itemCode,
                quantity: qty,
                uom: row.uom || item?.defaultUOM || 'KG',
                movingAverageCostEGP: cost,
                totalIssueValueEGP: qty * cost,
                reason: row.reason || 'صرف تشغيلي مستورد',
                reference: row.reference,
                notes: row.notes,
                createdBy: currentUser?.fullName || 'Admin Import'
              } as any);
              addedCount++;
              break;
            }

            case 'transfers': {
              const item = rawMaterials.find(m => m.code === row.itemCode) || products.find(p => p.code === row.itemCode);
              const fromWh = warehouses.find(w => w.code === row.fromWarehouseCode) || warehouses[0];
              const toWh = warehouses.find(w => w.code === row.toWarehouseCode) || warehouses[1] || warehouses[0];
              const qty = Number(row.quantity);
              const cost = item ? item.movingAverageCost : 100;

              addTransfer({
                transferNumber: row.transferNumber,
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
                reference: row.reference,
                notes: row.notes,
                createdBy: currentUser?.fullName || 'Admin Import'
              } as any);
              addedCount++;
              break;
            }

            case 'productionOrders': {
              const prod = products.find(p => p.code === row.productCode);
              const mc = machines.find(m => m.code === row.machineCode);
              const qty = Number(row.plannedQuantity);

              createProductionOrder({
                orderNumber: row.orderNumber,
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
                productionStage: row.productionStage || 'التشغيل والتجميع',
                wipWarehouseId: 'WH-WIP-PLANT1',
                expectedFinishedQuantity: qty,
                expectedScrapQuantity: 0,
                materials: [],
                notes: row.notes,
                createdBy: currentUser?.fullName || 'Admin Import'
              } as any);
              addedCount++;
              break;
            }

            case 'customerDeliveries': {
              const cust = customers.find(c => c.code === row.customerCode);
              const prod = products.find(p => p.code === row.itemCode);
              const wh = warehouses.find(w => w.code === row.fromWarehouseCode) || warehouses[0];
              const qty = Number(row.quantity);
              const sellPrice = Number(row.unitSellingPrice || 0);
              const rate = Number(row.exchangeRate || 1);
              const cost = prod ? prod.movingAverageCost : sellPrice * 0.7;

              addCustomerDelivery({
                deliveryNumber: row.deliveryNumber,
                date: row.date || new Date().toISOString().slice(0, 10),
                customerId: cust?.id || 'CUST-DIRECT',
                customerName: row.customerName || cust?.nameAr || 'عميل نقدي',
                fromWarehouseId: wh?.id || 'WH-FG-01',
                itemId: prod?.id || `item-${row.itemCode}`,
                itemCode: row.itemCode,
                itemName: prod?.nameAr || row.itemCode,
                quantity: qty,
                uom: row.uom || prod?.defaultUOM || 'PCS',
                unitSellingPrice: sellPrice,
                currency: row.currency || 'EGP',
                exchangeRate: rate,
                sellingPriceEGP: sellPrice * rate,
                totalRevenueEGP: qty * sellPrice * rate,
                unitCostEGP: cost,
                totalCostEGP: qty * cost,
                reference: row.reference,
                notes: row.notes,
                createdBy: currentUser?.fullName || 'Admin Import'
              } as any);
              addedCount++;
              break;
            }

            case 'landedCosts': {
              const targetRcpt = receipts.find(r => r.receiptNumber === row.originalReceiptNumber);
              const rate = Number(row.exchangeRate || 1);
              const amount = Number(row.amount || 0);

              addLandedCost({
                landedCostNumber: row.landedCostNumber,
                date: row.date || new Date().toISOString().slice(0, 10),
                originalReceiptId: targetRcpt?.id || 'REC-GENERIC',
                originalReceiptNumber: row.originalReceiptNumber,
                itemId: targetRcpt?.itemId || 'ITEM-GENERIC',
                itemName: targetRcpt?.itemName || 'صنف التكلفة',
                costType: row.costType || 'مصاريف جمركية وشحن',
                amount,
                currency: row.currency || 'EGP',
                exchangeRate: rate,
                amountEGP: amount * rate,
                allocationMethod: row.allocationMethod || 'DIRECT_AMOUNT',
                notes: row.notes,
                createdBy: currentUser?.fullName || 'Admin Import'
              } as any);
              addedCount++;
              break;
            }
          }
        }
      }

      setCommitSuccessStats({
        added: addedCount,
        updated: updatedCount,
        total: addedCount + updatedCount,
        entityLabel: isAr ? currentDef.labelAr : currentDef.labelEn
      });
      setValidationResult(null);
      setUploadedFile(null);
    } catch (err: any) {
      setCommitError(err.message || 'حدث خطأ أثناء حفظ البيانات المستوردة.');
    } finally {
      setIsCommitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fadeIn">
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header Bar */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {isAr ? 'مركز استيراد وتصدير البيانات وقوالب الجداول' : 'Data Import, Export & Schema Templates Center'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  {isAr ? 'خاص بالأدمن فقط' : 'Admin Only'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'تحميل قوالب Excel و CSV لكافة الجداول واستيراد وتحديث البيانات دون تعارض مع بنية السكيما'
                  : 'Download official Excel & CSV templates, validate data structures, and import directly without conflicts'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Non-Admin Restriction Alert */}
        {!isAdmin && (
          <div className="m-6 p-5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3.5 text-rose-900">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold">
                {isAr ? 'صلاحية استيراد البيانات مقتصرة على مدير النظام (Admin)' : 'Admin Authorization Required'}
              </h4>
              <p className="text-xs text-rose-700 leading-relaxed">
                {isAr
                  ? 'وفقاً لسياسة فصل المهام وتأمين الدورة المالية والمخزنية، يمكنك فقط استعراض وتنزيل القوالب، بينما يتطلب رفع واستيراد الملفات إلى قاعدة البيانات صلاحية مدير النظام.'
                  : 'For system integrity and accounting compliance, importing data is strictly restricted to System Administrators. You can still download templates.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'templates'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'اختيار الجدول وتحميل القوالب' : 'Select Table & Download Templates'}</span>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'import'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{isAr ? 'استيراد ورفع ملف (Excel / CSV)' : 'Upload & Import Data'}</span>
              {validationResult && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              )}
            </button>
          </div>

          <div className="text-2xs text-slate-400 hidden sm:block">
            {isAr
              ? `الجدول النشط: ${currentDef.labelAr}`
              : `Active Table: ${currentDef.labelEn}`}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {activeTab === 'templates' ? (
            /* TAB 1: TEMPLATES & EXPORT DIRECTORY */
            <div className="space-y-6">
              {/* Filter & Search Bar */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث في أسماء الجداول والقوالب...' : 'Search tables...'}
                    className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">{isAr ? 'القسم:' : 'Category:'}</span>
                  <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
                    <button
                      onClick={() => setCategoryFilter('ALL')}
                      className={`px-3 py-1 rounded-md transition ${
                        categoryFilter === 'ALL'
                          ? 'bg-white text-blue-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isAr ? 'الكل' : 'All'}
                    </button>
                    <button
                      onClick={() => setCategoryFilter('master')}
                      className={`px-3 py-1 rounded-md transition ${
                        categoryFilter === 'master'
                          ? 'bg-white text-blue-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isAr ? 'البيانات الأساسية' : 'Master Data'}
                    </button>
                    <button
                      onClick={() => setCategoryFilter('operations')}
                      className={`px-3 py-1 rounded-md transition ${
                        categoryFilter === 'operations'
                          ? 'bg-white text-blue-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isAr ? 'العمليات المخزنية والإنتاج' : 'Operations'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of Tables Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredEntities.map(key => {
                  const def = ENTITY_DEFINITIONS[key];
                  const isSelected = selectedEntity === key;
                  const liveCount = getLiveRecords(key).length;

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedEntity(key)}
                      className={`cursor-pointer p-4 rounded-xl border text-start transition relative ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {renderEntityIcon(def.iconName, 'w-4 h-4')}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {isAr ? def.labelAr : def.labelEn}
                            </h4>
                            <span className="text-2xs text-slate-500 font-mono">
                              {key}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                            def.category === 'master'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {def.category === 'master'
                            ? isAr ? 'أساسي' : 'Master'
                            : isAr ? 'حركات' : 'Operations'}
                        </span>
                      </div>

                      <p className="text-2xs text-slate-500 line-clamp-2 mb-3">
                        {isAr ? def.descriptionAr : def.descriptionEn}
                      </p>

                      <div className="flex items-center justify-between text-2xs border-t border-slate-100 pt-2.5 text-slate-600">
                        <span className="flex items-center gap-1">
                          <span className="font-bold text-slate-900">{def.columns.length}</span>
                          {isAr ? 'حقل / عمود' : 'columns'}
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                          {liveCount} {isAr ? 'سجل حالي' : 'records'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Entity Actions & Schema Inspector */}
              <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      {renderEntityIcon(currentDef.iconName, 'w-6 h-6')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {isAr ? currentDef.labelAr : currentDef.labelEn}
                        </h3>
                        <span className="text-2xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                          {currentDef.key}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {isAr ? currentDef.descriptionAr : currentDef.descriptionEn}
                      </p>
                    </div>
                  </div>

                  {/* Template & Export Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="btn-download-excel-sample"
                      onClick={() => handleDownloadTemplate('xlsx', true)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                      title={isAr ? 'تحميل قالب Excel جاهز مع صف بيانات استرشادي ودليل القيم المقبولة' : 'Download Excel with sample row'}
                    >
                      <Download className="w-4 h-4" />
                      <span>{isAr ? 'قالب Excel مع بيانات تجريبية (.xlsx)' : 'Excel Template (with Samples)'}</span>
                    </button>

                    <button
                      id="btn-download-excel-blank"
                      onClick={() => handleDownloadTemplate('xlsx', false)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1.5 transition"
                      title={isAr ? 'تحميل قالب Excel فارغ للعناوين فقط' : 'Download blank Excel template'}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'قالب Excel فارغ' : 'Blank Excel'}</span>
                    </button>

                    <button
                      id="btn-download-csv"
                      onClick={() => handleDownloadTemplate('csv', true)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1.5 transition"
                      title={isAr ? 'تحميل بصيغة CSV مدعومة باللغة العربية UTF-8' : 'Download UTF-8 CSV template'}
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{isAr ? 'قالب CSV (UTF-8)' : 'CSV Template'}</span>
                    </button>

                    <button
                      id="btn-export-live-data"
                      onClick={() => handleExportData('xlsx')}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {isAr
                          ? `تصدير البيانات الحالية (${getLiveRecords(selectedEntity).length})`
                          : `Export Live Data (${getLiveRecords(selectedEntity).length})`}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('import')}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isAr ? 'استيراد هذا الجدول الآن' : 'Import to this table'}</span>
                    </button>
                  </div>
                </div>

                {/* Schema Columns Preview Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-600" />
                      {isAr
                        ? 'مخطط الأعمدة والسكيما المقبولة (تجنب التعارض في الداتابيز):'
                        : 'Database Schema Column Specifications:'}
                    </h4>
                    <span className="text-2xs text-slate-500">
                      {isAr
                        ? 'القالب المتولد يحتوي تلقائياً على كافة هذه الأعمدة مع التحقق الصارم'
                        : 'The generated template includes all these verified columns'}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-2xs uppercase tracking-wider">
                        <tr>
                          <th className="p-2.5 text-start">{isAr ? 'اسم العمود في الإكسيل' : 'Column Name'}</th>
                          <th className="p-2.5 text-start">{isAr ? 'كود الحقل (Field Key)' : 'Field Key'}</th>
                          <th className="p-2.5 text-start">{isAr ? 'النوع' : 'Data Type'}</th>
                          <th className="p-2.5 text-start">{isAr ? 'إلزامي؟' : 'Required?'}</th>
                          <th className="p-2.5 text-start">{isAr ? 'الشرح والمواصفات' : 'Description'}</th>
                          <th className="p-2.5 text-start">{isAr ? 'قيمة تجريبية' : 'Sample Value'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {currentDef.columns.map((col, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="p-2.5 font-bold text-slate-900">
                              {isAr ? col.labelAr : col.labelEn}
                            </td>
                            <td className="p-2.5 font-mono text-2xs text-blue-600">
                              {col.key}
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-2xs">
                                {col.type}
                              </span>
                            </td>
                            <td className="p-2.5">
                              {col.required ? (
                                <span className="inline-flex items-center gap-1 text-2xs font-bold text-rose-600">
                                  <AlertTriangle className="w-3 h-3" />
                                  {isAr ? 'إلزامي *' : 'Required *'}
                                </span>
                              ) : (
                                <span className="text-2xs text-slate-400">
                                  {isAr ? 'اختياري' : 'Optional'}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-2xs text-slate-500 max-w-xs">
                              {isAr ? col.descriptionAr : col.descriptionEn}
                              {col.enumValues && (
                                <div className="mt-1 text-2xs text-blue-600 font-mono">
                                  [{col.enumValues.join(', ')}]
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 text-2xs font-mono text-slate-600 bg-slate-50/50">
                              {String(col.sampleValue ?? '')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: UPLOAD, VALIDATE & COMMIT */
            <div className="space-y-6">
              {/* Target Entity Selector */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                    {renderEntityIcon(currentDef.iconName, 'w-5 h-5')}
                  </div>
                  <div>
                    <label className="text-2xs text-slate-500 block font-bold mb-0.5">
                      {isAr ? 'الجدول المستهدف للاستيراد:' : 'Target Database Entity:'}
                    </label>
                    <select
                      value={selectedEntity}
                      onChange={e => {
                        setSelectedEntity(e.target.value as EntityKey);
                        handleResetImport();
                      }}
                      className="text-xs sm:text-sm font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <optgroup label={isAr ? 'البيانات الأساسية' : 'Master Data'}>
                        {allEntityKeys
                          .filter(k => ENTITY_DEFINITIONS[k].category === 'master')
                          .map(k => (
                            <option key={k} value={k}>
                              {isAr ? ENTITY_DEFINITIONS[k].labelAr : ENTITY_DEFINITIONS[k].labelEn}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label={isAr ? 'العمليات المخزنية والإنتاج' : 'Operations & Movements'}>
                        {allEntityKeys
                          .filter(k => ENTITY_DEFINITIONS[k].category === 'operations')
                          .map(k => (
                            <option key={k} value={k}>
                              {isAr ? ENTITY_DEFINITIONS[k].labelAr : ENTITY_DEFINITIONS[k].labelEn}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Import Strategy / Mode */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 font-semibold">
                    {isAr ? 'سياسة المعالجة:' : 'Import Mode:'}
                  </span>
                  <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                    <button
                      onClick={() => setImportMode('upsert')}
                      className={`px-3 py-1.5 rounded-md font-bold transition ${
                        importMode === 'upsert'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isAr ? 'تحديث وإضافة (Upsert)' : 'Upsert (Add & Update)'}
                    </button>
                    <button
                      onClick={() => setImportMode('insert')}
                      className={`px-3 py-1.5 rounded-md font-bold transition ${
                        importMode === 'insert'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isAr ? 'إضافة الجديد فقط' : 'Insert New Only'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Success Notification after commit */}
              {commitSuccessStats && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 shadow-sm animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900">
                          {isAr ? 'تم استيراد وحفظ البيانات بنجاح في قاعدة البيانات!' : 'Data Successfully Imported!'}
                        </h4>
                        <p className="text-xs text-emerald-700">
                          {isAr
                            ? `تمت معالجة جدول (${commitSuccessStats.entityLabel}) بنجاح وتحديث كافة المؤشرات والمخزون.`
                            : `Successfully updated ${commitSuccessStats.entityLabel}.`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleResetImport}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                    >
                      {isAr ? 'استيراد ملف آخر' : 'Upload Another File'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
                      <span className="text-2xs text-slate-500 block">{isAr ? 'إجمالي السجلات' : 'Total Records'}</span>
                      <span className="text-lg font-black text-slate-900">{commitSuccessStats.total}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
                      <span className="text-2xs text-slate-500 block">{isAr ? 'سجلات جديدة أضيفت' : 'New Added'}</span>
                      <span className="text-lg font-black text-emerald-600">+{commitSuccessStats.added}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
                      <span className="text-2xs text-slate-500 block">{isAr ? 'سجلات تم تحديثها' : 'Updated'}</span>
                      <span className="text-lg font-black text-blue-600">{commitSuccessStats.updated}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Commit Error Alert */}
              {commitError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold">{isAr ? 'تعذر إتمام الاستيراد:' : 'Import Failed:'}</h5>
                    <p className="text-xs text-rose-700 mt-0.5">{commitError}</p>
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              {!validationResult && !commitSuccessStats && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition flex flex-col items-center justify-center gap-4 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                      : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5 max-w-md">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {isAr
                        ? 'اسحب وأفلت ملف Excel (.xlsx) أو CSV هنا'
                        : 'Drag & Drop your Excel (.xlsx) or CSV file here'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr
                        ? `سيتم التحقق آلياً من مطابقة أعمدة الملف مع جدول (${currentDef.labelAr}) ورصد أي أخطاء`
                        : `File columns will be automatically validated against ${currentDef.labelEn} schema.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isAr ? 'تصفح الملف من جهازك' : 'Browse Local File'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('xlsx', true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-2 transition"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'تحميل قالب هذا الجدول أولاً' : 'Download Template First'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-2xs text-slate-400 pt-2 border-t border-slate-100 w-full justify-center">
                    <span>{isAr ? 'الصيغ المدعومة: .xlsx, .xls, .csv' : 'Supported: .xlsx, .xls, .csv'}</span>
                    <span>•</span>
                    <span>{isAr ? 'دعم كامل للنصوص العربية (UTF-8)' : 'Full Arabic UTF-8 Support'}</span>
                  </div>
                </div>
              )}

              {/* Parsing Indicator */}
              {isParsing && (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    {isAr ? 'جاري قراءة الملف والتحقق من السكيما والبيانات...' : 'Validating data against schema...'}
                  </p>
                </div>
              )}

              {/* Validation Results & Preview Table */}
              {validationResult && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Validation Summary Bar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {validationResult.totalRows}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {uploadedFile?.name}
                          </h4>
                          <span className="text-2xs text-slate-500">
                            ({(uploadedFile ? uploadedFile.size / 1024 : 0).toFixed(1)} KB)
                          </span>
                        </div>
                        <p className="text-2xs text-slate-500">
                          {isAr
                            ? `الجدول: ${currentDef.labelAr} | إجمالي الصفوف: ${validationResult.totalRows}`
                            : `Table: ${currentDef.labelEn} | Rows: ${validationResult.totalRows}`}
                        </p>
                      </div>
                    </div>

                    {/* Metric Chips */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTableFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          tableFilter === 'ALL'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{isAr ? 'الكل' : 'All'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-2xs bg-white/20">
                          {validationResult.totalRows}
                        </span>
                      </button>

                      <button
                        onClick={() => setTableFilter('VALID')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          tableFilter === 'VALID'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'صالحة للاستيراد' : 'Valid'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-2xs bg-emerald-700/20">
                          {validationResult.validRows.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setTableFilter('ERRORS')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          tableFilter === 'ERRORS'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{isAr ? 'صفوف بها أخطاء' : 'Errors'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-2xs bg-rose-700/20">
                          {validationResult.errorRows.length}
                        </span>
                      </button>
                    </div>

                    {/* Commit & Reset buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResetImport}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1 border border-slate-200"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إلغاء' : 'Cancel'}</span>
                      </button>

                      {validationResult.validRows.length > 0 && (
                        <button
                          id="btn-confirm-import-data"
                          disabled={isCommitting || !isAdmin}
                          onClick={() => handleExecuteCommit(false)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          {isCommitting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>
                                {isAr
                                  ? `تأكيد استيراد (${validationResult.validRows.length}) سجل`
                                  : `Confirm Import (${validationResult.validRows.length})`}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Errors Summary Box if any exist */}
                  {validationResult.errors.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between text-rose-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          {isAr
                            ? `تم رصد ${validationResult.errors.length} خطأ في ${validationResult.errorRows.length} صف:`
                            : `${validationResult.errors.length} validation errors found:`}
                        </span>
                        <span className="text-2xs text-rose-600">
                          {isAr
                            ? 'يمكنك استيراد الصفوف الصالحة فقط وتخطي الأخطاء، أو تعديل الملف وإعادة رفعه'
                            : 'You can import valid rows and skip errors, or fix your spreadsheet'}
                        </span>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 pe-1">
                        {validationResult.errors.slice(0, 15).map((err, i) => (
                          <div
                            key={i}
                            className="bg-white/80 p-2 rounded border border-rose-200 flex items-center justify-between text-2xs"
                          >
                            <span className="font-semibold text-rose-950">
                              {isAr ? `صف ${err.row}: ` : `Row ${err.row}: `}
                              <span className="font-bold text-slate-800">[{err.fieldLabel}]</span> - {err.message}
                            </span>
                            <span className="text-slate-400 font-mono">
                              {String(err.value ?? isAr ? 'فارغ' : 'Empty')}
                            </span>
                          </div>
                        ))}
                        {validationResult.errors.length > 15 && (
                          <p className="text-2xs text-rose-600 italic">
                            {isAr
                              ? `... بالإضافة إلى ${validationResult.errors.length - 15} أخطاء أخرى.`
                              : `... and ${validationResult.errors.length - 15} more errors.`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview Table of Valid / Invalid Rows */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {isAr ? 'معاينة الصفوف قبل الحفظ النهائي:' : 'Data Rows Preview:'}
                      </span>
                      <span className="text-2xs text-slate-500">
                        {tableFilter === 'ALL'
                          ? isAr ? 'عرض كافة الصفوف' : 'Showing all rows'
                          : tableFilter === 'VALID'
                          ? isAr ? 'عرض الصفوف الصالحة فقط' : 'Showing valid rows only'
                          : isAr ? 'عرض الصفوف التي بها أخطاء فقط' : 'Showing errors only'}
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-start text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-2xs sticky top-0 z-10">
                          <tr>
                            <th className="p-2.5 text-center w-12">{isAr ? '#' : '#'}</th>
                            <th className="p-2.5 text-center w-24">{isAr ? 'الحالة' : 'Status'}</th>
                            {currentDef.columns.map((col, idx) => (
                              <th key={idx} className="p-2.5 text-start whitespace-nowrap">
                                {isAr ? col.labelAr : col.labelEn}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {/* Render Valid Rows */}
                          {(tableFilter === 'ALL' || tableFilter === 'VALID') &&
                            validationResult.validRows.map((row, idx) => (
                              <tr key={`valid-${idx}`} className="hover:bg-emerald-50/40 bg-white">
                                <td className="p-2.5 text-center font-mono text-2xs text-slate-400">
                                  {row._rowNumber}
                                </td>
                                <td className="p-2.5 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    {isAr ? 'صالح' : 'Valid'}
                                  </span>
                                </td>
                                {currentDef.columns.map((col, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="p-2.5 text-slate-700 whitespace-nowrap max-w-xs truncate"
                                  >
                                    {col.type === 'boolean'
                                      ? row[col.key]
                                        ? isAr ? 'نعم' : 'Yes'
                                        : isAr ? 'لا' : 'No'
                                      : String(row[col.key] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}

                          {/* Render Error Rows */}
                          {(tableFilter === 'ALL' || tableFilter === 'ERRORS') &&
                            validationResult.errorRows.map((errRow, idx) => {
                              const errorFields = new Set(errRow.errors.map(e => e.field));

                              return (
                                <tr key={`err-${idx}`} className="bg-rose-50/60 hover:bg-rose-50">
                                  <td className="p-2.5 text-center font-mono text-2xs font-bold text-rose-700">
                                    {errRow.rowNumber}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800">
                                      <XCircle className="w-3 h-3 text-rose-600" />
                                      {isAr ? 'خطأ' : 'Error'}
                                    </span>
                                  </td>
                                  {currentDef.columns.map((col, cIdx) => {
                                    const hasErr = errorFields.has(col.key);
                                    const fieldError = errRow.errors.find(e => e.field === col.key);

                                    return (
                                      <td
                                        key={cIdx}
                                        className={`p-2.5 whitespace-nowrap max-w-xs ${
                                          hasErr
                                            ? 'bg-rose-100/80 font-bold text-rose-900 ring-1 ring-rose-400'
                                            : 'text-slate-700'
                                        }`}
                                        title={fieldError?.message}
                                      >
                                        <div className="flex items-center gap-1">
                                          <span>{String(errRow.rowData[col.key] ?? '')}</span>
                                          {hasErr && (
                                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-2xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {isAr
                ? 'يتم فحص وتدقيق كل حقل بدقة مع منع تكرار الأكواد لضمان سلامة قاعدة البيانات وسجلات التكاليف.'
                : 'Schema validation prevents corrupt entries and duplicate keys across database tables.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
