
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { WorkforceGlobalHeader } from "@/components/workforce/WorkforceGlobalHeader";
import { WorkforceMetrics } from "@/components/workforce/WorkforceMetrics";
import { WorkforceTabs } from "@/components/workforce/tabs/WorkforceTabs";
import { SidePanel } from '@/components/ui/side-panel';
import { useNotification } from '@/contexts/NotificationContext';
import { useSidePanel } from '@/hooks/use-side-panel';
import { EmployeeDetailsPanel } from '@/components/workforce/details/EmployeeDetailsPanel';
import { AircraftDetailsPanel } from '@/components/workforce/details/AircraftDetailsPanel';

const AdminWorkforce = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const sidePanel = useSidePanel();

  // Demo data for notifications
  useEffect(() => {
    if (user) {
      // Example notification when page loads
      setTimeout(() => {
        showToast({
          title: "Welcome back",
          message: "Workforce management dashboard is ready",
          type: "info",
          duration: 5000
        });
      }, 1000);
    }
  }, [user, showToast]);

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

  // Example functions for opening different side panels
  const openEmployeeDetails = (employeeId: string) => {
    // In a real app, we would fetch employee data based on the ID
    const employeeData = {
      id: employeeId,
      name: "Jane Smith",
      role: "Senior Pilot",
      email: "jane.smith@airline.com",
      phone: "+1 (555) 123-4567",
      team: "Flight Crew Alpha",
      status: "Active",
      certifications: ["Commercial Pilot License", "Instrument Rating", "Boeing 737 Type Rating"],
      recentActivities: [
        {
          type: "Training Completed",
          date: "May 15, 2025",
          description: "Annual emergency procedures refresher training"
        },
        {
          type: "Flight Duty",
          date: "May 12, 2025",
          description: "LAX to JFK - 5 hours, 30 minutes"
        },
        {
          type: "Medical Check",
          date: "May 5, 2025",
          description: "Annual medical examination - Cleared"
        }
      ],
      upcomingSchedule: [
        {
          date: "May 22, 2025",
          type: "Flight Assignment",
          details: "SFO to ORD - Boeing 737"
        },
        {
          date: "May 25, 2025",
          type: "Flight Assignment",
          details: "ORD to MIA - Boeing 737"
        },
        {
          date: "May 28-30, 2025",
          type: "Training",
          details: "Simulator Training - New procedures"
        }
      ]
    };
    
    sidePanel.openPanel({
      title: "Employee Details",
      content: <EmployeeDetailsPanel employee={employeeData} />,
    });
  };

  const openAircraftDetails = (aircraftId: string) => {
    // In a real app, we would fetch aircraft data based on the ID
    const aircraftData = {
      id: aircraftId,
      registration: "N12345",
      type: "Boeing 737-800",
      status: "Active",
      totalFlightHours: 32450,
      hoursRemaining: 550,
      maintenanceStatus: 75,
      nextMaintenance: "June 15, 2025",
      recentActivities: [
        {
          type: "Routine Check",
          date: "May 10, 2025",
          description: "Regular A-check completed"
        },
        {
          type: "Component Replacement",
          date: "May 5, 2025",
          description: "APU filter replacement"
        },
        {
          type: "Inspection",
          date: "April 28, 2025",
          description: "Pre-flight inspection"
        }
      ],
      upcomingSchedule: [
        {
          date: "May 21, 2025",
          type: "Flight Assignment",
          details: "LAX to DFW - Flight AA1234"
        },
        {
          date: "May 22, 2025",
          type: "Flight Assignment",
          details: "DFW to MIA - Flight AA5678"
        },
        {
          date: "May 23, 2025",
          type: "Maintenance",
          details: "Routine check - 4 hours"
        }
      ]
    };

    sidePanel.openPanel({
      title: "Aircraft Details",
      content: <AircraftDetailsPanel aircraft={aircraftData} />,
    });
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
        onOpenEmployeeDetails={openEmployeeDetails}
        onOpenAircraftDetails={openAircraftDetails}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Metrics Dashboard - Number Cards */}
          <WorkforceMetrics />
          
          {/* Workforce Tabs */}
          <WorkforceTabs 
            onViewEmployeeDetails={openEmployeeDetails}
            onViewAircraftDetails={openAircraftDetails}
          />
        </div>
      </main>

      {/* Side Panel for Details */}
      {sidePanel.content && (
        <SidePanel
          isOpen={sidePanel.isOpen}
          onClose={sidePanel.closePanel}
          title={sidePanel.content.title}
          description={sidePanel.content.description}
          footer={sidePanel.content.footer}
        >
          {sidePanel.content.content}
        </SidePanel>
      )}
    </div>
  );
};

export default AdminWorkforce;
