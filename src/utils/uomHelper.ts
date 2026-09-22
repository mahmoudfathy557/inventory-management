import { UOM } from '../types';

/**
 * Checks if a UOM is a primary (base) unit.
 * A primary unit either has uomType === 'PRIMARY' or has no parent baseUOM or its conversionFactor is 1 and baseUOM is itself or empty.
 */
export function isPrimaryUOM(uom: UOM): boolean {
  if (uom.uomType === 'PRIMARY') return true;
  if (uom.uomType === 'SECONDARY') return false;
  // Fallback for legacy data:
  if (!uom.baseUOM || uom.baseUOM.trim().toUpperCase() === uom.code.trim().toUpperCase()) {
    return true;
  }
  return uom.conversionFactor === 1 && (!uom.baseUOM || uom.baseUOM === uom.code);
}

/**
 * Returns all primary units (used for item coding / master data).
 */
export function getPrimaryUOMs(allUOMs: UOM[]): UOM[] {
  return allUOMs.filter(u => isPrimaryUOM(u) && u.active !== false);
}

/**
 * Returns secondary units linked to a specific primary UOM code.
 */
export function getLinkedSecondaryUOMs(primaryUOMCode: string | undefined, allUOMs: UOM[]): UOM[] {
  if (!primaryUOMCode) return [];
  const cleanCode = primaryUOMCode.trim().toUpperCase();
  return allUOMs.filter(u => {
    if (u.active === false) return false;
    if (isPrimaryUOM(u)) return false;
    const parentCode = (u.baseUOM || '').trim().toUpperCase();
    return parentCode === cleanCode && u.code.trim().toUpperCase() !== cleanCode;
  });
}

/**
 * Returns all available UOMs for a given item based on its primary/default UOM.
 * Locked strictly to the item's primary UOM and any secondary UOMs linked to it.
 * E.g., if item is coded in KG: returns [KG, TON, GM] (only weight units).
 * E.g., if item is coded in MTR: returns [MTR, ROLL, CM] (only length units).
 * E.g., if item is coded in PCS: returns [PCS, DOZEN, BOX, PACK] (only discrete units).
 */
export function getAvailableUOMsForItem(itemDefaultUOM: string | undefined, allUOMs: UOM[]): UOM[] {
  if (!itemDefaultUOM) return allUOMs;

  const cleanCode = itemDefaultUOM.trim().toUpperCase();

  // Find the primary UOM in master data
  const primaryUom = allUOMs.find(u => u.code.trim().toUpperCase() === cleanCode);

  // Find all secondary UOMs whose baseUOM is this primary UOM
  const linkedSecondaries = allUOMs.filter(u => {
    if (u.active === false) return false;
    const parentCode = (u.baseUOM || '').trim().toUpperCase();
    return parentCode === cleanCode && u.code.trim().toUpperCase() !== cleanCode;
  });

  if (primaryUom) {
    return [primaryUom, ...linkedSecondaries];
  }

  // If the primary UOM code is not in master list, create a virtual primary entry
  return [
    {
      id: `uom-${cleanCode.toLowerCase()}`,
      code: cleanCode,
      nameAr: cleanCode,
      nameEn: cleanCode,
      uomType: 'PRIMARY',
      conversionFactor: 1,
      active: true
    },
    ...linkedSecondaries
  ];
}

/**
 * Returns the conversion factor from the transaction UOM to the Item's base primary UOM.
 * E.g. if item is KG, and transaction is TON (1 TON = 1000 KG), factor is 1000.
 * If transaction is GM (1 GM = 0.001 KG), factor is 0.001.
 * If transaction is KG, factor is 1.
 */
export function getConversionFactorToBase(
  selectedUomCode: string | undefined,
  itemBaseUOMCode: string | undefined,
  allUOMs: UOM[]
): number {
  if (!selectedUomCode || !itemBaseUOMCode) return 1;
  const sel = selectedUomCode.trim().toUpperCase();
  const base = itemBaseUOMCode.trim().toUpperCase();

  if (sel === base) return 1;

  const uom = allUOMs.find(u => u.code.trim().toUpperCase() === sel);
  if (uom && uom.conversionFactor && uom.conversionFactor > 0) {
    return uom.conversionFactor;
  }

  return 1;
}

/**
 * Converts a quantity in a selected UOM to the item's primary base UOM.
 */
export function convertToBaseQty(
  qty: number,
  selectedUomCode: string | undefined,
  itemBaseUOMCode: string | undefined,
  allUOMs: UOM[]
): number {
  const factor = getConversionFactorToBase(selectedUomCode, itemBaseUOMCode, allUOMs);
  return Number((qty * factor).toFixed(6));
}

/**
 * Formats a display badge / text explaining the conversion.
 * E.g.: "2 TON = 2,000 KG (1 TON = 1,000 KG)"
 */
export function formatUOMTransactionLabel(
  quantity: number,
  uomCode: string,
  baseUOMCode?: string,
  conversionFactor?: number,
  isArOrLang: boolean | string = true
): string {
  const isAr = typeof isArOrLang === 'string' ? isArOrLang === 'ar' : Boolean(isArOrLang);
  if (!baseUOMCode || uomCode.trim().toUpperCase() === baseUOMCode.trim().toUpperCase() || !conversionFactor || conversionFactor === 1) {
    return `${quantity.toLocaleString('en-US')} ${uomCode}`;
  }

  const baseQty = Number((quantity * conversionFactor).toFixed(4));
  return `${quantity.toLocaleString('en-US')} ${uomCode} = ${baseQty.toLocaleString('en-US')} ${baseUOMCode} (1 ${uomCode} = ${conversionFactor.toLocaleString('en-US')} ${baseUOMCode})`;
}
