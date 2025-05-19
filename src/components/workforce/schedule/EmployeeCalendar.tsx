
import React from 'react';
import { Card } from "@/components/ui/card";

interface EmployeeCalendarProps {
  onCellClick: (employeeId: string, day: number, month: number) => void;
}

export const EmployeeCalendar = ({ onCellClick }: EmployeeCalendarProps) => {
  const mockEmployees = [
    { id: 'emp123', name: 'Jane Smith', role: 'Senior Pilot' },
    { id: 'emp456', name: 'John Doe', role: 'Maintenance Technician' },
    { id: 'emp789', name: 'Alice Johnson', role: 'Flight Attendant' }
  ];
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeks = 4; // Show 4 weeks
  const currentMonth = 4; // May (0-indexed)
  
  // Handle cell click
  const handleCellClick = (employeeId: string, dayIndex: number, weekIndex: number) => {
    const day = weekIndex * 7 + dayIndex + 1;
    onCellClick(employeeId, day, currentMonth);
  };
  
  return (
    <Card className="overflow-x-auto">
      <div className="min-w-max">
        <div className="grid grid-cols-[200px_repeat(7,1fr)]">
          {/* Header row with days */}
          <div className="sticky left-0 bg-white dark:bg-gray-800 border-b font-medium p-2">
            Employee
          </div>
          {days.map((day) => (
            <div key={day} className="p-2 text-center border-b font-medium">
              {day}
            </div>
          ))}
          
          {/* Generate weeks */}
          {mockEmployees.map(employee => {
            return Array.from({ length: weeks }).map((_, weekIndex) => (
              <React.Fragment key={`${employee.id}-week-${weekIndex}`}>
                {weekIndex === 0 && (
                  <div 
                    className="sticky left-0 bg-white dark:bg-gray-800 border-b flex items-center p-2 shadow-sm z-10"
                    style={{ gridRow: `span ${weeks}` }}
                  >
                    <div>
                      <div className="font-medium text-sm">{employee.name}</div>
                      <div className="text-xs text-gray-500">{employee.role}</div>
                    </div>
                  </div>
                )}
                {/* Days in week */}
                {days.map((_, dayIndex) => {
                  // Generate random shift data for demo
                  const shift = Math.floor(Math.random() * 4);
                  const shiftTypes = ['AM', 'PM', 'Night', 'Off'];
                  const shiftColors = [
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  ];
                  
                  return (
                    <div 
                      key={`${employee.id}-week-${weekIndex}-day-${dayIndex}`} 
                      className="border-b min-h-[60px] hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer p-1"
                      onClick={() => handleCellClick(employee.id, dayIndex, weekIndex)}
                    >
                      <div className={`text-xs rounded px-2 py-1 inline-block ${shiftColors[shift]}`}>
                        {shiftTypes[shift]}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ));
          })}
        </div>
      </div>
    </Card>
  );
};
