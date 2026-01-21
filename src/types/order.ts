import {
  ScanType,
  OrderStatus,
  CaseType,
  WorkType,
  RestorationType,
  ScannerType,
  SiliconType,
  SubmissionType,
  ArticulatedBy,
  Prisma,
} from '@prisma/client';
import { z } from 'zod';
import { Tooth } from './tooth';

// Order interface for detail pages (doctor/assistant views)
export interface Order {
  id: string;
  orderNumber: string;
  patientName: string;
  patientId?: string;
  description?: string;
  notes?: string;
  fechaEntregaDeseada?: string;
  aiPrompt?: string;
  teethNumbers?: string;
  scanType?: string;
  status: OrderStatus;
  doctorId: string;
  createdAt: string;

  // POC fields - Case type
  tipoCaso?: CaseType;
  motivoGarantia?: string;
  seDevuelveTrabajoOriginal?: boolean;

  // POC fields - Impression details
  escanerUtilizado?: ScannerType;
  otroEscaner?: string;
  tipoSilicon?: SiliconType;
  notaModeloFisico?: string;

  // POC fields - Material sent
  materialSent?: Record<string, boolean>;

  // POC fields - Submission type
  submissionType?: SubmissionType;

  // POC fields - Occlusion
  oclusionDiseno?: OcclusionInfo;

  // POC fields - Articulation
  articulatedBy?: ArticulatedBy;

  // Urgent order
  isUrgent?: boolean;

  // Per-tooth configuration
  teeth?: Tooth[];

  clinic?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    laboratory?: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
    };
  };
  doctor?: {
    name: string;
    email?: string;
  };
  createdBy?: {
    name: string;
    role: string;
  };
  comments?: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      name: string | null;
      role: string;
    };
  }[];
}

// Order interface for table views (shared across dashboards)
export interface OrderWithRelations {
  id: string;
  orderNumber: string;
  patientName: string;
  status: OrderStatus;
  createdAt: string;
  isUrgent: boolean;
  clinic: {
    id: string;
    name: string;
  };
  doctor?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
}

// Order detail interface for lab views (lab-admin/lab-collaborator)
export interface OrderDetail {
  id: string;
  orderNumber: string;
  patientName: string;
  patientId: string | null;
  description: string | null;
  notes: string | null;
  fechaEntregaDeseada: string | null;
  aiPrompt: string | null;
  teethNumbers: string | null;
  scanType: ScanType | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  materialsSentAt: string | null;
  completedAt: string | null;

  // POC fields - Case type
  tipoCaso: CaseType | null;
  motivoGarantia: string | null;
  seDevuelveTrabajoOriginal: boolean | null;

  // POC fields - Impression details
  escanerUtilizado: ScannerType | null;
  otroEscaner: string | null;
  tipoSilicon: SiliconType | null;
  notaModeloFisico: string | null;

  // POC fields - Material sent
  materialSent: Record<string, boolean> | null;

  // POC fields - Submission type
  submissionType: SubmissionType | null;

  // POC fields - Occlusion
  oclusionDiseno: OcclusionInfo | null;

  // POC fields - Articulation
  articulatedBy: ArticulatedBy | null;

  // Urgent order
  isUrgent: boolean;

  // Per-tooth configuration
  teeth: Tooth[];

  clinic: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  doctor: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  files: Array<{
    id: string;
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    storageUrl: string;
    category: string | null;
    createdAt: string;
  }>;
}

// Implant information schema
export const implantInfoSchema = z.object({
  marcaImplante: z.string().optional(),
  sistemaConexion: z.string().optional(),
  numeroImplantes: z.number().optional(),
  tipoRestauracion: z.enum(['individual', 'ferulizada', 'hibrida']).optional(),
  tipoAditamento: z.enum(['estandar', 'personalizado', 'multi_unit']).optional(),
  perfilEmergencia: z.enum(['recto', 'concavo', 'convexo']).optional(),
  condicionTejidoBlando: z.enum(['sano', 'inflamado', 'retraido']).optional(),
  radiografiaPeriapical: z.string().optional(),
  cbct: z.string().optional(),
});

