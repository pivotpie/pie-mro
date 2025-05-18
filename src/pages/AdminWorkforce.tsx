
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
import { WorkforceTabs } from '@/components/workforce/WorkforceTabs';
import { ManagementShortcuts } from '@/components/workforce/ManagementShortcuts';

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

  // Fetch employee metrics data is now handled in the WorkforceMetrics component

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

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <WorkforceHeader 
        user={user} 
        onToggleSidebar={toggleSidebar} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex">
        {/* Sidebar with management shortcuts */}
        <aside className="hidden md:block w-64 lg:w-72 border-r bg-white dark:bg-gray-800 dark:border-gray-700 overflow-y-auto">
          <ManagementShortcuts />
        </aside>
        
        {/* Main content area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
          {/* Universal Search */}
          <UniversalSearch />
          
          {/* Metrics Dashboard */}
          <WorkforceMetrics />
          
          {/* Tabbed View for Employee, Team, Aircraft, and Certification data */}
          <WorkforceTabs />
        </div>
      </main>
      
      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  );
};

export default AdminWorkforce;
