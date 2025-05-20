
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Search } from "lucide-react";
import { MetricType } from "./types";

interface FilterPopoverProps {
  metric: MetricType;
  filters: Record<string, string>;
  onChange: (field: string, value: string) => void;
  activeFilter: string | null;
  setActiveFilter: (field: string | null) => void;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  metric,
  filters,
  onChange,
  activeFilter,
  setActiveFilter
}) => {
  const renderFilterContent = () => {
    if (activeFilter === "name") {
      return (
        <div className="space-y-2">
          <h3 className="font-medium">Filter by Name</h3>
          <div className="flex items-center border rounded-md">
            <Search className="h-4 w-4 ml-2 text-gray-500" />
            <Input 
              placeholder="Search name..." 
              className="border-0 focus-visible:ring-0"
              value={filters.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
            />
          </div>
        </div>
      );
    }
    if (activeFilter === "position") {
      return (
        <div className="space-y-2">
          <h3 className="font-medium">Filter by Position</h3>
          <div className="flex items-center border rounded-md">
            <Search className="h-4 w-4 ml-2 text-gray-500" />
            <Input 
              placeholder="Search position..." 
              className="border-0 focus-visible:ring-0"
              value={filters.position || ''}
              onChange={(e) => onChange('position', e.target.value)}
            />
          </div>
        </div>
      );
    }
    if (activeFilter === "team") {
      return (
        <div className="space-y-2">
          <h3 className="font-medium">Filter by Team</h3>
          <div className="flex items-center border rounded-md">
            <Search className="h-4 w-4 ml-2 text-gray-500" />
            <Input 
              placeholder="Search team..." 
              className="border-0 focus-visible:ring-0"
              value={filters.team || ''}
              onChange={(e) => onChange('team', e.target.value)}
            />
          </div>
        </div>
      );
    }
    if (activeFilter === "aircraft") {
      return (
        <div className="space-y-2">
          <h3 className="font-medium">Filter by Aircraft</h3>
          <div className="flex items-center border rounded-md">
            <Search className="h-4 w-4 ml-2 text-gray-500" />
            <Input 
              placeholder="Search aircraft..." 
              className="border-0 focus-visible:ring-0"
              value={filters.aircraft || ''}
              onChange={(e) => onChange('aircraft', e.target.value)}
            />
          </div>
        </div>
      );
    }
    if (activeFilter === "registration") {
      return (
        <div className="space-y-2">
          <h3 className="font-medium">Filter by Registration</h3>
          <div className="flex items-center border rounded-md">
            <Search className="h-4 w-4 ml-2 text-gray-500" />
            <Input 
              placeholder="Search registration..." 
              className="border-0 focus-visible:ring-0"
              value={filters.registration || ''}
              onChange={(e) => onChange('registration', e.target.value)}
            />
          </div>
        </div>
      );
    }
    if (activeFilter === "checkType") {
      return (
        <div className="space-y-2">
          <h3 className="font-medium">Filter by Check Type</h3>
          <div className="flex items-center border rounded-md">
            <Search className="h-4 w-4 ml-2 text-gray-500" />
            <Input 
              placeholder="Search check type..." 
              className="border-0 focus-visible:ring-0"
              value={filters.checkType || ''}
              onChange={(e) => onChange('checkType', e.target.value)}
            />
          </div>
        </div>
      );
    }
    if (activeFilter === "status") {
      return (
        <div className="space-y-2">
          <h3 className="font-medium">Filter by Status</h3>
          <div className="flex items-center border rounded-md">
            <Search className="h-4 w-4 ml-2 text-gray-500" />
            <Input 
              placeholder="Search status..." 
              className="border-0 focus-visible:ring-0"
              value={filters.status || ''}
              onChange={(e) => onChange('status', e.target.value)}
            />
          </div>
        </div>
      );
    }
    if (activeFilter === "hangar") {
      return (
        <div className="space-y-2">
          <h3 className="font-medium">Filter by Hangar</h3>
          <div className="flex items-center border rounded-md">
            <Search className="h-4 w-4 ml-2 text-gray-500" />
            <Input 
              placeholder="Search hangar..." 
              className="border-0 focus-visible:ring-0"
              value={filters.hangar || ''}
              onChange={(e) => onChange('hangar', e.target.value)}
            />
          </div>
        </div>
      );
    }
    
    return null;
  };

  const getFilterOptions = () => {
    if (metric === 'available' || metric === 'total-employees' || metric === 'leave' || metric === 'training') {
      return [
        { id: 'name', label: 'Name' },
        { id: 'position', label: 'Position' },
        { id: 'team', label: 'Team' }
      ];
    } else {
      return [
        { id: 'aircraft', label: 'Aircraft' },
        { id: 'registration', label: 'Registration' },
        { id: 'checkType', label: 'Check Type' },
        { id: 'status', label: 'Status' },
        { id: 'hangar', label: 'Hangar' }
      ];
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setActiveFilter('name')}>
        <Filter className="h-4 w-4" />
        Filter
      </Button>

      <Popover open={activeFilter !== null} onOpenChange={(open) => !open && setActiveFilter(null)}>
        <PopoverContent className="w-80" align="start">
          {renderFilterContent()}
        </PopoverContent>
      </Popover>
    </>
  );
};
