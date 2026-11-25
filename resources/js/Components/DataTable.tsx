import React, { useState, useEffect, useRef, useTransition } from 'react';
import { router } from '@inertiajs/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Search,
    RotateCcw,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import type { Pagination } from '@/types';

export interface ColumnDef<T> {
    header: string | React.ReactNode;
    accessorKey?: keyof T | string;
    id?: string;
    cell?: (info: { row: T; value: any; index: number }) => React.ReactNode;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    isNumeric?: boolean;
    className?: string;
    width?: string;
}

interface DataTableProps<T> {
    data: Pagination<T> | T[];
    pagination?: Pagination<T>;
    columns: ColumnDef<T>[];
    filters?: Record<string, any>;
    searchPlaceholder?: string;
    filterSlot?: React.ReactNode;
    actionsSlot?: React.ReactNode;
    emptyText?: string;
    emptyMessage?: string;
    routeName?: string;
    routeParams?: Record<string, any>;
    filterable?: boolean;
    searchable?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
    data,
    pagination,
    columns,
    filters = {},
    searchPlaceholder = 'Cari data...',
    filterSlot,
    actionsSlot,
    emptyText,
    emptyMessage,
    routeName,
    routeParams,
    filterable = true,
    searchable = true,
}: DataTableProps<T>) {
    // Normalize data and pagination
    const paginationData: Pagination<T> = Array.isArray(data)
        ? pagination || {
              data: data,
              current_page: 1,
              first_page_url: '',
              from: data.length > 0 ? 1 : 0,
              last_page: 1,
              last_page_url: '',
              links: [],
              next_page_url: null,
              path: '',
              per_page: data.length,
              prev_page_url: null,
              to: data.length,
              total: data.length,
          }
        : data;

    const items = paginationData.data || [];
    const isVirtual = paginationData.per_page >= 100 && items.length >= 100;

    const [search, setSearch] = useState(filters.search || '');
    const [isPending, startTransition] = useTransition();
    const parentRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resolvedEmptyText = emptyText || emptyMessage || 'Tidak ada data ditemukan.';
    const perPageOptions = [10, 20, 50, 100, 300, 500];

    // Smart URL query updater
    const updateQuery = (newParams: Record<string, any>) => {
        const mergedParams: Record<string, any> = {
            ...filters,
            ...newParams,
        };

        // Remove empty keys
        Object.keys(mergedParams).forEach((key) => {
            if (mergedParams[key] === '' || mergedParams[key] === null || mergedParams[key] === undefined || mergedParams[key] === 'all') {
                delete mergedParams[key];
            }
        });

        const currentUrl = routeName
            ? route(routeName, routeParams)
            : window.location.pathname;

        startTransition(() => {
            router.get(currentUrl, mergedParams, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        });
    };

    // Debounced search (300ms)
    useEffect(() => {
        if (search === (filters.search || '')) return;

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            updateQuery({ search, page: 1 });
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [search]);

    const handleSort = (columnKey: string) => {
        const currentSort = filters.sort;
        const currentDir = filters.direction || 'asc';

        let nextSort: string | undefined = columnKey;
        let nextDir: string | undefined = 'asc';

        if (currentSort === columnKey) {
            if (currentDir === 'asc') {
                nextDir = 'desc';
            } else {
                nextSort = undefined;
                nextDir = undefined;
            }
        }

        updateQuery({
            sort: nextSort,
            direction: nextDir,
            page: 1,
        });
    };

    const handlePerPageChange = (newPerPage: number) => {
        updateQuery({
            per_page: newPerPage,
            page: 1,
        });
    };

    const handleReset = () => {
        setSearch('');
        const currentUrl = routeName ? route(routeName) : window.location.pathname;
        startTransition(() => {
            router.get(currentUrl, { per_page: paginationData.per_page }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        });
    };

    // Virtualization setup when per_page >= 100
    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 52,
        overscan: 10,
        enabled: isVirtual,
    });

    const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
        if (align === 'center') return 'text-center';
        if (align === 'right') return 'text-right';
        return 'text-left';
    };

    const getCellValue = (row: T, accessorKey?: keyof T | string) => {
        if (!accessorKey) return null;
        if (typeof accessorKey === 'string' && accessorKey.includes('.')) {
            return accessorKey.split('.').reduce((acc, part) => acc?.[part], row);
        }
        return row[accessorKey as keyof T];
    };

    return (
        <div className="bg-white border border-zinc-200/90 rounded-md overflow-hidden flex flex-col shadow-xs">
            {/* Table Control Bar */}
            <div className="p-4 border-b border-zinc-200/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 bg-white">
                {/* Search & Reset */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    {searchable && (
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full h-10 pl-10 pr-9 text-sm bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 placeholder:text-zinc-400 transition-colors"
                            />
                            {isPending && (
                                <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />
                            )}
                        </div>
                    )}

                    {(search || filters.sort || Object.keys(filters).some((k) => !['page', 'per_page', 'sort', 'direction', 'search'].includes(k) && filters[k])) && (
                        <button
                            type="button"
                            onClick={handleReset}
                            title="Reset filter & pencarian"
                            className="inline-flex items-center gap-1.5 h-10 px-3.5 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors shrink-0"
                        >
                            <RotateCcw className="w-4 h-4 text-zinc-500" />
                            <span>Reset</span>
                        </button>
                    )}
                </div>

                {/* Slot Filters, Actions & Entries */}
                <div className="flex flex-wrap items-end gap-3 justify-start sm:justify-end">
                    {filterSlot}

                    {actionsSlot}

                    {/* Entries Selector */}
                    {filterable && (
                        <div className="flex items-center gap-2 text-sm text-zinc-600 pl-2 border-l border-zinc-200/80">
                            <span className="hidden md:inline font-medium">Tampilkan</span>
                            <select
                                value={data.per_page}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                className="h-10 px-3 text-sm tabular-nums bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold text-zinc-800"
                            >
                                {perPageOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                            <span className="hidden md:inline text-zinc-500">baris</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Table Container (Engages Virtualization Scroll Container when per_page >= 100) */}
            <div
                ref={parentRef}
                className={`w-full min-w-0 overflow-x-auto ${isVirtual ? 'max-h-[650px] overflow-y-auto' : ''}`}
            >
                <table className="w-full border-collapse text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-zinc-50/95 backdrop-blur-xs border-b border-zinc-200">
                        <tr>
                            {columns.map((col, idx) => {
                                const colKey = (col.accessorKey || col.id || idx).toString();
                                const isSorted = filters.sort === colKey;
                                const sortDir = filters.direction || 'asc';

                                return (
                                    <th
                                        key={idx}
                                        style={{ width: col.width }}
                                        onClick={() => col.sortable && handleSort(colKey)}
                                        className={`py-3.5 px-4 font-semibold text-zinc-600 select-none text-xs tracking-wider uppercase whitespace-nowrap ${
                                            getAlignmentClass(col.align)
                                        } ${col.sortable ? 'cursor-pointer hover:bg-zinc-100/80 transition-colors' : ''} ${
                                            col.className || ''
                                        }`}
                                    >
                                        <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end w-full' : ''}`}>
                                            <span>{col.header}</span>
                                            {col.sortable && (
                                                <span className="text-zinc-400">
                                                    {isSorted ? (
                                                        sortDir === 'asc' ? (
                                                            <ChevronUp className="w-4 h-4 text-zinc-900" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-zinc-900" />
                                                        )
                                                    ) : (
                                                        <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-300 hover:text-zinc-500" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    {/* Virtualized or Standard Body */}
                    {isVirtual ? (
                        <tbody
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                position: 'relative',
                            }}
                            className="divide-y divide-zinc-100"
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const row = items[virtualRow.index];
                                return (
                                    <tr
                                        key={virtualRow.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                        className="even:bg-zinc-50/70 hover:bg-zinc-100/70 transition-colors"
                                    >
                                        {columns.map((col, colIdx) => {
                                            const cellValue = getCellValue(row, col.accessorKey);
                                            return (
                                                <td
                                                    key={colIdx}
                                                    style={{ width: col.width }}
                                                    className={`py-3.5 px-4 text-zinc-800 whitespace-nowrap ${
                                                        getAlignmentClass(col.align)
                                                    } ${col.isNumeric ? 'tabular-nums' : ''} ${col.className || ''}`}
                                                >
                                                    {col.cell
                                                        ? col.cell({ row, value: cellValue, index: virtualRow.index })
                                                        : (cellValue ?? '—')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    ) : (
                        <tbody className="divide-y divide-zinc-100 bg-white">
                            {items.length > 0 ? (
                                items.map((row, rowIdx) => (
                                    <tr
                                        key={rowIdx}
                                        className="even:bg-zinc-50/70 hover:bg-zinc-100/70 transition-colors group"
                                    >
                                        {columns.map((col, colIdx) => {
                                            const cellValue = getCellValue(row, col.accessorKey);
                                            return (
                                                <td
                                                    key={colIdx}
                                                    style={{ width: col.width }}
                                                    className={`py-3.5 px-4 text-zinc-800 whitespace-nowrap ${
                                                        getAlignmentClass(col.align)
                                                    } ${col.isNumeric ? 'tabular-nums' : ''} ${col.className || ''}`}
                                                >
                                                    {col.cell
                                                        ? col.cell({ row, value: cellValue, index: rowIdx })
                                                        : (cellValue ?? '—')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-16 text-center text-sm text-zinc-400 font-medium"
                                    >
                                        {resolvedEmptyText}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    )}
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3.5 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm bg-white">
                <div className="text-zinc-600 tabular-nums">
                    Menampilkan <span className="font-semibold text-zinc-900">{paginationData.from ?? 0}</span> sampai{' '}
                    <span className="font-semibold text-zinc-900">{paginationData.to ?? 0}</span> dari{' '}
                    <span className="font-semibold text-zinc-900">{paginationData.total}</span> data
                </div>

                {paginationData.last_page > 1 && (
                    <div className="flex items-center gap-1.5">
                        {/* Prev Button */}
                        <button
                            type="button"
                            disabled={!paginationData.prev_page_url}
                            onClick={() => paginationData.prev_page_url && updateQuery({ page: paginationData.current_page - 1 })}
                            className="inline-flex items-center justify-center h-10 px-3.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Halaman Sebelumnya"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="sr-only">Sebelumnya</span>
                        </button>

                        {/* Page Numbers */}
                        {paginationData.links
                            .filter((link) => !link.label.includes('Previous') && !link.label.includes('Next'))
                            .map((link, idx) => {
                                const isCurrent = link.active;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={isCurrent || !link.url}
                                        onClick={() => {
                                             if (link.url) {
                                                const url = new URL(link.url, window.location.origin);
                                                const targetPage = url.searchParams.get('page');
                                                if (targetPage) updateQuery({ page: Number(targetPage) });
                                            }
                                        }}
                                        className={`inline-flex items-center justify-center h-10 min-w-10 px-3 text-sm tabular-nums rounded-md font-medium transition-colors ${
                                            isCurrent
                                                ? 'bg-zinc-900 text-white font-semibold'
                                                : 'text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}

                        {/* Next Button */}
                        <button
                            type="button"
                            disabled={!paginationData.next_page_url}
                            onClick={() => paginationData.next_page_url && updateQuery({ page: paginationData.current_page + 1 })}
                            className="inline-flex items-center justify-center h-10 px-3.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Halaman Berikutnya"
                        >
                            <ChevronRight className="w-4 h-4" />
                            <span className="sr-only">Berikutnya</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
