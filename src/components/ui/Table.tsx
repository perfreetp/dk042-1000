import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Empty from './Empty';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (record: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sorter?: (a: T, b: T) => number;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T) => string);
  striped?: boolean;
  hoverable?: boolean;
  loading?: boolean;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  pagination?: {
    pageSize: number;
    showTotal?: boolean;
  };
  className?: string;
  onRowClick?: (record: T, index: number) => void;
}

function Table<T extends object>({
  columns,
  data,
  rowKey = 'id' as keyof T,
  striped = true,
  hoverable = true,
  loading = false,
  emptyText = '暂无数据',
  emptyIcon,
  emptyAction,
  pagination,
  className,
  onRowClick,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = pagination?.pageSize ?? 10;
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = pagination ? data.slice(startIndex, endIndex) : data;

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    const value = record[rowKey];
    return value !== undefined ? String(value) : String(index);
  };

  const alignStyles: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const renderContent = (
    column: Column<T>,
    record: T,
    index: number
  ): React.ReactNode => {
    if (column.render) {
      return column.render(record, index);
    }
    const key = column.key as keyof T;
    return record[key] as React.ReactNode;
  };

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 dark:bg-gray-700" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700"
            />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Empty icon={emptyIcon} title={emptyText} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    style={{ width: column.width }}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider',
                      alignStyles[column.align || 'left']
                    )}
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.map((record, index) => {
                const actualIndex = startIndex + index;
                return (
                  <tr
                    key={getRowKey(record, actualIndex)}
                    className={cn(
                      'transition-colors duration-150',
                      striped && actualIndex % 2 === 1
                        ? 'bg-gray-50/50 dark:bg-gray-800/50'
                        : 'bg-white dark:bg-gray-800',
                      hoverable &&
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(record, actualIndex)}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={cn(
                          'px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300',
                          alignStyles[column.align || 'left']
                        )}
                      >
                        {renderContent(column, record, actualIndex)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {pagination.showTotal && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                共 {total} 条记录，第 {currentPage}/{totalPages} 页
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                  }
                  if (currentPage > totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-8 h-8 text-sm rounded-lg transition-colors',
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Table;
