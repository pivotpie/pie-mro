
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  percentage?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

const MetricCard = ({ label, value, icon: Icon, color, percentage, onClick, isLoading }: MetricCardProps) => (
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
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-7 w-12 bg-gray-300 dark:bg-gray-700 animate-pulse rounded"></div>
            ) : (
              value
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
        </div>
      </div>
      {percentage && !isLoading && (
        <div className="text-xs bg-white/70 dark:bg-gray-800/70 px-2 py-0.5 rounded-full">
          {percentage}
        </div>
      )}
    </CardContent>
  </Card>
);

export const WorkforceMetrics = () => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [detailData, setDetailData] = useState<any[]>([]);
  
  // Fetch employee metrics
  const { data: employeeMetrics, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employeeMetrics'],
    queryFn: async () => {
      // Get all employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*');
        
      if (employeesError) throw employeesError;
      
      // Get leave data (using attendance table with status = 'Annual Leave')
      const { data: onLeave, error: leaveError } = await supabase
        .from('attendance')
        .select('employee_id')
        .eq('status', 'Annual Leave')
        .gt('date', new Date().toISOString().split('T')[0]);
        
      if (leaveError) throw leaveError;
      
      // Get training data (using employee_training_schedules table)
      const { data: inTraining, error: trainingError } = await supabase
        .from('employee_training_schedules')
        .select('employee_id')
        .gt('required_date', new Date().toISOString().split('T')[0])
        .lt('required_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
      if (trainingError) throw trainingError;
      
      // Calculate metrics
      return {
        total: employees.length,
        active: employees.filter(e => e.is_active).length,
        onLeave: new Set(onLeave.map(l => l.employee_id)).size,
        inTraining: new Set(inTraining.map(t => t.employee_id)).size,
      };
    }
  });

  // Fetch aircraft metrics
  const { data: aircraftMetrics, isLoading: loadingAircraft } = useQuery({
    queryKey: ['aircraftMetrics'],
    queryFn: async () => {
      // Get all aircraft
      const { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*');
        
      if (aircraftError) throw aircraftError;
      
      // Get maintenance visits data
      const { data: visits, error: visitsError } = await supabase
        .from('maintenance_visits')
        .select('*');
        
      if (visitsError) throw visitsError;
      
      // Calculate metrics
      const inMaintenance = new Set(visits
        .filter(v => v.status === 'In Progress')
        .map(v => v.aircraft_id)).size;
        
      const scheduled = new Set(visits
        .filter(v => v.status === 'Scheduled')
        .map(v => v.aircraft_id)).size;
      
      return {
        total: aircraft.length,
        inMaintenance,
        scheduled,
        available: aircraft.length - inMaintenance - scheduled
      };
    }
  });

  const isLoading = loadingEmployees || loadingAircraft;

  // Fetch detail data when a metric is selected
  useEffect(() => {
    const fetchDetailData = async () => {
      if (!selectedMetric) return;
      
      let data: any[] = [];
      
      try {
        switch (selectedMetric) {
          case 'available':
            const { data: availableEmployees } = await supabase
              .from('employees')
              .select('*, job_titles(job_description)')
              .eq('is_active', true)
              .not('id', 'in', `(${await getEmployeesOnLeaveOrTraining()})`);
            data = availableEmployees || [];
            break;
          
          case 'leave':
            const { data: onLeave } = await supabase
              .from('attendance')
              .select('*, employees(name, e_number, job_titles(job_description))')
              .eq('status', 'Annual Leave')
              .gt('date', new Date().toISOString().split('T')[0]);
            data = onLeave || [];
            break;
            
          case 'training':
            const { data: inTraining } = await supabase
              .from('employee_training_schedules')
              .select('*, employees(name, e_number, job_titles(job_description)), training_types(name)')
              .gt('required_date', new Date().toISOString().split('T')[0])
              .lt('required_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            data = inTraining || [];
            break;
            
          case 'grounded':
            const { data: groundedAircraft } = await supabase
              .from('maintenance_visits')
              .select('*, aircraft(aircraft_name, registration)')
              .eq('status', 'In Progress');
            data = groundedAircraft || [];
            break;
            
          case 'assigned':
            const { data: assignedAircraft } = await supabase
              .from('maintenance_visits')
              .select('*, aircraft(aircraft_name, registration)')
              .eq('status', 'In Progress')
              .gt('personnel_count', 0);
            data = assignedAircraft || [];
            break;
            
          case 'pending':
            const { data: pendingAircraft } = await supabase
              .from('maintenance_visits')
              .select('*, aircraft(aircraft_name, registration)')
              .eq('status', 'Scheduled');
            data = pendingAircraft || [];
            break;
        }
        
        setDetailData(data);
      } catch (error) {
        console.error('Error fetching detail data:', error);
      }
    };
    
    // Helper function to get employees who are on leave or training
    const getEmployeesOnLeaveOrTraining = async () => {
      // Get employees on leave
      const { data: onLeave } = await supabase
        .from('attendance')
        .select('employee_id')
        .eq('status', 'Annual Leave')
        .gt('date', new Date().toISOString().split('T')[0]);
        
      // Get employees in training
      const { data: inTraining } = await supabase
        .from('employee_training_schedules')
        .select('employee_id')
        .gt('required_date', new Date().toISOString().split('T')[0])
        .lt('required_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
      // Combine and deduplicate
      const employeeIds = [...(onLeave || []), ...(inTraining || [])]
        .map(item => item.employee_id)
        .filter((value, index, self) => self.indexOf(value) === index);
        
      return employeeIds.join(',') || '0';
    };
    
    if (selectedMetric && isSheetOpen) {
      fetchDetailData();
    }
  }, [selectedMetric, isSheetOpen]);

  const handleMetricClick = (metricId: string) => {
    setSelectedMetric(metricId);
    setIsSheetOpen(true);
  };

  const getDetailTitle = () => {
    switch (selectedMetric) {
      case 'available': return 'Available Employees';
      case 'leave': return 'Employees on Leave';
      case 'training': return 'Employees in Training';
      case 'grounded': return 'Grounded Aircraft';
      case 'assigned': return 'Aircraft with Assigned Teams';
      case 'pending': return 'Aircraft Pending Assignment';
      default: return 'Details';
    }
  };

  // Function to render appropriate detail content based on selected metric
  const renderDetailContent = () => {
    if (detailData.length === 0) {
      return <div className="p-4 text-center text-gray-500">No data available</div>;
    }
    
    switch (selectedMetric) {
      case 'available':
      case 'leave':
      case 'training':
        return (
          <div className="space-y-4">
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                    {selectedMetric === 'training' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Training</th>
                    )}
                    {selectedMetric === 'leave' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Until</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {detailData.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {selectedMetric === 'available' ? item.name : 
                         selectedMetric === 'leave' ? item.employees?.name :
                         item.employees?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {selectedMetric === 'available' ? `E${item.e_number}` : 
                         selectedMetric === 'leave' ? `E${item.employees?.e_number}` : 
                         `E${item.employees?.e_number}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {selectedMetric === 'available' ? 
                          (item.job_titles?.job_description || 'N/A') : 
                         selectedMetric === 'leave' ? 
                          (item.employees?.job_titles?.job_description || 'N/A') : 
                          (item.employees?.job_titles?.job_description || 'N/A')}
                      </td>
                      {selectedMetric === 'training' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.training_types?.name || 'N/A'}
                        </td>
                      )}
                      {selectedMetric === 'leave' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        
      case 'grounded':
      case 'assigned':
      case 'pending':
        return (
          <div className="space-y-4">
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aircraft</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Registration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Range</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {detailData.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {item.aircraft?.aircraft_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.aircraft?.registration || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.check_type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.date_in).toLocaleDateString()} - {new Date(item.date_out).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        
      default:
        return <div className="p-4 text-center text-gray-500">Select a metric to view details</div>;
    }
  };
  
  const metrics = [
    { 
      id: 'available', 
      label: 'Available Employees', 
      value: isLoading ? '-' : (employeeMetrics?.active || 0) - (employeeMetrics?.onLeave || 0) - (employeeMetrics?.inTraining || 0), 
      icon: Users, 
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
    },
    { 
      id: 'leave', 
      label: 'On Leave', 
      value: isLoading ? '-' : employeeMetrics?.onLeave || 0, 
      icon: CalendarCheck, 
      color: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
    },
    { 
      id: 'training', 
      label: 'In Training', 
      value: isLoading ? '-' : employeeMetrics?.inTraining || 0, 
      icon: GraduationCap, 
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800',
    },
    { 
      id: 'grounded', 
      label: 'Grounded Aircraft', 
      value: isLoading ? '-' : aircraftMetrics?.inMaintenance || 0, 
      icon: Plane, 
      color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800',
    },
    { 
      id: 'assigned', 
      label: 'Aircraft w/ Teams', 
      value: isLoading ? '-' : aircraftMetrics?.inMaintenance || 0, 
      icon: PlaneTakeoff, 
      color: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
    },
    { 
      id: 'pending', 
      label: 'Pending Assignment', 
      value: isLoading ? '-' : aircraftMetrics?.scheduled || 0, 
      icon: FileCheck, 
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800',
    },
    { 
      id: 'productivity', 
      label: 'Available Aircraft', 
      value: isLoading ? '-' : aircraftMetrics?.available || 0, 
      icon: Activity, 
      color: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800',
    }
  ];

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
            isLoading={isLoading}
            onClick={() => handleMetricClick(metric.id)}
          />
        ))}
      </div>

      {/* Metric Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full md:max-w-[700px]">
          <SheetHeader>
            <SheetTitle>{getDetailTitle()}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-x-auto">
            {renderDetailContent()}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
