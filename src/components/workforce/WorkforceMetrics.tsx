
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { 
  Users, 
  CalendarCheck, 
  GraduationCap, 
  PlaneTakeoff, 
  Plane, 
  FileCheck, 
  Activity 
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  percentage?: string;
  onClick?: () => void;
}

interface EmployeeMetrics {
  total: number;
  active: number;
  onLeave: number;
  inTraining: number;
}

interface AircraftMetrics {
  total: number;
  inMaintenance: number;
  scheduled: number;
  available: number;
}

interface WorkforceMetricsProps {
  employeeMetrics?: EmployeeMetrics;
  aircraftMetrics?: AircraftMetrics;
}

const MetricCard = ({ label, value, icon: Icon, color, percentage, onClick }: MetricCardProps) => (
  <Card 
    className={`${color} hover:shadow-md transition-all cursor-pointer border`}
    onClick={onClick}
  >
    <CardContent className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-white/70 dark:bg-gray-800/70`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
        </div>
      </div>
      {percentage && (
        <div className="text-xs bg-white/70 dark:bg-gray-800/70 px-2 py-0.5 rounded-full">
          {percentage}
        </div>
      )}
    </CardContent>
  </Card>
);

export const WorkforceMetrics = ({ employeeMetrics, aircraftMetrics }: WorkforceMetricsProps) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Fetch detailed employee data when a specific metric is selected
  const { data: employeeDetails } = useQuery({
    queryKey: ['employeeDetails', selectedMetric],
    queryFn: async () => {
      if (selectedMetric === 'available') {
        const { data, error } = await supabase
          .from('employees')
          .select('id, e_number, name, job_title_id, team_id')
          .eq('is_active', true)
          .limit(20);
        
        if (error) throw error;
        return data;
      }
      
      if (selectedMetric === 'leave') {
        const { data, error } = await supabase
          .from('attendance')
          .select('employee_id, date, status, employees(name, e_number)')
          .eq('status', 'Annual Leave')
          .gt('date', new Date().toISOString().split('T')[0])
          .limit(20);
        
        if (error) throw error;
        return data;
      }
      
      if (selectedMetric === 'training') {
        const { data, error } = await supabase
          .from('employee_training_schedules')
          .select('employee_id, required_date, training_type_id, employees(name, e_number), training_types(name)')
          .gt('required_date', new Date().toISOString().split('T')[0])
          .lt('required_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .limit(20);
        
        if (error) throw error;
        return data;
      }
      
      if (selectedMetric === 'grounded' || selectedMetric === 'assigned') {
        const status = selectedMetric === 'grounded' ? 'In Progress' : 'Scheduled';
        const { data, error } = await supabase
          .from('maintenance_visits')
          .select('id, aircraft_id, check_type, status, aircraft(registration, aircraft_name)')
          .eq('status', status)
          .limit(20);
        
        if (error) throw error;
        return data;
      }
      
      return [];
    },
    enabled: !!selectedMetric && isSheetOpen,
  });

  const metrics = [
    { 
      id: 'available', 
      label: 'Available Employees', 
      value: employeeMetrics?.active || 0, 
      icon: Users, 
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
      percentage: employeeMetrics ? `${Math.round((employeeMetrics.active / employeeMetrics.total) * 100)}%` : '0%'
    },
    { 
      id: 'leave', 
      label: 'On Leave', 
      value: employeeMetrics?.onLeave || 0, 
      icon: CalendarCheck, 
      color: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
      percentage: employeeMetrics ? `${Math.round((employeeMetrics.onLeave / employeeMetrics.total) * 100)}%` : '0%'
    },
    { 
      id: 'training', 
      label: 'In Training', 
      value: employeeMetrics?.inTraining || 0, 
      icon: GraduationCap, 
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800',
      percentage: employeeMetrics ? `${Math.round((employeeMetrics.inTraining / employeeMetrics.total) * 100)}%` : '0%'
    },
    { 
      id: 'grounded', 
      label: 'Grounded Aircraft', 
      value: aircraftMetrics?.inMaintenance || 0, 
      icon: Plane, 
      color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800',
      percentage: aircraftMetrics ? `${Math.round((aircraftMetrics.inMaintenance / aircraftMetrics.total) * 100)}%` : '0%'
    },
    { 
      id: 'assigned', 
      label: 'Aircraft w/ Teams', 
      value: aircraftMetrics?.scheduled || 0, 
      icon: PlaneTakeoff, 
      color: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
      percentage: aircraftMetrics ? `${Math.round((aircraftMetrics.scheduled / aircraftMetrics.total) * 100)}%` : '0%'
    },
    { 
      id: 'available-aircraft', 
      label: 'Available Aircraft', 
      value: aircraftMetrics?.available || 0, 
      icon: FileCheck, 
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800',
      percentage: aircraftMetrics ? `${Math.round((aircraftMetrics.available / aircraftMetrics.total) * 100)}%` : '0%'
    },
    { 
      id: 'productivity', 
      label: 'Team Utilization', 
      value: employeeMetrics && aircraftMetrics ? 
        Math.round(((employeeMetrics.active - employeeMetrics.onLeave) / employeeMetrics.total) * 100) : 0, 
      icon: Activity, 
      color: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800',
      percentage: '+2%'
    }
  ];

  const handleMetricClick = (metricId: string) => {
    setSelectedMetric(metricId);
    setIsSheetOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {metrics.map((metric) => (
          <MetricCard 
            key={metric.id}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            percentage={metric.percentage}
            onClick={() => handleMetricClick(metric.id)}
          />
        ))}
      </div>

      {/* Metric Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full md:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>
              {metrics.find(m => m.id === selectedMetric)?.label} Details
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedMetric === 'available' && employeeDetails && (
              <div className="space-y-4">
                <p>Showing {employeeDetails.length} of {employeeMetrics?.active || 0} available employees</p>
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Available Employee List</h3>
                  <ul className="space-y-2 divide-y">
                    {employeeDetails.map((employee: any) => (
                      <li key={employee.id} className="flex justify-between pt-2">
                        <span>
                          {employee.name}
                          <span className="text-xs text-gray-500 ml-2">#{employee.e_number}</span>
                        </span>
                        <span className="text-blue-600">Available</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedMetric === 'leave' && employeeDetails && (
              <div className="space-y-4">
                <p>Showing {employeeDetails.length} of {employeeMetrics?.onLeave || 0} employees on leave</p>
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Employees on Leave</h3>
                  <ul className="space-y-2 divide-y">
                    {employeeDetails.map((record: any) => (
                      <li key={record.employee_id} className="flex justify-between pt-2">
                        <span>
                          {record.employees?.name}
                          <span className="text-xs text-gray-500 ml-2">#{record.employees?.e_number}</span>
                        </span>
                        <span className="text-red-600">
                          {record.status} (Until {new Date(record.date).toLocaleDateString()})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedMetric === 'training' && employeeDetails && (
              <div className="space-y-4">
                <p>Showing {employeeDetails.length} of {employeeMetrics?.inTraining || 0} employees in training</p>
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Employees in Training</h3>
                  <ul className="space-y-2 divide-y">
                    {employeeDetails.map((record: any, index: number) => (
                      <li key={`${record.employee_id}-${index}`} className="flex justify-between pt-2">
                        <span>
                          {record.employees?.name}
                          <span className="text-xs text-gray-500 ml-2">#{record.employees?.e_number}</span>
                        </span>
                        <span className="text-purple-600">
                          {record.training_types?.name} ({new Date(record.required_date).toLocaleDateString()})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedMetric === 'grounded' && employeeDetails && (
              <div className="space-y-4">
                <p>Showing {employeeDetails.length} of {aircraftMetrics?.inMaintenance || 0} aircraft in maintenance</p>
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Aircraft in Maintenance</h3>
                  <ul className="space-y-2 divide-y">
                    {employeeDetails.map((record: any) => (
                      <li key={record.id} className="flex justify-between pt-2">
                        <span>
                          {record.aircraft?.aircraft_name}
                          <span className="text-xs text-gray-500 ml-2">{record.aircraft?.registration}</span>
                        </span>
                        <span className="text-amber-600">
                          {record.check_type}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedMetric === 'assigned' && employeeDetails && (
              <div className="space-y-4">
                <p>Showing {employeeDetails.length} of {aircraftMetrics?.scheduled || 0} scheduled aircraft</p>
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Aircraft with Assigned Teams</h3>
                  <ul className="space-y-2 divide-y">
                    {employeeDetails.map((record: any) => (
                      <li key={record.id} className="flex justify-between pt-2">
                        <span>
                          {record.aircraft?.aircraft_name}
                          <span className="text-xs text-gray-500 ml-2">{record.aircraft?.registration}</span>
                        </span>
                        <span className="text-green-600">
                          Scheduled
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Placeholder for other metrics */}
            {!['available', 'leave', 'training', 'grounded', 'assigned'].includes(selectedMetric || '') && (
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                <p className="text-gray-500">Detailed information for this metric is being loaded...</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
