
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Info } from "lucide-react";
import { EmployeeCalendar } from "../schedule/EmployeeCalendar";
import { useNotification } from '@/contexts/NotificationContext';

interface EmployeeScheduleViewProps {
  onViewDetails?: (id: string) => void;
}

export const EmployeeScheduleView = ({ onViewDetails }: EmployeeScheduleViewProps) => {
  const { showToast } = useNotification();
  
  const handleCellClick = (employeeId: string, day: number, month: number) => {
    if (onViewDetails) {
      onViewDetails(employeeId);
    } else {
      // Fallback if no handler is provided
      showToast({
        title: "Calendar Cell Clicked",
        message: `Employee ${employeeId} on ${month + 1}/${day}/2025`,
        type: "info"
      });
    }
  };
  
  const handleExport = () => {
    showToast({
      title: "Export Started",
      message: "Employee schedule export is being processed",
      type: "success"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Employee Schedule</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Today</Button>
            <Button variant="outline" size="sm">Next</Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleExport}
            >
              <ArrowUpRight className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Employee Schedule Calendar */}
        <EmployeeCalendar onCellClick={handleCellClick} />
        
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Info className="h-4 w-4 mr-1" />
          <span>Click on a schedule cell to view employee details</span>
        </div>
      </div>
    </div>
  );
};
