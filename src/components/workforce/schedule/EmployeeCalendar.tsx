
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";

// Helper function to determine if a date is a weekend
const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

interface EmployeeCalendarProps {
  onScroll: (scrollLeft: number) => void;
  currentDate: Date;
  onEmployeeSelect: (employee: any) => void;
  onCellClick: (employee: any, date: string, status: string) => void;
  refreshKey: number;
}

export const EmployeeCalendar = forwardRef<any, EmployeeCalendarProps>(({
  onScroll,
  currentDate,
  onEmployeeSelect,
  onCellClick,
  refreshKey
}, ref) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [coreFilterValues, setCoreFilterValues] = useState<string[]>([]);
  const [supportFilterValues, setSupportFilterValues] = useState<string[]>([]);
  const [activeCoreFilters, setActiveCoreFilters] = useState<string[]>([]);
  const [activeSupportFilters, setActiveSupportFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Generate days for the current month
  const generateDays = () => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      isWeekend: isWeekend(date),
      date: date
    }));
  };

  const days = generateDays();

  useImperativeHandle(ref, () => ({
    refreshData: fetchEmployeeData
  }));

  // Fetch employee data
  const fetchEmployeeData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching employee data...');
      
      // Fetch employees with their job titles and teams
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id,
          e_number,
          name,
          mobile_number,
          night_shift_ok,
          fte_date,
          is_active,
          job_titles!inner(job_code, job_description),
          teams(team_name)
        `)
        .eq('is_active', true)
        .order('e_number');

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }

      console.log('Fetched employees:', employeesData?.length);

      // Process employees with their schedule data
      const processedEmployees = await Promise.all(
        (employeesData || []).map(async (emp: any) => {
          const schedule: Record<string, string> = {};

          // Fetch roster assignments for this employee for the current month
          const startDate = startOfMonth(currentDate);
          const endDate = endOfMonth(currentDate);
          
          const { data: rosterData, error: rosterError } = await supabase
            .from('roster_assignments')
            .select(`
              date_references(actual_date),
              roster_codes(roster_code)
            `)
            .eq('employee_id', emp.id)
            .gte('date_references.actual_date', format(startDate, 'yyyy-MM-dd'))
            .lte('date_references.actual_date', format(endDate, 'yyyy-MM-dd'));

          if (!rosterError && rosterData) {
            rosterData.forEach((roster: any) => {
              if (roster.date_references?.actual_date && roster.roster_codes?.roster_code) {
                const date = new Date(roster.date_references.actual_date);
                const dateKey = `${date.getMonth() + 1}-${date.getDate()}`;
                schedule[dateKey] = roster.roster_codes.roster_code;
              }
            });
          }

          // Fetch core and support assignments for current date
          const today = new Date();
          const todayKey = format(today, 'yyyy-MM-dd');
          
          const { data: coreData } = await supabase
            .from('employee_cores')
            .select('core_codes(core_code)')
            .eq('employee_id', emp.id)
            .eq('assignment_date', todayKey)
            .limit(1);

          const { data: supportData } = await supabase
            .from('employee_supports')
            .select('support_codes(support_code)')
            .eq('employee_id', emp.id)
            .eq('assignment_date', todayKey)
            .limit(1);

          return {
            id: emp.id,
            e_number: emp.e_number,
            name: emp.name,
            alias: emp.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            mobile: emp.mobile_number || 'N/A',
            team: emp.teams?.team_name || 'No Team',
            core: coreData?.[0]?.core_codes?.core_code || 'AV',
            support: supportData?.[0]?.support_codes?.support_code || 'Available',
            title: emp.job_titles?.job_description || 'Unknown',
            night_shift: emp.night_shift_ok ? 'Yes' : 'No',
            fte: emp.fte_date ? 'Valid' : 'Pending',
            ttl: null, // Will be populated based on attendance data
            schedule
          };
        })
      );

      // Fetch today's attendance data to populate TTL
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('employee_id, check_in_time')
        .eq('date', today);

      // Create a map of employee attendance
      const attendanceMap = new Map();
      if (attendanceData) {
        attendanceData.forEach((att: any) => {
          if (att.check_in_time) {
            const checkInTime = new Date(att.check_in_time);
            const timeString = format(checkInTime, 'HH:mm');
            attendanceMap.set(att.employee_id, timeString);
          }
        });
      }

      // Update employees with TTL data
      const employeesWithTTL = processedEmployees.map(emp => ({
        ...emp,
        ttl: attendanceMap.get(emp.id) || 'No Show'
      }));

      // Extract unique values for filters
      const cores = Array.from(new Set(employeesWithTTL.map(emp => emp.core)));
      const supports = Array.from(new Set(employeesWithTTL.map(emp => emp.support)));
      
      setCoreFilterValues(cores);
      setSupportFilterValues(supports);
      setEmployees(employeesWithTTL);
      
      console.log('Processed employees with TTL:', employeesWithTTL.length);
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [currentDate, refreshKey]);

  // Handle scroll events
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      onScroll(scrollAreaRef.current.scrollLeft);
    }
  };

  // Filter handling functions
  const handleCoreFilterSelect = (value: string) => {
    setActiveCoreFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleSupportFilterSelect = (value: string) => {
    setActiveSupportFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  // Apply filters to employees
  const filteredEmployees = employees.filter(employee => {
    if (activeCoreFilters.length === 0 && activeSupportFilters.length === 0) {
      return true;
    }
    
    const passesCore = activeCoreFilters.length === 0 || activeCoreFilters.includes(employee.core);
    const passesSupport = activeSupportFilters.length === 0 || activeSupportFilters.includes(employee.support);
    
    return passesCore && passesSupport;
  });

  // Status color mapping
  const statusColors: Record<string, string> = {
    "D": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "AL": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "L": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "TR": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "T": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "O": "bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200",
    "B1": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "SK": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    "DO": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  };

  // Status legend
  const statusLegend = [
    { status: "On Duty", color: "bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700" },
    { status: "Half Day", color: "bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:border-blue-700" },
    { status: "Training", color: "bg-purple-100 border border-purple-300 dark:bg-purple-900 dark:border-purple-700" },
    { status: "Leave", color: "bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700" },
    { status: "Off", color: "bg-gray-600 border border-gray-700 text-gray-100 dark:bg-gray-700 dark:border-gray-800 dark:text-gray-300" },
    { status: "Overtime", color: "bg-yellow-100 border border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700" },
    { status: "Sick", color: "bg-orange-100 border border-orange-300 dark:bg-orange-900 dark:border-orange-700" },
  ];

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
      <div className="flex items-center gap-4 mb-2">
        {statusLegend.map((item) => (
          <div key={item.status} className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-1 ${item.color}`}></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{item.status}</span>
          </div>
        ))}
      </div>
      
      <div className="border rounded-lg dark:border-gray-700">
        <ScrollArea 
          className="relative overflow-auto h-[400px] rounded-lg"
          ref={scrollAreaRef}
          onScroll={handleScroll}
        >
          <div className="min-w-[2000px]">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">ID</th>
                  <th className="p-2 text-left border-r sticky left-[80px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Name</th>
                  <th className="p-2 text-left border-r sticky left-[280px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Alias</th>
                  <th className="p-2 text-left border-r sticky left-[350px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Mobile</th>
                  <th className="p-2 text-left border-r sticky left-[480px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Team</th>
                  <th className="p-2 text-left border-r sticky left-[580px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                    <div className="flex items-center justify-between">
                      Core
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-6 w-6", 
                              activeCoreFilters.length > 0 && "text-primary"
                            )}
                          >
                            <Filter className={cn(
                              "h-3 w-3",
                              activeCoreFilters.length > 0 && "text-primary fill-primary"
                            )} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40">
                          <div className="space-y-2">
                            {coreFilterValues.map((value) => (
                              <div 
                                key={value} 
                                className={cn(
                                  "px-2 py-1 text-sm hover:bg-muted cursor-pointer flex items-center gap-2",
                                  activeCoreFilters.includes(value) ? "bg-primary/10" : ""
                                )}
                                onClick={() => handleCoreFilterSelect(value)}
                              >
                                {activeCoreFilters.includes(value) ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <div className="w-4" />
                                )}
                                <span>{value}</span>
                              </div>
                            ))}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => setActiveCoreFilters([])}
                            >
                              Clear Filters
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                  <th className="p-2 text-left border-r sticky left-[680px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                    <div className="flex items-center justify-between">
                      Support
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-6 w-6", 
                              activeSupportFilters.length > 0 && "text-primary"
                            )}
                          >
                            <Filter className={cn(
                              "h-3 w-3",
                              activeSupportFilters.length > 0 && "text-primary fill-primary"
                            )} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40">
                          <div className="space-y-2">
                            {supportFilterValues.map((value) => (
                              <div 
                                key={value} 
                                className={cn(
                                  "px-2 py-1 text-sm hover:bg-muted cursor-pointer flex items-center gap-2",
                                  activeSupportFilters.includes(value) ? "bg-primary/10" : ""
                                )}
                                onClick={() => handleSupportFilterSelect(value)}
                              >
                                {activeSupportFilters.includes(value) ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <div className="w-4" />
                                )}
                                <span>{value}</span>
                              </div>
                            ))}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => setActiveSupportFilters([])}
                            >
                              Clear Filters
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                  <th className="p-2 text-left border-r sticky left-[780px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Title</th>
                  <th className="p-2 text-left border-r sticky left-[860px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">N/S</th>
                  <th className="p-2 text-left border-r sticky left-[920px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">FTE</th>
                  <th className="p-2 text-left border-r sticky left-[980px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">TTL</th>
                  
                  {/* Calendar days */}
                  {days.map((day, index) => (
                    <th 
                      key={`${day.year}-${day.month+1}-${day.day}`} 
                      className={`p-2 text-center border-r min-w-[40px] dark:border-gray-700 dark:text-gray-200 
                        ${day.isWeekend ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                    >
                      <div className="text-xs font-medium">{day.day}</div>
                      <div className="text-xs">{format(day.date, 'MMM')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    <td 
                      className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      onClick={() => onEmployeeSelect(employee)}
                    >
                      {employee.e_number}
                    </td>
                    <td 
                      className="p-2 border-r sticky left-[80px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      onClick={() => onEmployeeSelect(employee)}
                    >
                      {employee.name}
                    </td>
                    <td className="p-2 border-r sticky left-[280px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.alias}</td>
                    <td className="p-2 border-r sticky left-[350px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.mobile}</td>
                    <td className="p-2 border-r sticky left-[480px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.team}</td>
                    <td className="p-2 border-r sticky left-[580px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.core}</td>
                    <td className="p-2 border-r sticky left-[680px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.support}</td>
                    <td className="p-2 border-r sticky left-[780px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.title}</td>
                    <td className="p-2 border-r sticky left-[860px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.night_shift}</td>
                    <td className="p-2 border-r sticky left-[920px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.fte}</td>
                    <td className={`p-2 border-r sticky left-[980px] bg-white dark:bg-gray-900 dark:border-gray-700 z-10 ${
                      employee.ttl === 'No Show' 
                        ? 'text-red-600 font-semibold dark:text-red-400' 
                        : 'dark:text-gray-300'
                    }`}>
                      {employee.ttl}
                    </td>
                    
                    {/* Calendar days */}
                    {days.map((day) => {
                      const dateKey = `${day.month+1}-${day.day}`;
                      const status = employee.schedule[dateKey];
                      
                      return (
                        <td 
                          key={dateKey}
                          className={`p-2 text-center border-r cursor-pointer text-sm dark:border-gray-700 relative
                            ${day.isWeekend ? 'bg-gray-50 dark:bg-gray-800' : ''} 
                            ${status ? statusColors[status] : ''}`}
                          onClick={() => onCellClick(employee, dateKey, status)}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="w-full h-full flex items-center justify-center">
                                {status}
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <div className="text-sm font-medium">{employee.name}</div>
                                <div className="text-xs">{format(day.date, 'dd MMM yyyy')}</div>
                                {status === 'D' && <div className="text-green-600">On Duty</div>}
                                {status === 'AL' && <div className="text-red-600">Annual Leave</div>}
                                {status === 'L' && <div className="text-red-600">On Leave</div>}
                                {status === 'TR' || status === 'T' ? <div className="text-purple-600">Training</div> : ''}
                                {status === 'O' && <div className="text-gray-600 font-semibold">Day Off</div>}
                                {status === 'B1' && <div className="text-blue-600">Half Day</div>}
                                {status === 'SK' && <div className="text-orange-600">Sick Leave</div>}
                                {status === 'DO' && <div className="text-yellow-600">Overtime</div>}
                                {!status && <div className="text-gray-600">Not Assigned</div>}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});

EmployeeCalendar.displayName = "EmployeeCalendar";
