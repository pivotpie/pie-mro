
import { useState, useRef, useEffect, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, Filter, Calendar, Users, Settings, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

// Helper function to check if a date is a weekend
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

interface AircraftCalendarProps {
  onScroll?: (scrollLeft: number) => void;
  externalScrollPosition?: number;
}

export const AircraftCalendar = ({ onScroll, externalScrollPosition }: AircraftCalendarProps) => {
  const [hangars, setHangars] = useState<any[]>([]);
  const [filteredHangars, setFilteredHangars] = useState<any[]>([]);
  const [aircraftSchedules, setAircraftSchedules] = useState<any[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const days = generateDays();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [filterOpen, setFilterOpen] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeSearchResults, setEmployeeSearchResults] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);

  // Fixed column widths
  const columnWidths = {
    hangar: 120,
    bay: 100,
    date: 45 // Width of each date column
  };

  // Handle external scroll position changes
  useEffect(() => {
    if (externalScrollPosition !== undefined && scrollAreaRef.current) {
      scrollAreaRef.current.scrollLeft = externalScrollPosition;
    }
  }, [externalScrollPosition]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch hangars
        const { data: hangarData, error: hangarError } = await supabase
          .from('hangars')
          .select('*')
          .order('id');
        
        if (hangarError) throw hangarError;

        // Fetch maintenance visits with aircraft information
        const { data: maintenanceVisitsData, error: visitError } = await supabase
          .from('maintenance_visits')
          .select(`
            id,
            visit_number,
            check_type,
            date_in,
            date_out,
            status,
            remarks,
            hangar_id,
            aircraft_id,
            aircraft:aircraft_id (
              id,
              aircraft_code,
              aircraft_name,
              registration,
              customer
            ),
            total_hours
          `);
        
        if (visitError) throw visitError;

        console.log("Fetched maintenance visits:", maintenanceVisitsData);
        
        setHangars(hangarData || []);
        setFilteredHangars(hangarData || []);

        // Process maintenance visit data into the format needed for display
        const schedules: any[] = [];
        const hangarMap: Record<string, any> = {};

        // Initialize empty schedules for each hangar
        for (const hangar of hangarData || []) {
          hangarMap[hangar.id] = {
            hangarId: hangar.id,
            hangarName: hangar.hangar_name || 'Unknown Hangar',
            hangarCode: hangar.hangar_code || 'Unknown',
            schedules: []
          };
        }

        // Add maintenance visits to their respective hangars
        const colorClasses = [
          "bg-blue-200 border-blue-400 dark:bg-blue-900 dark:border-blue-700",
          "bg-green-200 border-green-400 dark:bg-green-900 dark:border-green-700",
          "bg-purple-200 border-purple-400 dark:bg-purple-900 dark:border-purple-700",
          "bg-amber-200 border-amber-400 dark:bg-amber-900 dark:border-amber-700",
          "bg-red-200 border-red-400 dark:bg-red-900 dark:border-red-700",
          "bg-cyan-200 border-cyan-400 dark:bg-cyan-900 dark:border-cyan-700"
        ];

        // Handle maintenance visits
        for (const visit of maintenanceVisitsData || []) {
          if (!visit.hangar_id || !visit.aircraft || !visit.date_in || !visit.date_out) continue;

          // Convert dates to day/month format for our calendar
          const date_in = new Date(visit.date_in);
          const date_out = new Date(visit.date_out);
          
          // Map to May 2025 calendar for consistency with UI
          // Use actual day of month but force it to May 2025
          const startDay = Math.min(Math.max(date_in.getDate(), 1), 31);
          const endDay = Math.min(Math.max(date_out.getDate(), startDay), 31);

          // Get team assignment (in real app, this would come from the database)
          const teams = ["Team Alpha", "Team Beta", "Team Charlie", null];
          const teamName = teams[Math.floor(Math.random() * teams.length)];

          // Create schedule item
          const scheduleItem = {
            id: visit.id,
            visit_id: visit.id,
            aircraft_id: visit.aircraft.id,
            aircraft: visit.aircraft.aircraft_name || visit.aircraft.aircraft_code,
            registration: visit.aircraft.registration || 'No Reg',
            customer: visit.aircraft.customer || 'Unknown Customer',
            start: { month: 4, day: startDay },
            end: { month: 4, day: endDay },
            team: teamName,
            color: colorClasses[Math.floor(Math.random() * colorClasses.length)],
            visit_type: visit.check_type || 'Maintenance',
            status: visit.status || 'Scheduled',
            remarks: visit.remarks || '',
            total_hours: visit.total_hours || 0
          };

          // Add to the appropriate hangar
          if (hangarMap[visit.hangar_id]) {
            hangarMap[visit.hangar_id].schedules.push(scheduleItem);
          }
        }

        // Convert hangar map to array
        const scheduleArray = Object.values(hangarMap);
        setAircraftSchedules(scheduleArray);
        setFilteredSchedules(scheduleArray);

        console.log("Processed schedules:", scheduleArray);
      } catch (error: any) {
        toast.error(`Error loading data: ${error.message}`);
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter unique values for a column
  const getUniqueValuesForColumn = (columnName: string) => {
    if (columnName === 'hangarName') {
      return [...new Set(hangars.map(h => h.hangar_name?.split(" ")[0] || 'Hangar'))].sort();
    }
    if (columnName === 'bay') {
      return [...new Set(hangars.map(h => h.hangar_name?.split(" ")[1] || h.hangar_code || 'Bay'))].sort();
    }
    return [];
  };

  // Apply filters to schedules
  useEffect(() => {
    if (hangars.length === 0) return;
    
    let filteredHangarsList = [...hangars];
    
    // Apply hangar filters
    if (columnFilters.hangarName?.length > 0) {
      filteredHangarsList = filteredHangarsList.filter(h => 
        columnFilters.hangarName.includes(h.hangar_name?.split(" ")[0] || 'Hangar')
      );
    }
    
    if (columnFilters.bay?.length > 0) {
      filteredHangarsList = filteredHangarsList.filter(h => 
        columnFilters.bay.includes(h.hangar_name?.split(" ")[1] || h.hangar_code || 'Bay')
      );
    }
    
    setFilteredHangars(filteredHangarsList);
    
    const filteredSchedulesList = aircraftSchedules.filter(s => 
      filteredHangarsList.some(h => h.id === s.hangarId)
    );
    
    setFilteredSchedules(filteredSchedulesList);
  }, [columnFilters, hangars, aircraftSchedules]);

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

  const calculatePosition = (schedule: any) => {
    const startIdx = days.findIndex(d => d.month === schedule.start.month && d.day === schedule.start.day);
    const endIdx = days.findIndex(d => d.month === schedule.end.month && d.day === schedule.end.day);
    
    if (startIdx === -1 || endIdx === -1) return null;
    
    const startPosition = startIdx * columnWidths.date + (columnWidths.hangar + columnWidths.bay); // After fixed columns
    const width = (endIdx - startIdx + 1) * columnWidths.date - 1; // Subtract 1px to account for border
    
    return { startPosition, width };
  };

  // Handle scroll events
  const handleScroll = () => {
    if (scrollAreaRef.current && onScroll) {
      onScroll(scrollAreaRef.current.scrollLeft);
    }
  };

  const handleAircraftClick = (schedule: any) => {
    setSelectedAircraft(schedule);
    setIsDetailOpen(true);
  };

  // Handle opening the detailed schedule modal
  const handleOpenScheduleModal = () => {
    setIsDetailOpen(false);
    setIsScheduleModalOpen(true);
  };

  // Handle searching for employees
  const handleEmployeeSearch = async (query: string) => {
    if (!query.trim()) {
      setEmployeeSearchResults([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, 
          e_number, 
          name, 
          key_name, 
          job_titles (job_description),
          teams (team_name),
          employee_cores (
            core_id,
            core_codes (core_code)
          )
        `)
        .or(`name.ilike.%${query}%,key_name.ilike.%${query}%`)
        .limit(10);
        
      if (error) throw error;
      
      // Format the employee search results
      const formattedResults = data.map(emp => ({
        id: emp.id,
        name: emp.name,
        number: emp.e_number,
        title: emp.job_titles?.job_description || 'Unknown Position',
        team: emp.teams?.team_name || 'Unassigned',
        cores: emp.employee_cores?.map((core: any) => core.core_codes?.core_code).filter(Boolean) || []
      }));
      
      // Filter out employees that are already selected
      const filteredResults = formattedResults.filter(
        result => !selectedEmployees.some(selected => selected.id === result.id)
      );
      
      setEmployeeSearchResults(filteredResults);
    } catch (error: any) {
      console.error('Error searching employees:', error);
      toast.error('Error searching employees');
    }
  };

  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployees([...selectedEmployees, employee]);
    setEmployeeSearchResults(prev => prev.filter(e => e.id !== employee.id));
  };

  const handleEmployeeRemove = (employeeId: string | number) => {
    const removedEmployee = selectedEmployees.find(e => e.id === employeeId);
    setSelectedEmployees(prev => prev.filter(e => e.id !== employeeId));
    
    // Add back to results if still matches search
    if (removedEmployee && searchQuery && 
        (removedEmployee.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         removedEmployee.number.toString().includes(searchQuery))) {
      setEmployeeSearchResults(prev => [...prev, removedEmployee]);
    }
  };

  const clearEmployeeSearch = () => {
    setSearchQuery("");
    setEmployeeSearchResults([]);
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
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow-sm dark:border-gray-700">
      <ScrollArea 
        className="h-[400px] rounded-lg" 
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        <div className="min-w-full" style={{ width: `${columnWidths.hangar + columnWidths.bay + (days.length * columnWidths.date)}px` }}>
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" style={{ width: `${columnWidths.hangar}px` }}>
                  <div className="flex items-center justify-between">
                    <span>Hangar</span>
                    <ColumnFilter column="hangarName" label="Hangar" />
                  </div>
                </th>
                <th className="p-2 text-left border-r sticky left-120px z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" style={{ width: `${columnWidths.bay}px`, left: `${columnWidths.hangar}px` }}>
                  <div className="flex items-center justify-between">
                    <span>Bay</span>
                    <ColumnFilter column="bay" label="Bay" />
                  </div>
                </th>
                
                {/* Calendar days */}
                {days.map((day, index) => (
                  <th 
                    key={`${day.month+1}-${day.day}`} 
                    className={`p-2 text-center border-r dark:border-gray-700 dark:text-gray-200
                      ${day.isWeekend ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                    style={{ width: `${columnWidths.date}px` }}
                  >
                    <div className="text-xs font-medium">{day.day}</div>
                    <div className="text-xs">May</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((hangarSchedule) => (
                <tr key={hangarSchedule.hangarId} className="border-b h-[40px] dark:border-gray-700">
                  <td className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10" style={{ width: `${columnWidths.hangar}px` }}>
                    {hangarSchedule.hangarName?.split(" ")[0] || 'Hangar'}
                  </td>
                  <td className="p-2 border-r sticky bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10" style={{ width: `${columnWidths.bay}px`, left: `${columnWidths.hangar}px` }}>
                    {hangarSchedule.hangarName?.split(" ")[1] || hangarSchedule.hangarCode || 'Bay'}
                  </td>
                  
                  {/* Gantt chart container cell */}
                  <td colSpan={days.length} className="relative p-0 h-[40px]">
                    {/* Render weekend backgrounds */}
                    {days.map((day, index) => (
                      <HoverCard key={`bg-${day.month}-${day.day}`}>
                        <HoverCardTrigger asChild>
                          <div 
                            className={`absolute top-0 bottom-0 border-r dark:border-gray-700 ${day.isWeekend ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                            style={{
                              left: `${index * columnWidths.date}px`,
                              width: `${columnWidths.date}px`
                            }}
                          />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-lg">May {day.day}, 2025</h4>
                            <span className={`text-xs px-2 py-1 rounded ${day.isWeekend ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                              {day.isWeekend ? 'Weekend' : 'Weekday'}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-gray-500">Hangar Availability</div>
                              <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1">
                                <div className="h-1.5 bg-green-500 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                              <div className="text-xs mt-1 text-right">65% Available</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Technician Availability</div>
                              <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1">
                                <div className="h-1.5 bg-amber-500 rounded-full" style={{ width: '42%' }}></div>
                              </div>
                              <div className="text-xs mt-1 text-right">42% Available</div>
                            </div>
                            <div className="pt-2 border-t mt-2">
                              <div className="text-sm font-medium">Scheduled Aircraft</div>
                              <ul className="mt-1 space-y-1">
                                <li className="text-xs flex justify-between">
                                  <span>A320 - Registration A6-123</span>
                                  <span className="text-green-600">In Progress</span>
                                </li>
                                <li className="text-xs flex justify-between">
                                  <span>B787 - Registration A6-789</span>
                                  <span className="text-amber-600">Scheduled</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                    
                    {/* Render aircraft schedules */}
                    {hangarSchedule.schedules.map(schedule => {
                      const position = calculatePosition(schedule);
                      if (!position) return null;
                      
                      return (
                        <TooltipProvider key={schedule.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={`absolute top-1 h-[32px] ${schedule.color} border rounded cursor-pointer flex items-center justify-center overflow-hidden transition-shadow hover:shadow-md text-xs dark:text-gray-200`}
                                style={{
                                  left: `${position.startPosition}px`,
                                  width: `${position.width}px`,
                                }}
                                onClick={() => handleAircraftClick(schedule)}
                              >
                                <span className="truncate px-1">{schedule.aircraft}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="w-72 p-0 overflow-hidden rounded-lg shadow-lg">
                              <div className="bg-white dark:bg-gray-800 p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold">{schedule.aircraft}</h4>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    schedule.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                    schedule.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {schedule.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <div className="text-gray-500">Registration</div>
                                    <div>{schedule.registration}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Customer</div>
                                    <div>{schedule.customer}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Visit Type</div>
                                    <div>{schedule.visit_type}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Duration</div>
                                    <div>{schedule.end.day - schedule.start.day + 1} days</div>
                                  </div>
                                </div>
                                <div className="mt-2 border-t pt-2">
                                  {schedule.team ? (
                                    <div className="flex items-center">
                                      <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs mr-2">
                                        <Users className="h-3 w-3" />
                                      </div>
                                      <div className="text-xs">
                                        <div>Assigned to</div>
                                        <div className="font-medium">{schedule.team}</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-amber-600">
                                      <div className="h-6 w-6 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center text-xs mr-2">
                                        <Users className="h-3 w-3" />
                                      </div>
                                      <div className="text-xs">
                                        <div>Not assigned to a team</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-900 p-3 text-xs text-center">
                                Click for more details and options
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </td>
                </tr>
              ))}
              
              {filteredSchedules.length === 0 && (
                <tr>
                  <td colSpan={2 + days.length} className="text-center py-4 text-gray-500 dark:text-gray-400">
                    {aircraftSchedules.length > 0 ? 'No matching schedules found.' : 'No schedules found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ScrollArea>

      {/* Aircraft Details Side Panel */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:w-[640px] md:w-[700px] lg:w-[800px]">
          <SheetHeader>
            <SheetTitle>Aircraft Maintenance Details</SheetTitle>
          </SheetHeader>
          
          {selectedAircraft && (
            <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Aircraft Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid gap-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Aircraft</p>
                        <p className="font-medium dark:text-gray-200">{selectedAircraft.aircraft}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Registration</p>
                        <p className="font-medium dark:text-gray-200">{selectedAircraft.registration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Schedule</p>
                        <p className="font-medium dark:text-gray-200">
                          May {selectedAircraft.start.day} - May {selectedAircraft.end.day}, 2025
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="font-medium dark:text-gray-200">
                          {selectedAircraft.end.day - selectedAircraft.start.day + 1} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Visit Type</p>
                        <p className="font-medium dark:text-gray-200">{selectedAircraft.visit_type}</p>
                      </div>
                      {selectedAircraft.customer && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                          <p className="font-medium dark:text-gray-200">{selectedAircraft.customer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Assignment Status</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {selectedAircraft.team ? (
                      <>
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Assigned Team</p>
                          <p className="font-medium dark:text-gray-200">{selectedAircraft.team}</p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Assigned Personnel</p>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              MJ
                            </div>
                            <span className="dark:text-gray-300">Michael Johnson (Lead)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              SW
                            </div>
                            <span className="dark:text-gray-300">Sarah Williams</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-amber-600 dark:text-amber-500 font-medium">No team assigned</div>
                    )}
                    
                    <div className="mt-4">
                      <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenScheduleModal}>
                        {selectedAircraft.team ? "Edit Assignment" : "Assign Team"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Maintenance Tasks</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <table className="w-full">
                    <thead className="border-b dark:border-gray-700">
                      <tr>
                        <th className="text-left py-2 font-medium">Task</th>
                        <th className="text-left py-2 font-medium">Status</th>
                        <th className="text-left py-2 font-medium">Estimated Hours</th>
                        <th className="text-left py-2 font-medium">Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <tr key={idx} className="border-b dark:border-gray-700">
                          <td className="py-2">Task #{idx + 1}: {["Inspect engines", "Check avionics", "Test landing gear"][idx]}</td>
                          <td className="py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              idx === 0 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : 
                              idx === 1 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}>
                              {idx === 0 ? "Completed" : idx === 1 ? "In Progress" : "Scheduled"}
                            </span>
                          </td>
                          <td className="py-2">{[4, 8, 6][idx]} hours</td>
                          <td className="py-2">{["Michael J.", "Sarah W.", "Unassigned"][idx]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Technical Details</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid gap-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours</p>
                        <p className="font-medium dark:text-gray-200">{selectedAircraft.total_hours || 'Not recorded'} hours</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Engine Type</p>
                        <p className="font-medium dark:text-gray-200">CFM56-5B</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Maintenance</p>
                        <p className="font-medium dark:text-gray-200">March 12, 2025</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Documentation</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border dark:border-gray-700">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center mr-3">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Maintenance Schedule</p>
                            <p className="text-xs text-gray-500">PDF - 2.4 MB</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border dark:border-gray-700">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center mr-3">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Certification Records</p>
                            <p className="text-xs text-gray-500">PDF - 1.8 MB</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Advanced Schedule Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="w-full max-w-[90%] h-[80vh] max-h-[800px] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl">
              {selectedAircraft?.team ? 'Edit Team Assignment' : 'Assign Team'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-2 overflow-y-auto flex-1">
            {selectedAircraft && (
              <div className="space-y-6">
                {/* Aircraft Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Aircraft</span>
                      <p className="font-medium">{selectedAircraft.aircraft}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Registration</span>
                      <p className="font-medium">{selectedAircraft.registration}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Schedule</span>
                      <p className="font-medium">
                        May {selectedAircraft.start.day} - May {selectedAircraft.end.day}, 2025
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Visit Type</span>
                      <p className="font-medium">{selectedAircraft.visit_type}</p>
                    </div>
                  </div>
                </div>

                {/* Universal Search */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Find Qualified Personnel</h3>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleEmployeeSearch(e.target.value);
                      }}
                      placeholder="Search by name, skills, certifications, or aircraft type..."
                      className="w-full p-3 pr-10 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => clearEmployeeSearch()}
                    >
                      {searchQuery && <X className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Selected Personnel Section */}
                  {selectedEmployees.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Selected Personnel</h4>
                      <div className="space-y-2 mb-4">
                        {selectedEmployees.map(employee => (
                          <div 
                            key={`selected-${employee.id}`}
                            className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                {employee.name.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-medium">{employee.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {employee.title} • {employee.team}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:text-red-500"
                              onClick={() => handleEmployeeRemove(employee.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {employeeSearchResults.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Search Results</h4>
                      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Position</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Team</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Core</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                            {employeeSearchResults.map(employee => (
                              <tr 
                                key={employee.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                onClick={() => handleEmployeeSelect(employee)}
                              >
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                                      {employee.name.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div>
                                      <p className="font-medium">{employee.name}</p>
                                      <p className="text-xs text-gray-500">#{employee.number}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">{employee.title}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{employee.team}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {employee.cores.map((core: string, idx: number) => (
                                    <span 
                                      key={idx} 
                                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1 mb-1"
                                    >
                                      {core}
                                    </span>
                                  ))}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEmployeeSelect(employee);
                                    }}
                                  >
                                    Select
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills and Certifications Required */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Required Qualifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <h4 className="font-medium mb-2">Aircraft Type Certifications</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">A320 Type Certification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">CFM56 Engine Experience</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Avionics Systems Qualification</span>
                        </div>
                      </div>
                    </div>
                    <div className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <h4 className="font-medium mb-2">Required Skills</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Airframe Specialist</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Landing Gear Systems</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Cabin Maintenance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              toast.success("Team assignment saved", {
                description: "The team assignment has been updated successfully."
              });
              setIsScheduleModalOpen(false);
            }}>
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
