import * as XLSX from 'xlsx';
import {
  RawMaterial,
  Product,
  ItemCategory,
  BOM,
  BOMLine,
  Warehouse,
  ProductionLocation,
  UOM,
  Machine,
  Supplier,
  Customer,
  Currency,
  CurrencyRate,
  User,
  InventoryReceipt,
  InventoryIssue,
  InventoryTransfer,
  ProductionOrder,
  CustomerDelivery,
  LandedCost,
  WarehouseType,
  ValuationMethod,
  ItemType,
  ProductionOrderStatus,
  UserRole,
  Language
} from '../types';

export type EntityKey =
  | 'rawMaterials'
  | 'products'
  | 'categories'
  | 'boms'
  | 'warehouses'
  | 'locations'
  | 'uoms'
  | 'machines'
  | 'suppliers'
  | 'customers'
  | 'currencies'
  | 'users'
  | 'receipts'
  | 'issues'
  | 'transfers'
  | 'productionOrders'
  | 'customerDeliveries'
  | 'landedCosts';

export interface ColumnDefinition {
  key: string;
  labelAr: string;
  labelEn: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  required: boolean;
  enumValues?: string[];
  enumLabelsAr?: Record<string, string>;
  enumLabelsEn?: Record<string, string>;
  descriptionAr: string;
  descriptionEn: string;
  sampleValue: any;
  aliases?: string[]; // Possible header aliases when user uploads their custom file
}

export interface EntityDefinition {
  key: EntityKey;
  labelAr: string;
  labelEn: string;
  category: 'master' | 'operations';
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
  idField: string;
  codeField: string;
  columns: ColumnDefinition[];
}

export interface ImportError {
  row: number; // 1-indexed row number in data
  field: string;
  fieldLabel: string;
  value: any;
  message: string;
  type: 'required' | 'type' | 'enum' | 'fk' | 'duplicate' | 'custom';
}

export interface ImportValidationResult {
  entityKey: EntityKey;
  totalRows: number;
  validRows: any[];
  errorRows: { rowNumber: number; rowData: any; errors: ImportError[] }[];
  errors: ImportError[];
  stats: {
    total: number;
    validCount: number;
    errorCount: number;
    newCount: number;
    updateCount: number;
  };
}

// -------------------------------------------------------------
// CENTRAL ENTITY REGISTRY WITH EXACT SCHEMA DEFINITIONS
// -------------------------------------------------------------

