
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
    <div className="min-h-screen bg-gray-100 p-6 dark:bg-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Workforce Management</h1>
          <div className="flex gap-4 items-center">
            <span className="font-medium">
              {user.employee ? `${user.employee.name} (${user.employee.e_number})` : user.username}
            </span>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <WorkforceMetrics />
        
        {/* Universal Search */}
        <UniversalSearch />

        {/* Schedule Calendar */}
        <ScheduleCalendar onScroll={handleCalendarScroll} />
        
        {/* Aircraft Gantt Chart - synchronized with calendar */}
        <AircraftGanttChart scrollLeft={calendarScrollLeft} />

        {/* Management Features - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 mt-6">
          <ManagementShortcuts />
          <CertificationList />
        </div>
        
        {/* Floating Action Menu */}
        <FloatingActionMenu />
        
        {/* Theme Toggle */}
        <ThemeToggle />
        
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
