
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

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [supportDistribution, setSupportDistribution] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchSupportData();
  }, [user, navigate]);

  const fetchSupportData = async () => {
    setLoading(true);
    try {
      // Fetch support distribution data
      const { data: supportData, error: supportError } = await supabase
        .from('employee_supports')
        .select(`
          support_codes (
            support_code
          ),
          count
        `)
        .select('support_codes(support_code), count(*)')
        .group('support_codes(support_code)')
        .order('count', { ascending: false })
        .limit(20);

      if (supportError) throw supportError;

      // Transform support data
      const transformedSupport = supportData.map(item => ({
        id: item.support_codes.support_code,
        support_code: item.support_codes.support_code,
        count: item.count
      }));

      // Fetch job title distribution
      const { data: roleData, error: roleError } = await supabase
        .from('employees')
        .select(`
          job_titles (
            job_description
          ),
          count
        `)
        .select('job_titles(job_description), count(*)')
        .group('job_titles(job_description)')
        .order('count', { ascending: false })
        .limit(20);

      if (roleError) throw roleError;

      // Transform role data
      const transformedRoles = roleData.map(item => ({
        id: item.job_titles.job_description,
        job_description: item.job_titles.job_description,
        count: item.count
      }));

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

      {/* Main Content */}
      <div className="flex-1 w-full overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Overview of workforce and operational metrics for May 2025
            </p>
          </div>

          {/* Metrics Dashboard - Number Cards */}
          <WorkforceMetrics />

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
