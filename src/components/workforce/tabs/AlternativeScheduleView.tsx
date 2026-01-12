import React, { useRef, useState } from 'react';
import { EmployeeCalendar } from '../schedule/AssignmentsCalendar';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { EmployeeDetailPanel } from "../employee/EmployeeDetailPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRefresh } from '@/contexts/RefreshContext';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useDate } from "@/contexts/DateContext";

export const AlternativeScheduleView = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const { currentDate, setCurrentDate } = useDate(); // Use centralized date
  const { triggerRefresh } = useRefresh();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const isMobile = useIsMobile();

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

  // Navigate to today - use the centralized date context
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
    setSelectedDate(null);
    setIsDetailOpen(true);
  };

  // Handle schedule cell click
  const handleScheduleCellClick = (employee: any, date: string, status: string) => {
    setSelectedEmployee(employee);
    setSelectedDate(date);
    setSelectedStatus(status || "");
    setIsDetailOpen(true);
  };

  // Function to force refresh the calendar data
  const refreshCalendarData = () => {
    setRefreshKey(prev => prev + 1);
    console.log("Calendar data refresh requested");
  };

  // Handle schedule update with fixed date parsing
  const handleUpdateSchedule = async () => {
    if (!selectedEmployee?.id || !selectedDate) return;

    try {
      setIsUpdateLoading(true);

      // Fix the date parsing to avoid timezone offset issues
      const [month, day, year] = selectedDate.split('-').map(Number);
      const formattedDate = format(new Date(year, month - 1, day), 'yyyy-MM-dd');

      // Find the date_id from date_references table
      const { data: dateRef, error: dateError } = await supabase
        .from('date_references')
        .select('id')
        .eq('actual_date', formattedDate)
        .single();

      if (dateError) {
        throw new Error(`Date reference error: ${dateError.message}`);
      }

      if (!dateRef?.id) {
        throw new Error('Date reference not found');
      }

      // Find the roster_id from roster_codes table
      const { data: rosterCode, error: rosterError } = await supabase
        .from('roster_codes')
        .select('id')
        .eq('roster_code', selectedStatus)
        .single();

      if (rosterError) {
        throw new Error(`Roster code error: ${rosterError.message}`);
      }

      if (!rosterCode?.id) {
        throw new Error('Roster code not found');
      }

      // Check if there's an existing roster assignment
      const { data: existingAssignment, error: checkError } = await supabase
        .from('roster_assignments')
        .select('id')
        .eq('employee_id', selectedEmployee.id)
        .eq('date_id', dateRef.id);

      if (checkError) {
        throw new Error(`Check existing assignment error: ${checkError.message}`);
      }

      let updateResult;
      
      if (existingAssignment && existingAssignment.length > 0) {
        // Update existing assignment
        updateResult = await supabase
          .from('roster_assignments')
          .update({ roster_id: rosterCode.id })
          .eq('id', existingAssignment[0].id);
      } else {
        // Create new assignment
        updateResult = await supabase
          .from('roster_assignments')
          .insert([
            {
              employee_id: selectedEmployee.id,
              date_id: dateRef.id,
              roster_id: rosterCode.id
            }
          ]);
      }

      if (updateResult.error) {
        throw new Error(`Update error: ${updateResult.error.message}`);
      }

      toast.success('Schedule updated successfully');
      setIsDetailOpen(false);
      
      // Immediately refresh the calendar data after update
      refreshCalendarData();
      triggerRefresh(); // Trigger global refresh for WorkforceMetrics
      
    } catch (error: any) {
      console.error('Update schedule error:', error);
      toast.error(`Failed to update schedule: ${error.message}`);
    } finally {
      setIsUpdateLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Employee Assignment Schedule</h2>
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

         {/* Status Legend */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
          <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Status Legend</h3>
          <div className="grid items-left grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">On Duty (D)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Half Day (B1)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Day Off (O)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Annual Leave (AL)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Sick Leave (SK)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Training (TR)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Overtime (DO)</span>
            </div>
          </div>
        </div>

        {/* Simple container with direct overflow control and scroll position synchronization */}
        <div className="w-full h-[75vh] overflow-auto border rounded-lg shadow-sm">
          <EmployeeCalendar 
            onScroll={handleCalendarScroll} 
            currentDate={currentDate}
            onEmployeeSelect={handleEmployeeSelect}
            onCellClick={handleScheduleCellClick}
            refreshKey={refreshKey}
          />
        </div>
      </div>
      
      {/* Employee Detail Panel */}
      {selectedEmployee && !selectedDate && (
        <EmployeeDetailPanel
          employee={selectedEmployee}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}

      {/* Schedule Detail Sheet */}
      {selectedEmployee && selectedDate && (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className={`w-full ${isMobile ? '' : 'sm:max-w-lg'}`}>
            <SheetHeader>
              <SheetTitle>Schedule Details</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-semibold">{selectedEmployee.name}</h3>
                <div className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm px-2 py-1 rounded inline-block w-fit">
                  {selectedEmployee.e_number || 'No ID'}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                <p className="font-medium">{selectedDate}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Status</p>
                <div className={`mt-1 px-3 py-1 rounded-full text-sm inline-flex items-center ${
                  selectedStatus === 'D' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                  selectedStatus === 'AL' || selectedStatus === 'L' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                  selectedStatus === 'TR' || selectedStatus === 'T' ? 'Training' : 
                  selectedStatus === 'O' ? 'bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200' :
                  selectedStatus === 'B1' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                  selectedStatus === 'SK' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                  selectedStatus === 'DO' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {selectedStatus === 'D' && 'On Duty'}
                  {selectedStatus === 'AL' && 'Annual Leave'}
                  {selectedStatus === 'L' && 'On Leave'}
                  {selectedStatus === 'TR' || selectedStatus === 'T' ? 'Training' : ''}
                  {selectedStatus === 'O' && 'Off Duty'}
                  {selectedStatus === 'B1' && 'Half Day'}
                  {selectedStatus === 'SK' && 'Sick Leave'}
                  {selectedStatus === 'DO' && 'Overtime'}
                  {!selectedStatus && 'Not Assigned'}
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Update Status</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Status for {selectedDate}</label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D">On Duty (D)</SelectItem>
                        <SelectItem value="B1">Half Day (B1)</SelectItem>
                        <SelectItem value="O">Off Duty (O)</SelectItem>
                        <SelectItem value="AL">Annual Leave (AL)</SelectItem>
                        <SelectItem value="SK">Sick Leave (SK)</SelectItem>
                        <SelectItem value="TR">Training (TR)</SelectItem>
                        <SelectItem value="DO">Overtime (DO)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={handleUpdateSchedule}
                    disabled={isUpdateLoading}
                  >
                    {isUpdateLoading ? 'Updating...' : 'Update Schedule'}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};
