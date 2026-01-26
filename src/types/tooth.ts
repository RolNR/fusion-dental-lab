import { RestorationType } from '@prisma/client';
import { z } from 'zod';
import { implantInfoSchema, colorInfoSchema, ImplantInfo, ColorInfo } from './order';

/**
 * Bridge definition for tracking bridge work spanning multiple teeth.
 */
export interface BridgeDefinition {
  id: string;
  startTooth: string;
  endTooth: string;
  pontics: string[]; // AUSENTE teeth in range (replacement teeth)
  material?: string;
  colorInfo?: ColorInfo;
}

// Tooth interface
export interface Tooth {
  id: string;
  orderId: string;
  toothNumber: string;

  material?: string;
  colorInfo?: ColorInfo;
  tipoRestauracion?: RestorationType;
  trabajoSobreImplante?: boolean;
  informacionImplante?: ImplantInfo;

  createdAt: string;
  updatedAt: string;
}

// Zod schema for creating/updating tooth data
export const toothDataSchema = z.object({
  toothNumber: z.string().min(1, 'Número de diente requerido'),
  material: z.string().optional(),
  colorInfo: z.union([colorInfoSchema, z.null()]).optional(),
  tipoRestauracion: z.nativeEnum(RestorationType).nullable().optional(),
  trabajoSobreImplante: z.boolean().optional(),
  informacionImplante: z.union([implantInfoSchema, z.null()]).optional(),
});

export type ToothData = z.infer<typeof toothDataSchema>;

// Zod schema for validating array of teeth
export const teethArraySchema = z.array(toothDataSchema).min(1, 'Al menos un diente es requerido');

/**
 * Configuration status for a tooth.
 * - 'complete': All required fields are filled
 * - 'incomplete': Some data exists but required fields are missing
 * - 'none': No configuration data
 */
export type ToothConfigStatus = 'complete' | 'incomplete' | 'none';

/**
 * Determines the configuration status of a tooth.
 * Complete requires: tipoRestauracion, material, colorInfo (shadeCode + shadeType)
 * If trabajoSobreImplante is true, also requires implant brand (marcaImplante)
 */
export function getToothConfigStatus(tooth: ToothData | undefined): ToothConfigStatus {
  if (!tooth) return 'none';

  const colorInfo = tooth.colorInfo as { shadeCode?: string; shadeType?: string } | undefined;
  const implantInfo = tooth.informacionImplante as { marcaImplante?: string } | undefined;

  // Check if tooth has any data at all
  const hasAnyData =
    tooth.tipoRestauracion ||
    tooth.material ||
    colorInfo?.shadeCode ||
    colorInfo?.shadeType ||
    tooth.trabajoSobreImplante;

  if (!hasAnyData) return 'none';

  // Check required fields for completeness
  const hasTipoRestauracion = !!tooth.tipoRestauracion;
  const hasMaterial = !!tooth.material;
  const hasColor = !!colorInfo?.shadeCode;
  const hasColorSystem = !!colorInfo?.shadeType;

  // If implant work, check implant info
  const implantComplete =
    !tooth.trabajoSobreImplante || (tooth.trabajoSobreImplante && !!implantInfo?.marcaImplante);

  const isComplete =
    hasTipoRestauracion && hasMaterial && hasColor && hasColorSystem && implantComplete;

  return isComplete ? 'complete' : 'incomplete';
}
