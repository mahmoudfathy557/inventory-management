import {
  User,
  UserRole,
  Warehouse,
  WarehouseType,
  ProductionLocation,
  UOM,
  Currency,
  RawMaterial,
  Product,
  ItemType,
  Machine,
  Supplier,
  Customer,
  BOM,
  InventoryReceipt,
  LandedCost,
  InventoryTransfer,
  InventoryIssue,
  ProductionOrder,
  ProductionOrderStatus,
  QualityStatus,
  MaterialIssue,
  ProductionReceipt,
  CustomerDelivery,
  ProductionOrderCostAdjustment,
  CostCategory,
  CostAllocationMethod,
  InventoryLedgerEntry,
  TransactionType,
  AuditLogEntry,
  OdooConfig,
  OdooSyncLog,
  ItemCategory
} from '../types';

/**
 * 100% COVERAGE SEED DATA
 * Complete industrial dataset covering:
 * - 10 Users representing all 6 RBAC roles (Admin, Inventory, Production, QA/QC, Cost Finance, Executive Management)
 * - Multi-warehouse infrastructure (Raw Materials, WIP stages, Finished Goods, Scrap/Quarantine, Packaging)
 * - Diverse BOM formulas (HDPE Pipes, PVC Conduits, Pressure Fittings)
 * - Full lifecycle transactions (Receipts, Landed Costs, Stock Transfers, Internal Issues, Work Orders, QC Inspections, Customer Deliveries, Cost Adjustments)
 * - Comprehensive Double-entry Inventory Ledger & Audit Trails
 */

export const SEED_USERS: User[] = [
  // 1. System Administrators
  {
    id: 'user-admin-1',
    username: 'admin',
    fullName: 'أ. محمود فتحي (مدير النظام العام)',
    email: 'mahmoudfathy2424@gmail.com',
    role: UserRole.ADMIN,
    active: true,
  },
  {
    id: 'user-admin-2',
    username: 'it.admin',
    fullName: 'م. إبراهيم فؤاد (مسؤول الشبكات والربط)',
    email: 'it.admin@factory.com',
    role: UserRole.ADMIN,
    active: true,
  },

  // 2. Warehouse & Inventory Managers
  {
    id: 'user-inv-1',
    username: 'ahmed.kamal',
    fullName: 'م. أحمد كمال (مدير حركة المستودعات)',
    email: 'ahmed.inventory@factory.com',
    role: UserRole.INVENTORY_USER,
    active: true,
  },
  {
    id: 'user-inv-2',
    username: 'yasser.wh',
    fullName: 'أ. ياسر النجار (أمين مستودع المواد الخام)',
    email: 'yasser.wh@factory.com',
    role: UserRole.INVENTORY_USER,
    active: true,
  },

  // 3. Production Engineers & Planners
  {
    id: 'user-prod-1',
    username: 'tarek.radwan',
    fullName: 'م. طارق رضوان (رئيس مهندسي الإنتاج)',
    email: 'tarek.prod@factory.com',
    role: UserRole.PRODUCTION_USER,
    active: true,
  },
  {
    id: 'user-prod-2',
    username: 'hassan.ext',
    fullName: 'م. حسن البدري (مشرف وردية البثق)',
    email: 'hassan.ext@factory.com',
    role: UserRole.PRODUCTION_USER,
    active: true,
  },

  // 4. Quality Control & Assurance (QA/QC)
  {
    id: 'user-qa-1',
    username: 'samir.sherif',
    fullName: 'د. سمير شريف (مدير ضمان الجودة والمطابقة)',
    email: 'samir.quality@factory.com',
    role: UserRole.QUALITY_USER,
    active: true,
  },
  {
    id: 'user-qa-2',
    username: 'mona.qc',
    fullName: 'ك. منى عبد الرحمن (أخصائية الفحص المعملي)',
    email: 'mona.qc@factory.com',
    role: UserRole.QUALITY_USER,
    active: true,
  },

  // 5. Cost Accountants & Financial Controllers
  {
    id: 'user-fin-1',
    username: 'khaled.mansour',
    fullName: 'أ. خالد منصور (رئيس حسابات التكاليف)',
    email: 'khaled.finance@factory.com',
    role: UserRole.FINANCE_USER,
    active: true,
  },

  // 6. Executive Management & Strategic Oversight
  {
    id: 'user-mgmt-1',
    username: 'director.general',
    fullName: 'م. أسامة الشرقاوي (العضو المنتدب والمدير التنفيذي)',
    email: 'director@factory.com',
    role: UserRole.MANAGEMENT_USER,
    active: true,
  }
];

export const SEED_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-raw',
    code: 'WH-RAW-01',
    nameAr: 'مستودع المواد الخام الرئيسي',
    nameEn: 'Main Raw Materials Warehouse',
    type: WarehouseType.RAW_MATERIALS,
    active: true,
    notes: 'تخزين البوليمرات والماسترباتش والصبغات الكيميائية'
  },
  {
    id: 'wh-wip',
    code: 'WH-WIP-01',
    nameAr: 'مستودع الإنتاج والتشغيل (WIP)',
    nameEn: 'Production & WIP Floor',
    type: WarehouseType.WIP,
    active: true,
    notes: 'يشمل خطوط البثق وأحواض التبريد ومراحل التشكيل'
  },
  {
    id: 'wh-fg',
    code: 'WH-FG-01',
    nameAr: 'مستودع المنتجات التامة المعتمدة',
    nameEn: 'Approved Finished Goods Warehouse',
    type: WarehouseType.FINISHED_GOODS,
    active: true,
    notes: 'مستودع تسليمات العملاء وشبكات التوزيع'
  },
  {
    id: 'wh-scrap',
    code: 'WH-SCRAP-01',
    nameAr: 'مستودع الهالك وإعادة التدوير (Scrap)',
    nameEn: 'Scrap & Recycling Storage',
    type: WarehouseType.SCRAP,
    active: true,
    notes: 'عوادم البثق وعينات الاختبارات التالفة والزوائد'
  }
];

