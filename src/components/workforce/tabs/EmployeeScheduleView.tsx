import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { EmployeeCalendar } from "../schedule/EmployeeCalendar";
import { AircraftScheduleView } from "./AircraftScheduleView";
import { EmployeeDetailPanel } from "../employee/EmployeeDetailPanel";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export const EmployeeScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isScheduleDetailOpen, setIsScheduleDetailOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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

  // Open employee detail panel
  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDetailOpen(true);
  };

  // Open schedule detail panel
  const handleScheduleSelect = (employee: any, date: string, status: string) => {
    setSelectedEmployee(employee);
    setSelectedDate(date);
    setSelectedStatus(status);
    setIsScheduleDetailOpen(true);
  };

  // Handle schedule update
  const handleUpdateSchedule = (newStatus: string) => {
    // In a real app, this would update the database
    console.log(`Updating schedule for ${selectedEmployee?.name} on ${selectedDate} to ${newStatus}`);
    
    toast({
      title: "Schedule Updated",
      description: `${selectedEmployee?.name}'s schedule for ${selectedDate} has been updated to ${newStatus}`,
    });
    
    setIsScheduleDetailOpen(false);
  };

  // Get month name from the current date
  const getCurrentMonthName = () => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
  };

  const ScheduleDetailContent = () => (
    <>
      <div className="space-y-6 p-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{selectedEmployee?.name}</h2>
          <div className="inline-block px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md">
            {selectedEmployee?.id}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">Date:</div>
          <div className="font-medium">{selectedDate}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">Status:</div>
          <div className="flex items-center">
            <StatusBadge status={selectedStatus || ""} />
          </div>
        </div>
        
        {selectedStatus === "L" && (
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-medium mb-3">Leave Details</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Leave Type:</div>
                <div className="col-span-2">Annual Leave</div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Duration:</div>
                <div className="col-span-2">May 15 - May 30, 2025 (16 days)</div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Reason:</div>
                <div className="col-span-2">Family vacation</div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Status:</div>
                <div className="col-span-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Approved
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedStatus === "T" && (
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-medium mb-3">Training Details</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Training Type:</div>
                <div className="col-span-2">Technical Certification</div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Location:</div>
                <div className="col-span-2">Training Center B, Room 204</div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Instructor:</div>
                <div className="col-span-2">James Wilson</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <h3 className="font-medium">Update Status</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">Status for {selectedDate}</div>
          <Select onValueChange={(value) => setSelectedStatus(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={getStatusLabel(selectedStatus || "")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="D">On Duty</SelectItem>
              <SelectItem value="L">Leave</SelectItem>
              <SelectItem value="T">Training</SelectItem>
              <SelectItem value="O">Day Off</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            className="w-full" 
            onClick={() => handleUpdateSchedule(selectedStatus || "")}
          >
            Update Schedule
          </Button>
        </div>
      </div>
    </>
  );

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

        {/* Simple container with direct overflow control */}
        <div className="w-full h-[75vh] overflow-auto border rounded-lg shadow-sm">
          <EmployeeCalendar 
            currentDate={currentDate}
            onEmployeeSelect={handleEmployeeSelect}
            onScheduleSelect={handleScheduleSelect}
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

      {/* Schedule Detail Panel - Use Sheet for desktop and Drawer for mobile */}
      {isMobile ? (
        <Drawer open={isScheduleDetailOpen} onOpenChange={setIsScheduleDetailOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Schedule Details</DrawerTitle>
              <DrawerClose className="absolute right-4 top-4" />
            </DrawerHeader>
            <div className="px-4">
              {ScheduleDetailContent()}
            </div>
            <DrawerFooter>
              <Button variant="outline" onClick={() => setIsScheduleDetailOpen(false)}>
                Close
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={isScheduleDetailOpen} onOpenChange={setIsScheduleDetailOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Schedule Details</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsScheduleDetailOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {ScheduleDetailContent()}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

// Helper function to display status badge
const StatusBadge = ({ status }: { status: string }) => {
  switch(status) {
    case 'D':
      return (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          On Duty
        </span>
      );
    case 'L':
      return (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
          On Leave
        </span>
      );
    case 'T':
      return (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
          Training
        </span>
      );
    case 'O':
      return (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-600 text-white dark:bg-gray-700">
          Day Off
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unknown
        </span>
      );
  }
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  switch(status) {
    case 'D': return 'On Duty';
    case 'L': return 'On Leave';
    case 'T': return 'Training';
    case 'O': return 'Day Off';
    default: return 'Select status';
  }
};
