import {
  UploadedDocument,
  ExtractedData,
  ExtractedEntity,
  FileType,
  DocumentType
} from '@/types/documentUpload';
import { extractEntitiesFromCSV } from './csvParser';
import { extractCertificateFromImage } from './imageOCR';
import { validateEntity } from './documentValidation';

/**
 * Determine file type from file extension
 */
export function getFileType(file: File): FileType {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      return 'csv';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'image';
    case 'pdf':
      return 'pdf';
    default:
      return 'image'; // Default to image
  }
}

/**
 * Process CSV file and extract entities
 */
async function processCSVDocument(file: File): Promise<ExtractedData> {
  try {
    // Extract entities from CSV using AI
    const { documentType, entities, rowCount } = await extractEntitiesFromCSV(file);

    console.log(`Extracted ${entities.length} ${documentType} entities from CSV`);

    // Validate each entity
    const validatedEntities: ExtractedEntity[] = [];
    for (const entityData of entities) {
      const validatedEntity = await validateEntity(documentType, entityData);
      validatedEntities.push(validatedEntity);
    }

    const validCount = validatedEntities.filter(e => e.status === 'valid' || e.status === 'warning').length;
    const errorCount = validatedEntities.filter(e => e.status === 'error').length;

    return {
      documentType,
      entities: validatedEntities,
      confidence: 0.9,
      warnings: [],
      totalCount: validatedEntities.length,
      validCount,
      errorCount
    };
  } catch (error: any) {
    console.error('CSV processing error:', error);
    throw new Error(`Failed to process CSV: ${error.message}`);
  }
}

/**
 * Process image file and extract certificate data
 */
async function processImageDocument(file: File): Promise<ExtractedData> {
  try {
    // Extract certificate data using OCR
    const certificateData = await extractCertificateFromImage(file);

    console.log('Extracted certificate data from image');

    // Validate the certificate entity
    const validatedEntity = await validateEntity('certificate', certificateData);

    const validCount = validatedEntity.status === 'valid' || validatedEntity.status === 'warning' ? 1 : 0;
    const errorCount = validatedEntity.status === 'error' ? 1 : 0;

    return {
      documentType: 'certificate',
      entities: [validatedEntity],
      confidence: 0.85,
      warnings: ['OCR may not be 100% accurate - please review extracted data'],
      totalCount: 1,
      validCount,
      errorCount
    };
  } catch (error: any) {
    console.error('Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Main document processor - routes to appropriate handler based on file type
 */
export async function processDocument(uploadedDoc: UploadedDocument): Promise<ExtractedData> {
  console.log(`Processing ${uploadedDoc.fileType} document: ${uploadedDoc.file.name}`);

  switch (uploadedDoc.fileType) {
    case 'csv':
      return await processCSVDocument(uploadedDoc.file);

    case 'image':
      return await processImageDocument(uploadedDoc.file);

    case 'pdf':
      // For now, treat PDFs as images (will extract first page)
      return await processImageDocument(uploadedDoc.file);

    default:
      throw new Error(`Unsupported file type: ${uploadedDoc.fileType}`);
  }
}
