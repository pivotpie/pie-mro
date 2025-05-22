import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

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
}

export const ScheduleCalendar = ({ onScroll }: ScheduleCalendarProps) => {
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
    e_number: number; // Added e_number field for sorting
    schedule: Record<string, string>;
  }[]>([]);

  const days = generateDays();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // In a real app, fetch this data from the database
    // For now, we'll use sample data
    const sampleEmployees = [
      { id: "EMP001", name: "Michael Johnson", alias: "MJ", mobile: "+971 52 123 4567", team: "Team Alpha", core: "A320", support: "Available", title: "Technician", night_shift: "Yes", fte: "Valid", ttl: "07:30 AM", e_number: 1001 },
      { id: "EMP002", name: "Sarah Williams", alias: "SW", mobile: "+971 52 234 5678", team: "Team Beta", core: "A380", support: "Maintenance", title: "Engineer", night_shift: "No", fte: "Valid", ttl: "07:30 AM", e_number: 1002 },
      { id: "EMP003", name: "David Brown", alias: "DB", mobile: "+971 55 345 6789", team: "Team Charlie", core: "B787", support: "Leave", title: "Technician", night_shift: "Yes", fte: "Valid", ttl: "08:00 AM", e_number: 1003 },
      { id: "EMP004", name: "Emily Taylor", alias: "ET", mobile: "+971 54 456 7890", team: "Team Alpha", core: "A320", support: "Maintenance", title: "Technician", night_shift: "No", fte: "Valid", ttl: "07:30 AM", e_number: 1004 },
      { id: "EMP005", name: "James Davis", alias: "JD", mobile: "+971 50 567 8901", team: "Team Beta", core: "B777", support: "Training", title: "Manager", night_shift: "Yes", fte: "Valid", ttl: "08:00 AM", e_number: 1005 },
      { id: "EMP006", name: "Jennifer Wilson", alias: "JW", mobile: "+971 52 678 9012", team: "Team Charlie", core: "A380", support: "Maintenance", title: "Engineer", night_shift: "No", fte: "Valid", ttl: "08:30 AM", e_number: 1006 },
      { id: "EMP007", name: "Robert Martinez", alias: "RM", mobile: "+971 55 789 0123", team: "Team Alpha", core: "A320", support: "Maintenance", title: "Technician", night_shift: "Yes", fte: "Valid", ttl: "07:25 AM", e_number: 1007 },
      { id: "EMP008", name: "Lisa Anderson", alias: "LA", mobile: "+971 54 890 1234", team: "Team Beta", core: "A380", support: "Available", title: "Engineer", night_shift: "No", fte: "Valid", ttl: "07:00 AM", e_number: 1008 },
      { id: "EMP009", name: "Thomas Clark", alias: "TC", mobile: "+971 55 901 2345", team: "Team Alpha", core: "A380", support: "Training", title: "Engineer", night_shift: "Yes", fte: "Valid", ttl: "08:45 AM", e_number: 1009 },
      { id: "EMP010", name: "Michelle Rodriguez", alias: "MR", mobile: "+971 52 012 3456", team: "Team Alpha", core: "A380", support: "Maintenance", title: "Technician", night_shift: "No", fte: "Valid", ttl: "08:17 AM", e_number: 1010 },
    ];

    const employeesWithSchedule = sampleEmployees.map(emp => {
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
        schedule
      };
    });
    
    // Sort employees by e_number
    const sortedEmployees = employeesWithSchedule.sort((a, b) => a.e_number - b.e_number);
    
    setColumns(sortedEmployees);
  }, []);

  // Handle scroll events
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      onScroll(scrollAreaRef.current.scrollLeft);
    }
  };

  // Mock filter values for dropdown
  const getFilterValues = (columnName: string) => {
    if (columnName === "team") {
      return ["Team Alpha", "Team Beta", "Team Charlie"];
    } else if (columnName === "core") {
      return ["A320", "A380", "B777", "B787"];
    } else if (columnName === "title") {
      return ["Technician", "Engineer", "Manager", "Administrator"];
    }
    return [];
  };

  // Filter columns
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

  // Cell click handler
  const handleCellClick = (employeeId: string, date: string) => {
    console.log(`Clicked cell for employee ${employeeId} on date ${date}`);
    // This would open the right-side details pane
  };

  // Status color mapping - updated to make "O" darker
  const statusColors: Record<string, string> = {
    "D": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "L": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "T": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "O": "bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300", // Darker shade for day off
  };

  // Legend for status colors - updated for "O"
  const statusLegend = [
    { status: "Available", color: "bg-gray-100 border border-gray-300 dark:bg-gray-700 dark:border-gray-600" },
    { status: "Assigned", color: "bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700" },
    { status: "Training", color: "bg-purple-100 border border-purple-300 dark:bg-purple-900 dark:border-purple-700" },
    { status: "Leave", color: "bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700" },
    { status: "Off", color: "bg-gray-300 border border-gray-400 dark:bg-gray-700 dark:border-gray-600" },
  ];

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
                            {getFilterValues("team").map((value) => (
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
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Filter className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40">
                          <div className="space-y-2">
                            {getFilterValues("core").map((value) => (
                              <Button 
                                key={value} 
                                variant="ghost" 
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => handleFilter("core", value)}
                              >
                                {value}
                              </Button>
                            ))}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => clearFilter("core")}
                            >
                              Clear Filter
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                  <th className="p-2 text-left border-r sticky left-[680px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Support</th>
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
                {columns.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    {/* Fixed columns */}
                    <td 
                      className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      onClick={() => console.log(`Clicked employee ID ${employee.id}`)}
                    >
                      {employee.id}
                    </td>
                    <td 
                      className="p-2 border-r sticky left-[80px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 cursor-pointer"
                      onClick={() => console.log(`Clicked employee ${employee.name}`)}
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
                      const dateKey = `${day.month+1}-${day.day}`;
                      const status = employee.schedule[dateKey];
                      
                      return (
                        <TooltipProvider key={dateKey}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <td 
                                className={`p-2 text-center border-r cursor-pointer text-sm dark:border-gray-700
                                  ${day.isWeekend ? 'bg-gray-50 dark:bg-gray-800' : ''} 
                                  ${status ? statusColors[status] : ''}`}
                                onClick={() => handleCellClick(employee.id, dateKey)}
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
    </div>
  );
};
