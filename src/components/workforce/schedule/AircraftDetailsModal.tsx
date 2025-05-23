
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
  support?: string;
  core?: string;
  trade?: string;
}

interface TradeRequirement {
  trade: string;
  day_count?: number;  // Added these properties to match usage in the code
  night_count?: number;
  assigned_day?: number;
  assigned_night?: number;
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
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Fetch employees with their current roster assignments
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          job_title_id,
          job_titles:job_title_id (job_description),
          team_id,
          roster_assignments!inner (
            roster_id,
            roster_codes (roster_code, description),
            date_references!inner (actual_date)
          )
        `)
        .eq('is_active', true)
        .eq('roster_assignments.date_references.actual_date', currentDate);

      if (employeesError) throw employeesError;

      // Also fetch employees without roster assignments for today
      const { data: unassignedEmployees, error: unassignedError } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          job_title_id,
          job_titles:job_title_id (job_description),
          team_id
        `)
        .eq('is_active', true)
        .not('id', 'in', `(${employeesData?.map(e => e.id).join(',') || '0'})`);

      if (unassignedError) throw unassignedError;

      // Combine both datasets
      const allEmployees = [
        ...(employeesData || []).map((emp: any) => ({
          ...emp,
          current_roster: emp.roster_assignments?.[0]?.roster_codes?.roster_code || null,
          availability: emp.roster_assignments?.[0]?.roster_codes?.roster_code === 'O' ? 'Available (Off Day)' :
                       emp.roster_assignments?.[0]?.roster_codes?.roster_code === 'AL' ? 'On Annual Leave' :
                       emp.roster_assignments?.[0]?.roster_codes?.roster_code === 'SK' ? 'Sick Leave' :
                       emp.roster_assignments?.[0]?.roster_codes?.roster_code === 'TR' ? 'In Training' :
                       'Assigned to Work'
        })),
        ...(unassignedEmployees || []).map((emp: any) => ({
          ...emp,
          current_roster: null,
          availability: 'Available'
        }))
      ];

      // Fetch employee authorizations
      const { data: authData, error: authError } = await supabase
        .from('employee_authorizations')
        .select(`
          employee_id,
          authorization_basis,
          aircraft_model_id,
          engine_model_id,
          authorization_category,
          is_active,
          expiry_date,
          aircraft_models (
            model_name,
            aircraft_type_id,
            aircraft_types (type_name, type_code)
          ),
          engine_models (
            model_code,
            manufacturer
          )
        `)
        .eq('is_active', true);

      if (authError) throw authError;

      // Fetch certifications for additional matching
      const { data: certData, error: certError } = await supabase
        .from('certifications')
        .select(`
          employee_id,
          certification_code_id,
          aircraft_id,
          expiry_date,
          certification_codes (certification_code, certification_description),
          aircraft (registration, aircraft_type_id, aircraft_types (type_name, type_code))
        `)
        .gte('expiry_date', currentDate);

      if (certError) throw certError;

      // Fetch employee supports
      const { data: supportData, error: supportError } = await supabase
        .from('employee_supports')
        .select(`
          employee_id,
          support_codes:support_id (support_code)
        `);

      if (supportError) throw supportError;

      // Fetch employee cores
      const { data: coreData, error: coreError } = await supabase
        .from('employee_cores')
        .select(`
          employee_id,
          core_codes:core_id (core_code)
        `);

      if (coreError) throw coreError;

      // Fetch trades for employees (we'll infer from authorizations and job titles)
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*');

      if (tradesError) throw tradesError;

      // Check for assigned team
      const assignedTeam = aircraft.team ? 
        await supabase.from('teams').select('*').eq('team_name', aircraft.team).single() : null;

      // Process employees data with enhanced matching
      const availableEmps = allEmployees.map((emp: any) => {
        const empAuths = authData?.filter(auth => auth.employee_id === emp.id) || [];
        const empCerts = certData?.filter(cert => cert.employee_id === emp.id) || [];
        const empSupports = supportData?.filter(support => support.employee_id === emp.id) || [];
        const empCores = coreData?.filter(core => core.employee_id === emp.id) || [];
        
        const matchScore = calculateEnhancedMatchScore(empAuths, empCerts, aircraft, emp);
        
        return {
          id: emp.id,
          name: emp.name,
          role: emp.job_titles?.job_description || "Technician",
          skill: determineSkill(empAuths),
          avatar: getInitials(emp.name),
          certification: extractCertifications(empAuths, empCerts),
          availability: emp.availability,
          match_score: matchScore,
          current_roster: emp.current_roster,
          support: empSupports.map(s => s.support_codes?.support_code).filter(Boolean).join(', ') || 'None',
          core: empCores.map(c => c.core_codes?.core_code).filter(Boolean).join(', ') || 'None',
          trade: determineTrade(empAuths, emp.job_titles?.job_description, tradesData)
        };
      });

      // Sort by availability first (available employees first), then by match score
      availableEmps.sort((a, b) => {
        // Prioritize available employees
        const aAvailable = a.availability?.includes('Available') ? 1 : 0;
        const bAvailable = b.availability?.includes('Available') ? 1 : 0;
        
        if (aAvailable !== bAvailable) {
          return bAvailable - aAvailable;
        }
        
        // Then sort by match score
        return (b.match_score || 0) - (a.match_score || 0);
      });
      
      // Determine assigned employees
      let assigned: Employee[] = [];
      if (assignedTeam?.data) {
        assigned = allEmployees
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

  const calculateEnhancedMatchScore = (
    authorizations: any[], 
    certifications: any[], 
    aircraft: AircraftSchedule, 
    employee: any
  ): number => {
    let score = 0;
    const maxScore = 100;

    // 1. Aircraft Type Authorization Match (40 points)
    const aircraftName = aircraft.aircraft.toLowerCase();
    const matchingAuths = authorizations.filter(auth => {
      const modelName = auth.aircraft_models?.model_name?.toLowerCase() || '';
      const typeName = auth.aircraft_models?.aircraft_types?.type_name?.toLowerCase() || '';
      const typeCode = auth.aircraft_models?.aircraft_types?.type_code?.toLowerCase() || '';
      
      return modelName.includes(aircraftName) || 
             typeName.includes(aircraftName) ||
             typeCode.includes(aircraftName) ||
             (aircraftName.includes('boeing') && (typeName.includes('boeing') || typeCode.includes('b'))) ||
             (aircraftName.includes('airbus') && (typeName.includes('airbus') || typeCode.includes('a')));
    });
    
    if (matchingAuths.length > 0) {
      score += 40;
    }

    // 2. Certification Match (30 points)
    const matchingCerts = certifications.filter(cert => {
      const certAircraftType = cert.aircraft?.aircraft_types?.type_name?.toLowerCase() || '';
      const certTypeCode = cert.aircraft?.aircraft_types?.type_code?.toLowerCase() || '';
      
      return certAircraftType.includes(aircraftName) ||
             certTypeCode.includes(aircraftName) ||
             cert.aircraft?.registration === aircraft.registration;
    });
    
    if (matchingCerts.length > 0) {
      score += 30;
    }

    // 3. Authorization Category/Basis Match (20 points)
    const relevantCategories = ['B1', 'B2', 'C'];
    const hasRelevantAuth = authorizations.some(auth => 
      relevantCategories.includes(auth.authorization_basis) ||
      relevantCategories.includes(auth.authorization_category)
    );
    
    if (hasRelevantAuth) {
      score += 20;
    }

    // 4. Job Title Relevance (10 points)
    const jobTitle = employee.job_titles?.job_description?.toLowerCase() || '';
    const relevantTitles = ['technician', 'engineer', 'mechanic', 'inspector'];
    
    if (relevantTitles.some(title => jobTitle.includes(title))) {
      score += 10;
    }

    return Math.min(score, maxScore);
  };

  const fetchPersonnelRequirements = async () => {
    if (!aircraft) return;
    
    try {
      // Convert aircraft.id to number if it's a string
      let visitId;
      try {
        visitId = typeof aircraft.id === 'string' ? parseInt(aircraft.id) : aircraft.id;
        if (isNaN(visitId)) {
          throw new Error("Invalid aircraft ID");
        }
      } catch (err) {
        console.error("Error converting aircraft ID:", err);
        // Generate mock data since we have an invalid ID
        const requirements: Record<string, TradeRequirement> = {};
        generateMockRequirements(requirements);
        setTradeRequirements(Object.values(requirements));
        return;
      }
      
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
          
          if (requirements[tradeName].day_count !== undefined) {
            requirements[tradeName].day_count += req.day_shift_count;
          }
          
          if (requirements[tradeName].night_count !== undefined) {
            requirements[tradeName].night_count += req.night_shift_count;
          }
          
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
    // This is now handled by calculateEnhancedMatchScore
    return calculateEnhancedMatchScore(authorizations, [], aircraft, {});
  };

  const calculateEmployeeMatchScore = (employee: Employee): number => {
    return employee.match_score || Math.floor(Math.random() * 100);
  };

  const determineSkill = (authorizations: any[]): string => {
    if (!authorizations || authorizations.length === 0) return "General";
    
    const authBases = authorizations.map(auth => auth.authorization_basis);
    const authCategories = authorizations.map(auth => auth.authorization_category);
    
    if (authBases.includes('B1') || authCategories.includes('B1')) return "Airframe";
    if (authBases.includes('B2') || authCategories.includes('B2')) return "Avionics";
    if (authBases.includes('C') || authCategories.includes('C')) return "Base Maintenance";
    return "General";
  };

  const extractCertifications = (authorizations: any[], certifications: any[]): string => {
    const authCerts = new Set<string>();
    
    // Add authorization-based certifications
    authorizations.forEach(auth => {
      if (auth.authorization_basis) {
        authCerts.add(auth.authorization_basis);
      }
      if (auth.authorization_category) {
        authCerts.add(auth.authorization_category);
      }
    });
    
    // Add certification codes
    certifications.forEach(cert => {
      if (cert.certification_codes?.certification_code) {
        authCerts.add(cert.certification_codes.certification_code);
      }
    });
    
    return Array.from(authCerts).join(', ') || "None";
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const determineTrade = (authorizations: any[], jobTitle: string, trades: any[]): string => {
    // First try to match from authorizations
    const authBases = authorizations.map(auth => auth.authorization_basis);
    const authCategories = authorizations.map(auth => auth.authorization_category);
    
    if (authBases.includes('B1') || authCategories.includes('B1')) return "B1 Tech";
    if (authBases.includes('B2') || authCategories.includes('B2')) return "B2 Tech";
    if (authBases.includes('C') || authCategories.includes('C')) return "Base Maintenance";
    
    // Then try to match from job title
    if (jobTitle) {
      const lowerTitle = jobTitle.toLowerCase();
      if (lowerTitle.includes('structural') || lowerTitle.includes('composite')) return "STRUC & COMP";
      if (lowerTitle.includes('paint')) return "PAINT";
      if (lowerTitle.includes('cabin')) return "CABIN";
      if (lowerTitle.includes('ndt')) return "NDT";
    }
    
    return "General";
  };

  const filteredEmployees = availableEmployees.filter(employee => 
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (employee.certification && employee.certification.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (employee.support && employee.support.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (employee.core && employee.core.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (employee.trade && employee.trade.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!aircraft) return null;

  const duration = differenceInDays(aircraft.end, aircraft.start) + 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[80vh] max-h-[80vh] flex flex-col">
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
                        <TableCell colSpan={8} className="text-center py-6 text-gray-500">
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

            {/* Right Column (70%) - Available Employees Table */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-semibold">Available Employees</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Search by name, skill, certification, support, core, trade..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Employee Table */}
                <div className="overflow-auto max-h-[300px]">
                  {loading ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                    </div>
                  ) : filteredEmployees.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-center">Match %</TableHead>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Support</TableHead>
                          <TableHead>Core</TableHead>
                          <TableHead>Trade</TableHead>
                          <TableHead>Certification</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee) => (
                          <TableRow 
                            key={employee.id}
                            className={`${
                              employee.match_score && employee.match_score > 70 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                                : employee.match_score && employee.match_score > 30
                                ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                            } transition-colors`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium">{employee.avatar}</span>
                                </div>
                                <div>
                                  <p className="font-medium dark:text-gray-200">{employee.name}</p>
                                  <p className={`text-xs ${
                                    employee.availability?.includes('Available') ? 'text-green-600 dark:text-green-400' :
                                    employee.availability?.includes('Leave') ? 'text-red-600 dark:text-red-400' :
                                    employee.availability?.includes('Training') ? 'text-blue-600 dark:text-blue-400' :
                                    'text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {employee.availability}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {employee.match_score && (
                                <span className={`font-medium ${
                                  employee.match_score > 70 ? 'text-emerald-600 dark:text-emerald-400' : 
                                  employee.match_score > 30 ? 'text-amber-600 dark:text-amber-400' :
                                  'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {employee.match_score}%
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{employee.role}</TableCell>
                            <TableCell className="text-sm">{employee.support}</TableCell>
                            <TableCell className="text-sm">{employee.core}</TableCell>
                            <TableCell className="text-sm">{employee.trade}</TableCell>
                            <TableCell className="text-sm">{employee.certification || "None"}</TableCell>
                            <TableCell className="text-center">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAssignEmployee(employee)}
                                disabled={!employee.availability?.includes('Available')}
                              >
                                Assign
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
