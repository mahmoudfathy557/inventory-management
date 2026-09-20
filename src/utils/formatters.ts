import { Language } from '../types';

export const toEnglishDigits = (val: string | number): string => {
  if (typeof val === 'number') return String(val);
  return String(val ?? '')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
};

export const formatCurrency = (amount: number, lang: Language = 'ar'): string => {
  const formatted = (amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3
  });
  return lang === 'ar' ? `${formatted} ج.م` : `EGP ${formatted}`;
};

export const formatNumber = (num: number, _lang: Language = 'ar', decimals = 2): string => {
  return (num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

/**
 * Exports tabular data directly to a standard CSV file with UTF-8 BOM (\uFEFF)
 * Guarantees Arabic text opens crystal-clean in Microsoft Excel, Google Sheets, and data tools without encoding corruption.
 */
export const exportToCSV = (headers: string[], rows: (string | number | boolean | null | undefined)[][], filename: string) => {
  const escapeCell = (val: string | number | boolean | null | undefined) => {
    if (val === null || val === undefined) return '""';
    const stringVal = String(val).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const csvContent = '\uFEFF' + [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_');
  link.setAttribute('download', `${sanitizedFilename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToExcel = exportToCSV;

export const triggerPrint = () => {
  window.print();
};
