import { CertificateEntity } from '@/types/documentUpload';
import { supabase } from '@/integrations/supabase/client';

/**
 * Convert image file to base64 data URL
 */
export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract certificate data from image using GPT-4o Vision via edge function
 */
export async function extractCertificateFromImage(file: File): Promise<CertificateEntity> {
  try {
    console.log('Converting image to data URL...');
    const imageDataUrl = await fileToDataURL(file);

    console.log('Sending image to OpenAI Vision API via edge function...');

    const visionPrompt = `
Analyze this certificate/authorization document image and extract the following information:

REQUIRED FIELDS:
- Employee name (full name as shown on certificate)
- Employee number/ID (if visible, format: E-XXXXX)
- Certificate number (the unique identifier on the certificate)
- Authorization type (e.g., "EASA Part-66 Category B1.1", "FAA A&P", "GCAA Part-145")
- Aircraft type/model (e.g., "A320 Family", "B777", "A330")
- Issue date (format: YYYY-MM-DD)
- Expiry date (format: YYYY-MM-DD)

OPTIONAL FIELDS:
- Issuing authority (e.g., "UK CAA", "FAA", "GCAA", "EASA")
- Authorization basis (e.g., "Part-66", "Part-145", "A&P License")
- Certificate type (e.g., "Type Rating", "Maintenance License", "Authorization")
- Pages (number of pages if multi-page certificate)
- Remarks/limitations (any special notes or limitations)

Return the data as a JSON object with these exact field names:
{
  "employee_name": "...",
  "employee_number": "...",
  "certificate_number": "...",
  "authorization_type": "...",
  "aircraft_model": "...",
  "issued_on": "YYYY-MM-DD",
  "expiry_date": "YYYY-MM-DD",
  "issuing_authority": "...",
  "authorization_basis": "...",
  "certificate_type": "...",
  "pages": number,
  "remarks": "..."
}

If a field is not visible or unclear, use null for that field.
Return ONLY valid JSON, no other text or markdown formatting.
`;

    const { data, error } = await supabase.functions.invoke('openai-chat', {
      body: {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: visionPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        model: 'gpt-4o', // Use GPT-4o for vision capabilities
        max_completion_tokens: 1000
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to call AI service');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    const response = data?.choices?.[0]?.message?.content?.trim() || '{}';

    console.log('OCR response:', response);

    // Extract JSON from response (in case AI adds markdown formatting)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '{}';

    const extractedData = JSON.parse(jsonStr);

    // Convert to CertificateEntity format
    const certificateEntity: CertificateEntity = {
      employee_id: 0, // Will be resolved during validation
      employee_name: extractedData.employee_name || '',
      employee_number: extractedData.employee_number || undefined,
      authorization_type_id: 0, // Will be resolved during validation
      authorization_type: extractedData.authorization_type || '',
      aircraft_model_id: 0, // Will be resolved during validation
      aircraft_model: extractedData.aircraft_model || '',
      certificate_number: extractedData.certificate_number || '',
      authorization_basis: extractedData.authorization_basis || extractedData.certificate_type || 'Certificate',
      issued_on: extractedData.issued_on || undefined,
      expiry_date: extractedData.expiry_date || '',
      issuing_authority: extractedData.issuing_authority || undefined,
      certificate_type: extractedData.certificate_type || undefined,
      pages: extractedData.pages || undefined,
      remarks: extractedData.remarks || undefined
    };

    return certificateEntity;
  } catch (error: any) {
    console.error('Image OCR failed:', error);
    throw new Error(`Failed to extract certificate data from image: ${error.message}`);
  }
}

/**
 * Validate that required certificate fields are present
 */
export function validateCertificateData(cert: CertificateEntity): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!cert.employee_name) {
    errors.push('Employee name is required');
  }

  if (!cert.certificate_number) {
    errors.push('Certificate number is required');
  }

  if (!cert.authorization_type) {
    errors.push('Authorization type is required');
  }

  if (!cert.aircraft_model) {
    errors.push('Aircraft model/type is required');
  }

  if (!cert.expiry_date) {
    errors.push('Expiry date is required');
  }

  // Validate date format
  if (cert.expiry_date && !isValidDate(cert.expiry_date)) {
    errors.push('Expiry date format is invalid (expected: YYYY-MM-DD)');
  }

  if (cert.issued_on && !isValidDate(cert.issued_on)) {
    errors.push('Issue date format is invalid (expected: YYYY-MM-DD)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if date string is valid YYYY-MM-DD format
 */
function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}
