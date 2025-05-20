
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
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

interface HangarData {
  id: number;
  name: string;
}

interface AircraftSchedule {
  id: string;
  aircraft: string;
  aircraft_id: number;
  hangar_id: number;
  start: { month: number, day: number };
  end: { month: number, day: number };
  team: string | null;
  status: string;
  registration: string;
  customer: string;
  color: string;
}

interface AircraftGanttChartProps {
  scrollLeft: number;
}

export const AircraftGanttChart = ({ scrollLeft }: AircraftGanttChartProps) => {
  const [hangars, setHangars] = useState<HangarData[]>([]);
  const [aircraftSchedules, setAircraftSchedules] = useState<{ hangarId: number, schedules: AircraftSchedule[] }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const days = generateDays();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch hangars and maintenance visits from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch hangars
        const { data: hangarsData, error: hangarsError } = await supabase
          .from('hangars')
          .select('id, hangar_name')
          .order('hangar_code');
          
        if (hangarsError) throw hangarsError;
        
        // Fetch maintenance visits with aircraft info
        const { data: visitsData, error: visitsError } = await supabase
          .from('maintenance_visits')
          .select(`
            id, 
            visit_number,
            check_type,
            status,
            start_date,
            end_date,
            date_in,
            date_out,
            hangar_id,
            aircraft:aircraft_id (
              id, 
              registration, 
              customer,
              aircraft_name,
              aircraft_type_id
            )
          `)
          .order('start_date');
          
        if (visitsError) {
          console.error('Error fetching visits:', visitsError);
          throw visitsError;
        }
        
        console.log('Fetched visits data:', visitsData);
        
        // Process hangars
        const processedHangars = hangarsData.map((hangar: any) => ({
          id: hangar.id,
          name: hangar.hangar_name
        }));
        
        // Process maintenance visits
        const schedulesByHangar: { hangarId: number, schedules: AircraftSchedule[] }[] = [];
        
        // Color mapping for aircraft
        const colorMap: Record<string, string> = {
          'A320': 'bg-blue-200 border-blue-400 dark:bg-blue-900 dark:border-blue-700',
          'A350': 'bg-green-200 border-green-400 dark:bg-green-900 dark:border-green-700',
          'A380': 'bg-amber-200 border-amber-400 dark:bg-amber-900 dark:border-amber-700',
          'B737': 'bg-purple-200 border-purple-400 dark:bg-purple-900 dark:border-purple-700',
          'B777': 'bg-red-200 border-red-400 dark:bg-red-900 dark:border-red-700',
          'B787': 'bg-cyan-200 border-cyan-400 dark:bg-cyan-900 dark:border-cyan-700',
          'PA28': 'bg-emerald-200 border-emerald-400 dark:bg-emerald-900 dark:border-emerald-700',
          'R44': 'bg-pink-200 border-pink-400 dark:bg-pink-900 dark:border-pink-700'
        };
        
        // Get aircraft types for color mapping
        const { data: aircraftTypes } = await supabase
          .from('aircraft_types')
          .select('id, type_code');
        
        const typeIdToCode: Record<number, string> = {};
        if (aircraftTypes) {
          aircraftTypes.forEach((type: any) => {
            typeIdToCode[type.id] = type.type_code;
          });
        }
        
        // Group by hangar
        processedHangars.forEach(hangar => {
          const hangarSchedules = visitsData
            .filter((visit: any) => visit.hangar_id === hangar.id)
            .map((visit: any) => {
              // Parse dates
              let startDate, endDate;
              
              try {
                startDate = visit.start_date ? new Date(visit.start_date) : new Date(visit.date_in);
                endDate = visit.end_date ? new Date(visit.end_date) : new Date(visit.date_out);
              } catch (error) {
                console.error('Error parsing dates for visit:', visit);
                startDate = new Date();
                endDate = new Date(new Date().getTime() + 86400000); // Next day
              }
              
              // Determine color based on aircraft type
              let color = 'bg-gray-200 border-gray-400 dark:bg-gray-900 dark:border-gray-700';
              if (visit.aircraft && visit.aircraft.aircraft_type_id) {
                const typeCode = typeIdToCode[visit.aircraft.aircraft_type_id];
                if (typeCode && colorMap[typeCode]) {
                  color = colorMap[typeCode];
                }
              }
              
              return {
                id: visit.id,
                aircraft: visit.aircraft?.aircraft_name || 'Unknown Aircraft',
                aircraft_id: visit.aircraft?.id,
                hangar_id: visit.hangar_id,
                start: { 
                  month: startDate.getMonth(), 
                  day: startDate.getDate() 
                },
                end: { 
                  month: endDate.getMonth(), 
                  day: endDate.getDate() 
                },
                team: null, // We don't have team data yet
                status: visit.status || 'Scheduled',
                registration: visit.aircraft?.registration || 'UNKNOWN',
                customer: visit.aircraft?.customer || 'Unknown Operator',
                color
              };
            });
            
          schedulesByHangar.push({
            hangarId: hangar.id,
            schedules: hangarSchedules
          });
        });
        
        setHangars(processedHangars);
        setAircraftSchedules(schedulesByHangar);
        console.log('Processed aircraft schedules:', schedulesByHangar);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load aircraft schedule data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Update scroll position to sync with schedule calendar
  useEffect(() => {
    if (scrollAreaRef.current && scrollAreaRef.current.scrollLeft !== scrollLeft) {
      scrollAreaRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  const calculatePosition = (schedule: AircraftSchedule) => {
    const startIdx = days.findIndex(d => d.month === schedule.start.month && d.day === schedule.start.day);
    const endIdx = days.findIndex(d => d.month === schedule.end.month && d.day === schedule.end.day);
    
    if (startIdx === -1 || endIdx === -1) return null;
    
    const startPosition = startIdx * 41 + 220; // 40px for column width + 1px for border, starting after fixed columns
    const width = (endIdx - startIdx + 1) * 41 - 1; // Subtract 1px to account for border
    
    return { startPosition, width };
  };

  const handleAircraftClick = (schedule: AircraftSchedule) => {
    setSelectedAircraft(schedule);
    setModalOpen(true);
  };

  // Handle scroll events from the scrollArea
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      // This would normally send the scroll position back up to the parent
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] border rounded-lg dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading aircraft schedule data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg dark:border-gray-700">
      <ScrollArea 
        className="h-[300px] rounded-lg"
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        <div className="min-w-[2000px]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 w-[120px]">Hangar</th>
                <th className="p-2 text-left border-r sticky left-[120px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 w-[100px]">Bay</th>
                
                {/* Calendar days - same as ScheduleCalendar */}
                {days.map((day, index) => (
                  <th 
                    key={`${day.month+1}-${day.day}`} 
                    className={`p-2 text-center border-r min-w-[40px] dark:border-gray-700 dark:text-gray-200
                      ${day.isWeekend ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  >
                    <div className="text-xs font-medium">{day.day}</div>
                    <div className="text-xs">May</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hangars.map((hangar) => (
                <tr key={hangar.id} className="border-b h-[40px] dark:border-gray-700">
                  <td className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{hangar.name.split(" ")[0]}</td>
                  <td className="p-2 border-r sticky left-[120px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10">{hangar.name.split(" ")[1]}</td>
                  
                  {/* Gantt chart container cell */}
                  <td colSpan={days.length} className="relative p-0 h-[40px]">
                    {/* Render weekend backgrounds */}
                    {days.map((day, index) => (
                      <div 
                        key={`bg-${day.month}-${day.day}`}
                        className={`absolute top-0 bottom-0 border-r dark:border-gray-700 ${day.isWeekend ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                        style={{
                          left: `${index * 41}px`,
                          width: '40px'
                        }}
                      />
                    ))}
                    
                    {/* Render aircraft schedules */}
                    {aircraftSchedules
                      .find(item => item.hangarId === hangar.id)
                      ?.schedules.map(schedule => {
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
                                  <span className="truncate px-1">{schedule.registration}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm font-medium">{schedule.aircraft}</div>
                                <div className="text-xs">{schedule.registration} - {schedule.customer}</div>
                                <div className="text-xs">
                                  May {schedule.start.day} - May {schedule.end.day}, 2025
                                </div>
                                <div className="text-xs font-medium mt-1">
                                  Status: <span className="text-blue-600 dark:text-blue-400">{schedule.status}</span>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>

      {/* Aircraft Details Modal */}
      <Sheet open={modalOpen} onOpenChange={setModalOpen}>
        <SheetContent className="w-full sm:w-[640px] md:w-[800px] lg:max-w-4xl h-4/5">
          <SheetHeader>
            <SheetTitle>Aircraft Details</SheetTitle>
          </SheetHeader>
          
          {selectedAircraft && (
            <div className="space-y-6 overflow-y-auto max-h-full mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Aircraft Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                        <p className="font-medium dark:text-gray-200">{selectedAircraft.aircraft}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Registration</p>
                        <p className="font-medium dark:text-gray-200">{selectedAircraft.registration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Schedule</p>
                        <p className="font-medium dark:text-gray-200">
                          May {selectedAircraft.start.day} - May {selectedAircraft.end.day}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="font-medium dark:text-gray-200">
                          {selectedAircraft.end.day - selectedAircraft.start.day + 1} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <p className="font-medium dark:text-gray-200">{selectedAircraft.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                        <p className="font-medium dark:text-gray-200">{selectedAircraft.customer}</p>
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
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              DB
                            </div>
                            <span className="dark:text-gray-300">David Brown</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-amber-600 dark:text-amber-500 font-medium">No team assigned</div>
                    )}
                    
                    <div className="mt-4">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        {selectedAircraft.team ? "Edit Schedule" : "Assign Team"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {!selectedAircraft.team && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Team Assignment</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="mb-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Search by name, skill, aircraft type..."
                          className="w-full border rounded-lg p-3 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                        <div className="absolute top-3 right-3 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                        </div>
                      </div>
                    </div>
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="p-2 text-left border-b dark:border-gray-600 dark:text-gray-200">Select</th>
                          <th className="p-2 text-left border-b dark:border-gray-600 dark:text-gray-200">ID</th>
                          <th className="p-2 text-left border-b dark:border-gray-600 dark:text-gray-200">Name</th>
                          <th className="p-2 text-left border-b dark:border-gray-600 dark:text-gray-200">Skills</th>
                          <th className="p-2 text-left border-b dark:border-gray-600 dark:text-gray-200">Certifications</th>
                          <th className="p-2 text-left border-b dark:border-gray-600 dark:text-gray-200">Availability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map(idx => (
                          <tr key={idx} className="border-b hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
                            <td className="p-2"><input type="checkbox" className="rounded dark:bg-gray-700" /></td>
                            <td className="p-2 dark:text-gray-300">EMP00{idx}</td>
                            <td className="p-2 dark:text-gray-300">{["Michael Johnson", "Sarah Williams", "David Brown"][idx-1]}</td>
                            <td className="p-2 dark:text-gray-300">{["Avionics", "Airframe", "Engines"][idx-1]}</td>
                            <td className="p-2 dark:text-gray-300">{["A320, B777", "B777, B787", "A350, B787"][idx-1]}</td>
                            <td className="p-2 dark:text-gray-300">{["Available", "Available", "Training until May 20"][idx-1]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 flex justify-between">
                      <Button variant="outline">Clear Selection</Button>
                      <Button className="bg-blue-600 hover:bg-blue-700">Assign Selected</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
