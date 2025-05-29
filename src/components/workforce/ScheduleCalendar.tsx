
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";

// Helper function to determine if a date is a weekend
const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Generate days from May 1, 2025 to June 30, 2025
const generateDays = () => {
  const days = [];
  const startDate = new Date(2025, 4, 1); // May 1, 2025
  const endDate = new Date(2025, 5, 30); // June 30, 2025
  
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push({
      day: currentDate.getDate(),
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      isWeekend: isWeekend(currentDate),
      fullDate: new Date(currentDate)
    });
    currentDate = addDays(currentDate, 1);
  }
  return days;
};

interface Employee {
  id: string;
  name: string;
  e_number: number;
  mobile_number: string;
  employee_status: string;
  night_shift_ok: string;
  fte_date: string;
  job_titles: { job_description: string; job_code: string } | null;
  teams: { team_name: string } | null;
  core: string;
  support: string;
  schedule: Record<string, string>;
}

interface ScheduleCalendarProps {
  onScroll: (scrollLeft: number) => void;
  selectedDate: Date;
  onEmployeeSelect?: (employee: any) => void;
}

export const ScheduleCalendar = ({ onScroll, selectedDate, onEmployeeSelect }: ScheduleCalendarProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [coreFilterValues, setCoreFilterValues] = useState<string[]>([]);
  const [supportFilterValues, setSupportFilterValues] = useState<string[]>([]);
  const [activeCoreFilters, setActiveCoreFilters] = useState<string[]>([]);
  const [activeSupportFilters, setActiveSupportFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const days = generateDays();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching employee data for date:', selectedDate);
        
        // Fetch employees
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select(`
            id,
            name,
            e_number,
            mobile_number,
            employee_status,
            night_shift_ok,
            fte_date,
            job_titles (job_description, job_code),
            teams (team_name)
          `)
          .eq('employee_status', 'Active')
          .order('e_number', { ascending: true });

        if (employeeError) {
          console.error('Error fetching employees:', employeeError);
          throw employeeError;
        }

        console.log('Fetched employees:', employeeData?.length || 0);

        // Fetch assignments for the selected date
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const { data: assignments, error: assignmentError } = await supabase
          .rpc('get_employee_project_assignments', { p_date: formattedDate });

        if (assignmentError) {
          console.error('Error fetching assignments:', assignmentError);
          throw assignmentError;
        }

        console.log('Fetched assignments for date:', formattedDate, assignments?.length || 0);

        // Create assignment lookup maps
        const coreAssignments = new Map();
        const supportAssignments = new Map();
        
        assignments?.forEach((assignment: any) => {
          if (assignment.assignment_type === 'CORE') {
            coreAssignments.set(assignment.employee_id.toString(), assignment.assignment_code);
          } else if (assignment.assignment_type === 'SUPPORT') {
            supportAssignments.set(assignment.employee_id.toString(), assignment.assignment_code);
          }
        });

        // Fetch roster assignments for all days in the range
        const { data: rosterData, error: rosterError } = await supabase
          .from('roster_assignments')
          .select(`
            id,
            date_id,
            employee_id,
            roster_id,
            date_references (actual_date),
            rosters (roster_name)
          `)
          .gte('date_references.actual_date', '2025-05-01')
          .lte('date_references.actual_date', '2025-06-30');

        if (rosterError) {
          console.error('Error fetching roster data:', rosterError);
        }

        // Create roster lookup map
        const rosterLookup = new Map();
        rosterData?.forEach((roster: any) => {
          const dateKey = roster.date_references?.actual_date;
          const employeeId = roster.employee_id.toString();
          if (dateKey && employeeId) {
            if (!rosterLookup.has(employeeId)) {
              rosterLookup.set(employeeId, new Map());
            }
            rosterLookup.get(employeeId).set(dateKey, roster.rosters?.roster_name || 'D');
          }
        });

        // Transform employee data
        const transformedEmployees: Employee[] = (employeeData || []).map(emp => {
          const coreAssignment = coreAssignments.get(emp.id.toString()) || 'AV';
          const supportAssignment = supportAssignments.get(emp.id.toString()) || 'AV';
          
          // Generate schedule data for all days
          const schedule: Record<string, string> = {};
          days.forEach(day => {
            const dateKey = format(day.fullDate, 'yyyy-MM-dd');
            const employeeRoster = rosterLookup.get(emp.id.toString());
            
            if (employeeRoster && employeeRoster.has(dateKey)) {
              schedule[dateKey] = employeeRoster.get(dateKey);
            } else {
              // Default schedule pattern
              const randomValue = Math.random();
              if (day.isWeekend) {
                schedule[dateKey] = randomValue < 0.7 ? "O" : "D";
              } else {
                if (randomValue < 0.1) {
                  schedule[dateKey] = "L"; // Leave
                } else if (randomValue < 0.15) {
                  schedule[dateKey] = "T"; // Training
                } else if (randomValue < 0.85) {
                  schedule[dateKey] = "D"; // Duty
                } else {
                  schedule[dateKey] = "O"; // Off
                }
              }
            }
          });
          
          return {
            id: emp.id.toString(),
            name: emp.name,
            e_number: emp.e_number,
            mobile_number: emp.mobile_number || '',
            employee_status: emp.employee_status,
            night_shift_ok: emp.night_shift_ok ? 'Yes' : 'No',
            fte_date: emp.fte_date || '',
            job_titles: emp.job_titles,
            teams: emp.teams,
            core: coreAssignment,
            support: supportAssignment,
            schedule
          };
        });

        // Extract unique core and support values for filters
        const cores = Array.from(new Set(transformedEmployees.map(emp => emp.core)));
        const supports = Array.from(new Set(transformedEmployees.map(emp => emp.support)));
        
        setCoreFilterValues(cores);
        setSupportFilterValues(supports);
        
        console.log('Setting transformed employee data:', transformedEmployees.length);
        setEmployees(transformedEmployees);
      } catch (error) {
        console.error('Error in fetchEmployeeData:', error);
        setEmployees([]);
        setCoreFilterValues([]);
        setSupportFilterValues([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
  }, [selectedDate]);

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
    // If no filters are active, show all
    if (activeCoreFilters.length === 0 && activeSupportFilters.length === 0) {
      return true;
    }
    
    // Apply core filter
    const passesCore = activeCoreFilters.length === 0 || activeCoreFilters.includes(employee.core);
    
    // Apply support filter
    const passesSupport = activeSupportFilters.length === 0 || activeSupportFilters.includes(employee.support);
    
    // Employee must pass all active filters
    return passesCore && passesSupport;
  });

  // Cell click handler
  const handleCellClick = (employeeId: string, date: string) => {
    console.log(`Clicked cell for employee ${employeeId} on date ${date}`);
  };

  // Employee click handler
  const handleEmployeeClick = (employee: Employee) => {
    console.log(`Clicked employee:`, employee);
    if (onEmployeeSelect) {
      onEmployeeSelect(employee);
    }
  };

  // Status color mapping
  const statusColors: Record<string, string> = {
    "D": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "L": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "T": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "O": "status-day-off",
  };

  const statusLegend = [
    { status: "Available", color: "bg-gray-100 border border-gray-300 dark:bg-gray-700 dark:border-gray-600" },
    { status: "Assigned", color: "bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700" },
    { status: "Training", color: "bg-purple-100 border border-purple-300 dark:bg-purple-900 dark:border-purple-700" },
    { status: "Leave", color: "bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700" },
    { status: "Off", color: "bg-gray-600 border border-gray-700 text-gray-100 dark:bg-gray-700 dark:border-gray-800 dark:text-gray-300" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full border rounded-lg dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading employee data for {format(selectedDate, 'PPP')}...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering calendar with', filteredEmployees.length, 'employees');

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
          <div className="min-w-[3000px]">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  {/* Fixed columns */}
                  <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">E#</th>
                  <th className="p-2 text-left border-r sticky left-[80px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Name</th>
                  <th className="p-2 text-left border-r sticky left-[280px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Mobile</th>
                  <th className="p-2 text-left border-r sticky left-[380px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Team</th>
                  <th className="p-2 text-left border-r sticky left-[480px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
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
                  <th className="p-2 text-left border-r sticky left-[580px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
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
                  <th className="p-2 text-left border-r sticky left-[680px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Title</th>
                  <th className="p-2 text-left border-r sticky left-[780px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">N/S</th>
                  <th className="p-2 text-left border-r sticky left-[840px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">FTE</th>
                  
                  {/* Calendar days */}
                  {days.map((day, index) => {
                    const monthName = day.month === 4 ? 'May' : 'Jun';
                    return (
                      <th 
                        key={`${day.year}-${day.month+1}-${day.day}`} 
                        className={`p-2 text-center border-r min-w-[40px] dark:border-gray-700 dark:text-gray-200 
                          ${day.isWeekend ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                      >
                        <div className="text-xs font-medium">{day.day}</div>
                        <div className="text-xs">{monthName}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    {/* Fixed columns */}
                    <td 
                      className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      {employee.e_number}
                    </td>
                    <td 
                      className="p-2 border-r sticky left-[80px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      {employee.name}
                    </td>
                    <td className="p-2 border-r sticky left-[280px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.mobile_number}</td>
                    <td className="p-2 border-r sticky left-[380px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.teams?.team_name || 'N/A'}</td>
                    <td className="p-2 border-r sticky left-[480px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.core}</td>
                    <td className="p-2 border-r sticky left-[580px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.support}</td>
                    <td className="p-2 border-r sticky left-[680px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.job_titles?.job_description || 'N/A'}</td>
                    <td className="p-2 border-r sticky left-[780px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.night_shift_ok}</td>
                    <td className="p-2 border-r sticky left-[840px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.fte_date ? 'Valid' : 'Pending'}</td>
                    
                    {days.map((day) => {
                      const dateKey = format(day.fullDate, 'yyyy-MM-dd');
                      const status = employee.schedule[dateKey];
                      
                      return (
                        <td 
                          key={dateKey}
                          className={`p-2 text-center border-r cursor-pointer text-sm dark:border-gray-700 relative
                            ${day.isWeekend ? 'weekend-shade' : ''} 
                            ${status ? statusColors[status] : ''}`}
                          onClick={() => handleCellClick(employee.id, dateKey)}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="w-full h-full flex items-center justify-center">
                                {status}
                              </TooltipTrigger>
                              <TooltipContent side="top" className="tooltip-content">
                                <div className="text-sm font-medium">{employee.name}</div>
                                <div className="text-xs">{format(day.fullDate, 'MMM d, yyyy')}</div>
                                {status === 'D' && <div className="text-green-600">On Duty</div>}
                                {status === 'L' && <div className="text-red-600">On Leave</div>}
                                {status === 'T' && <div className="text-purple-600">In Training</div>}
                                {status === 'O' && <div className="text-gray-600 font-semibold">Day Off</div>}
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
      
      <style>
        {`
        .status-day-off {
          background-color: #4b5563;
          color: #f3f4f6;
        }
        .weekend-shade {
          background-color: rgba(243, 244, 246, 0.2);
        }
        .tooltip-content {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          pointer-events: none;
        }
        `}
      </style>
    </div>
  );
};
