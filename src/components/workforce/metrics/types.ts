
// Basic entity types with minimal properties needed for the metrics system
export interface EmployeeBasic {
  id: number;
  name: string;
  e_number: number;
  is_active: boolean;
  mobile_number?: string;
  date_of_joining?: string;
  job_title_description?: string;
  team_name?: string;
  certification_count?: number;
  authorization_count?: number;
}

export interface SimpleRosterAssignment {
  id: number;
  employee_id: number;
  date_id: number;
  roster_id: number;
  employee_name?: string;
  employee_number?: number;
  employee_position?: string;
  employee_team?: string;
  employee_mobile?: string;
  date_value?: string;
  roster_code?: string;
}

export interface AircraftBasic {
  id: number;
  aircraft_name?: string;
  registration?: string;
  type_name?: string;
  manufacturer?: string;
  customer?: string;
  total_hours?: number;
  total_cycles?: number;
}

export interface MaintenanceVisitBasic {
  id: number;
  aircraft_id: number;
  aircraft_name?: string;
  aircraft_registration?: string;
  aircraft_type?: string;
  visit_number: string;
  check_type: string;
  status?: string;
  date_in: string;
  date_out: string;
  remarks?: string;
  hangar_id?: number;
  hangar_name?: string;
  total_hours?: number;
  has_personnel_requirements?: boolean;
}

export interface EmployeeSupportBasic {
  id: number;
  employee_id: number;
  support_id: number;
}

export type MetricType = 
  | 'total-employees' 
  | 'available' 
  | 'leave' 
  | 'training' 
  | 'grounded' 
  | 'assigned' 
  | 'pending' 
  | 'productivity';

export interface MetricInfo {
  id: MetricType;
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  percentage?: string;
}

// Unified type for detail data
export type DetailDataType = 
  | EmployeeBasic 
  | SimpleRosterAssignment 
  | MaintenanceVisitBasic 
  | AircraftBasic;

// Type guards
export const isEmployeeData = (item: DetailDataType): item is EmployeeBasic => 
  'job_title_description' in item && 'e_number' in item;

export const isRosterAssignment = (item: DetailDataType): item is SimpleRosterAssignment => 
  'employee_name' in item && 'roster_id' in item;

export const isAircraftData = (item: DetailDataType): item is AircraftBasic => 
  'registration' in item && 'type_name' in item && !('check_type' in item);

export const isMaintenanceVisit = (item: DetailDataType): item is MaintenanceVisitBasic => 
  'aircraft_registration' in item && 'check_type' in item;
