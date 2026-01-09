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

// Order interface for detail pages (doctor/assistant views)
export interface Order {
  id: string;
  orderNumber: string;
  patientName: string;
  patientId?: string;
  description?: string;
  notes?: string;
  teethNumbers?: string;
  material?: string;
  materialBrand?: string;
  color?: string;
  scanType?: string;
  status: OrderStatus;
  doctorId: string;
  createdAt: string;
  clinic?: {
    name: string;
    email?: string;
    phone?: string;
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
  teethNumbers: string | null;
  material: string | null;
  materialBrand: string | null;
  color: string | null;
  scanType: ScanType | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  materialsSentAt: string | null;
  completedAt: string | null;
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
    createdAt: string;
  }>;
}

// Implant information schema
export const implantInfoSchema = z.object({
  marcaImplante: z.string().min(1, 'La marca del implante es requerida'),
  sistemaConexion: z.string().min(1, 'El sistema de conexión es requerido'),
  numeroImplantes: z.number().min(1, 'El número de implantes es requerido'),
  tipoRestauracion: z.enum(['individual', 'ferulizada', 'hibrida']),
  tipoAditamento: z.enum(['estandar', 'personalizado', 'multi_unit']),
  perfilEmergencia: z.enum(['recto', 'concavo', 'convexo']),
  condicionTejidoBlando: z.enum(['sano', 'inflamado', 'retraido']),
  radiografiaPeriapical: z.string().min(1, 'La radiografía es requerida'),
  cbct: z.string().min(1, 'El CBCT es requerido'),
});

// Occlusion schema
export const occlusionSchema = z.object({
  tipoOclusion: z.enum([
    'normal',
    'clase_i',
    'clase_ii',
    'clase_iii',
    'borde_a_borde',
    'mordida_cruzada',
  ]),
  espacioInteroclusalSuficiente: z.boolean(),
  solucionEspacioInsuficiente: z
    .enum(['reduccion_oclusal', 'aumento_vertical', 'ambas'])
    .optional(),
});

// Extended color info schema
export const colorInfoSchema = z.object({
  shadeType: z.string().nullable(),
  shadeCode: z.string().nullable(),
  colorimeter: z.string().optional(),
  texture: z.array(z.string()),
  gloss: z.array(z.string()),
  mamelones: z.enum(['si', 'no']),
  translucency: z.object({
    level: z.number().min(1).max(10),
    description: z.string(),
  }),
});

// TypeScript types for the schemas
export type ImplantInfo = z.infer<typeof implantInfoSchema>;
export type OcclusionInfo = z.infer<typeof occlusionSchema>;
export type ColorInfo = z.infer<typeof colorInfoSchema>;

// Base schema for creating orders (shared between doctor and assistant)
export const orderCreateSchema = z.object({
  // Existing fields
  patientName: z.string().min(1, 'El nombre del paciente es requerido'),
  patientId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  fechaEntregaDeseada: z.string().optional(), // ISO date string
  aiPrompt: z.string().optional(),
  teethNumbers: z.string().optional(),
  material: z.string().optional(),
  materialBrand: z.string().optional(),
  color: z.string().optional(),
  scanType: z.nativeEnum(ScanType).optional(),

  // Case type
  tipoCaso: z.nativeEnum(CaseType).optional(),
  motivoGarantia: z.string().optional(),
  seDevuelveTrabajoOriginal: z.boolean().optional(),

  // Work classification
  tipoTrabajo: z.nativeEnum(WorkType).optional(),
  tipoRestauracion: z.nativeEnum(RestorationType).optional(),

  // Impression details
  escanerUtilizado: z.nativeEnum(ScannerType).optional(),
  otroEscaner: z.string().optional(),
  tipoSilicon: z.nativeEnum(SiliconType).optional(),
  notaModeloFisico: z.string().optional(),

  // Implant
  trabajoSobreImplante: z.boolean().optional(),
  informacionImplante: implantInfoSchema
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),

  // Material sent
  materialSent: z
    .record(z.string(), z.boolean())
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),

  // Submission type
  submissionType: z.nativeEnum(SubmissionType).optional(),

  // Occlusion
  oclusionDiseno: occlusionSchema
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),

  // Extended color
  colorInfo: colorInfoSchema
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),

  // Articulation
  articulatedBy: z.nativeEnum(ArticulatedBy).optional(),
});

// Schema for assistants creating orders (includes doctorId)
export const assistantOrderCreateSchema = orderCreateSchema.extend({
  doctorId: z.string().min(1, 'El doctor es requerido'),
});

// Schema for updating orders
export const orderUpdateSchema = z.object({
  patientName: z.string().min(1).optional(),
  patientId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  teethNumbers: z.string().optional(),
  material: z.string().optional(),
  materialBrand: z.string().optional(),
  color: z.string().optional(),
  scanType: z.nativeEnum(ScanType).optional(),
  status: z.nativeEnum(OrderStatus).optional(),

  // New fields
  tipoCaso: z.nativeEnum(CaseType).optional(),
  motivoGarantia: z.string().optional(),
  seDevuelveTrabajoOriginal: z.boolean().optional(),
  tipoTrabajo: z.nativeEnum(WorkType).optional(),
  tipoRestauracion: z.nativeEnum(RestorationType).optional(),
  escanerUtilizado: z.nativeEnum(ScannerType).optional(),
  otroEscaner: z.string().optional(),
  tipoSilicon: z.nativeEnum(SiliconType).optional(),
  notaModeloFisico: z.string().optional(),
  trabajoSobreImplante: z.boolean().optional(),
  informacionImplante: implantInfoSchema
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),
  materialSent: z
    .record(z.string(), z.boolean())
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),
  submissionType: z.nativeEnum(SubmissionType).optional(),
  oclusionDiseno: occlusionSchema
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),
  colorInfo: colorInfoSchema
    .optional()
    .transform((val) => val as Prisma.InputJsonValue | undefined),
  articulatedBy: z.nativeEnum(ArticulatedBy).optional(),
});

export type OrderUpdateData = z.infer<typeof orderUpdateSchema>;
