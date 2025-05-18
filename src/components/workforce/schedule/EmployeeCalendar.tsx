
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

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

export const EmployeeCalendar = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const days = generateDays();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

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
            ...emp,
            alias: emp.name?.split(' ').map((n: string) => n[0]).join('') || '',
            schedule
          };
        });

        setEmployees(processedEmployees);
      } catch (error: any) {
        toast.error(`Error loading employees: ${error.message}`);
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Cell click handler
  const handleCellClick = (employee: any, date: string) => {
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
            <span className={`inline-block w-3 h-3 rounded-full mr-1 ${item.color}`}></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{item.status} ({item.code})</span>
          </div>
        ))}
      </div>
      
      <div className="border rounded-lg dark:border-gray-700">
        <ScrollArea 
          className="relative overflow-auto h-[500px] rounded-lg"
          ref={scrollAreaRef}
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
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Filter className="h-3 w-3" />
                      </Button>
                    </div>
                  </th>
                  <th className="p-2 text-left border-r sticky left-[580px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Title</th>
                  <th className="p-2 text-left border-r sticky left-[680px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Status</th>
                  
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
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    {/* Fixed columns */}
                    <td 
                      className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.e_number || '-'}
                    </td>
                    <td 
                      className="p-2 border-r sticky left-[80px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      {employee.name || '-'}
                    </td>
                    <td className="p-2 border-r sticky left-[280px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.alias || '-'}</td>
                    <td className="p-2 border-r sticky left-[350px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.mobile_number || '-'}</td>
                    <td className="p-2 border-r sticky left-[480px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.team?.team_name || '-'}</td>
                    <td className="p-2 border-r sticky left-[580px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.job_title?.job_description || '-'}</td>
                    <td className="p-2 border-r sticky left-[680px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.employee_status || 'Active'}</td>
                    
                    {/* Calendar days */}
                    {days.map((day) => {
                      const dateKey = `${day.month+1}-${day.day}`;
                      const status = employee.schedule?.[dateKey] || 'O';
                      
                      return (
                        <TooltipProvider key={dateKey}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <td 
                                className={`p-2 text-center border-r cursor-pointer text-sm dark:border-gray-700
                                  ${day.isWeekend ? 'bg-gray-50 dark:bg-gray-800' : ''} 
                                  ${status ? statusColors[status] : ''}`}
                                onClick={() => handleCellClick(employee, dateKey)}
                              >
                                {status}
                              </td>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm font-medium">{employee.name}</div>
                              <div className="text-xs">May {day.day}, 2025</div>
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
