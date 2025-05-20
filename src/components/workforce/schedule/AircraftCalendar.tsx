
import { useState, useRef, useEffect, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, Filter } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export const AircraftCalendar = () => {
  const [hangars, setHangars] = useState<any[]>([]);
  const [filteredHangars, setFilteredHangars] = useState<any[]>([]);
  const [aircraftSchedules, setAircraftSchedules] = useState<any[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const days = generateDays();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [filterOpen, setFilterOpen] = useState<Record<string, boolean>>({});

  // Fixed column widths
  const columnWidths = {
    hangar: 120,
    bay: 100,
    date: 45 // Width of each date column
  };

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
            start: { month: 4, day: startDay },
            end: { month: 4, day: endDay },
            team: teamName,
            color: colorClasses[Math.floor(Math.random() * colorClasses.length)],
            visit_type: visit.check_type || 'Maintenance'
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

  const handleAircraftClick = (schedule: any) => {
    setSelectedAircraft(schedule);
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
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow-sm dark:border-gray-700">
      <ScrollArea className="h-[400px] rounded-lg">
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
                      <div 
                        key={`bg-${day.month}-${day.day}`}
                        className={`absolute top-0 bottom-0 border-r dark:border-gray-700 ${day.isWeekend ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                        style={{
                          left: `${index * columnWidths.date}px`,
                          width: `${columnWidths.date}px`
                        }}
                      />
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
                            <TooltipContent>
                              <div className="text-sm font-medium">{schedule.aircraft}</div>
                              <div className="text-xs">
                                May {schedule.start.day} - May {schedule.end.day}, 2025
                              </div>
                              {schedule.team ? (
                                <div className="text-green-600">Assigned to {schedule.team}</div>
                              ) : (
                                <div className="text-amber-600">Not assigned to a team</div>
                              )}
                              <div className="text-xs mt-1">{schedule.visit_type}</div>
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

      {/* Aircraft Details Modal */}
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
                      <Button className="bg-blue-600 hover:bg-blue-700">
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
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
