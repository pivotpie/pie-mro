
import { useState } from 'react';
import { AircraftGanttChart } from "../AircraftGanttChart";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDownIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDate } from "@/contexts/DateContext";
import { useRefresh } from '@/contexts/RefreshContext';


export const AircraftCalendar = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const { currentDate, setCurrentDate } = useDate();
  const { refreshTrigger } = useRefresh();


  // Handler to receive scroll position updates from the calendar
  const handleCalendarScroll = (position: number) => {
    setScrollPosition(position);
  };

  const handleExportSchedule = () => {
    toast.success("Schedule export started", {
      description: "Your export will be ready to download shortly."
    });
  };

  const handlePrevious = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2025, 4, 1)); // Reset to demo date
  };

  // Format the current month and year for display
  const monthYearDisplay = format(currentDate, 'MMMM yyyy');
  
  // Calculate start and end dates for the view
  const viewStartDate = startOfMonth(currentDate);
  const viewEndDate = endOfMonth(addMonths(currentDate, 1)); // Show two months

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        {/* Horizontal Legend Layout */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {/* Status indicators */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <span className="w-3 h-3 mr-1 rounded-sm bg-emerald-200 dark:bg-emerald-800 border border-emerald-400 dark:border-emerald-600"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 mr-1 rounded-sm bg-amber-200 dark:bg-amber-800 border border-amber-400 dark:border-amber-600"></span>
              <span>In Progress</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 mr-1 rounded-sm bg-slate-200 dark:bg-slate-700 border border-slate-400 dark:border-slate-600"></span>
              <span>Scheduled</span>
            </div>
          </div>
          
          {/* Aircraft type border indicators */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <span className="w-3 h-3 mr-1 rounded-sm bg-white dark:bg-gray-900 border-3 border-indigo-500"></span>
              <span>Boeing</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 mr-1 rounded-sm bg-white dark:bg-gray-900 border-3 border-rose-500"></span>
              <span>Airbus</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 mr-1 rounded-sm bg-white dark:bg-gray-900 border-3 border-amber-500"></span>
              <span>Small Aircraft</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 mr-1 rounded-sm bg-white dark:bg-gray-900 border-3 border-purple-500"></span>
              <span>Helicopter</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 mr-1 rounded-sm bg-white dark:bg-gray-900 border-3 border-gray-400 dark:border-gray-500"></span>
              <span>Other</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-1">Previous</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <span className="sr-only md:not-sr-only md:mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="hidden md:block min-w-[150px] text-center font-medium">
            {monthYearDisplay} - {format(addMonths(currentDate, 1), 'MMMM yyyy')}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 ml-2"
            onClick={handleExportSchedule}
          >
            <FileDownIcon className="h-4 w-4" />
            Export Schedule
          </Button>
        </div>
      </div>
      
      {/* Set fixed height for the chart container */}
      <div className="w-full border rounded-lg dark:border-gray-700 overflow-x-auto">
        <ScrollArea className="h-full">
          <div className="min-w-full h-full">
            <AircraftGanttChart 
              scrollLeft={scrollPosition} 
              startDate={viewStartDate} 
              endDate={viewEndDate}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
