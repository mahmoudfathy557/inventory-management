import {
  Warehouse,
  WarehouseType,
  ProductionLocation,
  UOM,
  Currency,
  CurrencyRate,
  RawMaterial,
  Product,
  ItemType,
  Machine,
  Supplier,
  Customer,
  BOM,
  User,
  UserRole,
  InventoryReceipt,
  LandedCost,
  InventoryTransfer,
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

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-raw',
    code: 'WH-RAW-01',
    nameAr: 'مستودع المواد الخام الرئيسي',
    nameEn: 'Main Raw Materials Warehouse',
    type: WarehouseType.RAW_MATERIALS,
    active: true,
    notes: 'مستودع تخزين المواد الكيماوية والبوليمرات الخام'
  },
  {
    id: 'wh-wip',
    code: 'WH-WIP-01',
    nameAr: 'مستودع الإنتاج والتشغيل (WIP)',
    nameEn: 'Production & WIP Warehouse',
    type: WarehouseType.WIP,
    active: true,
    notes: 'يشمل مساحات خطوط البثق ومراحل الإنتاج المتتابعة'
  },
  {
    id: 'wh-fg',
    code: 'WH-FG-01',
    nameAr: 'مستودع المنتجات التامة',
    nameEn: 'Finished Goods Warehouse',
    type: WarehouseType.FINISHED_GOODS,
    active: true,
    notes: 'مستودع استلام وفحص وتخزين المنتجات النهائية الجاهزة للتسليم'
  },
  {
    id: 'wh-scrap',
    code: 'WH-SCRAP-01',
    nameAr: 'مستودع الهالك والسكراب',
    nameEn: 'Scrap & Waste Warehouse',
    type: WarehouseType.SCRAP,
    active: true,
    notes: 'مستودع تخزين الهالك وعوادم التصنيع (تقييم 0 ج.م في المرحلة الحالية)'
  }
];

export const INITIAL_LOCATIONS: ProductionLocation[] = [
  {
    id: 'loc-stage-1',
    code: 'LOC-STG-1',
    nameAr: 'مرحلة الإنتاج الأولى (خلط وتغذية البثق)',
    nameEn: 'Production Stage 1 (Mixing & Extrusion Feed)',
    warehouseId: 'wh-wip',
    stageName: 'مرحلة 1',
    active: true
  },
  {
    id: 'loc-stage-2',
    code: 'LOC-STG-2',
    nameAr: 'مرحلة الإنتاج الثانية (التبريد والتشكيل والمعايرة)',
    nameEn: 'Production Stage 2 (Cooling & Sizing)',
    warehouseId: 'wh-wip',
    stageName: 'مرحلة 2',
    active: true
  },
  {
    id: 'loc-mach-area',
    code: 'LOC-MCH-01',
    nameAr: 'منطقة الماكينات الرئيسية',
    nameEn: 'Main Machine Area',
    warehouseId: 'wh-wip',
    stageName: 'منطقة الماكينات',
    active: true
  },
  {
    id: 'loc-semi',
    code: 'LOC-SEMI-01',
    nameAr: 'منطقة تخزين النصف مصنع',
    nameEn: 'Semi-Finished Buffer Area',
    warehouseId: 'wh-wip',
    stageName: 'نصف مصنع',
    active: true
  }
];

