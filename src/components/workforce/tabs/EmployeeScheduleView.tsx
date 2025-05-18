
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { EmployeeCalendar } from "../schedule/EmployeeCalendar";

export const EmployeeScheduleView = () => {
  return (
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

      {/* Schedule Calendar */}
      <div className="flex-grow overflow-hidden">
        <EmployeeCalendar />
      </div>
    </div>
  );
};