export const SEED_LOCATIONS: ProductionLocation[] = [
  {
    id: 'loc-stage-1',
    code: 'LOC-EXTRUSION',
    nameAr: 'موقع خط البثق 1 (Extrusion Line 1)',
    nameEn: 'Extrusion Line 1 Stage',
    warehouseId: 'wh-wip',
    stageName: 'Production Stage 1',
    active: true,
    notes: 'منطقة التغذية والصهر الحراري'
  },
  {
    id: 'loc-stage-2',
    code: 'LOC-CALIBRATION',
    nameAr: 'موقع التبريد والمعايرة (Cooling & Sizing)',
    nameEn: 'Cooling & Sizing Stage',
    warehouseId: 'wh-wip',
    stageName: 'Production Stage 2',
    active: true,
    notes: 'أحواض تفريغ الهواء والتبريد المائي'
  },
  {
    id: 'loc-stage-3',
    code: 'LOC-CUT-PACK',
    nameAr: 'موقع التقطيع والتغليف النهائي',
    nameEn: 'Cutting & Final Packaging',
    warehouseId: 'wh-wip',
    stageName: 'Production Stage 3',
    active: true,
    notes: 'ماكينات السحب والتقطيع التلقائي'
  }
];

export const SEED_UOMS: UOM[] = [
  { id: 'uom-kg', code: 'KG', nameAr: 'كيلوجرام', nameEn: 'Kilogram', conversionFactor: 1.0, active: true },
  { id: 'uom-ton', code: 'TON', nameAr: 'طن متري (1000 كجم)', nameEn: 'Metric Ton', baseUOM: 'KG', conversionFactor: 1000.0, active: true },
  { id: 'uom-mtr', code: 'MTR', nameAr: 'متر طولي', nameEn: 'Meter', conversionFactor: 1.0, active: true },
  { id: 'uom-pc', code: 'PC', nameAr: 'قطعة', nameEn: 'Piece', conversionFactor: 1.0, active: true },
  { id: 'uom-coil', code: 'COIL', nameAr: 'لفة 100 متر', nameEn: '100m Coil', baseUOM: 'MTR', conversionFactor: 100.0, active: true }
];

export const SEED_CURRENCIES: Currency[] = [
  { id: 'curr-egp', code: 'EGP', nameAr: 'جنيه مصري (العملة الأساسية)', nameEn: 'Egyptian Pound', exchangeRate: 1.0, rateDate: '2026-09-20', isBase: true, active: true },
  { id: 'curr-usd', code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', exchangeRate: 49.50, rateDate: '2026-09-20', isBase: false, active: true },
  { id: 'curr-eur', code: 'EUR', nameAr: 'يورو أوروبي', nameEn: 'Euro', exchangeRate: 54.20, rateDate: '2026-09-20', isBase: false, active: true },
  { id: 'curr-sar', code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', exchangeRate: 13.20, rateDate: '2026-09-20', isBase: false, active: true }
];

export const SEED_RAW_MATERIALS: RawMaterial[] = [
  {
    id: 'rm-poly-01',
    code: 'RM-HDPE-100',
    nameAr: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules PE100)',
    nameEn: 'High Density Polyethylene PE100',
    description: 'خام ألماني معتمد لصناعة شبكات المياه وضغط 16 بار',
    itemType: ItemType.RAW_MATERIAL,
    defaultUOM: 'KG',
    alternativeUOM: 'TON',
    conversionFactor: 1000,
    defaultWarehouseId: 'wh-raw',
    minStock: 500,
    maxStock: 25000,
    reorderLevel: 2000,
    active: true,
    currentQty: 4000,
    movingAverageCost: 110.0,
    totalValue: 440000.0,
    notes: 'المورد الرئيسي: سابك للبتروكيماويات'
  },
  {
    id: 'rm-color-red',
    code: 'RM-MB-RED',
    nameAr: 'ماسترباتش ملون أحمر صناعي (Red Masterbatch)',
    nameEn: 'Red Masterbatch Colorant',
    description: 'صبغة مقاومة لدرجات الحرارة العالية لخطوط التدفئة والحريق',
    itemType: ItemType.RAW_MATERIAL,
    defaultUOM: 'KG',
    alternativeUOM: 'KG',
    conversionFactor: 1,
    defaultWarehouseId: 'wh-raw',
    minStock: 50,
    maxStock: 2000,
    reorderLevel: 150,
    active: true,
    currentQty: 450,
    movingAverageCost: 185.0,
    totalValue: 83250.0
  },
  {
    id: 'rm-stab-uv',
    code: 'RM-UV-STAB',
    nameAr: 'مركب مثبت للأشعة فوق البنفسجية (UV Stabilizer)',
    nameEn: 'UV Stabilizer Compound',
    description: 'إضافة لمنع تآكل الأنابيب المعرضة للشمس المباشرة',
    itemType: ItemType.RAW_MATERIAL,
    defaultUOM: 'KG',
    alternativeUOM: 'KG',
    conversionFactor: 1,
    defaultWarehouseId: 'wh-raw',
    minStock: 25,
    maxStock: 1000,
    reorderLevel: 80,
    active: true,
    currentQty: 320,
    movingAverageCost: 240.0,
    totalValue: 76800.0
  },
  {
    id: 'rm-pvc-res',
    code: 'RM-PVC-K67',
    nameAr: 'بودرة راتينج بي في سي K67 (PVC Resin)',
    nameEn: 'Suspension PVC Resin K67',
    description: 'مادة خام لتصنيع مجاري وتوصيلات الكابلات الكهربائية',
    itemType: ItemType.RAW_MATERIAL,
    defaultUOM: 'KG',
    alternativeUOM: 'TON',
    conversionFactor: 1000,
    defaultWarehouseId: 'wh-raw',
    minStock: 1000,
    maxStock: 50000,
    reorderLevel: 5000,
    active: true,
    currentQty: 8500,
    movingAverageCost: 65.50,
    totalValue: 556750.0
  }
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'fp-788',
    code: 'FP-788',
    nameAr: 'PA-G0350 G (منتج تام ممتص)',
    nameEn: 'PA-G0350 G Finished Product',
    description: 'PA-G0350 G Finished Goods Product',
    productType: ItemType.FINISHED_PRODUCT,
    defaultUOM: 'KG',
    alternativeUOM: 'KG',
    defaultWarehouseId: 'wh-fg',
    active: true,
    currentQty: 4125,
    movingAverageCost: 50.6169,
    totalValue: 208794.713,
    notes: 'منتج تام تم تصنيعه أو شراؤه مباشرة'
  },
  {
    id: 'fp-pipe-50',
    code: 'FP-PIPE-50MM',
    nameAr: 'أنابيب بولي إيثيلين 50 مم ضغط 16 بار (HDPE Pipe 50mm PN16)',
    nameEn: 'HDPE Pressure Pipe 50mm PN16',
    description: 'منتج تام لشبكات مياه الشرب والري المضغوط',
    productType: ItemType.FINISHED_PRODUCT,
    defaultUOM: 'KG',
    alternativeUOM: 'MTR',
    defaultWarehouseId: 'wh-fg',
    active: true,
    currentQty: 1100,
    movingAverageCost: 122.222,
    totalValue: 134444.20,
    notes: 'مطابق للمواصفة القياسية المصرية ES 2074'
  },
  {
    id: 'fp-conduit-32',
    code: 'FP-COND-32MM',
    nameAr: 'مواسير حماية كابلات PVC قطر 32 مم',
    nameEn: 'PVC Electrical Conduit Pipe 32mm',
    description: 'أنابيب عازلة غير موصلة ومقاومة للهب لتمديدات المباني',
    productType: ItemType.FINISHED_PRODUCT,
    defaultUOM: 'KG',
    alternativeUOM: 'MTR',
    defaultWarehouseId: 'wh-fg',
    active: true,
    currentQty: 1800,
    movingAverageCost: 78.40,
    totalValue: 141120.0
  },
  {
    id: 'sf-extruded-coil',
    code: 'SF-COIL-BASE',
    nameAr: 'لفائف أولية نصف مصنعة (Extruded Base Coil)',
    nameEn: 'Extruded Base Pipe Coil',
    description: 'منتج نصف مصنع خارج من مرحلة البثق 1 وجاهز للتقطيع النهائي',
    productType: ItemType.SEMI_FINISHED,
    defaultUOM: 'KG',
    alternativeUOM: 'KG',
    defaultWarehouseId: 'wh-wip',
    active: true,
    currentQty: 350,
    movingAverageCost: 114.50,
    totalValue: 40075.0
  }
];

