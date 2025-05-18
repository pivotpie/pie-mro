
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown } from "lucide-react";

// Mock data for demonstration
const employees = [
  { id: "EMP001", name: "James Wilson", alias: "JW", mobile: "+971 52 123 4567", team: "Team Alpha", core: "A320", support: "Available", title: "TECH", night_shift: "Yes", fte: "Valid", ttl: "07:30 AM" },
  { id: "EMP002", name: "Sarah Johnson", alias: "SJ", mobile: "+971 52 234 5678", team: "Team Beta", core: "B777", support: "B777-D0601", title: "TECH", night_shift: "No", fte: "Valid", ttl: "07:30 AM" },
  { id: "EMP003", name: "Michael Brown", alias: "MB", mobile: "+971 55 345 6789", team: "Team Charlie", core: "B787", support: "Training", title: "TECH", night_shift: "Yes", fte: "Valid", ttl: "08:00 AM" },
  { id: "EMP004", name: "Emily Davis", alias: "ED", mobile: "+971 54 456 7890", team: "Team Alpha", core: "A350", support: "Leave", title: "TECH", night_shift: "No", fte: "Valid", ttl: "07:30 AM" },
  { id: "EMP005", name: "Robert Miller", alias: "RM", mobile: "+971 50 567 8901", team: "Team Beta", core: "B777", support: "A320-C0522", title: "TECH", night_shift: "Yes", fte: "Valid", ttl: "08:00 AM" },
];

