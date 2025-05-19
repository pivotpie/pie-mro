
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { WorkforceGlobalHeader } from "@/components/workforce/WorkforceGlobalHeader";
import { WorkforceMetrics } from "@/components/workforce/WorkforceMetrics";
import { WorkforceTabs } from "@/components/workforce/tabs/WorkforceTabs";

const AdminWorkforce = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
    toast.success("Logged out successfully");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Global Header */}
      <WorkforceGlobalHeader 
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Metrics Dashboard - Number Cards */}
          <WorkforceMetrics />
          
          {/* Workforce Tabs */}
          <WorkforceTabs />
        </div>
      </main>
    </div>
  );
};

export default AdminWorkforce;