export const SEED_MACHINES: Machine[] = [
  {
    id: 'mach-ext-1',
    code: 'MCH-EXT-01',
    nameAr: 'خط البثق الألماني الرئيسي (KraussMaffei 90)',
    nameEn: 'Main Extrusion Line 1',
    description: 'خط تشكيل حراري عالي السرعة للأنابيب الصلبة',
    productionStage: 'Production Stage 1',
    defaultLocationId: 'loc-stage-1',
    active: true
  },
  {
    id: 'mach-cool-2',
    code: 'MCH-COOL-02',
    nameAr: 'وحدة التبريد الفراغي والمعايرة الهيدروليكية',
    nameEn: 'Vacuum Calibration & Cooling Tank',
    description: 'حوض التبريد وتثبيت القطر الخارجي للأنبوب',
    productionStage: 'Production Stage 2',
    defaultLocationId: 'loc-stage-2',
    active: true
  },
  {
    id: 'mach-pvc-3',
    code: 'MCH-PVC-03',
    nameAr: 'خط بثق الأنابيب الكهربائية (Battenfeld-Cincinnati)',
    nameEn: 'PVC Conduit Extruder Line 3',
    description: 'خط مخصص للأقطار من 16 إلى 63 مم',
    productionStage: 'Production Stage 1',
    defaultLocationId: 'loc-stage-1',
    active: true
  }
];

export const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-horizon',
    code: 'SUP-HORIZON',
    nameAr: 'Horizon Additives (إضافات الأفق)',
    nameEn: 'Horizon Additives',
    address: 'Free Zone, Alexandria',
    phone: '+20 3 4812345',
    email: 'info@horizon.com',
    taxNumber: '100-888-999',
    defaultCurrency: 'EGP',
    paymentTerms: 'COD',
    active: true
  },
  {
    id: 'sup-sabic',
    code: 'SUP-001',
    nameAr: 'شركة سابك للبتروكيماويات والبوليمرات',
    nameEn: 'SABIC Petrochemicals',
    address: 'الجبيل الصناعية / مكتب القاهرة - مصر',
    phone: '+20 2 23948000',
    email: 'sales.egypt@sabic.com',
    taxNumber: '100-245-891',
    defaultCurrency: 'EGP',
    paymentTerms: 'آجل 60 يوماً',
    active: true
  },
  {
    id: 'sup-polytech',
    code: 'SUP-002',
    nameAr: 'الشركة المصرية الألمانية للبتروكيماويات',
    nameEn: 'Egyptian German Polychem',
    address: 'المنطقة الصناعية الثالثة - السادس من أكتوبر',
    phone: '+20 2 38205000',
    email: 'info@egypoly.com',
    taxNumber: '100-891-234',
    defaultCurrency: 'USD',
    paymentTerms: 'اعتماد مستندي LC',
    active: true
  }
];

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-orascom',
    code: 'CUST-001',
    nameAr: 'شركة أوراسكوم للإنشاءات والصناعة',
    nameEn: 'Orascom Construction',
    address: 'كورنيش النيل، رملة بولاق، القاهرة',
    phone: '+20 2 24611111',
    email: 'procurement@orascom.com',
    taxNumber: '100-112-456',
    defaultCurrency: 'EGP',
    paymentTerms: 'آجل 45 يوماً',
    active: true,
    odooPartnerId: 1042
  },
  {
    id: 'cust-arabcont',
    code: 'CUST-002',
    nameAr: 'شركة المقاولون العرب (عثمان أحمد عثمان)',
    nameEn: 'The Arab Contractors',
    address: 'شارع عدلي كفافي، مصر الجديدة',
    phone: '+20 2 24183000',
    email: 'supply@arabcont.com',
    taxNumber: '100-334-900',
    defaultCurrency: 'EGP',
    paymentTerms: 'آجل 90 يوماً',
    active: true,
    odooPartnerId: 1048
  }
];

