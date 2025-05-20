
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { WorkforceGlobalHeader } from "@/components/workforce/WorkforceGlobalHeader";
import { WorkforceTabs } from "@/components/workforce/WorkforceTabs";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    <TooltipProvider>
      <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        {/* Global Header with full width */}
        <WorkforceGlobalHeader 
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Content - Allow both x and y scrolling */}
        <main className="flex-1 w-full overflow-hidden">
          <div className="w-full h-full overflow-auto">
            {/* Workforce Tabs with integrated metrics at the top */}
            <div className="p-4 md:p-6">
              <WorkforceTabs />
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AdminWorkforce;
