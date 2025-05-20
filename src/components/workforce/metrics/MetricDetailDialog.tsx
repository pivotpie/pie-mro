
import React, { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { SortableTable } from "@/components/ui/sortable-table";
import { Download, Filter, X, Search } from "lucide-react";
import { FilterPopover } from "./FilterPopover";
import { MetricType } from "./types";

interface MetricDetailDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  data: any[];
  filterData: () => any[];
  getColumnsForMetric: () => any[];
  handleExport: () => void;
  metric: MetricType;
}

export const MetricDetailDialog: React.FC<MetricDetailDialogProps> = ({
  isOpen, 
  setIsOpen, 
  title, 
  data, 
  filterData, 
  getColumnsForMetric, 
  handleExport,
  metric
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredData = filterData();
  const columns = getColumnsForMetric();
  
  const renderDetailContent = () => {
    if (filteredData.length === 0) {
      return <div className="p-4 text-center text-gray-500">No data available</div>;
    }

    return (
      <div className="space-y-4">
        <SortableTable 
          data={filteredData.map((item, index) => ({...item, id: item.id || `temp-${index}`}))}
          columns={columns}
          className="w-full"
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-4/5 h-4/5 max-w-[90vw] max-h-[90vh]" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <DialogDescription className="sr-only">Details for {title}</DialogDescription>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} found
            </div>
          </div>
          <div className="flex gap-2">
            {(Object.keys(filters).length > 0 || searchTerm) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
            <FilterPopover 
              metric={metric} 
              filters={filters} 
              onChange={handleFilterChange}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2" 
              onClick={handleExport}
              disabled={filteredData.length === 0}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100%-8rem)] pr-4">
          {renderDetailContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
