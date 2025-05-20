
import { 
  EmployeeBasic, 
  SimpleRosterAssignment, 
  MaintenanceVisitBasic, 
  AircraftBasic,
  DetailDataType,
  isEmployeeData,
  isRosterAssignment,
  isAircraftData,
  isMaintenanceVisit
} from "./types";

// Derive available employees (no support assignments, leave, or training)
export const processAvailableEmployees = (
  totalEmployees: EmployeeBasic[] | undefined,
  employeeSupports: { employee_id: number }[] | undefined,
  rosterAssignments: SimpleRosterAssignment[] | undefined
): EmployeeBasic[] => {
  if (!totalEmployees || !employeeSupports || !rosterAssignments) return [];
  
  // Get IDs of employees with support assignments for today
  const supportEmployeeIds = new Set(employeeSupports.map(es => es.employee_id));
  
  // Get IDs of employees on leave or training from roster
  const leaveEmployeeIds = new Set<number>();
  const trainingEmployeeIds = new Set<number>();
  
  rosterAssignments.forEach(ra => {
    // Check roster code: 2 for Annual Leave, 7 for Sick Leave, 9 for Training
    if (ra.roster_id === 2 || ra.roster_id === 7) {
      leaveEmployeeIds.add(ra.employee_id);
    } else if (ra.roster_id === 9) {
      trainingEmployeeIds.add(ra.employee_id);
    }
  });
  
  // Filter out employees who have support, are on leave or in training
  return totalEmployees.filter(emp => 
    !supportEmployeeIds.has(emp.id) && 
    !leaveEmployeeIds.has(emp.id) &&
    !trainingEmployeeIds.has(emp.id)
  );
};

// Extract employees on leave from roster assignments
export const processLeaveEmployees = (
  rosterAssignments: SimpleRosterAssignment[] | undefined
): SimpleRosterAssignment[] => {
  if (!rosterAssignments) return [];
  
  // Filter roster assignments for leave codes (2 for Annual Leave, 7 for Sick Leave)
  return rosterAssignments.filter(ra => 
    ra.roster_id === 2 || ra.roster_id === 7
  );
};

// Extract employees in training from roster assignments
export const processTrainingEmployees = (
  rosterAssignments: SimpleRosterAssignment[] | undefined
): SimpleRosterAssignment[] => {
  if (!rosterAssignments) return [];
  
  // Filter roster assignments for training code (9)
  return rosterAssignments.filter(ra => ra.roster_id === 9);
};

// Calculate aircraft metrics
export const processAircraftMetrics = (
  aircraft: AircraftBasic[] | undefined,
  maintenanceVisits: MaintenanceVisitBasic[] | undefined
) => {
  if (!aircraft || !maintenanceVisits) {
    return {
      total: 0,
      inMaintenance: 0,
      scheduled: 0,
      withTeams: 0,
      available: 0
    };
  }
  
  // Aircraft currently in maintenance
  const inMaintenance = maintenanceVisits.filter(v => v.status === 'In Progress').length;
  
  // Aircraft scheduled for maintenance today but not started
  const scheduled = maintenanceVisits.filter(v => v.status === 'Scheduled').length;
  
  // Aircraft with assigned teams (use actual maintenance visits with personnel requirements)
  const withTeams = maintenanceVisits.filter(visit => 
    visit.status === 'In Progress' && visit.has_personnel_requirements
  ).length;
  
  return {
    total: aircraft.length,
    inMaintenance,
    scheduled,
    withTeams,
    available: aircraft.length - inMaintenance
  };
};

