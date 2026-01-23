import { supabase } from '@/integrations/supabase/client';
import {
  ExtractedEntity,
  ValidationResult,
  ConflictCheck,
  MaintenanceVisitEntity,
  EmployeeScheduleEntity,
  CertificateEntity,
  AircraftEntity,
  ActionType
} from '@/types/documentUpload';

/**
 * Validate and enrich maintenance visit entity
 */
export async function validateMaintenanceVisit(entity: MaintenanceVisitEntity): Promise<{
  entity: MaintenanceVisitEntity;
  validation: ValidationResult;
  conflicts: ConflictCheck[];
  suggestedAction: ActionType;
}> {
  const errors: any[] = [];
  const warnings: string[] = [];
  const conflicts: ConflictCheck[] = [];

  try {
    // Validate required fields
    if (!entity.aircraft_registration) {
      errors.push({ field: 'aircraft_registration', message: 'Aircraft registration is required', severity: 'error' });
    }
    if (!entity.visit_number) {
      errors.push({ field: 'visit_number', message: 'Visit number is required', severity: 'error' });
    }
    if (!entity.check_type) {
      errors.push({ field: 'check_type', message: 'Check type is required', severity: 'error' });
    }
    if (!entity.date_in) {
      errors.push({ field: 'date_in', message: 'Date in is required', severity: 'error' });
    }
    if (!entity.date_out) {
      errors.push({ field: 'date_out', message: 'Date out is required', severity: 'error' });
    }

    // Find aircraft by registration
    if (entity.aircraft_registration) {
      const { data: aircraft } = await supabase
        .from('aircraft')
        .select('id, aircraft_name, aircraft_code')
        .ilike('registration', entity.aircraft_registration)
        .maybeSingle();

      if (aircraft) {
        entity.aircraft_id = aircraft.id;
      } else {
        errors.push({
          field: 'aircraft_registration',
          message: `Aircraft with registration '${entity.aircraft_registration}' not found in system`,
          severity: 'error'
        });
      }
    }

    // Find hangar by name (if provided)
    if (entity.hangar) {
      const { data: hangar } = await supabase
        .from('hangars')
        .select('id')
        .ilike('hangar_name', entity.hangar)
        .maybeSingle();

      if (hangar) {
        entity.hangar_id = hangar.id;
      } else {
        warnings.push(`Hangar '${entity.hangar}' not found, will use default`);
      }
    }

    // Check for duplicate visit number
    if (entity.visit_number) {
      const { data: existingVisit, error: visitError } = await supabase
        .from('maintenance_visits')
        .select('id, visit_number, status')
        .eq('visit_number', entity.visit_number)
        .maybeSingle();

      if (visitError) {
        console.warn('Error checking for duplicate visit:', visitError);
      }

      if (existingVisit) {
        conflicts.push({
          type: 'duplicate',
          severity: 'error',
          message: `Visit number '${entity.visit_number}' already exists`,
          resolution: 'Use a different visit number or update existing visit',
          existingRecord: existingVisit
        });
      }
    }

    // Check hangar capacity/availability during the visit period
    if (entity.hangar_id && entity.date_in && entity.date_out) {
      const { data: hangarVisits } = await supabase
        .from('maintenance_visits')
        .select('id, visit_number, aircraft_id, date_in, date_out, status')
        .eq('hangar_id', entity.hangar_id)
        .or(`and(date_in.lte.${entity.date_out},date_out.gte.${entity.date_in})`);

      if (hangarVisits && hangarVisits.length > 0) {
        // Get hangar capacity
        const { data: hangar } = await supabase
          .from('hangars')
          .select('capacity, hangar_name')
          .eq('id', entity.hangar_id)
          .maybeSingle();

        const capacity = hangar?.capacity || 1;
        const currentOccupancy = hangarVisits.length;
        const hangarName = hangar?.hangar_name || entity.hangar || 'Unknown';

        if (currentOccupancy >= capacity) {
          conflicts.push({
            type: 'overlap',
            severity: 'error',
            message: `${hangarName} is at/over capacity (${currentOccupancy}/${capacity}) during ${entity.date_in} to ${entity.date_out}`,
            resolution: 'Choose different hangar, adjust dates, or increase hangar capacity',
            existingRecord: {
              hangarVisits: hangarVisits.map(v => ({ visit_number: v.visit_number, dates: `${v.date_in} to ${v.date_out}` })),
              capacity
            }
          });
        } else if (currentOccupancy > 0) {
          // Show info about hangar utilization even if not at capacity
          warnings.push(`${hangarName} will have ${currentOccupancy + 1}/${capacity} aircraft during this period`);
        }
      }
    }

    // Validate date logic
    if (entity.date_in && entity.date_out) {
      const dateIn = new Date(entity.date_in);
      const dateOut = new Date(entity.date_out);

      if (dateOut <= dateIn) {
        errors.push({
          field: 'date_out',
          message: 'Date out must be after date in',
          severity: 'error'
        });
      }
    }

    const suggestedAction: ActionType = conflicts.some(c => c.type === 'duplicate') ? 'skip' : 'create';

    return {
      entity,
      validation: {
        isValid: errors.length === 0 && !conflicts.some(c => c.severity === 'error'),
        errors,
        warnings
      },
      conflicts,
      suggestedAction
    };
  } catch (error: any) {
    console.error('Validation error:', error);
    return {
      entity,
      validation: {
        isValid: false,
        errors: [{ field: 'general', message: `Validation failed: ${error.message}`, severity: 'error' }],
        warnings
      },
      conflicts,
      suggestedAction: 'skip'
    };
  }
}

