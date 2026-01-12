/**
 * Validation error structure from API responses
 */
export interface ValidationErrorDetail {
  field: string; // Path to the field (e.g., "informacionImplante.sistemaConexion")
  message: string; // Error message
}

export interface ValidationError {
  message: string; // General error message
  details: ValidationErrorDetail[]; // Specific field errors
}

/**
 * API error response structure with validation details
 */
interface APIErrorDetail {
  path?: string[];
  message?: string;
}

interface APIErrorResponse {
  error?: string;
  details?: APIErrorDetail[];
}

/**
 * Maps field paths to section names for error grouping
 */
export function getFieldSection(fieldPath: string): string {
  const path = fieldPath.toLowerCase();

  if (path.includes('patientname') || path.includes('patientid') || path.includes('fechaentrega')) {
    return 'patient';
  }
  if (path.includes('tipocaso') || path.includes('motivogarantia') || path.includes('sedevuelve')) {
    return 'caseType';
  }
  if (path.includes('tipotrabajo') || path.includes('tiporestauracion')) {
    return 'workType';
  }
  if (
    path.includes('scantype') ||
    path.includes('escanerutilizado') ||
    path.includes('otroescaner') ||
    path.includes('tiposilicon') ||
    path.includes('notamodelofi')
  ) {
    return 'impression';
  }
  if (path.includes('teethnumbers')) {
    return 'teeth';
  }
  if (
    path.includes('material') ||
    path.includes('materialbrand') ||
    path.includes('color') ||
    path.includes('colorinfo')
  ) {
    return 'material';
  }
  if (path.includes('informacionimplante') || path.includes('trabajosobreimplante')) {
    return 'implant';
  }
  if (path.includes('occlusiondiseno')) {
    return 'occlusion';
  }
  if (path.includes('submissiontype') || path.includes('articulatedby')) {
    return 'submission';
  }
  if (path.includes('description') || path.includes('notes')) {
    return 'notes';
  }

  return 'general';
}

/**
 * Section display names in Spanish
 */
export const SECTION_NAMES: Record<string, string> = {
  patient: 'Información del Paciente',
  caseType: 'Tipo de Caso',
  workType: 'Tipo de Trabajo',
  impression: 'Detalles de Impresión',
  teeth: 'Números de Dientes',
  material: 'Material y Color',
  implant: 'Información de Implantes',
  occlusion: 'Diseño de Oclusión',
  submission: 'Tipo de Envío',
  notes: 'Notas Adicionales',
  general: 'General',
};

/**
 * Groups validation errors by section
 */
export function groupErrorsBySection(details: ValidationErrorDetail[]): Map<string, ValidationErrorDetail[]> {
  const grouped = new Map<string, ValidationErrorDetail[]>();

  for (const detail of details) {
    const section = getFieldSection(detail.field);
    if (!grouped.has(section)) {
      grouped.set(section, []);
    }
    grouped.get(section)!.push(detail);
  }

  return grouped;
}

/**
 * Type guard to check if an error has the validation error structure
 */
function isAPIErrorResponse(error: Error): error is Error & APIErrorResponse {
  return 'details' in error && Array.isArray((error as Error & APIErrorResponse).details);
}

/**
 * Parses API error response into ValidationError
 */
export function parseValidationError(error: Error): ValidationError | null {
  if (!isAPIErrorResponse(error)) {
    return null;
  }

  const details = error.details || [];

  return {
    message: error.error || error.message || 'Hay errores en el formulario',
    details: details.map((detail) => ({
      field: detail.path?.join('.') || 'unknown',
      message: detail.message || 'Error de validación',
    })),
  };
}
