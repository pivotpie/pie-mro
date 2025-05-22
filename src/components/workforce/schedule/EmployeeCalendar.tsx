import { useState, useRef, useEffect, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Filter, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isToday } from 'date-fns';

// Define interfaces for better type safety
interface EmployeeRoster {
  id: string | number; // Accept both string and number to handle BigInt conversion
  employee_id: string | number; // Accept both string and number to handle BigInt conversion
  date: string;
  status_code: string;
  notes: string | null;
}

interface EmployeeCore {
  id: string;
  employee_id: string;
  core_code: string;
}

interface EmployeeSupport {
  id: string;
  employee_id: string;
  support_code: string;
}

interface Employee {
  id: string;
  e_number?: string | null;
  name: string;
  mobile_number?: string | null;
  team?: { team_name: string } | null;
  job_title?: { job_description: string; job_code: string } | null;
  employee_status?: string | null;
  key_name?: string | null;
  night_shift_ok?: boolean | null;
  fte_date?: string | null;
  ttl?: string | null;
  cores?: string[];
  supports?: string[];
  schedule?: Record<string, string>;
}

// Helper function to determine if a date is a weekend
const isWeekendDate = (date: Date) => {
  return isWeekend(date);
};

// Generate days for a two-month period
const generateTwoMonthDays = () => {
  const currentDate = new Date();
  const currentMonth = startOfMonth(currentDate);
  const nextMonth = addMonths(currentMonth, 1);
  const endOfNextMonth = endOfMonth(nextMonth);
  
  const dateRange = eachDayOfInterval({
    start: currentMonth,
    end: endOfNextMonth
  });
  
  return dateRange.map(date => ({
    date,
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
    isWeekend: isWeekendDate(date),
    isToday: isToday(date),
    monthName: format(date, 'MMM')
  }));
};

// Add a function to check if core and support are different
const hasDifferentCoreSupport = (employee: Employee) => {
  if (!employee.cores || !employee.supports) return false;
  if (employee.cores.length === 0 || employee.supports.length === 0) return false;
  
  // Check if there's any overlap between cores and supports
  const hasOverlap = employee.cores.some(core => employee.supports?.includes(core));
  
  // If there's no overlap and both have values, they're different
  return !hasOverlap && employee.cores.length > 0 && employee.supports.length > 0;
};

