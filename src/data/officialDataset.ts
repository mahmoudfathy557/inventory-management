/**
 * Official Reference Dataset & Valuation Replay Engine
 * 167 Transactions (#1 to #167) strictly evaluated by sequential order (#)
 */

export interface OfficialTransactionRaw {
  seq: number;
  date: string;
  code: number;
  typeName: string;
  transNum: number;
  bp: string | null;
  ref: string | null;
  itemCode: string;
  itemName?: string;
  location: string;
  qtyOrder: number | null;
  transQty: number | null;
  price: number | null;
  landedCostInput: number | null;
  uom: string | null;
  expectedCost?: number;
  expectedAmount?: number;
  expectedAvg?: number;
}

export interface ComputedTransactionRow extends OfficialTransactionRaw {
  avgCostBefore: number;
  cost: number;
  amount: number;
  conversionCost?: number;
  resource?: number;
  onHandAfter: number;
  valueAfter: number;
  macAfter: number;
}

export interface StockByItemRecord {
  seq: number;
  itemType: string;
  itemCode: string;
  itemName: string;
  location: string;
  qty: number;
  value: number;
  avgCost: number;
}

export const OFFICIAL_LOCATIONS = [
  { id: '1', code: '1', nameEn: 'Raw Material', nameAr: 'مخزن الخامات' },
  { id: '2', code: '2', nameEn: 'Factory', nameAr: 'مخزن المصنع / التشغيل' },
  { id: '3', code: '3', nameEn: 'Finished Product', nameAr: 'مخزن المنتج التام' },
  { id: '4', code: '4', nameEn: 'Scrap', nameAr: 'مخزن الهوالك / السكراب' },
  { id: '5', code: '5', nameEn: 'Packing', nameAr: 'مخزن التعبئة والتغليف' }
];

export const OFFICIAL_BUSINESS_PARTNERS = [
  { id: '1', code: '1', name: 'Horizon Additives' },
  { id: '2', code: '2', name: 'Hyma Plastic' },
  { id: '3', code: '3', name: 'الشركه المتحده للتجاره العالميه' }
];

export const ITEM_CATALOG: Record<string, { name: string; type: string; uom: string }> = {
  'Rm000001': { name: 'Sabostab UV 216', type: 'Raw Material', uom: 'KG' },
  'Rm000002': { name: 'حبيبات بولي إيثيلين خامة 2', type: 'Raw Material', uom: 'KG' },
  'Rm000003': { name: 'Songnox-1680', type: 'Raw Material', uom: 'KG' },
  'Rm000004': { name: 'Songsorb 8100', type: 'Raw Material', uom: 'KG' },
  'Rm000005': { name: 'SaboFog A300', type: 'Raw Material', uom: 'KG' },
  'Rm000006': { name: 'Crodamide OR-PA', type: 'Raw Material', uom: 'KG' },
  'Rm000007': { name: 'Irgafos 168', type: 'Raw Material', uom: 'KG' },
  'Rm000008': { name: 'Atmer 103', type: 'Raw Material', uom: 'KG' },
  'Rm000009': { name: 'Irganox B225 FF', type: 'Raw Material', uom: 'KG' },
  'Rm000010': { name: 'مخرز شفاف هيما', type: 'Raw Material', uom: 'KG' },
  'Rm000011': { name: 'LL6201 - EXXONMOBIL C4LL 50026.XR', type: 'Raw Material', uom: 'KG' },
  'Rm000012': { name: 'FT5230', type: 'Raw Material', uom: 'KG' },

  'FP000001': { name: 'AB-N50463 L', type: 'Finished Product', uom: 'KG' },
  'FP000002': { name: 'PA-P03332 L', type: 'Finished Product', uom: 'KG' },
  'FP000003': { name: 'PA-G0350 G', type: 'Finished Product', uom: 'KG' },
  'FP000004': { name: 'PA-F05122 L', type: 'Finished Product', uom: 'KG' },
  'FP000005': { name: 'SL-S05331 L', type: 'Finished Product', uom: 'KG' },
  'FP000006': { name: 'UV-W16929 D', type: 'Finished Product', uom: 'KG' },
  'FP000007': { name: 'UV-Q15919 D', type: 'Finished Product', uom: 'KG' },
  'FP000008': { name: 'AB-S10123 L', type: 'Finished Product', uom: 'KG' },
  'FP000009': { name: 'AS-X10301 L', type: 'Finished Product', uom: 'KG' },
  'FP000010': { name: 'AS-X20422 L', type: 'Finished Product', uom: 'KG' },
  'FP000011': { name: 'منتج تام 11', type: 'Finished Product', uom: 'KG' },
  'FP000012': { name: 'UV17222', type: 'Finished Product', uom: 'KG' },
  'FP000013': { name: 'AOX 2020 - AO-X20501 L', type: 'Finished Product', uom: 'KG' },

  'SC000001': { name: 'كنسة خامة', type: 'Scrap', uom: 'KG' },
  'SC000002': { name: 'مفروم UV', type: 'Scrap', uom: 'KG' },
  'SC000003': { name: 'خيوط UV', type: 'Scrap', uom: 'KG' },
  'SC000005': { name: 'خيوط AOX', type: 'Scrap', uom: 'KG' },

  'PCK00001': { name: 'أكياس تعبئة 1', type: 'Packing', uom: 'Unit' },
  'PCK00002': { name: 'كراتين تعبئة 2', type: 'Packing', uom: 'Unit' },

  'RES00001': { name: 'Master Batch', type: 'Resource', uom: 'KG' }
};

