
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { WorkforceGlobalHeader } from "@/components/workforce/WorkforceGlobalHeader";
import { WorkforceMetrics } from "@/components/workforce/WorkforceMetrics";
import { WorkforceTabs } from "@/components/workforce/WorkforceTabs";
import { FloatingActionMenu } from "@/components/workforce/FloatingActionMenu";
import { ManagementShortcuts } from "@/components/workforce/ManagementShortcuts";
import { CertificationList } from "@/components/workforce/CertificationList";

const AdminWorkforce = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Set page to full height and remove body overflow restriction
    document.body.classList.add('h-screen');
    document.documentElement.classList.add('h-screen');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.classList.remove('h-screen');
      document.documentElement.classList.remove('h-screen');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
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
    <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Global Header with full width */}
      <WorkforceGlobalHeader 
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content - Allow both x and y scrolling */}
      <main className="flex-1 w-full overflow-hidden">
        <div className="w-full h-full overflow-auto">
          {/* Metrics Dashboard - Number Cards */}
          <div className="p-4 md:p-6">
            <WorkforceMetrics />
            
            {/* Workforce Tabs */}
            <WorkforceTabs />

            {/* Management Shortcuts and Certification Lists */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <ManagementShortcuts />
              </div>
              <div className="lg:col-span-2">
                <CertificationList />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Floating Action Menu for Quick Actions */}
      <FloatingActionMenu />

      {/* Add global styles for Dialog/Modal components */}
      <style jsx global>{`
        /* Style to make all dialogs centered with 80% width and height */
        [data-radix-dialog-content] {
          max-width: 80vw !important;
          width: 80vw !important;
          max-height: 80vh !important;
          height: 80vh !important;
        }
      `}</style>
    </div>
  );
};

export default AdminWorkforce;
