
import { useState, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

export function useSortTable<T>(
  data: T[],
  defaultSortColumn?: string,
  defaultDirection: SortDirection = null
) {
  const [sortState, setSortState] = useState<SortState>({
    column: defaultSortColumn || null,
    direction: defaultDirection,
  });

  const toggleSort = useCallback((column: string) => {
    setSortState((prev) => {
      // If clicking on a new column, sort ascending first
      if (prev.column !== column) {
        return { column, direction: "asc" };
      }
      
      // Toggle through sort states: null -> asc -> desc -> null
      const newDirection: SortDirection = 
        prev.direction === null ? "asc" : 
        prev.direction === "asc" ? "desc" : null;
      
      return { 
        column: newDirection === null ? null : column,
        direction: newDirection
      };
    });
  }, []);

  const sortedData = useCallback(() => {
    if (!sortState.column || !sortState.direction) {
      return [...data];
    }

    return [...data].sort((a, b) => {
      const aValue = getNestedPropertyValue(a, sortState.column as string);
      const bValue = getNestedPropertyValue(b, sortState.column as string);

      // Handle string comparison (case-insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortState.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortState.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      // Handle date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortState.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Handle undefined or null values
      if (aValue === undefined || aValue === null) return sortState.direction === 'asc' ? -1 : 1;
      if (bValue === undefined || bValue === null) return sortState.direction === 'asc' ? 1 : -1;

      // Default string comparison for other types
      const aString = String(aValue);
      const bString = String(bValue);
      return sortState.direction === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
  }, [data, sortState.column, sortState.direction]);

  return {
    sortedData: sortedData(),
    sortColumn: sortState.column,
    sortDirection: sortState.direction,
    toggleSort,
  };
}

// Helper function to get nested property values (e.g., "user.profile.name")
function getNestedPropertyValue(obj: any, path: string): any {
  if (!obj || !path) return obj;
  
  const properties = path.split('.');
  let value = obj;
  
  for (const prop of properties) {
    if (value === null || value === undefined) return undefined;
    value = value[prop];
  }
  
  return value;
}