export const RAW_167_TRANSACTIONS: OfficialTransactionRaw[] = [
  // 1 to 38: Horizon Additives
  { seq: 1, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000001', location: 'Raw Material', qtyOrder: 9600, transQty: 9600, price: 849.857751, landedCostInput: null, uom: 'KG', expectedCost: 849.857751, expectedAmount: 8158634.4096, expectedAvg: 849.857751 },
  { seq: 2, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000002', location: 'Raw Material', qtyOrder: 8250, transQty: 8250, price: 64.789632, landedCostInput: null, uom: 'KG', expectedCost: 64.789632, expectedAmount: 534514.464, expectedAvg: 0 },
  { seq: 3, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000003', location: 'Raw Material', qtyOrder: 1320, transQty: 1320, price: 202.4676, landedCostInput: null, uom: 'KG', expectedCost: 202.4676, expectedAmount: 267257.232, expectedAvg: 0 },
  { seq: 4, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000004', location: 'Raw Material', qtyOrder: 625, transQty: 625, price: 125.023743, landedCostInput: null, uom: 'KG', expectedCost: 125.023743, expectedAmount: 78139.839375, expectedAvg: 0 },
  { seq: 5, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000005', location: 'Raw Material', qtyOrder: 280, transQty: 280, price: 243.416672, landedCostInput: null, uom: 'KG', expectedCost: 243.416672, expectedAmount: 68156.66816, expectedAvg: 0 },
  { seq: 6, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000006', location: 'Raw Material', qtyOrder: 850, transQty: 850, price: 379.373666, landedCostInput: null, uom: 'KG', expectedCost: 379.373666, expectedAmount: 322467.6161, expectedAvg: 0 },
  { seq: 7, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000007', location: 'Raw Material', qtyOrder: 160, transQty: 160, price: 260.677035, landedCostInput: null, uom: 'KG', expectedCost: 260.677035, expectedAmount: 41708.3256, expectedAvg: 0 },
  { seq: 8, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000008', location: 'Raw Material', qtyOrder: 975, transQty: 975, price: 393.951592, landedCostInput: null, uom: 'KG', expectedCost: 393.951592, expectedAmount: 384102.8022, expectedAvg: 0 },
  { seq: 9, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000001', location: 'Finished Product', qtyOrder: 5750, transQty: 5750, price: 101.2338, landedCostInput: null, uom: 'KG', expectedCost: 101.2338, expectedAmount: 582094.35, expectedAvg: 0 },
  { seq: 10, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000002', location: 'Finished Product', qtyOrder: 2700, transQty: 2700, price: 177.15915, landedCostInput: null, uom: 'KG', expectedCost: 177.15915, expectedAmount: 478329.705, expectedAvg: 0 },
  { seq: 11, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000003', location: 'Finished Product', qtyOrder: 4125, transQty: 4125, price: 50.6169, landedCostInput: null, uom: 'KG', expectedCost: 50.6169, expectedAmount: 208794.7125, expectedAvg: 0 },
  { seq: 12, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000004', location: 'Finished Product', qtyOrder: 1875, transQty: 1875, price: 217.65267, landedCostInput: null, uom: 'KG', expectedCost: 217.65267, expectedAmount: 408098.75625, expectedAvg: 0 },
  { seq: 13, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000005', location: 'Finished Product', qtyOrder: 900, transQty: 900, price: 164.504925, landedCostInput: null, uom: 'KG', expectedCost: 164.504925, expectedAmount: 148054.4325, expectedAvg: 0 },
  { seq: 14, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000006', location: 'Finished Product', qtyOrder: 800, transQty: 800, price: 212.59098, landedCostInput: null, uom: 'KG', expectedCost: 212.59098, expectedAmount: 170072.784, expectedAvg: 0 },
  { seq: 15, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000007', location: 'Finished Product', qtyOrder: 1300, transQty: 1300, price: 316.355625, landedCostInput: null, uom: 'KG', expectedCost: 316.355625, expectedAmount: 411262.3125, expectedAvg: 0 },
  { seq: 16, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000008', location: 'Finished Product', qtyOrder: 350, transQty: 350, price: 177.15915, landedCostInput: null, uom: 'KG', expectedCost: 177.15915, expectedAmount: 62005.7025, expectedAvg: 0 },
  { seq: 17, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000009', location: 'Finished Product', qtyOrder: 400, transQty: 400, price: 101.2338, landedCostInput: null, uom: 'KG', expectedCost: 101.2338, expectedAmount: 40493.52, expectedAvg: 0 },
  { seq: 18, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000010', location: 'Finished Product', qtyOrder: 250, transQty: 250, price: 126.54225, landedCostInput: null, uom: 'KG', expectedCost: 126.54225, expectedAmount: 31635.5625, expectedAvg: 0 },
  { seq: 19, date: '2026-08-31', code: 7, typeName: 'Goods Reciept PO', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000011', location: 'Finished Product', qtyOrder: 3000, transQty: 3000, price: 64.789632, landedCostInput: null, uom: 'KG', expectedCost: 64.789632, expectedAmount: 194368.896, expectedAvg: 0 },
  { seq: 20, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000001', location: 'Raw Material', qtyOrder: null, transQty: null, price: null, landedCostInput: 519866.34484337457, uom: null, expectedCost: 54.15274425451818, expectedAmount: 519866.34484337457, expectedAvg: 849.857751 },
  { seq: 21, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000002', location: 'Raw Material', qtyOrder: null, transQty: null, price: null, landedCostInput: 50788.60501357644, uom: null, expectedCost: 6.156194547100175, expectedAmount: 50788.60501357644, expectedAvg: 64.789632 },
  { seq: 22, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000003', location: 'Raw Material', qtyOrder: null, transQty: null, price: null, landedCostInput: 25394.30250678822, uom: null, expectedCost: 19.238107959688045, expectedAmount: 25394.30250678822, expectedAvg: 202.4676 },
  { seq: 23, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000004', location: 'Raw Material', qtyOrder: null, transQty: null, price: null, landedCostInput: 7424.707290692092, uom: null, expectedCost: 11.879531665107348, expectedAmount: 7424.707290692092, expectedAvg: 125.023743 },
  { seq: 24, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000005', location: 'Raw Material', qtyOrder: null, transQty: null, price: null, landedCostInput: 4342.927556, uom: null, expectedCost: 15.510455455389607, expectedAmount: 4342.92752750909, expectedAvg: 243.416672 },
  { seq: 25, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000006', location: 'Raw Material', qtyOrder: null, transQty: null, price: null, landedCostInput: 20547.563331, uom: null, expectedCost: 24.17360441844188, expectedAmount: 20547.5637556756, expectedAvg: 379.373666 },
  { seq: 26, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000007', location: 'Raw Material', qtyOrder: null, transQty: null, price: null, landedCostInput: 2657.645102187203, uom: null, expectedCost: 16.61028188867002, expectedAmount: 2657.645102187203, expectedAvg: 260.677035 },
  { seq: 27, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 1, bp: 'Horizon Additives', ref: null, itemCode: 'Rm000008', location: 'Raw Material', qtyOrder: null, transQty: null, price: null, landedCostInput: 24474.944227, uom: null, expectedCost: 25.10250662615085, expectedAmount: 24474.94396049708, expectedAvg: 393.951592 },
  { seq: 28, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000001', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 73361.84492250746, uom: null, expectedCost: 12.758581725653471, expectedAmount: 73361.84492250746, expectedAvg: 101.2338 },
  { seq: 29, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000002', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 60284.29865371269, uom: null, expectedCost: 22.32751801989359, expectedAmount: 60284.29865371269, expectedAvg: 177.15915 },
  { seq: 30, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000003', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 26314.57480916028, uom: null, expectedCost: 6.3792908628267345, expectedAmount: 26314.57480916028, expectedAvg: 50.6169 },
  { seq: 31, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000004', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 51433.03258154055, uom: null, expectedCost: 27.43095071015496, expectedAmount: 51433.03258154055, expectedAvg: 217.65267 },
  { seq: 32, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000005', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 18659.42577376822, uom: null, expectedCost: 20.73269530418691, expectedAmount: 18659.42577376822, expectedAvg: 164.504925 },
  { seq: 33, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000006', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 21434.41729909785, uom: null, expectedCost: 26.79302162387231, expectedAmount: 21434.41729909785, expectedAvg: 212.59098 },
  { seq: 34, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000007', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 51831.73826046722, uom: null, expectedCost: 39.87056789266709, expectedAmount: 51831.73826046722, expectedAvg: 316.355625 },
  { seq: 35, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000008', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 7814.631306962756, uom: null, expectedCost: 22.32751801989359, expectedAmount: 7814.631306962756, expectedAvg: 177.15915 },
  { seq: 36, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000009', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 5103.432690261388, uom: null, expectedCost: 12.75858172565347, expectedAmount: 5103.432690261388, expectedAvg: 101.2338 },
  { seq: 37, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000010', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 3987.056789266709, uom: null, expectedCost: 15.948227157066837, expectedAmount: 3987.056789266709, expectedAvg: 126.54225 },
  { seq: 38, date: '2026-08-31', code: 8, typeName: 'Landed Cost', transNum: 2, bp: 'Horizon Additives', ref: null, itemCode: 'FP000011', location: 'Finished Product', qtyOrder: null, transQty: null, price: null, landedCostInput: 24496.47691325469, uom: null, expectedCost: 8.16549230441823, expectedAmount: 24496.47691325469, expectedAvg: 64.789632 },

  // 39 to 167: Subsequent transactions
  { seq: 39, date: '2026-08-31', code: 9, typeName: 'Count Posting', transNum: 1, bp: null, ref: null, itemCode: 'FP000011', location: 'Finished Product', qtyOrder: -3000, transQty: -3000, price: null, landedCostInput: null, uom: 'KG', expectedCost: 72.95512430441823, expectedAmount: -218865.3729132547, expectedAvg: 72.95512430441823 },
  { seq: 40, date: '2026-08-31', code: 9, typeName: 'Count Posting', transNum: 1, bp: null, ref: null, itemCode: 'Rm000002', location: 'Raw Material', qtyOrder: 3000, transQty: 3000, price: null, landedCostInput: null, uom: 'KG', expectedCost: 70.94582654710018, expectedAmount: 212837.47964130053, expectedAvg: 70.94582654710018 },
  { seq: 41, date: '2026-09-01', code: 7, typeName: 'Goods Reciept PO', transNum: 3, bp: 'Hyma Plastic', ref: '1455', itemCode: 'Rm000009', location: 'Raw Material', qtyOrder: 550, transQty: 550, price: 171.36, landedCostInput: null, uom: 'KG', expectedCost: 171.36, expectedAmount: 94248, expectedAvg: 0 },
  { seq: 42, date: '2026-09-14', code: 7, typeName: 'Goods Reciept PO', transNum: 7, bp: 'Hyma Plastic', ref: '1818', itemCode: 'Rm000012', location: 'Raw Material', qtyOrder: 19250, transQty: 12375, price: 106.7, landedCostInput: null, uom: 'KG', expectedCost: 106.7, expectedAmount: 1320412.5, expectedAvg: 0 },
  { seq: 43, date: '2026-09-01', code: 5, typeName: 'Transfer Out', transNum: 1, bp: null, ref: null, itemCode: 'Rm000002', location: 'Raw Material', qtyOrder: -11250, transQty: -11250, price: null, landedCostInput: null, uom: 'KG', expectedCost: 70.94582654710018, expectedAmount: -798140.548654877, expectedAvg: 70.94582654710018 },
  { seq: 44, date: '2026-09-01', code: 5, typeName: 'Transfer Out', transNum: 1, bp: null, ref: null, itemCode: 'Rm000001', location: 'Raw Material', qtyOrder: -2100, transQty: -2100, price: null, landedCostInput: null, uom: 'KG', expectedCost: 904.0104952545181, expectedAmount: -1898422.040034488, expectedAvg: 904.0104952545181 },
  { seq: 45, date: '2026-09-01', code: 5, typeName: 'Transfer Out', transNum: 1, bp: null, ref: null, itemCode: 'Rm000009', location: 'Raw Material', qtyOrder: -330, transQty: -330, price: null, landedCostInput: null, uom: 'KG', expectedCost: 171.36, expectedAmount: -56548.8, expectedAvg: 171.36 },
  { seq: 46, date: '2026-09-01', code: 6, typeName: 'Transfer In', transNum: 1, bp: null, ref: null, itemCode: 'Rm000002', location: 'Factory', qtyOrder: 11250, transQty: 11250, price: null, landedCostInput: null, uom: 'KG', expectedCost: 70.94582654710018, expectedAmount: 798140.548654877, expectedAvg: 0 },
  { seq: 47, date: '2026-09-01', code: 6, typeName: 'Transfer In', transNum: 1, bp: null, ref: null, itemCode: 'Rm000001', location: 'Factory', qtyOrder: 2100, transQty: 2100, price: null, landedCostInput: null, uom: 'KG', expectedCost: 904.0104952545181, expectedAmount: 1898422.040034488, expectedAvg: 0 },
  { seq: 48, date: '2026-09-01', code: 6, typeName: 'Transfer In', transNum: 1, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: 330, transQty: 330, price: null, landedCostInput: null, uom: 'KG', expectedCost: 171.36, expectedAmount: 56548.8, expectedAvg: 0 },
  { seq: 49, date: '2026-09-01', code: 4, typeName: 'Issued For Production', transNum: 1, bp: null, ref: null, itemCode: 'Rm000002', location: 'Factory', qtyOrder: -11250, transQty: -11250, price: null, landedCostInput: null, uom: 'KG', expectedCost: 70.94582654710018, expectedAmount: -798140.548654877, expectedAvg: 70.94582654710018 },
  { seq: 50, date: '2026-09-01', code: 4, typeName: 'Issued For Production', transNum: 1, bp: null, ref: null, itemCode: 'Rm000001', location: 'Factory', qtyOrder: -2100, transQty: -2100, price: null, landedCostInput: null, uom: 'KG', expectedCost: 904.0104952545181, expectedAmount: -1898422.040034488, expectedAvg: 904.0104952545181 },
  { seq: 51, date: '2026-09-01', code: 4, typeName: 'Issued For Production', transNum: 1, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: -330, transQty: -330, price: null, landedCostInput: null, uom: 'KG', expectedCost: 171.36, expectedAmount: -56548.8, expectedAvg: 171.36 },
  { seq: 52, date: '2026-09-01', code: 4, typeName: 'Issued For Production', transNum: 1, bp: null, ref: null, itemCode: 'RES00001', location: 'Factory', qtyOrder: 12760, transQty: null, price: 25, landedCostInput: null, uom: 'KG', expectedCost: 25, expectedAmount: -319000, expectedAvg: 0 },
  { seq: 53, date: '2026-09-01', code: 3, typeName: 'Reciept From Production', transNum: 1, bp: null, ref: null, itemCode: 'FP000012', location: 'Factory', qtyOrder: 12760, transQty: 12760, price: null, landedCostInput: null, uom: 'KG', expectedCost: 240.7610806182888, expectedAmount: 3072111.388689365, expectedAvg: 0 },
  { seq: 54, date: '2026-09-01', code: 3, typeName: 'Reciept From Production', transNum: 1, bp: null, ref: null, itemCode: 'SC000001', location: 'Factory', qtyOrder: 155, transQty: 155, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 55, date: '2026-09-01', code: 3, typeName: 'Reciept From Production', transNum: 1, bp: null, ref: null, itemCode: 'SC000002', location: 'Factory', qtyOrder: 408, transQty: 408, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 56, date: '2026-09-01', code: 3, typeName: 'Reciept From Production', transNum: 1, bp: null, ref: null, itemCode: 'SC000003', location: 'Factory', qtyOrder: 357, transQty: 357, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 57, date: '2026-09-02', code: 5, typeName: 'Transfer Out', transNum: 2, bp: null, ref: null, itemCode: 'FP000012', location: 'Factory', qtyOrder: -12760, transQty: -12760, price: null, landedCostInput: null, uom: 'KG', expectedCost: 240.7610806182888, expectedAmount: -3072111.388689365, expectedAvg: 240.7610806182888 },
  { seq: 58, date: '2026-09-02', code: 5, typeName: 'Transfer Out', transNum: 2, bp: null, ref: null, itemCode: 'SC000001', location: 'Factory', qtyOrder: -155, transQty: -155, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 59, date: '2026-09-02', code: 5, typeName: 'Transfer Out', transNum: 2, bp: null, ref: null, itemCode: 'SC000002', location: 'Factory', qtyOrder: -408, transQty: -408, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 60, date: '2026-09-02', code: 5, typeName: 'Transfer Out', transNum: 2, bp: null, ref: null, itemCode: 'SC000003', location: 'Factory', qtyOrder: -357, transQty: -357, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 61, date: '2026-09-02', code: 6, typeName: 'Transfer In', transNum: 2, bp: null, ref: null, itemCode: 'FP000012', location: 'Finished Product', qtyOrder: 12760, transQty: 12760, price: null, landedCostInput: null, uom: 'KG', expectedCost: 240.7610806182888, expectedAmount: 3072111.388689365, expectedAvg: 0 },
  { seq: 62, date: '2026-09-02', code: 6, typeName: 'Transfer In', transNum: 2, bp: null, ref: null, itemCode: 'SC000001', location: 'Scrap', qtyOrder: 155, transQty: 155, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 63, date: '2026-09-02', code: 6, typeName: 'Transfer In', transNum: 2, bp: null, ref: null, itemCode: 'SC000002', location: 'Scrap', qtyOrder: 408, transQty: 408, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 64, date: '2026-09-02', code: 6, typeName: 'Transfer In', transNum: 2, bp: null, ref: null, itemCode: 'SC000003', location: 'Scrap', qtyOrder: 357, transQty: 357, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 65, date: '2026-07-30', code: 11, typeName: 'Delivery to Customer', transNum: 1, bp: 'Hyma Plastic', ref: '3023', itemCode: 'Rm000001', location: 'Raw Material', qtyOrder: -1920, transQty: -1920, price: 987.55433, landedCostInput: null, uom: 'KG', expectedCost: 904.0104952545181, expectedAmount: -1735700.1508886747, expectedAvg: 904.0104952545181 },
  { seq: 66, date: '2026-09-09', code: 11, typeName: 'Delivery to Customer', transNum: 2, bp: 'Hyma Plastic', ref: '3231', itemCode: 'Rm000001', location: 'Raw Material', qtyOrder: -1920, transQty: -1920, price: 987.55, landedCostInput: null, uom: 'KG', expectedCost: 904.0104952545181, expectedAmount: -1735700.1508886747, expectedAvg: 904.0104952545181 },
  { seq: 67, date: '2026-09-15', code: 11, typeName: 'Delivery to Customer', transNum: 3, bp: 'Hyma Plastic', ref: '3288', itemCode: 'Rm000001', location: 'Raw Material', qtyOrder: -1920, transQty: -1920, price: 987.55, landedCostInput: null, uom: 'KG', expectedCost: 904.0104952545181, expectedAmount: -1735700.1508886747, expectedAvg: 904.0104952545181 },
  { seq: 68, date: '2026-09-21', code: 11, typeName: 'Delivery to Customer', transNum: 4, bp: 'Hyma Plastic', ref: null, itemCode: 'FP000012', location: 'Finished Product', qtyOrder: -1625, transQty: -1625, price: 264, landedCostInput: null, uom: 'KG', expectedCost: 240.7610806182888, expectedAmount: -391236.7560047193, expectedAvg: 240.7610806182888 },
  { seq: 69, date: '2026-09-16', code: 11, typeName: 'Delivery to Customer', transNum: 5, bp: 'الشركه المتحده للتجاره العالميه', ref: null, itemCode: 'FP000002', location: 'Finished Product', qtyOrder: -1000, transQty: -1000, price: 153.5088, landedCostInput: null, uom: 'KG', expectedCost: 199.4866680198936, expectedAmount: -199486.6680198936, expectedAvg: 199.4866680198936 },
  { seq: 70, date: '2026-09-16', code: 11, typeName: 'Delivery to Customer', transNum: 5, bp: 'الشركه المتحده للتجاره العالميه', ref: null, itemCode: 'FP000009', location: 'Finished Product', qtyOrder: -10, transQty: -10, price: 0, landedCostInput: null, uom: 'KG', expectedCost: 113.99238172565347, expectedAmount: -1139.9238172565347, expectedAvg: 113.99238172565347 },
  { seq: 71, date: '2026-09-27', code: 7, typeName: 'Goods Reciept PO', transNum: 4, bp: 'Hyma Plastic', ref: '1509', itemCode: 'Rm000010', location: 'Raw Material', qtyOrder: 500, transQty: 500, price: 48, landedCostInput: null, uom: 'KG', expectedCost: 48, expectedAmount: 24000, expectedAvg: 0 },
  { seq: 72, date: '2026-10-01', code: 7, typeName: 'Goods Reciept PO', transNum: 5, bp: 'Hyma Plastic', ref: '1564', itemCode: 'Rm000011', location: 'Raw Material', qtyOrder: 45375, transQty: 22000, price: 73, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: 1606000, expectedAvg: 0 },
  { seq: 73, date: '2026-10-01', code: 7, typeName: 'Goods Reciept PO', transNum: 5, bp: 'Hyma Plastic', ref: '1564', itemCode: 'Rm000009', location: 'Raw Material', qtyOrder: 11000, transQty: 6350, price: 180, landedCostInput: null, uom: 'KG', expectedCost: 180, expectedAmount: 1143000, expectedAvg: 171.36 },
  { seq: 74, date: '2026-10-08', code: 7, typeName: 'Goods Reciept PO', transNum: 6, bp: 'Hyma Plastic', ref: '1678', itemCode: 'PCK00001', location: 'Packing', qtyOrder: 4000, transQty: 0, price: null, landedCostInput: null, uom: 'Unit', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 75, date: '2026-10-08', code: 7, typeName: 'Goods Reciept PO', transNum: 6, bp: 'Hyma Plastic', ref: '1678', itemCode: 'PCK00002', location: 'Packing', qtyOrder: 6000, transQty: 0, price: null, landedCostInput: null, uom: 'Unit', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 76, date: '2026-09-14', code: 7, typeName: 'Goods Reciept PO', transNum: 7, bp: 'Hyma Plastic', ref: '1818', itemCode: 'Rm000009', location: 'Raw Material', qtyOrder: 500, transQty: 0, price: 180, landedCostInput: null, uom: 'KG', expectedCost: 180, expectedAmount: 0, expectedAvg: 179.71068493150685 },
  { seq: 77, date: '2026-10-01', code: 11, typeName: 'Delivery to Customer', transNum: 6, bp: 'Hyma Plastic', ref: null, itemCode: 'FP000012', location: 'Finished Product', qtyOrder: -10000, transQty: -10000, price: 264, landedCostInput: null, uom: 'KG', expectedCost: 240.7610806182888, expectedAmount: -2407610.806182888, expectedAvg: 240.7610806182888 },
  { seq: 78, date: '2026-10-01', code: 11, typeName: 'Delivery to Customer', transNum: 7, bp: 'Hyma Plastic', ref: null, itemCode: 'FP000012', location: 'Finished Product', qtyOrder: -1125, transQty: -1125, price: 264, landedCostInput: null, uom: 'KG', expectedCost: 240.7610806182888, expectedAmount: -270856.2156955749, expectedAvg: 240.7610806182888 },
  { seq: 79, date: '2026-10-02', code: 5, typeName: 'Transfer Out', transNum: 3, bp: null, ref: null, itemCode: 'Rm000011', location: 'Raw Material', qtyOrder: -18400, transQty: -18400, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: -1343200, expectedAvg: 73 },
  { seq: 80, date: '2026-10-02', code: 5, typeName: 'Transfer Out', transNum: 3, bp: null, ref: null, itemCode: 'Rm000009', location: 'Raw Material', qtyOrder: -4641.4, transQty: -4641.4, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150685, expectedAmount: -834109.1730410959, expectedAvg: 179.71068493150685 },
  { seq: 81, date: '2026-10-02', code: 6, typeName: 'Transfer In', transNum: 3, bp: null, ref: null, itemCode: 'Rm000011', location: 'Factory', qtyOrder: 18400, transQty: 18400, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: 1343200, expectedAvg: 0 },
  { seq: 82, date: '2026-10-02', code: 6, typeName: 'Transfer In', transNum: 3, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: 4641.4, transQty: 4641.4, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150685, expectedAmount: 834109.1730410959, expectedAvg: 0 },
  { seq: 83, date: '2026-10-03', code: 4, typeName: 'Issued For Production', transNum: 2, bp: null, ref: null, itemCode: 'Rm000011', location: 'Factory', qtyOrder: -18400, transQty: -18400, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: -1343200, expectedAvg: 73 },
  { seq: 84, date: '2026-10-03', code: 4, typeName: 'Issued For Production', transNum: 2, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: -4641.4, transQty: -4641.4, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150685, expectedAmount: -834109.1730410959, expectedAvg: 179.71068493150685 },
  { seq: 85, date: '2026-10-03', code: 4, typeName: 'Issued For Production', transNum: 2, bp: null, ref: null, itemCode: 'RES00001', location: 'Factory', qtyOrder: 22875, transQty: null, price: 25, landedCostInput: null, uom: 'KG', expectedCost: 25, expectedAmount: -571875, expectedAvg: 0 },
  { seq: 86, date: '2026-10-04', code: 13, typeName: 'Return from Customer', transNum: 2, bp: 'Hyma Plastic', ref: '3231', itemCode: 'Rm000001', location: 'Raw Material', qtyOrder: 1440, transQty: 1440, price: null, landedCostInput: null, uom: 'KG', expectedCost: 904.0104952545181, expectedAmount: 1301775.113166506, expectedAvg: 904.0104952545181 },
  { seq: 87, date: '2026-10-05', code: 13, typeName: 'Return from Customer', transNum: 2, bp: 'Hyma Plastic', ref: '3231', itemCode: 'Rm000001', location: 'Raw Material', qtyOrder: 480, transQty: 480, price: null, landedCostInput: null, uom: 'KG', expectedCost: 904.0104952545181, expectedAmount: 433925.0377221687, expectedAvg: 904.0104952545181 },
  { seq: 88, date: '2026-10-06', code: 13, typeName: 'Return from Customer', transNum: 3, bp: 'Hyma Plastic', ref: '3288', itemCode: 'Rm000001', location: 'Raw Material', qtyOrder: 40, transQty: 40, price: null, landedCostInput: null, uom: 'KG', expectedCost: 904.0104952545181, expectedAmount: 36160.41981018072, expectedAvg: 904.0104952545181 },
  { seq: 89, date: '2026-10-07', code: 3, typeName: 'Reciept From Production', transNum: 2, bp: null, ref: null, itemCode: 'FP000013', location: 'Factory', qtyOrder: 22875, transQty: 22875, price: null, landedCostInput: null, uom: 'KG', expectedCost: 120.1829146684632, expectedAmount: 2749184.1730410956, expectedAvg: 0 },
  { seq: 90, date: '2026-10-07', code: 3, typeName: 'Reciept From Production', transNum: 2, bp: null, ref: null, itemCode: 'SC000001', location: 'Factory', qtyOrder: 105, transQty: 105, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 91, date: '2026-10-07', code: 3, typeName: 'Reciept From Production', transNum: 2, bp: null, ref: null, itemCode: 'SC000005', location: 'Factory', qtyOrder: 60, transQty: 60, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 92, date: '2026-10-08', code: 5, typeName: 'Transfer Out', transNum: 4, bp: null, ref: null, itemCode: 'FP000013', location: 'Factory', qtyOrder: -22875, transQty: -22875, price: null, landedCostInput: null, uom: 'KG', expectedCost: 120.1829146684632, expectedAmount: -2749184.1730410956, expectedAvg: 120.1829146684632 },
  { seq: 93, date: '2026-10-08', code: 5, typeName: 'Transfer Out', transNum: 4, bp: null, ref: null, itemCode: 'SC000001', location: 'Factory', qtyOrder: -105, transQty: -105, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 94, date: '2026-10-08', code: 5, typeName: 'Transfer Out', transNum: 4, bp: null, ref: null, itemCode: 'SC000005', location: 'Factory', qtyOrder: -60, transQty: -60, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 95, date: '2026-10-08', code: 6, typeName: 'Transfer In', transNum: 4, bp: null, ref: null, itemCode: 'FP000013', location: 'Finished Product', qtyOrder: 22875, transQty: 22875, price: null, landedCostInput: null, uom: 'KG', expectedCost: 120.1829146684632, expectedAmount: 2749184.1730410956, expectedAvg: 0 },
  { seq: 96, date: '2026-10-08', code: 6, typeName: 'Transfer In', transNum: 4, bp: null, ref: null, itemCode: 'SC000001', location: 'Scrap', qtyOrder: 105, transQty: 105, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 97, date: '2026-10-08', code: 6, typeName: 'Transfer In', transNum: 4, bp: null, ref: null, itemCode: 'SC000005', location: 'Scrap', qtyOrder: 60, transQty: 60, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 98, date: '2026-10-09', code: 11, typeName: 'Delivery to Customer', transNum: 8, bp: 'Hyma Plastic', ref: '3354', itemCode: 'FP000013', location: 'Finished Product', qtyOrder: -4125, transQty: -4125, price: 120, landedCostInput: null, uom: 'KG', expectedCost: 120.1829146684632, expectedAmount: -495754.5230074107, expectedAvg: 120.1829146684632 },
  { seq: 99, date: '2026-10-09', code: 11, typeName: 'Delivery to Customer', transNum: 9, bp: 'Hyma Plastic', ref: '3390', itemCode: 'FP000013', location: 'Finished Product', qtyOrder: -30000, transQty: -18000, price: 120, landedCostInput: null, uom: 'KG', expectedCost: 120.1829146684632, expectedAmount: -2163292.4640323375, expectedAvg: 120.1829146684632 },
  { seq: 100, date: '2026-10-10', code: 5, typeName: 'Transfer Out', transNum: 5, bp: null, ref: null, itemCode: 'Rm000012', location: 'Raw Material', qtyOrder: -7450, transQty: -7450, price: null, landedCostInput: null, uom: 'KG', expectedCost: 106.7, expectedAmount: -794915, expectedAvg: 106.7 },
  { seq: 101, date: '2026-10-10', code: 5, typeName: 'Transfer Out', transNum: 5, bp: null, ref: null, itemCode: 'Rm000001', location: 'Raw Material', qtyOrder: -1385, transQty: -1385, price: null, landedCostInput: null, uom: 'KG', expectedCost: 904.010495254518, expectedAmount: -1252054.5359275075, expectedAvg: 904.010495254518 },
  { seq: 102, date: '2026-10-10', code: 5, typeName: 'Transfer Out', transNum: 5, bp: null, ref: null, itemCode: 'Rm000009', location: 'Raw Material', qtyOrder: -228.6, transQty: -228.6, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.7106849315068, expectedAmount: -41081.86257534245, expectedAvg: 179.7106849315068 },
  { seq: 103, date: '2026-10-10', code: 5, typeName: 'Transfer Out', transNum: 5, bp: null, ref: null, itemCode: 'SC000002', location: 'Scrap', qtyOrder: -308, transQty: -308, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 104, date: '2026-10-10', code: 5, typeName: 'Transfer Out', transNum: 5, bp: null, ref: null, itemCode: 'SC000003', location: 'Scrap', qtyOrder: -162, transQty: -162, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 105, date: '2026-10-10', code: 6, typeName: 'Transfer In', transNum: 5, bp: null, ref: null, itemCode: 'Rm000012', location: 'Factory', qtyOrder: 7450, transQty: 7450, price: null, landedCostInput: null, uom: 'KG', expectedCost: 106.7, expectedAmount: 794915, expectedAvg: 0 },
  { seq: 106, date: '2026-10-10', code: 6, typeName: 'Transfer In', transNum: 5, bp: null, ref: null, itemCode: 'Rm000001', location: 'Factory', qtyOrder: 1385, transQty: 1385, price: null, landedCostInput: null, uom: 'KG', expectedCost: 904.010495254518, expectedAmount: 1252054.5359275075, expectedAvg: 0 },
  { seq: 107, date: '2026-10-10', code: 6, typeName: 'Transfer In', transNum: 5, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: 228.6, transQty: 228.6, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.7106849315068, expectedAmount: 41081.86257534245, expectedAvg: 0 },
  { seq: 108, date: '2026-10-10', code: 6, typeName: 'Transfer In', transNum: 5, bp: null, ref: null, itemCode: 'SC000002', location: 'Factory', qtyOrder: 308, transQty: 308, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 109, date: '2026-10-10', code: 6, typeName: 'Transfer In', transNum: 5, bp: null, ref: null, itemCode: 'SC000003', location: 'Factory', qtyOrder: 162, transQty: 162, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 110, date: '2026-10-11', code: 4, typeName: 'Issued For Production', transNum: 3, bp: null, ref: null, itemCode: 'Rm000012', location: 'Factory', qtyOrder: -7450, transQty: -7450, price: null, landedCostInput: null, uom: 'KG', expectedCost: 106.7, expectedAmount: -794915, expectedAvg: 106.7 },
  { seq: 111, date: '2026-10-11', code: 4, typeName: 'Issued For Production', transNum: 3, bp: null, ref: null, itemCode: 'Rm000001', location: 'Factory', qtyOrder: -1385, transQty: -1385, price: null, landedCostInput: null, uom: 'KG', expectedCost: 904.010495254518, expectedAmount: -1252054.5359275075, expectedAvg: 904.010495254518 },
  { seq: 112, date: '2026-10-11', code: 4, typeName: 'Issued For Production', transNum: 3, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: -228.6, transQty: -228.6, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.7106849315068, expectedAmount: -41081.86257534245, expectedAvg: 179.7106849315068 },
  { seq: 113, date: '2026-10-11', code: 4, typeName: 'Issued For Production', transNum: 3, bp: null, ref: null, itemCode: 'SC000002', location: 'Factory', qtyOrder: -308, transQty: -308, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 114, date: '2026-10-11', code: 4, typeName: 'Issued For Production', transNum: 3, bp: null, ref: null, itemCode: 'SC000003', location: 'Factory', qtyOrder: -162, transQty: -162, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 115, date: '2026-10-11', code: 4, typeName: 'Issued For Production', transNum: 3, bp: null, ref: null, itemCode: 'RES00001', location: 'Factory', qtyOrder: 9525, transQty: 9525, price: 25, landedCostInput: null, uom: 'KG', expectedCost: 25, expectedAmount: -238125, expectedAvg: 0 },
  { seq: 116, date: '2026-10-12', code: 3, typeName: 'Reciept From Production', transNum: 3, bp: null, ref: null, itemCode: 'FP000012', location: 'Factory', qtyOrder: 9525, transQty: 9525, price: null, landedCostInput: null, uom: 'KG', expectedCost: 244.21799459347506, expectedAmount: 2326176.39850285, expectedAvg: 0 },
  { seq: 117, date: '2026-10-13', code: 5, typeName: 'Transfer Out', transNum: 6, bp: null, ref: null, itemCode: 'FP000012', location: 'Factory', qtyOrder: -9525, transQty: -9525, price: null, landedCostInput: null, uom: 'KG', expectedCost: 244.21799459347506, expectedAmount: -2326176.39850285, expectedAvg: 244.21799459347506 },
  { seq: 118, date: '2026-10-13', code: 6, typeName: 'Transfer In', transNum: 6, bp: null, ref: null, itemCode: 'FP000012', location: 'Finished Product', qtyOrder: 9525, transQty: 9525, price: null, landedCostInput: null, uom: 'KG', expectedCost: 244.21799459347506, expectedAmount: 2326176.39850285, expectedAvg: 240.7610806182888 },
  { seq: 119, date: '2026-10-13', code: 5, typeName: 'Transfer Out', transNum: 7, bp: null, ref: null, itemCode: 'Rm000010', location: 'Raw Material', qtyOrder: -25, transQty: -25, price: null, landedCostInput: null, uom: 'KG', expectedCost: 48, expectedAmount: -1200, expectedAvg: 48 },
  { seq: 120, date: '2026-10-13', code: 6, typeName: 'Transfer In', transNum: 7, bp: null, ref: null, itemCode: 'Rm000010', location: 'Factory', qtyOrder: 25, transQty: 25, price: null, landedCostInput: null, uom: 'KG', expectedCost: 48, expectedAmount: 1200, expectedAvg: 0 },
  { seq: 121, date: '2026-10-13', code: 2, typeName: 'Issued', transNum: 1, bp: null, ref: null, itemCode: 'Rm000010', location: 'Factory', qtyOrder: -25, transQty: -25, price: null, landedCostInput: null, uom: 'KG', expectedCost: 48, expectedAmount: -1200, expectedAvg: 48 },
  { seq: 122, date: '2026-10-13', code: 11, typeName: 'Delivery to Customer', transNum: 10, bp: 'Hyma Plastic', ref: '3454', itemCode: 'FP000012', location: 'Finished Product', qtyOrder: -6000, transQty: -6000, price: 264, landedCostInput: null, uom: 'KG', expectedCost: 244.2143690937633, expectedAmount: -1465286.2145625798, expectedAvg: 244.2143690937633 },
  { seq: 123, date: '2026-10-14', code: 5, typeName: 'Transfer Out', transNum: 8, bp: null, ref: null, itemCode: 'Rm000011', location: 'Raw Material', qtyOrder: -1550, transQty: -1550, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: -113150, expectedAvg: 73 },
  { seq: 124, date: '2026-10-14', code: 5, typeName: 'Transfer Out', transNum: 8, bp: null, ref: null, itemCode: 'Rm000009', location: 'Raw Material', qtyOrder: -180, transQty: -180, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150676, expectedAmount: -32347.923287671216, expectedAvg: 179.71068493150676 },
  { seq: 125, date: '2026-10-14', code: 5, typeName: 'Transfer Out', transNum: 8, bp: null, ref: null, itemCode: 'SC000005', location: 'Scrap', qtyOrder: -48, transQty: -48, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 126, date: '2026-10-14', code: 6, typeName: 'Transfer In', transNum: 8, bp: null, ref: null, itemCode: 'Rm000011', location: 'Factory', qtyOrder: 1550, transQty: 1550, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: 113150, expectedAvg: 0 },
  { seq: 127, date: '2026-10-14', code: 6, typeName: 'Transfer In', transNum: 8, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: 180, transQty: 180, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150676, expectedAmount: 32347.923287671216, expectedAvg: 0 },
  { seq: 128, date: '2026-10-14', code: 6, typeName: 'Transfer In', transNum: 8, bp: null, ref: null, itemCode: 'SC000005', location: 'Factory', qtyOrder: 48, transQty: 48, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 129, date: '2026-10-14', code: 4, typeName: 'Issued For Production', transNum: 4, bp: null, ref: null, itemCode: 'Rm000011', location: 'Factory', qtyOrder: -1550, transQty: -1550, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: -113150, expectedAvg: 73 },
  { seq: 130, date: '2026-10-14', code: 4, typeName: 'Issued For Production', transNum: 4, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: -180, transQty: -180, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150676, expectedAmount: -32347.923287671216, expectedAvg: 179.71068493150676 },
  { seq: 131, date: '2026-10-14', code: 4, typeName: 'Issued For Production', transNum: 4, bp: null, ref: null, itemCode: 'SC000005', location: 'Factory', qtyOrder: -48, transQty: -48, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 132, date: '2026-10-14', code: 4, typeName: 'Issued For Production', transNum: 4, bp: null, ref: null, itemCode: 'RES00001', location: 'Factory', qtyOrder: 1775, transQty: 1775, price: 25, landedCostInput: null, uom: 'KG', expectedCost: -93.53018372703412, expectedAmount: -44375, expectedAvg: -118.53018372703412 },
  { seq: 133, date: '2026-10-14', code: 3, typeName: 'Reciept From Production', transNum: 4, bp: null, ref: null, itemCode: 'FP000013', location: 'Factory', qtyOrder: 1775, transQty: 1775, price: null, landedCostInput: null, uom: 'KG', expectedCost: 106.97066100713871, expectedAmount: 189872.9232876712, expectedAvg: 0 },
  { seq: 134, date: '2026-10-14', code: 3, typeName: 'Reciept From Production', transNum: 4, bp: null, ref: null, itemCode: 'SC000001', location: 'Factory', qtyOrder: 3, transQty: 3, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 135, date: '2026-10-14', code: 5, typeName: 'Transfer Out', transNum: 9, bp: null, ref: null, itemCode: 'FP000013', location: 'Factory', qtyOrder: -1775, transQty: -1775, price: null, landedCostInput: null, uom: 'KG', expectedCost: 106.97066100713871, expectedAmount: -189872.9232876712, expectedAvg: 106.97066100713871 },
  { seq: 136, date: '2026-10-14', code: 5, typeName: 'Transfer Out', transNum: 9, bp: null, ref: null, itemCode: 'SC000001', location: 'Factory', qtyOrder: -3, transQty: -3, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 137, date: '2026-10-14', code: 6, typeName: 'Transfer In', transNum: 9, bp: null, ref: null, itemCode: 'FP000013', location: 'Finished Product', qtyOrder: 1775, transQty: 1775, price: null, landedCostInput: null, uom: 'KG', expectedCost: 106.97066100713871, expectedAmount: 189872.9232876712, expectedAvg: 120.1829146684632 },
  { seq: 138, date: '2026-10-14', code: 6, typeName: 'Transfer In', transNum: 9, bp: null, ref: null, itemCode: 'SC000001', location: 'Scrap', qtyOrder: 3, transQty: 3, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 139, date: '2026-10-15', code: 5, typeName: 'Transfer Out', transNum: 10, bp: null, ref: null, itemCode: 'Rm000011', location: 'Raw Material', qtyOrder: -1700, transQty: -1700, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: -124100, expectedAvg: 73 },
  { seq: 140, date: '2026-10-15', code: 5, typeName: 'Transfer Out', transNum: 10, bp: null, ref: null, itemCode: 'Rm000009', location: 'Raw Material', qtyOrder: -440, transQty: -440, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150676, expectedAmount: -79072.70136986297, expectedAvg: 179.71068493150676 },
  { seq: 141, date: '2026-10-15', code: 5, typeName: 'Transfer Out', transNum: 10, bp: null, ref: null, itemCode: 'SC000005', location: 'Scrap', qtyOrder: -50, transQty: -50, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 142, date: '2026-10-15', code: 5, typeName: 'Transfer Out', transNum: 10, bp: null, ref: null, itemCode: 'SC000001', location: 'Scrap', qtyOrder: -5, transQty: -5, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 143, date: '2026-10-15', code: 6, typeName: 'Transfer In', transNum: 10, bp: null, ref: null, itemCode: 'Rm000011', location: 'Factory', qtyOrder: 1700, transQty: 1700, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: 124100, expectedAvg: 0 },
  { seq: 144, date: '2026-10-15', code: 6, typeName: 'Transfer In', transNum: 10, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: 440, transQty: 440, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150676, expectedAmount: 79072.70136986297, expectedAvg: 0 },
  { seq: 145, date: '2026-10-15', code: 6, typeName: 'Transfer In', transNum: 10, bp: null, ref: null, itemCode: 'SC000005', location: 'Factory', qtyOrder: 50, transQty: 50, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 146, date: '2026-10-15', code: 6, typeName: 'Transfer In', transNum: 10, bp: null, ref: null, itemCode: 'SC000001', location: 'Factory', qtyOrder: 5, transQty: 5, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 147, date: '2026-10-15', code: 4, typeName: 'Issued For Production', transNum: 5, bp: null, ref: null, itemCode: 'Rm000011', location: 'Factory', qtyOrder: -1700, transQty: -1700, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: -124100, expectedAvg: 73 },
  { seq: 148, date: '2026-10-15', code: 4, typeName: 'Issued For Production', transNum: 5, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: -440, transQty: -440, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150676, expectedAmount: -79072.70136986297, expectedAvg: 179.71068493150676 },
  { seq: 149, date: '2026-10-15', code: 4, typeName: 'Issued For Production', transNum: 5, bp: null, ref: null, itemCode: 'SC000005', location: 'Factory', qtyOrder: -50, transQty: -50, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 150, date: '2026-10-15', code: 4, typeName: 'Issued For Production', transNum: 5, bp: null, ref: null, itemCode: 'SC000001', location: 'Factory', qtyOrder: -5, transQty: -5, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 151, date: '2026-10-15', code: 4, typeName: 'Issued For Production', transNum: 5, bp: null, ref: null, itemCode: 'RES00001', location: 'Factory', qtyOrder: 2250, transQty: 2250, price: 25, landedCostInput: null, uom: 'KG', expectedCost: -78.83849557522124, expectedAmount: -56250, expectedAvg: -103.83849557522124 },
  { seq: 152, date: '2026-10-15', code: 3, typeName: 'Reciept From Production', transNum: 5, bp: null, ref: null, itemCode: 'FP000013', location: 'Factory', qtyOrder: 2250, transQty: 2250, price: null, landedCostInput: null, uom: 'KG', expectedCost: 115.29897838660577, expectedAmount: 259422.70136986297, expectedAvg: 0 },
  { seq: 153, date: '2026-10-15', code: 5, typeName: 'Transfer Out', transNum: 11, bp: null, ref: null, itemCode: 'FP000013', location: 'Factory', qtyOrder: -2250, transQty: -2250, price: null, landedCostInput: null, uom: 'KG', expectedCost: 115.29897838660577, expectedAmount: -259422.70136986297, expectedAvg: 115.29897838660577 },
  { seq: 154, date: '2026-10-15', code: 6, typeName: 'Transfer In', transNum: 11, bp: null, ref: null, itemCode: 'FP000013', location: 'Finished Product', qtyOrder: 2250, transQty: 2250, price: null, landedCostInput: null, uom: 'KG', expectedCost: 115.29897838660577, expectedAmount: 259422.70136986297, expectedAvg: 110.89509270767113 },
  { seq: 155, date: '2026-10-17', code: 5, typeName: 'Transfer Out', transNum: 12, bp: null, ref: null, itemCode: 'Rm000011', location: 'Raw Material', qtyOrder: -975, transQty: -975, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: -71175, expectedAvg: 73 },
  { seq: 156, date: '2026-10-17', code: 5, typeName: 'Transfer Out', transNum: 12, bp: null, ref: null, itemCode: 'Rm000009', location: 'Raw Material', qtyOrder: -280, transQty: -280, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150676, expectedAmount: -50318.99178082189, expectedAvg: 179.71068493150676 },
  { seq: 157, date: '2026-10-17', code: 6, typeName: 'Transfer In', transNum: 12, bp: null, ref: null, itemCode: 'Rm000011', location: 'Factory', qtyOrder: 975, transQty: 975, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: 71175, expectedAvg: 0 },
  { seq: 158, date: '2026-10-17', code: 6, typeName: 'Transfer In', transNum: 12, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: 280, transQty: 280, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150676, expectedAmount: 50318.99178082189, expectedAvg: 0 },
  { seq: 159, date: '2026-10-17', code: 4, typeName: 'Issued For Production', transNum: 6, bp: null, ref: null, itemCode: 'Rm000011', location: 'Factory', qtyOrder: -975, transQty: -975, price: null, landedCostInput: null, uom: 'KG', expectedCost: 73, expectedAmount: -71175, expectedAvg: 73 },
  { seq: 160, date: '2026-10-17', code: 4, typeName: 'Issued For Production', transNum: 6, bp: null, ref: null, itemCode: 'Rm000009', location: 'Factory', qtyOrder: -280, transQty: -280, price: null, landedCostInput: null, uom: 'KG', expectedCost: 179.71068493150676, expectedAmount: -50318.99178082189, expectedAvg: 179.71068493150676 },
  { seq: 161, date: '2026-10-17', code: 4, typeName: 'Issued For Production', transNum: 6, bp: null, ref: null, itemCode: 'RES00001', location: 'Factory', qtyOrder: 1250, transQty: 1250, price: 25, landedCostInput: null, uom: 'KG', expectedCost: -65.74723183391003, expectedAmount: -31250, expectedAvg: -90.74723183391003 },
  { seq: 162, date: '2026-10-17', code: 3, typeName: 'Reciept From Production', transNum: 6, bp: null, ref: null, itemCode: 'FP000013', location: 'Factory', qtyOrder: 1250, transQty: 1250, price: null, landedCostInput: null, uom: 'KG', expectedCost: 122.19519342465752, expectedAmount: 152743.9917808219, expectedAvg: 0 },
  { seq: 163, date: '2026-10-17', code: 3, typeName: 'Reciept From Production', transNum: 6, bp: null, ref: null, itemCode: 'SC000001', location: 'Factory', qtyOrder: 3, transQty: 3, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 164, date: '2026-10-17', code: 5, typeName: 'Transfer Out', transNum: 13, bp: null, ref: null, itemCode: 'FP000013', location: 'Factory', qtyOrder: -1250, transQty: -1250, price: null, landedCostInput: null, uom: 'KG', expectedCost: 122.19519342465752, expectedAmount: -152743.9917808219, expectedAvg: 122.19519342465752 },
  { seq: 165, date: '2026-10-17', code: 5, typeName: 'Transfer Out', transNum: 13, bp: null, ref: null, itemCode: 'SC000001', location: 'Factory', qtyOrder: -3, transQty: -3, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 },
  { seq: 166, date: '2026-10-17', code: 6, typeName: 'Transfer In', transNum: 13, bp: null, ref: null, itemCode: 'FP000013', location: 'Finished Product', qtyOrder: 1250, transQty: 1250, price: null, landedCostInput: null, uom: 'KG', expectedCost: 122.19519342465752, expectedAmount: 152743.9917808219, expectedAvg: 112.97022176385888 },
  { seq: 167, date: '2026-10-17', code: 6, typeName: 'Transfer In', transNum: 13, bp: null, ref: null, itemCode: 'SC000001', location: 'Scrap', qtyOrder: 3, transQty: 3, price: null, landedCostInput: null, uom: 'KG', expectedCost: 0, expectedAmount: 0, expectedAvg: 0 }
];

/**
 * Replay engine executing exact Excel formulas sequentially row-by-row
 */
export function replayOfficialTransactions(
  transactions: OfficialTransactionRaw[] = RAW_167_TRANSACTIONS
): {
  computedRows: ComputedTransactionRow[];
  stockByItem: StockByItemRecord[];
  totalsByLocation: Record<string, number>;
  grandTotalValue: number;
} {
  const sorted = [...transactions].sort((a, b) => a.seq - b.seq);
  const computedRows: ComputedTransactionRow[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    const prevRows = computedRows; // Rows from index 0 to i-1

    // Calculate AVG Cost (U) in the current location before this transaction
    let sumPrevAmount = 0;
    let sumPrevQty = 0;

    for (let k = 0; k < prevRows.length; k++) {
      const p = prevRows[k];
      if (p.itemCode === row.itemCode && p.location === row.location) {
        sumPrevAmount += p.amount;
        sumPrevQty += p.transQty || 0;
      }
    }

    const avgCostBefore = sumPrevQty !== 0 ? sumPrevAmount / sumPrevQty : 0;

    let cost = 0;
    let amount = 0;
    let conversionCost: number | undefined;
    let resource: number | undefined;

    switch (row.code) {
      // 1. Reciept
      case 1:
        cost = row.price || 0;
        amount = (row.transQty || 0) * cost;
        break;

      // 2. Issued
      case 2:
        cost = avgCostBefore;
        amount = (row.transQty || 0) * cost;
        break;

      // 3. Reciept From Production
      case 3:
        if (row.itemCode.startsWith('SC')) {
          cost = 0;
          amount = 0;
        } else {
          // FP: Cost = -SUMIFS(Amount[1..i-1], Trans.Num == current_Trans.Num, Code == 4) / Trans.Qty
          let sumCode4Amount = 0;
          for (let k = 0; k < prevRows.length; k++) {
            const p = prevRows[k];
            if (p.code === 4 && p.transNum === row.transNum) {
              sumCode4Amount += p.amount;
            }
          }
          const tQty = row.transQty || 1;
          cost = -sumCode4Amount / tQty;
          amount = (row.transQty || 0) * cost;
        }
        break;

      // 4. Issued For Production
      case 4:
        if (row.itemCode.startsWith('RES')) {
          resource = row.price || 25;
          cost = avgCostBefore + resource;
          const orderQ = row.qtyOrder !== null && row.qtyOrder !== undefined ? row.qtyOrder : (row.transQty || 0);
          conversionCost = (row.price || 25) * orderQ;
          amount = -conversionCost;
        } else {
          resource = 0;
          cost = avgCostBefore;
          amount = (row.transQty || 0) * cost;
        }
        break;

      // 5. Transfer Out
      case 5:
        cost = avgCostBefore;
        amount = (row.transQty || 0) * cost;
        break;

      // 6. Transfer In
      case 6: {
        // Cost from previous Transfer Out with same Trans.Num and same ItemCode
        let matchCost = 0;
        for (let k = 0; k < prevRows.length; k++) {
          const p = prevRows[k];
          if (p.code === 5 && p.transNum === row.transNum && p.itemCode === row.itemCode) {
            matchCost = p.cost;
            break;
          }
        }
        cost = matchCost;
        amount = (row.transQty || 0) * cost;
        break;
      }

      // 7. Goods Reciept PO
      case 7:
        cost = row.price || 0;
        amount = (row.transQty || 0) * cost;
        break;

      // 8. Landed Cost
      case 8: {
        const lcInput = row.landedCostInput || 0;
        let baseQtySum = 0;
        for (let k = 0; k < prevRows.length; k++) {
          const p = prevRows[k];
          if (p.code === 7 && p.transNum === row.transNum && p.itemCode === row.itemCode) {
            baseQtySum += p.transQty || 0;
          }
        }
        cost = baseQtySum !== 0 ? lcInput / baseQtySum : 0;
        amount = lcInput;
        break;
      }

      // 9. Count Posting
      case 9:
        cost = avgCostBefore;
        amount = (row.transQty || 0) * cost;
        break;

      // 10. Revaluation
      case 10:
        cost = row.price || 0;
        amount = (row.transQty || 0) * cost;
        break;

      // 11. Delivery to Customer
      case 11:
        cost = avgCostBefore;
        amount = (row.transQty || 0) * cost;
        break;

      // 12. Return to Vendor
      case 12:
        cost = avgCostBefore;
        amount = (row.transQty || 0) * cost;
        break;

      // 13. Return from Customer
      case 13: {
        // Cost from previous Delivery (Code == 11) with same Trans.Num and same ItemCode
        let matchCost = 0;
        for (let k = 0; k < prevRows.length; k++) {
          const p = prevRows[k];
          if (p.code === 11 && p.transNum === row.transNum && p.itemCode === row.itemCode) {
            matchCost = p.cost;
            break;
          }
        }
        cost = matchCost;
        amount = (row.transQty || 0) * cost;
        break;
      }

      default:
        cost = avgCostBefore;
        amount = (row.transQty || 0) * cost;
    }

    const onHandAfter = sumPrevQty + (row.transQty || 0);
    const valueAfter = sumPrevAmount + amount;
    const macAfter = onHandAfter !== 0 ? valueAfter / onHandAfter : 0;

    computedRows.push({
      ...row,
      itemName: row.itemName || ITEM_CATALOG[row.itemCode]?.name || row.itemCode,
      avgCostBefore,
      cost,
      amount,
      conversionCost,
      resource,
      onHandAfter,
      valueAfter,
      macAfter
    });
  }

  // Aggregate by Item + Location
  const locationItemMap = new Map<string, {
    itemCode: string;
    location: string;
    qty: number;
    value: number;
  }>();

  for (const cr of computedRows) {
    const key = `${cr.itemCode}:::${cr.location}`;
    const curr = locationItemMap.get(key) || {
      itemCode: cr.itemCode,
      location: cr.location,
      qty: 0,
      value: 0
    };
    curr.qty += cr.transQty || 0;
    curr.value += cr.amount;
    locationItemMap.set(key, curr);
  }

  // Filter only items where ROUND(qty, 6) != 0
  const stockByItem: StockByItemRecord[] = [];
  let seqIdx = 1;

  for (const [, s] of locationItemMap.entries()) {
    const roundedQty = Math.round(s.qty * 1000000) / 1000000;
    if (Math.abs(roundedQty) > 0.000001) {
      const cat = ITEM_CATALOG[s.itemCode];
      const avgCost = s.qty !== 0 ? s.value / s.qty : 0;
      stockByItem.push({
        seq: seqIdx++,
        itemType: cat?.type || 'Raw Material',
        itemCode: s.itemCode,
        itemName: cat?.name || s.itemCode,
        location: s.location,
        qty: s.qty,
        value: s.value,
        avgCost
      });
    }
  }

  // Calculate totals by location
  const totalsByLocation: Record<string, number> = {
    'Raw Material': 0,
    'Finished Product': 0,
    'Scrap': 0,
    'Factory': 0,
    'Packing': 0
  };
  let grandTotalValue = 0;

  for (const r of stockByItem) {
    totalsByLocation[r.location] = (totalsByLocation[r.location] || 0) + r.value;
    grandTotalValue += r.value;
  }

  return {
    computedRows,
    stockByItem,
    totalsByLocation,
    grandTotalValue
  };
}
