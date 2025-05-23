
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, eachDayOfInterval, isWeekend, isSameDay, startOfDay, isEqual } from "date-fns";

// Helper function to generate days between two dates
const generateDaysBetween = (startDate: Date, endDate: Date) => {
  return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
    isWeekend: isWeekend(date),
    date: new Date(date)
  }));
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
  start: Date;
  end: Date;
  team: string | null;
  status: string;
  registration: string;
  customer: string;
  color: string;
}

interface AircraftGanttChartProps {
  scrollLeft: number;
  startDate: Date;
  endDate: Date;
}

export const AircraftGanttChart = ({ scrollLeft, startDate, endDate }: AircraftGanttChartProps) => {
  const [hangars, setHangars] = useState<HangarData[]>([]);
  const [aircraftSchedules, setAircraftSchedules] = useState<{ hangarId: number, schedules: AircraftSchedule[] }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const days = generateDaysBetween(startDate, endDate);
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
          .order('date_in');
          
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
                startDate = visit.date_in ? new Date(visit.date_in) : new Date();
                endDate = visit.date_out ? new Date(visit.date_out) : new Date(new Date().getTime() + 86400000);
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
                start: startDate,
                end: endDate,
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
        
        // Enhanced mock data based on the reference image
        const mockData = generateEnhancedMockData(processedHangars);
        
        // Merge existing data with mock data
        mockData.forEach(mockHangarData => {
          const existingHangarData = schedulesByHangar.find(h => h.hangarId === mockHangarData.hangarId);
          if (existingHangarData) {
            // Add mock schedules that don't overlap with existing ones
            mockHangarData.schedules.forEach(mockSchedule => {
              // Check if there's an existing schedule with significant overlap
              const hasOverlap = existingHangarData.schedules.some(existingSchedule => {
                return (mockSchedule.start <= existingSchedule.end && mockSchedule.end >= existingSchedule.start);
              });
              
              if (!hasOverlap) {
                existingHangarData.schedules.push(mockSchedule);
              }
            });
          } else {
            schedulesByHangar.push(mockHangarData);
          }
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
  }, [startDate, endDate]); // Dependency on date range

  // Generate enhanced mock data based on the reference image with more detailed flights
  const generateEnhancedMockData = (hangars: HangarData[]) => {
    const mockData: { hangarId: number, schedules: AircraftSchedule[] }[] = [];
    
    // Complete mock data based on reference image
    const aircraftAssignments = [
      // Hangar 4A
      { hangar: 'Hangar 4A', aircraft: 'AIRBUS 320', authority: 'UKCAA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 4A', aircraft: 'BOEING 737', authority: 'GCAA', startDay: 11, startMonth: 4, endDay: 20, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 4A', aircraft: 'PA-28', authority: 'UKCAA', startDay: 21, startMonth: 4, endDay: 25, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 4A', aircraft: 'AIRBUS 350', authority: 'UK CAA', startDay: 26, startMonth: 4, endDay: 14, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 4A', aircraft: 'BOEING 787', authority: 'UK CAA', startDay: 15, startMonth: 5, endDay: 24, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 4A', aircraft: 'ADHOC R44', authority: 'GCAA', startDay: 25, startMonth: 5, endDay: 30, endMonth: 5, year: 2025 },
      
      // Hangar 4B
      { hangar: 'Hangar 4B', aircraft: 'AIRBUS 350', authority: 'GCAA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 4B', aircraft: 'BOEING 787', authority: 'EASA', startDay: 11, startMonth: 4, endDay: 20, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 4B', aircraft: 'AIRBUS 320', authority: 'FAA', startDay: 21, startMonth: 4, endDay: 31, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 4B', aircraft: 'BOEING 777', authority: 'GCAA', startDay: 1, startMonth: 5, endDay: 10, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 4B', aircraft: 'AIRBUS 350', authority: 'UK CAA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 4B', aircraft: 'AIRBUS 320', authority: 'GCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025 },
      
      // Hangar 3A
      { hangar: 'Hangar 3A', aircraft: 'ADHOC R44', authority: 'GCAA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 3A', aircraft: 'BOEING 787', authority: 'GCAA', startDay: 11, startMonth: 4, endDay: 20, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 3A', aircraft: 'BOEING 787', authority: 'UKCAA', startDay: 21, startMonth: 4, endDay: 25, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 3A', aircraft: 'BOEING 737', authority: 'GCAA', startDay: 26, startMonth: 4, endDay: 10, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 3A', aircraft: 'AIRBUS 380', authority: 'EASA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 3A', aircraft: 'A380', authority: 'GCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025 },
      
      // Hangar 3B
      { hangar: 'Hangar 3B', aircraft: 'AIRBUS 320', authority: 'UKCAA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 3B', aircraft: 'AIRBUS 380', authority: 'GCAA', startDay: 11, startMonth: 4, endDay: 20, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 3B', aircraft: 'BOEING 777', authority: 'FAA', startDay: 21, startMonth: 4, endDay: 30, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 3B', aircraft: 'BOEING 777', authority: 'EASA', startDay: 1, startMonth: 5, endDay: 10, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 3B', aircraft: 'BOEING 777', authority: 'GCAA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 3B', aircraft: 'AIRBUS 320', authority: 'GCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025 },
      
      // Hangar 2A
      { hangar: 'Hangar 2A', aircraft: 'A350', authority: 'GCAA', startDay: 1, startMonth: 4, endDay: 5, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2A', aircraft: 'BOEING 737', authority: 'GCAA', startDay: 6, startMonth: 4, endDay: 10, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2A', aircraft: 'B787', authority: 'UK CAA', startDay: 11, startMonth: 4, endDay: 15, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2A', aircraft: 'AIRBUS 380', authority: 'EASA', startDay: 16, startMonth: 4, endDay: 20, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2A', aircraft: 'BOEING 737', authority: 'UKCAA', startDay: 21, startMonth: 4, endDay: 25, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2A', aircraft: 'BOEING 777', authority: 'EASA', startDay: 26, startMonth: 4, endDay: 31, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2A', aircraft: 'PA-28', authority: 'UKCAA', startDay: 1, startMonth: 5, endDay: 10, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 2A', aircraft: 'AIRBUS 350', authority: 'UK CAA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 2A', aircraft: 'BOEING 737', authority: 'GCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025 },
      
      // Hangar 2B
      { hangar: 'Hangar 2B', aircraft: 'BOEING 787', authority: 'EASA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2B', aircraft: 'A320', authority: 'UKCAA', startDay: 11, startMonth: 4, endDay: 15, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2B', aircraft: 'BOEING 777', authority: 'GCAA', startDay: 16, startMonth: 4, endDay: 20, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2B', aircraft: 'ADHOC R44', authority: 'GCAA', startDay: 21, startMonth: 4, endDay: 25, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2B', aircraft: 'AIRBUS 350', authority: 'GCAA', startDay: 26, startMonth: 4, endDay: 31, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 2B', aircraft: 'BOEING 787', authority: 'GCAA', startDay: 1, startMonth: 5, endDay: 10, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 2B', aircraft: 'BOEING 350', authority: 'GCAA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 2B', aircraft: 'BOEING 737', authority: 'UKCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025 },
      
      // Hangar 1A
      { hangar: 'Hangar 1A', aircraft: 'B787', authority: 'UKCAA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 1A', aircraft: 'AIRBUS 350', authority: 'FAA', startDay: 11, startMonth: 4, endDay: 15, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 1A', aircraft: 'PA-28', authority: 'GCAA', startDay: 16, startMonth: 4, endDay: 22, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 1A', aircraft: 'AIRBUS 320', authority: 'FAA', startDay: 23, startMonth: 4, endDay: 26, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 1A', aircraft: 'BOEING 777', authority: 'GCAA', startDay: 27, startMonth: 4, endDay: 10, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 1A', aircraft: 'AIRBUS 380', authority: 'GCAA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 1A', aircraft: 'BOEING 737', authority: 'UKCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025 },
      
      // Hangar 1B
      { hangar: 'Hangar 1B', aircraft: 'AIRBUS 380', authority: 'EASA', startDay: 1, startMonth: 4, endDay: 5, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 1B', aircraft: 'BOEING 777', authority: 'GCAA', startDay: 6, startMonth: 4, endDay: 10, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 1B', aircraft: 'AIRBUS 350', authority: 'UK CAA', startDay: 11, startMonth: 4, endDay: 20, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 1B', aircraft: 'BOEING 777', authority: 'UKCAA', startDay: 21, startMonth: 4, endDay: 30, endMonth: 4, year: 2025 },
      { hangar: 'Hangar 1B', aircraft: 'AIRBUS 320', authority: 'FAA', startDay: 1, startMonth: 5, endDay: 15, endMonth: 5, year: 2025 },
      { hangar: 'Hangar 1B', aircraft: 'AIRBUS 380', authority: 'GCAA', startDay: 16, startMonth: 5, endDay: 30, endMonth: 5, year: 2025 }
    ];
    
    // Map aircraft type to color
    const getColor = (aircraft: string) => {
      if (aircraft.includes('A320') || aircraft.includes('AIRBUS 320')) return 'bg-blue-200 border-blue-400 dark:bg-blue-900 dark:border-blue-700';
      if (aircraft.includes('A350') || aircraft.includes('AIRBUS 350') || aircraft.includes('350')) return 'bg-green-200 border-green-400 dark:bg-green-900 dark:border-green-700';
      if (aircraft.includes('A380') || aircraft.includes('AIRBUS 380') || aircraft.includes('380')) return 'bg-amber-200 border-amber-400 dark:bg-amber-900 dark:border-amber-700';
      if (aircraft.includes('737') || aircraft.includes('BOEING 737')) return 'bg-purple-200 border-purple-400 dark:bg-purple-900 dark:border-purple-700';
      if (aircraft.includes('777') || aircraft.includes('BOEING 777')) return 'bg-red-200 border-red-400 dark:bg-red-900 dark:border-red-700';
      if (aircraft.includes('787') || aircraft.includes('BOEING 787') || aircraft.includes('B787')) return 'bg-cyan-200 border-cyan-400 dark:bg-cyan-900 dark:border-cyan-700';
      if (aircraft.includes('PA-28') || aircraft.includes('PA28')) return 'bg-emerald-200 border-emerald-400 dark:bg-emerald-900 dark:border-emerald-700';
      if (aircraft.includes('R44') || aircraft.includes('ADHOC R44')) return 'bg-pink-200 border-pink-400 dark:bg-pink-900 dark:border-pink-700';
      return 'bg-gray-200 border-gray-400 dark:bg-gray-900 dark:border-gray-700';
    };
    
    // Process assignments into mock data structure
    aircraftAssignments.forEach(assignment => {
      const hangarName = assignment.hangar;
      const hangar = hangars.find(h => h.name === hangarName);
      
      if (hangar) {
        const hangarId = hangar.id;
        const existingHangarData = mockData.find(d => d.hangarId === hangarId);
        
        // Create Date objects for start and end
        const startDate = new Date(assignment.year, assignment.startMonth, assignment.startDay);
        const endDate = new Date(assignment.year, assignment.endMonth, assignment.endDay);
        
        const aircraftSchedule: AircraftSchedule = {
          id: `mock-${Math.random().toString(36).substr(2, 9)}`,
          aircraft: assignment.aircraft,
          aircraft_id: 0,
          hangar_id: hangarId,
          start: startDate,
          end: endDate,
          team: null,
          status: 'Scheduled',
          registration: `${assignment.authority}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          customer: assignment.authority,
          color: getColor(assignment.aircraft)
        };
        
        if (existingHangarData) {
          existingHangarData.schedules.push(aircraftSchedule);
        } else {
          mockData.push({
            hangarId,
            schedules: [aircraftSchedule]
          });
        }
      }
    });
    
    return mockData;
  };

  // Update scroll position to sync with schedule calendar
  useEffect(() => {
    if (scrollAreaRef.current && scrollAreaRef.current.scrollLeft !== scrollLeft) {
      scrollAreaRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  const calculatePosition = (schedule: AircraftSchedule) => {
    // Debug the schedule
    console.log('Calculating position for schedule:', {
      id: schedule.id,
      start: schedule.start,
      end: schedule.end,
      registration: schedule.registration
    });
    
    // Make sure the dates are processed correctly
    const scheduleStartDay = startOfDay(new Date(schedule.start));
    const scheduleEndDay = startOfDay(new Date(schedule.end));

    console.log('Date ranges:', {
      scheduleStartDay: format(scheduleStartDay, 'yyyy-MM-dd'),
      scheduleEndDay: format(scheduleEndDay, 'yyyy-MM-dd'),
      chartFirstDay: days.length > 0 ? format(days[0].date, 'yyyy-MM-dd') : 'none',
      chartLastDay: days.length > 0 ? format(days[days.length-1].date, 'yyyy-MM-dd') : 'none',
      totalDays: days.length
    });
    
    let startIdx = -1;
    let endIdx = -1;
    
    // Find exact matches for start and end dates
    for (let i = 0; i < days.length; i++) {
      const currentDay = startOfDay(days[i].date);
      
      if (startIdx === -1 && isSameDay(currentDay, scheduleStartDay)) {
        startIdx = i;
        console.log(`Found start date at index ${i}: ${format(currentDay, 'yyyy-MM-dd')}`);
      }
      
      if (isSameDay(currentDay, scheduleEndDay)) {
        endIdx = i;
        console.log(`Found end date at index ${i}: ${format(currentDay, 'yyyy-MM-dd')}`);
        // Once we find the end date, we can break the loop
        break;
      }
    }
    
    // If exact match not found, find closest date (should not happen with correctly formatted dates)
    if (startIdx === -1) {
      for (let i = 0; i < days.length; i++) {
        const currentDay = startOfDay(days[i].date);
        // If the current day is on or after the schedule start
        if (currentDay >= scheduleStartDay) {
          startIdx = i;
          console.log(`No exact match for start date, using closest date at index ${i}: ${format(currentDay, 'yyyy-MM-dd')}`);
          break;
        }
      }
      
      // If still not found, schedule starts before the visible range
      if (startIdx === -1) {
        startIdx = 0;
        console.log('Schedule starts before visible range, using index 0');
      }
    }
    
    // If end date not found, find closest date
    if (endIdx === -1) {
      for (let i = days.length - 1; i >= 0; i--) {
        const currentDay = startOfDay(days[i].date);
        // If the current day is on or before the schedule end
        if (currentDay <= scheduleEndDay) {
          endIdx = i;
          console.log(`No exact match for end date, using closest date at index ${i}: ${format(currentDay, 'yyyy-MM-dd')}`);
          break;
        }
      }
      
      // If still not found, schedule ends after the visible range
      if (endIdx === -1) {
        endIdx = days.length - 1;
        console.log('Schedule ends after visible range, using last index');
      }
    }
    
    // Ensure endIdx is not before startIdx
    if (endIdx < startIdx) {
      console.log(`Fixing invalid range: endIdx (${endIdx}) < startIdx (${startIdx})`);
      endIdx = startIdx;
    }
    
    // Calculate position - each day column is exactly 40px wide
    const dayWidth = 40;
    const fixedColumnsWidth = 220; // Hangar (120px) + Bay (100px) columns
    
    // Position calculation: start at the beginning of the start day
    const startPosition = startIdx * dayWidth + fixedColumnsWidth;
    const width = (endIdx - startIdx + 1) * dayWidth;
    
    console.log('Final position calculated:', {
      startIdx,
      endIdx,
      startPosition,
      width,
      dayWidth,
      fixedColumnsWidth
    });
    
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
      <div className="flex items-center justify-center h-full border rounded-lg dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading aircraft schedule data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border rounded-lg dark:border-gray-700">
      <ScrollArea 
        className="h-full rounded-lg"
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        <div className="min-w-[2800px] h-full">
          <table className="w-full border-collapse h-full">
            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="p-2 text-left border-r sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 w-[120px]">Hangar</th>
                <th className="p-2 text-left border-r sticky left-[120px] z-20 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 w-[100px]">Bay</th>
                
                {/* Calendar days - each column is exactly 40px wide */}
                {days.map((day, index) => (
                  <th 
                    key={`${day.year}-${day.month+1}-${day.day}`} 
                    className={`p-1 text-center border-r w-[40px] min-w-[40px] max-w-[40px] dark:border-gray-700 dark:text-gray-200
                      ${day.isWeekend ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  >
                    <div className="text-xs font-medium">{day.day}</div>
                    <div className="text-xs">{format(day.date, 'MMM')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="h-full">
              {hangars.map((hangar) => (
                <tr key={hangar.id} className="border-b h-[40px] dark:border-gray-700">
                  <td className="p-2 border-r sticky left-0 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 h-[40px]">{hangar.name.split(" ")[0]}</td>
                  <td className="p-2 border-r sticky left-[120px] bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 z-10 h-[40px]">{hangar.name.split(" ")[1]}</td>
                  
                  {/* Gantt chart container cell spanning across all days */}
                  <td colSpan={days.length} className="relative p-0 h-[40px]">
                    {/* Render day grid backgrounds */}
                    {days.map((day, index) => (
                      <div 
                        key={`bg-${day.year}-${day.month}-${day.day}`}
                        className={`absolute top-0 bottom-0 border-r dark:border-gray-700 ${day.isWeekend ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                        style={{
                          left: `${index * 40}px`,
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
                                  className={`absolute top-[2px] h-[36px] ${schedule.color} border rounded cursor-pointer flex items-center justify-center overflow-hidden transition-shadow hover:shadow-md text-xs dark:text-gray-200`}
                                  style={{
                                    left: `${position.startPosition}px`,
                                    width: `${position.width}px`,
                                  }}
                                  onClick={() => handleAircraftClick(schedule)}
                                >
                                  <span className="truncate px-1 font-medium">{schedule.registration}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm font-medium">{schedule.aircraft}</div>
                                <div className="text-xs">{schedule.registration} - {schedule.customer}</div>
                                <div className="text-xs">
                                  {format(schedule.start, 'dd MMM yyyy')} - {format(schedule.end, 'dd MMM yyyy')}
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
                          {format(selectedAircraft.start, 'dd MMM yyyy')} - {format(selectedAircraft.end, 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="font-medium dark:text-gray-200">
                          {Math.floor((selectedAircraft.end.getTime() - selectedAircraft.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
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