export const INITIAL_UOMS: UOM[] = [
  // أوزان (Weights): KG (Primary), TON, GM
  { id: 'uom-kg', code: 'KG', nameAr: 'كيلوجرام', nameEn: 'Kilogram', uomType: 'PRIMARY', conversionFactor: 1, active: true },
  { id: 'uom-ton', code: 'TON', nameAr: 'طن متري', nameEn: 'Metric Ton', uomType: 'SECONDARY', baseUOM: 'KG', conversionFactor: 1000, active: true },
  { id: 'uom-gm', code: 'GM', nameAr: 'جرام', nameEn: 'Gram', uomType: 'SECONDARY', baseUOM: 'KG', conversionFactor: 0.001, active: true },

  // أطوال (Lengths): MTR (Primary), ROLL, CM
  { id: 'uom-mtr', code: 'MTR', nameAr: 'متر طولي', nameEn: 'Linear Meter', uomType: 'PRIMARY', conversionFactor: 1, active: true },
  { id: 'uom-roll', code: 'ROLL', nameAr: 'رول / لفة (50 متر)', nameEn: 'Roll (50m)', uomType: 'SECONDARY', baseUOM: 'MTR', conversionFactor: 50, active: true },
  { id: 'uom-cm', code: 'CM', nameAr: 'سنتيمتر', nameEn: 'Centimeter', uomType: 'SECONDARY', baseUOM: 'MTR', conversionFactor: 0.01, active: true },

  // قطع وعددي (Discrete): PCS (Primary), DOZEN, BOX
  { id: 'uom-pcs', code: 'PCS', nameAr: 'قطعة / حبة', nameEn: 'Pieces', uomType: 'PRIMARY', conversionFactor: 1, active: true },
  { id: 'uom-box', code: 'BOX', nameAr: 'كرتونة (24 قطعة)', nameEn: 'Box (24 Pcs)', uomType: 'SECONDARY', baseUOM: 'PCS', conversionFactor: 24, active: true },
  { id: 'uom-doz', code: 'DOZ', nameAr: 'دستة (12 قطعة)', nameEn: 'Dozen (12 Pcs)', uomType: 'SECONDARY', baseUOM: 'PCS', conversionFactor: 12, active: true },

  // حجوم وسوائل (Liquids/Volume): LTR (Primary), BARREL
  { id: 'uom-ltr', code: 'LTR', nameAr: 'لتر', nameEn: 'Liter', uomType: 'PRIMARY', conversionFactor: 1, active: true },
  { id: 'uom-bbl', code: 'BBL', nameAr: 'برميل (200 لتر)', nameEn: 'Barrel (200L)', uomType: 'SECONDARY', baseUOM: 'LTR', conversionFactor: 200, active: true }
];

