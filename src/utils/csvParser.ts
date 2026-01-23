import Papa from 'papaparse';
import { DocumentType, ExtractedEntity } from '@/types/documentUpload';
import { openai, GPT_CONFIG } from '@/integrations/openai/client';

interface ParsedCSV {
  headers: string[];
  rows: any[];
  rowCount: number;
}

/**
 * Parse CSV file to extract headers and rows
 */
export async function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          rows: results.data,
          rowCount: results.data.length
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

/**
 * Use AI to determine document type from CSV headers
 */
export async function detectDocumentType(headers: string[], sampleRows: any[]): Promise<DocumentType> {
  try {
    console.log('Detecting document type from headers:', headers);
    console.log('Sample rows:', sampleRows.slice(0, 2));

    const prompt = `
Analyze these CSV headers and sample data to determine the document type.

CSV Headers: ${headers.join(', ')}

Sample Row 1: ${JSON.stringify(sampleRows[0] || {})}
Sample Row 2: ${JSON.stringify(sampleRows[1] || {})}

Document types:
- "maintenance_visit": Contains aircraft registration, visit numbers, check types, dates in/out, status, hangar
- "employee_schedule": Contains employee IDs/names, dates, support codes (AV, L, TR, MV), assignments
- "certificate": Contains employee info, certificate numbers, authorization types, expiry dates
- "aircraft": Contains registration, aircraft codes, models, serial numbers

Return ONLY the document type as one word: maintenance_visit, employee_schedule, certificate, aircraft, or unknown
`;

    const completion = await openai.chat.completions.create({
      model: GPT_CONFIG.model,
      max_completion_tokens: 100,
      messages: [
        { role: 'system', content: 'You are a data classification assistant. Return only the document type.' },
        { role: 'user', content: prompt }
      ]
    });

    const response = completion.choices[0]?.message?.content?.trim().toLowerCase() || 'unknown';
    console.log('AI detected document type:', response);

    if (['maintenance_visit', 'employee_schedule', 'certificate', 'aircraft'].includes(response)) {
      return response as DocumentType;
    }

    console.warn('Document type not recognized:', response, '- Falling back to keyword matching');

    // Fallback: Simple keyword matching
    return detectDocumentTypeByKeywords(headers);
  } catch (error) {
    console.error('Error detecting document type:', error, '- Falling back to keyword matching');

    // Fallback: Simple keyword matching
    return detectDocumentTypeByKeywords(headers);
  }
}

/**
 * Fallback: Detect document type using simple keyword matching
 */
function detectDocumentTypeByKeywords(headers: string[]): DocumentType {
  const headersLower = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Check for maintenance visit keywords
  if (headersLower.some(h => h.includes('aircraft') || h.includes('registration')) &&
      headersLower.some(h => h.includes('visit') || h.includes('check')) &&
      headersLower.some(h => h.includes('datein') || h.includes('dateout'))) {
    console.log('Detected as maintenance_visit by keyword matching');
    return 'maintenance_visit';
  }

  // Check for employee schedule keywords
  if (headersLower.some(h => h.includes('employee')) &&
      headersLower.some(h => h.includes('date') || h.includes('assignment')) &&
      headersLower.some(h => h.includes('support') || h.includes('code'))) {
    console.log('Detected as employee_schedule by keyword matching');
    return 'employee_schedule';
  }

  // Check for certificate keywords
  if (headersLower.some(h => h.includes('certificate') || h.includes('authorization')) &&
      headersLower.some(h => h.includes('expiry') || h.includes('issued'))) {
    console.log('Detected as certificate by keyword matching');
    return 'certificate';
  }

  // Check for aircraft keywords
  if (headersLower.some(h => h.includes('registration') && h.includes('aircraft')) &&
      headersLower.some(h => h.includes('model') || h.includes('serial'))) {
    console.log('Detected as aircraft by keyword matching');
    return 'aircraft';
  }

  console.warn('Could not detect document type even with keyword matching');
  return 'unknown';
}

/**
 * Use AI to map CSV columns to database fields
 */
