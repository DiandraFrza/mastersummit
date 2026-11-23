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
    data: Pagination<T>;
    columns: ColumnDef<T>[];
    filters?: Record<string, any>;
    searchPlaceholder?: string;
    filterSlot?: React.ReactNode;
    actionsSlot?: React.ReactNode;
    emptyText?: string;
    routeName?: string;
}

export default function DataTable<T extends Record<string, any>>({
    data,
    columns,
    filters = {},
    searchPlaceholder = 'Cari data...',
    filterSlot,
    actionsSlot,
    emptyText = 'Tidak ada data ditemukan.',
    routeName,
}: DataTableProps<T>) {
    const [search, setSearch] = useState<string>(filters.search || '');
    const [isPending, startTransition] = useTransition();
    const isFirstMount = useRef(true);
    const parentRef = useRef<HTMLDivElement>(null);

    // Entries selector options per requirements
    const perPageOptions = [10, 20, 50, 100, 300, 500];
    const isVirtual = (data.per_page || 10) >= 100;

    // Debounced search (300ms)
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                updateQuery({ search, page: 1 });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const updateQuery = (newParams: Record<string, any>) => {
        const currentUrl = routeName ? route(routeName) : window.location.pathname;
        const currentParams = new URLSearchParams(window.location.search);
        const merged: Record<string, any> = {};

        currentParams.forEach((val, key) => {
            merged[key] = val;
        });

        Object.entries(newParams).forEach(([k, v]) => {
            if (v === '' || v === null || v === undefined) {
                delete merged[k];
            } else {
                merged[k] = v;
            }
        });

        startTransition(() => {
            router.get(currentUrl, merged, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        });
    };

    const handleSort = (columnKey: string) => {
        const currentSort = filters.sort;
        const currentDir = filters.direction || 'asc';

        let newDir = 'asc';
        if (currentSort === columnKey) {
            newDir = currentDir === 'asc' ? 'desc' : 'asc';
        }

        updateQuery({ sort: columnKey, direction: newDir, page: 1 });
    };

    const handlePerPageChange = (newPerPage: number) => {
        updateQuery({ per_page: newPerPage, page: 1 });
    };

    const handleReset = () => {
        setSearch('');
        const currentUrl = routeName ? route(routeName) : window.location.pathname;
        startTransition(() => {
            router.get(currentUrl, { per_page: data.per_page }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        });
    };

    // Virtualization setup when per_page >= 100
    const rowVirtualizer = useVirtualizer({
        count: data.data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 41,
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
        <div className="bg-white border border-zinc-200/80 rounded-md overflow-hidden flex flex-col">
            {/* Table Control Bar */}
            <div className="p-3.5 border-b border-zinc-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
                {/* Search & Reset */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 placeholder:text-zinc-400 transition-colors"
                        />
                        {isPending && (
                            <Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />
                        )}
                    </div>

                    {(search || filters.sort || Object.keys(filters).some((k) => !['page', 'per_page', 'sort', 'direction', 'search'].includes(k) && filters[k])) && (
                        <button
                            type="button"
                            onClick={handleReset}
                            title="Reset filter & pencarian"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-sm transition-colors shrink-0"
                        >
                            <RotateCcw className="w-3 h-3 text-zinc-500" />
                            <span>Reset</span>
                        </button>
                    )}
                </div>

                {/* Slot Filters, Actions & Entries */}
                <div className="flex items-center flex-wrap gap-2 justify-end">
                    {filterSlot}

                    {actionsSlot}

                    {/* Entries Selector */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 pl-1 border-l border-zinc-200/80">
                        <span className="hidden md:inline">Tampilkan</span>
                        <select
                            value={data.per_page}
                            onChange={(e) => handlePerPageChange(Number(e.target.value))}
                            className="px-2 py-1 text-xs tabular-nums bg-white border border-zinc-200/90 rounded-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium text-zinc-800"
                        >
                            {perPageOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        <span className="hidden md:inline">baris</span>
                    </div>
                </div>
            </div>

            {/* Table Container (Engages Virtualization Scroll Container when per_page >= 100) */}
            <div
                ref={parentRef}
                className={`w-full overflow-x-auto ${isVirtual ? 'max-h-[600px] overflow-y-auto' : ''}`}
            >
                <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-zinc-50/95 backdrop-blur-xs border-b border-zinc-200/80">
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
                                        className={`py-2.5 px-3 font-semibold text-zinc-700 select-none text-[11px] tracking-tight uppercase whitespace-nowrap ${
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
                                                            <ChevronUp className="w-3.5 h-3.5 text-zinc-900" />
                                                        ) : (
                                                            <ChevronDown className="w-3.5 h-3.5 text-zinc-900" />
                                                        )
                                                    ) : (
                                                        <ChevronsUpDown className="w-3 h-3 text-zinc-300 hover:text-zinc-500" />
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
                                const row = data.data[virtualRow.index];
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
                                        className="hover:bg-zinc-50/70 transition-colors"
                                    >
                                        {columns.map((col, colIdx) => {
                                            const cellValue = getCellValue(row, col.accessorKey);
                                            return (
                                                <td
                                                    key={colIdx}
                                                    style={{ width: col.width }}
                                                    className={`py-2 px-3 text-zinc-700 whitespace-nowrap ${
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
                            {data.data.length > 0 ? (
                                data.data.map((row, rowIdx) => (
                                    <tr
                                        key={rowIdx}
                                        className="hover:bg-zinc-50/70 transition-colors group"
                                    >
                                        {columns.map((col, colIdx) => {
                                            const cellValue = getCellValue(row, col.accessorKey);
                                            return (
                                                <td
                                                    key={colIdx}
                                                    style={{ width: col.width }}
                                                    className={`py-2 px-3 text-zinc-700 whitespace-nowrap ${
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
                                        className="py-12 text-center text-xs text-zinc-400 font-medium"
                                    >
                                        {emptyText}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    )}
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 border-t border-zinc-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-white">
                <div className="text-zinc-500 tabular-nums">
                    Menampilkan <span className="font-semibold text-zinc-800">{data.from ?? 0}</span> sampai{' '}
                    <span className="font-semibold text-zinc-800">{data.to ?? 0}</span> dari{' '}
                    <span className="font-semibold text-zinc-800">{data.total}</span> total data
                </div>

                {data.last_page > 1 && (
                    <div className="flex items-center gap-1">
                        {/* Prev Button */}
                        <button
                            type="button"
                            disabled={!data.prev_page_url}
                            onClick={() => data.prev_page_url && updateQuery({ page: data.current_page - 1 })}
                            className="inline-flex items-center justify-center p-1.5 text-zinc-600 bg-white border border-zinc-200/90 rounded-sm hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Halaman Sebelumnya"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        {/* Page Numbers */}
                        {data.links
                            .filter((link) => !link.label.includes('Previous') && !link.label.includes('Next'))
                            .map((link, idx) => {
                                const isCurrent = link.active;
                                const isEllipsis = link.label === '...';

                                if (isEllipsis) {
                                    return (
                                        <span key={idx} className="px-2 py-1 text-zinc-400">
                                            ...
                                        </span>
                                    );
                                }

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => updateQuery({ page: Number(link.label) })}
                                        className={`min-w-[28px] h-7 px-2 text-xs tabular-nums font-medium rounded-sm border transition-colors ${
                                            isCurrent
                                                ? 'bg-zinc-900 text-white border-zinc-900'
                                                : 'bg-white text-zinc-700 border-zinc-200/90 hover:bg-zinc-50 hover:text-zinc-900'
                                        }`}
                                    >
                                        {link.label}
                                    </button>
                                );
                            })}

                        {/* Next Button */}
                        <button
                            type="button"
                            disabled={!data.next_page_url}
                            onClick={() => data.next_page_url && updateQuery({ page: data.current_page + 1 })}
                            className="inline-flex items-center justify-center p-1.5 text-zinc-600 bg-white border border-zinc-200/90 rounded-sm hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Halaman Berikutnya"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
