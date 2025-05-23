
import { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from '@/integrations/supabase/client';

interface CertificationDetailPanelProps {
  certification: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CertificationDetailPanel = ({ 
  certification, 
  open, 
  onOpenChange 
}: CertificationDetailPanelProps) => {
  const isMobile = useIsMobile();
  const [employeesWithCert, setEmployeesWithCert] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (certification && open) {
      fetchEmployeesWithCertification();
    }
  }, [certification, open]);

  const fetchEmployeesWithCertification = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select(`
          *,
          employees (
            id,
            name,
            e_number,
            job_titles (job_description),
            teams (team_name)
          ),
          authorities (authority_name),
          aircraft (aircraft_name, registration),
          engine_types (engine_name),
          validity_statuses (status)
        `)
        .eq('certification_code_id', certification.id);

      if (error) throw error;
      setEmployeesWithCert(data || []);
    } catch (error) {
      console.error('Error fetching employees with certification:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!certification) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={`w-full ${isMobile ? '' : 'sm:max-w-lg'}`}>
        <SheetHeader>
          <SheetTitle>Certification Details</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Certification Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{certification.certification_code}</h3>
              <p className="text-gray-600 dark:text-gray-400">{certification.certification_description}</p>
            </div>
          </div>

          {/* Employees with this Certification */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Employees with this Certification</h4>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : employeesWithCert.length > 0 ? (
              <div className="space-y-3">
                {employeesWithCert.map((cert) => (
                  <div key={cert.id} className="border rounded-lg p-3 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{cert.employees?.name}</p>
                        <p className="text-sm text-gray-500">
                          ID: {cert.employees?.e_number} • {cert.employees?.job_titles?.job_description}
                        </p>
                        {cert.employees?.teams?.team_name && (
                          <p className="text-sm text-gray-500">Team: {cert.employees.teams.team_name}</p>
                        )}
                      </div>
                      <Badge 
                        variant={cert.validity_statuses?.status === 'Valid' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {cert.validity_statuses?.status || 'Unknown'}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Issued:</span> {new Date(cert.issued_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Expires:</span> {new Date(cert.expiry_date).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {cert.authorities?.authority_name && (
                        <div className="mt-1">
                          <span className="font-medium">Authority:</span> {cert.authorities.authority_name}
                        </div>
                      )}
                      
                      {cert.aircraft?.aircraft_name && (
                        <div className="mt-1">
                          <span className="font-medium">Aircraft:</span> {cert.aircraft.aircraft_name} ({cert.aircraft.registration})
                        </div>
                      )}
                      
                      {cert.engine_types?.engine_name && (
                        <div className="mt-1">
                          <span className="font-medium">Engine:</span> {cert.engine_types.engine_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No employees found with this certification.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
