import {
  ScanType,
  CaseType,
  ScannerType,
  SiliconType,
  SubmissionType,
  ArticulatedBy,
} from '@prisma/client';
import { OcclusionInfo } from '@/types/order';
import { ToothData } from '@/types/tooth';

export interface OrderFormProps {
  initialData?: OrderFormData;
  orderId?: string;
  role: 'doctor' | 'assistant';
  onSuccess?: () => void;
}

export interface OrderFormData {
  patientName: string;
  patientId?: string;
  description?: string;
  notes?: string;
  fechaEntregaDeseada?: string; // ISO date string
  aiPrompt?: string;
  teethNumbers?: string;
  scanType?: ScanType | null;
  doctorId?: string;
  status?: string;

  // Case type fields
  tipoCaso?: CaseType | null;
  motivoGarantia?: string;
  seDevuelveTrabajoOriginal?: boolean;

  // Impression fields
  escanerUtilizado?: ScannerType | null;
  otroEscaner?: string;
  tipoSilicon?: SiliconType | null;
  notaModeloFisico?: string;

  // Order-level fields (shared)
  materialSent?: Record<string, boolean>;
  submissionType?: SubmissionType | null;
  oclusionDiseno?: OcclusionInfo;
  articulatedBy?: ArticulatedBy | null;

  // Urgent order
  isUrgent?: boolean;

  // Per-tooth configuration
  teeth?: ToothData[];
}

export interface OrderFormState {
  patientName: string;
  patientId: string;
  description: string;
  notes: string;
  fechaEntregaDeseada: string;
  aiPrompt: string;
  teethNumbers: string;
  scanType: ScanType | null;
  doctorId: string;

  // Case type fields
  tipoCaso: CaseType | null;
  motivoGarantia: string;
  seDevuelveTrabajoOriginal: boolean;

  // Impression fields
  escanerUtilizado: ScannerType | null;
  otroEscaner: string;
  tipoSilicon: SiliconType | null;
  notaModeloFisico: string;

  // Order-level fields (shared)
  materialSent?: Record<string, boolean>;
  submissionType: SubmissionType | null;
  oclusionDiseno?: OcclusionInfo;
  articulatedBy: ArticulatedBy | null;

  // Urgent order
  isUrgent?: boolean;
}
