
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { EmployeeCalendar } from "../schedule/EmployeeCalendar";
import { AircraftScheduleView } from "./AircraftScheduleView";

export const EmployeeScheduleView = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Handler to receive scroll position updates from the employee calendar
  const handleCalendarScroll = (position: number) => {
    setScrollPosition(position);
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
  };

  // Export handler
  const handleExport = () => {
    // Implementation would go here
    console.log("Export requested");
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Employee Schedule</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>Previous</Button>
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>Next</Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleExport}>
              <ArrowUpRight className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Simple container with direct overflow control and scroll position synchronization */}
        <div className="w-full h-[75vh] overflow-auto border rounded-lg shadow-sm">
          <EmployeeCalendar />
        </div>
      </div>
      
      {/* Aircraft Schedule View with scroll position synchronization */}
      <AircraftScheduleView />
    </div>
  );
};