export const SEED_BOMS: BOM[] = [
  {
    id: 'bom-pipe-50-v1',
    code: 'BOM-PIPE-50-V1',
    productId: 'fp-pipe-50',
    productCode: 'FP-PIPE-50MM',
    productName: 'أنابيب بولي إيثيلين 50 مم ضغط 16 بار (HDPE Pipe 50mm)',
    nameAr: 'معادلة إنتاج أنابيب HDPE 50mm - مواصفة قياسية',
    nameEn: 'Standard HDPE Pipe 50mm Production Formula',
    version: '1.0',
    effectiveFrom: '2026-01-01',
    status: 'APPROVED',
    approvalStatus: 'APPROVED',
    approvedBy: 'م. طارق رضوان (رئيس مهندسي الإنتاج)',
    approvedDate: '2026-01-05',
    notes: 'النسبة المعيارية: 1000 كجم خام ينتج 900 كجم منتج تام + 100 كجم هالك طبيعي',
    lines: [
      {
        id: 'bl-1',
        rawMaterialId: 'rm-poly-01',
        rawMaterialCode: 'RM-HDPE-100',
        rawMaterialName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
        quantity: 1.1111,
        uom: 'KG',
        percentage: 95.0,
        sequence: 1,
        productionStage: 'Production Stage 1',
        mandatory: true
      },
      {
        id: 'bl-2',
        rawMaterialId: 'rm-color-red',
        rawMaterialCode: 'RM-MB-RED',
        rawMaterialName: 'ماسترباتش ملون أحمر صناعي (Red Masterbatch)',
        quantity: 0.03,
        uom: 'KG',
        percentage: 3.0,
        sequence: 2,
        productionStage: 'Production Stage 1',
        mandatory: true
      },
      {
        id: 'bl-3',
        rawMaterialId: 'rm-stab-uv',
        rawMaterialCode: 'RM-UV-STAB',
        rawMaterialName: 'مثبت أشعة فوق بنفسجية (UV Stabilizer Compound)',
        quantity: 0.02,
        uom: 'KG',
        percentage: 2.0,
        sequence: 3,
        productionStage: 'Production Stage 1',
        mandatory: true
      }
    ]
  },
  {
    id: 'bom-cond-32-v1',
    code: 'BOM-COND-32-V1',
    productId: 'fp-conduit-32',
    productCode: 'FP-COND-32MM',
    productName: 'مواسير حماية كابلات PVC قطر 32 مم',
    nameAr: 'معادلة تصنيع مواسير PVC عازلة 32 مم',
    nameEn: 'PVC Conduit 32mm Formulation',
    version: '1.0',
    effectiveFrom: '2026-02-01',
    status: 'APPROVED',
    approvalStatus: 'APPROVED',
    approvedBy: 'م. طارق رضوان',
    approvedDate: '2026-02-05',
    notes: 'نسبة الهالك الصناعي المعياري لا تتجاوز 4%',
    lines: [
      {
        id: 'bl-cond-1',
        rawMaterialId: 'rm-pvc-res',
        rawMaterialCode: 'RM-PVC-K67',
        rawMaterialName: 'بودرة راتينج بي في سي K67 (PVC Resin)',
        quantity: 1.04,
        uom: 'KG',
        percentage: 96.0,
        sequence: 1,
        productionStage: 'Production Stage 1',
        mandatory: true
      }
    ]
  }
];

export const SEED_RECEIPTS: InventoryReceipt[] = [
  {
    id: 'rec-2026-0020',
    receiptNumber: 'REC-2026-0020',
    date: '2026-08-15',
    supplierId: 'sup-horizon',
    supplierName: 'Horizon Additives',
    currency: 'EGP',
    exchangeRate: 1.0,
    itemId: 'fp-788',
    itemCode: 'FP-788',
    itemName: 'PA-G0350 G (منتج تام ممتص)',
    itemType: ItemType.FINISHED_PRODUCT,
    warehouseId: 'wh-fg',
    quantity: 4125,
    uom: 'KG',
    unitPrice: 50.6169,
    unitPriceEGP: 50.6169,
    totalValueEGP: 208794.713,
    landedCostAllocatedEGP: 0.0,
    status: 'POSTED',
    reference: 'شراء منتج تام REC-2026-0020',
    notes: 'استلام منتج تام مستورد ومصنف كمخزون معتمد',
    createdBy: 'م. أحمد كمال',
    createdDate: '2026-08-15 10:00',
    approvedBy: 'أ. خالد منصور',
    approvalDate: '2026-08-15 10:30'
  },
  {
    id: 'rec-001',
    receiptNumber: 'REC-2026-0001',
    date: '2026-09-18',
    supplierId: 'sup-sabic',
    supplierName: 'شركة سابك للبتروكيماويات والبوليمرات',
    currency: 'EGP',
    exchangeRate: 1.0,
    itemId: 'rm-poly-01',
    itemCode: 'RM-HDPE-100',
    itemName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
    itemType: ItemType.RAW_MATERIAL,
    warehouseId: 'wh-raw',
    quantity: 1000,
    uom: 'KG',
    unitPrice: 100.0,
    unitPriceEGP: 100.0,
    totalValueEGP: 100000.0,
    landedCostAllocatedEGP: 10000.0,
    status: 'POSTED',
    reference: 'فاتورة شراء PO-9921',
    notes: 'استلام الدفعة الأولى من المواد الخام (سعر الشراء 100 ج.م/كجم)',
    createdBy: 'م. أحمد كمال (أمين المستودع)',
    createdDate: '2026-09-18 09:30',
    approvedBy: 'أ. خالد منصور (محاسب التكاليف)',
    approvalDate: '2026-09-18 10:00'
  },
  {
    id: 'rec-002',
    receiptNumber: 'REC-2026-0002',
    date: '2026-09-19',
    supplierId: 'sup-polytech',
    supplierName: 'الشركة المصرية الألمانية للبتروكيماويات',
    currency: 'USD',
    exchangeRate: 49.50,
    itemId: 'rm-pvc-res',
    itemCode: 'RM-PVC-K67',
    itemName: 'بودرة راتينج بي في سي K67 (PVC Resin)',
    itemType: ItemType.RAW_MATERIAL,
    warehouseId: 'wh-raw',
    quantity: 5000,
    uom: 'KG',
    unitPrice: 1.25,
    unitPriceEGP: 61.875,
    totalValueEGP: 309375.0,
    landedCostAllocatedEGP: 18125.0,
    status: 'POSTED',
    reference: 'شحنة استيراد بالدولار LC-771',
    notes: 'تم تثبيت سعر الصرف 49.50 ج.م لكل دولار أمريكي مع الرسوم الجمركية',
    createdBy: 'أ. ياسر النجار',
    createdDate: '2026-09-19 11:00',
    approvedBy: 'أ. خالد منصور',
    approvalDate: '2026-09-19 12:00'
  }
];

export const SEED_LANDED_COSTS: LandedCost[] = [
  {
    id: 'lc-001',
    landedCostNumber: 'LC-2026-0001',
    date: '2026-09-18',
    originalReceiptId: 'rec-001',
    originalReceiptNumber: 'REC-2026-0001',
    itemId: 'rm-poly-01',
    itemName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
    costType: 'مصاريف تخليص جمركي ونقل مبرد (Customs & Freight)',
    amount: 10000.0,
    currency: 'EGP',
    exchangeRate: 1.0,
    amountEGP: 10000.0,
    allocationMethod: 'تخصيص مباشر على إذن الاستلام',
    notes: 'زيادة قيمة المخزون بمقدار 10,000 ج.م دون زيادة الكمية -> أصبح متوسط التكلفة 110 ج.م/كجم',
    createdBy: 'أ. خالد منصور (محاسب التكاليف)',
    createdDate: '2026-09-18 14:15',
    status: 'POSTED'
  }
];

