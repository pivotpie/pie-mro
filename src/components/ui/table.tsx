
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
}

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  TableHeadProps
>(({ className, children, sortable, sorted, onSortChange, hasFilter, onFilterClick, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      sortable && "cursor-pointer select-none",
      className
    )}
    onClick={() => sortable && onSortChange && onSortChange()}
    {...props}
  >
    <div className="flex items-center gap-2">
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
        <ListFilter 
          className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onFilterClick && onFilterClick();
          }}
        />
      )}
    </div>
  </th>
))
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