// Occlusion schema
export const occlusionSchema = z.object({
  tipoOclusion: z
    .enum(['normal', 'clase_i', 'clase_ii', 'clase_iii', 'borde_a_borde', 'mordida_cruzada'])
    .optional(),
  espacioInteroclusalSuficiente: z.boolean().optional(),
  solucionEspacioInsuficiente: z
    .enum(['reduccion_oclusal', 'aumento_vertical', 'ambas'])
    .optional(),
});

// Shade system constants
export const SHADE_SYSTEMS = [
  { value: 'VITAPAN_CLASSICAL', label: 'VITAPAN Classical' },
  { value: 'VITAPAN_3D_MASTER', label: 'VITAPAN 3D-Master' },
  { value: 'IVOCLAR_CHROMASCOP', label: 'Ivoclar Vivadent Chromascop' },
  { value: 'IVOCLAR_AD_BLEACH', label: 'Ivoclar Vivadent A-D + Bleach' },
  { value: 'KURARAY_NORITAKE', label: 'Kuraray Noritake' },
  { value: 'TRUBYTE_BIOFORM', label: 'Trubyte Bioform/New Hue' },
  { value: 'DURATONE', label: 'Duratone' },
] as const;

export type ShadeSystemValue = (typeof SHADE_SYSTEMS)[number]['value'];

// Extended color info schema
export const colorInfoSchema = z.object({
  shadeType: z.string().nullable().optional(),
  shadeCode: z.string().nullable().optional(),
  colorimeter: z.string().optional(),
  texture: z.array(z.string()).optional(),
  gloss: z.array(z.string()).optional(),
  mamelones: z.enum(['si', 'no']).optional(),
  translucency: z
    .object({
      level: z.number().min(1).max(10),
      description: z.string(),
    })
    .optional(),
});

// TypeScript types for the schemas
export type ImplantInfo = z.infer<typeof implantInfoSchema>;
export type OcclusionInfo = z.infer<typeof occlusionSchema>;
export type ColorInfo = z.infer<typeof colorInfoSchema>;

// Base schema for creating orders (shared between doctor and assistant)
// Schema for creating orders as drafts (all fields optional)
export const orderDraftSchema = z.object({
  // Existing fields - all optional for drafts
  patientName: z.string().optional(),
  patientId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  fechaEntregaDeseada: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== '' ? new Date(val) : undefined)),
  aiPrompt: z.string().optional(),
  teethNumbers: z.string().optional(),
  scanType: z.nativeEnum(ScanType).nullable().optional(),

  // Case type
  tipoCaso: z.nativeEnum(CaseType).nullable().optional(),
  motivoGarantia: z.string().optional(),
  seDevuelveTrabajoOriginal: z.boolean().optional(),

  // Impression details
  escanerUtilizado: z.nativeEnum(ScannerType).nullable().optional(),
  otroEscaner: z.string().optional(),
  tipoSilicon: z.nativeEnum(SiliconType).nullable().optional(),
  notaModeloFisico: z.string().optional(),

  // Material sent
  materialSent: z
    .union([z.record(z.string(), z.boolean()), z.null()])
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),

  // Submission type
  submissionType: z.nativeEnum(SubmissionType).nullable().optional(),

  // Occlusion
  oclusionDiseno: z
    .union([occlusionSchema, z.null()])
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),

  // Articulation
  articulatedBy: z.nativeEnum(ArticulatedBy).nullable().optional(),

  // Urgent order
  isUrgent: z.boolean().optional(),

  // Per-tooth configuration
  teeth: z
    .array(
      z.object({
        toothNumber: z.string().min(1),
        material: z.string().optional(),
        materialBrand: z.string().optional(),
        colorInfo: z
          .union([colorInfoSchema, z.null()])
          .optional()
          .transform((val) => val as Prisma.InputJsonValue | undefined),
        tipoTrabajo: z.nativeEnum(WorkType).nullable().optional(),
        tipoRestauracion: z.nativeEnum(RestorationType).nullable().optional(),
        trabajoSobreImplante: z.boolean().optional(),
        informacionImplante: z
          .union([implantInfoSchema, z.null()])
          .optional()
          .transform((val) => val as Prisma.InputJsonValue | undefined),
      })
    )
    .optional(),
});