export const SEED_TRANSFERS: InventoryTransfer[] = [
  {
    id: 'tr-001',
    transferNumber: 'TR-2026-0001',
    date: '2026-09-19',
    fromWarehouseId: 'wh-raw',
    toWarehouseId: 'wh-wip',
    toLocationId: 'loc-stage-1',
    itemId: 'rm-poly-01',
    itemCode: 'RM-HDPE-100',
    itemName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
    quantity: 1000,
    uom: 'KG',
    unitCostEGP: 110.0,
    totalValueEGP: 110000.0,
    reference: 'تحويل لخط الإنتاج أمر رقم PO-2026-001',
    notes: 'تحويل كامل الكمية 1000 كجم من مستودع الخام إلى الإنتاج تحت التشغيل',
    createdBy: 'م. أحمد كمال (أمين المستودع)',
    createdDate: '2026-09-19 08:30',
    status: 'POSTED'
  }
];

export const SEED_ISSUES: InventoryIssue[] = [
  {
    id: 'iss-001',
    issueNumber: 'ISS-2026-0001',
    date: '2026-09-19',
    fromWarehouseId: 'wh-raw',
    itemId: 'rm-color-red',
    itemCode: 'RM-MB-RED',
    itemName: 'ماسترباتش ملون أحمر صناعي (Red Masterbatch)',
    quantity: 25,
    uom: 'KG',
    movingAverageCostEGP: 185.0,
    totalIssueValueEGP: 4625.0,
    reason: 'صرف عينات اختبارات التحمل الحراري ومطابقة درجات اللون لمعمل الجودة',
    notes: 'صرف تجارب الفحص المعملي للمطابقة',
    status: 'POSTED',
    createdBy: 'د. سمير شريف (مدير الجودة)',
    createdDate: '2026-09-19 10:45'
  }
];

export const SEED_PRODUCTION_ORDERS: ProductionOrder[] = [
  {
    id: 'po-001',
    orderNumber: 'PO-2026-0001',
    productionDate: '2026-09-19',
    productId: 'fp-pipe-50',
    productCode: 'FP-PIPE-50MM',
    productName: 'أنابيب بولي إيثيلين 50 مم ضغط 16 بار (HDPE Pipe 50mm)',
    plannedQuantity: 900,
    actualFinishedQuantity: 900,
    actualScrapQuantity: 100,
    uom: 'KG',
    bomId: 'bom-pipe-50-v1',
    bomCode: 'BOM-PIPE-50-V1',
    bomVersion: '1.0',
    machineId: 'mach-ext-1',
    machineName: 'خط البثق الألماني الرئيسي (KraussMaffei 90)',
    productionStage: 'Production Stage 1',
    wipWarehouseId: 'wh-wip',
    wipLocationId: 'loc-stage-1',
    expectedFinishedQuantity: 900,
    expectedScrapQuantity: 100,
    status: ProductionOrderStatus.COMPLETED,
    version: 1,
    modifications: [],
    materials: [
      {
        id: 'mat-1',
        rawMaterialId: 'rm-poly-01',
        rawMaterialCode: 'RM-HDPE-100',
        rawMaterialName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
        uom: 'KG',
        plannedQty: 1000,
        availableQty: 1000,
        actualIssuedQty: 1000,
        movingAverageCostEGP: 110.0,
        actualCostEGP: 110000.0
      }
    ],
    actualMaterialCostEGP: 110000.0,
    additionalCostEGP: 0,
    totalProductionCostEGP: 110000.0,
    finishedGoodsUnitCostEGP: 122.222,
    scrapValueEGP: 0.0,
    receiptNumber: 'PR-2026-0001',
    qualityStatus: QualityStatus.APPROVED,
    qualityNotes: 'تم فحص مقاومة الضغط والأبعاد القياسية، مطابقة بنسبة 100%',
    qualityApprovedBy: 'د. سمير شريف (مدير ضمان الجودة)',
    qualityApprovalDate: '2026-09-19 16:30',
    finishedGoodsWarehouseId: 'wh-fg',
    notes: 'أمر إنتاج تجريبي مكتمل بالكامل وفق النموذج المعياري',
    createdBy: 'م. طارق رضوان (رئيس مهندسي الإنتاج)',
    createdDate: '2026-09-19 09:00',
    approvedBy: 'م. طارق رضوان',
    approvalDate: '2026-09-19 09:30'
  },
  {
    id: 'po-002',
    orderNumber: 'PO-2026-0002',
    productionDate: '2026-09-20',
    productId: 'fp-conduit-32',
    productCode: 'FP-COND-32MM',
    productName: 'مواسير حماية كابلات PVC قطر 32 مم',
    plannedQuantity: 1200,
    actualFinishedQuantity: 1200,
    actualScrapQuantity: 48,
    uom: 'KG',
    bomId: 'bom-cond-32-v1',
    bomCode: 'BOM-COND-32-V1',
    bomVersion: '1.0',
    machineId: 'mach-pvc-3',
    machineName: 'خط بثق الأنابيب الكهربائية (Battenfeld-Cincinnati)',
    productionStage: 'Production Stage 1',
    wipWarehouseId: 'wh-wip',
    wipLocationId: 'loc-stage-1',
    expectedFinishedQuantity: 1200,
    expectedScrapQuantity: 48,
    status: ProductionOrderStatus.COMPLETED,
    version: 1,
    modifications: [],
    materials: [
      {
        id: 'mat-pvc-1',
        rawMaterialId: 'rm-pvc-res',
        rawMaterialCode: 'RM-PVC-K67',
        rawMaterialName: 'بودرة راتينج بي في سي K67 (PVC Resin)',
        uom: 'KG',
        plannedQty: 1248,
        availableQty: 1248,
        actualIssuedQty: 1248,
        movingAverageCostEGP: 65.50,
        actualCostEGP: 81744.0
      }
    ],
    actualMaterialCostEGP: 81744.0,
    additionalCostEGP: 12336.0,
    totalProductionCostEGP: 94080.0,
    finishedGoodsUnitCostEGP: 78.40,
    scrapValueEGP: 0.0,
    receiptNumber: 'PR-2026-0002',
    qualityStatus: QualityStatus.APPROVED,
    qualityNotes: 'اختبارات العزل الكهربائي ومقاومة الصدمات ممتازة',
    qualityApprovedBy: 'ك. منى عبد الرحمن (أخصائية الفحص المعملي)',
    qualityApprovalDate: '2026-09-20 12:45',
    finishedGoodsWarehouseId: 'wh-fg',
    notes: 'أمر إنتاج عازل الكابلات مع تكاليف تشغيل كهرباء 12,336 ج.م',
    createdBy: 'م. حسن البدري',
    createdDate: '2026-09-20 08:00',
    approvedBy: 'م. طارق رضوان',
    approvalDate: '2026-09-20 08:30'
  }
];

