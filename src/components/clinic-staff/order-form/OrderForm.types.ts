import { CaseType, ScannerType, SubmissionType, ArticulatedBy } from '@prisma/client';
import { OcclusionInfo } from '@/types/order';
import { ToothData } from '@/types/tooth';
import { InitialToothStatesMap } from '@/types/initial-tooth-state';

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
  initialToothStates?: InitialToothStatesMap;
  isDigitalScan?: boolean;
  doctorId?: string;
  status?: string;

  // Case type fields
  tipoCaso?: CaseType | null;
  motivoGarantia?: string;
  seDevuelveTrabajoOriginal?: boolean;

  // Digital scan fields
  escanerUtilizado?: ScannerType | null;
  otroEscaner?: string;

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
  initialToothStates: InitialToothStatesMap;
  isDigitalScan: boolean;
  doctorId: string;

  // Case type fields
  tipoCaso: CaseType | null;
  motivoGarantia: string;
  seDevuelveTrabajoOriginal: boolean;

  // Digital scan fields
  escanerUtilizado: ScannerType | null;
  otroEscaner: string;

  // Order-level fields (shared)
  materialSent?: Record<string, boolean>;
  submissionType: SubmissionType | null;
  oclusionDiseno?: OcclusionInfo;
  articulatedBy: ArticulatedBy | null;

  // Urgent order
  isUrgent?: boolean;
}
