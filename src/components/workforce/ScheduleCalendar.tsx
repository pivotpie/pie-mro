import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Helper function to determine if a date is a weekend
const isWeekend = (dayOfMonth: number, month: number) => {
  const date = new Date(2025, month, dayOfMonth);
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Generate days for May 2025
const generateDays = () => {
  const days = [];
  // May 2025 has 31 days
  for (let i = 1; i <= 31; i++) {
    days.push({ day: i, month: 4, isWeekend: isWeekend(i, 4) }); // Month is 0-indexed, so May is 4
  }
  return days;
};

interface ScheduleCalendarProps {
  onScroll: (scrollLeft: number) => void;
  selectedDate: Date;
  onEmployeeSelect?: (employee: any) => void;
}

export const ScheduleCalendar = ({ onScroll, selectedDate, onEmployeeSelect }: ScheduleCalendarProps) => {
  const [columns, setColumns] = useState<{
    id: string;
    name: string;
    alias: string;
    mobile: string;
    team: string;
    core: string;
    support: string;
    title: string;
    night_shift: string;
    fte: string;
    ttl: string;
    e_number: number;
    schedule: Record<string, string>;
  }[]>([]);

  const [coreFilterValues, setCoreFilterValues] = useState<string[]>([]);
  const [supportFilterValues, setSupportFilterValues] = useState<string[]>([]);
  const [activeCoreFilters, setActiveCoreFilters] = useState<string[]>([]);
  const [activeSupportFilters, setActiveSupportFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const days = generateDays();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchEmployeeData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching employee data for date:', selectedDate);
        
        // Fetch all active employees first
        const { data: employees, error: employeeError } = await supabase
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
          .order('e_number');

        if (employeeError) {
          console.error('Error fetching employees:', employeeError);
          throw employeeError;
        }

        console.log('Fetched employees:', employees?.length || 0);

        // Fetch core and support assignments for the selected date
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
            coreAssignments.set(assignment.employee_id, assignment.assignment_code);
          } else if (assignment.assignment_type === 'SUPPORT') {
            supportAssignments.set(assignment.employee_id, assignment.assignment_code);
          }
        });

        console.log('Core assignments:', coreAssignments.size);
        console.log('Support assignments:', supportAssignments.size);

        // Process employees with assignments
        const employeesWithAssignments = employees?.map(emp => {
          const coreAssignment = coreAssignments.get(emp.id) || 'Available';
          const supportAssignment = supportAssignments.get(emp.id) || 'Available';
          
          const schedule: Record<string, string> = {};
          days.forEach(day => {
            const randomValue = Math.random();
            const dateKey = `${day.month+1}-${day.day}`;
            
            if (randomValue < 0.1) {
              schedule[dateKey] = "L"; // Leave
            } else if (randomValue < 0.2) {
              schedule[dateKey] = "T"; // Training
            } else if (randomValue < 0.8) {
              schedule[dateKey] = "D"; // Duty
            } else {
              schedule[dateKey] = "O"; // Off
            }
          });
          
          return {
            id: emp.id.toString(),
            name: emp.name || 'Unknown',
            alias: emp.name?.substring(0, 2).toUpperCase() || 'NA',
            mobile: emp.mobile_number || 'N/A',
            team: emp.teams?.team_name || 'Unassigned',
            core: coreAssignment as string,
            support: supportAssignment as string,
            title: emp.job_titles?.job_description || 'Employee',
            night_shift: emp.night_shift_ok ? 'Yes' : 'No',
            fte: emp.fte_date ? 'Valid' : 'Pending',
            ttl: 'N/A',
            e_number: emp.e_number || 0,
            schedule
          };
        }) || [];

        console.log('Processed employees with assignments:', employeesWithAssignments.length);

        // Extract unique core and support values for filters
        const cores = Array.from(new Set(employeesWithAssignments.map(emp => emp.core)));
        const supports = Array.from(new Set(employeesWithAssignments.map(emp => emp.support)));
        
        setCoreFilterValues(cores);
        setSupportFilterValues(supports);
        
        // Sort employees by e_number
        const sortedEmployees = employeesWithAssignments.sort((a, b) => a.e_number - b.e_number);
        
        console.log('Setting final employee data:', sortedEmployees.length);
        setColumns(sortedEmployees);
      } catch (error) {
        console.error('Error in fetchEmployeeData:', error);
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

  // Apply filters to columns
  const filteredColumns = columns.filter(column => {
    // If no filters are active, show all
    if (activeCoreFilters.length === 0 && activeSupportFilters.length === 0) {
      return true;
    }
    
    // Apply core filter
    const passesCore = activeCoreFilters.length === 0 || activeCoreFilters.includes(column.core);
    
    // Apply support filter
    const passesSupport = activeSupportFilters.length === 0 || activeSupportFilters.includes(column.support);
    
    // Item must pass all active filters
    return passesCore && passesSupport;
  });

  // Cell click handler
  const handleCellClick = (employeeId: string, date: string) => {
    console.log(`Clicked cell for employee ${employeeId} on date ${date}`);
  };

  // Employee click handler
  const handleEmployeeClick = (employee: any) => {
    console.log(`Clicked employee:`, employee);
    if (onEmployeeSelect) {
      onEmployeeSelect(employee);
    }
  };

  // Status color mapping - Updated with darker shade for O
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

  const handleFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: [...(prev[column] || []), value]
    }));
  };

  const clearFilter = (column: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full border rounded-lg dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading employee schedule data for {format(selectedDate, 'PPP')}...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering calendar with', filteredColumns.length, 'employees');

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
                  {/* Fixed columns */}
                  <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">ID</th>
                  <th className="p-2 text-left border-r sticky left-[80px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Name</th>
                  <th className="p-2 text-left border-r sticky left-[280px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Alias</th>
                  <th className="p-2 text-left border-r sticky left-[350px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Mobile</th>
                  <th className="p-2 text-left border-r sticky left-[480px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                    <div className="flex items-center justify-between">
                      Team
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Filter className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40">
                          <div className="space-y-2">
                            {Array.from(new Set(columns.map(col => col.team))).map((value) => (
                              <Button 
                                key={value} 
                                variant="ghost" 
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => handleFilter("team", value)}
                              >
                                {value}
                              </Button>
                            ))}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => clearFilter("team")}
                            >
                              Clear Filter
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
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
                      key={`${day.month+1}-${day.day}`} 
                      className={`p-2 text-center border-r min-w-[40px] dark:border-gray-700 dark:text-gray-200 
                        ${day.isWeekend ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                    >
                      <div className="text-xs font-medium">{index + 1}</div>
                      <div className="text-xs">May</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredColumns.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    {/* Fixed columns */}
                    <td 
                      className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      {employee.id}
                    </td>
                    <td 
                      className="p-2 border-r sticky left-[80px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      onClick={() => handleEmployeeClick(employee)}
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
                    <td className="p-2 border-r sticky left-[980px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.ttl}</td>
                    
                    {days.map((day) => {
                      const dateKey = `${day.month+1}-${day.day}`;
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
                                <div className="text-xs">May {day.day}, 2025</div>
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