export const SEED_MATERIAL_ISSUES: MaterialIssue[] = [
  {
    id: 'mi-001',
    issueNumber: 'MI-2026-0001',
    productionOrderId: 'po-001',
    productionOrderNumber: 'PO-2026-0001',
    date: '2026-09-19',
    rawMaterialId: 'rm-poly-01',
    rawMaterialCode: 'RM-HDPE-100',
    rawMaterialName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
    plannedQuantity: 1000,
    actualQuantity: 1000,
    uom: 'KG',
    movingAverageCostEGP: 110.0,
    totalActualCostEGP: 110000.0,
    warehouseId: 'wh-wip',
    machineName: 'خط البثق الألماني الرئيسي (KraussMaffei 90)',
    productionStage: 'Production Stage 1',
    createdBy: 'م. طارق رضوان',
    status: 'POSTED'
  },
  {
    id: 'mi-002',
    issueNumber: 'MI-2026-0002',
    productionOrderId: 'po-002',
    productionOrderNumber: 'PO-2026-0002',
    date: '2026-09-20',
    rawMaterialId: 'rm-pvc-res',
    rawMaterialCode: 'RM-PVC-K67',
    rawMaterialName: 'بودرة راتينج بي في سي K67 (PVC Resin)',
    plannedQuantity: 1248,
    actualQuantity: 1248,
    uom: 'KG',
    movingAverageCostEGP: 65.50,
    totalActualCostEGP: 81744.0,
    warehouseId: 'wh-wip',
    machineName: 'خط بثق الأنابيب الكهربائية (Battenfeld-Cincinnati)',
    productionStage: 'Production Stage 1',
    createdBy: 'م. حسن البدري',
    status: 'POSTED'
  }
];

export const SEED_PRODUCTION_RECEIPTS: ProductionReceipt[] = [
  {
    id: 'pr-001',
    receiptNumber: 'PR-2026-0001',
    productionOrderId: 'po-001',
    productionOrderNumber: 'PO-2026-0001',
    date: '2026-09-19',
    productId: 'fp-pipe-50',
    productCode: 'FP-PIPE-50MM',
    productName: 'أنابيب بولي إيثيلين 50 مم ضغط 16 بار (HDPE Pipe 50mm)',
    finishedQuantity: 900,
    scrapQuantity: 100,
    uom: 'KG',
    finishedGoodsWarehouseId: 'wh-fg',
    scrapWarehouseId: 'wh-scrap',
    totalMaterialCostEGP: 110000.0,
    finishedGoodsUnitCostEGP: 122.222,
    scrapUnitCostEGP: 0.0,
    qualityStatus: QualityStatus.APPROVED,
    qualityApprovedBy: 'د. سمير شريف',
    qualityApprovalDate: '2026-09-19 16:30',
    qualityDecisionReason: 'تم اجتياز جميع اختبارات الشد الهيدروليكي وسماكة الجدار وفق المواصفات القياسية',
    notes: 'استيعاب المنتج التام لكامل تكلفة الخامات (110,000 ج.م / 900 كجم = 122.222 ج.م/كجم).',
    createdBy: 'م. طارق رضوان',
    status: 'POSTED'
  },
  {
    id: 'pr-002',
    receiptNumber: 'PR-2026-0002',
    productionOrderId: 'po-002',
    productionOrderNumber: 'PO-2026-0002',
    date: '2026-09-20',
    productId: 'fp-conduit-32',
    productCode: 'FP-COND-32MM',
    productName: 'مواسير حماية كابلات PVC قطر 32 مم',
    finishedQuantity: 1200,
    scrapQuantity: 48,
    uom: 'KG',
    finishedGoodsWarehouseId: 'wh-fg',
    scrapWarehouseId: 'wh-scrap',
    totalMaterialCostEGP: 81744.0,
    finishedGoodsUnitCostEGP: 78.40,
    scrapUnitCostEGP: 0.0,
    qualityStatus: QualityStatus.APPROVED,
    qualityApprovedBy: 'ك. منى عبد الرحمن',
    qualityApprovalDate: '2026-09-20 12:45',
    qualityDecisionReason: 'مطابقة للسلامة الكهربائية ES 61386',
    notes: 'تكلفة الوحدة 78.40 ج.م شاملة تكلفة الكهرباء الإضافية',
    createdBy: 'م. حسن البدري',
    status: 'POSTED'
  }
];

export const SEED_CUSTOMER_DELIVERIES: CustomerDelivery[] = [
  {
    id: 'del-001',
    deliveryNumber: 'DEL-2026-0001',
    date: '2026-09-20',
    customerId: 'cust-orascom',
    customerName: 'شركة أوراسكوم للإنشاءات والصناعة',
    warehouseId: 'wh-fg',
    productId: 'fp-pipe-50',
    productCode: 'FP-PIPE-50MM',
    productName: 'أنابيب بولي إيثيلين 50 مم ضغط 16 بار (HDPE Pipe 50mm)',
    quantity: 400,
    uom: 'KG',
    movingAverageCostEGP: 122.222,
    totalDeliveryValueEGP: 48888.80,
    sellingPriceEGP: 185.00,
    reference: 'أمر توريد عميل SO-8812',
    notes: 'صرف دفعة للمشروع بالعاصمة الإدارية بمتوسط التكلفة 122.222 ج.م/كجم',
    createdBy: 'م. أحمد كمال (أمين المستودع)',
    createdDate: '2026-09-20 10:15',
    status: 'POSTED',
    odooSynced: true
  },
  {
    id: 'del-002',
    deliveryNumber: 'DEL-2026-0002',
    date: '2026-09-20',
    customerId: 'cust-arabcont',
    customerName: 'شركة المقاولون العرب (عثمان أحمد عثمان)',
    warehouseId: 'wh-fg',
    productId: 'fp-conduit-32',
    productCode: 'FP-COND-32MM',
    productName: 'مواسير حماية كابلات PVC قطر 32 مم',
    quantity: 600,
    uom: 'KG',
    movingAverageCostEGP: 78.40,
    totalDeliveryValueEGP: 47040.00,
    sellingPriceEGP: 120.00,
    reference: 'أمر توريد مشروع المونوريل SO-9014',
    notes: 'تسليم الموقع الهندسي 1 بقطاع المونوريل غرب القاهرة',
    createdBy: 'م. أحمد كمال',
    createdDate: '2026-09-20 14:00',
    status: 'POSTED',
    odooSynced: true
  }
];

