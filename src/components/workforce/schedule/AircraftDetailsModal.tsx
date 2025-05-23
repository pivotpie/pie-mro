import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, Plus, Check } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AircraftSchedule {
  id: string;
  aircraft: string;
  aircraft_id: number;
  hangar_id: number;
  start: Date;
  end: Date;
  team: string | null;
  status: string;
  registration: string;
  customer: string;
  color: string;
  borderColor: string;
  visit_number: string;
  check_type: string;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  skill: string;
  avatar: string;
  certification?: string;
  availability?: string;
  match_score?: number;
}

interface TradeRequirement {
  trade: string;
  day_count: number;
  night_count: number;
  assigned_day: number;
  assigned_night: number;
  dates: {
    date: string;
    day_count: number;
    night_count: number;
    assigned_day: number;
    assigned_night: number;
  }[];
}

interface AircraftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aircraft: AircraftSchedule | null;
}

export const AircraftDetailsModal = ({ isOpen, onClose, aircraft }: AircraftDetailsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [tradeRequirements, setTradeRequirements] = useState<TradeRequirement[]>([]);

  useEffect(() => {
    if (isOpen && aircraft) {
      fetchEmployeeData();
      fetchPersonnelRequirements();
    }
  }, [isOpen, aircraft]);

  const fetchEmployeeData = async () => {
    if (!aircraft) return;
    setLoading(true);

    try {
      // Fetch employees data from the database
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          job_title_id,
          job_titles:job_title_id (job_description),
          team_id
        `)
        .eq('is_active', true);

      if (employeesError) throw employeesError;

      // Check for assigned team
      const assignedTeam = aircraft.team ? 
        await supabase.from('teams').select('*').eq('team_name', aircraft.team).single() : null;

      // Fetch employee authorizations to determine qualifications
      const { data: authData, error: authError } = await supabase
        .from('employee_authorizations')
        .select('*')
        .eq('is_active', true);

      if (authError) throw authError;

      // Process employees data
      const availableEmps = employeesData.map((emp: any) => {
        // Calculate match score based on authorizations matching aircraft type
        const empAuths = authData?.filter(auth => auth.employee_id === emp.id) || [];
        const matchScore = calculateMatchScore(empAuths, aircraft);
        
        return {
          id: emp.id,
          name: emp.name,
          role: emp.job_titles?.job_description || "Technician",
          skill: determineSkill(empAuths),
          avatar: getInitials(emp.name),
          certification: extractCertifications(empAuths),
          availability: "Available",
          match_score: matchScore
        };
      });

      // Sort by match score
      availableEmps.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
      
      // If team is assigned, determine assigned employees
      let assigned: Employee[] = [];
      if (assignedTeam?.data) {
        assigned = employeesData
          .filter((emp: any) => emp.team_id === assignedTeam.data.id)
          .map((emp: any) => {
            const empAuths = authData?.filter(auth => auth.employee_id === emp.id) || [];
            return {
              id: emp.id,
              name: emp.name,
              role: emp.job_titles?.job_description || "Technician",
              skill: determineSkill(empAuths),
              avatar: getInitials(emp.name),
            };
          });
      }

      setAssignedEmployees(assigned);
      setAvailableEmployees(availableEmps);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonnelRequirements = async () => {
    if (!aircraft) return;
    
    try {
      // Convert aircraft.id to number if it's a string
      const visitId = typeof aircraft.id === 'string' ? parseInt(aircraft.id) : aircraft.id;
      
      // Fetch personnel requirements for this maintenance visit
      const { data: reqData, error: reqError } = await supabase
        .from('personnel_requirements')
        .select(`
          id,
          date,
          day_shift_count,
          night_shift_count,
          remarks,
          trades:trade_id (
            id,
            trade_name,
            trade_code
          )
        `)
        .eq('maintenance_visit_id', visitId);

      if (reqError) throw reqError;

      // Process the requirements data
      const requirements: Record<string, TradeRequirement> = {};
      
      if (reqData && reqData.length > 0) {
        reqData.forEach((req: any) => {
          const tradeName = req.trades?.trade_name || 'Unknown';
          
          if (!requirements[tradeName]) {
            requirements[tradeName] = {
              trade: tradeName,
              day_count: 0,
              night_count: 0,
              assigned_day: 0,
              assigned_night: 0,
              dates: []
            };
          }
          
          requirements[tradeName].day_count += req.day_shift_count;
          requirements[tradeName].night_count += req.night_shift_count;
          requirements[tradeName].dates.push({
            date: format(new Date(req.date), 'dd-MMM'),
            day_count: req.day_shift_count,
            night_count: req.night_shift_count,
            assigned_day: 0, // Would be populated from actual assignments
            assigned_night: 0
          });
        });
      }

      // If no data from database, generate mock data for the demo
      if (Object.keys(requirements).length === 0) {
        generateMockRequirements(requirements);
      }
      
      setTradeRequirements(Object.values(requirements));
    } catch (error) {
      console.error("Error fetching personnel requirements:", error);
      toast.error("Failed to load personnel requirements");
      
      // Generate mock data if fetch fails
      const requirements: Record<string, TradeRequirement> = {};
      generateMockRequirements(requirements);
      setTradeRequirements(Object.values(requirements));
    }
  };

  const generateMockRequirements = (requirements: Record<string, TradeRequirement>) => {
    if (!aircraft) return;
    
    const trades = ['B1 Tech', 'B2 Tech', 'STRUC & COMP', 'PAINT', 'CABIN', 'NDT'];
    const startDate = new Date(aircraft.start);
    const endDate = new Date(aircraft.end);
    const dayDiff = differenceInDays(endDate, startDate);
    
    trades.forEach(trade => {
      const dates = [];
      let totalDay = 0;
      let totalNight = 0;
      
      for (let i = 0; i <= dayDiff; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayCount = trade === 'B1 Tech' ? 18 : 
                         trade === 'B2 Tech' ? 4 : 
                         trade === 'STRUC & COMP' ? 2 : 
                         trade === 'PAINT' ? 3 : 
                         trade === 'CABIN' ? 5 : 0;
                         
        const nightCount = 0; // Mock data shows 0 night shift
        
        totalDay += dayCount;
        totalNight += nightCount;
        
        dates.push({
          date: format(currentDate, 'dd-MMM'),
          day_count: dayCount,
          night_count: nightCount,
          assigned_day: trade === 'B1 Tech' ? Math.floor(dayCount * 0.7) : 
                        trade === 'B2 Tech' ? Math.floor(dayCount * 0.5) :
                        trade === 'STRUC & COMP' ? 1 :
                        trade === 'CABIN' ? 3 : 0,
          assigned_night: 0
        });
      }
      
      requirements[trade] = {
        trade,
        day_count: totalDay,
        night_count: totalNight,
        assigned_day: trade === 'B1 Tech' ? Math.floor(totalDay * 0.7) : 
                       trade === 'B2 Tech' ? Math.floor(totalDay * 0.5) :
                       trade === 'STRUC & COMP' ? dayDiff :
                       trade === 'CABIN' ? 3 * dayDiff : 0,
        assigned_night: 0,
        dates
      };
    });
  };

  const handleAssignEmployee = (employee: Employee) => {
    setAssignedEmployees(prev => [...prev, employee]);
    setAvailableEmployees(prev => prev.filter(emp => emp.id !== employee.id));
    toast.success(`${employee.name} assigned to ${aircraft?.registration}`);
  };

  const handleRemoveAssignedEmployee = (employee: Employee) => {
    setAssignedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
    setAvailableEmployees(prev => [...prev, {...employee, match_score: calculateEmployeeMatchScore(employee)}]);
    toast.info(`${employee.name} removed from ${aircraft?.registration}`);
  };

  const calculateMatchScore = (authorizations: any[], aircraft: AircraftSchedule): number => {
    if (!authorizations || authorizations.length === 0) return 0;
    
    // Basic matching logic - could be enhanced with more specific logic
    const matchingAuths = authorizations.filter(auth => {
      const aircraftName = aircraft.aircraft.toLowerCase();
      const authAircraft = auth.aircraft_model_id?.toString() || '';
      
      return (
        aircraftName.includes('boeing') && authAircraft.includes('boeing') ||
        aircraftName.includes('airbus') && authAircraft.includes('airbus') ||
        true // Default match for demo purposes
      );
    });
    
    return Math.min(100, matchingAuths.length * 25);
  };

  const calculateEmployeeMatchScore = (employee: Employee): number => {
    // Re-calculate match score for an employee being added back to available list
    return employee.match_score || Math.floor(Math.random() * 100);
  };

  const determineSkill = (authorizations: any[]): string => {
    if (!authorizations || authorizations.length === 0) return "General";
    
    const authTypes = authorizations.map(auth => auth.authorization_type_id);
    
    if (authTypes.includes(1)) return "Avionics";
    if (authTypes.includes(2)) return "Airframe";
    if (authTypes.includes(3)) return "Engines";
    return "General";
  };

  const extractCertifications = (authorizations: any[]): string => {
    if (!authorizations || authorizations.length === 0) return "None";
    
    const certifications = new Set<string>();
    authorizations.forEach(auth => {
      if (auth.aircraft_model_id) {
        certifications.add(`A${auth.aircraft_model_id}`);
      }
    });
    
    return Array.from(certifications).join(', ') || "General";
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const filteredEmployees = availableEmployees.filter(employee => 
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (employee.certification && employee.certification.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!aircraft) return null;

  const duration = differenceInDays(aircraft.end, aircraft.start) + 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] w-[80vw] h-[80vh] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Aircraft Details - {aircraft.registration}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* First Row - Aircraft Details & Personnel Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Left Column - Aircraft Details (40%) */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-lg font-semibold">Aircraft Information</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                    <p className="font-medium dark:text-gray-200">{aircraft.aircraft}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Registration</p>
                    <p className="font-medium dark:text-gray-200">{aircraft.registration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="font-medium dark:text-gray-200">{aircraft.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className={`font-medium ${
                      aircraft.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' :
                      aircraft.status === 'In Progress' ? 'text-amber-600 dark:text-amber-400' :
                      'text-slate-600 dark:text-slate-400'
                    }`}>{aircraft.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Schedule</p>
                    <p className="font-medium dark:text-gray-200">
                      {format(aircraft.start, 'dd MMM yyyy')} - {format(aircraft.end, 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="font-medium dark:text-gray-200">{duration} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Visit Number</p>
                    <p className="font-medium dark:text-gray-200">{aircraft.visit_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Check Type</p>
                    <p className="font-medium dark:text-gray-200">{aircraft.check_type}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Personnel Requirements Table (60%) */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-lg font-semibold">Personnel Requirements</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Trade</TableHead>
                      <TableHead className="text-center font-bold">
                        <div>Day</div>
                        <div className="text-xs">Req / Assigned</div>
                      </TableHead>
                      <TableHead className="text-center font-bold">
                        <div>Night</div>
                        <div className="text-xs">Req / Assigned</div>
                      </TableHead>
                      {tradeRequirements.length > 0 && tradeRequirements[0].dates.slice(0, 7).map((date, idx) => (
                        <TableHead key={idx} className="text-center font-bold">
                          <div>{date.date}</div>
                          <div className="text-xs">Day / Night</div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeRequirements.map((req, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{req.trade}</TableCell>
                        <TableCell className="text-center">
                          <span className={req.assigned_day >= req.day_count ? 
                            "text-emerald-600 dark:text-emerald-400 font-medium" : 
                            "text-amber-600 dark:text-amber-400 font-medium"}>
                            {req.assigned_day} / {req.day_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={req.assigned_night >= req.night_count ? 
                            "text-emerald-600 dark:text-emerald-400 font-medium" : 
                            "text-amber-600 dark:text-amber-400 font-medium"}>
                            {req.assigned_night} / {req.night_count}
                          </span>
                        </TableCell>
                        {req.dates.slice(0, 7).map((date, dateIdx) => (
                          <TableCell key={dateIdx} className="text-center text-sm">
                            <div className="flex flex-col">
                              <span className={date.assigned_day >= date.day_count ? 
                                "text-emerald-600 dark:text-emerald-400" : 
                                "text-amber-600 dark:text-amber-400"}>
                                {date.assigned_day}/{date.day_count}
                              </span>
                              <span className="text-gray-400">
                                {date.assigned_night}/{date.night_count}
                              </span>
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {tradeRequirements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-6 text-gray-500">
                          No personnel requirements available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Second Row - Assigned Employees & Available Employees */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Left Column (30%) - Assigned Employees */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-lg font-semibold">Assigned Team</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg min-h-[300px]">
                {assignedEmployees.length > 0 ? (
                  <div className="space-y-3">
                    {assignedEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{employee.avatar}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium dark:text-gray-200">{employee.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{employee.role}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveAssignedEmployee(employee)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add More Staff
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <User className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No team assigned</p>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Team
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (70%) - Available Employees */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-semibold">Available Employees</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Search by name, skill, certification..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Employee List */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                    </div>
                  ) : filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <div 
                        key={employee.id} 
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          employee.match_score && employee.match_score > 70 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                            : employee.match_score && employee.match_score > 30
                            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                            : 'bg-white dark:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">{employee.avatar}</span>
                          </div>
                          <div>
                            <p className="font-medium dark:text-gray-200">{employee.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {employee.skill} • {employee.role} • {employee.certification || "No certs"}
                            </p>
                            {employee.match_score && (
                              <p className="text-xs">
                                <span className={`font-medium ${
                                  employee.match_score > 70 ? 'text-emerald-600 dark:text-emerald-400' : 
                                  employee.match_score > 30 ? 'text-amber-600 dark:text-amber-400' :
                                  'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {employee.match_score}% match
                                </span> • {employee.availability}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAssignEmployee(employee)}
                        >
                          Assign
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      No employees match your search
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
