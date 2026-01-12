
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSortTable } from "@/hooks/use-sort-table";

interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  accessorFn?: (item: T) => string | number | Date | null | undefined;
  hasFilter?: boolean;
  filterValues?: string[];
  activeFilters?: string[];
  onFilterValueSelect?: (value: string) => void;
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  defaultSortColumn?: string;
  onRowClick?: (item: T) => void;
  rowClassName?: string | ((item: T) => string);
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function SortableTable<T extends { id: string | number }>({
  data,
  columns,
  defaultSortColumn,
  onRowClick,
  rowClassName,
  className,
  isLoading = false,
  emptyMessage = "No data available"
}: SortableTableProps<T>) {
  const {
    sortedData,
    sortColumn,
    sortDirection,
    toggleSort
  } = useSortTable<T>(data, defaultSortColumn);

  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const getRowClassName = (item: T) => {
    if (typeof rowClassName === "function") {
      return rowClassName(item);
    }
    return rowClassName || "";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-auto max-h-[70vh] ${className || ""}`}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-sm">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                sortable={column.sortable}
                sorted={sortColumn === column.id ? sortDirection : null}
                onSortChange={() => column.sortable && toggleSort(column.id)}
                hasFilter={column.hasFilter}
                filterValues={column.filterValues}
                activeFilters={column.activeFilters}
                onFilterValueSelect={column.onFilterValueSelect}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((item) => (
              <TableRow 
                key={item.id}
                className={`${getRowClassName(item)} ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => handleRowClick(item)}
              >
                {columns.map((column) => (
                  <TableCell key={`${item.id}-${column.id}`}>
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