export const ENTITY_DEFINITIONS: Record<EntityKey, EntityDefinition> = {
  rawMaterials: {
    key: 'rawMaterials',
    labelAr: 'الخامات ومستلزمات الإنتاج',
    labelEn: 'Raw Materials & Components',
    category: 'master',
    descriptionAr: 'المواد الخام والمكونات المستخدمة في دورة الإنتاج والتصنيع',
    descriptionEn: 'Raw materials, ingredients, and components for manufacturing',
    iconName: 'Boxes',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'كود الخامة *',
        labelEn: 'Item Code *',
        type: 'string',
        required: true,
        descriptionAr: 'الكود الفريد غير المتكرر (مثل RAW-ALUM-01)',
        descriptionEn: 'Unique raw material item code',
        sampleValue: 'RAW-ALUM-6063',
        aliases: ['كود', 'الكود', 'كود الصنف', 'رمز الخامة', 'Code', 'ItemCode', 'MaterialCode']
      },
      {
        key: 'nameAr',
        labelAr: 'الاسم بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم المادة الخام باللغة العربية',
        descriptionEn: 'Arabic item description',
        sampleValue: 'سبيكة ألومنيوم 6063 T6 قطر 7 بوصة',
        aliases: ['الاسم', 'اسم الصنف', 'اسم الخامة', 'NameAr', 'Name', 'ItemName']
      },
      {
        key: 'nameEn',
        labelAr: 'الاسم بالإنجليزية',
        labelEn: 'Name (English)',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم اللاتيني أو التجاري بالإنجليزية',
        descriptionEn: 'English item name',
        sampleValue: 'Aluminum Billet 6063 T6 7-inch',
        aliases: ['NameEn', 'EnglishName', 'الاسم بالانجليزية']
      },
      {
        key: 'categoryCode',
        labelAr: 'كود الفئة',
        labelEn: 'Category Code',
        type: 'string',
        required: false,
        descriptionAr: 'كود فئة الصنف (مثل CAT-METALS أو CAT-RAW)',
        descriptionEn: 'Item category code',
        sampleValue: 'CAT-METALS',
        aliases: ['الفئة', 'كود التصنيف', 'Category', 'CategoryCode']
      },
      {
        key: 'valuationMethod',
        labelAr: 'طريقة التقييم',
        labelEn: 'Valuation Method',
        type: 'enum',
        required: false,
        enumValues: ['MOVING_AVERAGE', 'FIFO', 'STANDARD'],
        enumLabelsAr: {
          MOVING_AVERAGE: 'متوسط متحرك (MOVING_AVERAGE)',
          FIFO: 'الوارد أولا صادر أولا (FIFO)',
          STANDARD: 'تكلفة معيارية (STANDARD)'
        },
        enumLabelsEn: {
          MOVING_AVERAGE: 'Moving Average',
          FIFO: 'FIFO',
          STANDARD: 'Standard Cost'
        },
        descriptionAr: 'MOVING_AVERAGE أو FIFO أو STANDARD (الافتراضي: MOVING_AVERAGE)',
        descriptionEn: 'Inventory valuation method',
        sampleValue: 'MOVING_AVERAGE',
        aliases: ['طريقة التقييم', 'التقييم', 'Valuation', 'ValuationMethod']
      },
      {
        key: 'defaultUOM',
        labelAr: 'وحدة القياس الأساسية *',
        labelEn: 'Default UOM *',
        type: 'string',
        required: true,
        descriptionAr: 'رمز وحدة القياس (مثل KG, TON, M, PCS)',
        descriptionEn: 'Primary unit of measure code',
        sampleValue: 'KG',
        aliases: ['الوحدة', 'وحدة القياس', 'UOM', 'Unit', 'DefaultUOM']
      },
      {
        key: 'alternativeUOM',
        labelAr: 'وحدة القياس البديلة',
        labelEn: 'Alternative UOM',
        type: 'string',
        required: false,
        descriptionAr: 'وحدة قياس ثانوية إن وجدت (مثل TON)',
        descriptionEn: 'Alternative unit of measure',
        sampleValue: 'TON',
        aliases: ['الوحدة البديلة', 'AltUOM']
      },
      {
        key: 'conversionFactor',
        labelAr: 'معامل التحويل',
        labelEn: 'Conversion Factor',
        type: 'number',
        required: false,
        descriptionAr: 'معامل التحويل للوحدة البديلة (مثال: 1000 كجم = 1 طن)',
        descriptionEn: 'Multiplier factor between primary and alternative UOM',
        sampleValue: 1000,
        aliases: ['معامل التحويل', 'Factor']
      },
      {
        key: 'defaultWarehouseCode',
        labelAr: 'المستودع الافتراضي',
        labelEn: 'Default Warehouse Code',
        type: 'string',
        required: false,
        descriptionAr: 'كود المستودع المخصص للخامات (مثل WH-RAW-01)',
        descriptionEn: 'Default warehouse code',
        sampleValue: 'WH-RAW-01',
        aliases: ['المستودع', 'المخزن', 'Warehouse', 'WarehouseCode']
      },
      {
        key: 'currentQty',
        labelAr: 'الرصيد الافتتاحي (الكمية)',
        labelEn: 'Opening Stock Qty',
        type: 'number',
        required: false,
        descriptionAr: 'الكمية الموجودة حالياً بالمخزن كرصيد افتتاحي',
        descriptionEn: 'Current on-hand opening quantity',
        sampleValue: 5000,
        aliases: ['الرصيد', 'الكمية الحالية', 'الرصيد الافتتاحي', 'Qty', 'CurrentQty']
      },
      {
        key: 'movingAverageCost',
        labelAr: 'متوسط التكلفة / سعر الوحدة (ج.م)',
        labelEn: 'Unit Cost / MAC (EGP)',
        type: 'number',
        required: false,
        descriptionAr: 'سعر الوحدة بالجنيه المصري لاحتساب التقييم الافتتاحي',
        descriptionEn: 'Weighted average unit cost in EGP',
        sampleValue: 145.5,
        aliases: ['التكلفة', 'سعر الوحدة', 'متوسط التكلفة', 'Cost', 'UnitCost', 'MovingAverageCost']
      },
      {
        key: 'minStock',
        labelAr: 'الحد الأدنى للمخزون',
        labelEn: 'Min Stock',
        type: 'number',
        required: false,
        descriptionAr: 'مستوى الأمان المخزني للتنبيه عند النقص',
        descriptionEn: 'Minimum safety threshold',
        sampleValue: 1000,
        aliases: ['الحد الادنى', 'MinStock']
      },
      {
        key: 'maxStock',
        labelAr: 'الحد الأقصى للمخزون',
        labelEn: 'Max Stock',
        type: 'number',
        required: false,
        descriptionAr: 'الحد الأقصى المسموح به في المخزن',
        descriptionEn: 'Maximum inventory capacity',
        sampleValue: 20000,
        aliases: ['الحد الاقصى', 'MaxStock']
      },
      {
        key: 'reorderLevel',
        labelAr: 'نقطة إعادة الطلب',
        labelEn: 'Reorder Level',
        type: 'number',
        required: false,
        descriptionAr: 'الكمية التي ينبغي عندها إصدار أمر شراء جديد',
        descriptionEn: 'Reorder point qty',
        sampleValue: 2500,
        aliases: ['نقطة الطلب', 'ReorderPoint', 'ReorderLevel']
      },
      {
        key: 'description',
        labelAr: 'المواصفات الفنية / الوصف',
        labelEn: 'Description',
        type: 'string',
        required: false,
        descriptionAr: 'مواصفات الخامة ودرجة النقاوة',
        descriptionEn: 'Technical specifications',
        sampleValue: 'سبيكة سحب ألومنيوم معالجة حرارياً عالية المتانة',
        aliases: ['الوصف', 'المواصفات', 'Description']
      },
      {
        key: 'active',
        labelAr: 'الحالة (نشط)',
        labelEn: 'Active (Yes/No)',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا (TRUE أو FALSE). الافتراضي: نعم',
        descriptionEn: 'Active status (true/false)',
        sampleValue: true,
        aliases: ['نشط', 'الحالة', 'Active']
      }
    ]
  },

  products: {
    key: 'products',
    labelAr: 'المنتجات التامة ونصف المصنعة',
    labelEn: 'Finished & Semi-Finished Products',
    category: 'master',
    descriptionAr: 'المنتجات النهائية الجاهزة للتسليم للعملاء والمنتجات الوسيطة',
    descriptionEn: 'Finished goods and intermediate assemblies ready for delivery',
    iconName: 'Package',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'كود المنتج *',
        labelEn: 'Product Code *',
        type: 'string',
        required: true,
        descriptionAr: 'الكود الفريد للمنتج (مثل FG-WIN-100 أو SF-FRAME-01)',
        descriptionEn: 'Unique product code',
        sampleValue: 'FG-WIN-120-BL',
        aliases: ['كود', 'كود المنتج', 'رمز المنتج', 'Code', 'ProductCode']
      },
      {
        key: 'nameAr',
        labelAr: 'اسم المنتج بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم المنتج التام أو نصف المصنع بالعربية',
        descriptionEn: 'Arabic product name',
        sampleValue: 'شباك ألومنيوم منزلق دبل 120*100 سم أسود',
        aliases: ['الاسم', 'اسم المنتج', 'NameAr', 'Name']
      },
      {
        key: 'nameEn',
        labelAr: 'الاسم بالإنجليزية',
        labelEn: 'Name (English)',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم باللغة الإنجليزية',
        descriptionEn: 'English product name',
        sampleValue: 'Sliding Double Glazed Window 120x100 Black',
        aliases: ['NameEn', 'EnglishName']
      },
      {
        key: 'productType',
        labelAr: 'نوع الصنف *',
        labelEn: 'Product Type *',
        type: 'enum',
        required: true,
        enumValues: ['FINISHED_PRODUCT', 'SEMI_FINISHED', 'SCRAP'],
        enumLabelsAr: {
          FINISHED_PRODUCT: 'منتج تام نهائي (FINISHED_PRODUCT)',
          SEMI_FINISHED: 'منتج وسيط نصف مصنع (SEMI_FINISHED)',
          SCRAP: 'مخلفات إنتاج / هالك (SCRAP)'
        },
        enumLabelsEn: {
          FINISHED_PRODUCT: 'Finished Good',
          SEMI_FINISHED: 'Semi-Finished',
          SCRAP: 'Scrap'
        },
        descriptionAr: 'اختر: FINISHED_PRODUCT أو SEMI_FINISHED أو SCRAP',
        descriptionEn: 'FINISHED_PRODUCT, SEMI_FINISHED, or SCRAP',
        sampleValue: 'FINISHED_PRODUCT',
        aliases: ['نوع الصنف', 'نوع المنتج', 'Type', 'ProductType']
      },
      {
        key: 'categoryCode',
        labelAr: 'كود الفئة',
        labelEn: 'Category Code',
        type: 'string',
        required: false,
        descriptionAr: 'كود الفئة التابع لها',
        descriptionEn: 'Product category code',
        sampleValue: 'CAT-FG-WINDOWS',
        aliases: ['الفئة', 'Category']
      },
      {
        key: 'valuationMethod',
        labelAr: 'طريقة التقييم',
        labelEn: 'Valuation Method',
        type: 'enum',
        required: false,
        enumValues: ['MOVING_AVERAGE', 'FIFO', 'STANDARD'],
        descriptionAr: 'MOVING_AVERAGE أو FIFO أو STANDARD',
        descriptionEn: 'Valuation method',
        sampleValue: 'MOVING_AVERAGE',
        aliases: ['التقييم', 'Valuation']
      },
      {
        key: 'defaultUOM',
        labelAr: 'وحدة القياس الأساسية *',
        labelEn: 'Default UOM *',
        type: 'string',
        required: true,
        descriptionAr: 'وحدة القياس (مثل PCS, M2, SET)',
        descriptionEn: 'Primary unit of measure',
        sampleValue: 'PCS',
        aliases: ['الوحدة', 'UOM', 'Unit']
      },
      {
        key: 'defaultWarehouseCode',
        labelAr: 'المستودع الافتراضي',
        labelEn: 'Default Warehouse Code',
        type: 'string',
        required: false,
        descriptionAr: 'كود مستودع المنتجات التامة (مثل WH-FG-01)',
        descriptionEn: 'Default warehouse code',
        sampleValue: 'WH-FG-01',
        aliases: ['المستودع', 'Warehouse']
      },
      {
        key: 'currentQty',
        labelAr: 'الرصيد الافتتاحي الحالي',
        labelEn: 'Opening Stock Qty',
        type: 'number',
        required: false,
        descriptionAr: 'الكمية الموجودة حالياً بالمستودع',
        descriptionEn: 'Opening stock count',
        sampleValue: 120,
        aliases: ['الرصيد', 'الكمية', 'CurrentQty']
      },
      {
        key: 'movingAverageCost',
        labelAr: 'متوسط تكلفة التصنيع التقديرية (ج.م)',
        labelEn: 'Estimated Cost (EGP)',
        type: 'number',
        required: false,
        descriptionAr: 'تكلفة الوحدة بالجنيه المصري',
        descriptionEn: 'Estimated unit manufacturing cost',
        sampleValue: 2450.0,
        aliases: ['التكلفة', 'متوسط التكلفة', 'Cost']
      },
      {
        key: 'description',
        labelAr: 'الوصف والمواصفات',
        labelEn: 'Description',
        type: 'string',
        required: false,
        descriptionAr: 'مواصفات القطاع والزجاج والملحقات',
        descriptionEn: 'Detailed specifications',
        sampleValue: 'شباك زجاج مزدوج عازل للصوت والحرارة سمك 24 ملم',
        aliases: ['الوصف', 'Description']
      },
      {
        key: 'active',
        labelAr: 'نشط (نعم/لا)',
        labelEn: 'Active',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا (TRUE أو FALSE)',
        descriptionEn: 'Active flag',
        sampleValue: true,
        aliases: ['نشط', 'Active']
      }
    ]
  },

  categories: {
    key: 'categories',
    labelAr: 'فئات وتصنيفات الأصناف',
    labelEn: 'Item Categories',
    category: 'master',
    descriptionAr: 'تصنيفات الأصناف وسياسات تقييم المخزون المالي المرتبطة بها',
    descriptionEn: 'Item categories and inventory valuation policy baselines',
    iconName: 'Layers',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'كود الفئة *',
        labelEn: 'Category Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود الفئة مثل CAT-RAW, CAT-FG',
        descriptionEn: 'Unique category code',
        sampleValue: 'CAT-ALUM-EXT',
        aliases: ['كود الفئة', 'الكود', 'CategoryCode', 'Code']
      },
      {
        key: 'nameAr',
        labelAr: 'اسم الفئة بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم الفئة بالعربية',
        descriptionEn: 'Category Arabic description',
        sampleValue: 'قطاعات الألومنيوم المسحوبة',
        aliases: ['الاسم', 'اسم الفئة', 'NameAr', 'Name']
      },
      {
        key: 'nameEn',
        labelAr: 'الاسم بالإنجليزية',
        labelEn: 'Name (English)',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم بالإنجليزية',
        descriptionEn: 'English category name',
        sampleValue: 'Extruded Aluminum Profiles',
        aliases: ['NameEn']
      },
      {
        key: 'valuationMethod',
        labelAr: 'طريقة التقييم *',
        labelEn: 'Valuation Method *',
        type: 'enum',
        required: true,
        enumValues: ['MOVING_AVERAGE', 'FIFO', 'STANDARD'],
        descriptionAr: 'MOVING_AVERAGE أو FIFO أو STANDARD',
        descriptionEn: 'Valuation method',
        sampleValue: 'MOVING_AVERAGE',
        aliases: ['طريقة التقييم', 'ValuationMethod']
      },
      {
        key: 'applicableType',
        labelAr: 'التطبيق على نوع الصنف',
        labelEn: 'Applicable Type',
        type: 'enum',
        required: false,
        enumValues: ['RAW_MATERIAL', 'FINISHED_PRODUCT', 'SEMI_FINISHED', 'SCRAP', 'PACKING', 'ALL'],
        descriptionAr: 'RAW_MATERIAL, FINISHED_PRODUCT, ALL',
        descriptionEn: 'Scope of items',
        sampleValue: 'RAW_MATERIAL',
        aliases: ['ينطبق على', 'ApplicableType']
      },
      {
        key: 'standardCostEGP',
        labelAr: 'التكلفة المعيارية (ج.م)',
        labelEn: 'Standard Cost (EGP)',
        type: 'number',
        required: false,
        descriptionAr: 'في حال تطبيق طريقة التكلفة المعيارية',
        descriptionEn: 'Standard baseline cost',
        sampleValue: 150.0,
        aliases: ['التكلفة المعيارية', 'StandardCost']
      },
      {
        key: 'description',
        labelAr: 'الوصف',
        labelEn: 'Description',
        type: 'string',
        required: false,
        descriptionAr: 'وصف الفئة ونطاق استخدامها',
        descriptionEn: 'Category description',
        sampleValue: 'كافة أنواع مقاطع وقطاعات الألومنيوم المستخدمة بالتشغيل',
        aliases: ['الوصف', 'Description']
      },
      {
        key: 'active',
        labelAr: 'نشط (نعم/لا)',
        labelEn: 'Active',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا',
        descriptionEn: 'Active status',
        sampleValue: true,
        aliases: ['نشط', 'Active']
      }
    ]
  },

  boms: {
    key: 'boms',
    labelAr: 'شجرة المنتج وقوائم المواد (BOM)',
    labelEn: 'Bills of Materials (BOM)',
    category: 'master',
    descriptionAr: 'معادلات التصنيع والكميات المعيارية للخامات الداخلة في إنتاج كل صنف',
    descriptionEn: 'Product recipes, raw material ratios, and component sequences',
    iconName: 'Layers',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'كود شجرة المنتج *',
        labelEn: 'BOM Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المعادلة (مثل BOM-WIN-100-V1)',
        descriptionEn: 'Unique BOM recipe code',
        sampleValue: 'BOM-WIN-120-V1',
        aliases: ['كود المعادلة', 'كود الشجرة', 'BOMCode', 'Code']
      },
      {
        key: 'productCode',
        labelAr: 'كود المنتج التام *',
        labelEn: 'Product Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المنتج النهائي المراد تصنيعه بهذه المعادلة',
        descriptionEn: 'Target finished product code',
        sampleValue: 'FG-WIN-120-BL',
        aliases: ['كود المنتج', 'المنتج', 'ProductCode']
      },
      {
        key: 'nameAr',
        labelAr: 'اسم المعادلة بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم شجرة المنتج بالعربية',
        descriptionEn: 'BOM recipe name',
        sampleValue: 'معادلة شباك منزلق 120*100 قطاع جامبو',
        aliases: ['اسم المعادلة', 'الاسم', 'NameAr', 'Name']
      },
      {
        key: 'version',
        labelAr: 'رقم الإصدار',
        labelEn: 'Version',
        type: 'string',
        required: false,
        descriptionAr: 'إصدار المعادلة (مثل 1.0 أو 2.1)',
        descriptionEn: 'Recipe revision',
        sampleValue: '1.0',
        aliases: ['الإصدار', 'Version']
      },
      {
        key: 'status',
        labelAr: 'حالة الاعتماد',
        labelEn: 'Status',
        type: 'enum',
        required: false,
        enumValues: ['APPROVED', 'DRAFT', 'INACTIVE'],
        descriptionAr: 'APPROVED أو DRAFT أو INACTIVE',
        descriptionEn: 'Approval status',
        sampleValue: 'APPROVED',
        aliases: ['الحالة', 'Status']
      },
      {
        key: 'rawMaterialCode',
        labelAr: 'كود الخامة الداخلة *',
        labelEn: 'Raw Material Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود مادة من المواد الخام المكونة للمنتج',
        descriptionEn: 'Component raw material code',
        sampleValue: 'RAW-ALUM-6063',
        aliases: ['كود الخامة', 'الخامة', 'MaterialCode', 'RawMaterialCode']
      },
      {
        key: 'quantity',
        labelAr: 'الكمية المطلوبة لكل وحدة *',
        labelEn: 'Quantity per Unit *',
        type: 'number',
        required: true,
        descriptionAr: 'كمية الخامة اللازمة لإنتاج وحدة واحدة تامة',
        descriptionEn: 'Required raw quantity per single finished item',
        sampleValue: 4.8,
        aliases: ['الكمية المطلوبة', 'الكمية', 'Qty', 'Quantity']
      },
      {
        key: 'uom',
        labelAr: 'وحدة القياس',
        labelEn: 'UOM',
        type: 'string',
        required: false,
        descriptionAr: 'وحدة قياس الخامة (مثل KG, M, PCS)',
        descriptionEn: 'Unit of measure',
        sampleValue: 'KG',
        aliases: ['الوحدة', 'UOM']
      },
      {
        key: 'productionStage',
        labelAr: 'مرحلة الإنتاج',
        labelEn: 'Production Stage',
        type: 'string',
        required: false,
        descriptionAr: 'المرحلة التي تستهلك هذه الخامة (تقطيع، تجميع، تشطيب...)',
        descriptionEn: 'Manufacturing step',
        sampleValue: 'التقطيع والتفريز',
        aliases: ['المرحلة', 'مرحلة الإنتاج', 'Stage', 'ProductionStage']
      },
      {
        key: 'sequence',
        labelAr: 'الترتيب والتسلسل',
        labelEn: 'Sequence',
        type: 'number',
        required: false,
        descriptionAr: 'ترتيب الخامة في شجرة المنتج (1, 2, 3...)',
        descriptionEn: 'Component order sequence',
        sampleValue: 1,
        aliases: ['الترتيب', 'التسلسل', 'Sequence']
      },
      {
        key: 'mandatory',
        labelAr: 'إلزامية (نعم/لا)',
        labelEn: 'Mandatory',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا',
        descriptionEn: 'Is mandatory line',
        sampleValue: true,
        aliases: ['إلزامي', 'Mandatory']
      }
    ]
  },

  warehouses: {
    key: 'warehouses',
    labelAr: 'المستودعات والمخازن',
    labelEn: 'Warehouses',
    category: 'master',
    descriptionAr: 'مستودعات الخامات، الإنتاج تحت التشغيل، المنتجات التامة، والهالك',
    descriptionEn: 'Physical inventory facilities and storage locations',
    iconName: 'Building2',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'كود المستودع *',
        labelEn: 'Warehouse Code *',
        type: 'string',
        required: true,
        descriptionAr: 'الكود الفريد للمستودع (مثل WH-RAW-01, WH-FG-01)',
        descriptionEn: 'Warehouse code',
        sampleValue: 'WH-RAW-MAIN',
        aliases: ['كود المستودع', 'كود المخزن', 'WarehouseCode', 'Code']
      },
      {
        key: 'nameAr',
        labelAr: 'اسم المستودع بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم المستودع بالعربية',
        descriptionEn: 'Arabic warehouse name',
        sampleValue: 'مستودع الخامات والمقاطع الرئيسي - مصنع 1',
        aliases: ['اسم المستودع', 'المستودع', 'NameAr', 'Name']
      },
      {
        key: 'nameEn',
        labelAr: 'الاسم بالإنجليزية',
        labelEn: 'Name (English)',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم بالإنجليزية',
        descriptionEn: 'English warehouse name',
        sampleValue: 'Main Raw Materials Warehouse - Plant 1',
        aliases: ['NameEn']
      },
      {
        key: 'type',
        labelAr: 'نوع المستودع *',
        labelEn: 'Warehouse Type *',
        type: 'enum',
        required: true,
        enumValues: ['RAW_MATERIALS', 'FINISHED_GOODS', 'WIP', 'SCRAP', 'PACKING'],
        enumLabelsAr: {
          RAW_MATERIALS: 'مستودع خامات (RAW_MATERIALS)',
          FINISHED_GOODS: 'مستودع بضاعة تامة (FINISHED_GOODS)',
          WIP: 'مستودع تشغيل قيد التصنيع (WIP)',
          SCRAP: 'مستودع هالك وخردة (SCRAP)',
          PACKING: 'مستودع مواد تعبئة وتغليف (PACKING)'
        },
        descriptionAr: 'اختر: RAW_MATERIALS, FINISHED_GOODS, WIP, SCRAP, PACKING',
        descriptionEn: 'Warehouse category',
        sampleValue: 'RAW_MATERIALS',
        aliases: ['نوع المستودع', 'نوع المخزن', 'Type', 'WarehouseType']
      },
      {
        key: 'notes',
        labelAr: 'ملاحظات وتفاصيل',
        labelEn: 'Notes',
        type: 'string',
        required: false,
        descriptionAr: 'ملاحظات إضافية أو الموقع الجغرافي',
        descriptionEn: 'Location notes',
        sampleValue: 'عنبر التخزين الشمالي - البوابة 2',
        aliases: ['ملاحظات', 'Notes']
      },
      {
        key: 'active',
        labelAr: 'نشط (نعم/لا)',
        labelEn: 'Active',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا',
        descriptionEn: 'Active status',
        sampleValue: true,
        aliases: ['نشط', 'Active']
      }
    ]
  },

  locations: {
    key: 'locations',
    labelAr: 'مواقع التخزين والإنتاج',
    labelEn: 'Locations & Bins',
    category: 'master',
    descriptionAr: 'الأرفف، الأحواض، ومواقع التشغيل التفصيلية داخل المستودعات',
    descriptionEn: 'Detailed bins, racks, shelves, and work centers inside warehouses',
    iconName: 'MapPin',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'كود الموقع *',
        labelEn: 'Location Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود الموقع أو الرف مثل LOC-A1-01',
        descriptionEn: 'Location bin code',
        sampleValue: 'LOC-RAW-RACK-01',
        aliases: ['كود الموقع', 'الموقع', 'LocationCode', 'Code']
      },
      {
        key: 'nameAr',
        labelAr: 'اسم الموقع بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم الموقع أو الرف بالعربية',
        descriptionEn: 'Arabic location description',
        sampleValue: 'رف سحب الألومنيوم - قطاع ثقيل',
        aliases: ['اسم الموقع', 'NameAr', 'Name']
      },
      {
        key: 'nameEn',
        labelAr: 'الاسم بالإنجليزية',
        labelEn: 'Name (English)',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم بالإنجليزية',
        descriptionEn: 'English name',
        sampleValue: 'Heavy Profiles Rack - Section A',
        aliases: ['NameEn']
      },
      {
        key: 'warehouseCode',
        labelAr: 'كود المستودع التابع له *',
        labelEn: 'Warehouse Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المستودع الذي يقع فيه هذا الرف (مثل WH-RAW-01)',
        descriptionEn: 'Parent warehouse code',
        sampleValue: 'WH-RAW-MAIN',
        aliases: ['المستودع', 'كود المستودع', 'WarehouseCode']
      },
      {
        key: 'stageName',
        labelAr: 'مرحلة الإنتاج المرتبطة',
        labelEn: 'Stage Name',
        type: 'string',
        required: false,
        descriptionAr: 'إذا كان موقع خط إنتاج',
        descriptionEn: 'Associated stage',
        sampleValue: 'خط التقطيع والتجهيز',
        aliases: ['المرحلة', 'StageName']
      },
      {
        key: 'active',
        labelAr: 'نشط (نعم/لا)',
        labelEn: 'Active',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا',
        descriptionEn: 'Active status',
        sampleValue: true,
        aliases: ['نشط', 'Active']
      }
    ]
  },

  uoms: {
    key: 'uoms',
    labelAr: 'وحدات القياس',
    labelEn: 'Units of Measure (UOM)',
    category: 'master',
    descriptionAr: 'وحدات القياس الأساسية والفرعية ومعاملات التحويل بينها',
    descriptionEn: 'Primary and secondary measurement units and conversions',
    iconName: 'Scale',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'رمز الوحدة *',
        labelEn: 'UOM Code *',
        type: 'string',
        required: true,
        descriptionAr: 'رمز وحدة القياس مثل KG, M, TON, PCS',
        descriptionEn: 'UOM code',
        sampleValue: 'KG',
        aliases: ['رمز الوحدة', 'الوحدة', 'Code', 'UOMCode']
      },
      {
        key: 'nameAr',
        labelAr: 'اسم الوحدة بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم الوحدة بالعربية مثل كيلوجرام، متر، طن',
        descriptionEn: 'Arabic UOM name',
        sampleValue: 'كيلوجرام',
        aliases: ['اسم الوحدة', 'NameAr', 'Name']
      },
      {
        key: 'nameEn',
        labelAr: 'الاسم بالإنجليزية',
        labelEn: 'Name (English)',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم بالإنجليزية',
        descriptionEn: 'English UOM name',
        sampleValue: 'Kilogram',
        aliases: ['NameEn']
      },
      {
        key: 'uomType',
        labelAr: 'نوع الوحدة',
        labelEn: 'UOM Type',
        type: 'enum',
        required: false,
        enumValues: ['PRIMARY', 'SECONDARY'],
        descriptionAr: 'PRIMARY (رئيسية) أو SECONDARY (تابعة)',
        descriptionEn: 'PRIMARY or SECONDARY',
        sampleValue: 'PRIMARY',
        aliases: ['نوع الوحدة', 'UOMType']
      },
      {
        key: 'baseUOM',
        labelAr: 'الوحدة الأساسية المرجعية',
        labelEn: 'Base UOM',
        type: 'string',
        required: false,
        descriptionAr: 'رمز الوحدة الأساسية إذا كانت تابعة (مثلاً TON قاعدتها KG)',
        descriptionEn: 'Base unit code if secondary',
        sampleValue: 'KG',
        aliases: ['الوحدة الأساسية', 'BaseUOM']
      },
      {
        key: 'conversionFactor',
        labelAr: 'معامل التحويل',
        labelEn: 'Conversion Factor',
        type: 'number',
        required: false,
        descriptionAr: 'معامل الضرب لتحويل هذه الوحدة إلى الأساسية (مثال 1 طن = 1000 كجم)',
        descriptionEn: 'Multiplier factor against base UOM',
        sampleValue: 1,
        aliases: ['معامل التحويل', 'Factor', 'ConversionFactor']
      },
      {
        key: 'active',
        labelAr: 'نشط (نعم/لا)',
        labelEn: 'Active',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا',
        descriptionEn: 'Active',
        sampleValue: true,
        aliases: ['نشط', 'Active']
      }
    ]
  },

  machines: {
    key: 'machines',
    labelAr: 'الماكينات ومراكز التشغيل',
    labelEn: 'Machines & Work Centers',
    category: 'master',
    descriptionAr: 'خطوط الإنتاج، ماكينات الـ CNC، ومراكز التشغيل الصناعية',
    descriptionEn: 'Work centers, CNC cutting centers, assembly stations',
    iconName: 'Cog',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'كود الماكينة *',
        labelEn: 'Machine Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود الماكينة مثل MC-CNC-01',
        descriptionEn: 'Machine equipment code',
        sampleValue: 'MC-CNC-CUT-01',
        aliases: ['كود الماكينة', 'الماكينة', 'MachineCode', 'Code']
      },
      {
        key: 'nameAr',
        labelAr: 'اسم الماكينة بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم الماكينة ومركز العمل بالعربية',
        descriptionEn: 'Arabic machine name',
        sampleValue: 'ماكينة قص ألومنيوم رأس مزدوج CNC',
        aliases: ['اسم الماكينة', 'NameAr', 'Name']
      },
      {
        key: 'nameEn',
        labelAr: 'الاسم بالإنجليزية',
        labelEn: 'Name (English)',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم بالإنجليزية',
        descriptionEn: 'English machine name',
        sampleValue: 'Double-Head CNC Aluminum Cutting Machine',
        aliases: ['NameEn']
      },
      {
        key: 'productionStage',
        labelAr: 'مرحلة الإنتاج *',
        labelEn: 'Production Stage *',
        type: 'string',
        required: true,
        descriptionAr: 'مرحلة التشغيل (تقطيع، لحام، تجميع، دهان...)',
        descriptionEn: 'Manufacturing process step',
        sampleValue: 'التقطيع والتجهيز',
        aliases: ['المرحلة', 'مرحلة الإنتاج', 'Stage', 'ProductionStage']
      },
      {
        key: 'defaultLocationCode',
        labelAr: 'كود موقع التشغيل',
        labelEn: 'Default Location Code',
        type: 'string',
        required: false,
        descriptionAr: 'كود الموقع الافتراضي لعنبر الماكينة',
        descriptionEn: 'Default floor location code',
        sampleValue: 'LOC-RAW-RACK-01',
        aliases: ['الموقع', 'LocationCode']
      },
      {
        key: 'description',
        labelAr: 'الوصف والطاقة الإنتاجية',
        labelEn: 'Description',
        type: 'string',
        required: false,
        descriptionAr: 'طاقة الماكينة بالساعة وسنة الصنع',
        descriptionEn: 'Capacity and specs',
        sampleValue: 'طاقة إنتاجية 60 متر طولي/ساعة بدقة 0.1 ملم',
        aliases: ['الوصف', 'Description']
      },
      {
        key: 'active',
        labelAr: 'نشط (نعم/لا)',
        labelEn: 'Active',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا',
        descriptionEn: 'Active status',
        sampleValue: true,
        aliases: ['نشط', 'Active']
      }
    ]
  },

  suppliers: {
    key: 'suppliers',
    labelAr: 'الموردين (جهات التوريد)',
    labelEn: 'Suppliers & Vendors',
    category: 'master',
    descriptionAr: 'سجل الموردين المعتمدين لتوريد الخامات ومواد التعبئة',
    descriptionEn: 'Approved raw material suppliers and trade vendors',
    iconName: 'Building2',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'كود المورد *',
        labelEn: 'Supplier Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المورد مثل SUP-001',
        descriptionEn: 'Vendor code',
        sampleValue: 'SUP-EGY-ALUM',
        aliases: ['كود المورد', 'المورد', 'SupplierCode', 'VendorCode', 'Code']
      },
      {
        key: 'nameAr',
        labelAr: 'اسم المورد بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم الشركة أو المورد بالعربية',
        descriptionEn: 'Arabic supplier name',
        sampleValue: 'شركة مصر للألومنيوم ومقاطع السحب',
        aliases: ['اسم المورد', 'NameAr', 'Name']
      },
      {
        key: 'nameEn',
        labelAr: 'الاسم بالإنجليزية',
        labelEn: 'Name (English)',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم بالإنجليزية',
        descriptionEn: 'English supplier name',
        sampleValue: 'Egypt Aluminum & Extrusions Co.',
        aliases: ['NameEn']
      },
      {
        key: 'phone',
        labelAr: 'رقم الهاتف',
        labelEn: 'Phone Number',
        type: 'string',
        required: false,
        descriptionAr: 'رقم الهاتف أو الجوال للتواصل',
        descriptionEn: 'Contact telephone',
        sampleValue: '+20 2 25890000',
        aliases: ['الهاتف', 'الموبايل', 'Phone']
      },
      {
        key: 'email',
        labelAr: 'البريد الإلكتروني',
        labelEn: 'Email',
        type: 'string',
        required: false,
        descriptionAr: 'البريد الرسمي للمورد',
        descriptionEn: 'Official contact email',
        sampleValue: 'sales@egyptaluminum.com.eg',
        aliases: ['البريد', 'الإيميل', 'Email']
      },
      {
        key: 'taxNumber',
        labelAr: 'الرقم الضريبي',
        labelEn: 'Tax Number',
        type: 'string',
        required: false,
        descriptionAr: 'رقم التسجيل الضريبي للمورد',
        descriptionEn: 'Tax / VAT registration number',
        sampleValue: '100-245-890',
        aliases: ['الرقم الضريبي', 'السجل الضريبي', 'TaxNumber', 'VAT']
      },
      {
        key: 'address',
        labelAr: 'العنوان',
        labelEn: 'Address',
        type: 'string',
        required: false,
        descriptionAr: 'العنوان والمدينة',
        descriptionEn: 'Physical address',
        sampleValue: 'المنطقة الصناعية - مدينة نجع حمادي / القاهرة',
        aliases: ['العنوان', 'Address']
      },
      {
        key: 'defaultCurrency',
        labelAr: 'العملة الافتراضية',
        labelEn: 'Default Currency',
        type: 'string',
        required: false,
        descriptionAr: 'عملة التعامل (مثل EGP, USD, EUR)',
        descriptionEn: 'Trading currency code',
        sampleValue: 'EGP',
        aliases: ['العملة', 'Currency', 'DefaultCurrency']
      },
      {
        key: 'paymentTerms',
        labelAr: 'شروط السداد',
        labelEn: 'Payment Terms',
        type: 'string',
        required: false,
        descriptionAr: 'شروط الدفع (مثل آجل 30 يوم، دفعة مقدمة)',
        descriptionEn: 'Payment terms agreement',
        sampleValue: 'آجل 45 يوم من استلام الفاتورة',
        aliases: ['شروط الدفع', 'PaymentTerms']
      },
      {
        key: 'active',
        labelAr: 'نشط (نعم/لا)',
        labelEn: 'Active',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا',
        descriptionEn: 'Active status',
        sampleValue: true,
        aliases: ['نشط', 'Active']
      }
    ]
  },

  customers: {
    key: 'customers',
    labelAr: 'العملاء (جهات البيع والتسليم)',
    labelEn: 'Customers',
    category: 'master',
    descriptionAr: 'سجل العملاء، المقاولين، وشركات التطوير العقاري',
    descriptionEn: 'Client accounts, contractors, and real-estate developers',
    iconName: 'Users',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'كود العميل *',
        labelEn: 'Customer Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود العميل مثل CUST-001',
        descriptionEn: 'Customer code',
        sampleValue: 'CUST-ARAB-CONT',
        aliases: ['كود العميل', 'العميل', 'CustomerCode', 'Code']
      },
      {
        key: 'nameAr',
        labelAr: 'اسم العميل بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم العميل أو المؤسسة بالعربية',
        descriptionEn: 'Arabic customer name',
        sampleValue: 'شركة المقاولون العرب - فرع المشروعات الكبرى',
        aliases: ['اسم العميل', 'NameAr', 'Name']
      },
      {
        key: 'nameEn',
        labelAr: 'الاسم بالإنجليزية',
        labelEn: 'Name (English)',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم بالإنجليزية',
        descriptionEn: 'English customer name',
        sampleValue: 'Arab Contractors Co. - Major Projects',
        aliases: ['NameEn']
      },
      {
        key: 'phone',
        labelAr: 'رقم الهاتف',
        labelEn: 'Phone Number',
        type: 'string',
        required: false,
        descriptionAr: 'رقم الهاتف للتواصل وإشعارات التسليم',
        descriptionEn: 'Contact phone',
        sampleValue: '+20 2 23640000',
        aliases: ['الهاتف', 'Phone']
      },
      {
        key: 'email',
        labelAr: 'البريد الإلكتروني',
        labelEn: 'Email',
        type: 'string',
        required: false,
        descriptionAr: 'البريد الرسمي للعميل',
        descriptionEn: 'Customer email',
        sampleValue: 'procurement@arabcont.com',
        aliases: ['البريد', 'Email']
      },
      {
        key: 'taxNumber',
        labelAr: 'الرقم الضريبي',
        labelEn: 'Tax Number',
        type: 'string',
        required: false,
        descriptionAr: 'الرقم الضريبي أو السجل التجاري',
        descriptionEn: 'Tax registration number',
        sampleValue: '200-456-789',
        aliases: ['الرقم الضريبي', 'TaxNumber']
      },
      {
        key: 'address',
        labelAr: 'العنوان وموقع الاستلام',
        labelEn: 'Address',
        type: 'string',
        required: false,
        descriptionAr: 'عنوان التسليم والمحافظة',
        descriptionEn: 'Delivery address',
        sampleValue: 'التجمع الخامس - القاهرة الجديدة',
        aliases: ['العنوان', 'Address']
      },
      {
        key: 'defaultCurrency',
        labelAr: 'العملة الافتراضية',
        labelEn: 'Default Currency',
        type: 'string',
        required: false,
        descriptionAr: 'عملة الفواتير (EGP, USD)',
        descriptionEn: 'Billing currency',
        sampleValue: 'EGP',
        aliases: ['العملة', 'Currency']
      },
      {
        key: 'active',
        labelAr: 'نشط (نعم/لا)',
        labelEn: 'Active',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا',
        descriptionEn: 'Active status',
        sampleValue: true,
        aliases: ['نشط', 'Active']
      }
    ]
  },

  currencies: {
    key: 'currencies',
    labelAr: 'العملات وأسعار الصرف',
    labelEn: 'Currencies & Rates',
    category: 'master',
    descriptionAr: 'العملات الأجنبية وأسعار الصرف المعتمدة مقابل الجنيه المصري',
    descriptionEn: 'Exchange rate baselines against functional base currency',
    iconName: 'DollarSign',
    idField: 'id',
    codeField: 'code',
    columns: [
      {
        key: 'code',
        labelAr: 'رمز العملة *',
        labelEn: 'Currency Code *',
        type: 'string',
        required: true,
        descriptionAr: 'رمز العملة الثلاثي مثل USD, EUR, EGP, SAR, GBP',
        descriptionEn: 'ISO currency code',
        sampleValue: 'USD',
        aliases: ['رمز العملة', 'العملة', 'Code', 'CurrencyCode']
      },
      {
        key: 'nameAr',
        labelAr: 'اسم العملة بالعربية *',
        labelEn: 'Name (Arabic) *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم العملة بالعربية مثل دولار أمريكي، يورو',
        descriptionEn: 'Arabic currency name',
        sampleValue: 'دولار أمريكي',
        aliases: ['اسم العملة', 'NameAr', 'Name']
      },
      {
        key: 'nameEn',
        labelAr: 'الاسم بالإنجليزية',
        labelEn: 'Name (English)',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم بالإنجليزية',
        descriptionEn: 'English currency name',
        sampleValue: 'US Dollar',
        aliases: ['NameEn']
      },
      {
        key: 'exchangeRate',
        labelAr: 'سعر الصرف مقابل الجنيه المصري *',
        labelEn: 'Exchange Rate (vs EGP) *',
        type: 'number',
        required: true,
        descriptionAr: 'قيمة 1 وحدة من العملة بالجنيه المصري (مثال 50.40)',
        descriptionEn: 'Rate against base EGP (e.g. 50.40)',
        sampleValue: 50.45,
        aliases: ['سعر الصرف', 'السعر', 'Rate', 'ExchangeRate']
      },
      {
        key: 'rateDate',
        labelAr: 'تاريخ السعر',
        labelEn: 'Rate Date',
        type: 'date',
        required: false,
        descriptionAr: 'تاريخ سريان السعر YYYY-MM-DD',
        descriptionEn: 'Date YYYY-MM-DD',
        sampleValue: '2025-01-01',
        aliases: ['التاريخ', 'RateDate']
      },
      {
        key: 'isBase',
        labelAr: 'العملة الأساسية (نعم/لا)',
        labelEn: 'Is Base Currency',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم للجنيه المصري EGP فقط، ولا لباقي العملات',
        descriptionEn: 'Base currency flag',
        sampleValue: false,
        aliases: ['العملة الأساسية', 'IsBase']
      },
      {
        key: 'active',
        labelAr: 'نشط (نعم/لا)',
        labelEn: 'Active',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا',
        descriptionEn: 'Active',
        sampleValue: true,
        aliases: ['نشط', 'Active']
      }
    ]
  },

  users: {
    key: 'users',
    labelAr: 'المستخدمين والصلاحيات (RBAC)',
    labelEn: 'Users & Roles',
    category: 'master',
    descriptionAr: 'حسابات مستخدمي النظام وأدوارهم وصلاحيات الوصول',
    descriptionEn: 'System user accounts and access role assignments',
    iconName: 'Users',
    idField: 'id',
    codeField: 'username',
    columns: [
      {
        key: 'username',
        labelAr: 'اسم المستخدم *',
        labelEn: 'Username *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم الدخول الفريد بدون مسافات (مثل mohamed_mfg)',
        descriptionEn: 'Unique username for login',
        sampleValue: 'eng_ahmed_mfg',
        aliases: ['اسم المستخدم', 'اليوزر', 'Username']
      },
      {
        key: 'fullName',
        labelAr: 'الاسم الكامل *',
        labelEn: 'Full Name *',
        type: 'string',
        required: true,
        descriptionAr: 'اسم الموظف أو المهندس كاملاً بالعربية',
        descriptionEn: 'Full legal name',
        sampleValue: 'م. أحمد الشريف',
        aliases: ['الاسم الكامل', 'الاسم', 'FullName', 'Name']
      },
      {
        key: 'email',
        labelAr: 'البريد الإلكتروني *',
        labelEn: 'Email *',
        type: 'string',
        required: true,
        descriptionAr: 'البريد الإلكتروني المهني للتواصل',
        descriptionEn: 'Corporate email',
        sampleValue: 'ahmed.elsharif@remix-mfg.com',
        aliases: ['البريد', 'الإيميل', 'Email']
      },
      {
        key: 'role',
        labelAr: 'الدور والصلاحية *',
        labelEn: 'System Role *',
        type: 'enum',
        required: true,
        enumValues: [
          'ADMIN',
          'INVENTORY_USER',
          'PRODUCTION_USER',
          'QUALITY_USER',
          'FINANCE_USER',
          'MANAGEMENT_USER'
        ],
        enumLabelsAr: {
          ADMIN: 'مدير النظام (ADMIN)',
          INVENTORY_USER: 'أمين المستودعات (INVENTORY_USER)',
          PRODUCTION_USER: 'مهندس الإنتاج (PRODUCTION_USER)',
          QUALITY_USER: 'فاحص الجودة (QUALITY_USER)',
          FINANCE_USER: 'محاسب التكاليف (FINANCE_USER)',
          MANAGEMENT_USER: 'الإدارة العليا (MANAGEMENT_USER)'
        },
        descriptionAr: 'اختر: ADMIN, INVENTORY_USER, PRODUCTION_USER, QUALITY_USER, FINANCE_USER, MANAGEMENT_USER',
        descriptionEn: 'Role enum',
        sampleValue: 'PRODUCTION_USER',
        aliases: ['الدور', 'الصلاحية', 'Role', 'UserRole']
      },
      {
        key: 'department',
        labelAr: 'القسم أو الإدارة',
        labelEn: 'Department',
        type: 'string',
        required: false,
        descriptionAr: 'اسم الإدارة (المستودعات، التشغيل، التكاليف...)',
        descriptionEn: 'Department name',
        sampleValue: 'إدارة العمليات الصناعية والتشغيل',
        aliases: ['القسم', 'الإدارة', 'Department']
      },
      {
        key: 'active',
        labelAr: 'مفعل (نعم/لا)',
        labelEn: 'Active',
        type: 'boolean',
        required: false,
        descriptionAr: 'نعم أو لا',
        descriptionEn: 'Active flag',
        sampleValue: true,
        aliases: ['مفعل', 'نشط', 'Active']
      }
    ]
  },

  receipts: {
    key: 'receipts',
    labelAr: 'أذون الاستلام المخزني (إذن إضافة)',
    labelEn: 'Inventory Receipts (GRPO)',
    category: 'operations',
    descriptionAr: 'حركات استلام الخامات والمواد المشتراة بالمستودع وإعادة احتساب متوسط التكلفة',
    descriptionEn: 'Goods receipt purchase orders and incoming inventory posting',
    iconName: 'PackagePlus',
    idField: 'id',
    codeField: 'receiptNumber',
    columns: [
      {
        key: 'receiptNumber',
        labelAr: 'رقم إذن الاستلام',
        labelEn: 'Receipt Number',
        type: 'string',
        required: false,
        descriptionAr: 'اتركه فارغاً للتوليد التلقائي (مثل REC-2025-001)',
        descriptionEn: 'Leave empty for auto-generation',
        sampleValue: 'REC-2025-0101',
        aliases: ['رقم الإذن', 'رقم السند', 'رقم الاستلام', 'ReceiptNumber']
      },
      {
        key: 'date',
        labelAr: 'تاريخ الاستلام *',
        labelEn: 'Receipt Date *',
        type: 'date',
        required: true,
        descriptionAr: 'تاريخ الحركة بصيغة YYYY-MM-DD (مثل 2025-01-15)',
        descriptionEn: 'Posting date YYYY-MM-DD',
        sampleValue: '2025-01-15',
        aliases: ['التاريخ', 'تاريخ الاستلام', 'Date', 'ReceiptDate']
      },
      {
        key: 'supplierCode',
        labelAr: 'كود المورد',
        labelEn: 'Supplier Code',
        type: 'string',
        required: false,
        descriptionAr: 'كود المورد المعتمد من جدول الموردين',
        descriptionEn: 'Vendor code',
        sampleValue: 'SUP-EGY-ALUM',
        aliases: ['كود المورد', 'المورد', 'SupplierCode']
      },
      {
        key: 'supplierName',
        labelAr: 'اسم المورد',
        labelEn: 'Supplier Name',
        type: 'string',
        required: false,
        descriptionAr: 'اسم جهة التوريد في حال عدم توفر كود',
        descriptionEn: 'Supplier name',
        sampleValue: 'شركة مصر للألومنيوم',
        aliases: ['اسم المورد', 'SupplierName']
      },
      {
        key: 'itemCode',
        labelAr: 'كود الصنف المستلم *',
        labelEn: 'Item Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود الخامة أو المنتج المراد استلامه في المستودع',
        descriptionEn: 'Item code to receive',
        sampleValue: 'RAW-ALUM-6063',
        aliases: ['كود الصنف', 'الصنف', 'كود الخامة', 'ItemCode']
      },
      {
        key: 'itemName',
        labelAr: 'اسم الصنف',
        labelEn: 'Item Name',
        type: 'string',
        required: false,
        descriptionAr: 'الاسم للتوضيح (يتم جلبه تلقائياً إن وجد الكود)',
        descriptionEn: 'Item name description',
        sampleValue: 'سبيكة ألومنيوم 6063 T6',
        aliases: ['اسم الصنف', 'ItemName']
      },
      {
        key: 'warehouseCode',
        labelAr: 'كود المستودع المستلم *',
        labelEn: 'Warehouse Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المستودع الذي ستدخل إليه الكميات',
        descriptionEn: 'Destination warehouse code',
        sampleValue: 'WH-RAW-MAIN',
        aliases: ['كود المستودع', 'المستودع', 'WarehouseCode']
      },
      {
        key: 'quantity',
        labelAr: 'الكمية المستلمة *',
        labelEn: 'Quantity *',
        type: 'number',
        required: true,
        descriptionAr: 'الكمية الفعلية المقبولة للاستلام (> 0)',
        descriptionEn: 'Accepted receipt quantity',
        sampleValue: 2500,
        aliases: ['الكمية', 'الكمية المستلمة', 'Quantity', 'Qty']
      },
      {
        key: 'uom',
        labelAr: 'وحدة القياس',
        labelEn: 'UOM',
        type: 'string',
        required: false,
        descriptionAr: 'وحدة القياس المستلم بها (KG, TON, PCS...)',
        descriptionEn: 'Transaction UOM',
        sampleValue: 'KG',
        aliases: ['الوحدة', 'UOM']
      },
      {
        key: 'unitPrice',
        labelAr: 'سعر الوحدة بالعملة *',
        labelEn: 'Unit Price *',
        type: 'number',
        required: true,
        descriptionAr: 'سعر الوحدة حسب فاتورة التوريد',
        descriptionEn: 'Transaction unit price',
        sampleValue: 142.0,
        aliases: ['سعر الوحدة', 'السعر', 'UnitPrice', 'Price']
      },
      {
        key: 'currency',
        labelAr: 'عملة الفاتورة',
        labelEn: 'Currency',
        type: 'string',
        required: false,
        descriptionAr: 'رمز العملة (EGP, USD...) - الافتراضي EGP',
        descriptionEn: 'Currency code',
        sampleValue: 'EGP',
        aliases: ['العملة', 'Currency']
      },
      {
        key: 'exchangeRate',
        labelAr: 'سعر الصرف',
        labelEn: 'Exchange Rate',
        type: 'number',
        required: false,
        descriptionAr: 'سعر الصرف للجنيه المصري (الافتراضي 1.0 للجنيه)',
        descriptionEn: 'Currency exchange rate',
        sampleValue: 1.0,
        aliases: ['سعر الصرف', 'ExchangeRate']
      },
      {
        key: 'reference',
        labelAr: 'المرجع / رقم الفاتورة',
        labelEn: 'Reference / Invoice No',
        type: 'string',
        required: false,
        descriptionAr: 'رقم بوليصة الشحن أو أمر الشراء أو فاتورة المورد',
        descriptionEn: 'Vendor invoice or PO reference',
        sampleValue: 'INV-EGY-98210',
        aliases: ['المرجع', 'رقم الفاتورة', 'رقم البوليصة', 'Reference']
      },
      {
        key: 'notes',
        labelAr: 'ملاحظات',
        labelEn: 'Notes',
        type: 'string',
        required: false,
        descriptionAr: 'ملاحظات الاستلام وفحص المطابقة',
        descriptionEn: 'Additional notes',
        sampleValue: 'تمت مطابقة شهادة التحليل الكيميائي لدفعة السحب',
        aliases: ['ملاحظات', 'Notes']
      }
    ]
  },

  issues: {
    key: 'issues',
    labelAr: 'أذون الصرف المخزني (إذن صرف عام)',
    labelEn: 'Inventory Issues',
    category: 'operations',
    descriptionAr: 'حركات صرف المواد والخامات من المستودعات لعمليات التشغيل أو الصيانة',
    descriptionEn: 'Stock issue notes and internal consumption dispatches',
    iconName: 'Layers',
    idField: 'id',
    codeField: 'issueNumber',
    columns: [
      {
        key: 'issueNumber',
        labelAr: 'رقم إذن الصرف',
        labelEn: 'Issue Number',
        type: 'string',
        required: false,
        descriptionAr: 'اتركه فارغاً للتوليد التلقائي (مثل ISS-2025-001)',
        descriptionEn: 'Issue note identifier',
        sampleValue: 'ISS-2025-0082',
        aliases: ['رقم الإذن', 'رقم الصرف', 'IssueNumber']
      },
      {
        key: 'date',
        labelAr: 'تاريخ الصرف *',
        labelEn: 'Issue Date *',
        type: 'date',
        required: true,
        descriptionAr: 'تاريخ الحركة بصيغة YYYY-MM-DD',
        descriptionEn: 'Issue date YYYY-MM-DD',
        sampleValue: '2025-01-18',
        aliases: ['التاريخ', 'تاريخ الصرف', 'Date']
      },
      {
        key: 'fromWarehouseCode',
        labelAr: 'كود المستودع المصروف منه *',
        labelEn: 'From Warehouse Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المستودع المصروف منه الخامات',
        descriptionEn: 'Source warehouse code',
        sampleValue: 'WH-RAW-MAIN',
        aliases: ['المستودع', 'من مستودع', 'FromWarehouseCode']
      },
      {
        key: 'itemCode',
        labelAr: 'كود الصنف المصروف *',
        labelEn: 'Item Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المادة المراد صرفها',
        descriptionEn: 'Item code',
        sampleValue: 'RAW-ALUM-6063',
        aliases: ['كود الصنف', 'الصنف', 'ItemCode']
      },
      {
        key: 'quantity',
        labelAr: 'الكمية المصروفة *',
        labelEn: 'Quantity *',
        type: 'number',
        required: true,
        descriptionAr: 'الكمية المراد إخراجها من المخزن (> 0)',
        descriptionEn: 'Quantity dispatched',
        sampleValue: 450,
        aliases: ['الكمية', 'الكمية المصروفة', 'Quantity', 'Qty']
      },
      {
        key: 'uom',
        labelAr: 'وحدة القياس',
        labelEn: 'UOM',
        type: 'string',
        required: false,
        descriptionAr: 'وحدة القياس (مثل KG, PCS)',
        descriptionEn: 'UOM',
        sampleValue: 'KG',
        aliases: ['الوحدة', 'UOM']
      },
      {
        key: 'reason',
        labelAr: 'سبب الصرف',
        labelEn: 'Reason',
        type: 'string',
        required: false,
        descriptionAr: 'سبب الصرف (تشغيلي، صيانة، تجارب، إتلاف...)',
        descriptionEn: 'Consumption purpose',
        sampleValue: 'صرف تجارب عينات خط الإنتاج الجديد',
        aliases: ['السبب', 'سبب الصرف', 'Reason']
      },
      {
        key: 'reference',
        labelAr: 'المرجع / أمر العمل',
        labelEn: 'Reference',
        type: 'string',
        required: false,
        descriptionAr: 'رقم أمر العمل أو طلب الصرف الداخلي',
        descriptionEn: 'Internal requisition reference',
        sampleValue: 'REQ-LINE-2-004',
        aliases: ['المرجع', 'Reference']
      },
      {
        key: 'notes',
        labelAr: 'ملاحظات',
        labelEn: 'Notes',
        type: 'string',
        required: false,
        descriptionAr: 'ملاحظات إضافية',
        descriptionEn: 'Notes',
        sampleValue: 'صرف معتمد من مهندس الصيانة',
        aliases: ['ملاحظات', 'Notes']
      }
    ]
  },

  transfers: {
    key: 'transfers',
    labelAr: 'التحويلات المخزنية بين المستودعات والمواقع',
    labelEn: 'Stock Transfers',
    category: 'operations',
    descriptionAr: 'نقل وتحويل الكميات وتكلفتها بين عنابر ومستودعات المصنع المختلفة',
    descriptionEn: 'Inter-warehouse and intra-plant location inventory transfers',
    iconName: 'ArrowRightLeft',
    idField: 'id',
    codeField: 'transferNumber',
    columns: [
      {
        key: 'transferNumber',
        labelAr: 'رقم سند التحويل',
        labelEn: 'Transfer Number',
        type: 'string',
        required: false,
        descriptionAr: 'توليد تلقائي إن ترك فارغاً (مثل TRN-2025-001)',
        descriptionEn: 'Transfer number',
        sampleValue: 'TRN-2025-0045',
        aliases: ['رقم السند', 'رقم التحويل', 'TransferNumber']
      },
      {
        key: 'date',
        labelAr: 'تاريخ التحويل *',
        labelEn: 'Transfer Date *',
        type: 'date',
        required: true,
        descriptionAr: 'التاريخ بصيغة YYYY-MM-DD',
        descriptionEn: 'Date YYYY-MM-DD',
        sampleValue: '2025-01-20',
        aliases: ['التاريخ', 'Date']
      },
      {
        key: 'fromWarehouseCode',
        labelAr: 'من مستودع (المصدر) *',
        labelEn: 'From Warehouse Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المستودع المحول منه الكمية',
        descriptionEn: 'Source warehouse code',
        sampleValue: 'WH-RAW-MAIN',
        aliases: ['من مستودع', 'المستودع المصدر', 'FromWarehouseCode']
      },
      {
        key: 'toWarehouseCode',
        labelAr: 'إلى مستودع (الوجهة) *',
        labelEn: 'To Warehouse Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المستودع المستلم للكمية',
        descriptionEn: 'Target warehouse code',
        sampleValue: 'WH-WIP-PLANT1',
        aliases: ['إلى مستودع', 'المستودع المستلم', 'ToWarehouseCode']
      },
      {
        key: 'itemCode',
        labelAr: 'كود الصنف المحول *',
        labelEn: 'Item Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود الصنف المراد نقله',
        descriptionEn: 'Item code',
        sampleValue: 'RAW-ALUM-6063',
        aliases: ['كود الصنف', 'الصنف', 'ItemCode']
      },
      {
        key: 'quantity',
        labelAr: 'الكمية المحولة *',
        labelEn: 'Quantity *',
        type: 'number',
        required: true,
        descriptionAr: 'الكمية المراد تحويلها (> 0)',
        descriptionEn: 'Transfer quantity',
        sampleValue: 800,
        aliases: ['الكمية', 'الكمية المحولة', 'Quantity', 'Qty']
      },
      {
        key: 'uom',
        labelAr: 'وحدة القياس',
        labelEn: 'UOM',
        type: 'string',
        required: false,
        descriptionAr: 'وحدة القياس',
        descriptionEn: 'UOM',
        sampleValue: 'KG',
        aliases: ['الوحدة', 'UOM']
      },
      {
        key: 'reference',
        labelAr: 'المرجع / أمر النقل',
        labelEn: 'Reference',
        type: 'string',
        required: false,
        descriptionAr: 'رقم إذن النقل أو طلب التشغيل',
        descriptionEn: 'Transfer requisition ref',
        sampleValue: 'REQ-TRN-104',
        aliases: ['المرجع', 'Reference']
      },
      {
        key: 'notes',
        labelAr: 'ملاحظات',
        labelEn: 'Notes',
        type: 'string',
        required: false,
        descriptionAr: 'ملاحظات التحويل وسائق النقل',
        descriptionEn: 'Transfer notes',
        sampleValue: 'نقل خامات لتغذية خط التشغيل وردية ب',
        aliases: ['ملاحظات', 'Notes']
      }
    ]
  },

  productionOrders: {
    key: 'productionOrders',
    labelAr: 'أوامر الإنتاج والتصنيع',
    labelEn: 'Production Orders',
    category: 'operations',
    descriptionAr: 'أوامر التشغيل الصناعية، خطط الإنتاج، وصرف الخامات التلقائي',
    descriptionEn: 'Work orders, production runs, bill of materials consumption, and scheduling',
    iconName: 'Factory',
    idField: 'id',
    codeField: 'orderNumber',
    columns: [
      {
        key: 'orderNumber',
        labelAr: 'رقم أمر الإنتاج',
        labelEn: 'Order Number',
        type: 'string',
        required: false,
        descriptionAr: 'توليد تلقائي إن ترك فارغاً (مثل PRD-2025-001)',
        descriptionEn: 'Order identifier',
        sampleValue: 'PRD-2025-0050',
        aliases: ['رقم الأمر', 'رقم أمر الإنتاج', 'OrderNumber']
      },
      {
        key: 'productionDate',
        labelAr: 'تاريخ الإنتاج والبدء *',
        labelEn: 'Production Date *',
        type: 'date',
        required: true,
        descriptionAr: 'تاريخ جدول التشغيل YYYY-MM-DD',
        descriptionEn: 'Scheduled date YYYY-MM-DD',
        sampleValue: '2025-01-22',
        aliases: ['تاريخ الإنتاج', 'التاريخ', 'ProductionDate', 'Date']
      },
      {
        key: 'productCode',
        labelAr: 'كود المنتج التام *',
        labelEn: 'Product Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المنتج النهائي المراد تشغيله',
        descriptionEn: 'Finished product code',
        sampleValue: 'FG-WIN-120-BL',
        aliases: ['كود المنتج', 'المنتج', 'ProductCode']
      },
      {
        key: 'plannedQuantity',
        labelAr: 'الكمية المخططة *',
        labelEn: 'Planned Quantity *',
        type: 'number',
        required: true,
        descriptionAr: 'عدد الوحدات المطلوب إنتاجها (> 0)',
        descriptionEn: 'Target planned finished qty',
        sampleValue: 50,
        aliases: ['الكمية المخططة', 'الكمية', 'PlannedQuantity', 'Qty']
      },
      {
        key: 'uom',
        labelAr: 'وحدة القياس',
        labelEn: 'UOM',
        type: 'string',
        required: false,
        descriptionAr: 'وحدة القياس (مثل PCS, SET, M2)',
        descriptionEn: 'UOM',
        sampleValue: 'PCS',
        aliases: ['الوحدة', 'UOM']
      },
      {
        key: 'bomCode',
        labelAr: 'كود شجرة المنتج (BOM)',
        labelEn: 'BOM Code',
        type: 'string',
        required: false,
        descriptionAr: 'كود معادلة التصنيع (يتم جلبه تلقائياً للمنتج إن ترك فارغاً)',
        descriptionEn: 'Recipe BOM code',
        sampleValue: 'BOM-WIN-120-V1',
        aliases: ['كود المعادلة', 'BOMCode']
      },
      {
        key: 'machineCode',
        labelAr: 'كود الماكينة',
        labelEn: 'Machine Code',
        type: 'string',
        required: false,
        descriptionAr: 'كود الماكينة المخصصة للتشغيل',
        descriptionEn: 'Allocated machine equipment',
        sampleValue: 'MC-CNC-CUT-01',
        aliases: ['الماكينة', 'MachineCode']
      },
      {
        key: 'productionStage',
        labelAr: 'مرحلة الإنتاج',
        labelEn: 'Production Stage',
        type: 'string',
        required: false,
        descriptionAr: 'المرحلة الصناعية',
        descriptionEn: 'Manufacturing stage',
        sampleValue: 'التقطيع والتجميع النهائي',
        aliases: ['المرحلة', 'Stage', 'ProductionStage']
      },
      {
        key: 'wipWarehouseCode',
        labelAr: 'مستودع التشغيل (WIP)',
        labelEn: 'WIP Warehouse Code',
        type: 'string',
        required: false,
        descriptionAr: 'مستودع الإنتاج قيد التشغيل',
        descriptionEn: 'Work-in-progress warehouse code',
        sampleValue: 'WH-WIP-PLANT1',
        aliases: ['مستودع التشغيل', 'WIPWarehouseCode']
      },
      {
        key: 'status',
        labelAr: 'حالة أمر الإنتاج',
        labelEn: 'Status',
        type: 'enum',
        required: false,
        enumValues: [
          'DRAFT',
          'APPROVED',
          'RELEASED',
          'IN_PRODUCTION',
          'MATERIAL_ISSUED',
          'PENDING_QUALITY',
          'COMPLETED',
          'CLOSED'
        ],
        descriptionAr: 'DRAFT, APPROVED, RELEASED, IN_PRODUCTION, COMPLETED',
        descriptionEn: 'Order status',
        sampleValue: 'APPROVED',
        aliases: ['الحالة', 'Status']
      },
      {
        key: 'notes',
        labelAr: 'ملاحظات التشغيل',
        labelEn: 'Notes',
        type: 'string',
        required: false,
        descriptionAr: 'تعليمات خاصة للوردية أو أمر العميل المرتبط',
        descriptionEn: 'Floor instructions',
        sampleValue: 'أمر تشغيل مشروع أبراج العاصمة - قطاع عازل للصوت',
        aliases: ['ملاحظات', 'Notes']
      }
    ]
  },

  customerDeliveries: {
    key: 'customerDeliveries',
    labelAr: 'صرف وتسليم بضاعة للعميل (المبيعات والتسليم)',
    labelEn: 'Customer Deliveries (Sales Outflow)',
    category: 'operations',
    descriptionAr: 'تسليم المنتجات التامة للعملاء وتخفيض المخزون واحتساب تكلفة المبيعات (COGS)',
    descriptionEn: 'Sales shipments, inventory depletion, and COGS realization',
    iconName: 'SendHorizontal',
    idField: 'id',
    codeField: 'deliveryNumber',
    columns: [
      {
        key: 'deliveryNumber',
        labelAr: 'رقم إذن التسليم',
        labelEn: 'Delivery Number',
        type: 'string',
        required: false,
        descriptionAr: 'توليد تلقائي إن ترك فارغاً (مثل DEL-2025-001)',
        descriptionEn: 'Delivery note number',
        sampleValue: 'DEL-2025-0018',
        aliases: ['رقم الإذن', 'رقم التسليم', 'DeliveryNumber']
      },
      {
        key: 'date',
        labelAr: 'تاريخ التسليم *',
        labelEn: 'Delivery Date *',
        type: 'date',
        required: true,
        descriptionAr: 'تاريخ خروج البضاعة YYYY-MM-DD',
        descriptionEn: 'Shipment date YYYY-MM-DD',
        sampleValue: '2025-01-25',
        aliases: ['التاريخ', 'تاريخ التسليم', 'Date']
      },
      {
        key: 'customerCode',
        labelAr: 'كود العميل',
        labelEn: 'Customer Code',
        type: 'string',
        required: false,
        descriptionAr: 'كود العميل من جدول العملاء',
        descriptionEn: 'Customer account code',
        sampleValue: 'CUST-ARAB-CONT',
        aliases: ['كود العميل', 'العميل', 'CustomerCode']
      },
      {
        key: 'customerName',
        labelAr: 'اسم العميل',
        labelEn: 'Customer Name',
        type: 'string',
        required: false,
        descriptionAr: 'اسم العميل أو الجهة المستلمة',
        descriptionEn: 'Customer name',
        sampleValue: 'شركة المقاولون العرب',
        aliases: ['اسم العميل', 'CustomerName']
      },
      {
        key: 'fromWarehouseCode',
        labelAr: 'مستودع الصرف (المنتجات التامة) *',
        labelEn: 'From Warehouse Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود مستودع المنتجات التامة المنصرف منها',
        descriptionEn: 'Dispatch warehouse code',
        sampleValue: 'WH-FG-01',
        aliases: ['المستودع', 'مستودع الصرف', 'FromWarehouseCode']
      },
      {
        key: 'itemCode',
        labelAr: 'كود المنتج المسلم *',
        labelEn: 'Item Code *',
        type: 'string',
        required: true,
        descriptionAr: 'كود المنتج التام المسلم للعميل',
        descriptionEn: 'Product code',
        sampleValue: 'FG-WIN-120-BL',
        aliases: ['كود المنتج', 'المنتج', 'الصنف', 'ItemCode']
      },
      {
        key: 'quantity',
        labelAr: 'الكمية المسلمة *',
        labelEn: 'Quantity Delivered *',
        type: 'number',
        required: true,
        descriptionAr: 'عدد الوحدات المسلمة للعميل (> 0)',
        descriptionEn: 'Quantity delivered',
        sampleValue: 20,
        aliases: ['الكمية', 'الكمية المسلمة', 'Quantity', 'Qty']
      },
      {
        key: 'uom',
        labelAr: 'وحدة القياس',
        labelEn: 'UOM',
        type: 'string',
        required: false,
        descriptionAr: 'وحدة القياس (PCS, SET...)',
        descriptionEn: 'UOM',
        sampleValue: 'PCS',
        aliases: ['الوحدة', 'UOM']
      },
      {
        key: 'unitSellingPrice',
        labelAr: 'سعر بيع الوحدة *',
        labelEn: 'Unit Selling Price *',
        type: 'number',
        required: true,
        descriptionAr: 'سعر البيع للوحدة بالعملة المحددة',
        descriptionEn: 'Selling price per unit',
        sampleValue: 3400.0,
        aliases: ['سعر البيع', 'سعر الوحدة', 'SellingPrice', 'UnitSellingPrice']
      },
      {
        key: 'currency',
        labelAr: 'عملة البيع',
        labelEn: 'Currency',
        type: 'string',
        required: false,
        descriptionAr: 'العملة (EGP, USD...) - الافتراضي EGP',
        descriptionEn: 'Billing currency',
        sampleValue: 'EGP',
        aliases: ['العملة', 'Currency']
      },
      {
        key: 'exchangeRate',
        labelAr: 'سعر الصرف',
        labelEn: 'Exchange Rate',
        type: 'number',
        required: false,
        descriptionAr: 'سعر الصرف للجنيه المصري (الافتراضي 1.0)',
        descriptionEn: 'Exchange rate',
        sampleValue: 1.0,
        aliases: ['سعر الصرف', 'ExchangeRate']
      },
      {
        key: 'reference',
        labelAr: 'رقم الفاتورة / أمر البيع',
        labelEn: 'Reference / SO Number',
        type: 'string',
        required: false,
        descriptionAr: 'رقم أمر البيع أو العقد مع العميل',
        descriptionEn: 'Sales order reference',
        sampleValue: 'SO-2025-099',
        aliases: ['المرجع', 'رقم أمر البيع', 'رقم الفاتورة', 'Reference']
      },
      {
        key: 'notes',
        labelAr: 'ملاحظات التسليم',
        labelEn: 'Notes',
        type: 'string',
        required: false,
        descriptionAr: 'تفاصيل التسليم وموقع المشروع',
        descriptionEn: 'Delivery remarks',
        sampleValue: 'تسليم الموقع - عمارة B4 الدور الثالث',
        aliases: ['ملاحظات', 'Notes']
      }
    ]
  },

  landedCosts: {
    key: 'landedCosts',
    labelAr: 'تكاليف الإنزال (شحن، جمارك، تفريغ)',
    labelEn: 'Landed Costs (Customs & Freight)',
    category: 'operations',
    descriptionAr: 'توزيع التكاليف الإضافية (شحن، جمارك) على إيصالات الاستلام وإعادة تسعير المخزون',
    descriptionEn: 'Freight, customs, port handling capitalization on incoming inventory',
    iconName: 'DollarSign',
    idField: 'id',
    codeField: 'landedCostNumber',
    columns: [
      {
        key: 'landedCostNumber',
        labelAr: 'رقم سند تكلفة الإنزال',
        labelEn: 'Landed Cost Number',
        type: 'string',
        required: false,
        descriptionAr: 'توليد تلقائي إن ترك فارغاً (مثل LND-2025-001)',
        descriptionEn: 'Identifier',
        sampleValue: 'LND-2025-0012',
        aliases: ['رقم السند', 'رقم التكلفة', 'LandedCostNumber']
      },
      {
        key: 'date',
        labelAr: 'تاريخ السند *',
        labelEn: 'Date *',
        type: 'date',
        required: true,
        descriptionAr: 'التاريخ بصيغة YYYY-MM-DD',
        descriptionEn: 'Date YYYY-MM-DD',
        sampleValue: '2025-01-26',
        aliases: ['التاريخ', 'Date']
      },
      {
        key: 'originalReceiptNumber',
        labelAr: 'رقم إذن الاستلام المرتبط *',
        labelEn: 'Original Receipt Number *',
        type: 'string',
        required: true,
        descriptionAr: 'رقم إذن الاستلام المستهدف لتحميل التكلفة عليه (مثل REC-2025-0101)',
        descriptionEn: 'Target goods receipt number',
        sampleValue: 'REC-2025-0101',
        aliases: ['رقم إذن الاستلام', 'إذن الاستلام', 'ReceiptNumber', 'OriginalReceiptNumber']
      },
      {
        key: 'costType',
        labelAr: 'نوع التكلفة الإضافية *',
        labelEn: 'Cost Type *',
        type: 'string',
        required: true,
        descriptionAr: 'مثال: جمارك وضريبة وارد، نولون شحن بحري، تفريغ ومناولة، نقل داخلي',
        descriptionEn: 'Category e.g. Customs Duties, Freight, Port Handling',
        sampleValue: 'رسوم جمركية وضريبة وارد',
        aliases: ['نوع التكلفة', 'التكلفة', 'CostType']
      },
      {
        key: 'amount',
        labelAr: 'المبلغ بالعملة *',
        labelEn: 'Amount *',
        type: 'number',
        required: true,
        descriptionAr: 'قيمة المصروف الإضافي (> 0)',
        descriptionEn: 'Cost amount',
        sampleValue: 18500.0,
        aliases: ['المبلغ', 'القيمة', 'Amount']
      },
      {
        key: 'currency',
        labelAr: 'العملة',
        labelEn: 'Currency',
        type: 'string',
        required: false,
        descriptionAr: 'العملة (EGP, USD...) - الافتراضي EGP',
        descriptionEn: 'Currency code',
        sampleValue: 'EGP',
        aliases: ['العملة', 'Currency']
      },
      {
        key: 'exchangeRate',
        labelAr: 'سعر الصرف',
        labelEn: 'Exchange Rate',
        type: 'number',
        required: false,
        descriptionAr: 'سعر الصرف للجنيه المصري (الافتراضي 1.0)',
        descriptionEn: 'Exchange rate',
        sampleValue: 1.0,
        aliases: ['سعر الصرف', 'ExchangeRate']
      },
      {
        key: 'allocationMethod',
        labelAr: 'طريقة التوزيع',
        labelEn: 'Allocation Method',
        type: 'enum',
        required: false,
        enumValues: ['DIRECT_AMOUNT', 'PER_QUANTITY', 'PERCENTAGE_MATERIAL'],
        descriptionAr: 'DIRECT_AMOUNT أو PER_QUANTITY أو PERCENTAGE_MATERIAL',
        descriptionEn: 'Allocation method',
        sampleValue: 'DIRECT_AMOUNT',
        aliases: ['طريقة التوزيع', 'AllocationMethod']
      },
      {
        key: 'notes',
        labelAr: 'ملاحظات ورقم الفاتورة الجمركية',
        labelEn: 'Notes / Customs Bill Ref',
        type: 'string',
        required: false,
        descriptionAr: 'رقم إشعار الجمارك أو شركة الشحن',
        descriptionEn: 'Bill reference',
        sampleValue: 'شهادة جمركية رقم 8872 مصلحة الجمارك - ميناء الإسكندرية',
        aliases: ['ملاحظات', 'Notes']
      }
    ]
  }
};

