
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { AircraftScheduleView } from "./AircraftScheduleView";
import { EmployeeDetailPanel } from "../employee/EmployeeDetailPanel";
import { EmployeeScheduleDatePicker } from "../schedule/EmployeeScheduleDatePicker";
import { ScheduleCalendar } from "../ScheduleCalendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export const EmployeeScheduleView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const isMobile = useIsMobile();

  // Export handler
  const handleExport = () => {
    toast.success("Export started", {
      description: "Your employee schedule will be ready to download shortly."
    });
  };

  // Open employee detail panel
  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDetailOpen(true);
  };

  // Navigate to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Handle scroll events from calendar
  const handleCalendarScroll = (scrollLeft: number) => {
    // Handle scroll sync if needed
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Employee Schedule & Assignments</h2>
          <div className="flex items-center gap-2">
            <EmployeeScheduleDatePicker
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleExport}>
              <ArrowUpRight className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Employee Schedule Calendar */}
        <div className="w-full">
          <ScheduleCalendar
            selectedDate={selectedDate}
            onScroll={handleCalendarScroll}
            onEmployeeSelect={handleEmployeeSelect}
          />
        </div>
      </div>
      
      <AircraftScheduleView />

      {/* Employee Detail Panel */}
      {selectedEmployee && (
        <EmployeeDetailPanel
          employee={selectedEmployee}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </div>
  );
};
