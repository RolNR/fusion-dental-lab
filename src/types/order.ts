import { ScanType, OrderStatus } from '@prisma/client';
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

// Base schema for creating orders (shared between doctor and assistant)
export const orderCreateSchema = z.object({
  patientName: z.string().min(1, 'El nombre del paciente es requerido'),
  patientId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  teethNumbers: z.string().optional(),
  material: z.string().optional(),
  materialBrand: z.string().optional(),
  color: z.string().optional(),
  scanType: z.nativeEnum(ScanType).optional(),
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
});

export type OrderUpdateData = z.infer<typeof orderUpdateSchema>;