// Helper function to determine if a date is a weekend
const isWeekend = (dayOfMonth: number, month: number) => {
  const date = new Date(2025, month, dayOfMonth);
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Generate days for May and June 2025
const generateDays = () => {
  const days = [];
  // May 2025 has 31 days
  for (let i = 1; i <= 31; i++) {
    days.push({ day: i, month: 4, isWeekend: isWeekend(i, 4) }); // Month is 0-indexed, so May is 4
  }
  // June 2025 has 30 days
  for (let i = 1; i <= 30; i++) {
    days.push({ day: i, month: 5, isWeekend: isWeekend(i, 5) }); // Month is 0-indexed, so June is 5
  }
  return days;
};

// Mock schedule data - just for demonstration
const generateScheduleData = () => {
  const scheduleData: Record<string, Record<string, string>> = {};
  
  employees.forEach(emp => {
    scheduleData[emp.id] = {};
    generateDays().forEach(day => {
      const randomValue = Math.random();
      if (randomValue < 0.1) {
        scheduleData[emp.id][`${day.month+1}-${day.day}`] = "L"; // Leave
      } else if (randomValue < 0.2) {
        scheduleData[emp.id][`${day.month+1}-${day.day}`] = "T"; // Training
      } else if (randomValue < 0.8) {
        scheduleData[emp.id][`${day.month+1}-${day.day}`] = "D"; // Duty
      } else {
        scheduleData[emp.id][`${day.month+1}-${day.day}`] = "O"; // Off
      }
    });
  });
  
  return scheduleData;
};

// Status color mapping
const statusColors: Record<string, string> = {
  "D": "bg-green-100 text-green-800",
  "L": "bg-red-100 text-red-800",
  "T": "bg-purple-100 text-purple-800",
  "O": "bg-gray-100 text-gray-800",
};

interface ScheduleCalendarProps {
  onScroll: (scrollLeft: number) => void;
}

export const ScheduleCalendar = ({ onScroll }: ScheduleCalendarProps) => {
  const [scheduleData] = useState(generateScheduleData());
  const days = generateDays();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  // Handle scroll events
  const handleScroll = () => {
    if (scrollRef.current) {
      onScroll(scrollRef.current.scrollLeft);
    }
  };

  // Mock filter values for dropdown
  const getFilterValues = (columnName: string) => {
    if (columnName === "team") {
      return ["Team Alpha", "Team Beta", "Team Charlie"];
    } else if (columnName === "core") {
      return ["A320", "B777", "B787", "A350"];
    } else if (columnName === "title") {
      return ["TECH", "LEAD", "MGR"];
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

  return (
    <div className="border rounded-lg mb-6">
      <ScrollArea 
        className="relative overflow-auto h-[400px] rounded-lg" 
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div className="min-w-[2000px]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {/* Fixed columns */}
                <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100">ID</th>
                <th className="p-2 text-left border-r sticky left-[80px] z-20 bg-gray-100">Name</th>
                <th className="p-2 text-left border-r sticky left-[280px] z-20 bg-gray-100">Alias</th>
                <th className="p-2 text-left border-r sticky left-[350px] z-20 bg-gray-100">Mobile</th>
                <th className="p-2 text-left border-r sticky left-[480px] z-20 bg-gray-100">
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
                <th className="p-2 text-left border-r sticky left-[580px] z-20 bg-gray-100">
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
                <th className="p-2 text-left border-r sticky left-[680px] z-20 bg-gray-100">Support</th>
                <th className="p-2 text-left border-r sticky left-[780px] z-20 bg-gray-100">Title</th>
                <th className="p-2 text-left border-r sticky left-[860px] z-20 bg-gray-100">N/S</th>
                <th className="p-2 text-left border-r sticky left-[920px] z-20 bg-gray-100">FTE</th>
                <th className="p-2 text-left border-r sticky left-[980px] z-20 bg-gray-100">TTL</th>
                
                {/* Calendar days */}
                {days.map((day) => (
                  <th 
                    key={`${day.month+1}-${day.day}`} 
                    className={`p-2 text-center border-r min-w-[40px] ${day.isWeekend ? 'bg-gray-200' : ''}`}
                  >
                    <div className="text-sm">{day.day}</div>
                    <div className="text-xs">{day.month === 4 ? 'May' : 'Jun'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b hover:bg-gray-50">
                  {/* Fixed columns */}
                  <td 
                    className="p-2 border-r sticky left-0 bg-white z-10 cursor-pointer"
                    onClick={() => console.log(`Clicked employee ID ${employee.id}`)}
                  >
                    {employee.id}
                  </td>
                  <td 
                    className="p-2 border-r sticky left-[80px] bg-white z-10 cursor-pointer"
                    onClick={() => console.log(`Clicked employee ${employee.name}`)}
                  >
                    {employee.name}
                  </td>
                  <td className="p-2 border-r sticky left-[280px] bg-white z-10">{employee.alias}</td>
                  <td className="p-2 border-r sticky left-[350px] bg-white z-10">{employee.mobile}</td>
                  <td className="p-2 border-r sticky left-[480px] bg-white z-10">{employee.team}</td>
                  <td className="p-2 border-r sticky left-[580px] bg-white z-10">{employee.core}</td>
                  <td className="p-2 border-r sticky left-[680px] bg-white z-10">{employee.support}</td>
                  <td className="p-2 border-r sticky left-[780px] bg-white z-10">{employee.title}</td>
                  <td className="p-2 border-r sticky left-[860px] bg-white z-10">{employee.night_shift}</td>
                  <td className="p-2 border-r sticky left-[920px] bg-white z-10">{employee.fte}</td>
                  <td className="p-2 border-r sticky left-[980px] bg-white z-10">{employee.ttl}</td>
                  
                  {/* Calendar days */}
                  {days.map((day) => {
                    const dateKey = `${day.month+1}-${day.day}`;
                    const status = scheduleData[employee.id]?.[dateKey];
                    
                    return (
                      <TooltipProvider key={dateKey}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <td 
                              className={`p-2 text-center border-r cursor-pointer text-sm ${day.isWeekend ? 'bg-gray-50' : ''} ${status ? statusColors[status] : ''}`}
                              onClick={() => handleCellClick(employee.id, dateKey)}
                            >
                              {status}
                            </td>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm font-medium">{employee.name}</div>
                            <div className="text-xs">{day.month === 4 ? 'May' : 'Jun'} {day.day}, 2025</div>
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
  );
};
