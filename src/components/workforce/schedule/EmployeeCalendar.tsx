
import { useState, useRef, useEffect, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isToday } from 'date-fns';

// Define interfaces for better type safety
interface EmployeeRoster {
  id: string;
  employee_id: string;
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
    const statuses = employees.map(emp => emp.schedule?.[dateKey] || 'O');
    return [...new Set(statuses)].sort();
  };

  useEffect(() => {
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

        try {
          // Get employee roster data using RPC function
          const { data, error } = await supabase.rpc('get_employee_roster');
          
          if (error) {
            console.error("Error fetching roster data:", error);
            throw error;
          }

          // Process employees with the roster data
          if (data && data.length > 0) {
            const employeesWithSchedule = typedEmployees.map(emp => {
              const schedule: Record<string, string> = {};
              
              // Initialize all days with default 'O' (Off)
              days.forEach(day => {
                const dateKey = `${day.month+1}-${day.day}-${day.year}`;
                schedule[dateKey] = "O";
              });
              
              // Update with actual roster data
              data.forEach((roster: EmployeeRoster) => {
                if (roster.employee_id === emp.id) {
                  if (roster.date) {
                    const rosterDate = new Date(roster.date);
                    const dateKey = `${rosterDate.getMonth()+1}-${rosterDate.getDate()}-${rosterDate.getFullYear()}`;
                    schedule[dateKey] = roster.status_code || "D";
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
            setLoading(false);
            return;
          } else {
            throw new Error("No roster data found");
          }
        } catch (rosterError) {
          console.log("Fallback to local roster data generation");
          
          // Fallback: Create dummy roster data locally
          const processedEmployees = typedEmployees.map(emp => {
            // Initialize empty schedule
            const schedule: Record<string, string> = {};
            
            // Populate with default "O" (Off) for all days
            days.forEach(day => {
              const dateKey = `${day.month+1}-${day.day}-${day.year}`;
              // Generate random status for demo purposes
              const rand = Math.random();
              let status = 'O'; // Default to Off
              if (rand < 0.6) status = 'D'; // 60% Duty
              else if (rand < 0.7) status = 'L'; // 10% Leave
              else if (rand < 0.8) status = 'T'; // 10% Training
              
              schedule[dateKey] = status;
            });
            
            return {
              ...emp,
              schedule
            };
          });
          
          setEmployees(processedEmployees);
          setFilteredEmployees(processedEmployees);
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
  
  // Filter unique values from a column
  const getUniqueValuesForColumn = (columnName: string) => {
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
        return emp.night_shift_ok ? 'Yes' : 'No';
      }
      return emp[columnName as keyof Employee]?.toString() || '';
    }).filter(Boolean);
    
    return [...new Set(values)].sort();
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
          const status = emp.schedule?.[dateKey] || 'O';
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
  };

  // Legend for status colors
  const statusLegend = [
    { status: "On Duty", code: "D", color: "bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700" },
    { status: "On Leave", code: "L", color: "bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700" },
    { status: "Training", code: "T", color: "bg-purple-100 border border-purple-300 dark:bg-purple-900 dark:border-purple-700" },
    { status: "Day Off", code: "O", color: "bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-600" },
  ];

  // Column filter component
  const ColumnFilter = ({ column, label }: { column: string, label: string }) => {
    const uniqueValues = useMemo(() => getUniqueValuesForColumn(column), [column]);
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
        <PopoverContent className="w-60 p-0">
          <div className="p-2 border-b">
            <div className="flex items-center justify-between">
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
                No values to filter
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
              <div key={value} className="flex items-center space-x-2 py-1">
                <button
                  className="flex items-center w-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded text-left"
                  onClick={() => handleDateFilterChange(dateKey, value)}
                >
                  <div className={`w-3 h-3 border rounded mr-1 flex items-center justify-center ${
                    selectedValues.includes(value) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedValues.includes(value) && (
                      <Check className="h-2 w-2 text-white" />
                    )}
                  </div>
                  <span className="flex-grow truncate text-xs">
                    {value === "D" && "On Duty"}
                    {value === "L" && "Leave"}
                    {value === "T" && "Training"}
                    {value === "O" && "Off"}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[80vh]">
      {/* Status Legend */}
      <div className="flex items-center gap-4 mb-2">
        {statusLegend.map((item) => (
          <div key={item.status} className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-1 ${item.color}`}></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{item.status} ({item.code})</span>
          </div>
        ))}
      </div>
      
      <div className="border rounded-lg shadow-sm dark:border-gray-700 h-full">
        <ScrollArea className="relative h-full rounded-lg">
          <div className="min-w-full" style={{ width: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + 
            columnWidths.team + columnWidths.core + columnWidths.support + columnWidths.title + columnWidths.night_shift + columnWidths.fte + 
            columnWidths.ttl + (days.length * columnWidths.date)}px` }}>
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  {/* Fixed columns */}
                  <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" style={{ width: `${columnWidths.id}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Emp#</span>
                      <ColumnFilter column="e_number" label="ID" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`} style={{ width: `${columnWidths.name}px`, left: `${columnWidths.id}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Name</span>
                      <ColumnFilter column="name" label="Name" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`} style={{ width: `${columnWidths.alias}px`, left: `${columnWidths.id + columnWidths.name}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Alias</span>
                      <ColumnFilter column="key_name" label="Alias" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`} style={{ width: `${columnWidths.mobile}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias}px` }}>
                    <span>Mobile</span>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`} style={{ width: `${columnWidths.team}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Team</span>
                      <ColumnFilter column="team" label="Team" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`} style={{ width: `${columnWidths.core}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Core</span>
                      <ColumnFilter column="core" label="Core" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`} style={{ width: `${columnWidths.support}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Support</span>
                      <ColumnFilter column="support" label="Support" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`} style={{ width: `${columnWidths.title}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Title</span>
                      <ColumnFilter column="job_title" label="Title" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`} style={{ width: `${columnWidths.night_shift}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support + columnWidths.title}px` }}>
                    <div className="flex items-center justify-between">
                      <span>N/S</span>
                      <ColumnFilter column="night_shift" label="Night Shift" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`} style={{ width: `${columnWidths.fte}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support + columnWidths.title + columnWidths.night_shift}px` }}>
                    <span>FTE</span>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`} style={{ width: `${columnWidths.ttl}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support + columnWidths.title + columnWidths.night_shift + columnWidths.fte}px` }}>
                    <span>TTL</span>
                  </th>
                  
                  {/* Calendar days */}
                  {days.map((day, index) => (
                    <th 
                      key={`${day.month+1}-${day.day}-${day.year}`} 
                      className={`p-2 text-center border-r min-w-[${columnWidths.date}px] dark:border-gray-700 dark:text-gray-200 
                        ${day.isWeekend ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
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
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    {/* Fixed columns */}
                    <td 
                      className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      style={{ width: `${columnWidths.id}px` }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.e_number || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer`}
                      style={{ width: `${columnWidths.name}px`, left: `${columnWidths.id}px` }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.name || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10`}
                      style={{ width: `${columnWidths.alias}px`, left: `${columnWidths.id + columnWidths.name}px` }}
                    >
                      {employee.key_name || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10`}
                      style={{ width: `${columnWidths.mobile}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias}px` }}
                    >
                      {employee.mobile_number || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10`}
                      style={{ width: `${columnWidths.team}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile}px` }}
                    >
                      {employee.team?.team_name || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10`}
                      style={{ width: `${columnWidths.core}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team}px` }}
                    >
                      {employee.cores?.join(', ') || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10`}
                      style={{ width: `${columnWidths.support}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core}px` }}
                    >
                      {employee.supports?.join(', ') || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10`}
                      style={{ width: `${columnWidths.title}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support}px` }}
                    >
                      {employee.job_title?.job_description || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10`}
                      style={{ width: `${columnWidths.night_shift}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support + columnWidths.title}px` }}
                    >
                      {employee.night_shift_ok ? 'Yes' : 'No'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10`}
                      style={{ width: `${columnWidths.fte}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support + columnWidths.title + columnWidths.night_shift}px` }}
                    >
                      {employee.fte_date ? format(new Date(employee.fte_date), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10`}
                      style={{ width: `${columnWidths.ttl}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support + columnWidths.title + columnWidths.night_shift + columnWidths.fte}px` }}
                    >
                      {employee.ttl || '-'}
                    </td>
                    
                    {/* Calendar days */}
                    {days.map((day) => {
                      const dateKey = `${day.month+1}-${day.day}-${day.year}`;
                      const status = employee.schedule?.[dateKey] || 'O';
                      
                      return (
                        <TooltipProvider key={dateKey}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <td 
                                className={`p-2 text-center border-r cursor-pointer text-sm dark:border-gray-700
                                  ${day.isWeekend ? 'weekend-shade' : ''} 
                                  ${status ? statusColors[status] : ''}
                                  ${day.isToday ? 'today-highlight' : ''}`}
                                style={{ width: `${columnWidths.date}px` }}
                                onClick={() => handleCellClick(employee, dateKey)}
                              >
                                {status}
                              </td>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm font-medium">{employee.name}</div>
                              <div className="text-xs">{format(day.date, 'MMMM d, yyyy')}</div>
                              {status === 'D' && <div className="text-green-600">On Duty</div>}
                              {status === 'L' && <div className="text-red-600">On Leave</div>}
                              {status === 'T' && <div className="text-purple-600">In Training</div>}
                              {status === 'O' && <div className="text-gray-600">Day Off</div>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </tr>
                ))}
                
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
        </ScrollArea>
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
                  </dl>
                </div>

                {selectedDate && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Schedule for {selectedDate}</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <p className="font-medium dark:text-gray-200">
                          {selectedEmployee.schedule?.[selectedDate] === 'D' && 'On Duty'}
                          {selectedEmployee.schedule?.[selectedDate] === 'L' && 'On Leave'}
                          {selectedEmployee.schedule?.[selectedDate] === 'T' && 'Training'}
                          {selectedEmployee.schedule?.[selectedDate] === 'O' && 'Day Off'}
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