// Schema for creating orders with validation (patientName required)
export const orderCreateSchema = orderDraftSchema.extend({
  patientName: z.string().min(1, 'El nombre del paciente es requerido'),
});

// Schema for tooth configuration when submitting (stricter validation)
// Accept any input first, then validate with Spanish messages
const toothSubmitSchema = z.object({
  toothNumber: z.string().min(1, 'Número de diente requerido'),
  material: z.any().refine((val) => typeof val === 'string' && val.length > 0, {
    message: 'Material requerido',
  }),
  materialBrand: z.string().nullable().optional(),
  colorInfo: z
    .union([colorInfoSchema, z.null()])
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),
  tipoTrabajo: z.any().refine((val) => Object.values(WorkType).includes(val), {
    message: 'Tipo de trabajo requerido',
  }),
  tipoRestauracion: z.any().refine((val) => Object.values(RestorationType).includes(val), {
    message: 'Tipo de restauración requerido',
  }),
  trabajoSobreImplante: z.boolean().optional(),
  informacionImplante: z
    .union([implantInfoSchema, z.null()])
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),
});

// Schema for submitting orders for review (stricter validation on teeth)
export const orderSubmitSchema = orderCreateSchema.extend({
  teeth: z.array(toothSubmitSchema).optional(),
});

// Schema for assistants creating draft orders (includes doctorId, patientName optional)
export const assistantOrderDraftSchema = orderDraftSchema.extend({
  doctorId: z.string().min(1, 'El doctor es requerido'),
});

// Schema for assistants creating orders (includes doctorId)
export const assistantOrderCreateSchema = orderCreateSchema.extend({
  doctorId: z.string().min(1, 'El doctor es requerido'),
});

// Schema for assistants submitting orders for review (includes doctorId + stricter teeth validation)
export const assistantOrderSubmitSchema = orderSubmitSchema.extend({
  doctorId: z.string().min(1, 'El doctor es requerido'),
});

// Schema for updating orders
export const orderUpdateSchema = z.object({
  patientName: z.string().min(1).optional(),
  patientId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  fechaEntregaDeseada: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== '' ? new Date(val) : undefined)),
  teethNumbers: z.string().optional(),
  scanType: z.nativeEnum(ScanType).nullable().optional(),
  status: z.nativeEnum(OrderStatus).optional(),

  // New fields
  tipoCaso: z.nativeEnum(CaseType).nullable().optional(),
  motivoGarantia: z.string().optional(),

  // Per-tooth configuration
  teeth: z
    .array(
      z.object({
        toothNumber: z.string().min(1),
        material: z.string().optional(),
        materialBrand: z.string().optional(),
        colorInfo: z
          .union([colorInfoSchema, z.null()])
          .optional()
          .transform((val) => val as Prisma.InputJsonValue | undefined),
        tipoTrabajo: z.nativeEnum(WorkType).nullable().optional(),
        tipoRestauracion: z.nativeEnum(RestorationType).nullable().optional(),
        trabajoSobreImplante: z.boolean().optional(),
        informacionImplante: z
          .union([implantInfoSchema, z.null()])
          .optional()
          .transform((val) => val as Prisma.InputJsonValue | undefined),
      })
    )
    .optional(),
  seDevuelveTrabajoOriginal: z.boolean().optional(),
  escanerUtilizado: z.nativeEnum(ScannerType).nullable().optional(),
  otroEscaner: z.string().optional(),
  tipoSilicon: z.nativeEnum(SiliconType).nullable().optional(),
  notaModeloFisico: z.string().optional(),
  materialSent: z
    .union([z.record(z.string(), z.boolean()), z.null()])
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),
  submissionType: z.nativeEnum(SubmissionType).nullable().optional(),
  oclusionDiseno: z
    .union([occlusionSchema, z.null()])
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),
  articulatedBy: z.nativeEnum(ArticulatedBy).nullable().optional(),
  isUrgent: z.boolean().optional(),
});

export type OrderUpdateData = z.infer<typeof orderUpdateSchema>;
