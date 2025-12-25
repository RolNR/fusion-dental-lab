import { ScanType, OrderStatus } from '@prisma/client';
import { z } from 'zod';

// Order interface for detail pages
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
