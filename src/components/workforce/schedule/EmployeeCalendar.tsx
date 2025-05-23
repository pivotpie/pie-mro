
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Helper function to determine if a date is a weekend
const isWeekend = (dayOfMonth: number, month: number) => {
  const date = new Date(2025, month, dayOfMonth);
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Generate days for May 2025
const generateDays = (currentDate: Date) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ 
      day: i, 
      month: month, 
      year: year,
      isWeekend: isWeekend(i, month),
      isToday: new Date().getDate() === i && 
               new Date().getMonth() === month && 
               new Date().getFullYear() === year
    });
  }
  return days;
};

interface EmployeeCalendarProps {
  currentDate: Date;
  onEmployeeSelect: (employee: any) => void;
  onScheduleSelect: (employee: any, date: string, status: string) => void;
}

export const EmployeeCalendar = ({ 
  currentDate, 
  onEmployeeSelect,
  onScheduleSelect 
}: EmployeeCalendarProps) => {
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

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const days = generateDays(currentDate);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real app, fetch this data from the database
    // For now, we'll use sample data
    const sampleEmployees = [
      { id: "EMP001", name: "Michael Johnson", alias: "MJ", mobile: "+971 52 123 4567", team: "Team Alpha", core: "A320", support: "Available", title: "Technician", night_shift: "Yes", fte: "Valid", ttl: "07:30 AM", e_number: 1001 },
      { id: "EMP002", name: "Sarah Johnson", alias: "SJ", mobile: "+971 52 234 5678", team: "Team Beta", core: "A380", support: "Maintenance", title: "Engineer", night_shift: "No", fte: "Valid", ttl: "07:30 AM", e_number: 1002 },
      { id: "EMP003", name: "David Brown", alias: "DB", mobile: "+971 55 345 6789", team: "Team Charlie", core: "B787", support: "Leave", title: "Technician", night_shift: "Yes", fte: "Valid", ttl: "08:00 AM", e_number: 1003 },
      { id: "EMP004", name: "Emily Taylor", alias: "ET", mobile: "+971 54 456 7890", team: "Team Alpha", core: "A320", support: "Maintenance", title: "Technician", night_shift: "No", fte: "Valid", ttl: "07:30 AM", e_number: 1004 },
      { id: "EMP005", name: "James Davis", alias: "JD", mobile: "+971 50 567 8901", team: "Team Beta", core: "B777", support: "Training", title: "Manager", night_shift: "Yes", fte: "Valid", ttl: "08:00 AM", e_number: 1005 },
      { id: "EMP006", name: "Jennifer Wilson", alias: "JW", mobile: "+971 52 678 9012", team: "Team Charlie", core: "A380", support: "Maintenance", title: "Engineer", night_shift: "No", fte: "Valid", ttl: "08:30 AM", e_number: 1006 },
      { id: "EMP007", name: "Robert Martinez", alias: "RM", mobile: "+971 55 789 0123", team: "Team Alpha", core: "A320", support: "Maintenance", title: "Technician", night_shift: "Yes", fte: "Valid", ttl: "07:25 AM", e_number: 1007 },
      { id: "EMP008", name: "Lisa Anderson", alias: "LA", mobile: "+971 54 890 1234", team: "Team Beta", core: "A380", support: "Available", title: "Engineer", night_shift: "No", fte: "Valid", ttl: "07:00 AM", e_number: 1008 },
      { id: "EMP009", name: "Thomas Clark", alias: "TC", mobile: "+971 55 901 2345", team: "Team Alpha", core: "A380", support: "Training", title: "Engineer", night_shift: "Yes", fte: "Valid", ttl: "08:45 AM", e_number: 1009 },
      { id: "EMP010", name: "Michelle Rodriguez", alias: "MR", mobile: "+971 52 012 3456", team: "Team Alpha", core: "A380", support: "Maintenance", title: "Technician", night_shift: "No", fte: "Valid", ttl: "08:17 AM", e_number: 1010 },
    ];

    // Process employees with schedule
    const employeesWithSchedule = sampleEmployees.map(emp => {
      const schedule: Record<string, string> = {};
      
      days.forEach(day => {
        const randomValue = Math.random();
        const dateKey = `${day.month+1}-${day.day}-${day.year}`;
        
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
        schedule
      };
    });
    
    // Sort employees by e_number
    const sortedEmployees = employeesWithSchedule.sort((a, b) => a.e_number - b.e_number);
    
    setColumns(sortedEmployees);
    setIsLoading(false);
  }, [currentDate]);

  // Status color mapping
  const statusColors: Record<string, string> = {
    "D": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "L": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "T": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "O": "status-day-off", // Using the custom class for darker shade
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'D': return 'On Duty';
      case 'L': return 'On Leave';
      case 'T': return 'Training';
      case 'O': return 'Day Off';
      default: return 'Unknown';
    }
  };

  // Format month name
  const getFormattedMonthName = () => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
  };

  // Format date for display
  const formatDate = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
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
      <div className="text-center mb-4 font-medium text-xl">{getFormattedMonthName()}</div>
      <div className="border rounded-lg dark:border-gray-700">
        <ScrollArea 
          className="relative overflow-auto h-[700px] rounded-lg"
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
                  <th className="p-2 text-left border-r sticky left-[480px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Team</th>
                  <th className="p-2 text-left border-r sticky left-[580px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Core</th>
                  <th className="p-2 text-left border-r sticky left-[680px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Support</th>
                  <th className="p-2 text-left border-r sticky left-[780px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Title</th>
                  <th className="p-2 text-left border-r sticky left-[860px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">N/S</th>
                  <th className="p-2 text-left border-r sticky left-[920px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">FTE</th>
                  <th className="p-2 text-left border-r sticky left-[980px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">TTL</th>
                  
                  {/* Calendar days */}
                  {days.map((day, index) => (
                    <th 
                      key={`${day.month+1}-${day.day}-${day.year}`} 
                      className={cn(
                        "p-2 text-center border-r min-w-[40px] dark:border-gray-700 dark:text-gray-200",
                        day.isWeekend ? 'bg-gray-200 dark:bg-gray-700' : '',
                        day.isToday ? 'today-highlight' : ''
                      )}
                    >
                      <div className="text-xs font-medium">{day.day}</div>
                      <div className="text-xs">{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(day.year, day.month, day.day))}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {columns.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    {/* Fixed columns */}
                    <td 
                      className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10"
                    >
                      {employee.id}
                    </td>
                    <td 
                      className="p-2 border-r sticky left-[80px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
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
                    <td className="p-2 border-r sticky left-[980px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{employee.ttl}</td>
                    
                    {/* Calendar days */}
                    {days.map((day) => {
                      const dateKey = `${day.month+1}-${day.day}-${day.year}`;
                      const formattedDate = formatDate(day.day, day.month, day.year);
                      const status = employee.schedule[dateKey];
                      
                      return (
                        <TooltipProvider key={dateKey}>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <td 
                                className={cn(
                                  "p-2 text-center border-r cursor-pointer text-sm dark:border-gray-700",
                                  day.isWeekend ? 'weekend-shade' : '',
                                  day.isToday ? 'today-highlight' : '',
                                  status ? statusColors[status] : ''
                                )}
                                onClick={() => onScheduleSelect(employee, formattedDate, status)}
                              >
                                {status}
                              </td>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-0 overflow-hidden rounded-md">
                              <div className="bg-white dark:bg-gray-800 p-3 max-w-xs">
                                <div className="flex flex-col">
                                  <div className="font-semibold">{employee.name} ({employee.id})</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Date: {formattedDate}</div>
                                  <div className="mt-1">
                                    <span className={cn(
                                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                      status === 'D' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                                      status === 'L' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                                      status === 'T' && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
                                      status === 'O' && "bg-gray-600 text-white dark:bg-gray-700"
                                    )}>
                                      {getStatusLabel(status)}
                                    </span>
                                  </div>
                                </div>
                              </div>
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
    </div>
  );
};
