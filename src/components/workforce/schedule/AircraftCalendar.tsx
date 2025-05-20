
import { useState } from 'react';
import { AircraftGanttChart } from "../AircraftGanttChart";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const AircraftCalendar = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Handler to receive scroll position updates from the calendar
  const handleCalendarScroll = (position: number) => {
    setScrollPosition(position);
  };

  const handleExportSchedule = () => {
    toast.success("Schedule export started", {
      description: "Your export will be ready to download shortly."
    });
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="float-right"
          onClick={handleExportSchedule}
        >
          Export Schedule
        </Button>
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
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
        </div>
      </div>
      
      <AircraftGanttChart scrollLeft={scrollPosition} />
    </div>
  );
};