export const SEED_COST_ADJUSTMENTS: ProductionOrderCostAdjustment[] = [
  {
    id: 'adj-001',
    adjustmentNumber: 'ADJ-2026-0001',
    productionOrderId: 'po-001',
    productionOrderNumber: 'PO-2026-0001',
    date: '2026-09-20',
    costCategory: CostCategory.ENERGY_COST,
    costType: 'فاتورة استهلاك كهرباء إضافية لخط البثق 1',
    amount: 9000.0,
    currency: 'EGP',
    exchangeRate: 1.0,
    amountEGP: 9000.0,
    allocationMethod: CostAllocationMethod.PER_QUANTITY,
    description: 'توزيع التكلفة اللاحقة تناسبياً بين مخزون البضاعة التامة وتكلفة البضاعة المباعة COGS',
    status: 'POSTED',
    originalProductionCostEGP: 110000.0,
    revisedProductionCostEGP: 119000.0,
    quantityProduced: 900,
    quantityInStock: 500,
    quantityIssuedOrSold: 400,
    inventoryAdjustmentEGP: 5000.0,
    cogsAdjustmentEGP: 4000.0,
    createdBy: 'أ. خالد منصور (رئيس حسابات التكاليف)',
    approvedBy: 'أ. خالد منصور',
    approvalDate: '2026-09-20 11:30'
  }
];