/**
 * Validate and enrich employee schedule entity
 */
export async function validateEmployeeSchedule(entity: EmployeeScheduleEntity): Promise<{
  entity: EmployeeScheduleEntity;
  validation: ValidationResult;
  conflicts: ConflictCheck[];
  suggestedAction: ActionType;
}> {
  const errors: any[] = [];
  const warnings: string[] = [];
  const conflicts: ConflictCheck[] = [];

  try {
    // Validate required fields
    if (!entity.employee_number && !entity.employee_name && !entity.employee_id) {
      errors.push({ field: 'employee', message: 'Employee identifier is required', severity: 'error' });
    }
    if (!entity.assignment_date) {
      errors.push({ field: 'assignment_date', message: 'Assignment date is required', severity: 'error' });
    }
    if (!entity.support_code) {
      errors.push({ field: 'support_code', message: 'Support code is required', severity: 'error' });
    }

    // Find employee
    if (entity.employee_number) {
      // Strip "E-" prefix if present (database stores without prefix)
      const cleanEmployeeNumber = entity.employee_number.toString().replace(/^E-/i, '');

      const { data: employee } = await supabase
        .from('employees')
        .select('id, name, e_number')
        .eq('e_number', parseInt(cleanEmployeeNumber, 10))
        .maybeSingle();

      if (employee) {
        entity.employee_id = employee.id;
        entity.employee_name = employee.name;
      } else {
        errors.push({
          field: 'employee_number',
          message: `Employee '${entity.employee_number}' not found in system`,
          severity: 'error'
        });
      }
    } else if (entity.employee_name) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id, name, e_number')
        .ilike('name', `%${entity.employee_name}%`)
        .maybeSingle();

      if (employee) {
        entity.employee_id = employee.id;
        entity.employee_number = String(employee.e_number);
      } else {
        errors.push({
          field: 'employee_name',
          message: `Employee '${entity.employee_name}' not found in system`,
          severity: 'error'
        });
      }
    }

    // Find support code
    if (entity.support_code) {
      const { data: supportCode } = await supabase
        .from('support_codes')
        .select('id, support_code')
        .ilike('support_code', entity.support_code)
        .maybeSingle();

      if (supportCode) {
        entity.support_id = supportCode.id;
      } else {
        errors.push({
          field: 'support_code',
          message: `Support code '${entity.support_code}' not found in system`,
          severity: 'error'
        });
      }
    }

    // Find maintenance visit if referenced
    if (entity.visit_number) {
      const { data: visit } = await supabase
        .from('maintenance_visits')
        .select('id')
        .eq('visit_number', entity.visit_number)
        .maybeSingle();

      if (visit) {
        entity.maintenance_visit_id = visit.id;
      } else {
        warnings.push(`Visit number '${entity.visit_number}' not found, assignment will be general`);
      }
    }

    // Check for existing assignment on same date
    if (entity.employee_id && entity.assignment_date) {
      const { data: existingAssignment, error: assignmentError } = await supabase
        .from('employee_supports')
        .select('id, support_id')
        .eq('employee_id', entity.employee_id)
        .eq('assignment_date', entity.assignment_date)
        .maybeSingle();

      if (assignmentError) {
        console.warn('Error checking for existing assignment:', assignmentError);
      }

      if (existingAssignment) {
        conflicts.push({
          type: 'duplicate',
          severity: 'warning',
          message: `Employee already has assignment on ${entity.assignment_date}`,
          resolution: 'Will overwrite existing assignment',
          existingRecord: existingAssignment
        });
      }
    }

    const suggestedAction: ActionType = conflicts.some(c => c.type === 'duplicate') ? 'update' : 'create';

    return {
      entity,
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings
      },
      conflicts,
      suggestedAction
    };
  } catch (error: any) {
    console.error('Validation error:', error);
    return {
      entity,
      validation: {
        isValid: false,
        errors: [{ field: 'general', message: `Validation failed: ${error.message}`, severity: 'error' }],
        warnings
      },
      conflicts,
      suggestedAction: 'skip'
    };
  }
}

