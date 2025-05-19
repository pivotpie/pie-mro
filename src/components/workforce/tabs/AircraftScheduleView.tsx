
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { AircraftCalendar } from "../schedule/AircraftCalendar";

export const AircraftScheduleView = () => {
  return (
    <div className="mt-8 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Aircraft Maintenance Schedule</h2>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <ArrowUpRight className="h-4 w-4" />
          Export Schedule
        </Button>
      </div>

      {/* Aircraft Gantt Chart with full width */}
      <div className="w-full overflow-auto">
        <AircraftCalendar />
      </div>
    </div>
  );
};