export const INITIAL_CURRENCIES: Currency[] = [
  { id: 'curr-egp', code: 'EGP', nameAr: 'جنيه مصري (العملة الأساسية)', nameEn: 'Egyptian Pound', exchangeRate: 1.0, rateDate: '2026-09-22', isBase: true, active: true },
  { id: 'curr-usd', code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', exchangeRate: 49.50, rateDate: '2026-09-22', isBase: false, active: true },
  { id: 'curr-eur', code: 'EUR', nameAr: 'يورو أوروبي', nameEn: 'Euro', exchangeRate: 54.20, rateDate: '2026-09-22', isBase: false, active: true },
  { id: 'curr-sar', code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', exchangeRate: 13.20, rateDate: '2026-09-22', isBase: false, active: true },
  { id: 'curr-gbp', code: 'GBP', nameAr: 'جنيه إسترليني', nameEn: 'British Pound', exchangeRate: 64.10, rateDate: '2026-09-22', isBase: false, active: true }
];

export const INITIAL_CURRENCY_RATES: CurrencyRate[] = [
  { id: 'rate-usd-1', currencyCode: 'USD', rateDate: '2026-09-20', rate: 49.20, source: 'البنك المركزي المصري', notes: 'سعر إقفال الأسبوع' },
  { id: 'rate-usd-2', currencyCode: 'USD', rateDate: '2026-09-22', rate: 49.50, source: 'البنك المركزي المصري', notes: 'سعر الصرف الرسمي المعلن' },
  { id: 'rate-eur-1', currencyCode: 'EUR', rateDate: '2026-09-20', rate: 53.90, source: 'البنك المركزي المصري', notes: 'سعر إقفال الأسبوع' },
  { id: 'rate-eur-2', currencyCode: 'EUR', rateDate: '2026-09-22', rate: 54.20, source: 'البنك المركزي المصري', notes: 'سعر الصرف الرسمي المعلن' },
  { id: 'rate-sar-1', currencyCode: 'SAR', rateDate: '2026-09-22', rate: 13.20, source: 'البنك المركزي المصري', notes: 'سعر الصرف المعلن' },
  { id: 'rate-gbp-1', currencyCode: 'GBP', rateDate: '2026-09-22', rate: 64.10, source: 'البنك المركزي المصري', notes: 'سعر الصرف المعلن' }
];

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [];

export const SAMPLE_RAW_MATERIALS: RawMaterial[] = [
  {
    id: 'rm-poly-01',
    code: 'RM-HDPE-100',
    nameAr: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
    nameEn: 'High Density Polyethylene Granules',
    description: 'المادة الخام الأساسية لتصنيع الأنابيب الصناعية المقاومة للضغط',
    itemType: ItemType.RAW_MATERIAL,
    defaultUOM: 'KG',
    alternativeUOM: 'TON',
    conversionFactor: 1000,
    defaultWarehouseId: 'wh-raw',
    minStock: 200,
    maxStock: 5000,
    reorderLevel: 500,
    active: true,
    currentQty: 1000,
    movingAverageCost: 110.00,
    totalValue: 110000.00,
    notes: 'مورد معتمد: سابك'
  },
  {
    id: 'rm-color-red',
    code: 'RM-MB-RED',
    nameAr: 'ماسترباتش ملون أحمر صناعي (Red Masterbatch)',
    nameEn: 'Industrial Red Masterbatch',
    description: 'صبغة حرارية عالية التجانس مخصصة للبثق',
    itemType: ItemType.RAW_MATERIAL,
    defaultUOM: 'KG',
    alternativeUOM: 'KG',
    conversionFactor: 1,
    defaultWarehouseId: 'wh-raw',
    minStock: 50,
    maxStock: 500,
    reorderLevel: 100,
    active: true,
    currentQty: 250,
    movingAverageCost: 85.00,
    totalValue: 21250.00
  },
  {
    id: 'rm-stab-uv',
    code: 'RM-UV-STAB',
    nameAr: 'مثبت أشعة فوق بنفسجية (UV Stabilizer Compound)',
    nameEn: 'UV Stabilizer Compound',
    description: 'مركب حماية الأنابيب من التآكل الضوئي والعوامل الجوية',
    itemType: ItemType.RAW_MATERIAL,
    defaultUOM: 'KG',
    alternativeUOM: 'KG',
    conversionFactor: 1,
    defaultWarehouseId: 'wh-raw',
    minStock: 30,
    maxStock: 300,
    reorderLevel: 60,
    active: true,
    currentQty: 180,
    movingAverageCost: 140.00,
    totalValue: 25200.00
  }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const SAMPLE_PRODUCTS: Product[] = [
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
    nameAr: 'أنابيب بولي إيثيلين 50 مم ضغط 16 بار (HDPE Pipe 50mm)',
    nameEn: 'HDPE Pressure Pipe 50mm PN16',
    description: 'منتج تام عالي الجودة لشبكات المياه والري الصناعي',
    productType: ItemType.FINISHED_PRODUCT,
    defaultUOM: 'KG',
    alternativeUOM: 'MTR',
    defaultWarehouseId: 'wh-fg',
    active: true,
    currentQty: 500,
    movingAverageCost: 122.222,
    totalValue: 61111.00,
    notes: 'معتمد للمواصفات القياسية المصرية والأوروبية'
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
    currentQty: 0,
    movingAverageCost: 0,
    totalValue: 0
  }
];

export const INITIAL_MACHINES: Machine[] = [];

export const SAMPLE_MACHINES: Machine[] = [
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
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const SAMPLE_SUPPLIERS: Supplier[] = [
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
    nameAr: 'الشركة المصرية الدولية لمركبات البلاستيك',
    nameEn: 'Egypt Polymers & Colors',
    address: 'المنطقة الصناعية - مدينة 6 أكتوبر',
    phone: '+20 2 38334455',
    email: 'orders@egyptpolymers.com',
    taxNumber: '302-887-412',
    defaultCurrency: 'EGP',
    paymentTerms: 'آجل 30 يوماً',
    active: true
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'cust-orascom',
    code: 'CUST-001',
    nameAr: 'شركة أوراسكوم للإنشاءات والصناعة',
    nameEn: 'Orascom Construction',
    address: 'أبراج نايل سيتي، كورنيش النيل، القاهرة',
    phone: '+20 2 24611111',
    email: 'procurement@orascom.com',
    taxNumber: '200-112-998',
    defaultCurrency: 'EGP',
    paymentTerms: 'آجل 45 يوماً',
    active: true,
    odooPartnerId: 1042
  },
  {
    id: 'cust-petrojet',
    code: 'CUST-002',
    nameAr: 'شركة المشروعات البترولية والاستشارات الفنية (بتروجت)',
    nameEn: 'Petrojet Petroleum Projects',
    address: 'شارع التسعين الشمالي، التجمع الخامس، القاهرة',
    phone: '+20 2 26145000',
    email: 'supplies@petrojet.com.eg',
    taxNumber: '200-445-123',
    defaultCurrency: 'EGP',
    paymentTerms: 'آجل 60 يوماً',
    active: true,
    odooPartnerId: 1045
  },
  {
    id: 'cust-arabcont',
    code: 'CUST-003',
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

export const INITIAL_BOMS: BOM[] = [];

export const SAMPLE_BOMS: BOM[] = [
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
    approvedBy: 'م. طارق رضوان (مدير الإنتاج)',
    approvedDate: '2026-01-05',
    notes: 'النسبة المعيارية: 1000 كجم خام ينتج 900 كجم منتج تام + 100 كجم هالك طبيعي',
    lines: [
      {
        id: 'bl-1',
        rawMaterialId: 'rm-poly-01',
        rawMaterialCode: 'RM-HDPE-100',
        rawMaterialName: 'حبيبات بولي إيثيلين عالي الكثافة (HDPE Granules)',
        quantity: 1.1111, // ~1000 kg for 900 kg FG (1.111 kg RM per 1 kg FG)
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
  }
];

export const INITIAL_USERS: User[] = [
  // 1. System Administrators
  {
    id: 'user-admin',
    username: 'admin',
    fullName: 'أ. محمود فتحي (مدير النظام العام)',
    email: 'mahmoudfathy2424@gmail.com',
    role: UserRole.ADMIN,
    active: true
  },
  {
    id: 'user-admin-it',
    username: 'it.admin',
    fullName: 'م. إبراهيم فؤاد (مسؤول الشبكات والربط)',
    email: 'it.admin@factory.com',
    role: UserRole.ADMIN,
    active: true
  },

  // 2. Warehouse & Inventory Managers
  {
    id: 'user-inventory',
    username: 'ahmed.kamal',
    fullName: 'م. أحمد كمال (مدير حركة المستودعات)',
    email: 'ahmed.inventory@factory.com',
    role: UserRole.INVENTORY_USER,
    active: true
  },
  {
    id: 'user-inventory-wh',
    username: 'yasser.wh',
    fullName: 'أ. ياسر النجار (أمين مستودع المواد الخام)',
    email: 'yasser.wh@factory.com',
    role: UserRole.INVENTORY_USER,
    active: true
  },

  // 3. Production Planners & Engineers
  {
    id: 'user-production',
    username: 'tarek.radwan',
    fullName: 'م. طارق رضوان (رئيس مهندسي الإنتاج)',
    email: 'tarek.prod@factory.com',
    role: UserRole.PRODUCTION_USER,
    active: true
  },
  {
    id: 'user-production-ext',
    username: 'hassan.ext',
    fullName: 'م. حسن البدري (مشرف وردية البثق والتصنيع)',
    email: 'hassan.ext@factory.com',
    role: UserRole.PRODUCTION_USER,
    active: true
  },

  // 4. Quality Control & Assurance (QA/QC)
  {
    id: 'user-quality',
    username: 'samir.sherif',
    fullName: 'د. سمير شريف (مدير ضمان الجودة والمطابقة)',
    email: 'samir.quality@factory.com',
    role: UserRole.QUALITY_USER,
    active: true
  },
  {
    id: 'user-quality-qc',
    username: 'mona.qc',
    fullName: 'ك. منى عبد الرحمن (أخصائية الفحص المعملي)',
    email: 'mona.qc@factory.com',
    role: UserRole.QUALITY_USER,
    active: true
  },

  // 5. Cost Accountants & Financial Controllers
  {
    id: 'user-finance',
    username: 'khaled.mansour',
    fullName: 'أ. خالد منصور (رئيس حسابات التكاليف)',
    email: 'khaled.finance@factory.com',
    role: UserRole.FINANCE_USER,
    active: true
  },

  // 6. Executive Leadership & Strategic Management
  {
    id: 'user-management',
    username: 'director.general',
    fullName: 'م. أسامة الشرقاوي (العضو المنتدب والمدير التنفيذي)',
    email: 'director@factory.com',
    role: UserRole.MANAGEMENT_USER,
    active: true
  }
];

// Pre-seeded MVP Walkthrough records demonstrating the exact business flow in Section 47
export const INITIAL_RECEIPTS: InventoryReceipt[] = [];

export const SAMPLE_RECEIPTS: InventoryReceipt[] = [
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
    createdBy: 'م. أحمد كمال',
    createdDate: '2026-09-18 09:30',
    approvedBy: 'أ. خالد منصور',
    approvalDate: '2026-09-18 10:00'
  }
];

export const INITIAL_LANDED_COSTS: LandedCost[] = [];

export const SAMPLE_LANDED_COSTS: LandedCost[] = [
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

export const INITIAL_TRANSFERS: InventoryTransfer[] = [];

export const SAMPLE_TRANSFERS: InventoryTransfer[] = [
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
    notes: 'تحويل كامل الكمية 1000 كجم من مستودع الخام إلى الإنتاج تحت التشغيل (لا يغير إجمالي قيمة مخزون الشركة)',
    createdBy: 'م. أحمد كمال',
    createdDate: '2026-09-19 08:30',
    status: 'POSTED'
  }
];

export const INITIAL_PRODUCTION_ORDERS: ProductionOrder[] = [];

export const SAMPLE_PRODUCTION_ORDERS: ProductionOrder[] = [
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
    qualityApprovedBy: 'د. سمير شريف (مدير الجودة)',
    qualityApprovalDate: '2026-09-19 16:30',
    finishedGoodsWarehouseId: 'wh-fg',
    notes: 'أمر إنتاج تجريبي مكتمل بالكامل وفق النموذج المعياري',
    createdBy: 'م. طارق رضوان',
    createdDate: '2026-09-19 09:00',
    approvedBy: 'م. طارق رضوان',
    approvalDate: '2026-09-19 09:30'
  }
];

export const INITIAL_MATERIAL_ISSUES: MaterialIssue[] = [];

export const SAMPLE_MATERIAL_ISSUES: MaterialIssue[] = [
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
  }
];

export const INITIAL_PRODUCTION_RECEIPTS: ProductionReceipt[] = [];

export const SAMPLE_PRODUCTION_RECEIPTS: ProductionReceipt[] = [
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
    notes: 'استيعاب المنتج التام لكامل تكلفة الخامات (110,000 ج.م / 900 كجم = 122.222 ج.م/كجم). وقيمة السكراب 0 ج.م.',
    createdBy: 'م. طارق رضوان',
    status: 'POSTED'
  }
];

export const INITIAL_CUSTOMER_DELIVERIES: CustomerDelivery[] = [];

export const SAMPLE_CUSTOMER_DELIVERIES: CustomerDelivery[] = [
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
    createdBy: 'م. أحمد كمال',
    createdDate: '2026-09-20 10:15',
    status: 'POSTED',
    odooSynced: true
  }
];

