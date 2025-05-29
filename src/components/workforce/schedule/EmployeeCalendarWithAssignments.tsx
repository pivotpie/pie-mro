import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Employee {
  id: number;
  name: string;
  e_number: number;
  roster_status?: string;
  core_assignment?: string;
  support_assignment?: string;
}

interface EmployeeCalendarWithAssignmentsProps {
  selectedDate: Date;
  onEmployeeSelect?: (employee: Employee) => void;
}

export const EmployeeCalendarWithAssignments = ({ 
  selectedDate, 
  onEmployeeSelect 
}: EmployeeCalendarWithAssignmentsProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeesWithAssignments = async () => {
      setLoading(true);
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        
        // Get employee project assignments for the selected date using the RPC function
        const { data: assignments, error: assignmentsError } = await supabase
          .rpc('get_employee_project_assignments', { p_date: formattedDate });

        if (assignmentsError) throw assignmentsError;

        // Get roster data for the selected date
        const { data: rosterData, error: rosterError } = await supabase
          .from('roster_assignments')
          .select(`
            employee_id,
            employees!inner(id, name, e_number, is_active),
            roster_codes!inner(roster_code, description)
          `)
          .eq('date_references.actual_date', formattedDate)
          .eq('employees.is_active', true);

        if (rosterError) throw rosterError;

        // Combine roster and assignment data
        const employeeMap = new Map<number, Employee>();

        // First, populate with roster data
        rosterData?.forEach((roster: any) => {
          const employee = roster.employees;
          employeeMap.set(employee.id, {
            id: employee.id,
            name: employee.name,
            e_number: employee.e_number,
            roster_status: roster.roster_codes.roster_code,
          });
        });

        // Then, add assignment data from the RPC function
        assignments?.forEach((assignment: any) => {
          const existingEmployee = employeeMap.get(assignment.employee_id);
          if (existingEmployee) {
            if (assignment.assignment_type === 'CORE') {
              existingEmployee.core_assignment = assignment.assignment_code;
            } else if (assignment.assignment_type === 'SUPPORT') {
              existingEmployee.support_assignment = assignment.assignment_code;
            }
          } else {
            // Create new employee entry if not in roster but has assignments
            const newEmployee: Employee = {
              id: assignment.employee_id,
              name: assignment.employee_name,
              e_number: assignment.employee_number,
              roster_status: undefined,
            };
            
            if (assignment.assignment_type === 'CORE') {
              newEmployee.core_assignment = assignment.assignment_code;
            } else if (assignment.assignment_type === 'SUPPORT') {
              newEmployee.support_assignment = assignment.assignment_code;
            }
            
            employeeMap.set(assignment.employee_id, newEmployee);
          }
        });

        // Convert map to array and sort by employee number
        const employeeList = Array.from(employeeMap.values())
          .sort((a, b) => a.e_number - b.e_number);

        setEmployees(employeeList);
      } catch (error) {
        console.error('Error fetching employee assignments:', error);
        toast.error('Failed to load employee assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeesWithAssignments();
  }, [selectedDate]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'D': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'B1': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'O': return 'bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200';
      case 'AL': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'SK': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'TR': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'DO': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'D': return 'Day Shift';
      case 'B1': return 'Half Day';
      case 'O': return 'Off Duty';
      case 'AL': return 'Annual Leave';
      case 'SK': return 'Sick Leave';
      case 'TR': return 'Training';
      case 'DO': return 'Overtime';
      default: return status || 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Employee Assignments for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <div className="text-sm text-gray-500">
          {employees.length} employees
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => onEmployeeSelect?.(employee)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center font-medium">
                    {employee.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-gray-500">E#{employee.e_number}</div>
                  </div>
                </div>
                
                {employee.roster_status && (
                  <Badge className={getStatusColor(employee.roster_status)}>
                    {getStatusLabel(employee.roster_status)}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Core Assignment</div>
                  <div className="text-sm">
                    {employee.core_assignment ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {employee.core_assignment}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Support Assignment</div>
                  <div className="text-sm">
                    {employee.support_assignment ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {employee.support_assignment}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {employees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No employee data found for this date
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
