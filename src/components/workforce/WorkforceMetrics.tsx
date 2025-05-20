
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  CalendarCheck, 
  GraduationCap, 
  PlaneTakeoff, 
  Plane, 
  FileCheck, 
  Activity,
  Download,
  Filter,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  UserCheck
} from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SortableTable } from "@/components/ui/sortable-table";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MetricCard } from "./metrics/MetricCard";
import { MetricDetailDialog } from "./metrics/MetricDetailDialog";
import { useMetricData } from "./metrics/useMetricData";

// Types for different data entities
export interface EmployeeBasic {
  id: number;
  name: string;
  e_number: number;
  is_active: boolean;
  mobile_number?: string;
  date_of_joining?: string;
  job_title_description?: string;
  team_name?: string;
  certification_count?: number;
  authorization_count?: number;
}

export interface SimpleRosterAssignment {
  id: number;
  employee_id: number;
  date_id: number;
  roster_id: number;
  employee_name?: string;
  employee_number?: number;
  employee_position?: string;
  employee_team?: string;
  employee_mobile?: string;
  date_value?: string;
  roster_code?: string;
}

export interface AircraftBasic {
  id: number;
  aircraft_name?: string;
  registration?: string;
  type_name?: string;
  manufacturer?: string;
  customer?: string;
  total_hours?: number;
  total_cycles?: number;
}

export interface MaintenanceVisitBasic {
  id: number;
  aircraft_id: number;
  aircraft_name?: string;
  aircraft_registration?: string;
  aircraft_type?: string;
  visit_number: string;
  check_type: string;
  status?: string;
  date_in: string;
  date_out: string;
  remarks?: string;
  hangar_id?: number;
  hangar_name?: string;
  total_hours?: number;
  has_personnel_requirements?: boolean;
}

export interface EmployeeSupportBasic {
  id: number;
  employee_id: number;
  support_id: number;
}

export type MetricType = 'total-employees' | 'available' | 'leave' | 'training' | 
  'grounded' | 'assigned' | 'pending' | 'productivity';

export interface MetricInfo {
  id: MetricType;
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const WorkforceMetrics = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use custom hook for data fetching and processing
  const {
    metrics,
    detailData,
    setDetailData,
    getDetailTitle,
    filterData,
    getColumnsForMetric,
    handleExport,
    isLoading
  } = useMetricData(selectedMetric, isDialogOpen);

  const handleMetricClick = (metricId: MetricType) => {
    console.log(`Metric clicked: ${metricId}`);
    setSelectedMetric(metricId);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-6">
        {metrics.map((metric) => (
          <MetricCard 
            key={metric.id}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            isLoading={isLoading}
            onClick={() => handleMetricClick(metric.id)}
          />
        ))}
      </div>

      {/* Metric Detail Dialog */}
      {selectedMetric && (
        <MetricDetailDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          title={getDetailTitle()}
          data={detailData}
          filterData={filterData}
          getColumnsForMetric={getColumnsForMetric}
          handleExport={handleExport}
          metric={selectedMetric}
        />
      )}
    </>
  );
};

