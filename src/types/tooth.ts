import { RestorationType } from '@prisma/client';
import { z } from 'zod';
import { implantInfoSchema, colorInfoSchema, ImplantInfo, ColorInfo } from './order';

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
