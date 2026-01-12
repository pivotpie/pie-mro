import { useState, useRef, useEffect } from 'react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, eachDayOfInterval, isWeekend, isSameDay, startOfDay, differenceInDays } from "date-fns";
import { AircraftDetailsModal } from "./schedule/AircraftDetailsModal";
import { useRefresh } from '@/contexts/RefreshContext';


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
  borderColor: string;
  visit_number: string;
  check_type: string;
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
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftSchedule | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { refreshTrigger } = useRefresh();


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
        
        // Status-based fill color mapping - Updated with more vibrant colors
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'Completed':
              return 'bg-emerald-200 dark:bg-emerald-800';
            case 'In Progress':
              return 'bg-amber-200 dark:bg-amber-800';
            case 'Scheduled':
              return 'bg-slate-200 dark:bg-slate-700';
            default:
              return 'bg-slate-200 dark:bg-slate-700';
          }
        };

        // Aircraft model-based border color mapping - Updated with new colors
        const getAircraftBorderColor = (aircraftName: string) => {
          const name = aircraftName?.toLowerCase() || '';
          if (name.includes('boeing') || name.includes('b737') || name.includes('b777') || name.includes('b787')) {
            return 'border-indigo-500'; // Boeing = Indigo
          } else if (name.includes('airbus') || name.includes('a320') || name.includes('a350') || name.includes('a380')) {
            return 'border-rose-500'; // Airbus = Rose/Pink
          } else if (name.includes('pa-28') || name.includes('cessna')) {
            return 'border-amber-500'; // Small Aircraft = Amber
          } else if (name.includes('r44') || name.includes('helicopter') || name.includes('adhoc')) {
            return 'border-purple-500'; // Helicopter = Purple
          } else {
            return 'border-gray-400 dark:border-gray-500'; // Other
          }
        };
        
        // Process maintenance visits
        const schedulesByHangar: { hangarId: number, schedules: AircraftSchedule[] }[] = [];
        
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
              
              // Use status-based fill color and aircraft model-based border color
              const fillColor = getStatusColor(visit.status);
              const borderColor = getAircraftBorderColor(visit.aircraft?.aircraft_name || '');
              
              return {
                id: visit.id,
                aircraft: visit.aircraft?.aircraft_name || 'Unknown Aircraft',
                aircraft_id: visit.aircraft?.id,
                hangar_id: visit.hangar_id,
                start: startDate,
                end: endDate,
                team: visit.status === 'In Progress' ? 'Assigned Team' : null,
                status: visit.status || 'Scheduled',
                registration: visit.aircraft?.registration || 'UNKNOWN',
                customer: visit.aircraft?.customer || 'Unknown Operator',
                color: fillColor,
                borderColor: borderColor,
                visit_number: visit.visit_number || 'N/A',
                check_type: visit.check_type || 'Standard Check'
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
  }, [startDate, endDate, refreshTrigger]); // Dependency on date range

  // Generate enhanced mock data based on the reference image with status-based colors and aircraft model-based borders
  const generateEnhancedMockData = (hangars: HangarData[]) => {
    const mockData: { hangarId: number, schedules: AircraftSchedule[] }[] = [];
    
    // Complete mock data based on reference image
    const aircraftAssignments = [
      // Hangar 4A
      { hangar: 'Hangar 4A', aircraft: 'AIRBUS 320', authority: 'UKCAA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 4A', aircraft: 'BOEING 737', authority: 'GCAA', startDay: 11, startMonth: 4, endDay: 20, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 4A', aircraft: 'PA-28', authority: 'UKCAA', startDay: 21, startMonth: 4, endDay: 25, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 4A', aircraft: 'AIRBUS 350', authority: 'UK CAA', startDay: 26, startMonth: 4, endDay: 14, endMonth: 5, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 4A', aircraft: 'BOEING 787', authority: 'UK CAA', startDay: 15, startMonth: 5, endDay: 24, endMonth: 5, year: 2025, status: 'Scheduled' },
      { hangar: 'Hangar 4A', aircraft: 'ADHOC R44', authority: 'GCAA', startDay: 25, startMonth: 5, endDay: 30, endMonth: 5, year: 2025, status: 'Scheduled' },
      
      // Hangar 4B
      { hangar: 'Hangar 4B', aircraft: 'AIRBUS 350', authority: 'GCAA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 4B', aircraft: 'BOEING 787', authority: 'EASA', startDay: 11, startMonth: 4, endDay: 20, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 4B', aircraft: 'AIRBUS 320', authority: 'FAA', startDay: 21, startMonth: 4, endDay: 31, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 4B', aircraft: 'BOEING 777', authority: 'GCAA', startDay: 1, startMonth: 5, endDay: 10, endMonth: 5, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 4B', aircraft: 'AIRBUS 350', authority: 'UK CAA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025, status: 'Scheduled' },
      { hangar: 'Hangar 4B', aircraft: 'AIRBUS 320', authority: 'GCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025, status: 'Scheduled' },
      
      // Hangar 3A
      { hangar: 'Hangar 3A', aircraft: 'ADHOC R44', authority: 'GCAA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 3A', aircraft: 'BOEING 787', authority: 'GCAA', startDay: 11, startMonth: 4, endDay: 20, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 3A', aircraft: 'BOEING 787', authority: 'UKCAA', startDay: 21, startMonth: 4, endDay: 25, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 3A', aircraft: 'BOEING 737', authority: 'GCAA', startDay: 26, startMonth: 4, endDay: 10, endMonth: 5, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 3A', aircraft: 'AIRBUS 380', authority: 'EASA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025, status: 'Scheduled' },
      { hangar: 'Hangar 3A', aircraft: 'A380', authority: 'GCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025, status: 'Scheduled' },
      
      // Hangar 3B
      { hangar: 'Hangar 3B', aircraft: 'AIRBUS 320', authority: 'UKCAA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 3B', aircraft: 'AIRBUS 380', authority: 'GCAA', startDay: 11, startMonth: 4, endDay: 20, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 3B', aircraft: 'BOEING 777', authority: 'FAA', startDay: 21, startMonth: 4, endDay: 30, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 3B', aircraft: 'BOEING 777', authority: 'EASA', startDay: 1, startMonth: 5, endDay: 10, endMonth: 5, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 3B', aircraft: 'BOEING 777', authority: 'GCAA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025, status: 'Scheduled' },
      { hangar: 'Hangar 3B', aircraft: 'AIRBUS 320', authority: 'GCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025, status: 'Scheduled' },
      
      // Hangar 2A
      { hangar: 'Hangar 2A', aircraft: 'A350', authority: 'GCAA', startDay: 1, startMonth: 4, endDay: 5, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 2A', aircraft: 'BOEING 737', authority: 'GCAA', startDay: 6, startMonth: 4, endDay: 10, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 2A', aircraft: 'B787', authority: 'UK CAA', startDay: 11, startMonth: 4, endDay: 15, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 2A', aircraft: 'AIRBUS 380', authority: 'EASA', startDay: 16, startMonth: 4, endDay: 20, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 2A', aircraft: 'BOEING 737', authority: 'UKCAA', startDay: 21, startMonth: 4, endDay: 25, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 2A', aircraft: 'BOEING 777', authority: 'EASA', startDay: 26, startMonth: 4, endDay: 31, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 2A', aircraft: 'PA-28', authority: 'UKCAA', startDay: 1, startMonth: 5, endDay: 10, endMonth: 5, year: 2025, status: 'Scheduled' },
      { hangar: 'Hangar 2A', aircraft: 'AIRBUS 350', authority: 'UK CAA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025, status: 'Scheduled' },
      { hangar: 'Hangar 2A', aircraft: 'BOEING 737', authority: 'GCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025, status: 'Scheduled' },
      
      // Hangar 2B
      { hangar: 'Hangar 2B', aircraft: 'BOEING 787', authority: 'EASA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 2B', aircraft: 'A320', authority: 'UKCAA', startDay: 11, startMonth: 4, endDay: 15, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 2B', aircraft: 'BOEING 777', authority: 'GCAA', startDay: 16, startMonth: 4, endDay: 20, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 2B', aircraft: 'ADHOC R44', authority: 'GCAA', startDay: 21, startMonth: 4, endDay: 25, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 2B', aircraft: 'AIRBUS 350', authority: 'GCAA', startDay: 26, startMonth: 4, endDay: 31, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 2B', aircraft: 'BOEING 787', authority: 'GCAA', startDay: 1, startMonth: 5, endDay: 10, endMonth: 5, year: 2025, status: 'Scheduled' },
      { hangar: 'Hangar 2B', aircraft: 'BOEING 350', authority: 'GCAA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025, status: 'Scheduled' },
      { hangar: 'Hangar 2B', aircraft: 'BOEING 737', authority: 'UKCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025, status: 'Scheduled' },
      
      // Hangar 1A
      { hangar: 'Hangar 1A', aircraft: 'B787', authority: 'UKCAA', startDay: 1, startMonth: 4, endDay: 10, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 1A', aircraft: 'AIRBUS 350', authority: 'FAA', startDay: 11, startMonth: 4, endDay: 15, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 1A', aircraft: 'PA-28', authority: 'GCAA', startDay: 16, startMonth: 4, endDay: 22, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 1A', aircraft: 'AIRBUS 320', authority: 'FAA', startDay: 23, startMonth: 4, endDay: 26, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 1A', aircraft: 'BOEING 777', authority: 'GCAA', startDay: 27, startMonth: 4, endDay: 10, endMonth: 5, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 1A', aircraft: 'AIRBUS 380', authority: 'GCAA', startDay: 11, startMonth: 5, endDay: 20, endMonth: 5, year: 2025, status: 'Scheduled' },
      { hangar: 'Hangar 1A', aircraft: 'BOEING 737', authority: 'UKCAA', startDay: 21, startMonth: 5, endDay: 30, endMonth: 5, year: 2025, status: 'Scheduled' },
      
      // Hangar 1B
      { hangar: 'Hangar 1B', aircraft: 'AIRBUS 380', authority: 'EASA', startDay: 1, startMonth: 4, endDay: 5, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 1B', aircraft: 'BOEING 777', authority: 'GCAA', startDay: 6, startMonth: 4, endDay: 10, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 1B', aircraft: 'AIRBUS 350', authority: 'UK CAA', startDay: 11, startMonth: 4, endDay: 20, endMonth: 4, year: 2025, status: 'Completed' },
      { hangar: 'Hangar 1B', aircraft: 'BOEING 777', authority: 'UKCAA', startDay: 21, startMonth: 4, endDay: 30, endMonth: 4, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 1B', aircraft: 'AIRBUS 320', authority: 'FAA', startDay: 1, startMonth: 5, endDay: 15, endMonth: 5, year: 2025, status: 'In Progress' },
      { hangar: 'Hangar 1B', aircraft: 'AIRBUS 380', authority: 'GCAA', startDay: 16, startMonth: 5, endDay: 30, endMonth: 5, year: 2025, status: 'Scheduled' }
    ];
    
    // Use status-based fill color mapping
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Completed':
          return 'bg-emerald-200 dark:bg-emerald-800';
        case 'In Progress':
          return 'bg-amber-200 dark:bg-amber-800';
        case 'Scheduled':
          return 'bg-slate-200 dark:bg-slate-700';
        default:
          return 'bg-slate-200 dark:bg-slate-700';
      }
    };

    // Aircraft model-based border color mapping
    const getAircraftBorderColor = (aircraftName: string) => {
      const name = aircraftName.toLowerCase();
      if (name.includes('boeing') || name.includes('b737') || name.includes('b777') || name.includes('b787')) {
        return 'border-indigo-500';
      } else if (name.includes('airbus') || name.includes('a320') || name.includes('a350') || name.includes('a380')) {
        return 'border-rose-500';
      } else if (name.includes('pa-28') || name.includes('cessna')) {
        return 'border-amber-500';
      } else if (name.includes('r44') || name.includes('helicopter') || name.includes('adhoc')) {
        return 'border-purple-500';
      } else {
        return 'border-gray-400 dark:border-gray-500';
      }
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
          team: assignment.status === 'In Progress' ? 'Assigned Team' : null,
          status: assignment.status,
          registration: `${assignment.authority}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          customer: assignment.authority,
          color: getStatusColor(assignment.status),
          borderColor: getAircraftBorderColor(assignment.aircraft),
          visit_number: `MV${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          check_type: 'Maintenance Check'
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

  // Calculate position and width based on actual dates
  const calculatePosition = (schedule: AircraftSchedule) => {
    const chartStartDate = startOfDay(days[0].date);
    const scheduleStartDate = startOfDay(new Date(schedule.start));
    const scheduleEndDate = startOfDay(new Date(schedule.end));
    
    const startDaysDifference = differenceInDays(scheduleStartDate, chartStartDate);
    const durationInDays = differenceInDays(scheduleEndDate, scheduleStartDate) + 1; // +1 to include both start and end days
    
    // Ensure we don't go negative or beyond the visible range
    const startIdx = Math.max(0, startDaysDifference);
    const actualDuration = Math.max(1, durationInDays); // Minimum 1 day
    
    // Each day column is exactly 48px wide (w-12 = 3rem = 48px)
    const dayWidth = 48;
    
    // Calculate the start position for the card
    const startPosition = startIdx * dayWidth;
    
    // Calculate the width based on actual duration
    const width = actualDuration * dayWidth;
    
    return { startPosition, width, duration: actualDuration };
  };

  const handleAircraftClick = (schedule: AircraftSchedule) => {
    setSelectedAircraft(schedule);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAircraft(null);
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
        <div className="flex min-w-fit">
          {/* Fixed left columns */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 sticky left-0 z-20 border-r dark:border-gray-700">
            <table className="border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr className="h-12">
                  <th className="p-2 text-left border-r dark:border-gray-700 dark:text-gray-200 w-24">Hangar</th>
                  <th className="p-2 text-left border-r dark:border-gray-700 dark:text-gray-200 w-16">Bay</th>
                </tr>
              </thead>
              <tbody>
                {hangars.map((hangar) => (
                  <tr key={hangar.id} className="border-b h-12 dark:border-gray-700">
                    <td className="p-2 border-r dark:border-gray-700 dark:text-gray-300 h-12 w-24">{hangar.name.split(" ")[0]}</td>
                    <td className="p-2 border-r dark:border-gray-700 dark:text-gray-300 h-12 w-16">{hangar.name.split(" ")[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scrollable calendar section */}
          <div className="flex-1 min-w-fit">
            <div className="relative">
              {/* Header with dates */}
              <div className="bg-gray-100 dark:bg-gray-800 h-12 flex sticky top-0 z-10">
                {days.map((day) => (
                  <div 
                    key={`${day.year}-${day.month+1}-${day.day}`} 
                    className={`p-1 text-center border-r w-12 h-12 flex-shrink-0 dark:border-gray-700 dark:text-gray-200 flex flex-col justify-center
                      ${day.isWeekend ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  >
                    <div className="text-xs font-medium">{day.day}</div>
                    <div className="text-xs">{format(day.date, 'MMM')}</div>
                  </div>
                ))}
              </div>

              {/* Gantt chart rows */}
              <div className="relative">
                {hangars.map((hangar, hangarIndex) => (
                  <div key={hangar.id} className="relative border-b h-12 dark:border-gray-700">
                    {/* Background day cells */}
                    <div className="flex h-12">
                      {days.map((day) => (
                        <div 
                          key={`${hangar.id}-${day.year}-${day.month}-${day.day}`}
                          className={`w-12 h-12 border-r dark:border-gray-700 flex-shrink-0 ${day.isWeekend ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                        />
                      ))}
                    </div>

                    {/* Aircraft schedule cards overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {aircraftSchedules
                        .find(item => item.hangarId === hangar.id)
                        ?.schedules.map(schedule => {
                          const position = calculatePosition(schedule);
                          
                          return (
                            <TooltipProvider key={schedule.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={`absolute top-1 h-10 ${schedule.color} ${schedule.borderColor} border-3 rounded cursor-pointer flex items-center justify-center overflow-hidden transition-shadow hover:shadow-md text-xs dark:text-gray-200 pointer-events-auto`}
                                    style={{
                                      left: `${position.startPosition}px`,
                                      width: `${position.width}px`,
                                    }}
                                    onClick={() => handleAircraftClick(schedule)}
                                  >
                                    <span className="truncate px-1 font-medium text-center">
                                      {schedule.registration}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm font-medium">{schedule.aircraft}</div>
                                  <div className="text-xs">{schedule.registration} - {schedule.customer}</div>
                                  <div className="text-xs">
                                    {format(schedule.start, 'dd MMM yyyy')} - {format(schedule.end, 'dd MMM yyyy')}
                                  </div>
                                  <div className="text-xs">Duration: {position.duration} days</div>
                                  <div className="text-xs font-medium mt-1">
                                    Status: <span className={`${
                                      schedule.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' :
                                      schedule.status === 'In Progress' ? 'text-amber-600 dark:text-amber-400' :
                                      'text-slate-600 dark:text-slate-400'
                                    }`}>{schedule.status}</span>
                                  </div>
                                  <div className="text-xs">Visit: {schedule.visit_number}</div>
                                  <div className="text-xs">Check: {schedule.check_type}</div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Add horizontal scroll bar */}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Aircraft Details Modal - Fixed prop names */}
      <AircraftDetailsModal 
        open={modalOpen}
        onOpenChange={setModalOpen}
        aircraft={selectedAircraft}
      />
    </div>
  );
};
