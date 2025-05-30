
import React, { useRef, useState } from 'react';
import { AssignmentsCalendar } from '../schedule/AssignmentsCalendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";

interface Employee {
  id: string;
  e_number?: string | null;
  name: string;
  mobile_number?: string | null;
  team?: { team_name: string } | null;
  job_title?: { job_description: string; job_code: string } | null;
  employee_status?: string | null;
  key_name?: string | null;
  night_shift_ok?: boolean | null;
  fte_date?: string | null;
  ttl?: string | null;
  schedule?: Record<string, string>;
  supportCodes?: Record<string, string>;
}

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  selectedDate: string | null;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ isOpen, onClose, employee, selectedDate }) => {
  if (!employee) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Employee {selectedDate ? 'Schedule' : 'Profile'} Detail</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          <div className="grid gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Employee Information</h3>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="font-medium dark:text-gray-200">{employee.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">ID</dt>
                  <dd className="font-medium dark:text-gray-200">{employee.e_number}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Team</dt>
                  <dd className="font-medium dark:text-gray-200">{employee.team?.team_name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Position</dt>
                  <dd className="font-medium dark:text-gray-200">{employee.job_title?.job_description || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Night Shift</dt>
                  <dd className="font-medium dark:text-gray-200">{employee.night_shift_ok ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">FTE Date</dt>
                  <dd className="font-medium dark:text-gray-200">{employee.fte_date ? format(new Date(employee.fte_date), 'yyyy-MM-dd') : '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Mobile</dt>
                  <dd className="font-medium dark:text-gray-200">{employee.mobile_number || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Alias</dt>
                  <dd className="font-medium dark:text-gray-200">{employee.key_name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">TTL</dt>
                  <dd className="font-medium dark:text-gray-200">{employee.ttl || '-'}</dd>
                </div>
              </dl>
            </div>
            
            {selectedDate && employee.schedule?.[selectedDate] && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Schedule for {selectedDate}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium dark:text-gray-200">
                      {employee.schedule?.[selectedDate] === 'D' && 'On Duty'}
                      {employee.schedule?.[selectedDate] === 'AL' && 'Annual Leave'}
                      {employee.schedule?.[selectedDate] === 'L' && 'On Leave'}
                      {employee.schedule?.[selectedDate] === 'TR' && 'Training'}
                      {employee.schedule?.[selectedDate] === 'T' && 'Training'}
                      {employee.schedule?.[selectedDate] === 'O' && 'Day Off'}
                      {employee.schedule?.[selectedDate] === 'B1' && 'Half Day'}
                      {employee.schedule?.[selectedDate] === 'SK' && 'Sick Leave'}
                      {employee.schedule?.[selectedDate] === 'DO' && 'Overtime'}
                    </p>
                  </div>
                  
                  {employee.supportCodes?.[selectedDate] && ['D', 'B1', 'DO'].includes(employee.schedule?.[selectedDate] || '') && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Assignment</p>
                      <p className="font-medium dark:text-gray-200">{employee.supportCodes[selectedDate]}</p>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                      Edit Schedule
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const AlternativeScheduleView = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleScroll = (position: number) => {
    setScrollPosition(position);
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedDate(null);
    setIsDetailOpen(true);
  };

  const handleCellClick = (employee: Employee, date: string, status: string) => {
    setSelectedEmployee(employee);
    setSelectedDate(date);
    setIsDetailOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100 dark:bg-gray-700 p-4 flex items-center justify-between">
        <div className="text-lg font-medium">Assignments Calendar</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Scroll Position: {scrollPosition}px
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <AssignmentsCalendar
          ref={calendarRef}
          onScroll={handleScroll}
          currentDate={currentDate}
          onEmployeeSelect={handleEmployeeSelect}
          onCellClick={handleCellClick}
          refreshKey={refreshKey}
        />
      </div>

      <EmployeeDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        employee={selectedEmployee}
        selectedDate={selectedDate}
      />
    </div>
  );
};
