
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Search, FilterIcon, Download, Users, UserCog, UsersRound, CalendarClock, 
  ClipboardCheck, FileText, ArrowUpRight, UserPlus, Calendar, Briefcase, User2 } from "lucide-react";

// Import our custom components
import { WorkforceMetrics } from "@/components/workforce/WorkforceMetrics";
import { ScheduleCalendar } from "@/components/workforce/ScheduleCalendar";
import { AircraftGanttChart } from "@/components/workforce/AircraftGanttChart";
import { ManagementShortcuts } from "@/components/workforce/ManagementShortcuts";
import { CertificationList } from "@/components/workforce/CertificationList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const AdminWorkforce = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [calendarScrollLeft, setCalendarScrollLeft] = useState(0);
  const [currentView, setCurrentView] = useState("employee");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
    
    // Set page to full height and overflow
    document.body.classList.add('min-h-screen', 'h-full', 'overflow-hidden');
    
    return () => {
      document.body.classList.remove('min-h-screen', 'h-full', 'overflow-hidden');
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
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Maintenance Workforce Dashboard
            <span className="text-xs text-gray-500 font-normal ml-2">Aircraft Maintenance Management System</span>
          </h1>
          <div className="flex gap-4 items-center">
            <div className="relative max-w-md w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search employees, aircraft..." 
                className="pl-8 h-9 focus-visible:ring-blue-500" 
              />
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <FilterIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced Search & Filtering</span>
            </Button>
            <span className="text-sm font-medium hidden md:block">
              {user.employee ? `${user.employee.name}` : user.username}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] mx-auto px-4 sm:px-6 py-4 w-full overflow-hidden flex flex-col">
        {/* Metrics Dashboard */}
        <WorkforceMetrics />
        
        {/* View Tabs */}
        <Tabs 
          value={currentView} 
          onValueChange={setCurrentView} 
          className="mt-4"
        >
          <div className="flex items-center justify-between mb-2">
            <TabsList className="h-10">
              <TabsTrigger value="employee" className="flex items-center gap-1">
                <User2 className="h-4 w-4" />
                Employee View
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-1">
                <UsersRound className="h-4 w-4" />
                Team View
              </TabsTrigger>
              <TabsTrigger value="aircraft" className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                Aircraft View
              </TabsTrigger>
              <TabsTrigger value="certification" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Certification View
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Compare Schedules
            </Button>
          </div>

          <TabsContent value="employee" className="mt-2 space-y-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Employee Schedule</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="outline" size="sm">Today</Button>
                <Button variant="outline" size="sm">Next</Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Schedule Calendar */}
            <div className="flex-grow overflow-hidden">
              <ScheduleCalendar onScroll={handleCalendarScroll} />
            </div>
          </TabsContent>

          <TabsContent value="aircraft" className="mt-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Aircraft Maintenance Schedule</h2>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" />
                Export Schedule
              </Button>
            </div>

            {/* Aircraft Gantt Chart */}
            <AircraftGanttChart scrollLeft={calendarScrollLeft} />
          </TabsContent>

          <TabsContent value="team" className="mt-2">
            <div className="h-[400px] flex items-center justify-center border rounded-lg">
              <p className="text-gray-500">Team view content will be displayed here.</p>
            </div>
          </TabsContent>

          <TabsContent value="certification" className="mt-2">
            <div className="h-[400px] flex items-center justify-center border rounded-lg">
              <p className="text-gray-500">Certification view content will be displayed here.</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Management Features and Certification Status - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 mt-6">
          <ManagementShortcuts />
          <CertificationList />
        </div>
      </main>
    </div>
  );
};

export default AdminWorkforce;
