
import { useState, useRef, useEffect, useMemo, createRef, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { generateDaysForMonths, statusColors, statusLegend, getFormattedDate, isWeekend } from './calendarUtils';

export const EmployeeCalendar = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [filterOpen, setFilterOpen] = useState<Record<string, boolean>>({});
  
  // Generate days for May and June 2025
  const days = useMemo(() => generateDaysForMonths(4, 5), []); // 4 = May, 5 = June
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const columnWidths = {
    id: 80,
    name: 200,
    alias: 70,
    mobile: 130,
    team: 100,
    title: 100,
    status: 100,
    date: 45 // Width of each date column
  };

  // This function will be used by the parent to sync scrolling with the aircraft calendar
  const syncScroll = useCallback((scrollLeft: number) => {
    if (scrollAreaRef.current && scrollAreaRef.current.scrollLeft !== scrollLeft) {
      scrollAreaRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  // Handle scroll events
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      // This would be used by the parent component to sync scrolling with other calendars
      const scrollEvent = new CustomEvent('employee-calendar-scroll', { 
        detail: { scrollLeft: scrollAreaRef.current.scrollLeft } 
      });
      window.dispatchEvent(scrollEvent);
    }
  };

  // Setup scroll event listeners
  useEffect(() => {
    const handleAircraftScroll = (e: CustomEvent) => {
      syncScroll(e.detail.scrollLeft);
    };

    // Add event listener for the custom event
    window.addEventListener('aircraft-calendar-scroll', handleAircraftScroll as EventListener);

    return () => {
      window.removeEventListener('aircraft-calendar-scroll', handleAircraftScroll as EventListener);
    };
  }, [syncScroll]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('employees')
          .select(`
            *,
            job_title:job_title_id(job_code, job_description),
            team:team_id(team_name)
          `)
          .limit(10);
        
        if (error) {
          throw error;
        }

        // Process employees with schedule data
        const processedEmployees = data.map(emp => {
          // Generate random schedule data for demonstration
          const schedule: Record<string, string> = {};
          days.forEach(day => {
            const dateKey = `${day.month+1}-${day.day}`;
            const randomValue = Math.random();
            
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
            ...emp,
            alias: emp.name?.split(' ').map((n: string) => n[0]).join('') || '',
            schedule
          };
        });

        setEmployees(processedEmployees);
        setFilteredEmployees(processedEmployees);
      } catch (error: any) {
        toast.error(`Error loading employees: ${error.message}`);
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [days]);
  
  // Filter unique values from a column
  const getUniqueValuesForColumn = (columnName: string) => {
    const values = employees.map(emp => {
      if (columnName === 'team') return emp.team?.team_name;
      if (columnName === 'job_title') return emp.job_title?.job_description;
      return emp[columnName];
    }).filter(Boolean);
    
    return [...new Set(values)].sort();
  };

  // Apply filters to employees
  useEffect(() => {
    let result = [...employees];
    
    Object.entries(columnFilters).forEach(([column, values]) => {
      if (values.length > 0) {
        result = result.filter(emp => {
          if (column === 'team') {
            return values.includes(emp.team?.team_name);
          }
          if (column === 'job_title') {
            return values.includes(emp.job_title?.job_description);
          }
          return values.includes(emp[column]);
        });
      }
    });
    
    setFilteredEmployees(result);
  }, [columnFilters, employees]);

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

  // Clear filters for a column
  const clearColumnFilter = (column: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: []
    }));
  };

  // Cell click handler
  const handleCellClick = (employee: any, date: string) => {
    setSelectedEmployee(employee);
    setSelectedDate(date);
    setIsDetailOpen(true);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Status Legend */}
      <div className="flex items-center gap-4 mb-2">
        {statusLegend.map((item) => (
          <div key={item.status} className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-1 ${item.className}`}></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{item.status} ({item.code})</span>
          </div>
        ))}
      </div>
      
      <div className="border rounded-lg shadow-sm dark:border-gray-700 calendar-container">
        <ScrollArea 
          className="relative h-[500px] rounded-lg"
          ref={scrollAreaRef}
          onScroll={handleScroll}
        >
          <div className="min-w-full" style={{ width: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.title + columnWidths.status + (days.length * columnWidths.date)}px` }}>
            <table className="w-full border-collapse calendar-grid">
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  {/* Fixed columns */}
                  <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 sticky-column" style={{ width: `${columnWidths.id}px` }}>
                    <div className="flex items-center justify-between">
                      <span>ID</span>
                      <ColumnFilter column="e_number" label="ID" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 sticky-column`} style={{ width: `${columnWidths.name}px`, left: `${columnWidths.id}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Name</span>
                      <ColumnFilter column="name" label="Name" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 sticky-column`} style={{ width: `${columnWidths.alias}px`, left: `${columnWidths.id + columnWidths.name}px` }}>
                    <span>Alias</span>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 sticky-column`} style={{ width: `${columnWidths.mobile}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias}px` }}>
                    <span>Mobile</span>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 sticky-column`} style={{ width: `${columnWidths.team}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Team</span>
                      <ColumnFilter column="team" label="Team" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 sticky-column`} style={{ width: `${columnWidths.title}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Title</span>
                      <ColumnFilter column="job_title" label="Title" />
                    </div>
                  </th>
                  <th className={`p-2 text-left border-r sticky z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 sticky-column`} style={{ width: `${columnWidths.status}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.title}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <ColumnFilter column="employee_status" label="Status" />
                    </div>
                  </th>
                  
                  {/* Calendar days */}
                  {days.map((day, index) => {
                    const monthName = day.month === 4 ? 'May' : 'June';
                    return (
                      <th 
                        key={`${day.month+1}-${day.day}`} 
                        className={`p-2 text-center border-r min-w-[${columnWidths.date}px] dark:border-gray-700 dark:text-gray-200 
                          ${day.isWeekend ? 'weekend-column' : ''}`}
                        style={{ width: `${columnWidths.date}px` }}
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
                      className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer sticky-column"
                      style={{ width: `${columnWidths.id}px` }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.e_number || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer sticky-column`}
                      style={{ width: `${columnWidths.name}px`, left: `${columnWidths.id}px` }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.name || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 sticky-column`}
                      style={{ width: `${columnWidths.alias}px`, left: `${columnWidths.id + columnWidths.name}px` }}
                    >
                      {employee.alias || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 sticky-column`}
                      style={{ width: `${columnWidths.mobile}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias}px` }}
                    >
                      {employee.mobile_number || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 sticky-column`}
                      style={{ width: `${columnWidths.team}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile}px` }}
                    >
                      {employee.team?.team_name || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 sticky-column`}
                      style={{ width: `${columnWidths.title}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team}px` }}
                    >
                      {employee.job_title?.job_description || '-'}
                    </td>
                    <td 
                      className={`p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 sticky-column`}
                      style={{ width: `${columnWidths.status}px`, left: `${columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.title}px` }}
                    >
                      {employee.employee_status || 'Active'}
                    </td>
                    
                    {/* Calendar days */}
                    {days.map((day) => {
                      const dateKey = `${day.month+1}-${day.day}`;
                      const status = employee.schedule?.[dateKey] || 'O';
                      const statusClass = statusColors[status] || '';
                      
                      return (
                        <TooltipProvider key={dateKey}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <td 
                                className={`p-2 text-center border-r cursor-pointer text-sm dark:border-gray-700
                                  ${day.isWeekend ? 'weekend-column' : ''} 
                                  ${statusClass}`}
                                style={{ width: `${columnWidths.date}px` }}
                                onClick={() => handleCellClick(employee, dateKey)}
                              >
                                {status}
                              </td>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm font-medium">{employee.name}</div>
                              <div className="text-xs">{getFormattedDate(day.day, day.month)}</div>
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
                    <td colSpan={7 + days.length} className="text-center py-4 text-gray-500 dark:text-gray-400">
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
    </div>
  );
};
