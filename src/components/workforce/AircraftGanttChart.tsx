import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mock data for aircraft and hangars
const hangars = [
  { id: "H1", name: "Hangar 1A" },
  { id: "H2", name: "Hangar 1B" },
  { id: "H3", name: "Hangar 2A" },
  { id: "H4", name: "Hangar 2B" },
  { id: "H5", name: "Hangar 3A" },
  { id: "H6", name: "Hangar 3B" },
  { id: "H7", name: "Hangar 4A" },
  { id: "H8", name: "Hangar 4B" },
];

// Helper function to check if a date is a weekend
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

// Mock aircraft schedules
const generateAircraftSchedules = () => {
  const schedules: any[] = [
    {
      hangarId: "H1",
      schedules: [
        {
          id: "A1",
          aircraft: "AIRBUS 320 UK CAA",
          start: { month: 4, day: 1 },
          end: { month: 4, day: 9 },
          team: "Team Alpha",
          color: "bg-blue-200 border-blue-400"
        }
      ]
    },
    {
      hangarId: "H2",
      schedules: [
        {
          id: "A2",
          aircraft: "BOEING 777 EASA",
          start: { month: 4, day: 10 },
          end: { month: 4, day: 20 },
          team: "Team Beta",
          color: "bg-green-200 border-green-400"
        }
      ]
    },
    {
      hangarId: "H3",
      schedules: [
        {
          id: "A3",
          aircraft: "AIRBUS 350 FAA",
          start: { month: 4, day: 15 },
          end: { month: 5, day: 5 },
          team: null,
          color: "bg-amber-200 border-amber-400"
        }
      ]
    }
  ];
  
  // Add random schedules for other hangars
  for (let i = 4; i <= 8; i++) {
    const hangarId = `H${i}`;
    
    const randomScheduleCount = Math.floor(Math.random() * 2) + 1;
    const randomSchedules = [];
    
    for (let j = 0; j < randomScheduleCount; j++) {
      const startMonth = Math.random() < 0.7 ? 4 : 5;
      const startDay = startMonth === 4 ? Math.floor(Math.random() * 25) + 1 : Math.floor(Math.random() * 15) + 1;
      const duration = Math.floor(Math.random() * 10) + 3;
      
      let endMonth = startMonth;
      let endDay = startDay + duration;
      
      if (startMonth === 4 && endDay > 31) {
        endMonth = 5;
        endDay = endDay - 31;
      }
      
      const aircraftTypes = [
        "BOEING 737 GCAA", "AIRBUS 320 GCAA", "BOEING 777 UK CAA", 
        "AIRBUS 350 UK CAA", "BOEING 787 FAA", "AIRBUS 380 EASA"
      ];
      const aircraftType = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
      
      const hasTeam = Math.random() < 0.6;
      const teams = ["Team Alpha", "Team Beta", "Team Charlie", "Team Delta"];
      const colors = [
        "bg-blue-200 border-blue-400", 
        "bg-green-200 border-green-400", 
        "bg-purple-200 border-purple-400",
        "bg-red-200 border-red-400", 
        "bg-amber-200 border-amber-400"
      ];
      
      randomSchedules.push({
        id: `A${i * 10 + j}`,
        aircraft: aircraftType,
        start: { month: startMonth, day: startDay },
        end: { month: endMonth, day: endDay },
        team: hasTeam ? teams[Math.floor(Math.random() * teams.length)] : null,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    schedules.push({
      hangarId,
      schedules: randomSchedules
    });
  }
  
  return schedules;
};

interface AircraftGanttChartProps {
  scrollLeft: number;
}

export const AircraftGanttChart = ({ scrollLeft }: AircraftGanttChartProps) => {
  const [aircraftSchedules] = useState(generateAircraftSchedules());
  const days = generateDays();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Update scroll position to sync with schedule calendar
  useEffect(() => {
    if (scrollRef.current && scrollRef.current.scrollLeft !== scrollLeft) {
      scrollRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  const calculatePosition = (schedule: any) => {
    const startIdx = days.findIndex(d => d.month === schedule.start.month && d.day === schedule.start.day);
    const endIdx = days.findIndex(d => d.month === schedule.end.month && d.day === schedule.end.day);
    
    if (startIdx === -1 || endIdx === -1) return null;
    
    const startPosition = startIdx * 41 + 220; // 40px for column width + 1px for border, starting after fixed columns
    const width = (endIdx - startIdx + 1) * 41 - 1; // Subtract 1px to account for border
    
    return { startPosition, width };
  };

  const handleAircraftClick = (schedule: any) => {
    setSelectedAircraft(schedule);
    setModalOpen(true);
  };

  return (
    <div className="border rounded-lg">
      <ScrollArea 
        ref={scrollRef} 
        className="h-[300px] rounded-lg"
      >
        <div className="min-w-[2000px]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100 w-[100px]">Hangar</th>
                <th className="p-2 text-left border-r sticky left-[100px] z-20 bg-gray-100 w-[120px]">Bay</th>
                
                {/* Calendar days - same as ScheduleCalendar */}
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
              {hangars.map((hangar) => (
                <tr key={hangar.id} className="border-b h-[40px]">
                  <td className="p-2 border-r sticky left-0 bg-white z-10">{hangar.name.split(" ")[0]}</td>
                  <td className="p-2 border-r sticky left-[100px] bg-white z-10">{hangar.name.split(" ")[1]}</td>
                  
                  {/* Gantt chart container cell */}
                  <td colSpan={days.length} className="relative p-0 h-[40px]">
                    {/* Render weekend backgrounds */}
                    {days.map((day, index) => (
                      <div 
                        key={`bg-${day.month}-${day.day}`}
                        className={`absolute top-0 bottom-0 border-r ${day.isWeekend ? 'bg-gray-50' : ''}`}
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
                                  className={`absolute top-1 h-[32px] ${schedule.color} border rounded cursor-pointer flex items-center justify-center overflow-hidden transition-shadow hover:shadow-md text-xs`}
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
                                  {schedule.start.month === 4 ? 'May' : 'Jun'} {schedule.start.day} - {schedule.end.month === 4 ? 'May' : 'Jun'} {schedule.end.day}, 2025
                                </div>
                                {schedule.team ? (
                                  <div className="text-green-600">Assigned to {schedule.team}</div>
                                ) : (
                                  <div className="text-amber-600">Not assigned to a team</div>
                                )}
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
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl h-4/5">
          <DialogHeader>
            <DialogTitle>Aircraft Details</DialogTitle>
          </DialogHeader>
          
          {selectedAircraft && (
            <div className="space-y-6 overflow-y-auto max-h-full">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Aircraft Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium">{selectedAircraft.aircraft}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Schedule</p>
                        <p className="font-medium">
                          {selectedAircraft.start.month === 4 ? 'May' : 'Jun'} {selectedAircraft.start.day} - {selectedAircraft.end.month === 4 ? 'May' : 'Jun'} {selectedAircraft.end.day}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">
                          {(() => {
                            const startDate = new Date(2025, selectedAircraft.start.month, selectedAircraft.start.day);
                            const endDate = new Date(2025, selectedAircraft.end.month, selectedAircraft.end.day);
                            const diffTime = endDate.getTime() - startDate.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            return `${diffDays} days`;
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium">Scheduled</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Assignment Status</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedAircraft.team ? (
                      <>
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">Assigned Team</p>
                          <p className="font-medium">{selectedAircraft.team}</p>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">Assigned Personnel</p>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              JW
                            </div>
                            <span>James Wilson (Lead)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              SJ
                            </div>
                            <span>Sarah Johnson</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              MB
                            </div>
                            <span>Michael Brown</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-amber-600 font-medium">No team assigned</div>
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Search by name, skill, aircraft type..."
                          className="w-full border rounded-lg p-3 pr-10"
                        />
                        <div className="absolute top-3 right-3 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                        </div>
                      </div>
                    </div>
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left border-b">Select</th>
                          <th className="p-2 text-left border-b">ID</th>
                          <th className="p-2 text-left border-b">Name</th>
                          <th className="p-2 text-left border-b">Skills</th>
                          <th className="p-2 text-left border-b">Certifications</th>
                          <th className="p-2 text-left border-b">Availability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map(idx => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="p-2"><input type="checkbox" className="rounded" /></td>
                            <td className="p-2">EMP00{idx}</td>
                            <td className="p-2">{["James Wilson", "Sarah Johnson", "Michael Brown"][idx-1]}</td>
                            <td className="p-2">{["Avionics", "Airframe", "Engines"][idx-1]}</td>
                            <td className="p-2">{["A320, B777", "B777, B787", "A350, B787"][idx-1]}</td>
                            <td className="p-2">{["Available", "Available", "Training until May 20"][idx-1]}</td>
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
        </DialogContent>
      </Dialog>
    </div>
  );
};