export const SEED_LEDGER_ENTRIES: InventoryLedgerEntry[] = [
  {
    id: 'ledg-0020',
    date: '2026-08-15 10:00',
    itemId: 'fp-788',
    itemCode: 'FP-788',
    itemName: 'PA-G0350 G (منتج تام ممتص)',
    itemType: ItemType.FINISHED_PRODUCT,
    warehouseId: 'wh-fg',
    warehouseName: 'مستودع المنتجات التامة المعتمدة',
    transactionType: TransactionType.PURCHASE_RECEIPT,
    documentNumber: 'REC-2026-0020',
    reference: 'Horizon Additives',
    qtyIn: 4125,
    qtyOut: 0,
    balanceQty: 4125,
    unitCostEGP: 50.6169,
    transactionValueEGP: 208794.713,
    runningInventoryValueEGP: 208794.713,
    movingAverageCostEGP: 50.6169,
    createdBy: 'م. أحمد كمال',
    notes: 'شراء منتج تام REC-2026-0020'
  },
  {
    id: 'ledg-001',
    date: '2026-09-18 09:30',
    itemId: 'rm-poly-01',
    itemCode: 'RM-HDPE-100',
    itemName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
    itemType: ItemType.RAW_MATERIAL,
    warehouseId: 'wh-raw',
    warehouseName: 'مستودع المواد الخام الرئيسي',
    transactionType: TransactionType.PURCHASE_RECEIPT,
    documentNumber: 'REC-2026-0001',
    reference: 'PO-9921',
    qtyIn: 1000,
    qtyOut: 0,
    balanceQty: 1000,
    unitCostEGP: 100.0,
    transactionValueEGP: 100000.0,
    runningInventoryValueEGP: 100000.0,
    movingAverageCostEGP: 100.0,
    createdBy: 'م. أحمد كمال',
    notes: 'استلام شراء المواد الخام الأولية'
  },
  {
    id: 'ledg-002',
    date: '2026-09-18 14:15',
    itemId: 'rm-poly-01',
    itemCode: 'RM-HDPE-100',
    itemName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
    itemType: ItemType.RAW_MATERIAL,
    warehouseId: 'wh-raw',
    warehouseName: 'مستودع المواد الخام الرئيسي',
    transactionType: TransactionType.LANDED_COST,
    documentNumber: 'LC-2026-0001',
    reference: 'REC-2026-0001',
    qtyIn: 0,
    qtyOut: 0,
    balanceQty: 1000,
    unitCostEGP: 0,
    transactionValueEGP: 10000.0,
    runningInventoryValueEGP: 110000.0,
    movingAverageCostEGP: 110.0,
    createdBy: 'أ. خالد منصور',
    notes: 'تخصيص تكاليف إضافية (جمارك وشحن) -> رفع متوسط التكلفة إلى 110 ج.م/كجم'
  },
  {
    id: 'ledg-003',
    date: '2026-09-19 08:30',
    itemId: 'rm-poly-01',
    itemCode: 'RM-HDPE-100',
    itemName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
    itemType: ItemType.RAW_MATERIAL,
    warehouseId: 'wh-raw',
    warehouseName: 'مستودع المواد الخام الرئيسي',
    transactionType: TransactionType.TRANSFER_OUT,
    documentNumber: 'TR-2026-0001',
    reference: 'PO-2026-0001',
    qtyIn: 0,
    qtyOut: 1000,
    balanceQty: 0,
    unitCostEGP: 110.0,
    transactionValueEGP: 110000.0,
    runningInventoryValueEGP: 0.0,
    movingAverageCostEGP: 110.0,
    createdBy: 'م. أحمد كمال',
    notes: 'تحويل صادر إلى مستودع التشغيل والإنتاج تحت التشغيل (WIP)'
  },
  {
    id: 'ledg-004',
    date: '2026-09-19 08:30',
    itemId: 'rm-poly-01',
    itemCode: 'RM-HDPE-100',
    itemName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
    itemType: ItemType.RAW_MATERIAL,
    warehouseId: 'wh-wip',
    warehouseName: 'مستودع الإنتاج والتشغيل (WIP)',
    transactionType: TransactionType.TRANSFER_IN,
    documentNumber: 'TR-2026-0001',
    reference: 'PO-2026-0001',
    qtyIn: 1000,
    qtyOut: 0,
    balanceQty: 1000,
    unitCostEGP: 110.0,
    transactionValueEGP: 110000.0,
    runningInventoryValueEGP: 110000.0,
    movingAverageCostEGP: 110.0,
    createdBy: 'م. أحمد كمال',
    notes: 'تحويل وارد إلى مستودع التشغيل والإنتاج تحت التشغيل (WIP)'
  },
  {
    id: 'ledg-005',
    date: '2026-09-19 09:30',
    itemId: 'rm-poly-01',
    itemCode: 'RM-HDPE-100',
    itemName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
    itemType: ItemType.RAW_MATERIAL,
    warehouseId: 'wh-wip',
    warehouseName: 'مستودع الإنتاج والتشغيل (WIP)',
    transactionType: TransactionType.MATERIAL_ISSUE_PRODUCTION,
    documentNumber: 'MI-2026-0001',
    reference: 'PO-2026-0001',
    qtyIn: 0,
    qtyOut: 1000,
    balanceQty: 0,
    unitCostEGP: 110.0,
    transactionValueEGP: 110000.0,
    runningInventoryValueEGP: 0.0,
    movingAverageCostEGP: 110.0,
    createdBy: 'م. طارق رضوان',
    notes: 'صرف مواد خام إلى خط البثق 1 لأمر الإنتاج PO-2026-0001'
  },
  {
    id: 'ledg-006',
    date: '2026-09-19 16:30',
    itemId: 'fp-pipe-50',
    itemCode: 'FP-PIPE-50MM',
    itemName: 'أنابيب بولي إيثيلين 50 مم ضغط 16 بار (HDPE Pipe 50mm)',
    itemType: ItemType.FINISHED_PRODUCT,
    warehouseId: 'wh-fg',
    warehouseName: 'مستودع المنتجات التامة',
    transactionType: TransactionType.FINISHED_GOODS_RECEIPT,
    documentNumber: 'PR-2026-0001',
    reference: 'PO-2026-0001',
    qtyIn: 900,
    qtyOut: 0,
    balanceQty: 900,
    unitCostEGP: 122.222,
    transactionValueEGP: 110000.0,
    runningInventoryValueEGP: 110000.0,
    movingAverageCostEGP: 122.222,
    createdBy: 'م. طارق رضوان',
    notes: 'استلام منتج تام معتمد من الجودة (امتصاص كامل تكلفة الخامات 110,000 ج.م على 900 كجم)'
  },
  {
    id: 'ledg-007',
    date: '2026-09-20 10:15',
    itemId: 'fp-pipe-50',
    itemCode: 'FP-PIPE-50MM',
    itemName: 'أنابيب بولي إيثيلين 50 مم ضغط 16 بار (HDPE Pipe 50mm)',
    itemType: ItemType.FINISHED_PRODUCT,
    warehouseId: 'wh-fg',
    warehouseName: 'مستودع المنتجات التامة',
    transactionType: TransactionType.CUSTOMER_DELIVERY,
    documentNumber: 'DEL-2026-0001',
    reference: 'SO-8812 (أوراسكوم)',
    qtyIn: 0,
    qtyOut: 400,
    balanceQty: 500,
    unitCostEGP: 122.222,
    transactionValueEGP: 48888.80,
    runningInventoryValueEGP: 61111.20,
    movingAverageCostEGP: 122.222,
    createdBy: 'م. أحمد كمال',
    notes: 'تسليم بضاعة مباعة للعميل بمتوسط التكلفة 122.222 ج.م/كجم'
  },
  {
    id: 'ledg-008',
    date: '2026-09-20 11:30',
    itemId: 'fp-pipe-50',
    itemCode: 'FP-PIPE-50MM',
    itemName: 'أنابيب بولي إيثيلين 50 مم ضغط 16 بار (HDPE Pipe 50mm)',
    itemType: ItemType.FINISHED_PRODUCT,
    warehouseId: 'wh-fg',
    warehouseName: 'مستودع المنتجات التامة',
    transactionType: TransactionType.COST_ADJUSTMENT,
    documentNumber: 'ADJ-2026-0001',
    reference: 'PO-2026-0001',
    qtyIn: 0,
    qtyOut: 0,
    balanceQty: 500,
    unitCostEGP: 10.0,
    transactionValueEGP: 5000.0,
    runningInventoryValueEGP: 66111.20,
    movingAverageCostEGP: 132.222,
    createdBy: 'أ. خالد منصور',
    notes: 'تعديل تكلفة لاحقة (فاتورة كهرباء) تخصيص نصيب المخزون المتبقي (500 كجم × 10 ج.م = 5,000 ج.م)'
  }
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-seed-01',
    date: '2026-09-18',
    time: '09:30:15',
    userName: 'م. أحمد كمال',
    action: 'POST_RECEIPT',
    documentType: 'إذن استلام مخزني',
    documentNumber: 'REC-2026-0001',
    oldValue: 'DRAFT',
    newValue: 'POSTED',
    details: 'تم استلام 1,000 كجم خام HDPE بقيمة 100,000 ج.م من شركة سابك'
  },
  {
    id: 'aud-seed-02',
    date: '2026-09-18',
    time: '14:15:20',
    userName: 'أ. خالد منصور (محاسب التكاليف)',
    action: 'POST_LANDED_COST',
    documentType: 'تكاليف إضافية',
    documentNumber: 'LC-2026-0001',
    oldValue: 'Unit Cost: 100.00 EGP',
    newValue: 'Unit Cost: 110.00 EGP',
    details: 'إضافة 10,000 ج.م جمارك وشحن على إذن الاستلام REC-2026-0001 مع إعادة احتساب متوسط التكلفة'
  },
  {
    id: 'aud-seed-03',
    date: '2026-09-19',
    time: '16:30:00',
    userName: 'د. سمير شريف (مدير الجودة)',
    action: 'APPROVE_QUALITY',
    documentType: 'فحص جودة أمر إنتاج',
    documentNumber: 'PO-2026-0001',
    oldValue: 'PENDING',
    newValue: 'APPROVED',
    details: 'اعتماد مطابقة مواصفات الأنابيب بولي إيثيلين 50 مم مع الإفراج المخزني'
  },
  {
    id: 'aud-seed-04',
    date: '2026-09-20',
    time: '10:15:33',
    userName: 'م. أحمد كمال',
    action: 'POST_DELIVERY',
    documentType: 'إذن تسليم عميل',
    documentNumber: 'DEL-2026-0001',
    oldValue: 'DRAFT',
    newValue: 'POSTED',
    details: 'صرف 400 كجم منتج تام لشركة أوراسكوم للإنشاءات بقيمة 48,888.80 ج.م'
  },
  {
    id: 'aud-seed-05',
    date: '2026-09-20',
    time: '11:30:10',
    userName: 'أ. خالد منصور',
    action: 'POST_COST_ADJUSTMENT',
    documentType: 'تسوية تكاليف تصنيع',
    documentNumber: 'ADJ-2026-0001',
    oldValue: '110,000 EGP',
    newValue: '119,000 EGP',
    details: 'تحميل 9,000 ج.م كهرباء وتوزيعها بين المخزون الحاضر (5,000 ج.م) وتكلفة المبيعات (4,000 ج.م)'
  }
];

// Seed Item Categories (Clean slate / empty by default per user request)
export const SEED_ITEM_CATEGORIES: ItemCategory[] = [];
