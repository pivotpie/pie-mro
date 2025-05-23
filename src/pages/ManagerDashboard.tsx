import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkforceGlobalHeader } from "@/components/workforce/WorkforceGlobalHeader";
import WorkforceMetrics from "@/components/workforce/WorkforceMetrics";
import { toast } from "sonner";
import { SortableTable } from "@/components/ui/sortable-table";
import { supabase } from "@/integrations/supabase/client";

interface SummaryData {
  category: string;
  subcategory?: string;
  cc: number;
  engr: number;
  nc: number;
  tech: number;
  support_engr: number;
  support_nc: number;
  support_tech: number;
  isSubcategory?: boolean;
  isTotal?: boolean;
}

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [supportDistribution, setSupportDistribution] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchSupportData();
    fetchSummaryData();
  }, [user, navigate]);

  const fetchSummaryData = async () => {
    try {
      // Generate summary data matching the Excel format
      const summaryRows: SummaryData[] = [
        // Header row with date
        { category: "Monday", subcategory: "5-May", cc: 0, engr: 0, nc: 0, tech: 0, support_engr: 0, support_nc: 0, support_tech: 0, isTotal: true },
        
        // Available
        { category: "Available", cc: 0, engr: 8, nc: 2, tech: 6, support_engr: 7, support_nc: 2, support_tech: 0 },
        
        // Night Shift
        { category: "Night Shift", cc: 0, engr: 2, nc: 0, tech: 9, support_engr: 0, support_nc: 0, support_tech: 0 },
        
        // VH-OQC
        { category: "VH-OQC", cc: 1, engr: 4, nc: 0, tech: 10, support_engr: 0, support_nc: 0, support_tech: 0 },
        
        // Aircraft input section
        { category: "A6-APH Lx input", cc: 0, engr: 0, nc: 0, tech: 0, support_engr: 1, support_nc: 0, support_tech: 0, subcategory: "Fatima" },
        
        // Individual aircraft
        { category: "A6-AEC", cc: 1, engr: 3, nc: 0, tech: 13, support_engr: 0, support_nc: 0, support_tech: 0 },
        { category: "A6-AER", cc: 0, engr: 0, nc: 0, tech: 3, support_engr: 0, support_nc: 0, support_tech: 0 },
        { category: "A6-BNA", cc: 1, engr: 5, nc: 0, tech: 18, support_engr: 0, support_nc: 0, support_tech: 0 },
        { category: "A6-EIH", cc: 1, engr: 2, nc: 1, tech: 6, support_engr: 0, support_nc: 0, support_tech: 0 },
        { category: "A6-ETA", cc: 1, engr: 7, nc: 0, tech: 15, support_engr: 0, support_nc: 0, support_tech: 0 },
        { category: "A6-XWC", cc: 1, engr: 5, nc: 0, tech: 17, support_engr: 0, support_nc: 0, support_tech: 0 },
        { category: "F-GSQI", cc: 1, engr: 5, nc: 0, tech: 14, support_engr: 0, support_nc: 0, support_tech: 2 },
        { category: "F-GZNO", cc: 1, engr: 7, nc: 0, tech: 19, support_engr: 0, support_nc: 0, support_tech: 2 },
        { category: "F-HRBH", cc: 1, engr: 4, nc: 2, tech: 14, support_engr: 0, support_nc: 0, support_tech: 0 },
        { category: "G-ZBKM", cc: 1, engr: 4, nc: 3, tech: 16, support_engr: 0, support_nc: 0, support_tech: 2 },
        { category: "SP-LSC", cc: 1, engr: 2, nc: 0, tech: 2, support_engr: 0, support_nc: 0, support_tech: 0 },
        { category: "VH-IWY", cc: 1, engr: 4, nc: 2, tech: 20, support_engr: 0, support_nc: 0, support_tech: 0 },
        { category: "VH-OQC", cc: 1, engr: 4, nc: 0, tech: 10, support_engr: 0, support_nc: 0, support_tech: 0 },
        { category: "VH-OQL", cc: 1, engr: 11, nc: 0, tech: 38, support_engr: 0, support_nc: 0, support_tech: 0 },
        
        // Leave section
        { category: "Leave", cc: 0, engr: 7, nc: 2, tech: 27, support_engr: 0, support_nc: 0, support_tech: 0 },
        
        // C-Cert section
        { category: "C-Cert", cc: 4, engr: 0, nc: 0, tech: 0, support_engr: 0, support_nc: 0, support_tech: 0 },
        
        // OFF section
        { category: "OFF", cc: 0, engr: 17, nc: 2, tech: 65, support_engr: 0, support_nc: 0, support_tech: 0 },
        
        // Training section
        { category: "Training", cc: 0, engr: 8, nc: 0, tech: 3, support_engr: 0, support_nc: 0, support_tech: 0 },
        
        // Grand Total
        { category: "Grand Total", cc: 17, engr: 107, nc: 15, tech: 325, support_engr: 0, support_nc: 0, support_tech: 0, isTotal: true },
      ];

      setSummaryData(summaryRows);
    } catch (error) {
      console.error("Error generating summary data:", error);
    }
  };

  const fetchSupportData = async () => {
    setLoading(true);
    try {
      // Fetch support distribution data - Fixed query without .group()
      const { data: supportData, error: supportError } = await supabase
        .from('employee_supports')
        .select(`
          support_id,
          support_codes (
            support_code
          )
        `);

      if (supportError) throw supportError;

      // Manually group and count support codes
      const supportCounts = supportData.reduce((acc: any, item: any) => {
        const supportCode = item.support_codes?.support_code;
        if (supportCode) {
          acc[supportCode] = (acc[supportCode] || 0) + 1;
        }
        return acc;
      }, {});

      // Transform to array and sort
      const transformedSupport = Object.entries(supportCounts)
        .map(([support_code, count]) => ({
          id: support_code,
          support_code,
          count
        }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 20);

      // Fetch job title distribution - Fixed query without .group()
      const { data: roleData, error: roleError } = await supabase
        .from('employees')
        .select(`
          job_title_id,
          job_titles (
            job_description
          )
        `)
        .eq('is_active', true);

      if (roleError) throw roleError;

      // Manually group and count job titles
      const roleCounts = roleData.reduce((acc: any, item: any) => {
        const jobDescription = item.job_titles?.job_description;
        if (jobDescription) {
          acc[jobDescription] = (acc[jobDescription] || 0) + 1;
        }
        return acc;
      }, {});

      // Transform to array and sort
      const transformedRoles = Object.entries(roleCounts)
        .map(([job_description, count]) => ({
          id: job_description,
          job_description,
          count
        }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 20);

      setSupportDistribution(transformedSupport);
      setRoleDistribution(transformedRoles);
    } catch (error) {
      console.error("Error fetching support data:", error);
      toast.error("Failed to load workforce distribution data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
    toast.success("Logged out successfully");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-gray-900">
      {/* Global Header */}
      <WorkforceGlobalHeader 
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content - Full Width */}
      <div className="flex-1 w-full overflow-auto p-4 md:p-6">
        <div className="w-full max-w-none">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Overview of workforce and operational metrics for May 2025
            </p>
          </div>

          {/* Metrics Dashboard - Number Cards */}
          <WorkforceMetrics />

          {/* Summary Table - Full Width */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Daily Workforce Summary</CardTitle>
              <CardDescription>Current workforce allocation breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-orange-100 dark:bg-orange-900/30">
                      <th className="text-left p-2 font-bold">Category</th>
                      <th className="text-center p-2 font-bold bg-blue-200 dark:bg-blue-900/50">CC</th>
                      <th className="text-center p-2 font-bold bg-blue-200 dark:bg-blue-900/50">ENGR</th>
                      <th className="text-center p-2 font-bold bg-blue-200 dark:bg-blue-900/50">NC</th>
                      <th className="text-center p-2 font-bold bg-blue-200 dark:bg-blue-900/50">TECH</th>
                      <th className="text-center p-2 font-bold bg-blue-200 dark:bg-blue-900/50">ENGR</th>
                      <th className="text-center p-2 font-bold bg-blue-200 dark:bg-blue-900/50">NC</th>
                      <th className="text-center p-2 font-bold bg-blue-200 dark:bg-blue-900/50">TECH</th>
                    </tr>
                    <tr className="border-b bg-gray-100 dark:bg-gray-800">
                      <th className="text-left p-2"></th>
                      <th className="text-center p-2 text-xs" colSpan={4}>Main</th>
                      <th className="text-center p-2 text-xs" colSpan={3}>Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          row.isTotal ? 'bg-yellow-100 dark:bg-yellow-900/30 font-bold' :
                          row.category === 'Available' ? 'bg-gray-100 dark:bg-gray-800' :
                          row.category === 'Night Shift' ? 'bg-gray-100 dark:bg-gray-800' :
                          row.category === 'Leave' ? 'bg-red-100 dark:bg-red-900/30' :
                          row.category.includes('A6-APH') ? 'bg-red-100 dark:bg-red-900/30' :
                          ''
                        }`}
                      >
                        <td className="p-2">
                          {row.category}
                          {row.subcategory && (
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              {row.subcategory}
                            </span>
                          )}
                        </td>
                        <td className="text-center p-2">{row.cc || ''}</td>
                        <td className="text-center p-2">{row.engr || ''}</td>
                        <td className="text-center p-2">{row.nc || ''}</td>
                        <td className="text-center p-2">{row.tech || ''}</td>
                        <td className="text-center p-2">{row.support_engr || ''}</td>
                        <td className="text-center p-2">{row.support_nc || ''}</td>
                        <td className="text-center p-2">{row.support_tech || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Support Distribution Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Distribution</CardTitle>
                <CardDescription>Current employee allocations</CardDescription>
              </CardHeader>
              <CardContent>
                <SupportDistributionTable data={supportDistribution} loading={loading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>Employees by job title</CardDescription>
              </CardHeader>
              <CardContent>
                <RoleDistributionTable data={roleDistribution} loading={loading} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Maintenance Visits</CardTitle>
                <CardDescription>Active maintenance visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  <div className="py-3">
                    <p className="font-medium">A7-BAC (777-300ER)</p>
                    <p className="text-sm text-gray-500">C-Check, Hangar 2, Due: May 25</p>
                  </div>
                  <div className="py-3">
                    <p className="font-medium">A7-BEF (787-9)</p>
                    <p className="text-sm text-gray-500">A-Check, Hangar 1, Due: May 22</p>
                  </div>
                  <div className="py-3">
                    <p className="font-medium">A7-BCG (777-200LR)</p>
                    <p className="text-sm text-gray-500">D-Check, Hangar 3, Due: June 10</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Alerts</CardTitle>
                <CardDescription>Important notices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  <div className="py-3">
                    <p className="font-medium text-amber-600">Training Deadline</p>
                    <p className="text-sm">5 team members need recurrent training by June 1</p>
                  </div>
                  <div className="py-3">
                    <p className="font-medium text-red-600">Certification Alert</p>
                    <p className="text-sm">1 expired certification needs immediate action</p>
                  </div>
                  <div className="py-3">
                    <p className="font-medium text-blue-600">Roster Update</p>
                    <p className="text-sm">June schedule published, review by May 25</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 text-right">
            <Button 
              variant="default" 
              onClick={() => navigate('/admin-workforce')}
              className="bg-slate-800 hover:bg-slate-700"
            >
              Go to Workforce Management
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Support Distribution Table Component
const SupportDistributionTable = ({ data, loading }: { data: any[], loading: boolean }) => {
  const columns = [
    {
      id: "support_code",
      header: "Support Code",
      cell: (row: any) => <span>{row.support_code}</span>,
      sortable: true
    },
    {
      id: "count",
      header: "Count",
      cell: (row: any) => (
        <div className="flex items-center">
          <span className="font-medium text-right w-8">{row.count}</span>
          <div className="ml-2 bg-blue-100 dark:bg-blue-900/30 h-2 rounded-full" style={{ width: `${Math.min(row.count * 2, 100)}%` }} />
        </div>
      ),
      sortable: true
    }
  ];

  return (
    <SortableTable
      data={data}
      columns={columns}
      isLoading={loading}
      defaultSortColumn="count"
      emptyMessage="No support data available"
    />
  );
};

// Role Distribution Table Component
const RoleDistributionTable = ({ data, loading }: { data: any[], loading: boolean }) => {
  const columns = [
    {
      id: "job_description",
      header: "Job Title",
      cell: (row: any) => <span>{row.job_description}</span>,
      sortable: true
    },
    {
      id: "count",
      header: "Count",
      cell: (row: any) => (
        <div className="flex items-center">
          <span className="font-medium text-right w-8">{row.count}</span>
          <div className="ml-2 bg-green-100 dark:bg-green-900/30 h-2 rounded-full" style={{ width: `${Math.min(row.count * 2, 100)}%` }} />
        </div>
      ),
      sortable: true
    }
  ];

  return (
    <SortableTable
      data={data}
      columns={columns}
      isLoading={loading}
      defaultSortColumn="count"
      emptyMessage="No role data available"
    />
  );
};

export default ManagerDashboard;
