
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { 
  Users, 
  CalendarCheck, 
  GraduationCap, 
  PlaneTakeoff, 
  Plane, 
  FileCheck, 
  Activity,
  Download,
  Filter,
  X
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({});
  
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
              .select(`
                *, 
                job_titles(job_description),
                team:teams(team_name),
                certifications(*),
                employee_authorizations(*),
                attendance(*)
              `)
              .eq('is_active', true)
              .not('id', 'in', `(${await getEmployeesOnLeaveOrTraining()})`);
            data = availableEmployees || [];
            break;
          
          case 'leave':
            const { data: onLeave } = await supabase
              .from('attendance')
              .select(`
                *, 
                employees(
                  *,
                  job_titles(job_description),
                  team:teams(team_name),
                  certifications(*),
                  employee_authorizations(*)
                )
              `)
              .eq('status', 'Annual Leave')
              .gt('date', new Date().toISOString().split('T')[0]);
            data = onLeave || [];
            break;
            
          case 'training':
            const { data: inTraining } = await supabase
              .from('employee_training_schedules')
              .select(`
                *, 
                employees(
                  *,
                  job_titles(job_description),
                  team:teams(team_name),
                  certifications(*),
                  employee_authorizations(*)
                ), 
                training_types(*)
              `)
              .gt('required_date', new Date().toISOString().split('T')[0])
              .lt('required_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            data = inTraining || [];
            break;
            
          case 'grounded':
            const { data: groundedAircraft } = await supabase
              .from('maintenance_visits')
              .select(`
                *, 
                aircraft(
                  *,
                  aircraft_types(*)
                ),
                personnel_requirements(*)
              `)
              .eq('status', 'In Progress');
            data = groundedAircraft || [];
            break;
            
          case 'assigned':
            const { data: assignedAircraft } = await supabase
              .from('maintenance_visits')
              .select(`
                *, 
                aircraft(
                  *,
                  aircraft_types(*)
                ),
                personnel_requirements(*)
              `)
              .eq('status', 'In Progress')
              .gt('personnel_count', 0);
            data = assignedAircraft || [];
            break;
            
          case 'pending':
            const { data: pendingAircraft } = await supabase
              .from('maintenance_visits')
              .select(`
                *, 
                aircraft(
                  *,
                  aircraft_types(*)
                )
              `)
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
    
    if (selectedMetric && isDialogOpen) {
      fetchDetailData();
    }
  }, [selectedMetric, isDialogOpen]);

  const handleMetricClick = (metricId: string) => {
    setSelectedMetric(metricId);
    setIsDialogOpen(true);
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

  const handleExport = () => {
    try {
      // Convert data to CSV
      if (!detailData || detailData.length === 0) {
        toast.error("No data to export");
        return;
      }

      // Prepare data for CSV export based on selected metric
      let csvData: any[] = [];
      let filename = '';

      switch (selectedMetric) {
        case 'available':
          csvData = detailData.map(item => ({
            Name: item.name,
            'Employee ID': `E${item.e_number}`,
            Position: item.job_titles?.job_description || 'N/A',
            Team: item.team?.team_name || 'N/A',
            Mobile: item.mobile_number || 'N/A',
            'Date of Joining': item.date_of_joining ? new Date(item.date_of_joining).toLocaleDateString() : 'N/A'
          }));
          filename = 'available-employees.csv';
          break;
        
        case 'leave':
          csvData = detailData.map(item => ({
            Name: item.employees?.name || 'N/A',
            'Employee ID': `E${item.employees?.e_number}` || 'N/A',
            Position: item.employees?.job_titles?.job_description || 'N/A',
            Team: item.employees?.team?.team_name || 'N/A',
            Mobile: item.employees?.mobile_number || 'N/A',
            'Leave Until': item.date ? new Date(item.date).toLocaleDateString() : 'N/A'
          }));
          filename = 'employees-on-leave.csv';
          break;
          
        case 'training':
          csvData = detailData.map(item => ({
            Name: item.employees?.name || 'N/A',
            'Employee ID': `E${item.employees?.e_number}` || 'N/A',
            Position: item.employees?.job_titles?.job_description || 'N/A',
            Team: item.employees?.team?.team_name || 'N/A',
            Mobile: item.employees?.mobile_number || 'N/A',
            Training: item.training_types?.name || 'N/A',
            'Training Date': item.required_date ? new Date(item.required_date).toLocaleDateString() : 'N/A'
          }));
          filename = 'employees-in-training.csv';
          break;
          
        default:
          csvData = detailData;
          filename = 'export.csv';
      }

      // Convert to CSV
      const headers = Object.keys(csvData[0]);
      let csvContent = headers.join(',') + '\n';
      
      csvContent += csvData.map(row => {
        return headers.map(header => {
          const cell = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(cell).includes('"') ? String(cell).replace(/"/g, '""') : String(cell);
          return cell.toString().includes(',') ? `"${escaped}"` : escaped;
        }).join(',');
      }).join('\n');
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Export completed successfully");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export data");
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Join Date</TableHead>
                  {selectedMetric === 'training' && <TableHead>Training</TableHead>}
                  {selectedMetric === 'training' && <TableHead>Date</TableHead>}
                  {selectedMetric === 'leave' && <TableHead>Until</TableHead>}
                  <TableHead>Certifications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailData.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {selectedMetric === 'available' ? item.name : 
                       selectedMetric === 'leave' ? item.employees?.name :
                       item.employees?.name}
                    </TableCell>
                    <TableCell>
                      {selectedMetric === 'available' ? `E${item.e_number}` : 
                       selectedMetric === 'leave' ? `E${item.employees?.e_number}` : 
                       `E${item.employees?.e_number}`}
                    </TableCell>
                    <TableCell>
                      {selectedMetric === 'available' ? 
                        (item.job_titles?.job_description || 'N/A') : 
                       selectedMetric === 'leave' ? 
                        (item.employees?.job_titles?.job_description || 'N/A') : 
                        (item.employees?.job_titles?.job_description || 'N/A')}
                    </TableCell>
                    <TableCell>
                      {selectedMetric === 'available' ? 
                        (item.team?.team_name || 'N/A') : 
                       selectedMetric === 'leave' ? 
                        (item.employees?.team?.team_name || 'N/A') : 
                        (item.employees?.team?.team_name || 'N/A')}
                    </TableCell>
                    <TableCell>
                      {selectedMetric === 'available' ? 
                        (item.mobile_number || 'N/A') : 
                       selectedMetric === 'leave' ? 
                        (item.employees?.mobile_number || 'N/A') : 
                        (item.employees?.mobile_number || 'N/A')}
                    </TableCell>
                    <TableCell>
                      {selectedMetric === 'available' ? 
                        (item.date_of_joining ? new Date(item.date_of_joining).toLocaleDateString() : 'N/A') : 
                       selectedMetric === 'leave' ? 
                        (item.employees?.date_of_joining ? new Date(item.employees?.date_of_joining).toLocaleDateString() : 'N/A') : 
                        (item.employees?.date_of_joining ? new Date(item.employees?.date_of_joining).toLocaleDateString() : 'N/A')}
                    </TableCell>
                    {selectedMetric === 'training' && (
                      <TableCell>
                        {item.training_types?.name || 'N/A'}
                      </TableCell>
                    )}
                    {selectedMetric === 'training' && (
                      <TableCell>
                        {item.required_date ? new Date(item.required_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    )}
                    {selectedMetric === 'leave' && (
                      <TableCell>
                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>
                      {selectedMetric === 'available' ? 
                        ((item.certifications && item.certifications.length) || '0') : 
                       selectedMetric === 'leave' ? 
                        ((item.employees?.certifications && item.employees?.certifications.length) || '0') : 
                        ((item.employees?.certifications && item.employees?.certifications.length) || '0')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
        
      case 'grounded':
      case 'assigned':
      case 'pending':
        return (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aircraft</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Check Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Hangars</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailData.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {item.aircraft?.aircraft_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.aircraft?.registration || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.aircraft?.aircraft_types?.type_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.check_type || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.status === 'In Progress' ? 
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                        item.status === 'Completed' ? 
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {item.status || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(item.date_in).toLocaleDateString()} - {new Date(item.date_out).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {item.total_hours || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.hangar_id || 'Not Assigned'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      {/* Metric Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-4/5 h-4/5 max-w-[90vw] max-h-[90vh]" onInteractOutside={e => e.preventDefault()}>
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle className="text-xl">{getDetailTitle()}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </DialogHeader>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              {detailData.length} record{detailData.length !== 1 ? 's' : ''} found
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Filter Records</AlertDialogTitle>
                    <AlertDialogDescription>
                      Filter options would go here. This is a placeholder for future functionality.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Apply Filter</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100%-8rem)] pr-4">
            {renderDetailContent()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