/**
 * Validate and enrich certificate entity
 */
export async function validateCertificate(entity: CertificateEntity): Promise<{
  entity: CertificateEntity;
  validation: ValidationResult;
  conflicts: ConflictCheck[];
  suggestedAction: ActionType;
}> {
  const errors: any[] = [];
  const warnings: string[] = [];
  const conflicts: ConflictCheck[] = [];

  try {
    // Validate required fields
    if (!entity.employee_number && !entity.employee_name && !entity.employee_id) {
      errors.push({ field: 'employee', message: 'Employee identifier is required', severity: 'error' });
    }
    if (!entity.certificate_number) {
      errors.push({ field: 'certificate_number', message: 'Certificate number is required', severity: 'error' });
    }
    if (!entity.authorization_type) {
      errors.push({ field: 'authorization_type', message: 'Authorization type is required', severity: 'error' });
    }
    if (!entity.expiry_date) {
      errors.push({ field: 'expiry_date', message: 'Expiry date is required', severity: 'error' });
    }

    // Find employee
    if (entity.employee_number) {
      // Strip "E-" prefix if present (database stores without prefix)
      const cleanEmployeeNumber = entity.employee_number.toString().replace(/^E-/i, '');

      const { data: employee } = await supabase
        .from('employees')
        .select('id, name, e_number')
        .eq('e_number', parseInt(cleanEmployeeNumber, 10))
        .maybeSingle();

      if (employee) {
        entity.employee_id = employee.id;
        entity.employee_name = employee.name;
      } else {
        errors.push({
          field: 'employee_number',
          message: `Employee '${entity.employee_number}' not found`,
          severity: 'error'
        });
      }
    } else if (entity.employee_name) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id, name, e_number')
        .ilike('name', `%${entity.employee_name}%`)
        .limit(1)
        .maybeSingle();

      if (employee) {
        entity.employee_id = employee.id;
        entity.employee_number = String(employee.e_number);
      } else {
        errors.push({
          field: 'employee_name',
          message: `Employee '${entity.employee_name}' not found`,
          severity: 'error'
        });
      }
    }

    // Find or suggest authorization type
    if (entity.authorization_type) {
      const { data: authTypes } = await supabase
        .from('authorization_types')
        .select('id, name')
        .ilike('name', `%${entity.authorization_type}%`)
        .limit(1);

      if (authTypes && authTypes.length > 0) {
        entity.authorization_type_id = authTypes[0].id;
      } else {
        warnings.push(`Authorization type '${entity.authorization_type}' not found, may need to be created`);
      }
    }

    // Find aircraft model
    if (entity.aircraft_model) {
      const { data: models } = await supabase
        .from('aircraft_models')
        .select('id, model_name')
        .ilike('model_name', `%${entity.aircraft_model}%`)
        .limit(1);

      if (models && models.length > 0) {
        entity.aircraft_model_id = models[0].id;
      } else {
        warnings.push(`Aircraft model '${entity.aircraft_model}' not found, may need to be created`);
      }
    }

    // Check for existing certificate
    if (entity.employee_id && entity.authorization_type_id && entity.aircraft_model_id) {
      const { data: existingAuth } = await supabase
        .from('employee_authorizations')
        .select('id, certificate_number, expiry_date, is_active')
        .eq('employee_id', entity.employee_id)
        .eq('authorization_type_id', entity.authorization_type_id)
        .eq('aircraft_model_id', entity.aircraft_model_id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingAuth) {
        const existingExpiry = new Date(existingAuth.expiry_date);
        const newExpiry = new Date(entity.expiry_date);

        if (newExpiry > existingExpiry) {
          conflicts.push({
            type: 'duplicate',
            severity: 'warning',
            message: `Employee has existing authorization (expires ${existingAuth.expiry_date})`,
            resolution: 'Update existing authorization with new certificate',
            existingRecord: existingAuth
          });
        } else {
          conflicts.push({
            type: 'duplicate',
            severity: 'info',
            message: 'New certificate expires before existing one',
            resolution: 'Consider if this is a renewal or different certificate'
          });
        }
      }
    }

    // Check if certificate is already expired
    if (entity.expiry_date) {
      const expiryDate = new Date(entity.expiry_date);
      const today = new Date();

      if (expiryDate < today) {
        warnings.push('Certificate is already expired');
      }
    }

    const suggestedAction: ActionType = conflicts.some(c => c.type === 'duplicate' && c.severity === 'warning')
      ? 'update'
      : 'create';

    return {
      entity,
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings
      },
      conflicts,
      suggestedAction
    };
  } catch (error: any) {
    console.error('Validation error:', error);
    return {
      entity,
      validation: {
        isValid: false,
        errors: [{ field: 'general', message: `Validation failed: ${error.message}`, severity: 'error' }],
        warnings
      },
      conflicts,
      suggestedAction: 'skip'
    };
  }
}