// Initial complete Inventory Ledger entries matching Section 47
export const INITIAL_LEDGER_ENTRIES: InventoryLedgerEntry[] = [];

export const SAMPLE_LEDGER_ENTRIES: InventoryLedgerEntry[] = [
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
    notes: 'إضافة تكلفة إنزال (جمارك وشحن) تزيد القيمة دون زيادة الكمية'
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
    reference: 'تحويل لمستودع الإنتاج',
    qtyIn: 0,
    qtyOut: 1000,
    balanceQty: 0,
    unitCostEGP: 110.0,
    transactionValueEGP: 110000.0,
    runningInventoryValueEGP: 0.0,
    movingAverageCostEGP: 110.0,
    createdBy: 'م. أحمد كمال',
    notes: 'صرف تحويل إلى صالة الإنتاج'
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
    reference: 'تحويل من مستودع الخام',
    qtyIn: 1000,
    qtyOut: 0,
    balanceQty: 1000,
    unitCostEGP: 110.0,
    transactionValueEGP: 110000.0,
    runningInventoryValueEGP: 110000.0,
    movingAverageCostEGP: 110.0,
    createdBy: 'م. أحمد كمال',
    notes: 'استلام تحويل في صالة الإنتاج'
  },
  {
    id: 'ledg-005',
    date: '2026-09-19 11:00',
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
    notes: 'صرف واستهلاك الخامات في أمر الإنتاج'
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
    createdBy: 'د. سمير شريف',
    notes: 'استلام الإنتاج التام بعد موافقة الجودة (110,000 ج.م ÷ 900 كجم)'
  },
  {
    id: 'ledg-007',
    date: '2026-09-19 16:30',
    itemId: 'rm-poly-01',
    itemCode: 'SCRAP-PIPE',
    itemName: 'هالك وعادم تصنيع الأنابيب (HDPE Scrap)',
    itemType: ItemType.RAW_MATERIAL,
    warehouseId: 'wh-scrap',
    warehouseName: 'مستودع الهالك والسكراب',
    transactionType: TransactionType.SCRAP,
    documentNumber: 'PR-2026-0001',
    reference: 'PO-2026-0001',
    qtyIn: 100,
    qtyOut: 0,
    balanceQty: 100,
    unitCostEGP: 0.0,
    transactionValueEGP: 0.0,
    runningInventoryValueEGP: 0.0,
    movingAverageCostEGP: 0.0,
    createdBy: 'م. طارق رضوان',
    notes: 'استلام هالك التصنيع بقيمة معيارية 0 ج.م حسب قاعدة MVP'
  },
  {
    id: 'ledg-008',
    date: '2026-09-20 10:15',
    itemId: 'fp-pipe-50',
    itemCode: 'FP-PIPE-50MM',
    itemName: 'أنابيب بولي إيثيلين 50 مم ضغط 16 بار (HDPE Pipe 50mm)',
    itemType: ItemType.FINISHED_PRODUCT,
    warehouseId: 'wh-fg',
    warehouseName: 'مستودع المنتجات التامة',
    transactionType: TransactionType.CUSTOMER_DELIVERY,
    documentNumber: 'DEL-2026-0001',
    reference: 'SO-8812 - شركة أوراسكوم',
    qtyIn: 0,
    qtyOut: 400,
    balanceQty: 500,
    unitCostEGP: 122.222,
    transactionValueEGP: 48888.80,
    runningInventoryValueEGP: 61111.20,
    movingAverageCostEGP: 122.222,
    createdBy: 'م. أحمد كمال',
    notes: 'صرف وتسليم بضاعة للعميل بمتوسط التكلفة'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

export const SAMPLE_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    date: '2026-09-18',
    time: '09:30:15',
    userName: 'م. أحمد كمال',
    action: 'POST_RECEIPT',
    documentType: 'إذن إضافة مخزني',
    documentNumber: 'REC-2026-0001',
    details: 'إضافة 1000 كجم خام بولي إيثيلين بقيمة 100,000 ج.م من المورد سابك'
  },
  {
    id: 'aud-2',
    date: '2026-09-18',
    time: '14:15:20',
    userName: 'أ. خالد منصور',
    action: 'POST_LANDED_COST',
    documentType: 'تكلفة إنزال إضافية',
    documentNumber: 'LC-2026-0001',
    details: 'إضافة مصاريف جمركية ونقل 10,000 ج.م على إذن REC-2026-0001، وتعديل متوسط التكلفة إلى 110 ج.م'
  },
  {
    id: 'aud-3',
    date: '2026-09-19',
    time: '09:00:00',
    userName: 'م. طارق رضوان',
    action: 'CREATE_PRODUCTION_ORDER',
    documentType: 'أمر إنتاج',
    documentNumber: 'PO-2026-0001',
    details: 'إنشاء أمر إنتاج 900 كجم أنابيب بناء على قائمة المواد BOM-PIPE-50-V1'
  },
  {
    id: 'aud-4',
    date: '2026-09-19',
    time: '16:30:10',
    userName: 'د. سمير شريف',
    action: 'QUALITY_APPROVAL',
    documentType: 'فحص وموافقة الجودة',
    documentNumber: 'PR-2026-0001',
    details: 'اعتماد جودة الدفعة 900 كجم والإفراج عنها إلى مستودع المنتجات التامة'
  },
  {
    id: 'aud-5',
    date: '2026-09-20',
    time: '10:15:00',
    userName: 'م. أحمد كمال',
    action: 'CUSTOMER_DELIVERY',
    documentType: 'صرف بضاعة لعميل',
    documentNumber: 'DEL-2026-0001',
    details: 'صرف 400 كجم للعميل شركة أوراسكوم بتكلفة مبيعات 48,888.80 ج.م'
  },
  {
    id: 'aud-6',
    date: '2026-09-20',
    time: '11:00:00',
    userName: 'أ. محمود عبد الرحمن',
    action: 'COST_ADJUSTMENT',
    documentType: 'تسوية تكلفة صناعية',
    documentNumber: 'CA-2026-0001',
    details: 'تسوية فاتورة كهرباء متأخرة 5,000 ج.م على أمر الإنتاج PO-2026-0001 وتوزيعها بين المخزون (2,777.78 ج.م) وتكلفة المبيعات COGS (2,222.22 ج.م)'
  }
];

