import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, Plus, Check, X } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDate } from "@/contexts/DateContext";

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
  engine_type?: string;
  selected?: boolean;
}

interface TradeRequirement {
  trade: string;
  day_count?: number;  
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraft: AircraftSchedule | null;
}

interface SuggestedTeam {
  id: string;
  name: string;
  score: number;
  color: string;
  borderColor: string;
  members: Employee[];
}

export const AircraftDetailsModal = ({ open, onOpenChange, aircraft }: AircraftDetailsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [tradeRequirements, setTradeRequirements] = useState<TradeRequirement[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());
  const [hasActiveFilter, setHasActiveFilter] = useState(false);
  const [suggestedTeams, setSuggestedTeams] = useState<SuggestedTeam[]>([]);
  
  const { currentDate, formatDate } = useDate();

  useEffect(() => {
    if (open && aircraft) {
      fetchEmployeeData();
      fetchPersonnelRequirements();
    }
  }, [open, aircraft]);

  useEffect(() => {
    // Apply search/filter when search query or available employees change
    applySearchFilter();
  }, [searchQuery, availableEmployees]);

  useEffect(() => {
    // Update personnel requirements when assigned employees change
    if (assignedEmployees.length > 0 && aircraft) {
      updatePersonnelRequirementsWithAssignments();
    }
  }, [assignedEmployees]);

  const applySearchFilter = () => {
    if (!searchQuery.trim()) {
      // No search - show all available employees, with selected ones first if filter was active
      if (hasActiveFilter && selectedEmployees.size > 0) {
        const selected = availableEmployees.filter(emp => selectedEmployees.has(emp.id));
        const unselected = availableEmployees.filter(emp => !selectedEmployees.has(emp.id));
        setFilteredEmployees([...selected, ...unselected]);
      } else {
        setFilteredEmployees(availableEmployees);
      }
      setHasActiveFilter(false);
      return;
    }

    // Parse search query - split by commas and clean terms
    const searchTerms = searchQuery.toLowerCase().split(',').map(term => term.trim()).filter(term => term.length > 0);
    
    const filtered = availableEmployees.filter(employee => {
      // Check if employee matches ALL search terms (AND logic)
      return searchTerms.every(term => {
        return (
          employee.name.toLowerCase().includes(term) ||
          employee.role.toLowerCase().includes(term) ||
          employee.skill.toLowerCase().includes(term) ||
          (employee.certification && employee.certification.toLowerCase().includes(term)) ||
          (employee.support && employee.support.toLowerCase().includes(term)) ||
          (employee.core && employee.core.toLowerCase().includes(term)) ||
          (employee.trade && employee.trade.toLowerCase().includes(term)) ||
          (employee.engine_type && employee.engine_type.toLowerCase().includes(term)) ||
          // Check for aircraft type matches
          (term.includes('a350') && (employee.certification?.toLowerCase().includes('a350') || employee.engine_type?.toLowerCase().includes('trent'))) ||
          (term.includes('737') && (employee.certification?.toLowerCase().includes('737') || employee.certification?.toLowerCase().includes('boeing'))) ||
          (term.includes('777') && (employee.certification?.toLowerCase().includes('777') || employee.certification?.toLowerCase().includes('boeing'))) ||
          // Check for engine type matches
          (term.includes('trent') && employee.engine_type?.toLowerCase().includes('trent')) ||
          (term.includes('cfm') && employee.engine_type?.toLowerCase().includes('cfm')) ||
          (term.includes('pw') && employee.engine_type?.toLowerCase().includes('pw')) ||
          // Check for authorization matches
          (term.includes('b1') && (employee.certification?.toLowerCase().includes('b1') || employee.trade?.toLowerCase().includes('b1'))) ||
          (term.includes('b2') && (employee.certification?.toLowerCase().includes('b2') || employee.trade?.toLowerCase().includes('b2')))
        );
      });
    });

    setFilteredEmployees(filtered);
    setHasActiveFilter(searchTerms.length > 0);
  };

  const generateAIProposals = (employees: Employee[]) => {
    // 1. Filter qualified employees (lower threshold to 20 to be more inclusive)
    const qualified = employees.filter(e => (e.match_score || 0) > 20);

    // 2. Sort by score
    const sorted = [...qualified].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

    // Need at least 6 employees to create meaningful teams
    if (sorted.length < 6) {
      // If we don't have enough qualified, use all available employees
      const allSorted = [...employees].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

      if (allSorted.length < 6) return; // Really not enough employees

      // Use all available employees instead
      const teamAlpha = allSorted.slice(0, Math.min(8, allSorted.length));
      const teamBravo = allSorted.slice(0, Math.min(8, allSorted.length)); // Same team for demo
      const teamCharlie = allSorted.slice(0, Math.min(8, allSorted.length)); // Same team for demo

      setSuggestedTeams([
        {
          id: 'alpha',
          name: 'Team Alpha (Best Available)',
          score: 75,
          color: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-500',
          members: teamAlpha
        },
        {
          id: 'bravo',
          name: 'Team Bravo (Standard)',
          score: 70,
          color: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-500',
          members: teamBravo
        },
        {
          id: 'charlie',
          name: 'Team Charlie (Training)',
          score: 65,
          color: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-500',
          members: teamCharlie
        }
      ]);
      return;
    }

    // 3. Create buckets with enough employees
    // Team Alpha: Best of the best (top performers)
    const teamAlpha = sorted.slice(0, Math.min(8, sorted.length));

    // Team Bravo: Next best block (mid-tier)
    const teamBravo = sorted.slice(
      Math.min(6, Math.floor(sorted.length / 3)),
      Math.min(14, Math.floor(sorted.length / 3) + 8)
    );

    // Ensure Team Bravo has enough members, otherwise use duplicates from top
    if (teamBravo.length < 6) {
      const additionalMembers = sorted.slice(0, 8 - teamBravo.length);
      teamBravo.push(...additionalMembers);
    }

    // Team Charlie: Balanced mix (2 Seniors + 6 Juniors/Mid-level)
    const seniorCount = Math.min(2, sorted.length);
    const juniorStartIndex = Math.min(10, Math.floor(sorted.length / 2));
    const teamCharlie = [
        ...sorted.slice(0, seniorCount),
        ...sorted.slice(juniorStartIndex, juniorStartIndex + Math.min(6, sorted.length - juniorStartIndex))
    ];

    // Fill Team Charlie if needed
    if (teamCharlie.length < 6) {
      const additionalMembers = sorted.slice(0, 8 - teamCharlie.length);
      teamCharlie.push(...additionalMembers.filter(m => !teamCharlie.find(tm => tm.id === m.id)));
    }

    // Calculate dynamic scores based on average match scores
    const calcTeamScore = (team: Employee[]) => {
      const avgScore = team.reduce((sum, emp) => sum + (emp.match_score || 0), 0) / team.length;
      return Math.min(98, Math.max(60, Math.round(avgScore)));
    };

    setSuggestedTeams([
      {
        id: 'alpha',
        name: 'Team Alpha (High Perf.)',
        score: calcTeamScore(teamAlpha),
        color: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-500',
        members: teamAlpha
      },
      {
        id: 'bravo',
        name: 'Team Bravo (Standard)',
        score: calcTeamScore(teamBravo),
        color: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-500',
        members: teamBravo
      },
      {
        id: 'charlie',
        name: 'Team Charlie (Training)',
        score: calcTeamScore(teamCharlie),
        color: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-500',
        members: teamCharlie
      }
    ]);
  };

  const handleSelectTeam = async (team: SuggestedTeam) => {
    try {
      await assignEmployeesToAircraft(team.members, aircraft?.registration || '');
      
      // Update aircraft status logic...
      if (aircraft && aircraft.status === 'Scheduled') {
        await updateAircraftStatus(parseInt(aircraft.id), 'In Progress');
        aircraft.status = 'In Progress';
      }
      
      setAssignedEmployees(prev => [...prev, ...team.members]);
      setAvailableEmployees(prev => prev.filter(emp => !team.members.find(m => m.id === emp.id)));
      setSuggestedTeams([]); // Clear suggestions after selection
      toast.success(`${team.name} assigned successfully!`);
    } catch (error) {
      toast.error("Failed to assign team");
    }
  };

  const fetchEmployeeData = async () => {
    if (!aircraft) return;
    setLoading(true);

    try {
      const aircraftStartDateString = format(aircraft.start, 'yyyy-MM-dd');
      
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
        .eq('roster_assignments.date_references.actual_date', aircraftStartDateString);

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
                       ''
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
        .gte('expiry_date', aircraftStartDateString);

      if (certError) throw certError;

      // Fetch employee supports - filtered by current date
      const { data: supportData, error: supportError } = await supabase
        .from('employee_supports')
        .select(`
          employee_id,
          support_id,
          assignment_date,
          support_codes:support_id (support_code)
        `)
        .eq('assignment_date', aircraftStartDateString);
      
      // Fetch employee cores - filtered by current date  
      const { data: coreData, error: coreError } = await supabase
        .from('employee_cores')
        .select(`
          employee_id,
          core_id,
          assignment_date,
          core_codes:core_id (core_code)
        `)
        .eq('assignment_date', aircraftStartDateString);
      
      // Check for employees assigned to this specific aircraft
      const { data: aircraftAssignedCores, error: aircraftCoreError } = await supabase
        .from('employee_cores')
        .select(`
          employee_id,
          core_codes:core_id (core_code)
        `)
        .eq('assignment_date', aircraftStartDateString)
        .eq('core_codes.core_code', aircraft.registration);
      
      const { data: aircraftAssignedSupports, error: aircraftSupportError } = await supabase
        .from('employee_supports')
        .select(`
          employee_id,
          support_codes:support_id (support_code)
        `)
        .eq('assignment_date', aircraftStartDateString)
        .eq('support_codes.support_code', aircraft.registration);



      if (coreError) throw coreError;

      // Fetch trades for employees (we'll infer from authorizations and job titles)
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*');

      if (tradesError) throw tradesError;

      // Process employees data with enhanced matching
      const availableEmps = allEmployees.map((emp: any) => {
        const empAuths = authData?.filter(auth => auth.employee_id === emp.id) || [];
        const empCerts = certData?.filter(cert => cert.employee_id === emp.id) || [];
        const empSupports = supportData?.filter(support => support.employee_id === emp.id) || [];
        const empCores = coreData?.filter(core => core.employee_id === emp.id) || [];
        
        const matchScore = calculateEnhancedMatchScore(empAuths, empCerts, empSupports, aircraft, emp);
        
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
          support: empSupports.map((s: any) => s.support_codes?.support_code).filter(Boolean).join(', ') || 'AV',
          core: empCores.map((c: any) => c.core_codes?.core_code).filter(Boolean).join(', ') || 'AV',
          trade: determineTrade(empAuths, emp.job_titles?.job_description, tradesData),
          engine_type: extractEngineTypes(empAuths)
        };
      });

      // Sort by availability priority (not on off day first), then by match score
      availableEmps.sort((a, b) => {
        // Define availability priorities (higher number = higher priority)
        const getAvailabilityPriority = (availability: string | undefined) => {
          if (!availability) return 0; // No availability info
          if (availability === 'Available') return 3; // Available (not on off day) - highest priority
          if (availability === 'Available (Off Day)') return -1; // Available but on off day - medium priority
          if (availability.includes('Available')) return 1; // Other available statuses - low priority
          return 0; // Not available (leave, sick, training, etc.) - lowest priority
        };
        
        const aPriority = getAvailabilityPriority(a.availability);
        const bPriority = getAvailabilityPriority(b.availability);
        
        // First sort by availability priority
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        // Within same availability priority, sort by match score
        return (b.match_score || 0) - (a.match_score || 0);
      });

      
      // Generate assigned teams for completed and in-progress visits
      let assigned: Employee[] = [];
      if (aircraft.status === 'Completed' || aircraft.status === 'In Progress') {
        assigned = generateAssignedTeam(availableEmps, aircraft);
      } else if (aircraft.status === 'Scheduled' && (aircraft.registration === 'G-FVWF' || aircraft.registration.includes('GCAA'))) {
        // For G-FVWF scheduled visits, show high-matching employees as potentially assigned
        assigned = availableEmps
          .filter(emp => emp.match_score && emp.match_score > 70)
          .slice(0, 8); // Take top 8 matches
      }

      const availablePool = availableEmps.filter(emp => !assigned.find(a => a.id === emp.id));
      setAssignedEmployees(assigned);
      setAvailableEmployees(availablePool);
      
      // Generate AI proposals for any status except Completed and In Progress
      if (aircraft.status !== 'Completed' && aircraft.status !== 'In Progress') {
        generateAIProposals(availablePool);
      } else {
        setSuggestedTeams([]);
      }

    } catch (error) {
      console.error("Error fetching employee data:", error);
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const generateAssignedTeam = (employees: Employee[], aircraft: AircraftSchedule): Employee[] => {
    // Filter employees with good availability and match scores
    const goodMatches = employees.filter(emp => emp.match_score && emp.match_score > 30);

    // Ensure we have a diverse team with different trades
    const teamComposition = [
      { trade: 'B1 Tech', count: 3 },
      { trade: 'B2 Tech', count: 2 },
      { trade: 'STRUC & COMP', count: 1 },
      { trade: 'CABIN', count: 1 },
      { trade: 'General', count: 1 }
    ];

    const assignedTeam: Employee[] = [];
    
    teamComposition.forEach(({ trade, count }) => {
      const tradeEmployees = goodMatches.filter(emp => 
        emp.trade === trade && !assignedTeam.find(a => a.id === emp.id)
      );
      
      // Add employees from this trade
      assignedTeam.push(...tradeEmployees.slice(0, count));
    });

    // Fill remaining spots if needed
    while (assignedTeam.length < 8 && assignedTeam.length < goodMatches.length) {
      const remaining = goodMatches.filter(emp => !assignedTeam.find(a => a.id === emp.id));
      if (remaining.length > 0) {
        assignedTeam.push(remaining[0]);
      } else {
        break;
      }
    }

    // For completed visits, mark all as completed work
    if (aircraft.status === 'Completed') {
      return assignedTeam.map(emp => ({
        ...emp,
        availability: 'Completed work'
      }));
    }

    // For in-progress visits, mark as currently working
    if (aircraft.status === 'In Progress') {
      return assignedTeam.map(emp => ({
        ...emp,
        availability: 'Currently working'
      }));
    }

    return assignedTeam;
  };

  const calculateEnhancedMatchScore = (
    authorizations: any[], 
    certifications: any[], 
    supports: any[],
    aircraft: AircraftSchedule, 
    employee: any
  ): number => {
    let score = 0;
    const maxScore = 100;

    // 1. Aircraft Type Authorization Match (30 points)
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
      score += 30;
    }

    // 2. Certification Match (25 points)
    const matchingCerts = certifications.filter(cert => {
      const certAircraftType = cert.aircraft?.aircraft_types?.type_name?.toLowerCase() || '';
      const certTypeCode = cert.aircraft?.aircraft_types?.type_code?.toLowerCase() || '';
      
      return certAircraftType.includes(aircraftName) ||
             certTypeCode.includes(aircraftName) ||
             cert.aircraft?.registration === aircraft.registration;
    });
    
    if (matchingCerts.length > 0) {
      score += 25;
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

    // 4. Availability/Support Match (15 points) - NOW INCLUDES AV
    const isAvailable = supports.some(support => 
      support.support_codes?.support_code === 'AV' || // Available
      support.support_codes?.support_code === 'O'     // Off duty
    );
    
    if (isAvailable) {
      score += 15;
    }

    // 5. Job Title Relevance (10 points)
    const jobTitle = employee.job_titles?.job_description?.toLowerCase() || '';
    const relevantTitles = ['technician', 'engineer', 'mechanic', 'inspector'];
    
    if (relevantTitles.some(title => jobTitle.includes(title))) {
      score += 10;
    }

    // Special boost for G-FVWF aircraft to ensure we have good matches
    if (aircraft.registration === 'G-FVWF' || aircraft.registration.includes('GCAA')) {
      // Boost scores for employees with IDs 1-15 (for demo purposes)
      if (employee.id && employee.id <= 15) {
        score = Math.min(score + 20, maxScore);
      }
    }

    return Math.min(score, maxScore);
  };

  const extractEngineTypes = (authorizations: any[]): string => {
    const engines = new Set<string>();
    
    authorizations.forEach(auth => {
      if (auth.engine_models?.model_code) {
        engines.add(auth.engine_models.model_code);
      }
      if (auth.engine_models?.manufacturer) {
        engines.add(auth.engine_models.manufacturer);
      }
    });
    
    return Array.from(engines).join(', ') || 'None';
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

    const trades = ['B1 Tech', 'B2 Tech', 'STRUC & COMP', 'CABIN', 'General'];
    const startDate = new Date(aircraft.start);
    const endDate = new Date(aircraft.end);
    const dayDiff = differenceInDays(endDate, startDate);

    trades.forEach(trade => {
      const dates = [];
      let totalDay = 0;
      let totalNight = 0;

      for (let i = 0; i <= Math.min(dayDiff, 6); i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dayCount = trade === 'B1 Tech' ? 3 :
                         trade === 'B2 Tech' ? 2 :
                         trade === 'STRUC & COMP' ? 1 :
                         trade === 'CABIN' ? 1 :
                         trade === 'General' ? 1 : 0;

        const nightCount = 0; // Mock data shows 0 night shift

        totalDay += dayCount;
        totalNight += nightCount;

        dates.push({
          date: format(currentDate, 'dd-MMM'),
          day_count: dayCount,
          night_count: nightCount,
          assigned_day: 0, // Will be calculated from actual assignments
          assigned_night: 0
        });
      }

      requirements[trade] = {
        trade,
        day_count: totalDay,
        night_count: totalNight,
        assigned_day: 0, // Will be calculated from actual assignments
        assigned_night: 0,
        dates
      };
    });
  };

  const updatePersonnelRequirementsWithAssignments = () => {
    if (!aircraft || tradeRequirements.length === 0) return;

    // Create a copy of current requirements
    const updatedRequirements = tradeRequirements.map(req => {
      // Count assigned employees for this trade
      const assignedForTrade = assignedEmployees.filter(emp => emp.trade === req.trade);
      const assignedCount = assignedForTrade.length;

      // Update dates with assigned counts
      const updatedDates = req.dates.map(dateReq => ({
        ...dateReq,
        assigned_day: Math.min(assignedCount, dateReq.day_count), // Don't exceed required count
        assigned_night: 0
      }));

      return {
        ...req,
        assigned_day: assignedCount,
        assigned_night: 0,
        dates: updatedDates
      };
    });

    setTradeRequirements(updatedRequirements);
  };

  const handleAssignEmployee = async (employee: Employee) => {
    try {
      // Save assignment to database
      await assignEmployeesToAircraft([employee], aircraft?.registration || '');
      
      // Update aircraft status to "In Progress" if it's currently "Scheduled"
      let statusMessage = '';
      if (aircraft && aircraft.status === 'Scheduled') {
        await updateAircraftStatus(parseInt(aircraft.id), 'In Progress');
        aircraft.status = 'In Progress';
        statusMessage = ' Status updated to In Progress.';
      } else if (aircraft?.status === 'In Progress') {
        statusMessage = ' Added to current team.';
      }
      
      // Update local state
      setAssignedEmployees(prev => [...prev, employee]);
      setAvailableEmployees(prev => prev.filter(emp => emp.id !== employee.id));
      
      toast.success(`${employee.name} assigned to ${aircraft?.registration}.${statusMessage}`);
    } catch (error) {
      toast.error("Failed to assign employee. Please try again.");
      console.error("Assignment error:", error);
    }
  };

  // ADD THESE TWO NEW FUNCTIONS HERE (before handleAssignEmployee)
  const assignEmployeesToAircraft = async (employees: Employee[], aircraftRegistration: string) => {
    if (!aircraft) return;
    
    const startDate = new Date(aircraft.start);
    const endDate = new Date(aircraft.end);

    
    try {
      // For each employee, create core and support assignments
      for (const employee of employees) {
        // Find or create core code for this aircraft
        let { data: coreCode, error: coreError } = await supabase
          .from('core_codes')
          .select('id')
          .eq('core_code', aircraftRegistration)
          .single();
        
        if (coreError && coreError.code === 'PGRST116') {
          // Core code doesn't exist, create it
          const { data: newCore, error: createCoreError } = await supabase
            .from('core_codes')
            .insert({ core_code: aircraftRegistration })
            .select('id')
            .single();
          
          if (createCoreError) throw createCoreError;
          coreCode = newCore;
        } else if (coreError) {
          throw coreError;
        }
        
        // Find or create support code for this aircraft
        let { data: supportCode, error: supportError } = await supabase
          .from('support_codes')
          .select('id')
          .eq('support_code', aircraftRegistration)
          .single();
        
        if (supportError && supportError.code === 'PGRST116') {
          // Support code doesn't exist, create it
          const { data: newSupport, error: createSupportError } = await supabase
            .from('support_codes')
            .insert({ support_code: aircraftRegistration })
            .select('id')
            .single();
          
          if (createSupportError) throw createSupportError;
          supportCode = newSupport;
        } else if (supportError) {
          throw supportError;
        }
        
        // Loop through each date from start to end
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateString = format(currentDate, 'yyyy-MM-dd');
          
          // Insert or update employee core assignment for this date
          const { error: coreAssignError } = await supabase
            .from('employee_cores')
            .upsert({
              employee_id: employee.id,
              core_id: coreCode.id,
              assignment_date: dateString
            }, {
              onConflict: 'employee_id,assignment_date'
            });
          
          if (coreAssignError) throw coreAssignError;
          
          // Insert or update employee support assignment for this date
          const { error: supportAssignError } = await supabase
            .from('employee_supports')
            .upsert({
              employee_id: employee.id,
              support_id: supportCode.id,
              assignment_date: dateString
            }, {
              onConflict: 'employee_id,assignment_date'
            });
          
          if (supportAssignError) throw supportAssignError;
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    } catch (error) {
      console.error('Error assigning employees to aircraft:', error);
      throw error;
    }
  };

  const updateAircraftStatus = async (maintenanceVisitId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_visits')
        .update({ status: newStatus })
        .eq('id', maintenanceVisitId);
      
      if (error) throw error;
      
      console.log(`Maintenance visit status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error updating maintenance visit status:', error);
      throw error;
    }
  };


  
  const removeEmployeeFromAircraft = async (employee: Employee, aircraftRegistration: string) => {
    if (!aircraft) return;
    
    const startDate = new Date(aircraft.start);
    const endDate = new Date(aircraft.end);
    
    try {
      // Loop through each date from start to end and remove assignments
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        
        // Remove employee core assignment for this date
        const { error: coreRemoveError } = await supabase
          .from('employee_cores')
          .delete()
          .eq('employee_id', employee.id)
          .eq('assignment_date', dateString);
        
        if (coreRemoveError) throw coreRemoveError;
        
        // Remove employee support assignment for this date
        const { error: supportRemoveError } = await supabase
          .from('employee_supports')
          .delete()
          .eq('employee_id', employee.id)
          .eq('assignment_date', dateString);
        
        if (supportRemoveError) throw supportRemoveError;
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      console.error('Error removing employee from aircraft:', error);
      throw error;
    }
  };


  const handleBulkAssignEmployees = async () => {
    if (selectedEmployees.size === 0) {
      toast.error("Please select employees to assign");
      return;
    }
  
    const employeesToAssign = filteredEmployees.filter(emp => selectedEmployees.has(emp.id));
    
    try {
      // Save assignments to database
      await assignEmployeesToAircraft(employeesToAssign, aircraft?.registration || '');
      
      // Update aircraft status to "In Progress" if it's currently "Scheduled"
      let statusMessage = '';
      if (aircraft && aircraft.status === 'Scheduled') {
        await updateAircraftStatus(parseInt(aircraft.id), 'In Progress');
        aircraft.status = 'In Progress';
        statusMessage = ' Status updated to In Progress.';
      } else if (aircraft?.status === 'In Progress') {
        statusMessage = ' Added to current team.';
      }
      
      // Update local state
      const newAssigned = [...assignedEmployees, ...employeesToAssign];
      const newAvailable = availableEmployees.filter(emp => !selectedEmployees.has(emp.id));
      
      setAssignedEmployees(newAssigned);
      setAvailableEmployees(newAvailable);
      setFilteredEmployees(newAvailable);
      setSelectedEmployees(new Set());
      
      toast.success(`${employeesToAssign.length} employees assigned to ${aircraft?.registration}.${statusMessage}`);
    } catch (error) {
      toast.error("Failed to assign employees. Please try again.");
      console.error("Assignment error:", error);
    }
  };

  const handleRemoveAssignedEmployee = async (employee: Employee) => {
    try {
      // Remove assignment from database
      await removeEmployeeFromAircraft(employee, aircraft?.registration || '');
      
      // Update local state
      setAssignedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
      setAvailableEmployees(prev => [...prev, {...employee, match_score: calculateEmployeeMatchScore(employee)}]);
      
      toast.info(`${employee.name} removed from ${aircraft?.registration}`);
    } catch (error) {
      toast.error("Failed to remove employee assignment. Please try again.");
      console.error("Remove assignment error:", error);
    }
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

  const handleEmployeeSelect = (employeeId: number) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const handleClearFilter = () => {
    setSearchQuery("");
    setHasActiveFilter(false);
    // Keep selected employees at top
    if (selectedEmployees.size > 0) {
      const selected = availableEmployees.filter(emp => selectedEmployees.has(emp.id));
      const unselected = availableEmployees.filter(emp => !selectedEmployees.has(emp.id));
      setFilteredEmployees([...selected, ...unselected]);
    } else {
      setFilteredEmployees(availableEmployees);
    }
  };

  if (!aircraft) return null;

  const duration = differenceInDays(aircraft.end, aircraft.start) + 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh] flex flex-col">
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
                          <div className="text-xs">Assigned / Required</div>
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
                                "text-emerald-600 dark:text-emerald-400 font-medium" : 
                                date.assigned_day > 0 ? "text-amber-600 dark:text-amber-400" :
                                "text-red-600 dark:text-red-400"}>
                                {date.assigned_day}/{date.day_count}
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
              <h3 className="text-lg font-semibold">
                {aircraft.status === 'Completed' ? 'Team that Completed Work' : 
                 aircraft.status === 'In Progress' ? 'Currently Assigned Team' : 
                 aircraft.status === 'Scheduled' && (aircraft.registration === 'G-FVWF' || aircraft.registration.includes('GCAA')) ? 'Recommended Team' : 
                 'Assigned Team'}
              </h3>
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
                        {(aircraft.status === 'Scheduled' || aircraft.status === 'In Progress') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveAssignedEmployee(employee)}
                          >
                            {aircraft.status === 'In Progress' ? 'Remove from Team' : 'Remove'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <User className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No team assigned</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (70%) - Available Employees Table */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* NEW SECTION: AI Suggested Teams */}
              {suggestedTeams.length > 0 && aircraft.status !== 'Completed' && aircraft.status !== 'In Progress' && (
                <div className="mb-6 space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-purple-600">✨ AI Suggested Teams</span>
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-gray-800 dark:text-gray-400">Beta</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {suggestedTeams.map(team => (
                      <div key={team.id} className={`border-l-4 ${team.borderColor} ${team.color} p-4 rounded-r-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200">{team.name}</h4>
                          <span className="bg-white dark:bg-gray-800 text-sm font-bold px-2 py-1 rounded shadow-sm border dark:border-gray-700">{team.score}% Match</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          {team.members.length} Members • {team.members.filter(m => m.trade?.includes('B1')).length} B1 • {team.members.filter(m => m.trade?.includes('B2')).length} B2
                        </div>
                        <div className="flex -space-x-2 overflow-hidden mb-4 pl-1">
                          {team.members.slice(0, 5).map(m => (
                            <div key={m.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 flex items-center justify-center text-xs font-bold" title={m.name}>
                              {m.avatar}
                            </div>
                          ))}
                          {team.members.length > 5 && (
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs">
                              +{team.members.length - 5}
                            </div>
                          )}
                        </div>
                        <Button size="sm" className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => handleSelectTeam(team)}>
                          Select Team
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-lg font-semibold">Available Employees</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {/* Enhanced Search Bar */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                      placeholder="Search: B1, A350, Trent 1000 or Trent 1000, B1, A350..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {hasActiveFilter && (
                    <Button 
                      variant="outline" 
                      onClick={handleClearFilter}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear Filter
                    </Button>
                  )}
                  {(aircraft.status === 'Scheduled' || aircraft.status === 'In Progress') && selectedEmployees.size > 0 && (
                    <Button 
                      onClick={handleBulkAssignEmployees}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {aircraft.status === 'In Progress' ? 'Add to Team' : 'Assign Selected'} ({selectedEmployees.size})
                    </Button>
                  )}
                </div>

                {/* Employee Table */}
                <div className="overflow-auto">
                  {loading ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                    </div>
                  ) : filteredEmployees.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">
                            <input 
                              type="checkbox" 
                              className="rounded"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const allIds = new Set(filteredEmployees.map(emp => emp.id));
                                  setSelectedEmployees(allIds);
                                } else {
                                  setSelectedEmployees(new Set());
                                }
                              }}
                              checked={filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployees.has(emp.id))}
                            />
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Support</TableHead>
                          <TableHead>Core</TableHead>
                          <TableHead>Trade</TableHead>
                          <TableHead>Engine Type</TableHead>
                          <TableHead>Certification</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee) => (
                          <TableRow 
                            key={employee.id}
                            className={`${
                              selectedEmployees.has(employee.id) ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' :
                              employee.match_score && employee.match_score > 70 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                                : employee.match_score && employee.match_score > 30
                                ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                            } transition-colors`}
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedEmployees.has(employee.id)}
                                onChange={() => handleEmployeeSelect(employee.id)}
                              />
                            </TableCell>
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
                            <TableCell className="text-sm">{employee.role}</TableCell>
                            <TableCell className="text-sm">{employee.support}</TableCell>
                            <TableCell className="text-sm">{employee.core}</TableCell>
                            <TableCell className="text-sm">{employee.trade}</TableCell>
                            <TableCell className="text-sm">{employee.engine_type}</TableCell>
                            <TableCell className="text-sm">{employee.certification || "None"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      {searchQuery ? 'No employees match your search criteria' : 'No employees available'}
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