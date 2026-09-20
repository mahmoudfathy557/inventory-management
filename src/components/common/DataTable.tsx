import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportToExcel } from '../../utils/formatters';

export interface Column<T> {
  key: string;
  headerAr: string;
  headerEn: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  exportValue?: (item: T) => string | number;
}

interface DataTableProps<T> {
  id?: string;
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchFields?: (keyof T | string)[];
  titleAr?: string;
  titleEn?: string;
  exportFileName?: string;
  onPrint?: () => void;
  actions?: React.ReactNode;
  defaultSortKey?: string;
  defaultSortOrder?: 'asc' | 'desc';
  pageSize?: number;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  id = 'data-table',
  data,
  columns,
  keyExtractor,
  searchFields = [],
  titleAr,
  titleEn,
  exportFileName = 'Export',
  onPrint,
  actions,
  defaultSortKey,
  defaultSortOrder = 'desc',
  pageSize = 10,
  isLoading = false
}: DataTableProps<T>) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey || columns[0]?.key);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);
  const [currentPage, setCurrentPage] = useState(1);

  // Search & Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const lower = searchTerm.toLowerCase();

    return data.filter(item => {
      if (searchFields.length > 0) {
        return searchFields.some(field => {
          const val = item[field];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(lower);
        });
      }
      return Object.values(item).some(
        val => val !== undefined && val !== null && String(val).toLowerCase().includes(lower)
      );
    });
  }, [data, searchTerm, searchFields]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleExport = () => {
    const headers = columns.map(c => (isAr ? c.headerAr : c.headerEn));
    const rows = sortedData.map(item =>
      columns.map(c => {
        if (c.exportValue) return c.exportValue(item);
        const val = item[c.key];
        return val !== undefined && val !== null ? String(val) : '';
      })
    );
    exportToExcel(headers, rows, exportFileName);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" id={id}>
      {/* Table Header Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-3">
          {(titleAr || titleEn) && (
            <h2 className="font-bold text-sm text-slate-800 tracking-tight">
              {isAr ? titleAr : titleEn}
            </h2>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
            {filteredData.length} {isAr ? 'سجل' : 'records'}
          </span>
        </div>

        {/* Search and Action Tools */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className={`w-4 h-4 absolute ${isAr ? 'right-3' : 'left-3'} top-2.5 text-slate-400`} />
            <input
              type="text"
              id={`${id}-search-input`}
              placeholder={isAr ? 'بحث سريع...' : 'Quick search...'}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full text-xs py-2 ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              } rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>

          <button
            id={`${id}-btn-export-excel`}
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-2xs"
            title={isAr ? 'تصدير إلى إكسيل (Excel CSV)' : 'Export to Excel CSV'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">{isAr ? 'تصدير إكسيل' : 'Excel'}</span>
          </button>

          {onPrint && (
            <button
              id={`${id}-btn-print`}
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              title={isAr ? 'طباعة التقرير / الجدول' : 'Print Table'}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">{isAr ? 'طباعة' : 'Print'}</span>
            </button>
          )}

          {actions}
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 select-none">
            <tr>
              {columns.map(col => {
                const isCurrentSort = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={`py-3 px-4 ${
                      col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'
                    } ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-200/60' : ''} whitespace-nowrap`}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        col.align === 'center' ? 'justify-center' : col.align === 'left' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <span>{isAr ? col.headerAr : col.headerEn}</span>
                      {col.sortable !== false && (
                        <ArrowUpDown
                          className={`w-3 h-3 ${isCurrentSort ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 6) }).map((_, rowIndex) => (
                <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
                  {columns.map((col, colIndex) => (
                    <td
                      key={`skeleton-col-${col.key}-${colIndex}`}
                      className={`py-3.5 px-4 whitespace-nowrap ${
                        col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'
                      }`}
                    >
                      <div
                        className={`h-4 bg-slate-200/70 rounded-md inline-block ${
                          colIndex === 0 ? 'w-24' : colIndex === columns.length - 1 ? 'w-16' : 'w-28'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-slate-400">
                  {isAr ? 'لا توجد سجلات مطابقة للبحث' : 'No matching records found'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => (
                <tr key={keyExtractor(item)} className="hover:bg-blue-50/30 transition-colors">
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 whitespace-nowrap ${
                        col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'
                      }`}
                    >
                      {col.render ? col.render(item) : (item[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 text-xs no-print">
          <span className="text-slate-500">
            {isAr
              ? `صفحة ${currentPage} من ${totalPages} (${sortedData.length} سجل)`
              : `Page ${currentPage} of ${totalPages} (${sortedData.length} total)`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
            </button>
            <span className="px-2 font-mono text-xs">{currentPage}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
