// Document Upload Types and Interfaces

export type DocumentType = 'maintenance_visit' | 'employee_schedule' | 'certificate' | 'aircraft' | 'unknown';
export type FileType = 'csv' | 'image' | 'pdf';
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'extracted' | 'error';
export type ActionType = 'create' | 'update' | 'skip';
export type ConflictSeverity = 'error' | 'warning' | 'info';

export interface UploadedDocument {
  id: string;
  file: File;
  fileType: FileType;
  status: UploadStatus;
  uploadProgress: number;
  extractedData?: ExtractedData;
  error?: string;
}

export interface ExtractedData {
  documentType: DocumentType;
  entities: ExtractedEntity[];
  confidence: number;
  warnings: string[];
  totalCount: number;
  validCount: number;
  errorCount: number;
}

export interface ExtractedEntity {
  id: string;
  type: DocumentType;
  fields: Record<string, any>;
  validation: ValidationResult;
  suggestedAction: ActionType;
  conflicts: ConflictCheck[];
  status: 'valid' | 'warning' | 'error' | 'skipped';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: ConflictSeverity;
}

export interface ConflictCheck {
  type: 'duplicate' | 'overlap' | 'invalid_reference' | 'missing_data';
  severity: ConflictSeverity;
  message: string;
  resolution?: string;
  existingRecord?: any;
}

export interface DocumentAction {
  entityId: string;
  type: ActionType;
  table: string;
  data: any;
  validation: ValidationResult;
}

export interface ActionResult {
  success: boolean;
  entityId: string;
  action: ActionType;
  recordId?: string | number;
  error?: string;
  message: string;
}

// Specific entity types for better type safety

export interface MaintenanceVisitEntity {
  aircraft_registration: string;
  aircraft_id?: number;
  visit_number: string;
  check_type: string;
  date_in: string;
  date_out: string;
  status: string;
  hangar?: string;
  hangar_id?: number;
  total_hours?: number;
  remarks?: string;
}

export interface EmployeeScheduleEntity {
  employee_id: number;
  employee_number?: string;
  employee_name?: string;
  assignment_date: string;
  support_code: string;
  support_id?: number;
  assignment_notes?: string;
  visit_number?: string;
  maintenance_visit_id?: number;
}

export interface CertificateEntity {
  employee_id: number;
  employee_number?: string;
  employee_name?: string;
  authorization_type_id: number;
  authorization_type?: string;
  aircraft_model_id: number;
  aircraft_model?: string;
  certificate_number: string;
  authorization_basis: string;
  issued_on?: string;
  expiry_date: string;
  issuing_authority?: string;
  certificate_type?: string;
  pages?: number;
  remarks?: string;
}

export interface AircraftEntity {
  registration: string;
  aircraft_code: string;
  aircraft_name: string;
  aircraft_type_id?: number;
  aircraft_model_id?: number;
  serial_number?: string;
  customer?: string;
}
