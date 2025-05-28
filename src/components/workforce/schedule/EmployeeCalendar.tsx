import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Filter, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isToday } from 'date-fns';
import { cn } from "@/lib/utils";

// Define interfaces for better type safety - updated to match DB types
interface EmployeeRoster {
  id: number; // Changed from string to number to match bigint from database
  employee_id: number; // Changed from string to number to match bigint
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

// Define column widths for calculating total width
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

// Hard-coded left positions for sticky columns
const columnLeftPositions = {
  id: 0,        // First column starts at 0
  name: 80,     // 0 + 80 (id width)
  alias: 265,   // 80 + 200 (name width)
  mobile: 350,  // 280 + 70 (alias width)  
  team: 470,    // 350 + 130 (mobile width)
  core: 567,    // 480 + 100 (team width)
  support: 660, // 580 + 100 (core width)
  title: 760,   // 680 + 100 (support width)
  night_shift: 855, // 780 + 100 (title width)
  fte: 930,     // 880 + 70 (night_shift width)
  ttl: 1005     // 950 + 80 (fte width)
};

// Helper function to calculate the total width of the table
const calculateTotalWidth = (days: any[]) => {
  // Calculate the width of all fixed columns
  const fixedColumnsWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0) - columnWidths.date;
  // Add width for each day column
  const daysWidth = days.length * columnWidths.date;
  return fixedColumnsWidth + daysWidth;
};

// Helper function to calculate left position for sticky columns
const getLeftPositionStyle = (index: number) => {
  let position = 0;
  for (let i = 0; i < index; i++) {
    position += Object.values(columnWidths)[i];
  }
  return `${position}px`;
};

// Generate days for a two-month period based on current date parameter
const generateTwoMonthDays = (currentDate: Date) => {
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
    isWeekend: isWeekend(date),
    isToday: isToday(date),
    monthName: format(date, 'MMM')
  }));
};

