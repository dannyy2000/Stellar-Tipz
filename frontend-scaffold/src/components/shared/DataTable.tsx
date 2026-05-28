import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ArrowUp, ArrowDown, ChevronDown, Columns3 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
  hidden?: boolean;
}

interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  emptyMessage?: string;
  tabletColumns?: string[];
  mobileCards?: boolean;
  className?: string;
}

const alignClass: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DataTableInner<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  pagination,
  emptyMessage = 'No data available',
  tabletColumns,
  mobileCards = true,
  className = '',
}: DataTableProps<T>) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [sort, setSort] = useState<SortState | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => {
    return new Set(columns.filter((c) => !c.hidden).map((c) => c.key));
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;

    return [...data].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sort.direction === 'asc' ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      const cmp = as.localeCompare(bs);
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sort, columns]);

  const handleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const toggleColumn = useCallback((key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleKeys.has(c.key)),
    [columns, visibleKeys],
  );

  const tabletHiddenKeys = useMemo(() => {
    if (!tabletColumns) return new Set<string>();
    return new Set(columns.filter((c) => !tabletColumns.includes(c.key)).map((c) => c.key));
  }, [columns, tabletColumns]);

  if (data.length === 0) {
    return (
      <div className={`border-2 border-black bg-white p-8 text-center ${className}`}>
        <p className="text-sm font-bold uppercase tracking-wide text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const tableContent = (
    <div className="w-full overflow-x-auto border-2 border-black">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr className="bg-black text-white">
            {visibleColumns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-black uppercase tracking-wide text-sm border-r-2 border-white last:border-r-0 text-left ${
                  alignClass[col.align ?? 'left']
                } sticky top-0 z-20 ${
                  tabletHiddenKeys.has(col.key) ? 'hidden md:table-cell' : ''
                } ${col.sortable ? 'cursor-pointer select-none hover:bg-gray-800' : ''}`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                role={col.sortable ? 'columnheader button' : 'columnheader'}
                aria-label={col.sortable ? `Sort by ${col.label}` : undefined}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.label}
                  {col.sortable && sort?.key === col.key && (
                    sort.direction === 'asc'
                      ? <ArrowUp size={14} className="inline" />
                      : <ArrowDown size={14} className="inline" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={[
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                'border-t-2 border-black transition-transform duration-150',
                onRowClick ? 'cursor-pointer hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : '',
              ].join(' ')}
            >
              {visibleColumns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-sm border-r-2 border-black last:border-r-0 ${
                    alignClass[col.align ?? 'left']
                  } ${tabletHiddenKeys.has(col.key) ? 'hidden md:table-cell' : ''}`}
                >
                  {col.render
                    ? col.render(row)
                    : (row[col.key] as React.ReactNode) ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const cardContent = mobileCards && (
    <div className="space-y-3">
      {sorted.map((row) => (
        <article
          key={keyExtractor(row)}
          onClick={() => onRowClick?.(row)}
          role="article"
          className={`border-2 border-black p-4 bg-white ${
            onRowClick ? 'cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''
          } transition-transform duration-150`}
        >
          <div className="space-y-2">
            {visibleColumns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-gray-500 shrink-0">
                  {col.label}
                </span>
                <span className={`text-sm font-medium ${alignClass[col.align ?? 'left']} min-w-0`}>
                  {col.render
                    ? col.render(row)
                    : (row[col.key] as React.ReactNode) ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            size="sm"
            icon={<Columns3 size={14} />}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Toggle column visibility"
            aria-expanded={dropdownOpen}
          >
            Columns
            <ChevronDown size={14} className={`ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </Button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-48 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-bold uppercase tracking-wide hover:bg-gray-50 border-b-2 border-black last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={visibleKeys.has(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="accent-black"
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive content */}
      {isDesktop ? tableContent : cardContent}

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DataTable<T extends Record<string, any>>(props: DataTableProps<T>) {
  return <DataTableInner {...props} />;
}

export default DataTable;
