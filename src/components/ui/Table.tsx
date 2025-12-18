'use client';

import { ReactNode } from 'react';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No hay datos para mostrar',
  emptyAction,
  onRowClick,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-background p-12 text-center shadow-md border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {emptyMessage}
        </h3>
        {emptyAction && <div className="mt-6">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-background shadow-md border border-border overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground ${
                  column.headerClassName || ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors duration-150 ${
                onRowClick ? 'cursor-pointer hover:bg-muted/30' : 'hover:bg-muted/30'
              }`}
            >
              {columns.map((column, index) => {
                let content: ReactNode;

                if (typeof column.accessor === 'function') {
                  content = column.accessor(row);
                } else {
                  content = row[column.accessor] as ReactNode;
                }

                return (
                  <td
                    key={index}
                    className={`px-6 py-4 whitespace-nowrap ${
                      column.className || 'text-sm text-foreground'
                    }`}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