export const INITIAL_COST_ADJUSTMENTS: ProductionOrderCostAdjustment[] = [];

export const SAMPLE_COST_ADJUSTMENTS: ProductionOrderCostAdjustment[] = [
  {
    id: 'ca-init-001',
    adjustmentNumber: 'CA-2026-0001',
    date: '2026-09-20',
    productionOrderId: 'po-001',
    productionOrderNumber: 'PO-2026-0001',
    costCategory: CostCategory.ENERGY_COST,
    costType: 'فاتورة كهرباء صناعية متأخرة لدورة البثق',
    amount: 5000,
    currency: 'EGP',
    exchangeRate: 1,
    amountEGP: 5000,
    allocationMethod: CostAllocationMethod.DIRECT_AMOUNT,
    originalProductionCostEGP: 110000,
    revisedProductionCostEGP: 115000,
    quantityProduced: 900,
    quantityInStock: 500,
    quantityIssuedOrSold: 400,
    inventoryAdjustmentEGP: 2777.78,
    cogsAdjustmentEGP: 2222.22,
    description: 'تسوية فاتورة استهلاك طاقة كهربائية متأخرة للتشغيل وتوزيع الأثر المحاسبي وفق البند 48',
    createdBy: 'م. أحمد فؤاد',
    approvedBy: 'أ. محمود عبد الرحمن (مدير التكاليف)',
    approvalDate: '2026-09-20 11:00',
    status: 'POSTED'
  }
];

