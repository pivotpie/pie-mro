
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { EmployeeCalendar } from "../schedule/EmployeeCalendar";
import { AircraftScheduleView } from "./AircraftScheduleView";

export const EmployeeScheduleView = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Handler to receive scroll position updates from the employee calendar
  const handleCalendarScroll = (position: number) => {
    setScrollPosition(position);
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Employee Schedule</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Today</Button>
            <Button variant="outline" size="sm">Next</Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowUpRight className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Simple container with direct overflow control and scroll position synchronization */}
        <div className="w-full h-[75vh] overflow-auto border rounded-lg shadow-sm">
          <EmployeeCalendar 
            onScroll={handleCalendarScroll} 
            externalScrollPosition={scrollPosition}
          />
        </div>
      </div>
      
      {/* Aircraft Schedule View with scroll position synchronization */}
      <AircraftScheduleView />
    </div>
  );
};
