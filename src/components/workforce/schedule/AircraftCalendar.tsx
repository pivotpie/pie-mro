
import { useState } from 'react';
import { AircraftGanttChart } from "../AircraftGanttChart";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDownIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AircraftCalendar = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4, 1)); // May 2025

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
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2025, 4, 1)); // Reset to May 2025
  };

  // Format the current month and year for display
  const monthYearDisplay = format(currentDate, 'MMMM yyyy');
  
  // Calculate start and end dates for the view
  const viewStartDate = startOfMonth(currentDate);
  const viewEndDate = endOfMonth(addMonths(currentDate, 1)); // Show two months

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-sm bg-blue-200 dark:bg-blue-900 border border-blue-400 dark:border-blue-700"></span>
            <span>A320</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-sm bg-green-200 dark:bg-green-900 border border-green-400 dark:border-green-700"></span>
            <span>A350</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-sm bg-amber-200 dark:bg-amber-900 border border-amber-400 dark:border-amber-700"></span>
            <span>A380</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-sm bg-purple-200 dark:bg-purple-900 border border-purple-400 dark:border-purple-700"></span>
            <span>B737</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-sm bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700"></span>
            <span>B777</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-sm bg-cyan-200 dark:bg-cyan-900 border border-cyan-400 dark:border-cyan-700"></span>
            <span>B787</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-sm bg-emerald-200 dark:bg-emerald-900 border border-emerald-400 dark:border-emerald-700"></span>
            <span>PA28</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-sm bg-pink-200 dark:bg-pink-900 border border-pink-400 dark:border-pink-700"></span>
            <span>R44</span>
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
      <div className="w-full h-[600px] border rounded-lg dark:border-gray-700">
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