export const INITIAL_ODOO_CONFIG: OdooConfig = {
  serverUrl: 'https://manufacturing-eg.odoo.com',
  database: 'odoo_mfg_prod_2026',
  username: 'odoo.connector@factory.com',
  apiKey: 'odoo_live_key_99842aef77',
  isConnected: true,
  lastTestedDate: '2026-09-20 11:45',
  lastSyncDate: '2026-09-20 12:00',
  autoSync: false,
  syncCustomers: true,
  syncInventory: true,
  syncProduction: true
};

export const INITIAL_ODOO_LOGS: OdooSyncLog[] = [
  {
    id: 'sync-log-1',
    timestamp: '2026-09-20 12:00:15',
    model: 'res.partner',
    action: 'SYNC',
    recordsCount: 3,
    status: 'SUCCESS',
    details: 'تمت مزامنة بيانات 3 عملاء بنجاح مع Odoo res.partner (Orascom, Petrojet, Arab Contractors)'
  },
  {
    id: 'sync-log-2',
    timestamp: '2026-09-20 11:58:30',
    model: 'stock.quant',
    action: 'EXPORT',
    recordsCount: 4,
    status: 'SUCCESS',
    details: 'تحديث أرصدة المخزون وقيم متوسط التكلفة في مستودعات أودو (WH/Stock)'
  },
  {
    id: 'sync-log-3',
    timestamp: '2026-09-20 11:50:00',
    model: 'mrp.production',
    action: 'SYNC',
    recordsCount: 1,
    status: 'SUCCESS',
    details: 'ربط أمر الإنتاج PO-2026-0001 مع أمر تصنيع أودو MO/2026/001'
  }
];

// Item Groups / Categories & Valuation Methods (Empty by default per user request)
export const INITIAL_ITEM_CATEGORIES: ItemCategory[] = [];
export const SAMPLE_ITEM_CATEGORIES: ItemCategory[] = [];
