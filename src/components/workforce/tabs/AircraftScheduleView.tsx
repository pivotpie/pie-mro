
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Info } from "lucide-react";
import { AircraftCalendar } from "../schedule/AircraftCalendar";
import { useNotification } from '@/contexts/NotificationContext';

interface AircraftScheduleViewProps {
  onViewDetails?: (id: string) => void;
}

export const AircraftScheduleView = ({ onViewDetails }: AircraftScheduleViewProps) => {
  const { showToast } = useNotification();
  
  const handleCellClick = (aircraftId: string, day: number, month: number) => {
    if (onViewDetails) {
      onViewDetails(aircraftId);
    } else {
      // Fallback if no handler is provided
      showToast({
        title: "Schedule Entry Selected",
        message: `Aircraft ${aircraftId} on ${month + 1}/${day}/2025`,
        type: "info"
      });
    }
  };
  
  const handleExport = () => {
    showToast({
      title: "Export Started",
      message: "Aircraft schedule export is being processed",
      type: "success"
    });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Aircraft Maintenance Schedule</h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleExport}
        >
          <ArrowUpRight className="h-4 w-4" />
          Export Schedule
        </Button>
      </div>

      {/* Aircraft Gantt Chart */}
      <AircraftCalendar onCellClick={handleCellClick} />
      
      <div className="mt-2 flex items-center text-sm text-gray-500">
        <Info className="h-4 w-4 mr-1" />
        <span>Click on a schedule entry to view aircraft details</span>
      </div>
    </div>
  );
};
