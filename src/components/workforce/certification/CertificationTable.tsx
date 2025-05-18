
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface CertificationWithDetails {
  id: number;
  employee?: {
    name: string;
    e_number: number;
  };
  certification_code?: {
    certification_code: string;
    certification_description: string;
  };
  issued_date: string;
  expiry_date: string;
  validity_status?: {
    status: string;
  };
  authority?: {
    authority_name: string;
  };
}

export const CertificationTable = () => {
  const [certifications, setCertifications] = useState<CertificationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('certifications')
          .select(`
            id,
            issued_date,
            expiry_date,
            employee:employee_id(name, e_number),
            certification_code:certification_code_id(certification_code, certification_description),
            validity_status:validity_status_id(status),
            authority:authority_id(authority_name)
          `)
          .order('expiry_date')
          .limit(10);
        
        if (error) {
          throw error;
        }

        setCertifications(data || []);
      } catch (error: any) {
        toast.error(`Error loading certifications: ${error.message}`);
        console.error("Error fetching certifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const daysUntilExpiry = (dateString: string) => {
    if (!dateString) return 0;
    
    const today = new Date();
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getExpiryStatus = (dateString: string) => {
    const days = daysUntilExpiry(dateString);
    
    if (days < 0) {
      return { status: "Expired", class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" };
    } else if (days <= 30) {
      return { status: "Expiring Soon", class: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" };
    } else {
      return { status: "Valid", class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" };
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : certifications.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            No certifications found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certification</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certifications.map((cert) => {
                const expiryStatus = getExpiryStatus(cert.expiry_date);
                
                return (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div className="font-medium">
                        {cert.certification_code?.certification_description || 'Unknown Certification'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {cert.certification_code?.certification_code || 'No Code'} - {cert.authority?.authority_name || 'Unknown Authority'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{cert.employee?.name || 'Unknown Employee'}</div>
                      <div className="text-xs text-gray-500">E{cert.employee?.e_number || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div>{formatDate(cert.issued_date)}</div>
                    </TableCell>
                    <TableCell>
                      <div>{formatDate(cert.expiry_date)}</div>
                      <div className="text-xs text-gray-500">
                        {daysUntilExpiry(cert.expiry_date) < 0
                          ? `${Math.abs(daysUntilExpiry(cert.expiry_date))} days ago`
                          : daysUntilExpiry(cert.expiry_date) === 0
                          ? 'Today'
                          : `in ${daysUntilExpiry(cert.expiry_date)} days`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-md ${expiryStatus.class}`}>
                        {expiryStatus.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 px-3">
                        {daysUntilExpiry(cert.expiry_date) < 30 ? 'Renew' : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
