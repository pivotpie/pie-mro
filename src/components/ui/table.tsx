
import * as React from "react"
import { Check, CheckSquare, ChevronDown, ChevronUp, ListFilter, Square, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  sortable?: boolean;
}

const Table = React.forwardRef<
  HTMLTableElement,
  TableProps
>(({ className, sortable = false, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    selected?: boolean;
    onSelectChange?: (selected: boolean) => void;
    selectable?: boolean;
  }
>(({ className, children, selected, onSelectChange, selectable, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    data-state={selected ? "selected" : undefined}
    {...props}
  >
    {selectable && (
      <td 
        className="w-10 px-2 py-4" 
        onClick={(e) => { 
          e.stopPropagation();
          onSelectChange && onSelectChange(!selected);
        }}
      >
        <div className="flex items-center justify-center">
          {selected ? (
            <CheckSquare className="h-5 w-5 cursor-pointer text-primary" />
          ) : (
            <Square className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-primary" />
          )}
        </div>
      </td>
    )}
    {children}
  </tr>
))
TableRow.displayName = "TableRow"

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: "asc" | "desc" | null;
  onSortChange?: () => void;
  hasFilter?: boolean;
  onFilterClick?: () => void;
  filterValues?: string[];
  activeFilters?: string[];
  onFilterValueSelect?: (value: string) => void;
}

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  TableHeadProps
>(({ 
  className, 
  children, 
  sortable, 
  sorted, 
  onSortChange, 
  hasFilter, 
  onFilterClick,
  filterValues = [],
  activeFilters = [],
  onFilterValueSelect,
  ...props 
}, ref) => {
  const [showFilterDropdown, setShowFilterDropdown] = React.useState(false);
  
  // Handle filter icon click
  const handleFilterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFilterClick) {
      onFilterClick();
    } else if (filterValues && filterValues.length > 0) {
      setShowFilterDropdown(!showFilterDropdown);
    }
  };

  // Handle filter value selection
  const handleFilterValueSelect = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFilterValueSelect) {
      onFilterValueSelect(value);
    }
    setShowFilterDropdown(false);
  };

  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 [&:has([role=checkbox])]:pr-0",
        sortable && "cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
        className
      )}
      onClick={() => sortable && onSortChange && onSortChange()}
      {...props}
    >
      <div className="flex items-center gap-2 relative">
        <span className="flex-1">{children}</span>
        {sortable && (
          <div className="flex flex-col">
            <ChevronUp className={cn(
              "h-3 w-3 transition-colors",
              sorted === "asc" ? "text-foreground" : "text-muted-foreground/30"
            )} />
            <ChevronDown className={cn(
              "h-3 w-3 -mt-0.5 transition-colors",
              sorted === "desc" ? "text-foreground" : "text-muted-foreground/30"
            )} />
          </div>
        )}
        {hasFilter && (
          <div className="relative">
            <ListFilter 
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer",
                (activeFilters && activeFilters.length > 0) && "text-primary"
              )}
              onClick={handleFilterClick}
            />
            
            {showFilterDropdown && filterValues && filterValues.length > 0 && (
              <div 
                className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50 min-w-[150px] max-h-[300px] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      className="w-full pl-8 pr-2 py-1 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Search..." 
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {filterValues.map((value, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2",
                        activeFilters.includes(value) && "bg-primary/10"
                      )}
                      onClick={(e) => handleFilterValueSelect(value, e)}
                    >
                      {activeFilters.includes(value) && <Check className="h-3.5 w-3.5 text-primary" />}
                      <span className={activeFilters.includes(value) ? "ml-0" : "ml-5"}>{value}</span>
                    </div>
                  ))}
                  {filterValues.length === 0 && (
                    <div className="px-3 py-1.5 text-sm text-muted-foreground">No filter values</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </th>
  )
})
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
