
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
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

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  percentage?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

const MetricCard = ({ label, value, icon: Icon, color, percentage, onClick, isLoading }: MetricCardProps) => (
  <Card 
    className={`${color} hover:shadow-md transition-all cursor-pointer border`}
    onClick={onClick}
  >
    <CardContent className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-white/70 dark:bg-gray-800/70`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-7 w-12 bg-gray-300 dark:bg-gray-700 animate-pulse rounded"></div>
            ) : (
              value
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
        </div>
      </div>
      {percentage && !isLoading && (
        <div className="text-xs bg-white/70 dark:bg-gray-800/70 px-2 py-0.5 rounded-full">
          {percentage}
        </div>
      )}
    </CardContent>
  </Card>
);

export const WorkforceMetrics = () => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<Record<string, string>>({});
  
  // Table functionality states
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  // Get current date for roster data
  const currentDate = new Date().toISOString().split('T')[0];

  // Fetch total employees
  const { data: totalEmployees, isLoading: loadingTotalEmployees } = useQuery({
    queryKey: ['totalEmployees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true);
        
      if (error) throw error;
      return data.length;
    }
  });

  // Fetch available employees (those without roster assignments for today)
  const { data: availableEmployees, isLoading: loadingAvailableEmployees } = useQuery({
    queryKey: ['availableEmployees', currentDate],
    queryFn: async () => {
      try {
        // First get all employees
        const { data: allEmployees, error: employeesError } = await supabase
          .from('employees')
          .select('id')
          .eq('is_active', true);
          
        if (employeesError) throw employeesError;
        
        if (!allEmployees || allEmployees.length === 0) {
          return 0;
        }
        
        // Get date_id for current date
        const { data: dateRef, error: dateError } = await supabase
          .from('date_references')
          .select('id')
          .eq('actual_date', currentDate);
          
        if (dateError) throw dateError;
        
        if (dateRef && dateRef.length > 0) {
          const dateId = dateRef[0].id;
          
          // Get employees with roster assignments today
          const { data: assignedEmployees, error: assignedError } = await supabase
            .from('roster_assignments')
            .select('employee_id')
            .eq('date_id', dateId);
            
          if (assignedError) throw assignedError;
          
          // Filter out the assigned employees
          const assignedIds = new Set(assignedEmployees.map(e => e.employee_id));
          const availableCount = allEmployees.filter(e => !assignedIds.has(e.id)).length;
          
          return availableCount;
        } else {
          // If no date record found, assume all employees are available
          return allEmployees.length;
        }
      } catch (error: any) {
        console.error("Error fetching available employees:", error);
        // Return 0 if there's an error
        return 0;
      }
    }
  });

  // Fetch on leave employees
  const { data: onLeaveCount, isLoading: loadingOnLeave } = useQuery({
    queryKey: ['onLeaveCount', currentDate],
    queryFn: async () => {
      try {
        const { data: onLeave, error } = await supabase
          .from('attendance')
          .select('employee_id')
          .eq('status', 'Annual Leave')
          .gt('date', currentDate);
          
        if (error) throw error;
        
        return onLeave ? onLeave.length : 0;
      } catch (error: any) {
        console.error("Error fetching on leave employees:", error);
        return 0;
      }
    }
  });

  // Fetch employees in training
  const { data: inTrainingCount, isLoading: loadingInTraining } = useQuery({
    queryKey: ['inTrainingCount', currentDate],
    queryFn: async () => {
      try {
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];
        
        const { data: inTraining, error } = await supabase
          .from('employee_training_schedules')
          .select('employee_id')
          .gt('required_date', currentDate)
          .lt('required_date', sevenDaysLaterStr);
          
        if (error) throw error;
        
        return inTraining ? inTraining.length : 0;
      } catch (error: any) {
        console.error("Error fetching employees in training:", error);
        return 0;
      }
    }
  });

  // Fetch aircraft metrics
  const { data: aircraftMetrics, isLoading: loadingAircraft } = useQuery({
    queryKey: ['aircraftMetrics'],
    queryFn: async () => {
      try {
        // Get all aircraft
        const { data: aircraft, error: aircraftError } = await supabase
          .from('aircraft')
          .select('*');
          
        if (aircraftError) throw aircraftError;
        
        // Get maintenance visits data
        const { data: visits, error: visitsError } = await supabase
          .from('maintenance_visits')
          .select('*');
          
        if (visitsError) throw visitsError;
        
        if (!visits || !aircraft) {
          return {
            total: 0,
            inMaintenance: 0,
            scheduled: 0,
            available: 0
          };
        }
        
        // Calculate metrics
        const inMaintenance = visits.filter(v => v.status === 'In Progress').length;
        const scheduled = visits.filter(v => v.status === 'Scheduled').length;
        
        return {
          total: aircraft.length,
          inMaintenance,
          scheduled,
          available: aircraft.length - inMaintenance
        };
      } catch (error: any) {
        console.error("Error fetching aircraft metrics:", error);
        return {
          total: 0,
          inMaintenance: 0,
          scheduled: 0,
          available: 0
        };
      }
    }
  });

  const isLoading = loadingTotalEmployees || loadingAvailableEmployees || loadingOnLeave || loadingInTraining || loadingAircraft;

  // Fetch detail data when a metric is selected
  useEffect(() => {
    const fetchDetailData = async () => {
      if (!selectedMetric) return;
      
      let data: any[] = [];
      
      try {
        switch (selectedMetric) {
          case 'available':
            // Get all active employees
            const { data: allEmployees, error: allEmpError } = await supabase
              .from('employees')
              .select(`
                *, 
                job_titles(job_description),
                team:teams(team_name),
                certifications(*),
                employee_authorizations(*)
              `)
              .eq('is_active', true);
              
            if (allEmpError) throw allEmpError;
            
            // Get date_id for current date
            const { data: dateRef, error: dateError } = await supabase
              .from('date_references')
              .select('id')
              .eq('actual_date', currentDate);
              
            if (dateError) throw dateError;
            
            if (dateRef && dateRef.length > 0) {
              const dateId = dateRef[0].id;
              
              // Get employees with roster assignments today
              const { data: assignedEmployees, error: assignedError } = await supabase
                .from('roster_assignments')
                .select('employee_id')
                .eq('date_id', dateId);
                
              if (assignedError) throw assignedError;
              
              // Filter out the assigned employees
              const assignedIds = new Set(assignedEmployees.map(e => e.employee_id));
              data = allEmployees.filter(e => !assignedIds.has(e.id)) || [];
            } else {
              data = allEmployees || [];
            }
            break;
          
          case 'leave':
            const { data: onLeave, error: leaveError } = await supabase
              .from('attendance')
              .select(`
                *, 
                employees(
                  *,
                  job_titles(job_description),
                  team:teams(team_name),
                  certifications(*),
                  employee_authorizations(*)
                )
              `)
              .eq('status', 'Annual Leave')
              .gt('date', currentDate);
              
            if (leaveError) throw leaveError;
            data = onLeave || [];
            break;
            
          case 'training':
            const sevenDaysLater = new Date();
            sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
            const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];
            
            const { data: inTraining, error: trainingError } = await supabase
              .from('employee_training_schedules')
              .select(`
                *, 
                employees(
                  *,
                  job_titles(job_description),
                  team:teams(team_name),
                  certifications(*),
                  employee_authorizations(*)
                ), 
                training_types(*)
              `)
              .gt('required_date', currentDate)
              .lt('required_date', sevenDaysLaterStr);
              
            if (trainingError) throw trainingError;
            data = inTraining || [];
            break;
            
          case 'grounded':
            const { data: groundedAircraft, error: groundedError } = await supabase
              .from('maintenance_visits')
              .select(`
                *, 
                aircraft(
                  *,
                  aircraft_types(*)
                ),
                personnel_requirements(*)
              `)
              .eq('status', 'In Progress');
              
            if (groundedError) throw groundedError;
            data = groundedAircraft || [];
            break;
            
          case 'assigned':
            const { data: assignedAircraft, error: assignedError } = await supabase
              .from('maintenance_visits')
              .select(`
                *, 
                aircraft(
                  *,
                  aircraft_types(*)
                ),
                personnel_requirements(*)
              `)
              .eq('status', 'In Progress');
              
            if (assignedError) throw assignedError;
            data = assignedAircraft || [];
            break;
            
          case 'pending':
            const { data: pendingAircraft, error: pendingError } = await supabase
              .from('maintenance_visits')
              .select(`
                *, 
                aircraft(
                  *,
                  aircraft_types(*)
                )
              `)
              .eq('status', 'Scheduled');
              
            if (pendingError) throw pendingError;
            data = pendingAircraft || [];
            break;
            
          case 'productivity':
            const { data: availableAircraft, error: availableError } = await supabase
              .from('aircraft')
              .select(`
                *,
                aircraft_types(*)
              `);
              
            if (availableError) throw availableError;
            
            const { data: maintenanceVisits, error: visitsError } = await supabase
              .from('maintenance_visits')
              .select('aircraft_id')
              .eq('status', 'In Progress');
              
            if (visitsError) throw visitsError;
            
            const inMaintenanceIds = new Set(maintenanceVisits.map(v => v.aircraft_id));
            data = availableAircraft.filter(a => !inMaintenanceIds.has(a.id)) || [];
            break;
        }
        
        setDetailData(data);
      } catch (error) {
        console.error('Error fetching detail data:', error);
        toast.error("Error fetching data details");
        setDetailData([]);
      }
    };
    
    if (selectedMetric && isDialogOpen) {
      fetchDetailData();
    }
  }, [selectedMetric, isDialogOpen, currentDate]);

  const handleMetricClick = (metricId: string) => {
    setSelectedMetric(metricId);
    setIsDialogOpen(true);
    // Reset selection and sorting when opening a new metric view
    setSelectedIds([]);
    setSortField("");
    setSortDirection("asc");
    setSearchTerm("");
    setFilters({});
  };

  const getDetailTitle = () => {
    switch (selectedMetric) {
      case 'available': return 'Available Employees';
      case 'leave': return 'Employees on Leave';
      case 'training': return 'Employees in Training';
      case 'grounded': return 'Grounded Aircraft';
      case 'assigned': return 'Aircraft with Assigned Teams';
      case 'pending': return 'Aircraft Pending Assignment';
      case 'productivity': return 'Available Aircraft';
      case 'total-employees': return 'Total Employees';
      default: return 'Details';
    }
  };

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
          csvData = detailData.map(item => ({
            Name: item.name,
            'Employee ID': `E${item.e_number}`,
            Position: item.job_titles?.job_description || 'N/A',
            Team: item.team?.team_name || 'N/A',
            Mobile: item.mobile_number || 'N/A',
            'Date of Joining': item.date_of_joining ? new Date(item.date_of_joining).toLocaleDateString() : 'N/A'
          }));
          filename = selectedMetric === 'available' ? 'available-employees.csv' : 'total-employees.csv';
          break;
        
        case 'leave':
          csvData = detailData.map(item => ({
            Name: item.employees?.name || 'N/A',
            'Employee ID': `E${item.employees?.e_number}` || 'N/A',
            Position: item.employees?.job_titles?.job_description || 'N/A',
            Team: item.employees?.team?.team_name || 'N/A',
            Mobile: item.employees?.mobile_number || 'N/A',
            'Leave Until': item.date ? new Date(item.date).toLocaleDateString() : 'N/A'
          }));
          filename = 'employees-on-leave.csv';
          break;
          
        case 'training':
          csvData = detailData.map(item => ({
            Name: item.employees?.name || 'N/A',
            'Employee ID': `E${item.employees?.e_number}` || 'N/A',
            Position: item.employees?.job_titles?.job_description || 'N/A',
            Team: item.employees?.team?.team_name || 'N/A',
            Mobile: item.employees?.mobile_number || 'N/A',
            Training: item.training_types?.name || 'N/A',
            'Training Date': item.required_date ? new Date(item.required_date).toLocaleDateString() : 'N/A'
          }));
          filename = 'employees-in-training.csv';
          break;
          
        case 'grounded':
        case 'assigned':
        case 'pending':
        case 'productivity':
          csvData = detailData.map(item => {
            if (selectedMetric === 'productivity') {
              return {
                Aircraft: item.aircraft_name || 'N/A',
                Registration: item.registration || 'N/A',
                Type: item.aircraft_types?.type_name || 'N/A',
                Manufacturer: item.aircraft_types?.manufacturer || 'N/A',
                Customer: item.customer || 'N/A',
                'Total Hours': item.total_hours || '0',
                'Total Cycles': item.total_cycles || '0'
              };
            } else {
              return {
                Aircraft: item.aircraft?.aircraft_name || 'N/A',
                Registration: item.aircraft?.registration || 'N/A',
                Type: item.aircraft?.aircraft_types?.type_name || 'N/A',
                'Check Type': item.check_type || 'N/A',
                'Date Range': `${new Date(item.date_in).toLocaleDateString()} - ${new Date(item.date_out).toLocaleDateString()}`,
                Status: item.status || 'N/A',
                'Total Hours': item.total_hours || '0',
                Remarks: item.remarks || ''
              };
            }
          });
          filename = `${selectedMetric}-aircraft.csv`;
          break;
          
        default:
          csvData = detailData;
          filename = 'export.csv';
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

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle filtering
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  // Filter data based on search and filters
  const filterData = () => {
    let filteredData = [...detailData];
    
    // Apply search term if exists
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => {
        // For employee data
        if (selectedMetric === 'available' || selectedMetric === 'total-employees') {
          return (
            (item?.name && item.name.toLowerCase().includes(term)) ||
            (item?.e_number && `e${item.e_number}`.toLowerCase().includes(term)) ||
            (item?.job_titles?.job_description && item.job_titles.job_description.toLowerCase().includes(term)) ||
            (item?.team?.team_name && item.team.team_name.toLowerCase().includes(term))
          );
        } 
        else if (selectedMetric === 'leave' || selectedMetric === 'training') {
          const employee = item.employees;
          return (
            (employee?.name && employee.name.toLowerCase().includes(term)) ||
            (employee?.e_number && `e${employee.e_number}`.toLowerCase().includes(term)) ||
            (employee?.job_titles?.job_description && employee.job_titles.job_description.toLowerCase().includes(term)) ||
            (employee?.team?.team_name && employee.team.team_name.toLowerCase().includes(term))
          );
        }
        // For aircraft data
        else if (selectedMetric === 'productivity') {
          return (
            (item?.aircraft_name && item.aircraft_name.toLowerCase().includes(term)) ||
            (item?.registration && item.registration.toLowerCase().includes(term)) ||
            (item?.aircraft_types?.type_name && item.aircraft_types.type_name.toLowerCase().includes(term))
          );
        }
        else {
          return (
            (item.aircraft?.aircraft_name && item.aircraft.aircraft_name.toLowerCase().includes(term)) ||
            (item.aircraft?.registration && item.aircraft.registration.toLowerCase().includes(term)) ||
            (item.check_type && item.check_type.toLowerCase().includes(term))
          );
        }
      });
    }
    
    // Apply field-specific filters
    Object.entries(filters).forEach(([field, value]) => {
      if (!value) return;
      
      filteredData = filteredData.filter(item => {
        if (selectedMetric === 'available' || selectedMetric === 'total-employees') {
          switch (field) {
            case 'name':
              return item?.name && item.name.toLowerCase().includes(value.toLowerCase());
            case 'position':
              return item?.job_titles?.job_description && 
                item.job_titles.job_description.toLowerCase().includes(value.toLowerCase());
            case 'team':
              return item?.team?.team_name && 
                item.team.team_name.toLowerCase().includes(value.toLowerCase());
            default:
              return true;
          }
        } 
        else if (selectedMetric === 'leave' || selectedMetric === 'training') {
          const employee = item.employees;
          
          switch (field) {
            case 'name':
              return employee?.name && employee.name.toLowerCase().includes(value.toLowerCase());
            case 'position':
              return employee?.job_titles?.job_description && 
                employee.job_titles.job_description.toLowerCase().includes(value.toLowerCase());
            case 'team':
              return employee?.team?.team_name && 
                employee.team.team_name.toLowerCase().includes(value.toLowerCase());
            default:
              return true;
          }
        }
        else if (selectedMetric === 'productivity') {
          switch (field) {
            case 'aircraft':
              return item?.aircraft_name && 
                item.aircraft_name.toLowerCase().includes(value.toLowerCase());
            case 'registration':
              return item?.registration && 
                item.registration.toLowerCase().includes(value.toLowerCase());
            case 'type':
              return item?.aircraft_types?.type_name && 
                item.aircraft_types.type_name.toLowerCase().includes(value.toLowerCase());
            default:
              return true;
          }
        }
        else {
          switch (field) {
            case 'aircraft':
              return item.aircraft?.aircraft_name && 
                item.aircraft.aircraft_name.toLowerCase().includes(value.toLowerCase());
            case 'registration':
              return item.aircraft?.registration && 
                item.aircraft.registration.toLowerCase().includes(value.toLowerCase());
            case 'checkType':
              return item.check_type && 
                item.check_type.toLowerCase().includes(value.toLowerCase());
            case 'status':
              return item.status && 
                item.status.toLowerCase().includes(value.toLowerCase());
            default:
              return true;
          }
        }
      });
    });
    
    // Apply sorting if field is specified
    if (sortField) {
      filteredData.sort((a, b) => {
        let valueA, valueB;
        
        // Extract the correct values based on the field path
        if (sortField.includes('.')) {
          const parts = sortField.split('.');
          let objectA = a;
          let objectB = b;
          
          for (const part of parts) {
            objectA = objectA?.[part];
            objectB = objectB?.[part];
          }
          
          valueA = objectA;
          valueB = objectB;
        } else {
          valueA = a[sortField];
          valueB = b[sortField];
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

  // Convert data to columns format for SortableTable
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
            <span>{item.job_titles?.job_description || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.job_titles?.job_description,
        },
        {
          id: 'team',
          header: 'Team',
          cell: (item: any) => (
            <span>{item.team?.team_name || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.team?.team_name,
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
            <span>{(item.certifications && item.certifications.length) || '0'}</span>
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
            <span className="font-medium">{item.employees?.name || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.employees?.name,
        },
        {
          id: 'id',
          header: 'ID',
          cell: (item: any) => (
            <span>E{item.employees?.e_number || 'N/A'}</span>
          ),
        },
        {
          id: 'position',
          header: 'Position',
          cell: (item: any) => (
            <span>{item.employees?.job_titles?.job_description || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.employees?.job_titles?.job_description,
        },
        {
          id: 'team',
          header: 'Team',
          cell: (item: any) => (
            <span>{item.employees?.team?.team_name || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.employees?.team?.team_name,
        },
        {
          id: 'mobile',
          header: 'Mobile',
          cell: (item: any) => (
            <span>{item.employees?.mobile_number || 'N/A'}</span>
          ),
        },
        {
          id: 'joinDate',
          header: 'Join Date',
          cell: (item: any) => (
            <span>
              {item.employees?.date_of_joining ? 
                new Date(item.employees?.date_of_joining).toLocaleDateString() : 'N/A'}
            </span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.employees?.date_of_joining,
        },
        ...(selectedMetric === 'training' ? [
          {
            id: 'training',
            header: 'Training',
            cell: (item: any) => (
              <span>{item.training_types?.name || 'N/A'}</span>
            ),
          },
          {
            id: 'trainingDate',
            header: 'Date',
            cell: (item: any) => (
              <span>{item.required_date ? new Date(item.required_date).toLocaleDateString() : 'N/A'}</span>
            ),
            sortable: true,
            accessorFn: (item: any) => item.required_date,
          },
        ] : []),
        ...(selectedMetric === 'leave' ? [
          {
            id: 'leaveUntil',
            header: 'Until',
            cell: (item: any) => (
              <span>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
            ),
            sortable: true,
            accessorFn: (item: any) => item.date,
          },
        ] : []),
        {
          id: 'certifications',
          header: 'Certifications',
          cell: (item: any) => (
            <span>
              {(item.employees?.certifications && item.employees?.certifications.length) || '0'}
            </span>
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
    else if (selectedMetric === 'productivity') {
      // Aircraft columns for available aircraft
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
            <span>{item.aircraft_types?.type_name || 'N/A'}</span>
          ),
        },
        {
          id: 'manufacturer',
          header: 'Manufacturer',
          cell: (item: any) => (
            <span>{item.aircraft_types?.manufacturer || 'N/A'}</span>
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
      // Aircraft in maintenance columns
      return [
        {
          id: 'aircraft',
          header: 'Aircraft',
          cell: (item: any) => (
            <span className="font-medium">{item.aircraft?.aircraft_name || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.aircraft?.aircraft_name,
        },
        {
          id: 'registration',
          header: 'Registration',
          cell: (item: any) => (
            <span>{item.aircraft?.registration || 'N/A'}</span>
          ),
          sortable: true,
          accessorFn: (item: any) => item.aircraft?.registration,
        },
        {
          id: 'type',
          header: 'Type',
          cell: (item: any) => (
            <span>{item.aircraft?.aircraft_types?.type_name || 'N/A'}</span>
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
          id: 'hangars',
          header: 'Hangars',
          cell: (item: any) => (
            <span>{item.hangar_id || 'Not Assigned'}</span>
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

  // Function to render appropriate detail content based on selected metric
  const renderDetailContent = () => {
    if (detailData.length === 0) {
      return <div className="p-4 text-center text-gray-500">No data available</div>;
    }

    const filteredData = filterData();
    const columns = getColumnsForMetric();
    
    return (
      <div className="space-y-4">
        <SortableTable 
          data={filteredData}
          columns={columns}
          defaultSortColumn={sortField}
          className="w-full"
        />
      </div>
    );
  };
  
  const metrics = [
    { 
      id: 'total-employees', 
      label: 'Total Employees', 
      value: isLoading ? '-' : (totalEmployees || 0), 
      icon: Users, 
      color: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800',
    },
    { 
      id: 'available', 
      label: 'Available Employees', 
      value: isLoading ? '-' : (availableEmployees || 0), 
      icon: UserCheck, 
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
    },
    { 
      id: 'leave', 
      label: 'On Leave', 
      value: isLoading ? '-' : onLeaveCount || 0, 
      icon: CalendarCheck, 
      color: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
    },
    { 
      id: 'training', 
      label: 'In Training', 
      value: isLoading ? '-' : inTrainingCount || 0, 
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
      value: isLoading ? '-' : aircraftMetrics?.inMaintenance || 0, 
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

  return (
    <>
      <div className="grid grid-cols-8 gap-2 mb-6">
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-4/5 h-4/5 max-w-[90vw] max-h-[90vh]" onInteractOutside={e => e.preventDefault()}>
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle className="text-xl">{getDetailTitle()}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </DialogHeader>
          
          <DialogDescription className="sr-only">Details for {getDetailTitle()}</DialogDescription>
          
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
                {filterData().length} record{filterData().length !== 1 ? 's' : ''} found
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
              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setIsFilterDialogOpen(true)}>
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2" 
                onClick={handleExport}
                disabled={filterData().length === 0}
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

      {/* Column Filter Popover */}
      <Popover open={activeFilter !== null} onOpenChange={(open) => !open && setActiveFilter(null)}>
        <PopoverContent className="w-80" align="start">
          {activeFilter === "name" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Name</h3>
              <div className="flex items-center border rounded-md">
                <Search className="h-4 w-4 ml-2 text-gray-500" />
                <Input 
                  placeholder="Search name..." 
                  className="border-0 focus-visible:ring-0"
                  value={filters.name || ''}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>
            </div>
          )}
          {activeFilter === "position" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Position</h3>
              <div className="flex items-center border rounded-md">
                <Search className="h-4 w-4 ml-2 text-gray-500" />
                <Input 
                  placeholder="Search position..." 
                  className="border-0 focus-visible:ring-0"
                  value={filters.position || ''}
                  onChange={(e) => handleFilterChange('position', e.target.value)}
                />
              </div>
            </div>
          )}
          {activeFilter === "team" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Team</h3>
              <div className="flex items-center border rounded-md">
                <Search className="h-4 w-4 ml-2 text-gray-500" />
                <Input 
                  placeholder="Search team..." 
                  className="border-0 focus-visible:ring-0"
                  value={filters.team || ''}
                  onChange={(e) => handleFilterChange('team', e.target.value)}
                />
              </div>
            </div>
          )}
          {activeFilter === "aircraft" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Aircraft</h3>
              <div className="flex items-center border rounded-md">
                <Search className="h-4 w-4 ml-2 text-gray-500" />
                <Input 
                  placeholder="Search aircraft..." 
                  className="border-0 focus-visible:ring-0"
                  value={filters.aircraft || ''}
                  onChange={(e) => handleFilterChange('aircraft', e.target.value)}
                />
              </div>
            </div>
          )}
          {activeFilter === "registration" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Registration</h3>
              <div className="flex items-center border rounded-md">
                <Search className="h-4 w-4 ml-2 text-gray-500" />
                <Input 
                  placeholder="Search registration..." 
                  className="border-0 focus-visible:ring-0"
                  value={filters.registration || ''}
                  onChange={(e) => handleFilterChange('registration', e.target.value)}
                />
              </div>
            </div>
          )}
          {activeFilter === "checkType" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Check Type</h3>
              <div className="flex items-center border rounded-md">
                <Search className="h-4 w-4 ml-2 text-gray-500" />
                <Input 
                  placeholder="Search check type..." 
                  className="border-0 focus-visible:ring-0"
                  value={filters.checkType || ''}
                  onChange={(e) => handleFilterChange('checkType', e.target.value)}
                />
              </div>
            </div>
          )}
          {activeFilter === "status" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Status</h3>
              <div className="flex items-center border rounded-md">
                <Search className="h-4 w-4 ml-2 text-gray-500" />
                <Input 
                  placeholder="Search status..." 
                  className="border-0 focus-visible:ring-0"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
};
