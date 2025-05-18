
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";

// Import our custom components
import { WorkforceMetrics } from "@/components/workforce/WorkforceMetrics";
import { ScheduleCalendar } from "@/components/workforce/ScheduleCalendar";
import { AircraftGanttChart } from "@/components/workforce/AircraftGanttChart";
import { ManagementShortcuts } from "@/components/workforce/ManagementShortcuts";
import { CertificationList } from "@/components/workforce/CertificationList";
import { FloatingActionMenu } from "@/components/workforce/FloatingActionMenu";
import { UniversalSearch } from "@/components/workforce/UniversalSearch";
import { ThemeToggle } from "@/components/workforce/ThemeToggle";

const AdminWorkforce = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [calendarScrollLeft, setCalendarScrollLeft] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
    
    // Set page to full height
    document.body.classList.add('min-h-screen', 'h-full');
    
    return () => {
      document.body.classList.remove('min-h-screen', 'h-full');
    };
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleCalendarScroll = (scrollLeft: number) => {
    setCalendarScrollLeft(scrollLeft);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Workforce Management</h1>
          <div className="flex gap-4 items-center">
            <span className="font-medium">
              {user.employee ? `${user.employee.name} (${user.employee.e_number})` : user.username}
            </span>
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <WorkforceMetrics />
        
        {/* Universal Search */}
        <UniversalSearch />

        {/* Schedule Calendar */}
        <div className="mb-1 mt-6">
          <h2 className="text-xl font-semibold mb-2">Employee Schedule Calendar</h2>
          <ScheduleCalendar onScroll={handleCalendarScroll} />
        </div>
        
        {/* Aircraft Gantt Chart - synchronized with calendar */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Aircraft Schedule</h2>
          <AircraftGanttChart scrollLeft={calendarScrollLeft} />
        </div>
        
        {/* Management Features - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 mt-6">
          <ManagementShortcuts />
          <CertificationList />
        </div>
        
        {/* Floating Action Menu */}
        <FloatingActionMenu />
        
        <div className="mt-6 text-right">
          <Button 
            variant="default" 
            onClick={() => navigate('/manager-dashboard')}
            className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Go to Manager Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkforce;