/**
 * Main validation router
 */
export async function validateEntity(type: string, entityData: any): Promise<ExtractedEntity> {
  const entityId = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  let result;

  switch (type) {
    case 'maintenance_visit':
      result = await validateMaintenanceVisit(entityData as MaintenanceVisitEntity);
      break;
    case 'employee_schedule':
      result = await validateEmployeeSchedule(entityData as EmployeeScheduleEntity);
      break;
    case 'certificate':
      result = await validateCertificate(entityData as CertificateEntity);
      break;
    default:
      return {
        id: entityId,
        type: 'unknown' as any,
        fields: entityData,
        validation: {
          isValid: false,
          errors: [{ field: 'type', message: 'Unknown document type', severity: 'error' }],
          warnings: []
        },
        suggestedAction: 'skip',
        conflicts: [],
        status: 'error'
      };
  }

  const status = !result.validation.isValid
    ? 'error'
    : result.conflicts.some(c => c.severity === 'error')
    ? 'error'
    : result.conflicts.some(c => c.severity === 'warning')
    ? 'warning'
    : 'valid';

  return {
    id: entityId,
    type: type as any,
    fields: result.entity,
    validation: result.validation,
    suggestedAction: result.suggestedAction,
    conflicts: result.conflicts,
    status
  };
}