// -------------------------------------------------------------
// TEMPLATE GENERATOR (EXCEL XLSX & CSV WITH UTF-8 BOM)
// -------------------------------------------------------------

export function generateTemplate(
  entityKey: EntityKey,
  format: 'xlsx' | 'csv',
  options?: {
    withSampleData?: boolean;
    language?: Language;
  }
): { blob: Blob; filename: string } {
  const def = ENTITY_DEFINITIONS[entityKey];
  if (!def) {
    throw new Error(`Entity '${entityKey}' is not supported for template generation.`);
  }

  const isAr = options?.language !== 'en';
  const withSample = options?.withSampleData !== false; // Default: true for helpful examples

  // Row 1: Primary Column Headers (Localized)
  const headerLabels = def.columns.map(col => (isAr ? col.labelAr : col.labelEn));
  // Row 2: Developer Schema Keys (used for reliable parsing)
  const schemaKeys = def.columns.map(col => col.key);
  // Row 3: Help / Instructions / Permitted Values
  const instructions = def.columns.map(col => {
    let text = isAr ? col.descriptionAr : col.descriptionEn;
    if (col.enumValues && col.enumValues.length > 0) {
      text += ` [${col.enumValues.join(' | ')}]`;
    }
    return `ℹ️ ${text}`;
  });
  // Row 4: Sample Data
  const sampleRow = def.columns.map(col => {
    const val = col.sampleValue;
    if (col.type === 'boolean') {
      return val ? (isAr ? 'نعم' : 'YES') : (isAr ? 'لا' : 'NO');
    }
    return val !== undefined && val !== null ? val : '';
  });

  if (format === 'csv') {
    // Generate UTF-8 CSV with Byte Order Mark (\uFEFF) for 100% Arabic Excel compatibility
    const csvRows = [headerLabels, sampleRow];
    const escapeCsvField = (field: any) => {
      const str = String(field ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csvContent =
      '\uFEFF' +
      csvRows.map(row => row.map(escapeCsvField).join(',')).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `Template_${def.key}_${isAr ? 'قالب' : 'Template'}.csv`;
    return { blob, filename };
  }

  // Generate Multi-Sheet Excel Workbook (.xlsx) with Schema Guide
  const wb = XLSX.utils.book_new();

  // Sheet 1: Main Data Entry Sheet
  const dataSheetAoa = [
    headerLabels,
    instructions,
    ...(withSample ? [sampleRow] : [])
  ];
  const wsData = XLSX.utils.aoa_to_sheet(dataSheetAoa);

  // Set column widths
  wsData['!cols'] = def.columns.map(col => ({
    wch: Math.max(col.labelAr.length * 2, (col.descriptionAr || '').length / 2, 22)
  }));

  const sheet1Name = isAr ? 'إدخال البيانات' : 'Data Entry';
  XLSX.utils.book_append_sheet(wb, wsData, sheet1Name);

  // Sheet 2: Field Guide & Allowed Values (Prevents schema conflicts)
  const guideHeaders = isAr
    ? ['اسم العمود', 'كود الحقل بالنظام', 'النوع', 'إلزامي؟', 'القيم المقبولة', 'الشرح والتعليمات']
    : ['Column Header', 'System Field Key', 'Type', 'Required', 'Allowed Values', 'Description'];

  const guideRows = def.columns.map(col => [
    isAr ? col.labelAr : col.labelEn,
    col.key,
    col.type,
    col.required ? (isAr ? 'نعم (إلزامي)' : 'YES (Required)') : (isAr ? 'اختياري' : 'Optional'),
    col.enumValues ? col.enumValues.join(', ') : isAr ? 'أي قيمة مناسبة' : 'Any appropriate value',
    isAr ? col.descriptionAr : col.descriptionEn
  ]);

  const wsGuide = XLSX.utils.aoa_to_sheet([guideHeaders, ...guideRows]);
  wsGuide['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 35 }, { wch: 45 }];

  const sheet2Name = isAr ? 'دليل السكيما والشروط' : 'Schema Guide';
  XLSX.utils.book_append_sheet(wb, wsGuide, sheet2Name);

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const filename = `Template_${def.key}_${isAr ? 'قالب_بيانات' : 'Template'}.xlsx`;

  return { blob, filename };
}

// -------------------------------------------------------------
// EXPORT LIVE DATA TO EXCEL / CSV
// -------------------------------------------------------------

export function exportEntityData(
  entityKey: EntityKey,
  records: any[],
  format: 'xlsx' | 'csv',
  options?: { language?: Language }
): { blob: Blob; filename: string } {
  const def = ENTITY_DEFINITIONS[entityKey];
  if (!def) {
    throw new Error(`Entity '${entityKey}' is not supported for export.`);
  }

  const isAr = options?.language !== 'en';
  const headerLabels = def.columns.map(c => (isAr ? c.labelAr : c.labelEn));

  const rows = records.map(record => {
    return def.columns.map(col => {
      let val = record[col.key];

      // Format booleans
      if (col.type === 'boolean') {
        if (val === true) return isAr ? 'نعم' : 'YES';
        if (val === false) return isAr ? 'لا' : 'NO';
      }

      // Format enums
      if (col.type === 'enum' && val && col.enumLabelsAr && isAr) {
        val = col.enumLabelsAr[val] || val;
      }

      if (val === undefined || val === null) return '';
      return val;
    });
  });

  if (format === 'csv') {
    const csvRows = [headerLabels, ...rows];
    const escapeCsvField = (field: any) => {
      const str = String(field ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csvContent =
      '\uFEFF' +
      csvRows.map(row => row.map(escapeCsvField).join(',')).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `Export_${def.key}_${new Date().toISOString().slice(0, 10)}.csv`;
    return { blob, filename };
  }

  // Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headerLabels, ...rows]);
  ws['!cols'] = def.columns.map(col => ({
    wch: Math.max(col.labelAr.length * 2, 18)
  }));

  const sheetName = (isAr ? def.labelAr : def.labelEn).slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const filename = `Export_${def.key}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return { blob, filename };
}

// -------------------------------------------------------------
// SMART FILE PARSER (XLSX, XLS, CSV)
// -------------------------------------------------------------

export async function parseImportFile(file: File): Promise<{
  sheetNames: string[];
  selectedSheet: string;
  rawRows: any[];
  headers: string[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('الملف فارغ أو لا يحتوي على أي صفحات صالحة.');
  }

  // Use the first sheet or one containing "data" / "بيانات"
  let selectedSheet = sheetNames[0];
  const preferredSheet = sheetNames.find(s =>
    s.includes('بيانات') || s.toLowerCase().includes('data') || s.toLowerCase().includes('entry')
  );
  if (preferredSheet) {
    selectedSheet = preferredSheet;
  }

  const worksheet = workbook.Sheets[selectedSheet];
  const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawJson || rawJson.length === 0) {
    throw new Error('الصفحة المحددة لا تحتوي على أي صفوف أو بيانات.');
  }

  // Find header row: skip any leading title banner until we find a row matching column names
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawJson.length, 5); i++) {
    const row = rawJson[i];
    if (Array.isArray(row) && row.filter(c => String(c).trim().length > 0).length >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = (rawJson[headerRowIndex] || []).map(h => String(h || '').trim());

  // Filter out instruction rows (rows that start with ℹ️ or note symbols)
  const dataRows: any[] = [];
  for (let i = headerRowIndex + 1; i < rawJson.length; i++) {
    const row = rawJson[i];
    if (!row || row.length === 0) continue;

    // Check if entire row is empty
    const hasValues = row.some(cell => String(cell || '').trim().length > 0);
    if (!hasValues) continue;

    // Check if it's an instructions or explanation row (starts with ℹ️ or "تعليمات")
    const firstCell = String(row[0] || '').trim();
    if (firstCell.startsWith('ℹ') || firstCell.includes('تعليمات') || firstCell.includes('Instructions')) {
      continue;
    }

    // Build row object keyed by raw headers
    const rowObj: Record<string, any> = {};
    rawHeaders.forEach((header, colIdx) => {
      if (header) {
        rowObj[header] = row[colIdx];
      }
    });

    dataRows.push(rowObj);
  }

  return {
    sheetNames,
    selectedSheet,
    rawRows: dataRows,
    headers: rawHeaders
  };
}

// -------------------------------------------------------------
// SCHEMA VALIDATOR & DATA SANITIZER
// -------------------------------------------------------------

export function validateImportData(
  entityKey: EntityKey,
  rawRows: any[],
  systemContext: {
    warehouses?: Warehouse[];
    locations?: ProductionLocation[];
    uoms?: UOM[];
    categories?: ItemCategory[];
    rawMaterials?: RawMaterial[];
    products?: Product[];
    suppliers?: Supplier[];
    customers?: Customer[];
    receipts?: InventoryReceipt[];
    isAr?: boolean;
  }
): ImportValidationResult {
  const def = ENTITY_DEFINITIONS[entityKey];
  if (!def) {
    throw new Error(`Entity '${entityKey}' is not supported for validation.`);
  }

  const isAr = systemContext.isAr !== false;
  const validRows: any[] = [];
  const errorRows: { rowNumber: number; rowData: any; errors: ImportError[] }[] = [];
  const allErrors: ImportError[] = [];

  // Build header-to-column key mapping
  // Checks exact column key, labelAr, labelEn, and all aliases (case-insensitive & trimmed)
  const resolveColumnKey = (headerName: string): ColumnDefinition | null => {
    const clean = headerName.trim().toLowerCase().replace(/[\*\:\_]/g, '');
    for (const col of def.columns) {
      if (col.key.toLowerCase() === clean) return col;
      if (col.labelAr.toLowerCase().replace(/[\*\:\_]/g, '').trim() === clean) return col;
      if (col.labelEn.toLowerCase().replace(/[\*\:\_]/g, '').trim() === clean) return col;
      if (col.aliases) {
        for (const alias of col.aliases) {
          if (alias.toLowerCase().replace(/[\*\:\_]/g, '').trim() === clean) return col;
        }
      }
    }
    return null;
  };

  const seenCodes = new Set<string>();

  rawRows.forEach((rawRow, idx) => {
    const rowNumber = idx + 1; // 1-indexed for user-friendly reporting
    const rowErrors: ImportError[] = [];
    const sanitizedObj: Record<string, any> = {};

    // Map raw headers to entity schema fields
    Object.entries(rawRow).forEach(([header, rawVal]) => {
      const col = resolveColumnKey(header);
      if (col) {
        sanitizedObj[col.key] = rawVal;
      }
    });

    // Validate each expected column according to definition
    for (const col of def.columns) {
      let val = sanitizedObj[col.key];

      // Clean empty strings or whitespace
      if (typeof val === 'string') {
        val = val.trim();
        if (val === '') val = undefined;
      }

      // Check required
      if (col.required && (val === undefined || val === null || val === '')) {
        const err: ImportError = {
          row: rowNumber,
          field: col.key,
          fieldLabel: isAr ? col.labelAr : col.labelEn,
          value: val,
          message: isAr
            ? `الحقل (${col.labelAr}) إلزامي ولا يمكن تركه فارغاً.`
            : `Field '${col.labelEn}' is required and cannot be empty.`,
          type: 'required'
        };
        rowErrors.push(err);
        allErrors.push(err);
        continue;
      }

      // If value is provided, validate & cast data type
      if (val !== undefined && val !== null && val !== '') {
        if (col.type === 'number') {
          // Remove currency symbols, commas, spaces
          const cleanedNumStr = String(val).replace(/[^0-9.-]/g, '');
          const parsedNum = Number(cleanedNumStr);
          if (isNaN(parsedNum)) {
            const err: ImportError = {
              row: rowNumber,
              field: col.key,
              fieldLabel: isAr ? col.labelAr : col.labelEn,
              value: val,
              message: isAr
                ? `القيمة المدخلة في (${col.labelAr}) ليست رقماً صالحاً.`
                : `Value in '${col.labelEn}' must be a valid number.`,
              type: 'type'
            };
            rowErrors.push(err);
            allErrors.push(err);
          } else {
            sanitizedObj[col.key] = parsedNum;
          }
        } else if (col.type === 'boolean') {
          const strVal = String(val).toLowerCase().trim();
          if (['نعم', 'true', 'yes', '1', 'نشط', 'صحيح'].includes(strVal)) {
            sanitizedObj[col.key] = true;
          } else if (['لا', 'false', 'no', '0', 'غير نشط', 'معطل'].includes(strVal)) {
            sanitizedObj[col.key] = false;
          } else {
            sanitizedObj[col.key] = Boolean(val);
          }
        } else if (col.type === 'date') {
          // Check date format (e.g. Date object from XLSX or string YYYY-MM-DD)
          if (val instanceof Date && !isNaN(val.getTime())) {
            sanitizedObj[col.key] = val.toISOString().slice(0, 10);
          } else {
            const dateStr = String(val).trim();
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              sanitizedObj[col.key] = parsed.toISOString().slice(0, 10);
            } else {
              // Try standard YYYY-MM-DD regex
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                sanitizedObj[col.key] = dateStr;
              } else {
                const err: ImportError = {
                  row: rowNumber,
                  field: col.key,
                  fieldLabel: isAr ? col.labelAr : col.labelEn,
                  value: val,
                  message: isAr
                    ? `التاريخ (${val}) غير صالح. يرجى استخدام الصيغة القياسية YYYY-MM-DD.`
                    : `Invalid date format '${val}'. Expected YYYY-MM-DD.`,
                  type: 'type'
                };
                rowErrors.push(err);
                allErrors.push(err);
              }
            }
          }
        } else if (col.type === 'enum' && col.enumValues) {
          const rawStr = String(val).trim().toUpperCase();
          // Find matching enum or label
          let matchedEnum: string | null = null;
          if (col.enumValues.includes(rawStr)) {
            matchedEnum = rawStr;
          } else {
            // Check enumLabelsAr or enumLabelsEn
            for (const enumKey of col.enumValues) {
              const labelAr = col.enumLabelsAr?.[enumKey] || '';
              const labelEn = col.enumLabelsEn?.[enumKey] || '';
              if (
                labelAr.toUpperCase().includes(rawStr) ||
                labelEn.toUpperCase().includes(rawStr) ||
                rawStr.includes(enumKey)
              ) {
                matchedEnum = enumKey;
                break;
              }
            }
          }

          if (!matchedEnum) {
            const err: ImportError = {
              row: rowNumber,
              field: col.key,
              fieldLabel: isAr ? col.labelAr : col.labelEn,
              value: val,
              message: isAr
                ? `القيمة (${val}) غير مقبولة في (${col.labelAr}). القيم المقبولة هي: [${col.enumValues.join(', ')}].`
                : `Invalid value '${val}' for '${col.labelEn}'. Allowed values: [${col.enumValues.join(', ')}].`,
              type: 'enum'
            };
            rowErrors.push(err);
            allErrors.push(err);
          } else {
            sanitizedObj[col.key] = matchedEnum;
          }
        } else {
          // String
          sanitizedObj[col.key] = String(val).trim();
        }
      } else {
        // Apply sensible defaults if optional
        if (col.key === 'active') sanitizedObj[col.key] = true;
        if (col.key === 'valuationMethod') sanitizedObj[col.key] = 'MOVING_AVERAGE';
        if (col.key === 'currency') sanitizedObj[col.key] = 'EGP';
        if (col.key === 'exchangeRate') sanitizedObj[col.key] = 1.0;
        if (col.key === 'conversionFactor') sanitizedObj[col.key] = 1.0;
      }
    }

    // Check unique code within the upload file
    const codeVal = sanitizedObj[def.codeField];
    if (codeVal && typeof codeVal === 'string') {
      const normalizedCode = codeVal.toUpperCase();
      if (seenCodes.has(normalizedCode) && entityKey !== 'boms') {
        const err: ImportError = {
          row: rowNumber,
          field: def.codeField,
          fieldLabel: isAr ? 'الكود' : 'Code',
          value: codeVal,
          message: isAr
            ? `الكود (${codeVal}) مكرر أكثر من مرة داخل نفس الملف المرفوع في الصف ${rowNumber}.`
            : `Duplicate code '${codeVal}' detected in the uploaded file at row ${rowNumber}.`,
          type: 'duplicate'
        };
        rowErrors.push(err);
        allErrors.push(err);
      } else {
        seenCodes.add(normalizedCode);
      }
    }

    if (rowErrors.length > 0) {
      errorRows.push({ rowNumber, rowData: sanitizedObj, errors: rowErrors });
    } else {
      validRows.push({ ...sanitizedObj, _rowNumber: rowNumber });
    }
  });

  return {
    entityKey,
    totalRows: rawRows.length,
    validRows,
    errorRows,
    errors: allErrors,
    stats: {
      total: rawRows.length,
      validCount: validRows.length,
      errorCount: errorRows.length,
      newCount: validRows.length,
      updateCount: 0
    }
  };
}
