
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { ThemeToggle } from "@/components/workforce/ThemeToggle";
import { WorkforceHeader } from "@/components/workforce/WorkforceHeader";
import { WorkforceMetrics } from "@/components/workforce/WorkforceMetrics";
import { UniversalSearch } from '@/components/workforce/UniversalSearch';
import { AircraftScheduleView } from '@/components/workforce/tabs/AircraftScheduleView';

const AdminWorkforce = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Set page to full height
    document.body.classList.add('h-screen', 'overflow-hidden');
    
    return () => {
      document.body.classList.remove('h-screen', 'overflow-hidden');
    };
  }, [user, navigate]);

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
    },
    enabled: !!user,
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
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
    toast.success("Logged out successfully");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user) {
    return null;
  }

  const isLoading = loadingEmployees || loadingAircraft;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <WorkforceHeader 
        user={user} 
        onToggleSidebar={toggleSidebar} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 md:p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Universal Search */}
              <UniversalSearch />
              
              {/* Metrics Dashboard */}
              <WorkforceMetrics 
                employeeMetrics={employeeMetrics} 
                aircraftMetrics={aircraftMetrics} 
              />
              
              {/* Aircraft Schedule View */}
              <AircraftScheduleView />
            </>
          )}
        </div>
      </main>
      
      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  );
};

export default AdminWorkforce;
