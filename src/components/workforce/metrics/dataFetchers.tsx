
import { supabase } from "@/integrations/supabase/client";
import { 
  EmployeeBasic, 
  SimpleRosterAssignment, 
  AircraftBasic, 
  MaintenanceVisitBasic, 
  EmployeeSupportBasic 
} from "./types";

// Separate data fetching functions to make the code more maintainable
export const fetchTotalEmployees = async (): Promise<EmployeeBasic[]> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, e_number, mobile_number, date_of_joining, is_active, job_titles(job_description), team:teams(team_name), certifications!left(*), employee_authorizations!left(*)');
      
    if (error) throw error;
    console.log('Total employees fetched:', data?.length);
    
    const result: EmployeeBasic[] = [];
    
    if (!data || !Array.isArray(data)) return [];
    
    for (const emp of data) {
      // Extract values safely
      const jobTitleDesc = emp.job_titles && typeof emp.job_titles === 'object' 
        ? emp.job_titles.job_description 
        : undefined;
      
      const teamName = emp.team && typeof emp.team === 'object' 
        ? emp.team.team_name 
        : undefined;
      
      const certCount = Array.isArray(emp.certifications) 
        ? emp.certifications.length 
        : 0;
        
      const authCount = Array.isArray(emp.employee_authorizations) 
        ? emp.employee_authorizations.length 
        : 0;
      
      // Create a flat employee object
      result.push({
        id: emp.id,
        name: emp.name,
        e_number: emp.e_number,
        is_active: emp.is_active,
        mobile_number: emp.mobile_number || undefined,
        date_of_joining: emp.date_of_joining || undefined,
        job_title_description: jobTitleDesc,
        team_name: teamName,
        certification_count: certCount,
        authorization_count: authCount
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

export const fetchEmployeeSupports = async (currentDate: string): Promise<EmployeeSupportBasic[]> => {
  try {
    const { data, error } = await supabase
      .from('employee_supports')
      .select('id, employee_id, support_id')
      .eq('date', currentDate);

    if (error) throw error;
    console.log('Employee supports fetched for today:', data?.length);
    
    if (!data || !Array.isArray(data)) return [];
    
    // Directly map to flat objects
    return data.map(support => ({
      id: support.id,
      employee_id: support.employee_id,
      support_id: support.support_id
    }));
  } catch (error) {
    console.error("Error fetching employee supports:", error);
    return [];
  }
};

export const fetchDateReference = async (currentDate: string): Promise<{ id: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('date_references')
      .select('id')
      .eq('actual_date', currentDate)
      .maybeSingle();

    if (error) throw error;
    console.log('Date reference fetched:', data);
    
    return data ? { id: data.id } : null;
  } catch (error) {
    console.error("Error fetching date reference:", error);
    return null;
  }
};

export const fetchRosterAssignments = async (dateId: number): Promise<SimpleRosterAssignment[]> => {
  try {
    if (!dateId) return [];
    
    const { data, error } = await supabase
      .from('roster_assignments')
      .select(`
        id, employee_id, date_id, roster_id,
        employees(id, name, e_number, job_titles(job_description), team:teams(team_name), mobile_number),
        date:date_references(actual_date),
        roster:roster_codes(roster_code)
      `)
      .eq('date_id', dateId);
    
    if (error) throw error;
    console.log('Roster assignments fetched:', data?.length);
    
    const assignments: SimpleRosterAssignment[] = [];
    
    if (!data || !Array.isArray(data)) return [];
    
    for (const ra of data) {
      // Extract all nested properties in a flat way
      const assignment: SimpleRosterAssignment = {
        id: ra.id,
        employee_id: ra.employee_id,
        date_id: ra.date_id,
        roster_id: ra.roster_id,
        employee_name: undefined,
        employee_number: undefined,
        employee_position: undefined,
        employee_team: undefined,
        employee_mobile: undefined,
        date_value: undefined,
        roster_code: undefined
      };
      
      // Safely extract employee data
      if (ra.employees && typeof ra.employees === 'object') {
        assignment.employee_name = ra.employees.name;
        assignment.employee_number = ra.employees.e_number;
        assignment.employee_mobile = ra.employees.mobile_number;
        
        // Extract nested job title
        if (ra.employees.job_titles && typeof ra.employees.job_titles === 'object') {
          assignment.employee_position = ra.employees.job_titles.job_description;
        }
        
        // Extract nested team
        if (ra.employees.team && typeof ra.employees.team === 'object') {
          assignment.employee_team = ra.employees.team.team_name;
        }
      }
      
      // Extract date
      if (ra.date && typeof ra.date === 'object') {
        assignment.date_value = ra.date.actual_date;
      }
      
      // Extract roster code
      if (ra.roster && typeof ra.roster === 'object') {
        assignment.roster_code = ra.roster.roster_code;
      }
      
      assignments.push(assignment);
    }
    
    return assignments;
  } catch (error) {
    console.error("Error fetching roster assignments:", error);
    return [];
  }
};

export const fetchAircraft = async (): Promise<AircraftBasic[]> => {
  try {
    const { data, error } = await supabase
      .from('aircraft')
      .select(`
        id, aircraft_name, registration, customer, total_hours, total_cycles,
        aircraft_types(type_name, manufacturer)
      `);
      
    if (error) throw error;
    console.log('Aircraft fetched:', data?.length);
    
    const aircraft: AircraftBasic[] = [];
    
    if (!data || !Array.isArray(data)) return [];
    
    for (const ac of data) {
      // Create a flat aircraft object with optional values
      const aircraftItem: AircraftBasic = {
        id: ac.id,
        aircraft_name: ac.aircraft_name,
        registration: ac.registration,
        customer: ac.customer,
        total_hours: ac.total_hours,
        total_cycles: ac.total_cycles,
        type_name: undefined,
        manufacturer: undefined
      };
      
      // Extract nested aircraft type data
      if (ac.aircraft_types && typeof ac.aircraft_types === 'object') {
        aircraftItem.type_name = ac.aircraft_types.type_name;
        aircraftItem.manufacturer = ac.aircraft_types.manufacturer;
      }
      
      aircraft.push(aircraftItem);
    }
    
    return aircraft;
  } catch (error) {
    console.error("Error fetching aircraft:", error);
    return [];
  }
};

export const fetchMaintenanceVisits = async (currentDate: string): Promise<MaintenanceVisitBasic[]> => {
  try {
    // First, fetch the maintenance visits
    const { data, error } = await supabase
      .from('maintenance_visits')
      .select(`
        id, aircraft_id, visit_number, check_type, status, date_in, date_out, remarks, hangar_id, total_hours,
        aircraft(id, aircraft_name, registration, aircraft_types(type_name)),
        hangar:hangars(hangar_name)
      `)
      .lte('date_in', currentDate)
      .gte('date_out', currentDate);
      
    if (error) throw error;
    
    // Separate query to get personnel requirements info
    const { data: personnelData, error: personnelError } = await supabase
      .from('personnel_requirements')
      .select('maintenance_visit_id, count')
      .gt('count', 0);
      
    if (personnelError) {
      console.error("Error fetching personnel requirements:", personnelError);
    }
    
    // Create a set of visit IDs with personnel requirements
    const visitsWithPersonnel = new Set<number>();
    
    if (personnelData && Array.isArray(personnelData)) {
      for (const p of personnelData) {
        if (p.maintenance_visit_id) {
          visitsWithPersonnel.add(p.maintenance_visit_id);
        }
      }
    }
    
    console.log('Maintenance visits fetched for today:', data?.length);
    
    if (!data || !Array.isArray(data)) return [];
    
    // Process the data with a flat mapping approach
    const visits: MaintenanceVisitBasic[] = [];
    
    for (const mv of data) {
      const visit: MaintenanceVisitBasic = {
        id: mv.id,
        aircraft_id: mv.aircraft_id,
        visit_number: mv.visit_number,
        check_type: mv.check_type,
        status: mv.status,
        date_in: mv.date_in,
        date_out: mv.date_out,
        remarks: mv.remarks,
        hangar_id: mv.hangar_id,
        total_hours: mv.total_hours,
        aircraft_name: undefined,
        aircraft_registration: undefined,
        aircraft_type: undefined,
        hangar_name: undefined,
        has_personnel_requirements: visitsWithPersonnel.has(mv.id)
      };
      
      // Extract aircraft data
      if (mv.aircraft && typeof mv.aircraft === 'object') {
        visit.aircraft_name = mv.aircraft.aircraft_name;
        visit.aircraft_registration = mv.aircraft.registration;
        
        // Extract aircraft type
        if (mv.aircraft.aircraft_types && typeof mv.aircraft.aircraft_types === 'object') {
          visit.aircraft_type = mv.aircraft.aircraft_types.type_name;
        }
      }
      
      // Extract hangar data
      if (mv.hangar && typeof mv.hangar === 'object') {
        visit.hangar_name = mv.hangar.hangar_name;
      }
      
      visits.push(visit);
    }
    
    return visits;
  } catch (error) {
    console.error("Error fetching maintenance visits:", error);
    return [];
  }
};