// Column Filter Component
const ColumnFilter = ({ 
  column, 
  label, 
  values, 
  activeValues, 
  onValueSelect, 
  onClearAll 
}: { 
  column: string; 
  label: string; 
  values: string[];
  activeValues: string[];
  onValueSelect: (value: string) => void;
  onClearAll: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter values by search term
  const filteredValues = searchTerm ? 
    values.filter(value => value.toLowerCase().includes(searchTerm.toLowerCase())) : 
    values;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "p-0 h-5 w-5", 
            activeValues.length > 0 && "text-primary"
          )}
        >
          <Filter className={cn(
            "h-3 w-3",
            activeValues.length > 0 && "text-primary fill-primary"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{label} Filter</h4>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search..." 
              className="pl-8 h-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredValues.length > 0 ? (
              filteredValues.map((value) => (
                <div key={value} className="flex items-center py-1">
                  <Button
                    variant="ghost"
                    className="px-2 py-1 h-auto justify-start text-left w-full"
                    onClick={() => onValueSelect(value)}
                  >
                    <span className={cn(
                      "mr-2 h-4 w-4 rounded border flex items-center justify-center",
                      activeValues.includes(value) ? "bg-blue-500 border-blue-500" : "border-gray-300"
                    )}>
                      {activeValues.includes(value) && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="truncate">{value}</span>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-2">No filter options available</p>
            )}
          </div>
          {activeValues.length > 0 && (
            <div className="pt-2 border-t flex justify-end">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearAll}
                className="text-sm text-red-500"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Date Column Filter Component for filtering calendar days
const DateColumnFilter = ({ 
  dateKey, 
  values, 
  activeValues, 
  onValueSelect, 
  onClearAll 
}: { 
  dateKey: string; 
  values: string[];
  activeValues: string[];
  onValueSelect: (value: string) => void;
  onClearAll: () => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "p-0 h-4 w-4", 
            activeValues.length > 0 && "text-primary"
          )}
        >
          <Filter className={cn(
            "h-3 w-3",
            activeValues.length > 0 && "text-primary fill-primary"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 popover-content" align="center">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Status Filter</h4>
          <div className="max-h-40 overflow-y-auto">
            {values.length > 0 ? (
              values.map((status) => (
                <div key={status} className="flex items-center py-1">
                  <Button
                    variant="ghost"
                    className="px-2 py-1 h-auto justify-start text-left w-full"
                    onClick={() => onValueSelect(status)}
                  >
                    <span className={cn(
                      "mr-2 h-4 w-4 rounded border flex items-center justify-center",
                      activeValues.includes(status) ? "bg-blue-500 border-blue-500" : "border-gray-300"
                    )}>
                      {activeValues.includes(status) && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="truncate">{status}</span>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-2">No status data</p>
            )}
          </div>
          {activeValues.length > 0 && (
            <div className="pt-2 border-t flex justify-end">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearAll}
                className="text-sm text-red-500"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface EmployeeCalendarProps {
  onScroll: (position: number) => void;
  currentDate?: Date;
  onEmployeeSelect?: (employee: any) => void;
  onCellClick?: (employee: any, date: string, status: string) => void;
  refreshKey?: number; // Add refreshKey prop
}

export const EmployeeCalendar = React.forwardRef<HTMLDivElement, EmployeeCalendarProps>(
  ({ onScroll, currentDate = new Date(), onEmployeeSelect, onCellClick, refreshKey = 0 }, ref) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const days = useMemo(() => generateTwoMonthDays(currentDate), [currentDate]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [coreFilterValues, setCoreFilterValues] = useState<string[]>([]);
  const [supportFilterValues, setSupportFilterValues] = useState<string[]>([]);
  const [activeCoreFilters, setActiveCoreFilters] = useState<string[]>([]);
  const [activeSupportFilters, setActiveSupportFilters] = useState<string[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [dateColumnFilters, setDateColumnFilters] = useState<Record<string, string[]>>({});
  const [dateStatusValues, setDateStatusValues] = useState<Record<string, string[]>>({});

  // Calculate total width for the table
  const totalWidth = calculateTotalWidth(days);

  // Updated useEffect to also respond to refreshKey changes
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        
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
          `)
          .order('e_number'); // Sort by e_number in ascending order
        
        if (employeesError) {
          throw employeesError;
        }

        // Convert the employee data to match our Employee interface
        const typedEmployees: Employee[] = employeesData.map(emp => ({
          ...emp,
          id: String(emp.id), // Convert id to string
          e_number: emp.e_number?.toString(), // Convert e_number to string
          cores: [],
          supports: [],
          schedule: {}
        }));

        console.log("Fetched employees:", typedEmployees);
        console.log("Total employee count:", typedEmployees.length);

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
          const allCores = new Set<string>();
          
          coresData.forEach((coreData: any) => {
            const employeeId = String(coreData.employee_id);
            if (employeeId) {
              if (!employeesCoreMap[employeeId]) {
                employeesCoreMap[employeeId] = [];
              }
              if (coreData.core?.core_code) {
                const coreCode = coreData.core.core_code;
                employeesCoreMap[employeeId].push(coreCode);
                allCores.add(coreCode);
              }
            }
          });
          
          // Update core filter values
          setCoreFilterValues(Array.from(allCores).sort());
          
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
          const allSupports = new Set<string>();
          
          supportsData.forEach((supportData: any) => {
            const employeeId = String(supportData.employee_id);
            if (employeeId) {
              if (!employeesSupportsMap[employeeId]) {
                employeesSupportsMap[employeeId] = [];
              }
              if (supportData.support?.support_code) {
                const supportCode = supportData.support.support_code;
                employeesSupportsMap[employeeId].push(supportCode);
                allSupports.add(supportCode);
              }
            }
          });
          
          // Update support filter values
          setSupportFilterValues(Array.from(allSupports).sort());
          
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
            const employeeId = String(attendance.employee_id);
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

        // Get employee roster data using direct query
        console.log("Fetching roster data...");
        console.log("Using refreshKey:", refreshKey);
        
        const { data: rosterData, error: rosterError } = await supabase
          .from('roster_assignments')
          .select(`
            id,
            employee_id,
            date_references!inner(actual_date),
            roster_codes!inner(roster_code)
          `)
          .order('employee_id', { ascending: true })
          .order('date_references(actual_date)', { ascending: true });
        
        if (rosterError) {
          console.error("Error fetching roster data:", rosterError);
          toast.error(`Error fetching roster assignments: ${rosterError.message}`);
          setEmployees(typedEmployees);
          setFilteredEmployees(typedEmployees);
          setIsLoading(false);
          return;
        }

        console.log("Raw roster data:", rosterData);
        console.log("Total roster records fetched:", rosterData ? rosterData.length : 0);
        
        // Process employees with the roster data if available
        if (rosterData && rosterData.length > 0) {
          const scheduleMap: Record<string, Record<string, string>> = {};
          const dateStatusMap: Record<string, Set<string>> = {};
          
          // Process roster data to create a map of employee schedules
          rosterData.forEach((roster: any) => {
            // Convert numbers to strings for keys
            const employeeId = String(roster.employee_id);
            const date = new Date(roster.date_references.actual_date);
            const dateKey = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`;
            const status = roster.roster_codes.roster_code;
            
            if (!scheduleMap[employeeId]) {
              scheduleMap[employeeId] = {};
            }
            
            scheduleMap[employeeId][dateKey] = status;
            
            // Track unique statuses for each date
            if (!dateStatusMap[dateKey]) {
              dateStatusMap[dateKey] = new Set<string>();
            }
            dateStatusMap[dateKey].add(status);
          });
          
          // Convert status sets to arrays
          const processedDateStatusValues: Record<string, string[]> = {};
          Object.entries(dateStatusMap).forEach(([dateKey, statuses]) => {
            processedDateStatusValues[dateKey] = Array.from(statuses).sort();
          });
          setDateStatusValues(processedDateStatusValues);
          
          console.log("Processed schedule map:", scheduleMap);
          
          // Update employees with their schedules
          const employeesWithSchedule = typedEmployees.map(emp => {
            return {
              ...emp,
              schedule: scheduleMap[emp.id] || {}
            };
          });
          
          setEmployees(employeesWithSchedule);
          setFilteredEmployees(employeesWithSchedule);
        } else {
          console.log("No roster data returned or empty array");
          // If no roster data, create empty schedules
          const employeesWithEmptySchedule = typedEmployees.map(emp => {
            return {
              ...emp,
              schedule: {}
            };
          });
          
          setEmployees(employeesWithEmptySchedule);
          setFilteredEmployees(employeesWithEmptySchedule);
        }
      } catch (error: any) {
        toast.error(`Error loading employees: ${error.message}`);
        console.error("Error fetching employees:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [currentDate, refreshKey]); // Add refreshKey as a dependency

  // Apply filters to employees
  useEffect(() => {
    let result = [...employees];
    
    // Apply core filters
    if (activeCoreFilters.length > 0) {
      result = result.filter(emp => {
        if (!emp.cores || emp.cores.length === 0) return false;
        return emp.cores.some(core => activeCoreFilters.includes(core));
      });
    }
    
    // Apply support filters
    if (activeSupportFilters.length > 0) {
      result = result.filter(emp => {
        if (!emp.supports || emp.supports.length === 0) return false;
        return emp.supports.some(support => activeSupportFilters.includes(support));
      });
    }
    
    // Apply column filters
    Object.entries(columnFilters).forEach(([column, values]) => {
      if (values.length > 0) {
        result = result.filter(emp => {
          if (column === 'team') {
            return values.includes(emp.team?.team_name || '');
          }
          if (column === 'job_title') {
            return values.includes(emp.job_title?.job_description || '');
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
  }, [employees, activeCoreFilters, activeSupportFilters, columnFilters, dateColumnFilters]);

  // Handle scroll events
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      onScroll(scrollAreaRef.current.scrollLeft || 0);
    }
  };

  // Handle core filter selection
  const handleCoreFilterSelect = (value: string) => {
    setActiveCoreFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  // Handle support filter selection
  const handleSupportFilterSelect = (value: string) => {
    setActiveSupportFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  // Clear core filters
  const clearCoreFilters = () => {
    setActiveCoreFilters([]);
  };

  // Clear support filters
  const clearSupportFilters = () => {
    setActiveSupportFilters([]);
  };

  // Handle column filter changes
  const handleColumnFilterSelect = (column: string, value: string) => {
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
  
  // Clear column filter
  const clearColumnFilter = (column: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: []
    }));
  };

  // Handle date filter selection
  const handleDateFilterSelect = (dateKey: string, value: string) => {
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
  
  // Clear date filter
  const clearDateFilter = (dateKey: string) => {
    setDateColumnFilters(prev => ({
      ...prev,
      [dateKey]: []
    }));
  };

  // Cell click handler
  const handleCellClick = (employee: Employee, date: string) => {
    setSelectedEmployee(employee);
    setSelectedDate(date);
    setIsDetailOpen(true);
  };

  // Handle profile click - updated to also call the onEmployeeSelect callback
  const handleProfileClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedDate(null);
    // Call the external handler if it exists
    if (onEmployeeSelect) {
      onEmployeeSelect(employee);
    } else {
      setIsDetailOpen(true);
    }
  };

  // Get unique values for a column
  const getUniqueValuesForColumn = (columnName: string): string[] => {
    const values = employees.map(emp => {
      if (columnName === 'team') return emp.team?.team_name || '';
      if (columnName === 'job_title') return emp.job_title?.job_description || '';
      if (columnName === 'night_shift') {
        return emp.night_shift_ok ? 'Yes' : 'No';
      }
      return String(emp[columnName as keyof Employee] || '');
    }).filter(Boolean);
    
    return [...new Set(values)].sort();
  };

  // Status color mapping
  const statusColors: Record<string, string> = {
    "D": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "L": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "T": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "O": "status-day-off", // Using custom class for darker shade
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
    { status: "Day Off", code: "O", color: "bg-gray-600 border border-gray-700 text-white dark:bg-gray-700 dark:border-gray-800 dark:text-gray-200" },
    { status: "Overtime", code: "DO", color: "bg-yellow-100 border border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700" },
  ];

  // Add a function to check if core and support are different
  const hasDifferentCoreSupport = (employee: Employee) => {
    if (!employee.cores || !employee.supports) return false;
    if (employee.cores.length === 0 || employee.supports.length === 0) return false;
    
    // Check if there's any overlap between cores and supports
    const hasOverlap = employee.cores.some(core => employee.supports?.includes(core));
    
    // If there's no overlap and both have values, they're different
    return !hasOverlap && employee.cores.length > 0 && employee.supports.length > 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full border rounded-lg dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading employee schedule data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Status Legend */}
      <div className="flex items-center gap-4 mb-2 px-2 flex-wrap">
        {statusLegend.map((item) => (
          <div key={item.status} className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-1 ${item.color}`}></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{item.status} ({item.code})</span>
          </div>
        ))}
      </div>
      
      {/* Simple table with direct scrolling */}
      <div style={{ width: `${totalWidth}px`, minWidth: '100%' }}>
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {/* Fixed columns */}
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.id}px`, left: `${columnLeftPositions.id}px` }}>
                <div className="flex items-center justify-between">
                  <span>Emp#</span>
                  <ColumnFilter 
                    column="e_number" 
                    label="ID" 
                    values={getUniqueValuesForColumn('e_number')}
                    activeValues={columnFilters['e_number'] || []}
                    onValueSelect={(value) => handleColumnFilterSelect('e_number', value)}
                    onClearAll={() => clearColumnFilter('e_number')}
                  />
                </div>
              </th>
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.name}px`, left: `${columnLeftPositions.name}px` }}>
                <div className="flex items-center justify-between">
                  <span>Name</span>
                  <ColumnFilter 
                    column="name" 
                    label="Name" 
                    values={getUniqueValuesForColumn('name')}
                    activeValues={columnFilters['name'] || []}
                    onValueSelect={(value) => handleColumnFilterSelect('name', value)}
                    onClearAll={() => clearColumnFilter('name')}
                  />
                </div>
              </th>
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.alias}px`, left: `${columnLeftPositions.alias}px` }}>
                <div className="flex items-center justify-between">
                  <span>Alias</span>
                  <ColumnFilter 
                    column="key_name" 
                    label="Alias" 
                    values={getUniqueValuesForColumn('key_name')}
                    activeValues={columnFilters['key_name'] || []}
                    onValueSelect={(value) => handleColumnFilterSelect('key_name', value)}
                    onClearAll={() => clearColumnFilter('key_name')}
                  />
                </div>
              </th>
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.mobile}px`, left: `${columnLeftPositions.mobile}px` }}>
                <div className="flex items-center justify-between">
                  <span>Mobile</span>
                  <ColumnFilter 
                    column="mobile_number" 
                    label="Mobile" 
                    values={getUniqueValuesForColumn('mobile_number')}
                    activeValues={columnFilters['mobile_number'] || []}
                    onValueSelect={(value) => handleColumnFilterSelect('mobile_number', value)}
                    onClearAll={() => clearColumnFilter('mobile_number')}
                  />
                </div>
              </th>
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.team}px`, left: `${columnLeftPositions.team}px` }}>
                <div className="flex items-center justify-between">
                  <span>Team</span>
                  <ColumnFilter 
                    column="team" 
                    label="Team" 
                    values={getUniqueValuesForColumn('team')}
                    activeValues={columnFilters['team'] || []}
                    onValueSelect={(value) => handleColumnFilterSelect('team', value)}
                    onClearAll={() => clearColumnFilter('team')}
                  />
                </div>
              </th>
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.core}px`, left: `${columnLeftPositions.core}px` }}>
                <div className="flex items-center justify-between">
                  <span>Core</span>
                  <ColumnFilter 
                    column="core" 
                    label="Core" 
                    values={coreFilterValues}
                    activeValues={activeCoreFilters}
                    onValueSelect={handleCoreFilterSelect}
                    onClearAll={clearCoreFilters}
                  />
                </div>
              </th>
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.support}px`, left: `${columnLeftPositions.support}px` }}>
                <div className="flex items-center justify-between">
                  <span>Support</span>
                  <ColumnFilter 
                    column="support" 
                    label="Support" 
                    values={supportFilterValues}
                    activeValues={activeSupportFilters}
                    onValueSelect={handleSupportFilterSelect}
                    onClearAll={clearSupportFilters}
                  />
                </div>
              </th>
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.title}px`, left: `${columnLeftPositions.title}px` }}>
                <div className="flex items-center justify-between">
                  <span>Title</span>
                  <ColumnFilter 
                    column="job_title" 
                    label="Title" 
                    values={getUniqueValuesForColumn('job_title')}
                    activeValues={columnFilters['job_title'] || []}
                    onValueSelect={(value) => handleColumnFilterSelect('job_title', value)}
                    onClearAll={() => clearColumnFilter('job_title')}
                  />
                </div>
              </th>
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.night_shift}px`, left: `${columnLeftPositions.night_shift}px` }}>
                <div className="flex items-center justify-between">
                  <span>Night</span>
                  <ColumnFilter 
                    column="night_shift" 
                    label="Night Shift" 
                    values={getUniqueValuesForColumn('night_shift')}
                    activeValues={columnFilters['night_shift'] || []}
                    onValueSelect={(value) => handleColumnFilterSelect('night_shift', value)}
                    onClearAll={() => clearColumnFilter('night_shift')}
                  />
                </div>
              </th>
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.fte}px`, left: `${columnLeftPositions.fte}px` }}>
                <div className="flex items-center justify-between">
                  <span>FTE</span>
                  <ColumnFilter 
                    column="fte_date" 
                    label="FTE Date" 
                    values={getUniqueValuesForColumn('fte_date')}
                    activeValues={columnFilters['fte_date'] || []}
                    onValueSelect={(value) => handleColumnFilterSelect('fte_date', value)}
                    onClearAll={() => clearColumnFilter('fte_date')}
                  />
                </div>
              </th>
              <th className="p-2 text-left border-r sticky top-0 z-30 dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                style={{ width: `${columnWidths.ttl}px`, left: `${columnLeftPositions.ttl}px` }}>
                <div className="flex items-center justify-between">
                  <span>TTL</span>
                  <ColumnFilter 
                    column="ttl" 
                    label="Time to Location" 
                    values={getUniqueValuesForColumn('ttl')}
                    activeValues={columnFilters['ttl'] || []}
                    onValueSelect={(value) => handleColumnFilterSelect('ttl', value)}
                    onClearAll={() => clearColumnFilter('ttl')}
                  />
                </div>
              </th>
              
              {/* Calendar days */}
              {days.map((day) => {
                const dateKey = `${day.month+1}-${day.day}-${day.year}`;
                const dateStatuses = dateStatusValues[dateKey] || [];
                
                return (
                  <th 
                    key={dateKey}
                    className={cn(
                      "p-2 text-center border-r sticky top-0 z-10 dark:border-gray-700 dark:text-gray-200",
                      day.isWeekend ? 'weekend-shade' : '',
                      day.isToday ? 'today-highlight' : ''
                    )}
                    style={{ width: `${columnWidths.date}px` }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-medium">{day.day}</div>
                      <div className="text-xs">{day.monthName}</div>
                      <DateColumnFilter 
                        dateKey={dateKey}
                        values={dateStatuses}
                        activeValues={dateColumnFilters[dateKey] || []}
                        onValueSelect={(value) => handleDateFilterSelect(dateKey, value)}
                        onClearAll={() => clearDateFilter(dateKey)}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => {
              const isDifferent = hasDifferentCoreSupport(employee);
              
              return (
                <tr key={employee.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                  {/* Fixed columns */}
                  <td 
                    className={cn(
                      "p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900",
                      isDifferent ? 'core-support-different' : ''
                    )}
                    style={{ width: `${columnWidths.id}px`, left: `${columnLeftPositions.id}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.e_number || '-'}
                  </td>
                  <td 
                    className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                    style={{ width: `${columnWidths.name}px`, left: `${columnLeftPositions.name}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.name || '-'}
                  </td>
                  <td 
                    className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                    style={{ width: `${columnWidths.alias}px`, left: `${columnLeftPositions.alias}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.key_name || '-'}
                  </td>
                  <td 
                    className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                    style={{ width: `${columnWidths.mobile}px`, left: `${columnLeftPositions.mobile}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.mobile_number || '-'}
                  </td>
                  <td 
                    className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                    style={{ width: `${columnWidths.team}px`, left: `${columnLeftPositions.team}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.team?.team_name || '-'}
                  </td>
                  <td 
                    className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                    style={{ width: `${columnWidths.core}px`, left: `${columnLeftPositions.core}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.cores?.join(', ') || '-'}
                  </td>
                  <td 
                    className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                    style={{ width: `${columnWidths.support}px`, left: `${columnLeftPositions.support}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.supports?.join(', ') || '-'}
                  </td>
                  <td 
                    className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                    style={{ width: `${columnWidths.title}px`, left: `${columnLeftPositions.title}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.job_title?.job_description || '-'}
                  </td>
                  <td 
                    className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                    style={{ width: `${columnWidths.night_shift}px`, left: `${columnLeftPositions.night_shift}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.night_shift_ok ? 'Yes' : 'No'}
                  </td>
                  <td 
                    className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                    style={{ width: `${columnWidths.fte}px`, left: `${columnLeftPositions.fte}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.fte_date ? format(new Date(employee.fte_date), 'yyyy-MM-dd') : '-'}
                  </td>
                  <td 
                    className="p-2 border-r sticky z-10 cursor-pointer dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                    style={{ width: `${columnWidths.ttl}px`, left: `${columnLeftPositions.ttl}px` }}
                    onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                  >
                    {employee.ttl || '-'}
                  </td>
                  
                  {/* Calendar days with tooltips - Updated for no layout shift */}
                  {days.map((day) => {
                    const dateKey = `${day.month+1}-${day.day}-${day.year}`;
                    const status = employee.schedule?.[dateKey] || '';
                    const hasStatus = status !== '';
                    
                    return (
                      <TooltipProvider key={dateKey}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <td 
                              className={cn(
                                "p-2 text-center border-r cursor-pointer text-sm dark:border-gray-700",
                                day.isWeekend ? 'weekend-shade' : '',
                                hasStatus ? statusColors[status] || '' : '',
                                day.isToday ? 'today-highlight' : ''
                              )}
                              style={{ width: `${columnWidths.date}px`, position: 'Fixed' }}
                              onClick={() => onCellClick && onCellClick(employee, dateKey, status)}
                            >
                              {status}
                            </td>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="z-50 tooltip-fixed" sideOffset={5}>
                            <div className="space-y-1">
                              <p className="font-medium">{employee.name} ({employee.e_number || 'No ID'})</p>
                              <p>Date: {format(day.date, 'MMM dd, yyyy')}</p>
                              <div className="flex items-center gap-2">
                                <span>Status:</span> 
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs",
                                  status === 'D' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                                  status === 'AL' || status === 'L' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                                  status === 'TR' || status === 'T' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                  status === 'O' ? 'bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200' :
                                  status === 'B1' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                  status === 'SK' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                                  status === 'DO' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                )}>
                                  {status === 'D' && 'On Duty'}
                                  {status === 'AL' && 'Annual Leave'}
                                  {status === 'L' && 'On Leave'}
                                  {status === 'TR' || status === 'T' ? 'Training' : ''}
                                  {status === 'O' && 'Off Duty'}
                                  {status === 'B1' && 'Half Day'}
                                  {status === 'SK' && 'Sick Leave'}
                                  {status === 'DO' && 'Overtime'}
                                  {!status && 'Not Assigned'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">Click to edit</p>
                            </div>
                          </TooltipContent>
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

      {/* Employee Detail Sheet - only show this if onEmployeeSelect is not provided */}
      {!onEmployeeSelect && (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Employee {selectedDate ? 'Schedule' : 'Profile'} Detail</SheetTitle>
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
                            {selectedEmployee.schedule?.[selectedDate] === 'D' && 'On Duty'}
                            {selectedEmployee.schedule?.[selectedDate] === 'AL' && 'Annual Leave'}
                            {selectedEmployee.schedule?.[selectedDate] === 'L' && 'On Leave'}
                            {selectedEmployee.schedule?.[selectedDate] === 'TR' && 'Training'}
                            {selectedEmployee.schedule?.[selectedDate] === 'T' && 'Training'}
                            {selectedEmployee.schedule?.[selectedDate] === 'O' && 'Day Off'}
                            {selectedEmployee.schedule?.[selectedDate] === 'B1' && 'Half Day'}
                            {selectedEmployee.schedule?.[selectedDate] === 'SK' && 'Sick Leave'}
                            {selectedEmployee.schedule?.[selectedDate] === 'DO' && 'Overtime'}
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
      )}

      <style>
        {`
          .weekend-shade {
            background-color: rgba(107, 114, 128, 0.8);
            color: white;
          }
          .dark .weekend-shade {
            background-color: rgba(75, 85, 99, 0.9);
            color: rgba(229, 231, 235, 1);
          }
          .today-highlight {
            border: 2px solid #3b82f6;
          }
          .status-day-off {
            background-color: rgba(75, 85, 99, 0.9);
            color: white;
          }
          .dark .status-day-off {
            background-color: rgba(55, 65, 81, 1);
            color: rgba(229, 231, 235, 1);
          }
          .core-support-different {
            border-left: 4px solid #ef4444;
          }
          .tooltip-fixed {
            position: absolute !important; 
            pointer-events: none !important;
            z-index: 100 !important;
            transform-origin: var(--radix-tooltip-content-transform-origin) !important;
          }
          .popover-content {
            z-index: 100;
          }
          .fixed-tooltip {
            position: absolute !important; 
            pointer-events: none !important;
            z-index: 1000 !important;
            transform-origin: var(--radix-tooltip-content-transform-origin) !important;
          }
        `}
      </style>
    </div>
  );
});
