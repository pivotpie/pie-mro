
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
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, e_number, mobile_number, date_of_joining, is_active, job_titles(job_description), team:teams(team_name), certifications!left(*), employee_authorizations!left(*)');
    
  if (error) throw error;
  console.log('Total employees fetched:', data?.length);
  
  // Transform the data with explicit typing
  const result: EmployeeBasic[] = [];
  
  if (data && Array.isArray(data)) {
    for (const emp of data) {
      const certCount = emp.certifications && Array.isArray(emp.certifications) 
        ? emp.certifications.length 
        : 0;
      
      const authCount = emp.employee_authorizations && Array.isArray(emp.employee_authorizations) 
        ? emp.employee_authorizations.length 
        : 0;
        
      // Create employee object with explicit typing
      const employee: EmployeeBasic = {
        id: emp.id,
        name: emp.name,
        e_number: emp.e_number,
        mobile_number: emp.mobile_number,
        date_of_joining: emp.date_of_joining,
        is_active: emp.is_active,
        job_title_description: emp.job_titles?.job_description,
        team_name: emp.team?.team_name,
        certification_count: certCount,
        authorization_count: authCount
      };
      
      result.push(employee);
    }
  }
  
  return result;
};

export const fetchEmployeeSupports = async (currentDate: string): Promise<EmployeeSupportBasic[]> => {
  const { data, error } = await supabase
    .from('employee_supports')
    .select('id, employee_id, support_id')
    .eq('date', currentDate);

  if (error) throw error;
  console.log('Employee supports fetched for today:', data?.length);
  return data as EmployeeSupportBasic[] || [];
};

export const fetchDateReference = async (currentDate: string): Promise<{ id: number } | null> => {
  const { data, error } = await supabase
    .from('date_references')
    .select('id')
    .eq('actual_date', currentDate)
    .single();

  if (error) {
    console.error("Error fetching date reference:", error);
    return null;
  }
  console.log('Date reference fetched:', data);
  return data as { id: number } | null;
};

export const fetchRosterAssignments = async (dateId: number): Promise<SimpleRosterAssignment[]> => {
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
  
  if (error) {
    console.error("Error fetching roster assignments:", error);
    return [];
  }
  console.log('Roster assignments fetched for today:', data?.length);
  
  // Transform to a flatter structure with manual type handling
  const result: SimpleRosterAssignment[] = [];
  
  if (data && Array.isArray(data)) {
    for (const ra of data) {
      const assignment: SimpleRosterAssignment = {
        id: ra.id,
        employee_id: ra.employee_id,
        date_id: ra.date_id,
        roster_id: ra.roster_id,
        employee_name: ra.employees?.name,
        employee_number: ra.employees?.e_number,
        employee_position: ra.employees?.job_titles?.job_description,
        employee_team: ra.employees?.team?.team_name,
        employee_mobile: ra.employees?.mobile_number,
        date_value: ra.date?.actual_date,
        roster_code: ra.roster?.roster_code
      };
      
      result.push(assignment);
    }
  }
  
  return result;
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
    
    // Transform to a flatter structure with manual type handling
    const result: AircraftBasic[] = [];
    
    if (data && Array.isArray(data)) {
      for (const ac of data) {
        const aircraft: AircraftBasic = {
          id: ac.id,
          aircraft_name: ac.aircraft_name,
          registration: ac.registration,
          type_name: ac.aircraft_types?.type_name,
          manufacturer: ac.aircraft_types?.manufacturer,
          customer: ac.customer,
          total_hours: ac.total_hours,
          total_cycles: ac.total_cycles
        };
        
        result.push(aircraft);
      }
    }
    
    return result;
  } catch (error: any) {
    console.error("Error fetching aircraft:", error);
    return [];
  }
};

export const fetchMaintenanceVisits = async (currentDate: string): Promise<MaintenanceVisitBasic[]> => {
  try {
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
    
    // Create a Set of maintenance visit IDs that have personnel requirements
    const visitsWithPersonnel = new Set<number>();
    if (personnelData && Array.isArray(personnelData)) {
      for (const p of personnelData) {
        if (p.maintenance_visit_id) {
          visitsWithPersonnel.add(p.maintenance_visit_id);
        }
      }
    }
    
    console.log('Maintenance visits fetched for today:', data?.length);
    
    // Transform to a flatter structure with manual type handling
    const result: MaintenanceVisitBasic[] = [];
    
    if (data && Array.isArray(data)) {
      for (const mv of data) {
        const visit: MaintenanceVisitBasic = {
          id: mv.id,
          aircraft_id: mv.aircraft_id,
          aircraft_name: mv.aircraft?.aircraft_name,
          aircraft_registration: mv.aircraft?.registration,
          aircraft_type: mv.aircraft?.aircraft_types?.type_name,
          visit_number: mv.visit_number,
          check_type: mv.check_type,
          status: mv.status,
          date_in: mv.date_in,
          date_out: mv.date_out,
          remarks: mv.remarks,
          hangar_id: mv.hangar_id,
          hangar_name: mv.hangar?.hangar_name,
          total_hours: mv.total_hours,
          has_personnel_requirements: visitsWithPersonnel.has(mv.id)
        };
        
        result.push(visit);
      }
    }
    
    return result;
  } catch (error: any) {
    console.error("Error fetching maintenance visits:", error);
    return [];
  }
};
