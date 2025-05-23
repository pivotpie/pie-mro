
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkforceGlobalHeader } from "@/components/workforce/WorkforceGlobalHeader";
import WorkforceMetrics from "@/components/workforce/WorkforceMetrics";
import { toast } from "sonner";
import { SortableTable } from "@/components/ui/sortable-table";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";

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
  available_employees?: number[];
  aircraft_assignments?: { [key: string]: number };
}

interface AvailableEmployee {
  id: number;
  name: string;
  job_title: string;
  support_code: string;
}

interface MaintenanceVisit {
  id: number;
  visit_number: string;
  aircraft: {
    registration: string;
  };
}

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [supportDistribution, setSupportDistribution] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<AvailableEmployee[]>([]);
  const [maintenanceVisits, setMaintenanceVisits] = useState<MaintenanceVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSupportData(),
        fetchWorkforceSummary(),
        fetchMaintenanceVisits()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkforceSummary = async () => {
    try {
      // Fetch employees with their current assignments
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          job_titles:job_title_id (
            job_description
          ),
          employee_supports (
            support_codes:support_id (
              support_code
            )
          )
        `)
        .eq('is_active', true);

      if (employeeError) throw employeeError;

      // Process the data to create summary
      const summary: SummaryData[] = [];
      
      // Add header row
      summary.push({
        category: "Monday",
        subcategory: "5-May",
        cc: 0,
        engr: 0,
        nc: 0,
        tech: 0,
        support_engr: 0,
        support_nc: 0,
        support_tech: 0,
        isTotal: true
      });

      // Calculate workforce distribution
      const workforceBySupport: { [key: string]: any } = {};
      const availableEmpList: AvailableEmployee[] = [];

      employeeData?.forEach((emp: any) => {
        const jobTitle = emp.job_titles?.job_description || 'Unknown';
        const supportCode = emp.employee_supports?.[0]?.support_codes?.support_code || 'Unassigned';
        
        // Determine role category
        let roleCategory = 'tech'; // default
        if (jobTitle.toLowerCase().includes('commander') || jobTitle.toLowerCase().includes('cc')) {
          roleCategory = 'cc';
        } else if (jobTitle.toLowerCase().includes('engineer')) {
          roleCategory = 'engr';
        } else if (jobTitle.toLowerCase().includes('navigator') || jobTitle.toLowerCase().includes('nc')) {
          roleCategory = 'nc';
        }

        // Group by support code
        if (!workforceBySupport[supportCode]) {
          workforceBySupport[supportCode] = {
            category: supportCode,
            cc: 0,
            engr: 0,
            nc: 0,
            tech: 0,
            support_engr: 0,
            support_nc: 0,
            support_tech: 0,
            available_employees: []
          };
        }

        // Increment main counts
        workforceBySupport[supportCode][roleCategory]++;
        
        // If available, add to available employees list
        if (supportCode === 'AV' || supportCode === 'AVAILABLE-SLOT') {
          availableEmpList.push({
            id: emp.id,
            name: emp.name,
            job_title: jobTitle,
            support_code: supportCode
          });
          workforceBySupport[supportCode].available_employees.push(emp.id);
        }
      });

      // Add Available row first
      if (workforceBySupport['AV'] || workforceBySupport['AVAILABLE-SLOT']) {
        const availableData = workforceBySupport['AV'] || workforceBySupport['AVAILABLE-SLOT'];
        summary.push({
          ...availableData,
          category: 'Available'
        });
      }

      // Add other aircraft assignments
      Object.entries(workforceBySupport).forEach(([supportCode, data]: [string, any]) => {
        if (supportCode !== 'AV' && supportCode !== 'AVAILABLE-SLOT' && supportCode !== 'Unassigned') {
          summary.push({
            ...data,
            category: supportCode
          });
        }
      });

      // Add totals
      const totals = Object.values(workforceBySupport).reduce((acc: any, curr: any) => ({
        cc: acc.cc + curr.cc,
        engr: acc.engr + curr.engr,
        nc: acc.nc + curr.nc,
        tech: acc.tech + curr.tech,
        support_engr: acc.support_engr + curr.support_engr,
        support_nc: acc.support_nc + curr.support_nc,
        support_tech: acc.support_tech + curr.support_tech
      }), { cc: 0, engr: 0, nc: 0, tech: 0, support_engr: 0, support_nc: 0, support_tech: 0 });

      summary.push({
        category: "Grand Total",
        ...totals,
        isTotal: true
      });

      setSummaryData(summary);
      setAvailableEmployees(availableEmpList);
    } catch (error) {
      console.error("Error fetching workforce summary:", error);
    }
  };

  const fetchMaintenanceVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_visits')
        .select(`
          id,
          visit_number,
          aircraft:aircraft_id (
            registration
          )
        `)
        .eq('status', 'Scheduled')
        .limit(10);

      if (error) throw error;

      setMaintenanceVisits(data?.map((visit: any) => ({
        id: visit.id,
        visit_number: visit.visit_number,
        aircraft: {
          registration: visit.aircraft?.registration || 'Unknown'
        }
      })) || []);
    } catch (error) {
      console.error("Error fetching maintenance visits:", error);
    }
  };

  const fetchSupportData = async () => {
    try {
      // Fetch support distribution data
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

      // Fetch job title distribution
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
    }
  };

  const handleAssignEmployee = async (employeeId: number, aircraftRegistration: string) => {
    try {
      // Find the support code for the aircraft
      let supportCode = aircraftRegistration;
      
      // Update employee support assignment
      const { error } = await supabase
        .from('employee_supports')
        .update({
          support_id: (await supabase
            .from('support_codes')
            .select('id')
            .eq('support_code', supportCode)
            .single()).data?.id
        })
        .eq('employee_id', employeeId);

      if (error) throw error;

      toast.success("Employee assigned successfully");
      
      // Refresh data
      fetchWorkforceSummary();
    } catch (error) {
      console.error("Error assigning employee:", error);
      toast.error("Failed to assign employee");
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
              <CardDescription>Current workforce allocation breakdown with assignment capabilities</CardDescription>
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
                      <th className="text-center p-2 font-bold bg-green-200 dark:bg-green-900/50 border-l-2 border-gray-400">ENGR</th>
                      <th className="text-center p-2 font-bold bg-green-200 dark:bg-green-900/50">NC</th>
                      <th className="text-center p-2 font-bold bg-green-200 dark:bg-green-900/50">TECH</th>
                      <th className="text-center p-2 font-bold">Actions</th>
                    </tr>
                    <tr className="border-b bg-gray-100 dark:bg-gray-800">
                      <th className="text-left p-2"></th>
                      <th className="text-center p-2 text-xs" colSpan={4}>Main</th>
                      <th className="text-center p-2 text-xs border-l-2 border-gray-400" colSpan={3}>Support</th>
                      <th className="text-center p-2 text-xs"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          row.isTotal ? 'bg-yellow-100 dark:bg-yellow-900/30 font-bold' :
                          row.category === 'Available' ? 'bg-green-100 dark:bg-green-800/30' :
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
                        <td className="text-center p-2 border-l-2 border-gray-400">{row.support_engr || ''}</td>
                        <td className="text-center p-2">{row.support_nc || ''}</td>
                        <td className="text-center p-2">{row.support_tech || ''}</td>
                        <td className="text-center p-2">
                          {row.category === 'Available' && row.available_employees && row.available_employees.length > 0 && (
                            <Select onValueChange={(value) => {
                              const [employeeId, aircraftReg] = value.split('|');
                              handleAssignEmployee(parseInt(employeeId), aircraftReg);
                            }}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Assign" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableEmployees.map((emp) => (
                                  <div key={emp.id}>
                                    <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b">
                                      {emp.name} ({emp.job_title})
                                    </div>
                                    {maintenanceVisits.map((visit) => (
                                      <SelectItem 
                                        key={`${emp.id}-${visit.id}`}
                                        value={`${emp.id}|${visit.aircraft.registration}`}
                                      >
                                        {visit.aircraft.registration}
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
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
                  {maintenanceVisits.slice(0, 3).map((visit, index) => (
                    <div key={visit.id} className="py-3">
                      <p className="font-medium">{visit.aircraft.registration}</p>
                      <p className="text-sm text-gray-500">Visit: {visit.visit_number}</p>
                    </div>
                  ))}
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
