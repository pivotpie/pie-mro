import { supabase } from '@/integrations/supabase/client';
import {
  ExtractedEntity,
  ActionResult,
  MaintenanceVisitEntity,
  EmployeeScheduleEntity,
  CertificateEntity
} from '@/types/documentUpload';

/**
 * Execute create action for maintenance visit
 */
async function createMaintenanceVisit(entity: MaintenanceVisitEntity): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from('maintenance_visits')
      .insert({
        aircraft_id: entity.aircraft_id,
        visit_number: entity.visit_number,
        check_type: entity.check_type,
        date_in: entity.date_in,
        date_out: entity.date_out,
        status: entity.status || 'Scheduled',
        hangar_id: entity.hangar_id,
        total_hours: entity.total_hours,
        remarks: entity.remarks
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      success: true,
      entityId: '',
      action: 'create',
      recordId: data.id,
      message: `Maintenance visit ${entity.visit_number} created successfully`
    };
  } catch (error: any) {
    return {
      success: false,
      entityId: '',
      action: 'create',
      error: error.message,
      message: `Failed to create maintenance visit: ${error.message}`
    };
  }
}

/**
 * Execute create or update action for employee schedule
 */
async function createOrUpdateEmployeeSchedule(
  entity: EmployeeScheduleEntity,
  action: 'create' | 'update'
): Promise<ActionResult> {
  try {
    if (action === 'update') {
      // First, delete existing assignment for this date
      await supabase
        .from('employee_supports')
        .delete()
        .eq('employee_id', entity.employee_id)
        .eq('assignment_date', entity.assignment_date);
    }

    // Then create new assignment
    const { data, error } = await supabase
      .from('employee_supports')
      .insert({
        employee_id: entity.employee_id,
        support_id: entity.support_id,
        assignment_date: entity.assignment_date,
        maintenance_visit_id: entity.maintenance_visit_id,
        notes: entity.assignment_notes
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      success: true,
      entityId: '',
      action,
      recordId: data.id,
      message: `Employee schedule ${action === 'update' ? 'updated' : 'created'} for ${entity.employee_name} on ${entity.assignment_date}`
    };
  } catch (error: any) {
    return {
      success: false,
      entityId: '',
      action,
      error: error.message,
      message: `Failed to ${action} employee schedule: ${error.message}`
    };
  }
}

/**
 * Execute create or update action for certificate
 */
async function createOrUpdateCertificate(
  entity: CertificateEntity,
  action: 'create' | 'update',
  existingRecordId?: number
): Promise<ActionResult> {
  try {
    if (action === 'update' && existingRecordId) {
      // Update existing authorization
      const { data, error } = await supabase
        .from('employee_authorizations')
        .update({
          certificate_number: entity.certificate_number,
          expiry_date: entity.expiry_date,
          issued_on: entity.issued_on,
          remarks: entity.remarks
        })
        .eq('id', existingRecordId)
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        entityId: '',
        action: 'update',
        recordId: data.id,
        message: `Certificate updated for ${entity.employee_name}`
      };
    } else {
      // Create new authorization
      const { data, error } = await supabase
        .from('employee_authorizations')
        .insert({
          employee_id: entity.employee_id,
          authorization_type_id: entity.authorization_type_id,
          aircraft_model_id: entity.aircraft_model_id,
          certificate_number: entity.certificate_number,
          authorization_basis: entity.authorization_basis,
          issued_on: entity.issued_on,
          expiry_date: entity.expiry_date,
          pages: entity.pages,
          remarks: entity.remarks,
          is_active: true
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        entityId: '',
        action: 'create',
        recordId: data.id,
        message: `Certificate created for ${entity.employee_name}`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      entityId: '',
      action,
      error: error.message,
      message: `Failed to ${action} certificate: ${error.message}`
    };
  }
}

/**
 * Execute action for a single entity
 */
export async function executeEntityAction(entity: ExtractedEntity): Promise<ActionResult> {
  const result: ActionResult = {
    success: false,
    entityId: entity.id,
    action: entity.suggestedAction,
    message: ''
  };

  if (entity.suggestedAction === 'skip') {
    return {
      ...result,
      success: true,
      message: 'Skipped as requested'
    };
  }

  try {
    switch (entity.type) {
      case 'maintenance_visit':
        return {
          ...(await createMaintenanceVisit(entity.fields as MaintenanceVisitEntity)),
          entityId: entity.id
        };

      case 'employee_schedule':
        return {
          ...(await createOrUpdateEmployeeSchedule(
            entity.fields as EmployeeScheduleEntity,
            entity.suggestedAction
          )),
          entityId: entity.id
        };

      case 'certificate':
        const existingRecordId = entity.conflicts.find(c => c.type === 'duplicate')?.existingRecord?.id;
        return {
          ...(await createOrUpdateCertificate(
            entity.fields as CertificateEntity,
            entity.suggestedAction,
            existingRecordId
          )),
          entityId: entity.id
        };

      default:
        return {
          ...result,
          error: 'Unknown entity type',
          message: `Cannot execute action for unknown entity type: ${entity.type}`
        };
    }
  } catch (error: any) {
    return {
      ...result,
      error: error.message,
      message: `Execution failed: ${error.message}`
    };
  }
}

/**
 * Execute actions for multiple entities (bulk operation)
 */
export async function executeBulkActions(entities: ExtractedEntity[]): Promise<{
  results: ActionResult[];
  successCount: number;
  errorCount: number;
  skippedCount: number;
}> {
  const results: ActionResult[] = [];
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const entity of entities) {
    if (entity.status === 'error' || entity.suggestedAction === 'skip') {
      skippedCount++;
      results.push({
        success: true,
        entityId: entity.id,
        action: 'skip',
        message: 'Skipped due to validation errors or user choice'
      });
      continue;
    }

    const result = await executeEntityAction(entity);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  return {
    results,
    successCount,
    errorCount,
    skippedCount
  };
}