export async function mapColumnsToFields(
  documentType: DocumentType,
  headers: string[],
  sampleRow: any
): Promise<Record<string, string>> {
  try {
    const schemaTemplates = {
      maintenance_visit: {
        aircraft_registration: 'Aircraft registration number',
        visit_number: 'Unique visit identifier (e.g., MV-2026-025)',
        check_type: 'Type of check (A-Check, B-Check, C-Check, etc.)',
        date_in: 'Date aircraft entered maintenance',
        date_out: 'Date aircraft will leave maintenance',
        status: 'Status (In Progress, Scheduled, Completed)',
        hangar: 'Hangar name or number',
        total_hours: 'Total maintenance hours',
        remarks: 'Additional notes'
      },
      employee_schedule: {
        employee_number: 'Employee ID or number (e.g., E-12345)',
        employee_name: 'Employee full name',
        assignment_date: 'Date of assignment',
        support_code: 'Support code (AV, L, TR, MV)',
        assignment_notes: 'Assignment details or visit number'
      },
      certificate: {
        employee_number: 'Employee ID or number',
        employee_name: 'Employee full name',
        certificate_number: 'Certificate or authorization number',
        authorization_type: 'Type of authorization (EASA, FAA, GCAA, etc.)',
        aircraft_model: 'Aircraft model or type',
        issued_on: 'Issue date',
        expiry_date: 'Expiration date',
        issuing_authority: 'Issuing organization'
      },
      aircraft: {
        registration: 'Aircraft registration',
        aircraft_code: 'Internal aircraft code',
        aircraft_name: 'Aircraft name or identifier',
        model: 'Aircraft model',
        serial_number: 'Serial number',
        customer: 'Customer or operator'
      }
    };

    const schema = schemaTemplates[documentType] || {};

    const prompt = `
Map CSV columns to database fields for a ${documentType} document.

CSV Columns: ${headers.join(', ')}
Sample Data: ${JSON.stringify(sampleRow)}

Expected Database Fields:
${Object.entries(schema).map(([field, desc]) => `- ${field}: ${desc}`).join('\n')}

Return a JSON object mapping CSV column names to database field names.
Example: {"Aircraft": "aircraft_registration", "Visit #": "visit_number"}

If a column doesn't match any field, omit it. Be flexible with column names (e.g., "Aircraft Reg", "Reg", "Registration" all map to "aircraft_registration").

Return ONLY valid JSON, no other text.
`;

    const completion = await openai.chat.completions.create({
      model: GPT_CONFIG.model,
      max_completion_tokens: 500,
      messages: [
        { role: 'system', content: 'You are a data mapping assistant. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ]
    });

    const response = completion.choices[0]?.message?.content?.trim() || '{}';
    console.log('AI column mapping response:', response);

    // Extract JSON from response (in case AI adds markdown formatting)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
    console.log('Extracted JSON:', jsonStr);

    const mapping = JSON.parse(jsonStr);
    console.log('Parsed mapping:', mapping);
    return mapping;
  } catch (error) {
    console.error('Error mapping columns:', error);
    console.warn('Falling back to keyword-based column mapping');
    return mapColumnsByKeywords(documentType, headers);
  }
}

/**
 * Fallback: Map columns using keyword matching
 */
function mapColumnsByKeywords(documentType: DocumentType, headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  // Create a lookup function
  const findHeader = (keywords: string[]): string | undefined => {
    return headers.find(h => {
      const normalized = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return keywords.some(kw => normalized.includes(kw.toLowerCase().replace(/[^a-z0-9]/g, '')));
    });
  };

  if (documentType === 'maintenance_visit') {
    const registrationHeader = findHeader(['aircraft', 'registration', 'reg', 'tail']);
    if (registrationHeader) mapping[registrationHeader] = 'aircraft_registration';

    const visitHeader = findHeader(['visit', 'visitnumber', 'visitno']);
    if (visitHeader) mapping[visitHeader] = 'visit_number';

    const checkHeader = findHeader(['check', 'checktype', 'type']);
    if (checkHeader) mapping[checkHeader] = 'check_type';

    const dateInHeader = findHeader(['datein', 'indate', 'startin', 'arrival']);
    if (dateInHeader) mapping[dateInHeader] = 'date_in';

    const dateOutHeader = findHeader(['dateout', 'outdate', 'departure', 'completion']);
    if (dateOutHeader) mapping[dateOutHeader] = 'date_out';

    const statusHeader = findHeader(['status', 'state', 'progress']);
    if (statusHeader) mapping[statusHeader] = 'status';

    const hangarHeader = findHeader(['hangar', 'bay', 'location']);
    if (hangarHeader) mapping[hangarHeader] = 'hangar';

    const hoursHeader = findHeader(['hours', 'totalhours', 'manhours']);
    if (hoursHeader) mapping[hoursHeader] = 'total_hours';

    const remarksHeader = findHeader(['remarks', 'notes', 'comments', 'description']);
    if (remarksHeader) mapping[remarksHeader] = 'remarks';
  } else if (documentType === 'employee_schedule') {
    const empNumHeader = findHeader(['employee', 'empno', 'number', 'id']);
    if (empNumHeader) mapping[empNumHeader] = 'employee_number';

    const empNameHeader = findHeader(['name', 'employeename', 'fullname']);
    if (empNameHeader) mapping[empNameHeader] = 'employee_name';

    const dateHeader = findHeader(['date', 'assignmentdate', 'scheduledate']);
    if (dateHeader) mapping[dateHeader] = 'assignment_date';

    const codeHeader = findHeader(['support', 'code', 'supportcode', 'type']);
    if (codeHeader) mapping[codeHeader] = 'support_code';

    const assignmentHeader = findHeader(['assignment', 'notes', 'visit', 'task']);
    if (assignmentHeader) mapping[assignmentHeader] = 'assignment_notes';
  } else if (documentType === 'certificate') {
    const empNumHeader = findHeader(['employee', 'empno', 'number', 'id']);
    if (empNumHeader) mapping[empNumHeader] = 'employee_number';

    const empNameHeader = findHeader(['name', 'employeename', 'fullname']);
    if (empNameHeader) mapping[empNameHeader] = 'employee_name';

    const certNumHeader = findHeader(['certificate', 'certno', 'certnumber', 'license']);
    if (certNumHeader) mapping[certNumHeader] = 'certificate_number';

    const authTypeHeader = findHeader(['authorization', 'authtype', 'type', 'category']);
    if (authTypeHeader) mapping[authTypeHeader] = 'authorization_type';

    const modelHeader = findHeader(['aircraft', 'model', 'type', 'rating']);
    if (modelHeader) mapping[modelHeader] = 'aircraft_model';

    const issuedHeader = findHeader(['issued', 'issuedate', 'issueon', 'dateissued']);
    if (issuedHeader) mapping[issuedHeader] = 'issued_on';

    const expiryHeader = findHeader(['expiry', 'expirydate', 'expires', 'expiration']);
    if (expiryHeader) mapping[expiryHeader] = 'expiry_date';

    const authorityHeader = findHeader(['issuing', 'authority', 'issuedby', 'organization']);
    if (authorityHeader) mapping[authorityHeader] = 'issuing_authority';
  }

  console.log('Keyword-based mapping created:', mapping);
  return mapping;
}

/**
 * Transform CSV rows to entity objects using column mapping
 */
export function transformRowsToEntities(
  documentType: DocumentType,
  rows: any[],
  columnMapping: Record<string, string>
): any[] {
  return rows.map(row => {
    const entity: any = {};

    // Map each CSV column to database field
    for (const [csvColumn, dbField] of Object.entries(columnMapping)) {
      const value = row[csvColumn];
      if (value !== undefined && value !== null && value !== '') {
        entity[dbField] = value;
      }
    }

    return entity;
  });
}

/**
 * Main function to parse and extract entities from CSV
 */
export async function extractEntitiesFromCSV(file: File): Promise<{
  documentType: DocumentType;
  entities: any[];
  headers: string[];
  rowCount: number;
}> {
  try {
    // Step 1: Parse CSV
    console.log('Parsing CSV file...');
    const parsed = await parseCSVFile(file);

    if (parsed.rowCount === 0) {
      throw new Error('CSV file is empty');
    }

    // Step 2: Detect document type
    console.log('Detecting document type...');
    const documentType = await detectDocumentType(parsed.headers, parsed.rows.slice(0, 3));

    if (documentType === 'unknown') {
      throw new Error('Could not determine document type from CSV structure');
    }

    // Step 3: Map columns to fields
    console.log(`Mapping columns for ${documentType}...`);
    let columnMapping = await mapColumnsToFields(documentType, parsed.headers, parsed.rows[0]);
    console.log('Column mapping result:', columnMapping);

    // If AI mapping is empty, use keyword fallback
    if (Object.keys(columnMapping).length === 0) {
      console.warn('AI column mapping returned empty, using keyword fallback');
      columnMapping = mapColumnsByKeywords(documentType, parsed.headers);
    }

    // Step 4: Transform rows to entities
    console.log('Transforming rows to entities...');
    const entities = transformRowsToEntities(documentType, parsed.rows, columnMapping);
    console.log('First transformed entity:', entities[0]);

    return {
      documentType,
      entities,
      headers: parsed.headers,
      rowCount: parsed.rowCount
    };
  } catch (error) {
    console.error('CSV extraction failed:', error);
    throw error;
  }
}
