import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

// Helper function to determine if a date is a weekend
const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Helper function to determine if a date is today
const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Helper function to get month name
const getMonthName = (month: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month];
};

// Generate days for the current month and next month
const generateDays = (currentDate: Date) => {
  const days = [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      day: i,
      month: month,
      year: year,
      isWeekend: isWeekend(date),
      isToday: isToday(date),
      monthName: getMonthName(month)
    });
  }
  
  // Next month
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  for (let i = 1; i <= daysInNextMonth; i++) {
    const date = new Date(nextYear, nextMonth, i);
    days.push({
      day: i,
      month: nextMonth,
      year: nextYear,
      isWeekend: isWeekend(date),
      isToday: isToday(date),
      monthName: getMonthName(nextMonth)
    });
  }
  
  return days;
};

interface EmployeeCalendarProps {
  onScroll: (scrollLeft: number) => void;
  currentDate: Date;
  onEmployeeSelect?: (employee: any) => void;
  onCellClick?: (employee: any, date: string, status: string) => void;
  refreshKey?: number;
}

export const EmployeeCalendar = forwardRef<any, EmployeeCalendarProps>(({
  onScroll,
  currentDate,
  onEmployeeSelect,
  onCellClick,
  refreshKey = 0
}, ref) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [idFilterValues, setIdFilterValues] = useState<string[]>([]);
  const [nameFilterValues, setNameFilterValues] = useState<string[]>([]);
  const [activeIdFilters, setActiveIdFilters] = useState<string[]>([]);
  const [activeNameFilters, setActiveNameFilters] = useState<string[]>([]);
  const [activeDateFilters, setActiveDateFilters] = useState<Record<string, string[]>>({});
  const [dateStatusValues, setDateStatusValues] = useState<Record<string, string[]>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState<boolean>(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const days = generateDays(currentDate);
  const isMobile = useIsMobile();

  // Column widths for consistent layout
  const columnWidths = {
    id: 80,
    name: 200,
    alias: 70,
    mobile: 130,
    team: 100,
    core: 100,
    support: 100,
    title: 80,
    nightShift: 60,
    fte: 60,
    ttl: 60,
    date: 50
  };

  // Calculate left positions for sticky columns
  const columnLeftPositions = {
    id: 0,
    name: columnWidths.id,
    alias: columnWidths.id + columnWidths.name,
    mobile: columnWidths.id + columnWidths.name + columnWidths.alias,
    team: columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile,
    core: columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team,
    support: columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core,
    title: columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support,
    nightShift: columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support + columnWidths.title,
    fte: columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support + columnWidths.title + columnWidths.nightShift,
    ttl: columnWidths.id + columnWidths.name + columnWidths.alias + columnWidths.mobile + columnWidths.team + columnWidths.core + columnWidths.support + columnWidths.title + columnWidths.nightShift + columnWidths.fte
  };

  const totalFixedWidth = Object.values(columnLeftPositions).reduce((max, pos) => Math.max(max, pos), 0) + columnWidths.ttl;
  const totalWidth = totalFixedWidth + (days.length * columnWidths.date);

  // Status color mapping
  const statusColors: Record<string, string> = {
    "D": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "L": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "AL": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "TR": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "T": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "O": "status-day-off",
    "B1": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "SK": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    "DO": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  };

  // Legend for status colors
  const statusLegend = [
    { status: "On Duty", code: "D", color: "bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700" },
    { status: "Leave", code: "L/AL", color: "bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700" },
    { status: "Training", code: "TR", color: "bg-purple-100 border border-purple-300 dark:bg-purple-900 dark:border-purple-700" },
    { status: "Off Duty", code: "O", color: "bg-gray-600 border border-gray-700 text-gray-100 dark:bg-gray-700 dark:border-gray-800 dark:text-gray-300" },
    { status: "Half Day", code: "B1", color: "bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:border-blue-700" },
    { status: "Sick", code: "SK", color: "bg-orange-100 border border-orange-300 dark:bg-orange-900 dark:border-orange-700" },
    { status: "Overtime", code: "DO", color: "bg-yellow-100 border border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700" },
  ];

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    refreshData: () => {
      fetchEmployeeData();
    }
  }));

  // Handle scroll events
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      onScroll(scrollAreaRef.current.scrollLeft);
    }
  };

  // Fetch employee data
  const fetchEmployeeData = async () => {
    setIsLoading(true);
    try {
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

      // Extract unique ID and name values for filters
      const ids = Array.from(new Set(sampleEmployees.map(emp => emp.id)));
      const names = Array.from(new Set(sampleEmployees.map(emp => emp.name)));
      
      setIdFilterValues(ids);
      setNameFilterValues(names);

      // Process employees with schedule
      const employeesWithSchedule = sampleEmployees.map(emp => {
        const schedule: Record<string, string> = {};
        const dateStatuses: Record<string, string[]> = { ...dateStatusValues };
        
        days.forEach(day => {
          const randomValue = Math.random();
          const dateKey = `${day.month+1}-${day.day}-${day.year}`;
          
          let status = '';
          if (randomValue < 0.1) {
            status = "L"; // Leave
          } else if (randomValue < 0.2) {
            status = "T"; // Training
          } else if (randomValue < 0.8) {
            status = "D"; // Duty
          } else {
            status = "O"; // Off
          }
          
          schedule[dateKey] = status;
          
          // Collect all statuses for each date for filtering
          if (!dateStatuses[dateKey]) {
            dateStatuses[dateKey] = [];
          }
          if (!dateStatuses[dateKey].includes(status)) {
            dateStatuses[dateKey].push(status);
          }
        });
        
        return {
          ...emp,
          schedule
        };
      });
      
      // Update date status values for filtering
      setDateStatusValues(prevStatuses => {
        const newStatuses: Record<string, string[]> = {};
        days.forEach(day => {
          const dateKey = `${day.month+1}-${day.day}-${day.year}`;
          const statuses = new Set<string>();
          
          employeesWithSchedule.forEach(emp => {
            const status = emp.schedule[dateKey];
            if (status) {
              statuses.add(status);
            }
          });
          
          newStatuses[dateKey] = Array.from(statuses);
        });
        return newStatuses;
      });
      
      // Sort employees by e_number
      const sortedEmployees = employeesWithSchedule.sort((a, b) => a.e_number - b.e_number);
      
      setEmployees(sortedEmployees);
      setFilteredEmployees(sortedEmployees);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      toast.error("Failed to load employee data");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter handling functions
  const handleIdFilterSelect = (value: string) => {
    setActiveIdFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleNameFilterSelect = (value: string) => {
    setActiveNameFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleDateFilterSelect = (dateKey: string, status: string) => {
    setActiveDateFilters(prev => {
      const currentFilters = prev[dateKey] || [];
      if (currentFilters.includes(status)) {
        return {
          ...prev,
          [dateKey]: currentFilters.filter(s => s !== status)
        };
      } else {
        return {
          ...prev,
          [dateKey]: [...currentFilters, status]
        };
      }
    });
  };

  const clearDateFilter = (dateKey: string) => {
    setActiveDateFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[dateKey];
      return newFilters;
    });
  };

  // Handle cell click to open detail sheet
  const handleCellClick = (employee: any, date: string, status: string) => {
    setSelectedEmployee(employee);
    setSelectedDate(date);
    setSelectedStatus(status);
    setIsSheetOpen(true);
    
    // If parent component provided a callback, call it
    if (onCellClick) {
      onCellClick(employee, date, status);
    }
  };

  // Handle schedule update
  const handleUpdateSchedule = async () => {
    if (!selectedEmployee?.id || !selectedDate) return;

    try {
      setIsUpdateLoading(true);

      // In a real app, this would update the database
      // For now, we'll just simulate an update
      setTimeout(() => {
        // Update the local state
        setEmployees(prevEmployees => {
          return prevEmployees.map(emp => {
            if (emp.id === selectedEmployee.id) {
              return {
                ...emp,
                schedule: {
                  ...emp.schedule,
                  [selectedDate]: selectedStatus
                }
              };
            }
            return emp;
          });
        });

        // Also update filtered employees
        setFilteredEmployees(prevEmployees => {
          return prevEmployees.map(emp => {
            if (emp.id === selectedEmployee.id) {
              return {
                ...emp,
                schedule: {
                  ...emp.schedule,
                  [selectedDate]: selectedStatus
                }
              };
            }
            return emp;
          });
        });

        // Update date status values for filtering
        setDateStatusValues(prevStatuses => {
          const newStatuses = { ...prevStatuses };
          if (!newStatuses[selectedDate]?.includes(selectedStatus)) {
            newStatuses[selectedDate] = [...(newStatuses[selectedDate] || []), selectedStatus];
          }
          return newStatuses;
        });

        toast.success("Schedule updated successfully");
        setIsSheetOpen(false);
        setIsUpdateLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Failed to update schedule");
      setIsUpdateLoading(false);
    }
  };

  // Apply filters to employees
  useEffect(() => {
    let filtered = [...employees];
    
    // Apply ID filters
    if (activeIdFilters.length > 0) {
      filtered = filtered.filter(emp => activeIdFilters.includes(emp.id));
    }
    
    // Apply name filters
    if (activeNameFilters.length > 0) {
      filtered = filtered.filter(emp => activeNameFilters.includes(emp.name));
    }
    
    // Apply date filters
    if (Object.keys(activeDateFilters).length > 0) {
      filtered = filtered.filter(emp => {
        // Employee must match all date filters
        return Object.entries(activeDateFilters).every(([dateKey, statuses]) => {
          // If no statuses are selected for this date, don't filter
          if (statuses.length === 0) return true;
          
          // Check if employee's status for this date is in the selected statuses
          return statuses.includes(emp.schedule[dateKey]);
        });
      });
    }
    
    setFilteredEmployees(filtered);
  }, [employees, activeIdFilters, activeNameFilters, activeDateFilters]);

  // Fetch data on mount and when refreshKey changes
  useEffect(() => {
    fetchEmployeeData();
  }, [currentDate, refreshKey]);

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
    <div className="relative">
      {/* Status Legend - Fixed position outside scrollable area */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-50 border-b dark:border-gray-700 pb-2 mb-2">
        <div className="flex items-center gap-4 px-2 flex-wrap">
          {statusLegend.map((item) => (
            <div key={item.status} className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-1 ${item.color}`}></span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{item.status} ({item.code})</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Table Container - Scrollable area */}
      <div className="border rounded-lg dark:border-gray-700">
        <div 
          className="overflow-auto relative"
          style={{ width: '100%', height: '400px' }}
          ref={scrollAreaRef}
          onScroll={handleScroll}
        >
          <div style={{ width: `${totalWidth}px`, minWidth: '100%' }}>
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                <tr>
                  {/* Fixed columns with proper z-index */}
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.id}px`, left: `${columnLeftPositions.id}px`, zIndex: 100 }}>
                    EMP#
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn("h-6 w-6 ml-1", activeIdFilters.length > 0 && "text-primary")}
                        >
                          <Filter className={cn("h-3 w-3", activeIdFilters.length > 0 && "text-primary fill-primary")} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40">
                        <div className="space-y-2">
                          {idFilterValues.map((value) => (
                            <div 
                              key={value} 
                              className={cn(
                                "px-2 py-1 text-sm hover:bg-muted cursor-pointer flex items-center gap-2",
                                activeIdFilters.includes(value) ? "bg-primary/10" : ""
                              )}
                              onClick={() => handleIdFilterSelect(value)}
                            >
                              {activeIdFilters.includes(value) ? (
                                <Check className="h-4 w-4 text-primary" />
                              ) : (
                                <div className="w-4" />
                              )}
                              <span>{value}</span>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setActiveIdFilters([])}>
                            Clear Filters
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </th>
                  
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.name}px`, left: `${columnLeftPositions.name}px`, zIndex: 100 }}>
                    Name
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn("h-6 w-6 ml-1", activeNameFilters.length > 0 && "text-primary")}
                        >
                          <Filter className={cn("h-3 w-3", activeNameFilters.length > 0 && "text-primary fill-primary")} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40">
                        <div className="space-y-2">
                          {nameFilterValues.map((value) => (
                            <div 
                              key={value} 
                              className={cn(
                                "px-2 py-1 text-sm hover:bg-muted cursor-pointer flex items-center gap-2",
                                activeNameFilters.includes(value) ? "bg-primary/10" : ""
                              )}
                              onClick={() => handleNameFilterSelect(value)}
                            >
                              {activeNameFilters.includes(value) ? (
                                <Check className="h-4 w-4 text-primary" />
                              ) : (
                                <div className="w-4" />
                              )}
                              <span>{value}</span>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setActiveNameFilters([])}>
                            Clear Filters
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </th>

                  {/* Continue with other fixed columns following the same pattern */}
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.alias}px`, left: `${columnLeftPositions.alias}px`, zIndex: 100 }}>
                    Alias
                  </th>
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.mobile}px`, left: `${columnLeftPositions.mobile}px`, zIndex: 100 }}>
                    Mobile
                  </th>
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.team}px`, left: `${columnLeftPositions.team}px`, zIndex: 100 }}>
                    Team
                  </th>
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.core}px`, left: `${columnLeftPositions.core}px`, zIndex: 100 }}>
                    Core
                  </th>
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.support}px`, left: `${columnLeftPositions.support}px`, zIndex: 100 }}>
                    Support
                  </th>
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.title}px`, left: `${columnLeftPositions.title}px`, zIndex: 100 }}>
                    Title
                  </th>
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.nightShift}px`, left: `${columnLeftPositions.nightShift}px`, zIndex: 100 }}>
                    N/S
                  </th>
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.fte}px`, left: `${columnLeftPositions.fte}px`, zIndex: 100 }}>
                    FTE
                  </th>
                  <th className="p-2 text-left border-r sticky top-0 sticky-header-fixed dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800" 
                    style={{ width: `${columnWidths.ttl}px`, left: `${columnLeftPositions.ttl}px`, zIndex: 100 }}>
                    TTL
                  </th>
                  
                  {/* Calendar days with higher z-index */}
                  {days.map((day) => {
                    const dateKey = `${day.month+1}-${day.day}-${day.year}`;
                    const dateStatuses = dateStatusValues[dateKey] || [];
                    
                    return (
                      <th 
                        key={dateKey}
                        className={cn(
                          "p-2 text-center border-r sticky top-0 sticky-header-date dark:border-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800",
                          day.isWeekend ? 'weekend-shade' : '',
                          day.isToday ? 'today-highlight' : ''
                        )}
                        style={{ width: `${columnWidths.date}px`, zIndex: 90 }}
                      >
                        <div className="text-xs font-medium">{day.day}</div>
                        <div className="text-xs">{day.monthName}</div>
                        {dateStatuses.length > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-4 w-4 mt-1", activeDateFilters[dateKey]?.length > 0 && "text-primary")}
                              >
                                <Filter className={cn("h-2 w-2", activeDateFilters[dateKey]?.length > 0 && "text-primary fill-primary")} />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-32">
                              <div className="space-y-1">
                                {dateStatuses.map((status) => (
                                  <div 
                                    key={status} 
                                    className={cn(
                                      "px-2 py-1 text-xs hover:bg-muted cursor-pointer flex items-center gap-2",
                                      activeDateFilters[dateKey]?.includes(status) ? "bg-primary/10" : ""
                                    )}
                                    onClick={() => handleDateFilterSelect(dateKey, status)}
                                  >
                                    {activeDateFilters[dateKey]?.includes(status) ? (
                                      <Check className="h-3 w-3 text-primary" />
                                    ) : (
                                      <div className="w-3" />
                                    )}
                                    <span>{status}</span>
                                  </div>
                                ))}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full mt-2 text-xs"
                                  onClick={() => clearDateFilter(dateKey)}
                                >
                                  Clear
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    {/* Fixed columns with proper positioning and red border fix */}
                    <td 
                      className={cn(
                        "p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 cursor-pointer",
                        employee.core !== employee.support ? "core-support-different" : ""
                      )}
                      style={{ width: `${columnWidths.id}px`, left: `${columnLeftPositions.id}px`, zIndex: 10 }}
                      onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                    >
                      {employee.e_number}
                    </td>
                    
                    <td 
                      className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                      style={{ width: `${columnWidths.name}px`, left: `${columnLeftPositions.name}px`, zIndex: 10 }}
                      onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
                    >
                      {employee.name}
                    </td>

                    {/* Continue with other fixed columns */}
                    <td className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300" 
                      style={{ width: `${columnWidths.alias}px`, left: `${columnLeftPositions.alias}px`, zIndex: 10 }}>
                      {employee.alias}
                    </td>
                    <td className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300" 
                      style={{ width: `${columnWidths.mobile}px`, left: `${columnLeftPositions.mobile}px`, zIndex: 10 }}>
                      {employee.mobile}
                    </td>
                    <td className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300" 
                      style={{ width: `${columnWidths.team}px`, left: `${columnLeftPositions.team}px`, zIndex: 10 }}>
                      {employee.team}
                    </td>
                    <td className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300" 
                      style={{ width: `${columnWidths.core}px`, left: `${columnLeftPositions.core}px`, zIndex: 10 }}>
                      {employee.core}
                    </td>
                    <td className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300" 
                      style={{ width: `${columnWidths.support}px`, left: `${columnLeftPositions.support}px`, zIndex: 10 }}>
                      {employee.support}
                    </td>
                    <td className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300" 
                      style={{ width: `${columnWidths.title}px`, left: `${columnLeftPositions.title}px`, zIndex: 10 }}>
                      {employee.title}
                    </td>
                    <td className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300" 
                      style={{ width: `${columnWidths.nightShift}px`, left: `${columnLeftPositions.nightShift}px`, zIndex: 10 }}>
                      {employee.night_shift ? 'Yes' : 'No'}
                    </td>
                    <td className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300" 
                      style={{ width: `${columnWidths.fte}px`, left: `${columnLeftPositions.fte}px`, zIndex: 10 }}>
                      {employee.fte}
                    </td>
                    <td className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300" 
                      style={{ width: `${columnWidths.ttl}px`, left: `${columnLeftPositions.ttl}px`, zIndex: 10 }}>
                      {employee.ttl}
                    </td>
                    
                    {/* Calendar days with fixed tooltip implementation */}
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
                                  "p-2 text-center border-r cursor-pointer text-sm dark:border-gray-700 relative hover:z-50",
                                  day.isWeekend ? 'weekend-shade' : '',
                                  hasStatus ? statusColors[status] || '' : '',
                                  day.isToday ? 'today-highlight' : ''
                                )}
                                style={{ width: `${columnWidths.date}px` }}
                                onClick={() => onCellClick && onCellClick(employee, dateKey, status)}
                              >
                                {status}
                              </td>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="top" 
                              className="z-[9999] pointer-events-none fixed"
                              sideOffset={5}
                            >
                              <div className="text-sm font-medium">{employee.name}</div>
                              <div className="text-xs">{day.monthName} {day.day}, {day.year}</div>
                              {status === 'D' && <div className="text-green-600">On Duty</div>}
                              {status === 'AL' && <div className="text-red-600">Annual Leave</div>}
                              {status === 'L' && <div className="text-red-600">On Leave</div>}
                              {status === 'TR' || status === 'T' ? <div className="text-purple-600">In Training</div> : ''}
                              {status === 'O' && <div className="text-gray-600 font-semibold">Day Off</div>}
                              {status === 'B1' && <div className="text-blue-600">Half Day</div>}
                              {status === 'SK' && <div className="text-orange-600">Sick Leave</div>}
                              {status === 'DO' && <div className="text-yellow-600">Overtime</div>}
                              {!status && <div className="text-gray-500">Not Assigned</div>}
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
        </div>
      </div>
      
      {/* Fixed styles with improved CSS */}
      <style>
        {`
          .core-support-different {
            border-left: 4px solid #ef4444 !important;
            position: relative;
          }
          
          .core-support-different::before {
            content: '';
            position: absolute;
            left: -4px;
            top: 0;
            bottom: 0;
            width: 4px;
            background-color: #ef4444;
            z-index: 1;
          }
          
          .weekend-shade {
            background-color: rgba(107, 114, 128, 0.8);
            color: white;
          }
          
          .dark .weekend-shade {
            background-color: rgba(75, 85, 99, 0.9);
            color: rgba(229, 231, 235, 1);
          }
          
          .today-highlight {
            border: 2px solid #3b82f6 !important;
            font-weight: bold;
          }
          
          .status-day-off {
            background-color: rgba(75, 85, 99, 0.9) !important;
            color: white !important;
          }
          
          .dark .status-day-off {
            background-color: rgba(55, 65, 81, 1) !important;
            color: rgba(229, 231, 235, 1) !important;
          }
          
          /* Higher z-index for sticky headers */
          .sticky-header-fixed {
            z-index: 100 !important;
          }
          
          .sticky-header-date {
            z-index: 90 !important;
          }
          
          /* Tooltip positioning fixes */
          .tooltip-fixed {
            position: fixed !important; 
            pointer-events: none !important;
            z-index: 9999 !important;
          }
        `}
      </style>

      {/* Sheet component for schedule details */}
      {selectedEmployee && selectedDate && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className={`w-full ${isMobile ? '' : 'sm:max-w-lg'}`}>
            <SheetHeader>
              <SheetTitle>Schedule Details</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-semibold">{selectedEmployee.name}</h3>
                <div className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm px-2 py-1 rounded inline-block w-fit">
                  {selectedEmployee.e_number || 'No ID'}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                <p className="font-medium">{selectedDate}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Status</p>
                <div className={`mt-1 px-3 py-1 rounded-full text-sm inline-flex items-center ${
                  selectedStatus === 'D' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                  selectedStatus === 'AL' || selectedStatus === 'L' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                  selectedStatus === 'TR' || selectedStatus === 'T' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                  selectedStatus === 'O' ? 'bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200' :
                  selectedStatus === 'B1' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                  selectedStatus === 'SK' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                  selectedStatus === 'DO' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {selectedStatus === 'D' && 'On Duty'}
                  {selectedStatus === 'AL' && 'Annual Leave'}
                  {selectedStatus === 'L' && 'On Leave'}
                  {selectedStatus === 'TR' || selectedStatus === 'T' ? 'Training' : ''}
                  {selectedStatus === 'O' && 'Off Duty'}
                  {selectedStatus === 'B1' && 'Half Day'}
                  {selectedStatus === 'SK' && 'Sick Leave'}
                  {selectedStatus === 'DO' && 'Overtime'}
                  {!selectedStatus && 'Not Assigned'}
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Update Status</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Status for {selectedDate}</label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D">On Duty (D)</SelectItem>
                        <SelectItem value="B1">Half Day (B1)</SelectItem>
                        <SelectItem value="O">Off Duty (O)</SelectItem>
                        <SelectItem value="AL">Annual Leave (AL)</SelectItem>
                        <SelectItem value="SK">Sick Leave (SK)</SelectItem>
                        <SelectItem value="TR">Training (TR)</SelectItem>
                        <SelectItem value="DO">Overtime (DO)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={handleUpdateSchedule}
                    disabled={isUpdateLoading}
                  >
                    {isUpdateLoading ? 'Updating...' : 'Update Schedule'}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
});

EmployeeCalendar.displayName = 'EmployeeCalendar';
