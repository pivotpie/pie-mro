
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
    
    if (data && Array.isArray(data)) {
      // Use type assertion to help TypeScript understand the structure
      for (const emp of data) {
        const employee: EmployeeBasic = {
          id: emp.id,
          name: emp.name,
          e_number: emp.e_number,
          is_active: emp.is_active,
          mobile_number: emp.mobile_number || undefined,
          date_of_joining: emp.date_of_joining || undefined,
          // Use optional chaining with type safety
          job_title_description: emp.job_titles ? emp.job_titles.job_description : undefined,
          team_name: emp.team ? emp.team.team_name : undefined,
          certification_count: Array.isArray(emp.certifications) ? emp.certifications.length : 0,
          authorization_count: Array.isArray(emp.employee_authorizations) ? emp.employee_authorizations.length : 0
        };
        
        result.push(employee);
      }
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
    
    const supports: EmployeeSupportBasic[] = [];
    
    if (data && Array.isArray(data)) {
      for (const support of data) {
        supports.push({
          id: support.id,
          employee_id: support.employee_id,
          support_id: support.support_id
        });
      }
    }
    
    return supports;
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
    
    if (data) {
      return { id: data.id };
    }
    
    return null;
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
    console.log('Roster assignments fetched for today:', data?.length);
    
    const assignments: SimpleRosterAssignment[] = [];
    
    if (data && Array.isArray(data)) {
      for (const ra of data) {
        // Build the assignment object with explicit properties to avoid deep type instantiation
        const assignment: SimpleRosterAssignment = {
          id: ra.id,
          employee_id: ra.employee_id,
          date_id: ra.date_id,
          roster_id: ra.roster_id,
          employee_name: ra.employees ? ra.employees.name : undefined,
          employee_number: ra.employees ? ra.employees.e_number : undefined,
          employee_position: ra.employees && ra.employees.job_titles ? ra.employees.job_titles.job_description : undefined,
          employee_team: ra.employees && ra.employees.team ? ra.employees.team.team_name : undefined,
          employee_mobile: ra.employees ? ra.employees.mobile_number : undefined,
          date_value: ra.date ? ra.date.actual_date : undefined,
          roster_code: ra.roster ? ra.roster.roster_code : undefined
        };
        
        assignments.push(assignment);
      }
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
    
    if (data && Array.isArray(data)) {
      for (const ac of data) {
        // Create aircraft object with explicit properties to avoid deep type instantiation
        const aircraftItem: AircraftBasic = {
          id: ac.id,
          aircraft_name: ac.aircraft_name,
          registration: ac.registration,
          type_name: ac.aircraft_types ? ac.aircraft_types.type_name : undefined,
          manufacturer: ac.aircraft_types ? ac.aircraft_types.manufacturer : undefined,
          customer: ac.customer,
          total_hours: ac.total_hours,
          total_cycles: ac.total_cycles
        };
        
        aircraft.push(aircraftItem);
      }
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
    
    // Process the data with explicit typing
    const visits: MaintenanceVisitBasic[] = [];
    
    if (data && Array.isArray(data)) {
      for (const mv of data) {
        // Create visit object with explicit properties to avoid deep type instantiation
        const visit: MaintenanceVisitBasic = {
          id: mv.id,
          aircraft_id: mv.aircraft_id,
          aircraft_name: mv.aircraft ? mv.aircraft.aircraft_name : undefined,
          aircraft_registration: mv.aircraft ? mv.aircraft.registration : undefined,
          aircraft_type: mv.aircraft && mv.aircraft.aircraft_types ? mv.aircraft.aircraft_types.type_name : undefined,
          visit_number: mv.visit_number,
          check_type: mv.check_type,
          status: mv.status,
          date_in: mv.date_in,
          date_out: mv.date_out,
          remarks: mv.remarks,
          hangar_id: mv.hangar_id,
          hangar_name: mv.hangar ? mv.hangar.hangar_name : undefined,
          total_hours: mv.total_hours,
          has_personnel_requirements: visitsWithPersonnel.has(mv.id)
        };
        visits.push(visit);
      }
    }
    
    return visits;
  } catch (error) {
    console.error("Error fetching maintenance visits:", error);
    return [];
  }
};
