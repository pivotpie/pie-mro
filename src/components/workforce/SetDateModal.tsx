
import { useState } from 'react';
import { Calendar, CalendarIcon, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDate } from "@/contexts/DateContext";
import { toast } from "sonner";

interface SetDateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetDateModal = ({ isOpen, onClose }: SetDateModalProps) => {
  const { currentDate, setCurrentDate, resetToToday, isManuallySet } = useDate();
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);

  const handleSetDate = () => {
    setCurrentDate(selectedDate);
    toast.success(`Date set to ${format(selectedDate, 'MMMM d, yyyy')}`, {
      description: "All calendar components and imports will now use this date."
    });
    onClose();
  };

  const handleResetToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    resetToToday();
    toast.success("Date reset to today", {
      description: "All components will now use the current date."
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-auto max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Set Application Date
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p className="mb-2">
              Current date: <strong>{format(currentDate, 'MMMM d, yyyy')}</strong>
            </p>
            <p className="text-xs">
              {isManuallySet ? "Date is manually set" : "Using current date"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select New Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> This date will be used for:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside mt-1 space-y-1">
                <li>All calendar views and navigation</li>
                <li>Attendance import operations</li>
                <li>Schedule and assignment displays</li>
                <li>Date-based filters and reports</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-between space-x-2">
            <Button 
              variant="outline" 
              onClick={handleResetToToday}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Today
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSetDate} className="bg-blue-600 hover:bg-blue-700">
                Set Date
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