// Filter and sort data based on search term, filters, and sort options
export const filterAndSortData = (
  data: DetailDataType[],
  searchTerm: string,
  filters: Record<string, string>,
  sortField: string,
  sortDirection: "asc" | "desc"
): DetailDataType[] => {
  if (!data || data.length === 0) return [];
  
  let filteredData: DetailDataType[] = [...data];
  
  // Apply search term if exists
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    
    filteredData = filteredData.filter(item => {
      // Search based on item type
      if (isEmployeeData(item)) {
        return (
          (item?.name && item.name.toLowerCase().includes(term)) ||
          (item?.e_number && `e${item.e_number}`.toLowerCase().includes(term)) ||
          (item?.job_title_description && item.job_title_description.toLowerCase().includes(term)) ||
          (item?.team_name && item.team_name.toLowerCase().includes(term))
        );
      } 
      else if (isRosterAssignment(item)) {
        return (
          (item?.employee_name && item.employee_name.toLowerCase().includes(term)) ||
          (item?.employee_number && `e${item.employee_number}`.toLowerCase().includes(term)) ||
          (item?.employee_position && item.employee_position.toLowerCase().includes(term)) ||
          (item?.employee_team && item.employee_team.toLowerCase().includes(term))
        );
      }
      else if (isAircraftData(item)) {
        return (
          (item?.aircraft_name && item.aircraft_name.toLowerCase().includes(term)) ||
          (item?.registration && item.registration.toLowerCase().includes(term)) ||
          (item?.type_name && item.type_name.toLowerCase().includes(term))
        );
      }
      else if (isMaintenanceVisit(item)) {
        return (
          (item.aircraft_name && item.aircraft_name.toLowerCase().includes(term)) ||
          (item.aircraft_registration && item.aircraft_registration.toLowerCase().includes(term)) ||
          (item.check_type && item.check_type.toLowerCase().includes(term))
        );
      }
      
      // Default case for any other data type
      return false;
    });
  }
  
  // Apply field-specific filters
  if (Object.keys(filters).length > 0) {
    filteredData = filteredData.filter(item => {
      return Object.entries(filters).every(([field, value]) => {
        if (!value) return true;
        
        // Filter based on item type
        if (isEmployeeData(item)) {
          switch (field) {
            case 'name':
              return item?.name && item.name.toLowerCase().includes(value.toLowerCase());
            case 'position':
              return item?.job_title_description && 
                item.job_title_description.toLowerCase().includes(value.toLowerCase());
            case 'team':
              return item?.team_name && 
                item.team_name.toLowerCase().includes(value.toLowerCase());
            default:
              return true;
          }
        } 
        else if (isRosterAssignment(item)) {
          switch (field) {
            case 'name':
              return item?.employee_name && item.employee_name.toLowerCase().includes(value.toLowerCase());
            case 'position':
              return item?.employee_position && 
                item.employee_position.toLowerCase().includes(value.toLowerCase());
            case 'team':
              return item?.employee_team && 
                item.employee_team.toLowerCase().includes(value.toLowerCase());
            default:
              return true;
          }
        }
        else if (isAircraftData(item)) {
          switch (field) {
            case 'aircraft':
              return item?.aircraft_name && 
                item.aircraft_name.toLowerCase().includes(value.toLowerCase());
            case 'registration':
              return item?.registration && 
                item.registration.toLowerCase().includes(value.toLowerCase());
            case 'type':
              return item?.type_name && 
                item.type_name.toLowerCase().includes(value.toLowerCase());
            default:
              return true;
          }
        }
        else if (isMaintenanceVisit(item)) {
          switch (field) {
            case 'aircraft':
              return item.aircraft_name && 
                item.aircraft_name.toLowerCase().includes(value.toLowerCase());
            case 'registration':
              return item.aircraft_registration && 
                item.aircraft_registration.toLowerCase().includes(value.toLowerCase());
            case 'checkType':
              return item.check_type && 
                item.check_type.toLowerCase().includes(value.toLowerCase());
            case 'status':
              return item.status && 
                item.status.toLowerCase().includes(value.toLowerCase());
            case 'hangar':
              return item.hangar_name && 
                item.hangar_name.toLowerCase().includes(value.toLowerCase());
            default:
              return true;
          }
        }
        
        return true;
      });
    });
  }
  
  // Apply sorting if field is specified
  if (sortField) {
    filteredData.sort((a, b) => {
      let valueA: any = null;
      let valueB: any = null;

      // Handle different data types appropriately
      if (isEmployeeData(a) && isEmployeeData(b)) {
        valueA = a[sortField as keyof EmployeeBasic];
        valueB = b[sortField as keyof EmployeeBasic];
      }
      else if (isRosterAssignment(a) && isRosterAssignment(b)) {
        valueA = a[sortField as keyof SimpleRosterAssignment];
        valueB = b[sortField as keyof SimpleRosterAssignment];
      }
      else if (isAircraftData(a) && isAircraftData(b)) {
        valueA = a[sortField as keyof AircraftBasic];
        valueB = b[sortField as keyof AircraftBasic];
      }
      else if (isMaintenanceVisit(a) && isMaintenanceVisit(b)) {
        valueA = a[sortField as keyof MaintenanceVisitBasic];
        valueB = b[sortField as keyof MaintenanceVisitBasic];
      }
      
      // Handle string comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      // Handle number comparison
      if (valueA === valueB) return 0;
      
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }
  
  return filteredData;
};
