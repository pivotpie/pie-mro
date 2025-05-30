
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';

interface Employee {
  id: number;
  name: string;
  e_number: number; // Changed from string to number to match database type
  employee_status?: string;
  job_titles?: {
    job_description: string;
  };
}

interface ScheduleData {
  [employeeId: number]: {
    [dateKey: string]: string;
  };
}

interface AlternativeEmployeeCalendarProps {
  currentDate: Date;
  onEmployeeSelect: (employee: Employee) => void;
  onCellClick: (employee: Employee, date: string, status: string) => void;
  onScroll?: (position: number) => void;
  refreshKey?: number;
}

export const AlternativeEmployeeCalendar = forwardRef<any, AlternativeEmployeeCalendarProps>(({
  currentDate,
  onEmployeeSelect,
  onCellClick,
  onScroll,
  refreshKey = 0
}, ref) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [loading, setLoading] = useState(true);

  // Generate calendar days for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useImperativeHandle(ref, () => ({
    refreshData: fetchData
  }));

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          e_number,
          employee_status,
          job_titles (job_description)
        `)
        .eq('employee_status', 'active')
        .order('name');

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      // Fetch schedule data for the month
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');

      const { data: scheduleDataResult, error: scheduleError } = await supabase
        .from('roster_assignments')
        .select(`
          employee_id,
          date_references (actual_date),
          roster_codes (roster_code)
        `)
        .gte('date_references.actual_date', startDate)
        .lte('date_references.actual_date', endDate);

      if (scheduleError) throw scheduleError;

      // Transform schedule data
      const scheduleMap: ScheduleData = {};
      scheduleDataResult?.forEach(assignment => {
        const employeeId = assignment.employee_id;
        const date = assignment.date_references?.actual_date;
        const status = assignment.roster_codes?.roster_code;

        if (date && status) {
          if (!scheduleMap[employeeId]) {
            scheduleMap[employeeId] = {};
          }
          
          // Convert date to M-D-YYYY format
          const dateObj = new Date(date);
          const formattedDate = `${dateObj.getMonth() + 1}-${dateObj.getDate()}-${dateObj.getFullYear()}`;
          scheduleMap[employeeId][formattedDate] = status;
        }
      });

      setScheduleData(scheduleMap);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate, refreshKey]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      onScroll(e.currentTarget.scrollLeft);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'D': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'AL':
      case 'L': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'TR':
      case 'T': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'O': return 'bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200';
      case 'B1': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'SK': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'DO': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDateKey = (date: Date) => {
    return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading alternative calendar...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto" onScroll={handleScroll}>
      <div className="min-w-fit">
        {/* Header with month/year and days */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
          <div className="flex">
            {/* Employee name column header */}
            <div className="w-48 p-3 font-semibold border-r bg-gray-50 dark:bg-gray-800">
              Employee ({format(currentDate, 'MMMM yyyy')})
            </div>
            
            {/* Day headers */}
            {calendarDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`min-w-[100px] p-2 text-center font-medium border-r ${
                  isToday(day) 
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' 
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="text-xs">{format(day, 'EEE')}</div>
                <div className={`text-sm ${isToday(day) ? 'font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employee rows */}
        <div className="divide-y">
          {employees.map((employee) => (
            <div key={employee.id} className="flex hover:bg-gray-50 dark:hover:bg-gray-800">
              {/* Employee info column */}
              <div 
                className="w-48 p-3 border-r cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => onEmployeeSelect(employee)}
              >
                <div className="font-medium text-sm">{employee.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {employee.job_titles?.job_description || "Employee"} • #{employee.e_number}
                </div>
              </div>
              
              {/* Schedule cells */}
              {calendarDays.map((day) => {
                const dateKey = formatDateKey(day);
                const status = scheduleData[employee.id]?.[dateKey];
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-w-[100px] p-2 border-r cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      !isSameMonth(day, currentDate) ? 'opacity-50' : ''
                    }`}
                    onClick={() => onCellClick(employee, dateKey, status || '')}
                  >
                    {status && (
                      <div className={`px-2 py-1 rounded text-xs text-center font-medium ${getStatusColor(status)}`}>
                        {status}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

AlternativeEmployeeCalendar.displayName = 'AlternativeEmployeeCalendar';
