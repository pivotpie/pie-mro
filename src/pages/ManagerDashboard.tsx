
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WorkforceGlobalHeader } from "@/components/workforce/WorkforceGlobalHeader";
import WorkforceMetrics from "@/components/workforce/WorkforceMetrics";
import { toast } from "sonner";
import { SortableTable } from "@/components/ui/sortable-table";
import { supabase } from "@/integrations/supabase/client";
import { Save } from "lucide-react";

interface SummaryData {
  category: string;
  subcategory?: string;
  cc: number;
  engr: number;
  nc: number;
  tech: number;
  support_cc: number;
  support_engr: number;
  support_nc: number;
  support_tech: number;
  isSubcategory?: boolean;
  isTotal?: boolean;
  available_employees?: number[];
  aircraft_assignments?: { [key: string]: number };
  isAvailable?: boolean;
  isAircraft?: boolean;
}

interface AircraftAssignment {
  [aircraftCode: string]: {
    cc: number;
    engr: number;
    nc: number;
    tech: number;
    support_cc: number;
    support_engr: number;
    support_nc: number;
    support_tech: number;
  };
}

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const { currentDate, formatDate } = useDate();
  const navigate = useNavigate();
  const [supportDistribution, setSupportDistribution] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<any>({});
  const [aircraftAssignments, setAircraftAssignments] = useState<AircraftAssignment>({});
  const [aircraftList, setAircraftList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchAllData();
  }, [user, navigate, currentDate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSupportData(),
        fetchWorkforceSummary()
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
      // Fetch employees with their current assignments from employee_supports
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          e_number,
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

      console.log('Total active employees from DB:', employeeData?.length);

      // Process the data to create summary
      const summary: SummaryData[] = [];
      const availableCount = {
        cc: 0,
        engr: 0,
        nc: 0,
        tech: 0,
        support_cc: 0,
        support_engr: 0,
        support_nc: 0,
        support_tech: 0
      };

      const aircraftCodes: string[] = [];
      const mainAssignments: AircraftAssignment = {};

      // Count available employees and categorize assignments
      const aircraftAssignmentCounts: { [key: string]: { cc: number, engr: number, nc: number, tech: number } } = {};

      employeeData?.forEach((emp: any) => {
        const jobTitle = emp.job_titles?.job_description || 'Unknown';
        const supportCode = emp.employee_supports?.[0]?.support_codes?.support_code || 'Unassigned';
        
        console.log(`Employee: ${emp.name}, Job Title: ${jobTitle}, Support Code: ${supportCode}`);
        
        // Determine role category using the job descriptions
        let roleCategory = 'tech'; // default
        if (jobTitle === 'CC') {
          roleCategory = 'cc';
        } else if (jobTitle === 'ENG') {
          roleCategory = 'engr';
        } else if (jobTitle === 'NC') {
          roleCategory = 'nc';
        } else if (jobTitle === 'TECH') {
          roleCategory = 'tech';
        }

        // Count employees by their support assignments
        if (supportCode === 'AV' || supportCode === 'AVAILABLE-SLOT') {
          // Available employees
          availableCount[roleCategory as keyof typeof availableCount]++;
        } else if (supportCode && supportCode !== 'Unassigned') {
          // Aircraft assignments
          if (!aircraftAssignmentCounts[supportCode]) {
            aircraftAssignmentCounts[supportCode] = { cc: 0, engr: 0, nc: 0, tech: 0 };
            aircraftCodes.push(supportCode);
          }
          aircraftAssignmentCounts[supportCode][roleCategory as keyof typeof aircraftAssignmentCounts[typeof supportCode]]++;
        }
      });

      console.log('Available employees count by role:', availableCount);
      console.log('Aircraft assignments:', aircraftAssignmentCounts);

      // Set support available counts equal to main available counts initially
      availableCount.support_cc = availableCount.cc;
      availableCount.support_engr = availableCount.engr;
      availableCount.support_nc = availableCount.nc;
      availableCount.support_tech = availableCount.tech;

      // Convert to the format expected by the rest of the code
      Object.keys(aircraftAssignmentCounts).forEach(aircraftCode => {
        mainAssignments[aircraftCode] = {
          cc: aircraftAssignmentCounts[aircraftCode].cc,
          engr: aircraftAssignmentCounts[aircraftCode].engr,
          nc: aircraftAssignmentCounts[aircraftCode].nc,
          tech: aircraftAssignmentCounts[aircraftCode].tech,
          support_cc: 0,
          support_engr: 0,
          support_nc: 0,
          support_tech: 0
        };
      });

      setAircraftList(aircraftCodes);
      setAircraftAssignments({}); // Initialize as empty for support assignments
      setAvailableEmployees(availableCount);

      // Add header row
      summary.push({
        category: "Monday",
        subcategory: "5-May",
        cc: 0,
        engr: 0,
        nc: 0,
        tech: 0,
        support_cc: 0,
        support_engr: 0,
        support_nc: 0,
        support_tech: 0,
        isTotal: true
      });

      // Add Available row
      summary.push({
        category: 'Available',
        cc: availableCount.cc,
        engr: availableCount.engr,
        nc: availableCount.nc,
        tech: availableCount.tech,
        support_cc: availableCount.support_cc,
        support_engr: availableCount.support_engr,
        support_nc: availableCount.support_nc,
        support_tech: availableCount.support_tech,
        isAvailable: true
      });

      // Add aircraft assignment rows with actual assignments from employee_supports
      aircraftCodes.forEach(aircraftCode => {
        const mainAssignment = mainAssignments[aircraftCode] || {
          cc: 0, engr: 0, nc: 0, tech: 0, support_cc: 0, support_engr: 0, support_nc: 0, support_tech: 0
        };
        
        summary.push({
          category: aircraftCode,
          cc: mainAssignment.cc,
          engr: mainAssignment.engr,
          nc: mainAssignment.nc,
          tech: mainAssignment.tech,
          support_cc: 0,
          support_engr: 0,
          support_nc: 0,
          support_tech: 0,
          isAircraft: true
        });
      });

      // Add totals - calculate totals correctly from the main assignments
      const totalMainAssigned = Object.values(mainAssignments).reduce((acc, assignment) => ({
        cc: acc.cc + assignment.cc,
        engr: acc.engr + assignment.engr,
        nc: acc.nc + assignment.nc,
        tech: acc.tech + assignment.tech,
        support_cc: acc.support_cc + assignment.support_cc,
        support_engr: acc.support_engr + assignment.support_engr,
        support_nc: acc.support_nc + assignment.support_nc,
        support_tech: acc.support_tech + assignment.support_tech
      }), { cc: 0, engr: 0, nc: 0, tech: 0, support_cc: 0, support_engr: 0, support_nc: 0, support_tech: 0 });

      summary.push({
        category: "Grand Total",
        cc: availableCount.cc + totalMainAssigned.cc,
        engr: availableCount.engr + totalMainAssigned.engr,
        nc: availableCount.nc + totalMainAssigned.nc,
        tech: availableCount.tech + totalMainAssigned.tech,
        support_cc: availableCount.support_cc,
        support_engr: availableCount.support_engr,
        support_nc: availableCount.support_nc,
        support_tech: availableCount.support_tech,
        isTotal: true
      });

      setSummaryData(summary);
    } catch (error) {
      console.error("Error fetching workforce summary:", error);
    }
  };

  const handleAssignmentChange = (aircraftCode: string, role: string, value: string) => {
    // Only allow support side roles to be modified
    if (!role.startsWith('support_')) {
      return;
    }
    
    const numValue = parseInt(value) || 0;
    
    // Get current assignment for this aircraft and role
    const currentAssignment = aircraftAssignments[aircraftCode]?.[role as keyof typeof aircraftAssignments[typeof aircraftCode]] || 0;
    
    // Calculate the difference
    const difference = numValue - currentAssignment;
    
    // Check if we have enough available employees from the main pool
    const availableForRole = availableEmployees[role as keyof typeof availableEmployees] || 0;
    
    if (difference > availableForRole) {
      const mainRole = role.replace('support_', '').toUpperCase();
      toast.error(`Not enough available ${mainRole} employees. Available: ${availableForRole}`);
      return;
    }

    // Update assignments
    setAircraftAssignments(prev => ({
      ...prev,
      [aircraftCode]: {
        ...prev[aircraftCode],
        [role]: numValue
      }
    }));

    // Update available count (reduce from support pool)
    setAvailableEmployees(prev => ({
      ...prev,
      [role]: prev[role] - difference
    }));

    // Update summary data
    setSummaryData(prev => prev.map(row => {
      if (row.isAvailable) {
        return {
          ...row,
          [role]: availableEmployees[role as keyof typeof availableEmployees] - difference
        };
      }
      if (row.category === aircraftCode) {
        return {
          ...row,
          [role]: numValue
        };
      }
      if (row.isTotal && row.category === "Grand Total") {
        // Recalculate totals for support side only
        const newTotalSupportAssigned = Object.values({
          ...aircraftAssignments, 
          [aircraftCode]: {
            ...(aircraftAssignments[aircraftCode] || {}),
            [role]: numValue
          }
        }).reduce((acc, assignment) => {
          return {
            cc: acc.cc + (assignment.cc || 0),
            engr: acc.engr + (assignment.engr || 0),
            nc: acc.nc + (assignment.nc || 0),
            tech: acc.tech + (assignment.tech || 0),
            support_cc: acc.support_cc + (assignment.support_cc || 0),
            support_engr: acc.support_engr + (assignment.support_engr || 0),
            support_nc: acc.support_nc + (assignment.support_nc || 0),
            support_tech: acc.support_tech + (assignment.support_tech || 0)
          };
        }, { cc: 0, engr: 0, nc: 0, tech: 0, support_cc: 0, support_engr: 0, support_nc: 0, support_tech: 0 });

        return {
          ...row,
          [role]: newTotalSupportAssigned[role as keyof typeof newTotalSupportAssigned]
        };
      }
      return row;
    }));
  };

  const handleSaveAssignments = () => {
    // This will be defined later - for now just close the modal
    toast.success("Assignment configuration ready to save");
    setSaveModalOpen(false);
  };

  const fetchSupportData = async () => {
    try {
      const currentDateString = formatDate(currentDate);
      
      // Find the date ID for today
      const { data: dateData } = await supabase
        .from('date_references')
        .select('id')
        .eq('actual_date', currentDateString)
        .single();

      if (dateData?.id) {
        // First, get all working employees for today (same logic as Available Employees metric)
        const { data: workingEmployees } = await supabase
          .from('employees')
          .select(`
            id,
            roster_assignments!inner(roster_id)
          `)
          .eq('is_active', true)
          .eq('roster_assignments.date_id', dateData.id)
          .in('roster_assignments.roster_id', [3, 8, 4]); // D, B1, DO

        if (workingEmployees) {
          const workingEmployeeIds = workingEmployees.map(emp => emp.id);

          // Fetch support distribution data filtered by current date AND working employees only
          const { data: supportData, error: supportError } = await supabase
            .from('employee_supports')
            .select(`
              support_id,
              support_codes (
                support_code
              )
            `)
            .eq('assignment_date', currentDateString)
            .in('employee_id', workingEmployeeIds); // Filter by working employees only

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

          setSupportDistribution(transformedSupport);
        } else {
          // No working employees found, set empty data
          setSupportDistribution([]);
        }
      } else {
        // No date reference found, set empty data
        setSupportDistribution([]);
      }

      // Fetch job title distribution (still using all active employees as before)
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

      setRoleDistribution(transformedRoles);
    } catch (error) {
      console.error("Error fetching support data:", error);
      toast.error("Failed to load workforce distribution data");
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daily Workforce Summary</CardTitle>
                  <CardDescription>Interactive workforce allocation with real-time assignment capabilities</CardDescription>
                </div>
                <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Save Assignment Configuration</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col space-y-4 py-4">
                      <p className="text-sm text-muted-foreground">
                        Modal content will be defined later. This is a placeholder for the save functionality.
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setSaveModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveAssignments}>
                          Save Configuration
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                      <th className="text-center p-2 font-bold bg-green-200 dark:bg-green-900/50 border-l-4 border-gray-600">CC</th>
                      <th className="text-center p-2 font-bold bg-green-200 dark:bg-green-900/50">ENGR</th>
                      <th className="text-center p-2 font-bold bg-green-200 dark:bg-green-900/50">NC</th>
                      <th className="text-center p-2 font-bold bg-green-200 dark:bg-green-900/50">TECH</th>
                    </tr>
                    <tr className="border-b bg-gray-100 dark:bg-gray-800">
                      <th className="text-left p-2"></th>
                      <th className="text-center p-2 text-xs" colSpan={4}>Main</th>
                      <th className="text-center p-2 text-xs border-l-4 border-gray-600" colSpan={4}>Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          row.isTotal ? 'bg-yellow-100 dark:bg-yellow-900/30 font-bold' :
                          row.isAvailable ? 'bg-green-100 dark:bg-green-800/30' :
                          row.isAircraft ? 'bg-blue-50 dark:bg-blue-900/20' :
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
                        
                        {/* Main section - Display actual assignments and available counts */}
                        <td className="text-center p-2">
                          {row.cc || ''}
                        </td>
                        <td className="text-center p-2">
                          {row.engr || ''}
                        </td>
                        <td className="text-center p-2">
                          {row.nc || ''}
                        </td>
                        <td className="text-center p-2">
                          {row.tech || ''}
                        </td>
                        
                        {/* Support section - With input fields for aircraft rows only, including CC */}
                        <td className="text-center p-2 border-l-4 border-gray-600">
                          {row.isAircraft ? (
                            <Input
                              type="number"
                              min="0"
                              max={availableEmployees.support_cc + (aircraftAssignments[row.category]?.support_cc || 0)}
                              value={aircraftAssignments[row.category]?.support_cc || 0}
                              onChange={(e) => handleAssignmentChange(row.category, 'support_cc', e.target.value)}
                              className="w-16 h-8 text-center"
                            />
                          ) : (
                            row.support_cc || ''
                          )}
                        </td>
                        <td className="text-center p-2">
                          {row.isAircraft ? (
                            <Input
                              type="number"
                              min="0"
                              max={availableEmployees.support_engr + (aircraftAssignments[row.category]?.support_engr || 0)}
                              value={aircraftAssignments[row.category]?.support_engr || 0}
                              onChange={(e) => handleAssignmentChange(row.category, 'support_engr', e.target.value)}
                              className="w-16 h-8 text-center"
                            />
                          ) : (
                            row.support_engr || ''
                          )}
                        </td>
                        <td className="text-center p-2">
                          {row.isAircraft ? (
                            <Input
                              type="number"
                              min="0"
                              max={availableEmployees.support_nc + (aircraftAssignments[row.category]?.support_nc || 0)}
                              value={aircraftAssignments[row.category]?.support_nc || 0}
                              onChange={(e) => handleAssignmentChange(row.category, 'support_nc', e.target.value)}
                              className="w-16 h-8 text-center"
                            />
                          ) : (
                            row.support_nc || ''
                          )}
                        </td>
                        <td className="text-center p-2">
                          {row.isAircraft ? (
                            <Input
                              type="number"
                              min="0"
                              max={availableEmployees.support_tech + (aircraftAssignments[row.category]?.support_tech || 0)}
                              value={aircraftAssignments[row.category]?.support_tech || 0}
                              onChange={(e) => handleAssignmentChange(row.category, 'support_tech', e.target.value)}
                              className="w-16 h-8 text-center"
                            />
                          ) : (
                            row.support_tech || ''
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
