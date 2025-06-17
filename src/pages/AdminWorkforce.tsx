
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { X } from 'lucide-react';
import { WorkforceGlobalHeader } from "@/components/workforce/WorkforceGlobalHeader";
import WorkforceMetrics from "@/components/workforce/WorkforceMetrics";
import { WorkforceTabs } from "@/components/workforce/tabs/WorkforceTabs";
import { FloatingActionMenu } from "@/components/workforce/FloatingActionMenu";
import { ManagementShortcuts } from "@/components/workforce/ManagementShortcuts";
import { CertificationList } from "@/components/workforce/CertificationList";
import { EmployeeDetailPanel } from "@/components/workforce/employee/EmployeeDetailPanel";
import { AircraftScheduleSection } from "@/components/workforce/AircraftScheduleSection";
import { supabase } from "@/integrations/supabase/client";
import { AircraftDetailsModal } from "@/components/workforce/schedule/AircraftDetailsModal";
import { useRefresh } from '@/contexts/RefreshContext';


interface CertificationData {
  id: number;
  certification_code: string;
  certification_description: string;
  [key: string]: any;
}

const AdminWorkforce = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();

  
  const [showEmployeePanel, setShowEmployeePanel] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  const [showCertificationPanel, setShowCertificationPanel] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<CertificationData | null>(null);
  
  const [showAircraftModal, setShowAircraftModal] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<any>(null);
  

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
  
  const handleItemSelect = async (type: 'employee' | 'aircraft' | 'certification', item: any) => {
    switch (type) {
      case 'employee':
        setSelectedEmployee(item);
        setShowEmployeePanel(true);
        setShowCertificationPanel(false);
        break;
        
      case 'aircraft':
        setSelectedAircraft(item);
        setShowAircraftModal(true);
        break;
        
      case 'certification':
        setSelectedCertification(item);
        setShowCertificationPanel(true);
        setShowEmployeePanel(false);
        break;
    }
  };

  const handleCertificationClick = async (certification: CertificationData) => {
    setSelectedCertification(certification);
    setShowCertificationPanel(true);
    setShowEmployeePanel(false);
  };

  const handleAircraftModalClose = (open: boolean) => {
    setShowAircraftModal(open);
    if (!open) {
      // Trigger refresh when modal closes
      triggerRefresh();
    }
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
        onItemSelect={handleItemSelect}
      />

      {/* Main Content - Allow both x and y scrolling */}
      <main className="flex-1 w-full overflow-hidden">
        <div className="w-full h-full flex">
          {/* Main content with overflow */}
          <div className="flex-1 overflow-auto">
            {/* Metrics Dashboard - Number Cards */}
            <div className="p-4 md:p-6">
              <WorkforceMetrics />
              
              {/* Simplified Workforce Tabs - Only Employee and Assignment Calendars */}
              <WorkforceTabs />

              {/* Aircraft Schedule Section - Standalone */}
              <AircraftScheduleSection />

              {/* Management Shortcuts and Certification Lists */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <ManagementShortcuts />
                </div>
                <div className="lg:col-span-2">
                  <CertificationList onCertificationClick={handleCertificationClick} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Side panel for employee details - slide in from right */}
          {selectedEmployee && (
            <EmployeeDetailPanel 
              employee={selectedEmployee} 
              open={showEmployeePanel}
              onOpenChange={setShowEmployeePanel}
            />
          )}
          
          {/* Side panel for certification details - slide in from right */}
          {showCertificationPanel && selectedCertification && (
            <div className="w-full max-w-md border-l dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Certification Details</h2>
                  <button 
                    onClick={() => setShowCertificationPanel(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">{selectedCertification.certification_code}</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedCertification.certification_description}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCertification.requirements || 'Standard certification requirements apply'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Validity</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCertification.validity_period || '24 months from date of issue'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Certified Employees</h4>
                    <CertifiedEmployeesList certificationId={selectedCertification.id} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Aircraft Details Modal */}
      <AircraftDetailsModal
        open={showAircraftModal}
        onOpenChange={handleAircraftModalClose}  // Changed from setShowAircraftModal
        aircraft={selectedAircraft}
      />
      
      {/* Floating Action Menu for Quick Actions - Now includes Set Date */}
      <FloatingActionMenu />

      {/* Add global styles for Dialog/Modal components */}
      <style dangerouslySetInnerHTML={{ 
        __html: `
          /* Style to make all dialogs centered with 80% width and height */
          [data-radix-dialog-content] {
            max-width: 80vw !important;
            width: 80vw !important;
            max-height: 80vh !important;
            height: 80vh !important;
          }
        `
      }} />
    </div>
  );
};

// Helper component to show employees with a specific certification
const CertifiedEmployeesList = ({ certificationId }: { certificationId: number }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertifiedEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('certifications')
          .select(`
            id, 
            employees (
              id,
              name,
              e_number,
              employee_status,
              job_titles (job_description)
            )
          `)
          .eq('certification_code_id', certificationId);
          
        if (error) throw error;
        
        const employeeData = data
          ?.map(cert => cert.employees)
          .filter(Boolean) || [];
          
        setEmployees(employeeData);
      } catch (error) {
        console.error('Error fetching certified employees:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertifiedEmployees();
  }, [certificationId]);
  
  if (loading) {
    return <div className="py-4">Loading employees...</div>;
  }
  
  if (!employees.length) {
    return <div className="py-4 text-gray-500">No employees with this certification</div>;
  }
  
  return (
    <ul className="space-y-2 max-h-60 overflow-y-auto">
      {employees.map(emp => (
        <li key={emp.id} className="flex items-center px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center mr-3">
            {emp.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{emp.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {emp.job_titles?.job_description || "Employee"} • #{emp.e_number}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default AdminWorkforce;
