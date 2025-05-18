
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Search, 
  FilterIcon, 
  Download, 
  Menu, 
  UserCog, 
  Calendar, 
  Briefcase 
} from "lucide-react";

// Import our custom components
import { WorkforceHeader } from "@/components/workforce/WorkforceHeader";
import { WorkforceMetrics } from "@/components/workforce/WorkforceMetrics";
import { WorkforceTabs } from "@/components/workforce/WorkforceTabs";
import { WorkspaceSidebar } from "@/components/workforce/WorkspaceSidebar";
import { Input } from "@/components/ui/input";

const AdminWorkforce = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Set page to full height
    document.body.classList.add('h-screen', 'overflow-hidden');
    
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => {
      document.body.classList.remove('h-screen', 'overflow-hidden');
      clearTimeout(timer);
    };
  }, [user, navigate]);

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
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <WorkspaceSidebar isOpen={sidebarOpen} />

        {/* Main Workspace */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 md:p-6 overflow-y-auto space-y-6">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Metrics Dashboard */}
                <WorkforceMetrics />
                
                {/* Tabs Content */}
                <WorkforceTabs />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminWorkforce;
