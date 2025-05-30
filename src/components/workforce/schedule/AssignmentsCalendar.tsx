
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from "@/components/ui/scroll-area";

interface Employee {
  id: number;
  name: string;
  e_number: string;
  alias: string;
  mobile: string;
  team: string;
  core: string;
  support: string;
  title: string;
  night: string;
  fte: string;
  ttl: string;
}

interface AssignmentData {
  employee_id: number;
  date: string;
  status: string;
}

interface AssignmentsCalendarProps {
  currentDate: Date;
  onCellClick?: (employee: Employee, date: string, status: string) => void;
  refreshKey?: number;
}

export const AssignmentsCalendar = ({ currentDate, onCellClick, refreshKey }: AssignmentsCalendarProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate date range for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const dates = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    fetchData();
  }, [currentDate, refreshKey]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEmployees(), fetchAssignments()]);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          e_number,
          job_titles:job_title_id (job_description),
          teams:team_id (team_name),
          employee_supports (
            support_codes:support_id (support_code)
          ),
          employee_cores (
            core_codes:core_id (core_code)
          )
        `)
        .eq('is_active', true)
        .order('e_number');

      if (employeesError) throw employeesError;

      const processedEmployees = employeesData?.map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        e_number: emp.e_number?.toString() || '',
        alias: emp.name.split(' ').map((n: string) => n[0]).join(''),
        mobile: '+971XXXXXXXX', // Mock data
        team: emp.teams?.team_name || 'Unassigned',
        core: emp.employee_cores?.map((c: any) => c.core_codes?.core_code).filter(Boolean).join(', ') || '-',
        support: emp.employee_supports?.map((s: any) => s.support_codes?.support_code).filter(Boolean).join(', ') || 'AV',
        title: emp.job_titles?.job_description || 'TECH',
        night: Math.random() > 0.5 ? 'Yes' : 'No',
        fte: Math.random() > 0.7 ? '2020-03-06' : '-',
        ttl: Math.random() > 0.8 ? '6' : '-'
      })) || [];

      setEmployees(processedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');

      // Fetch support assignments (the primary data we want to show)
      const { data: supportData, error: supportError } = await supabase
        .from('employee_supports')
        .select(`
          employee_id,
          assignment_date,
          support_codes:support_id (support_code)
        `)
        .gte('assignment_date', startDate)
        .lte('assignment_date', endDate);

      if (supportError) throw supportError;

      // Process support assignments
      const supportAssignments = supportData?.map((assignment: any) => ({
        employee_id: assignment.employee_id,
        date: assignment.assignment_date,
        status: assignment.support_codes?.support_code || 'AV'
      })) || [];

      // Fetch roster assignments as fallback for days without support assignments
      const { data: rosterData, error: rosterError } = await supabase
        .from('roster_assignments')
        .select(`
          employee_id,
          date_references:date_id (actual_date),
          roster_codes:roster_id (roster_code)
        `)
        .gte('date_references.actual_date', startDate)
        .lte('date_references.actual_date', endDate);

      if (rosterError) throw rosterError;

      // Process roster assignments and convert to support codes
      const rosterAssignments = rosterData?.map((assignment: any) => ({
        employee_id: assignment.employee_id,
        date: assignment.date_references?.actual_date,
        status: convertRosterToSupport(assignment.roster_codes?.roster_code)
      })).filter(Boolean) || [];

      // Combine and prioritize support assignments over roster assignments
      const combinedAssignments = [...supportAssignments];
      
      // Add roster assignments only for dates/employees not covered by support assignments
      rosterAssignments.forEach(roster => {
        const hasSupport = supportAssignments.find(support => 
          support.employee_id === roster.employee_id && support.date === roster.date
        );
        if (!hasSupport) {
          combinedAssignments.push(roster);
        }
      });

      setAssignments(combinedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  // Convert roster codes to support codes for display consistency
  const convertRosterToSupport = (rosterCode: string): string => {
    const mapping: { [key: string]: string } = {
      'D': 'AV',      // On Duty -> Available
      'O': 'AV',      // Off Duty -> Available  
      'AL': 'AL',     // Annual Leave -> Annual Leave
      'SK': 'SK',     // Sick Leave -> Sick Leave
      'TR': 'TR',     // Training -> Training
      'B1': 'AV',     // Half Day -> Available
      'DO': 'AV'      // Overtime -> Available
    };
    
    return mapping[rosterCode] || 'AV';
  };

  const getAssignmentForEmployeeAndDate = (employeeId: number, date: Date): string => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const assignment = assignments.find(
      a => a.employee_id === employeeId && a.date === dateStr
    );
    
    // If no specific assignment found, use the employee's default support code
    if (!assignment) {
      const employee = employees.find(e => e.id === employeeId);
      return employee?.support?.split(',')[0]?.trim() || 'AV';
    }
    
    return assignment.status;
  };

  const getCellStyle = (status: string) => {
    const styles: { [key: string]: string } = {
      'AV': 'bg-gray-100 text-gray-700 border-gray-200',
      'G-BWTB': 'bg-green-100 text-green-800 border-green-200',
      'G-BVYC': 'bg-green-100 text-green-800 border-green-200', 
      'A6-IDS': 'bg-blue-100 text-blue-800 border-blue-200',
      'A6-EVA': 'bg-purple-100 text-purple-800 border-purple-200',
      'A6-BVZ': 'bg-amber-100 text-amber-800 border-amber-200',
      'AL': 'bg-red-100 text-red-800 border-red-200',
      'SK': 'bg-orange-100 text-orange-800 border-orange-200',
      'TR': 'bg-purple-100 text-purple-800 border-purple-200',
      'N-285TJ': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'SYOS': 'bg-teal-100 text-teal-800 border-teal-200',
      'default': 'bg-gray-50 text-gray-600 border-gray-100'
    };
    
    return styles[status] || styles.default;
  };

  const handleCellClick = (employee: Employee, date: Date, status: string) => {
    if (onCellClick) {
      const dateStr = format(date, 'M-d-yyyy');
      onCellClick(employee, dateStr, status);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ScrollArea className="w-full h-[75vh]">
        <div className="min-w-full">
          {/* Fixed column widths for better alignment */}
          <div className="sticky top-0 z-20 bg-white border-b-2 border-gray-200">
            <div className="flex">
              {/* Employee Info Header - Fixed width sections */}
              <div className="flex bg-blue-50 border-r border-gray-200">
                <div className="w-16 px-2 py-3 text-xs font-semibold text-center border-r border-gray-200">Emp#</div>
                <div className="w-32 px-2 py-3 text-xs font-semibold text-center border-r border-gray-200">Name</div>
                <div className="w-12 px-2 py-3 text-xs font-semibold text-center border-r border-gray-200">Alias</div>
                <div className="w-24 px-2 py-3 text-xs font-semibold text-center border-r border-gray-200">Mobile</div>
                <div className="w-20 px-2 py-3 text-xs font-semibold text-center border-r border-gray-200">Team</div>
                <div className="w-16 px-2 py-3 text-xs font-semibold text-center border-r border-gray-200">Core</div>
                <div className="w-20 px-2 py-3 text-xs font-semibold text-center border-r border-gray-200">Support</div>
                <div className="w-16 px-2 py-3 text-xs font-semibold text-center border-r border-gray-200">Title</div>
                <div className="w-16 px-2 py-3 text-xs font-semibold text-center border-r border-gray-200">Night</div>
                <div className="w-20 px-2 py-3 text-xs font-semibold text-center border-r border-gray-200">FTE</div>
                <div className="w-12 px-2 py-3 text-xs font-semibold text-center">TTL</div>
              </div>
              
              {/* Date Headers - Fixed width */}
              <div className="flex bg-orange-50">
                {dates.map((date) => (
                  <div key={date.toISOString()} className="w-20 px-1 py-1 border-r border-gray-200">
                    <div className="text-xs font-semibold text-center">{format(date, 'd')}</div>
                    <div className="text-xs text-center text-gray-600">{format(date, 'MMM')}</div>
                    <div className="text-xs text-center text-gray-600">{format(date, 'eee')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Employee Rows */}
          <div className="divide-y divide-gray-200">
            {employees.map((employee) => (
              <div key={employee.id} className="flex hover:bg-gray-50">
                {/* Employee Info - Match header widths exactly */}
                <div className="flex bg-gray-50 border-r border-gray-200">
                  <div className="w-16 px-2 py-2 text-xs text-center border-r border-gray-200">{employee.e_number}</div>
                  <div className="w-32 px-2 py-2 text-xs text-center border-r border-gray-200 truncate" title={employee.name}>{employee.name}</div>
                  <div className="w-12 px-2 py-2 text-xs text-center border-r border-gray-200">{employee.alias}</div>
                  <div className="w-24 px-2 py-2 text-xs text-center border-r border-gray-200">{employee.mobile}</div>
                  <div className="w-20 px-2 py-2 text-xs text-center border-r border-gray-200 truncate" title={employee.team}>{employee.team}</div>
                  <div className="w-16 px-2 py-2 text-xs text-center border-r border-gray-200">{employee.core}</div>
                  <div className="w-20 px-2 py-2 text-xs text-center border-r border-gray-200 truncate" title={employee.support}>{employee.support}</div>
                  <div className="w-16 px-2 py-2 text-xs text-center border-r border-gray-200">{employee.title}</div>
                  <div className="w-16 px-2 py-2 text-xs text-center border-r border-gray-200">{employee.night}</div>
                  <div className="w-20 px-2 py-2 text-xs text-center border-r border-gray-200">{employee.fte}</div>
                  <div className="w-12 px-2 py-2 text-xs text-center">{employee.ttl}</div>
                </div>
                
                {/* Assignment Cells - Match date header widths exactly */}
                <div className="flex">
                  {dates.map((date) => {
                    const status = getAssignmentForEmployeeAndDate(employee.id, date);
                    return (
                      <div
                        key={date.toISOString()}
                        className={`w-20 px-1 py-2 text-xs text-center border-r border-gray-200 cursor-pointer hover:opacity-80 transition-opacity ${getCellStyle(status)}`}
                        onClick={() => handleCellClick(employee, date, status)}
                        title={`${employee.name} - ${format(date, 'MMM d, yyyy')} - ${status}`}
                      >
                        <div className="truncate">{status}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