export const EmployeeCalendar = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const days = generateTwoMonthDays();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [filterOpen, setFilterOpen] = useState<Record<string, boolean>>({});
  const [dateColumnFilters, setDateColumnFilters] = useState<Record<string, string[]>>({});
  const [dateFilterOpen, setDateFilterOpen] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [rosterCodes, setRosterCodes] = useState<Record<string, string>>({});
  
  const columnWidths = {
    id: 80,
    name: 200,
    alias: 70,
    mobile: 130,
    team: 100,
    core: 100,
    support: 100,
    title: 100,
    night_shift: 70,
    fte: 80,
    ttl: 80,
    date: 45 // Width of each date column
  };

  // Get unique status values for a specific date
  const getUniqueStatusValues = (dateKey: string) => {
    const statuses = employees.map(emp => emp.schedule?.[dateKey] || '');
    return [...new Set(statuses)].filter(Boolean).sort();
  };

  useEffect(() => {
    // Fetch roster codes first to ensure we have the descriptions for the legend
    const fetchRosterCodes = async () => {
      try {
        const { data, error } = await supabase
          .from('roster_codes')
          .select('roster_code, description');
        
        if (error) {
          throw error;
        }

        const codeMap: Record<string, string> = {};
        data.forEach((item) => {
          codeMap[item.roster_code] = item.description || item.roster_code;
        });
        
        setRosterCodes(codeMap);
        console.log("Roster codes fetched:", codeMap);
      } catch (error: any) {
        console.error("Error fetching roster codes:", error);
      }
    };

    fetchRosterCodes();

    const fetchEmployees = async () => {
      try {
        setLoading(true);
        
        // Fetch all employees with their related data
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select(`
            id,
            e_number,
            name,
            mobile_number,
            key_name,
            night_shift_ok,
            fte_date,
            team:team_id(team_name),
            job_title:job_title_id(job_code, job_description),
            employee_status
          `);
        
        if (employeesError) {
          throw employeesError;
        }

        // Convert the employee data to match our Employee interface
        const typedEmployees: Employee[] = employeesData.map(emp => ({
          ...emp,
          id: emp.id.toString(), // Convert id to string
          e_number: emp.e_number?.toString(), // Convert e_number to string
          cores: [],
          supports: []
        }));

        // Fetch employee cores
        const { data: coresData, error: coresError } = await supabase
          .from('employee_cores')
          .select(`
            id,
            employee_id,
            core:core_id(core_code)
          `);
          
        if (coresError) {
          console.error("Error fetching employee cores:", coresError);
        } else if (coresData) {
          // Assign cores to employees
          const employeesCoreMap: Record<string, string[]> = {};
          
          coresData.forEach((coreData: any) => {
            const employeeId = coreData.employee_id?.toString();
            if (employeeId) {
              if (!employeesCoreMap[employeeId]) {
                employeesCoreMap[employeeId] = [];
              }
              if (coreData.core?.core_code) {
                employeesCoreMap[employeeId].push(coreData.core.core_code);
              }
            }
          });
          
          // Add cores to employees
          typedEmployees.forEach(emp => {
            if (employeesCoreMap[emp.id]) {
              emp.cores = employeesCoreMap[emp.id];
            }
          });
        }
        
        // Fetch employee supports
        const { data: supportsData, error: supportsError } = await supabase
          .from('employee_supports')
          .select(`
            id,
            employee_id,
            support:support_id(support_code)
          `);
          
        if (supportsError) {
          console.error("Error fetching employee supports:", supportsError);
        } else if (supportsData) {
          // Assign supports to employees
          const employeesSupportsMap: Record<string, string[]> = {};
          
          supportsData.forEach((supportData: any) => {
            const employeeId = supportData.employee_id?.toString();
            if (employeeId) {
              if (!employeesSupportsMap[employeeId]) {
                employeesSupportsMap[employeeId] = [];
              }
              if (supportData.support?.support_code) {
                employeesSupportsMap[employeeId].push(supportData.support.support_code);
              }
            }
          });
          
          // Add supports to employees
          typedEmployees.forEach(emp => {
            if (employeesSupportsMap[emp.id]) {
              emp.supports = employeesSupportsMap[emp.id];
            }
          });
        }

        // Fetch attendance data for today to get TTL (time to location)
        const today = new Date();
        const todayString = format(today, 'yyyy-MM-dd');
        
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select(`
            employee_id,
            check_in_time
          `)
          .eq('date', todayString);
          
        if (attendanceError) {
          console.error("Error fetching attendance data:", attendanceError);
        } else if (attendanceData) {
          // Create a map of employee ID to check-in time
          const checkInMap: Record<string, string> = {};
          
          attendanceData.forEach((attendance: any) => {
            const employeeId = attendance.employee_id?.toString();
            if (employeeId && attendance.check_in_time) {
              const checkInTime = new Date(attendance.check_in_time);
              checkInMap[employeeId] = format(checkInTime, 'hh:mm a');
            }
          });
          
          // Add TTL to employees
          typedEmployees.forEach(emp => {
            if (checkInMap[emp.id]) {
              emp.ttl = checkInMap[emp.id];
            }
          });
        }

        // Get employee roster data using the RPC function
        const { data: rosterData, error: rosterError } = await supabase.rpc('get_employee_roster');
        
        if (rosterError) {
          console.error("Error fetching roster data:", rosterError);
          toast.error(`Error fetching roster assignments: ${rosterError.message}`);
          setEmployees(typedEmployees);
          setFilteredEmployees(typedEmployees);
          setLoading(false);
          return;
        }

        console.log("Roster data fetched:", rosterData);

        // Process employees with the roster data if available
        if (rosterData && rosterData.length > 0) {
          const employeesWithSchedule = typedEmployees.map(emp => {
            const schedule: Record<string, string> = {};
            
            // Update with actual roster data
            rosterData.forEach((roster: any) => {
              // Convert BigInt to string for comparison
              const employeeIdStr = typeof roster.employee_id === 'bigint' 
                ? roster.employee_id.toString() 
                : roster.employee_id;
                
              if (employeeIdStr === emp.id) {
                if (roster.date) {
                  const rosterDate = new Date(roster.date);
                  const dateKey = `${rosterDate.getMonth()+1}-${rosterDate.getDate()}-${rosterDate.getFullYear()}`;
                  schedule[dateKey] = roster.status_code || "";
                }
              }
            });
            
            return {
              ...emp,
              schedule
            };
          });
          
          setEmployees(employeesWithSchedule);
          setFilteredEmployees(employeesWithSchedule);
        } else {
          console.log("No roster data returned from function");
          setEmployees(typedEmployees);
          setFilteredEmployees(typedEmployees);
        }
      } catch (error: any) {
        toast.error(`Error loading employees: ${error.message}`);
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);
  
  // Filter unique values from a column with search term support
  const getUniqueValuesForColumn = (columnName: string) => {
    const searchTerm = searchTerms[columnName]?.toLowerCase() || '';
    const values = employees.map(emp => {
      if (columnName === 'team') return emp.team?.team_name || '';
      if (columnName === 'job_title') return emp.job_title?.job_description || '';
      if (columnName === 'core') {
        return emp.cores && emp.cores.length > 0 ? emp.cores.join(', ') : '';
      }
      if (columnName === 'support') {
        return emp.supports && emp.supports.length > 0 ? emp.supports.join(', ') : '';
      }
      if (columnName === 'night_shift') {
        const nightShiftValue = emp.night_shift_ok ? 'Yes' : 'No';
        return values.includes(nightShiftValue);
      }
      return (emp[columnName as keyof Employee]?.toString() || '');
    }).filter(Boolean);
    
    const uniqueValues = [...new Set(values)].sort();
    
    // Apply search filter if present
    if (searchTerm) {
      return uniqueValues.filter(value => 
        value.toLowerCase().includes(searchTerm)
      );
    }
    
    return uniqueValues;
  };

  // Apply filters to employees
  useEffect(() => {
    let result = [...employees];
    
    // Apply regular column filters
    Object.entries(columnFilters).forEach(([column, values]) => {
      if (values.length > 0) {
        result = result.filter(emp => {
          if (column === 'team') {
            return values.includes(emp.team?.team_name || '');
          }
          if (column === 'job_title') {
            return values.includes(emp.job_title?.job_description || '');
          }
          if (column === 'core') {
            return values.some(value => emp.cores?.includes(value));
          }
          if (column === 'support') {
            return values.some(value => emp.supports?.includes(value));
          }
          if (column === 'night_shift') {
            const nightShiftValue = emp.night_shift_ok ? 'Yes' : 'No';
            return values.includes(nightShiftValue);
          }
          const empValue = emp[column as keyof Employee];
          return values.includes(String(empValue || ''));
        });
      }
    });
    
    // Apply date column filters
    Object.entries(dateColumnFilters).forEach(([dateKey, values]) => {
      if (values.length > 0) {
        result = result.filter(emp => {
          const status = emp.schedule?.[dateKey] || '';
          return values.includes(status);
        });
      }
    });
    
    setFilteredEmployees(result);
  }, [columnFilters, dateColumnFilters, employees]);

  // Handle column filter changes
  const handleFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => {
      const currentValues = prev[column] || [];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [column]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [column]: [...currentValues, value]
        };
      }
    });
  };

  // Handle date column filter changes
  const handleDateFilterChange = (dateKey: string, value: string) => {
    setDateColumnFilters(prev => {
      const currentValues = prev[dateKey] || [];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [dateKey]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [dateKey]: [...currentValues, value]
        };
      }
    });
  };

  // Clear filters for a column
  const clearColumnFilter = (column: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: []
    }));
  };

  // Clear filters for a date column
  const clearDateColumnFilter = (dateKey: string) => {
    setDateColumnFilters(prev => ({
      ...prev,
      [dateKey]: []
    }));
  };

  // Clear search term
  const clearSearchTerm = (column: string) => {
    setSearchTerms(prev => {
      const newTerms = { ...prev };
      delete newTerms[column];
      return newTerms;
    });
  };

  // Handle search term changes
  const handleSearchTermChange = (column: string, value: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Cell click handler
  const handleCellClick = (employee: Employee, date: string) => {
    setSelectedEmployee(employee);
    setSelectedDate(date);
    setIsDetailOpen(true);
  };

  // Status color mapping
  const statusColors: Record<string, string> = {
    "D": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "L": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "T": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "O": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    "B1": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "AL": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "SK": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    "DO": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    "TR": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  };

  // Legend for status codes
  const statusLegend = [
    { status: "On Duty", code: "D", color: "bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700" },
    { status: "Half Day", code: "B1", color: "bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:border-blue-700" },
    { status: "Annual Leave", code: "AL", color: "bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700" },
    { status: "Sick Leave", code: "SK", color: "bg-orange-100 border border-orange-300 dark:bg-orange-900 dark:border-orange-700" },
    { status: "Training", code: "TR", color: "bg-purple-100 border border-purple-300 dark:bg-purple-900 dark:border-purple-700" },
    { status: "Day Off", code: "O", color: "bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-600" },
    { status: "Overtime", code: "DO", color: "bg-yellow-100 border border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700" },
  ];

  // Updated legend that uses the fetched roster codes
  const dynamicStatusLegend = useMemo(() => {
    const legendItems = [];
    
    if (rosterCodes["D"]) {
      legendItems.push({ status: rosterCodes["D"], code: "D", color: "bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700" });
    }
    
    if (rosterCodes["B1"]) {
      legendItems.push({ status: rosterCodes["B1"], code: "B1", color: "bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:border-blue-700" });
    }
    
    if (rosterCodes["AL"]) {
      legendItems.push({ status: rosterCodes["AL"], code: "AL", color: "bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700" });
    }
    
    if (rosterCodes["SK"]) {
      legendItems.push({ status: rosterCodes["SK"], code: "SK", color: "bg-orange-100 border border-orange-300 dark:bg-orange-900 dark:border-orange-700" });
    }
    
    if (rosterCodes["TR"] || rosterCodes["T"]) {
      legendItems.push({ status: rosterCodes["TR"] || rosterCodes["T"] || "Training", code: "TR", color: "bg-purple-100 border border-purple-300 dark:bg-purple-900 dark:border-purple-700" });
    }
    
    if (rosterCodes["O"]) {
      legendItems.push({ status: rosterCodes["O"], code: "O", color: "bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-600" });
    }
    
    if (rosterCodes["DO"]) {
      legendItems.push({ status: rosterCodes["DO"], code: "DO", color: "bg-yellow-100 border border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700" });
    }
    
    // Return default legend if no roster codes available
    if (legendItems.length === 0) {
      return statusLegend;
    }
    
    return legendItems;
  }, [rosterCodes]);

  // Column filter component with search
  const ColumnFilter = ({ column, label }: { column: string, label: string }) => {
    const searchTerm = searchTerms[column] || '';
    const uniqueValues = useMemo(() => getUniqueValuesForColumn(column), [column, searchTerm]);
    const selectedValues = columnFilters[column] || [];
    
    return (
      <Popover open={filterOpen[column]} onOpenChange={(open) => setFilterOpen(prev => ({ ...prev, [column]: open }))}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 relative">
            <Filter className={`h-3 w-3 ${selectedValues.length ? 'text-blue-500' : ''}`} />
            {selectedValues.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                {selectedValues.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0 popover-content">
          <div className="p-2 border-b">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Filter {label}</h4>
              {selectedValues.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                  onClick={() => clearColumnFilter(column)}
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder={`Search ${label}...`}
                className="pl-8 pr-8 h-8 text-sm"
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(column, e.target.value)}
              />
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => clearSearchTerm(column)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="p-2 max-h-60 overflow-auto">
            {uniqueValues.map((value) => (
              <div key={value} className="flex items-center space-x-2 py-1">
                <button
                  className="flex items-center w-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded text-left"
                  onClick={() => handleFilterChange(column, value)}
                >
                  <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${
                    selectedValues.includes(value) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedValues.includes(value) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="flex-grow truncate">{value}</span>
                </button>
              </div>
            ))}
            {uniqueValues.length === 0 && (
              <div className="text-center py-2 text-gray-500 dark:text-gray-400">
                No matching values found
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Date column filter component
  const DateColumnFilter = ({ dateKey }: { dateKey: string }) => {
    const uniqueValues = useMemo(() => getUniqueStatusValues(dateKey), [dateKey]);
    const selectedValues = dateColumnFilters[dateKey] || [];
    
    return (
      <Popover open={dateFilterOpen[dateKey]} onOpenChange={(open) => setDateFilterOpen(prev => ({ ...prev, [dateKey]: open }))}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-4 w-4 relative">
            <Filter className={`h-2 w-2 ${selectedValues.length ? 'text-blue-500' : ''}`} />
            {selectedValues.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-3 h-3 text-[8px] flex items-center justify-center">
                {selectedValues.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0">
          <div className="p-2 border-b">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-xs">Filter Status</h4>
              {selectedValues.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => clearDateColumnFilter(dateKey)}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="p-2 max-h-40 overflow-auto">
            {uniqueValues.map((value) => (
              <div key={value as string} className="flex items-center space-x-2 py-1">
                <button
                  className="flex items-center w-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded text-left"
                  onClick={() => handleDateFilterChange(dateKey, value as string)}
                >
                  <div className={`w-3 h-3 border rounded mr-1 flex items-center justify-center ${
                    selectedValues.includes(value as string) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedValues.includes(value as string) && (
                      <Check className="h-2 w-2 text-white" />
                    )}
                  </div>
                  <span className="flex-grow truncate text-xs">
                    {rosterCodes[value] || value}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Calculate left positions for sticky columns
  const getLeftPositionStyle = (index: number) => {
    let left = 0;
    const columnOrder = ['id', 'name', 'alias', 'mobile', 'team', 'core', 'support', 'title', 'night_shift', 'fte', 'ttl'];
    
    for (let i = 0; i < index; i++) {
      left += columnWidths[columnOrder[i] as keyof typeof columnWidths];
    }
    
    return `${left}px`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate total width for columns to ensure proper horizontal scrolling
  const totalWidth = columnWidths.id + columnWidths.name + columnWidths.alias + 
    columnWidths.mobile + columnWidths.team + columnWidths.core + 
    columnWidths.support + columnWidths.title + columnWidths.night_shift + 
    columnWidths.fte + columnWidths.ttl + (days.length * columnWidths.date);

  return (
    <div>
      {/* Status Legend */}
      <div className="flex items-center gap-4 mb-2 px-2 flex-wrap">
        {dynamicStatusLegend.map((item) => (
          <div key={item.status} className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-1 ${item.color}`}></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{item.status} ({item.code})</span>
          </div>
        ))}
      </div>
      
      {/* Simple table with direct scrolling */}
      <div className="border rounded-lg dark:border-gray-700 overflow-auto">
        <div style={{ width: `${totalWidth}px`, minWidth: '100%' }} className="relative overflow-auto h-[400px]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                {/* Fixed columns */}
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.id}px`, left: 0 }}>
                  <div className="flex items-center justify-between">
                    <span>Emp#</span>
                    <ColumnFilter column="e_number" label="ID" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.name}px`, left: getLeftPositionStyle(1) }}>
                  <div className="flex items-center justify-between">
                    <span>Name</span>
                    <ColumnFilter column="name" label="Name" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.alias}px`, left: getLeftPositionStyle(2) }}>
                  <div className="flex items-center justify-between">
                    <span>Alias</span>
                    <ColumnFilter column="key_name" label="Alias" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.mobile}px`, left: getLeftPositionStyle(3) }}>
                  <div className="flex items-center justify-between">
                    <span>Mobile</span>
                    <ColumnFilter column="mobile_number" label="Mobile" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.team}px`, left: getLeftPositionStyle(4) }}>
                  <div className="flex items-center justify-between">
                    <span>Team</span>
                    <ColumnFilter column="team" label="Team" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.core}px`, left: getLeftPositionStyle(5) }}>
                  <div className="flex items-center justify-between">
                    <span>Core</span>
                    <ColumnFilter column="core" label="Core" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.support}px`, left: getLeftPositionStyle(6) }}>
                  <div className="flex items-center justify-between">
                    <span>Support</span>
                    <ColumnFilter column="support" label="Support" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.title}px`, left: getLeftPositionStyle(7) }}>
                  <div className="flex items-center justify-between">
                    <span>Title</span>
                    <ColumnFilter column="job_title" label="Title" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.night_shift}px`, left: getLeftPositionStyle(8) }}>
                  <div className="flex items-center justify-between">
                    <span>Night</span>
                    <ColumnFilter column="night_shift" label="Night Shift" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.fte}px`, left: getLeftPositionStyle(9) }}>
                  <div className="flex items-center justify-between">
                    <span>FTE</span>
                    <ColumnFilter column="fte_date" label="FTE Date" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                  style={{ width: `${columnWidths.ttl}px`, left: getLeftPositionStyle(10) }}>
                  <div className="flex items-center justify-between">
                    <span>TTL</span>
                    <ColumnFilter column="ttl" label="Time to Location" />
                  </div>
                </th>
                
                {/* Calendar days */}
                {days.map((day) => (
                  <th 
                    key={`${day.month+1}-${day.day}-${day.year}`} 
                    className={`p-2 text-center border-r sticky top-0 z-10 dark:border-gray-700 dark:text-gray-200
                      ${day.isWeekend ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                    style={{ width: `${columnWidths.date}px` }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-medium">{day.day}</div>
                      <div className="text-xs">{day.monthName}</div>
                      <DateColumnFilter dateKey={`${day.month+1}-${day.day}-${day.year}`} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => {
                const isDifferent = hasDifferentCoreSupport(employee);
                
                return (
                  <tr key={employee.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    {/* Fixed columns */}
                    <td 
                      className={`p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900
                        ${isDifferent ? 'core-support-different' : ''}`}
                      style={{ width: `${columnWidths.id}px`, left: 0 }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.e_number || '-'}
                    </td>
                    <td 
                      className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                      style={{ width: `${columnWidths.name}px`, left: getLeftPositionStyle(1) }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.name || '-'}
                    </td>
                    <td 
                      className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                      style={{ width: `${columnWidths.alias}px`, left: getLeftPositionStyle(2) }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.key_name || '-'}
                    </td>
                    <td 
                      className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                      style={{ width: `${columnWidths.mobile}px`, left: getLeftPositionStyle(3) }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.mobile_number || '-'}
                    </td>
                    <td 
                      className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                      style={{ width: `${columnWidths.team}px`, left: getLeftPositionStyle(4) }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.team?.team_name || '-'}
                    </td>
                    <td 
                      className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                      style={{ width: `${columnWidths.core}px`, left: getLeftPositionStyle(5) }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.cores?.join(', ') || '-'}
                    </td>
                    <td 
                      className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                      style={{ width: `${columnWidths.support}px`, left: getLeftPositionStyle(6) }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.supports?.join(', ') || '-'}
                    </td>
                    <td 
                      className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                      style={{ width: `${columnWidths.title}px`, left: getLeftPositionStyle(7) }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.job_title?.job_description || '-'}
                    </td>
                    <td 
                      className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                      style={{ width: `${columnWidths.night_shift}px`, left: getLeftPositionStyle(8) }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.night_shift_ok ? 'Yes' : 'No'}
                    </td>
                    <td 
                      className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                      style={{ width: `${columnWidths.fte}px`, left: getLeftPositionStyle(9) }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.fte_date ? format(new Date(employee.fte_date), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td 
                      className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                      style={{ width: `${columnWidths.ttl}px`, left: getLeftPositionStyle(10) }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.ttl || '-'}
                    </td>
                    
                    {/* Calendar days */}
                    {days.map((day) => {
                      const dateKey = `${day.month+1}-${day.day}-${day.year}`;
                      const status = employee.schedule?.[dateKey] || '';
                      const hasStatus = status !== '';
                      
                      return (
                        <TooltipProvider key={dateKey}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <td 
                                className={`p-2 text-center border-r cursor-pointer text-sm dark:border-gray-700
                                  ${day.isWeekend ? 'weekend-shade' : ''} 
                                  ${hasStatus ? statusColors[status] || '' : ''}
                                  ${day.isToday ? 'today-highlight' : ''}`}
                                style={{ width: `${columnWidths.date}px` }}
                                onClick={() => handleCellClick(employee, dateKey)}
                              >
                                {status}
                              </td>
                            </TooltipTrigger>
                            {hasStatus && (
                              <TooltipContent>
                                <div className="text-sm font-medium">{employee.name}</div>
                                <div className="text-xs">{format(day.date, 'MMMM d, yyyy')}</div>
                                <div className="text-sm font-medium">
                                  {rosterCodes[status] || (
                                    status === 'D' ? 'On Duty' :
                                    status === 'AL' ? 'Annual Leave' :
                                    status === 'TR' || status === 'T' ? 'Training' :
                                    status === 'O' ? 'Day Off' :
                                    status === 'B1' ? 'Half Day' :
                                    status === 'SK' ? 'Sick Leave' :
                                    status === 'DO' ? 'Overtime' :
                                    status
                                  )}
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </tr>
                );
              })}
              
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={12 + days.length} className="text-center py-4 text-gray-500 dark:text-gray-400">
                    {employees.length > 0 ? 'No matching employees found.' : 'No employees found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Employee Schedule Detail</SheetTitle>
          </SheetHeader>
          
          {selectedEmployee && (
            <div className="space-y-6 mt-6">
              <div className="grid gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Employee Information</h3>
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Name</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">ID</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.e_number}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Team</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.team?.team_name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Position</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.job_title?.job_description || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Core</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.cores?.join(', ') || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Support</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.supports?.join(', ') || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Night Shift</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.night_shift_ok ? 'Yes' : 'No'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">FTE Date</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.fte_date ? format(new Date(selectedEmployee.fte_date), 'yyyy-MM-dd') : '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Mobile</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.mobile_number || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Alias</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.key_name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">TTL</dt>
                      <dd className="font-medium dark:text-gray-200">{selectedEmployee.ttl || '-'}</dd>
                    </div>
                  </dl>
                </div>

                {selectedDate && selectedEmployee.schedule?.[selectedDate] && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Schedule for {selectedDate}</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <p className="font-medium dark:text-gray-200">
                          {rosterCodes[selectedEmployee.schedule?.[selectedDate]] || 
                           (selectedEmployee.schedule?.[selectedDate] === 'D' && 'On Duty') ||
                           (selectedEmployee.schedule?.[selectedDate] === 'AL' && 'Annual Leave') ||
                           (selectedEmployee.schedule?.[selectedDate] === 'L' && 'On Leave') ||
                           (selectedEmployee.schedule?.[selectedDate] === 'TR' && 'Training') ||
                           (selectedEmployee.schedule?.[selectedDate] === 'T' && 'Training') ||
                           (selectedEmployee.schedule?.[selectedDate] === 'O' && 'Day Off') ||
                           (selectedEmployee.schedule?.[selectedDate] === 'B1' && 'Half Day') ||
                           (selectedEmployee.schedule?.[selectedDate] === 'SK' && 'Sick Leave') ||
                           (selectedEmployee.schedule?.[selectedDate] === 'DO' && 'Overtime') ||
                           selectedEmployee.schedule?.[selectedDate]}
                        </p>
                      </div>
                      
                      <div className="pt-2">
                        <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                          Edit Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <style>
        {`
          .weekend-shade {
            background-color: #f9fafb;
          }
          .dark .weekend-shade {
            background-color: #1f2937;
          }
          .today-highlight {
            border: 2px solid #3b82f6 !important;
          }
        `}
      </style>
    </div>
  );
};
