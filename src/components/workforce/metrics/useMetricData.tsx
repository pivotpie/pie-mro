
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, 
  CalendarCheck, 
  GraduationCap, 
  PlaneTakeoff, 
  Plane, 
  FileCheck, 
  Activity,
  UserCheck,
  MoreHorizontal
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Simplified base types to avoid deep nesting
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

// Define a union type for all possible detail data types
export type DetailDataType = EmployeeBasic | SimpleRosterAssignment | MaintenanceVisitBasic | AircraftBasic;

// Type guards to check which type of data we're dealing with
const isEmployeeData = (item: DetailDataType): item is EmployeeBasic => 
  'job_title_description' in item && 'e_number' in item;

const isRosterAssignment = (item: DetailDataType): item is SimpleRosterAssignment => 
  'employee_name' in item && 'roster_id' in item;

const isAircraftData = (item: DetailDataType): item is AircraftBasic => 
  'registration' in item && 'type_name' in item && !('check_type' in item);

const isMaintenanceVisit = (item: DetailDataType): item is MaintenanceVisitBasic => 
  'aircraft_registration' in item && 'check_type' in item;

export const useMetricData = (selectedMetric: MetricType | null, isDialogOpen: boolean) => {
  const [detailData, setDetailData] = useState<DetailDataType[]>([]);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  // Get current date for roster data
  const currentDate = new Date().toISOString().split('T')[0];

  // Fetch total employees
  const { data: totalEmployees, isLoading: loadingTotalEmployees } = useQuery({
    queryKey: ['totalEmployees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, e_number, mobile_number, date_of_joining, is_active, job_titles(job_description), team:teams(team_name), certifications!left(*), employee_authorizations!left(*)');
        
      if (error) throw error;
      console.log('Total employees fetched:', data?.length);
      
      // Transform the data to a flatter structure
      return (data || []).map(emp => ({
        id: emp.id,
        name: emp.name,
        e_number: emp.e_number,
        mobile_number: emp.mobile_number,
        date_of_joining: emp.date_of_joining,
        is_active: emp.is_active,
        job_title_description: emp.job_titles?.job_description,
        team_name: emp.team?.team_name,
        certification_count: (emp.certifications || []).length,
        authorization_count: (emp.employee_authorizations || []).length
      })) as EmployeeBasic[];
    }
  });

  // Fetch employee supports for current date
  const { data: employeeSupports, isLoading: loadingEmployeeSupports } = useQuery({
    queryKey: ['employeeSupports', currentDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_supports')
        .select('id, employee_id, support_id')
        .eq('date', currentDate);
      if (error) throw error;
      console.log('Employee supports fetched for today:', data?.length);
      return data as EmployeeSupportBasic[] || [];
    }
  });

  // Get roster date ID for current date
  const { data: dateReference, isLoading: loadingDateReference } = useQuery({
    queryKey: ['dateReference', currentDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('date_references')
        .select('id')
        .eq('actual_date', currentDate)
        .single();
      if (error) {
        console.error("Error fetching date reference:", error);
        return null;
      }
      console.log('Date reference fetched:', data);
      return data as { id: number } | null;
    }
  });

  // Fetch roster assignments for today to determine leave and training
  const { data: rosterAssignments, isLoading: loadingRosterAssignments } = useQuery({
    queryKey: ['rosterAssignments', currentDate, dateReference?.id],
    queryFn: async () => {
      if (!dateReference?.id) return [];
      
      const { data, error } = await supabase
        .from('roster_assignments')
        .select(`
          id, employee_id, date_id, roster_id,
          employees(id, name, e_number, job_titles(job_description), team:teams(team_name), mobile_number),
          date:date_references(actual_date),
          roster:roster_codes(roster_code)
        `)
        .eq('date_id', dateReference.id);
      
      if (error) {
        console.error("Error fetching roster assignments:", error);
        return [];
      }
      console.log('Roster assignments fetched for today:', data?.length);
      
      // Transform to a flatter structure
      return (data || []).map(ra => ({
        id: ra.id,
        employee_id: ra.employee_id,
        date_id: ra.date_id,
        roster_id: ra.roster_id,
        employee_name: ra.employees?.name,
        employee_number: ra.employees?.e_number,
        employee_position: ra.employees?.job_titles?.job_description,
        employee_team: ra.employees?.team?.team_name,
        employee_mobile: ra.employees?.mobile_number,
        date_value: ra.date?.actual_date,
        roster_code: ra.roster?.roster_code
      })) as SimpleRosterAssignment[];
    },
    enabled: !!dateReference?.id
  });

  // Fetch aircraft data
  const { data: aircraft, isLoading: loadingAircraft } = useQuery({
    queryKey: ['allAircraft'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('aircraft')
          .select(`
            id, aircraft_name, registration, customer, total_hours, total_cycles,
            aircraft_types(type_name, manufacturer)
          `);
          
        if (error) throw error;
        console.log('Aircraft fetched:', data?.length);
        
        // Transform to a flatter structure
        return (data || []).map(ac => ({
          id: ac.id,
          aircraft_name: ac.aircraft_name,
          registration: ac.registration,
          type_name: ac.aircraft_types?.type_name,
          manufacturer: ac.aircraft_types?.manufacturer,
          customer: ac.customer,
          total_hours: ac.total_hours,
          total_cycles: ac.total_cycles
        })) as AircraftBasic[];
      } catch (error: any) {
        console.error("Error fetching aircraft:", error);
        return [];
      }
    }
  });

  // Fetch maintenance visits for current date
  const { data: maintenanceVisits, isLoading: loadingMaintenanceVisits } = useQuery({
    queryKey: ['maintenanceVisits', currentDate],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('maintenance_visits')
          .select(`
            id, aircraft_id, visit_number, check_type, status, date_in, date_out, remarks, hangar_id, total_hours,
            aircraft(id, aircraft_name, registration, aircraft_types(type_name)),
            hangar:hangars(hangar_name)
          `)
          .lte('date_in', currentDate)
          .gte('date_out', currentDate);
          
        if (error) throw error;
        
        // Separate query to get personnel requirements info
        const { data: personnelData, error: personnelError } = await supabase
          .from('personnel_requirements')
          .select('maintenance_visit_id, count')
          .gt('count', 0);
          
        if (personnelError) {
          console.error("Error fetching personnel requirements:", personnelError);
        }
        
        // Create a Set of maintenance visit IDs that have personnel requirements
        const visitsWithPersonnel = new Set(
          (personnelData || []).map(p => p.maintenance_visit_id)
        );
        
        console.log('Maintenance visits fetched for today:', data?.length);
        
        // Transform to a flatter structure
        return (data || []).map(mv => ({
          id: mv.id,
          aircraft_id: mv.aircraft_id,
          aircraft_name: mv.aircraft?.aircraft_name,
          aircraft_registration: mv.aircraft?.registration,
          aircraft_type: mv.aircraft?.aircraft_types?.type_name,
          visit_number: mv.visit_number,
          check_type: mv.check_type,
          status: mv.status,
          date_in: mv.date_in,
          date_out: mv.date_out,
          remarks: mv.remarks,
          hangar_id: mv.hangar_id,
          hangar_name: mv.hangar?.hangar_name,
          total_hours: mv.total_hours,
          has_personnel_requirements: visitsWithPersonnel.has(mv.id)
        })) as MaintenanceVisitBasic[];
      } catch (error: any) {
        console.error("Error fetching maintenance visits:", error);
        return [];
      }
    }
  });

  // Calculate available employees (excluding those with support assignments and roster assignments for leave/training)
  const availableEmployees = useMemo(() => {
    if (!totalEmployees || !employeeSupports || !rosterAssignments) return [];
    
    // Get IDs of employees with support assignments for today
    const supportEmployeeIds = new Set(employeeSupports.map(es => es.employee_id));
    
    // Get IDs of employees on leave or training from roster
    const leaveEmployeeIds = new Set<number>();
    const trainingEmployeeIds = new Set<number>();
    
    rosterAssignments.forEach(ra => {
      // Check roster code: 2 for Annual Leave, 7 for Sick Leave, 9 for Training
      if (ra.roster_id === 2 || ra.roster_id === 7) {
        leaveEmployeeIds.add(ra.employee_id);
      } else if (ra.roster_id === 9) {
        trainingEmployeeIds.add(ra.employee_id);
      }
    });
    
    // Filter out employees who have support, are on leave or in training
    return totalEmployees.filter(emp => 
      !supportEmployeeIds.has(emp.id) && 
      !leaveEmployeeIds.has(emp.id) &&
      !trainingEmployeeIds.has(emp.id)
    );
  }, [totalEmployees, employeeSupports, rosterAssignments]);

  // Extract employees on leave from roster assignments
  const onLeaveEmployees = useMemo(() => {
    if (!rosterAssignments) return [];
    
    // Filter roster assignments for leave codes (2 for Annual Leave, 7 for Sick Leave)
    return rosterAssignments.filter(ra => 
      ra.roster_id === 2 || ra.roster_id === 7
    );
  }, [rosterAssignments]);

  // Extract employees in training from roster assignments
  const inTrainingEmployees = useMemo(() => {
    if (!rosterAssignments) return [];
    
    // Filter roster assignments for training code (9)
    return rosterAssignments.filter(ra => ra.roster_id === 9);
  }, [rosterAssignments]);

  // Calculate aircraft metrics for today
  const aircraftMetrics = useMemo(() => {
    if (aircraft && maintenanceVisits) {
      // Aircraft currently in maintenance
      const inMaintenance = maintenanceVisits.filter(v => v.status === 'In Progress').length;
      
      // Aircraft scheduled for maintenance today but not started
      const scheduled = maintenanceVisits.filter(v => v.status === 'Scheduled').length;
      
      // Aircraft with assigned teams (use actual maintenance visits with personnel requirements)
      const withTeams = maintenanceVisits.filter(visit => 
        visit.status === 'In Progress' && visit.has_personnel_requirements
      ).length;
      
      return {
        total: aircraft.length,
        inMaintenance,
        scheduled,
        withTeams,
        available: aircraft.length - inMaintenance
      };
    }
    return {
      total: 0,
      inMaintenance: 0,
      scheduled: 0,
      withTeams: 0,
      available: 0
    };
  }, [aircraft, maintenanceVisits]);

  const isLoading = loadingTotalEmployees || loadingEmployeeSupports || loadingDateReference || 
                   loadingRosterAssignments || loadingAircraft || loadingMaintenanceVisits;

  // Set detail data when selecting a metric
  useEffect(() => {
    if (!selectedMetric || !isDialogOpen) return;
    
    let data: DetailDataType[] = [];
    
    switch (selectedMetric) {
      case 'total-employees':
        data = totalEmployees || [];
        break;
      case 'available':
        data = availableEmployees || [];
        break;
      case 'leave':
        data = onLeaveEmployees || [];
        break;
      case 'training':
        data = inTrainingEmployees || [];
        break;
      case 'grounded':
        data = maintenanceVisits?.filter(v => v.status === 'In Progress') || [];
        break;
      case 'assigned':
        data = maintenanceVisits?.filter(v => 
          v.status === 'In Progress' && v.has_personnel_requirements
        ) || [];
        break;
      case 'pending':
        data = maintenanceVisits?.filter(v => v.status === 'Scheduled') || [];
        break;
      case 'productivity':
        if (aircraft && maintenanceVisits) {
          const inMaintenanceIds = new Set(
            maintenanceVisits
              .filter(v => v.status === 'In Progress')
              .map(v => v.aircraft_id)
          );
          data = aircraft.filter(a => !inMaintenanceIds.has(a.id)) || [];
        }
        break;
      default:
        data = [];
    }
    
    setDetailData(data);
    console.log(`Setting detail data for ${selectedMetric}:`, data);
  }, [selectedMetric, isDialogOpen, totalEmployees, availableEmployees, onLeaveEmployees, inTrainingEmployees, aircraft, maintenanceVisits]);

  // Handle export functionality
  const handleExport = () => {
    try {
      // Convert data to CSV
      if (!detailData || detailData.length === 0) {
        toast.error("No data to export");
        return;
      }

      // Prepare data for CSV export based on selected metric
      let csvData: any[] = [];
      let filename = '';

      switch (selectedMetric) {
        case 'available':
        case 'total-employees':
          csvData = detailData.filter(isEmployeeData).map(item => ({
            Name: item.name,
            'Employee ID': `E${item.e_number}`,
            Position: item.job_title_description || 'N/A',
            Team: item.team_name || 'N/A',
            Mobile: item.mobile_number || 'N/A',
            'Date of Joining': item.date_of_joining ? new Date(item.date_of_joining).toLocaleDateString() : 'N/A'
          }));
          filename = selectedMetric === 'available' ? 'available-employees.csv' : 'total-employees.csv';
          break;
        
        case 'leave':
        case 'training':
          csvData = detailData.filter(isRosterAssignment).map(item => {
            const base = {
              Name: item.employee_name || 'N/A',
              'Employee ID': `E${item.employee_number}` || 'N/A',
              Position: item.employee_position || 'N/A',
              Team: item.employee_team || 'N/A',
              Mobile: item.employee_mobile || 'N/A',
              'Date': item.date_value ? new Date(item.date_value).toLocaleDateString() : 'N/A'
            };
            
            // Add leave type only for leave metric
            if (selectedMetric === 'leave') {
              return {
                ...base,
                'Leave Type': item.roster_id === 2 ? 'Annual Leave' : 'Sick Leave'
              };
            }
            return base;
          });
          filename = selectedMetric === 'leave' ? 'employees-on-leave.csv' : 'employees-in-training.csv';
          break;
          
        case 'grounded':
        case 'assigned':
        case 'pending':
          csvData = detailData.filter(isMaintenanceVisit).map(item => ({
            Aircraft: item.aircraft_name || 'N/A',
            Registration: item.aircraft_registration || 'N/A',
            Type: item.aircraft_type || 'N/A',
            'Check Type': item.check_type || 'N/A',
            'Date Range': `${new Date(item.date_in).toLocaleDateString()} - ${new Date(item.date_out).toLocaleDateString()}`,
            Status: item.status || 'N/A',
            Hangar: item.hangar_name || 'N/A',
            'Total Hours': item.total_hours || 'N/A',
            Remarks: item.remarks || ''
          }));
          filename = `${selectedMetric}-aircraft.csv`;
          break;
          
        case 'productivity':
          csvData = detailData.filter(isAircraftData).map(item => ({
            Aircraft: item.aircraft_name || 'N/A',
            Registration: item.registration || 'N/A',
            Type: item.type_name || 'N/A',
            Manufacturer: item.manufacturer || 'N/A',
            Customer: item.customer || 'N/A',
            'Total Hours': item.total_hours || '0',
            'Total Cycles': item.total_cycles || '0'
          }));
          filename = 'available-aircraft.csv';
          break;
          
        default:
          csvData = [];
          filename = 'export.csv';
      }

      // Handle empty data case
      if (csvData.length === 0) {
        toast.error("No data to export after filtering");
        return;
      }

      // Convert to CSV
      const headers = Object.keys(csvData[0]);
      let csvContent = headers.join(',') + '\n';
      
      csvContent += csvData.map(row => {
        return headers.map(header => {
          const cell = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(cell).includes('"') ? String(cell).replace(/"/g, '""') : String(cell);
          return cell.toString().includes(',') ? `"${escaped}"` : escaped;
        }).join(',');
      }).join('\n');
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Export completed successfully");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export data");
    }
  };

  // Filter data based on search and filters
  const filterData = () => {
    if (!detailData) return [];
    
    let filteredData = [...detailData];
    
    // Apply search term if exists
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      
      filteredData = filteredData.filter(item => {
        // Search based on item type
        if (isEmployeeData(item)) {
          return (
            (item?.name && item.name.toLowerCase().includes(term)) ||
            (item?.e_number && `e${item.e_number}`.toLowerCase().includes(term)) ||
            (item?.job_title_description && item.job_title_description.toLowerCase().includes(term)) ||
            (item?.team_name && item.team_name.toLowerCase().includes(term))
          );
        } 
        else if (isRosterAssignment(item)) {
          return (
            (item?.employee_name && item.employee_name.toLowerCase().includes(term)) ||
            (item?.employee_number && `e${item.employee_number}`.toLowerCase().includes(term)) ||
            (item?.employee_position && item.employee_position.toLowerCase().includes(term)) ||
            (item?.employee_team && item.employee_team.toLowerCase().includes(term))
          );
        }
        else if (isAircraftData(item)) {
          return (
            (item?.aircraft_name && item.aircraft_name.toLowerCase().includes(term)) ||
            (item?.registration && item.registration.toLowerCase().includes(term)) ||
            (item?.type_name && item.type_name.toLowerCase().includes(term))
          );
        }
        else if (isMaintenanceVisit(item)) {
          return (
            (item.aircraft_name && item.aircraft_name.toLowerCase().includes(term)) ||
            (item.aircraft_registration && item.aircraft_registration.toLowerCase().includes(term)) ||
            (item.check_type && item.check_type.toLowerCase().includes(term))
          );
        }
        
        // Default case for any other data type
        return false;
      });
    }
    
    // Apply field-specific filters
    if (Object.keys(filters).length > 0) {
      filteredData = filteredData.filter(item => {
        return Object.entries(filters).every(([field, value]) => {
          if (!value) return true;
          
          // Filter based on item type
          if (isEmployeeData(item)) {
            switch (field) {
              case 'name':
                return item?.name && item.name.toLowerCase().includes(value.toLowerCase());
              case 'position':
                return item?.job_title_description && 
                  item.job_title_description.toLowerCase().includes(value.toLowerCase());
              case 'team':
                return item?.team_name && 
                  item.team_name.toLowerCase().includes(value.toLowerCase());
              default:
                return true;
            }
          } 
          else if (isRosterAssignment(item)) {
            switch (field) {
              case 'name':
                return item?.employee_name && item.employee_name.toLowerCase().includes(value.toLowerCase());
              case 'position':
                return item?.employee_position && 
                  item.employee_position.toLowerCase().includes(value.toLowerCase());
              case 'team':
                return item?.employee_team && 
                  item.employee_team.toLowerCase().includes(value.toLowerCase());
              default:
                return true;
            }
          }
          else if (isAircraftData(item)) {
            switch (field) {
              case 'aircraft':
                return item?.aircraft_name && 
                  item.aircraft_name.toLowerCase().includes(value.toLowerCase());
              case 'registration':
                return item?.registration && 
                  item.registration.toLowerCase().includes(value.toLowerCase());
              case 'type':
                return item?.type_name && 
                  item.type_name.toLowerCase().includes(value.toLowerCase());
              default:
                return true;
            }
          }
          else if (isMaintenanceVisit(item)) {
            switch (field) {
              case 'aircraft':
                return item.aircraft_name && 
                  item.aircraft_name.toLowerCase().includes(value.toLowerCase());
              case 'registration':
                return item.aircraft_registration && 
                  item.aircraft_registration.toLowerCase().includes(value.toLowerCase());
              case 'checkType':
                return item.check_type && 
                  item.check_type.toLowerCase().includes(value.toLowerCase());
              case 'status':
                return item.status && 
                  item.status.toLowerCase().includes(value.toLowerCase());
              case 'hangar':
                return item.hangar_name && 
                  item.hangar_name.toLowerCase().includes(value.toLowerCase());
              default:
                return true;
            }
          }
          
          return true;
        });
      });
    }
    
    // Apply sorting if field is specified
    if (sortField) {
      filteredData.sort((a, b) => {
        let valueA: any = undefined;
        let valueB: any = undefined;

        // Handle different data types appropriately
        if (isEmployeeData(a) && isEmployeeData(b)) {
          valueA = a[sortField as keyof EmployeeBasic];
          valueB = b[sortField as keyof EmployeeBasic];
        }
        else if (isRosterAssignment(a) && isRosterAssignment(b)) {
          valueA = a[sortField as keyof SimpleRosterAssignment];
          valueB = b[sortField as keyof SimpleRosterAssignment];
        }
        else if (isAircraftData(a) && isAircraftData(b)) {
          valueA = a[sortField as keyof AircraftBasic];
          valueB = b[sortField as keyof AircraftBasic];
        }
        else if (isMaintenanceVisit(a) && isMaintenanceVisit(b)) {
          valueA = a[sortField as keyof MaintenanceVisitBasic];
          valueB = b[sortField as keyof MaintenanceVisitBasic];
        }
        
        // Handle string comparison
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortDirection === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        // Handle number comparison
        if (valueA === valueB) return 0;
        
        if (sortDirection === 'asc') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    }
    
    return filteredData;
  };

  // Get detailed columns for SortableTable
  const getColumnsForMetric = () => {
    if (selectedMetric === 'available' || selectedMetric === 'total-employees') {
      return [
        {
          id: 'name',
          header: 'Name',
          cell: (item: any) => (
            <span className="font-medium">{item.name}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.name,
        },
        {
          id: 'id',
          header: 'ID',
          cell: (item: any) => (
            <span>E{item.e_number}</span>
          ),
        },
        {
          id: 'position',
          header: 'Position',
          cell: (item: any) => (
            <span>{item.job_title_description || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.job_title_description,
        },
        {
          id: 'team',
          header: 'Team',
          cell: (item: any) => (
            <span>{item.team_name || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.team_name,
        },
        {
          id: 'mobile',
          header: 'Mobile',
          cell: (item: any) => (
            <span>{item.mobile_number || 'N/A'}</span>
          ),
        },
        {
          id: 'joinDate',
          header: 'Join Date',
          cell: (item: any) => (
            <span>{item.date_of_joining ? new Date(item.date_of_joining).toLocaleDateString() : 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.date_of_joining,
        },
        {
          id: 'certifications',
          header: 'Certifications',
          cell: (item: any) => (
            <span>{item.certification_count || '0'}</span>
          ),
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: (item: any) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Contact</DropdownMenuItem>
                <DropdownMenuItem>Edit</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
      ];
    } 
    else if (selectedMetric === 'leave' || selectedMetric === 'training') {
      return [
        {
          id: 'name',
          header: 'Name',
          cell: (item: any) => (
            <span className="font-medium">{item.employee_name || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.employee_name,
        },
        {
          id: 'id',
          header: 'ID',
          cell: (item: any) => (
            <span>E{item.employee_number || 'N/A'}</span>
          ),
        },
        {
          id: 'position',
          header: 'Position',
          cell: (item: any) => (
            <span>{item.employee_position || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.employee_position,
        },
        {
          id: 'team',
          header: 'Team',
          cell: (item: any) => (
            <span>{item.employee_team || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.employee_team,
        },
        {
          id: 'mobile',
          header: 'Mobile',
          cell: (item: any) => (
            <span>{item.employee_mobile || 'N/A'}</span>
          ),
        },
        {
          id: 'date',
          header: selectedMetric === 'leave' ? 'Leave Date' : 'Training Date',
          cell: (item: any) => (
            <span>{item.date_value ? new Date(item.date_value).toLocaleDateString() : 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.date_value,
        },
        ...(selectedMetric === 'leave' ? [
          {
            id: 'leaveType',
            header: 'Leave Type',
            cell: (item: any) => (
              <span>{item.roster_id === 2 ? 'Annual Leave' : 'Sick Leave'}</span>
            ),
          },
        ] : []),
        {
          id: 'actions',
          header: 'Actions',
          cell: (item: any) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Contact</DropdownMenuItem>
                <DropdownMenuItem>Edit</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
      ];
    } 
    else if (selectedMetric === 'productivity') {
      return [
        {
          id: 'aircraft',
          header: 'Aircraft',
          cell: (item: any) => (
            <span className="font-medium">{item.aircraft_name || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.aircraft_name,
        },
        {
          id: 'registration',
          header: 'Registration',
          cell: (item: any) => (
            <span>{item.registration || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.registration,
        },
        {
          id: 'type',
          header: 'Type',
          cell: (item: any) => (
            <span>{item.type_name || 'N/A'}</span>
          ),
        },
        {
          id: 'manufacturer',
          header: 'Manufacturer',
          cell: (item: any) => (
            <span>{item.manufacturer || 'N/A'}</span>
          ),
        },
        {
          id: 'customer',
          header: 'Customer',
          cell: (item: any) => (
            <span>{item.customer || 'N/A'}</span>
          ),
        },
        {
          id: 'totalHours',
          header: 'Total Hours',
          cell: (item: any) => (
            <span>{item.total_hours || '0'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.total_hours,
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: (item: any) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Schedule Maintenance</DropdownMenuItem>
                <DropdownMenuItem>View History</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
      ];
    }
    else {
      return [
        {
          id: 'aircraft',
          header: 'Aircraft',
          cell: (item: any) => (
            <span className="font-medium">{item.aircraft_name || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.aircraft_name,
        },
        {
          id: 'registration',
          header: 'Registration',
          cell: (item: any) => (
            <span>{item.aircraft_registration || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.aircraft_registration,
        },
        {
          id: 'type',
          header: 'Type',
          cell: (item: any) => (
            <span>{item.aircraft_type || 'N/A'}</span>
          ),
        },
        {
          id: 'checkType',
          header: 'Check Type',
          cell: (item: any) => (
            <span>{item.check_type || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.check_type,
        },
        {
          id: 'status',
          header: 'Status',
          cell: (item: any) => (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              item.status === 'In Progress' ? 
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
              item.status === 'Completed' ? 
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            }`}>
              {item.status || 'N/A'}
            </span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.status,
        },
        {
          id: 'dateRange',
          header: 'Date Range',
          cell: (item: any) => (
            <span>
              {item.date_in ? new Date(item.date_in).toLocaleDateString() : 'N/A'} - 
              {item.date_out ? new Date(item.date_out).toLocaleDateString() : 'N/A'}
            </span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.date_in,
        },
        {
          id: 'totalHours',
          header: 'Total Hours',
          cell: (item: any) => (
            <span>{item.total_hours || 'N/A'}</span>
          ),
        },
        {
          id: 'hangar',
          header: 'Hangar',
          cell: (item: any) => (
            <span>{item.hangar_name || 'Not Assigned'}</span>
          ),
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: (item: any) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
                <DropdownMenuItem>Assign Team</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
      ];
    }
  };
  
  const getDetailTitle = () => {
    switch (selectedMetric) {
      case 'total-employees': return 'Total Employees';
      case 'available': return 'Available Employees';
      case 'leave': return 'Employees on Leave';
      case 'training': return 'Employees in Training';
      case 'grounded': return 'Grounded Aircraft';
      case 'assigned': return 'Aircraft with Assigned Teams';
      case 'pending': return 'Aircraft Pending Assignment';
      case 'productivity': return 'Available Aircraft';
      default: return 'Details';
    }
  };
  
  // Generate metrics data
  const metrics: MetricInfo[] = [
    { 
      id: 'total-employees', 
      label: 'Total Employees', 
      value: isLoading ? '-' : (totalEmployees?.length || 0), 
      icon: Users, 
      color: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800',
    },
    { 
      id: 'available', 
      label: 'Available Today', 
      value: isLoading ? '-' : (availableEmployees?.length || 0), 
      icon: UserCheck, 
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
    },
    { 
      id: 'leave', 
      label: 'On Leave Today', 
      value: isLoading ? '-' : onLeaveEmployees?.length || 0, 
      icon: CalendarCheck, 
      color: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
    },
    { 
      id: 'training', 
      label: 'In Training Today', 
      value: isLoading ? '-' : inTrainingEmployees?.length || 0, 
      icon: GraduationCap, 
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800',
    },
    { 
      id: 'grounded', 
      label: 'Grounded Aircraft', 
      value: isLoading ? '-' : aircraftMetrics?.inMaintenance || 0, 
      icon: Plane, 
      color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800',
    },
    { 
      id: 'assigned', 
      label: 'Aircraft w/ Teams', 
      value: isLoading ? '-' : aircraftMetrics?.withTeams || 0, 
      icon: PlaneTakeoff, 
      color: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
    },
    { 
      id: 'pending', 
      label: 'Pending Assignment', 
      value: isLoading ? '-' : aircraftMetrics?.scheduled || 0, 
      icon: FileCheck, 
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800',
    },
    { 
      id: 'productivity', 
      label: 'Available Aircraft', 
      value: isLoading ? '-' : aircraftMetrics?.available || 0, 
      icon: Activity, 
      color: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800',
    }
  ];
  
  return {
    metrics,
    detailData,
    setDetailData,
    getDetailTitle,
    filterData,
    getColumnsForMetric,
    handleExport,
    isLoading,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    activeFilter: null,
    setActiveFilter: () => {},
  };
};
