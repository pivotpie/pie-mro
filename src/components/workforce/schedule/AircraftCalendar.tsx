
import { useState, useRef, useEffect, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { generateDaysForMonths, getFormattedDate } from './calendarUtils';

// Sample hangar data
const hangars = [
  { id: "H1", name: "Hangar 1A" },
  { id: "H2", name: "Hangar 1B" },
  { id: "H3", name: "Hangar 2A" },
  { id: "H4", name: "Hangar 2B" },
  { id: "H5", name: "Hangar 3A" },
  { id: "H6", name: "Hangar 3B" },
];

export const AircraftCalendar = () => {
  const [aircraftSchedules, setAircraftSchedules] = useState<any[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Generate days for May and June 2025
  const days = useMemo(() => generateDaysForMonths(4, 5), []); // 4 = May, 5 = June
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Handle scroll events from the scrollArea
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      // Dispatch a custom event that the employee calendar will listen for
      const scrollEvent = new CustomEvent('aircraft-calendar-scroll', { 
        detail: { scrollLeft: scrollAreaRef.current.scrollLeft } 
      });
      window.dispatchEvent(scrollEvent);
    }
  };

  // Setup scroll event listeners
  useEffect(() => {
    const handleEmployeeScroll = (e: CustomEvent) => {
      if (scrollAreaRef.current && scrollAreaRef.current.scrollLeft !== e.detail.scrollLeft) {
        scrollAreaRef.current.scrollLeft = e.detail.scrollLeft;
      }
    };

    // Add event listener for the custom event
    window.addEventListener('employee-calendar-scroll', handleEmployeeScroll as EventListener);

    return () => {
      window.removeEventListener('employee-calendar-scroll', handleEmployeeScroll as EventListener);
    };
  }, []);

  useEffect(() => {
    // In a real app, fetch from database
    // For now, use sample data
    const sampleSchedules = [
      {
        hangarId: "H1",
        schedules: [
          {
            id: "A1",
            aircraft: "AIRBUS 320 GCAA",
            start: { month: 4, day: 1 },
            end: { month: 4, day: 9 },
            team: "Team Alpha",
            color: "bg-blue-200 border-blue-400 dark:bg-blue-900 dark:border-blue-700"
          }
        ]
      },
      {
        hangarId: "H2",
        schedules: [
          {
            id: "A2",
            aircraft: "AIRBUS 320 FAA",
            start: { month: 4, day: 10 },
            end: { month: 4, day: 20 },
            team: "Team Beta",
            color: "bg-green-200 border-green-400 dark:bg-green-900 dark:border-green-700"
          }
        ]
      },
      {
        hangarId: "H3",
        schedules: [
          {
            id: "A3",
            aircraft: "AIRBUS 350 EASA",
            start: { month: 4, day: 15 },
            end: { month: 4, day: 25 },
            team: null,
            color: "bg-amber-200 border-amber-400 dark:bg-amber-900 dark:border-amber-700"
          }
        ]
      },
      {
        hangarId: "H4",
        schedules: [
          {
            id: "A4",
            aircraft: "BOEING 787 GCAA",
            start: { month: 4, day: 5 },
            end: { month: 4, day: 15 },
            team: "Team Charlie",
            color: "bg-purple-200 border-purple-400 dark:bg-purple-900 dark:border-purple-700"
          }
        ]
      },
      {
        hangarId: "H5",
        schedules: [
          {
            id: "A5",
            aircraft: "BOEING 737 FAA",
            start: { month: 4, day: 20 },
            end: { month: 4, day: 30 },
            team: null,
            color: "bg-red-200 border-red-400 dark:bg-red-900 dark:border-red-700"
          },
          {
            id: "A7",
            aircraft: "BOEING 737 EASA",
            start: { month: 5, day: 1 },
            end: { month: 5, day: 10 },
            team: "Team Delta",
            color: "bg-teal-200 border-teal-400 dark:bg-teal-900 dark:border-teal-700"
          }
        ]
      },
      {
        hangarId: "H6",
        schedules: [
          {
            id: "A6",
            aircraft: "AIRBUS 380 EASA",
            start: { month: 4, day: 8 },
            end: { month: 4, day: 18 },
            team: "Team Alpha",
            color: "bg-cyan-200 border-cyan-400 dark:bg-cyan-900 dark:border-cyan-700"
          },
          {
            id: "A8",
            aircraft: "BOEING 777 FAA",
            start: { month: 5, day: 15 },
            end: { month: 5, day: 25 },
            team: "Team Echo",
            color: "bg-indigo-200 border-indigo-400 dark:bg-indigo-900 dark:border-indigo-700"
          }
        ]
      }
    ];
    
    setAircraftSchedules(sampleSchedules);
  }, []);

  const calculatePosition = (schedule: any) => {
    // Find the position of the start and end days in our array of days
    const startIdx = days.findIndex(d => d.month === schedule.start.month && d.day === schedule.start.day);
    const endIdx = days.findIndex(d => d.month === schedule.end.month && d.day === schedule.end.day);
    
    if (startIdx === -1 || endIdx === -1) return null;
    
    const columnWidth = 41; // 40px for column width + 1px for border
    const startPosition = startIdx * columnWidth + 220; // Starting after fixed columns
    const width = (endIdx - startIdx + 1) * columnWidth - 1; // Subtract 1px to account for border
    
    return { startPosition, width };
  };

  const handleAircraftClick = (schedule: any) => {
    setSelectedAircraft(schedule);
    setModalOpen(true);
  };

  return (
    <div className="border rounded-lg dark:border-gray-700 calendar-container">
      <ScrollArea 
        className="h-[300px] rounded-lg" 
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        <div className="min-w-[2000px]">
          <table className="w-full border-collapse calendar-grid">
            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 w-[120px] sticky-column">Hangar</th>
                <th className="p-2 text-left border-r sticky left-[120px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 w-[100px] sticky-column">Bay</th>
                
                {/* Calendar days - matching EmployeeCalendar */}
                {days.map((day, index) => {
                  const monthName = day.month === 4 ? 'May' : 'June';
                  return (
                    <th 
                      key={`${day.month+1}-${day.day}`} 
                      className={`p-2 text-center border-r min-w-[40px] dark:border-gray-700 dark:text-gray-200
                        ${day.isWeekend ? 'weekend-column' : ''}`}
                    >
                      <div className="text-xs font-medium">{day.day}</div>
                      <div className="text-xs">{monthName}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {hangars.map((hangar) => (
                <tr key={hangar.id} className="border-b h-[40px] dark:border-gray-700">
                  <td className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 sticky-column">{hangar.name.split(" ")[0]}</td>
                  <td className="p-2 border-r sticky left-[120px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 sticky-column">{hangar.name.split(" ")[1]}</td>
                  
                  {/* Gantt chart container cell */}
                  <td colSpan={days.length} className="relative p-0 h-[40px]">
                    {/* Render weekend backgrounds */}
                    {days.map((day, index) => (
                      <div 
                        key={`bg-${day.month}-${day.day}`}
                        className={`absolute top-0 bottom-0 border-r dark:border-gray-700 ${day.isWeekend ? 'weekend-column' : ''}`}
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
                                  <span className="truncate px-1">{schedule.aircraft}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm font-medium">{schedule.aircraft}</div>
                                <div className="text-xs">
                                  {getFormattedDate(schedule.start.day, schedule.start.month)} - {getFormattedDate(schedule.end.day, schedule.end.month)}
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Schedule</p>
                        <p className="font-medium dark:text-gray-200">
                          {getFormattedDate(selectedAircraft.start.day, selectedAircraft.start.month)} - {getFormattedDate(selectedAircraft.end.day, selectedAircraft.end.month)}
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
                        <p className="font-medium dark:text-gray-200">Scheduled</p>
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
