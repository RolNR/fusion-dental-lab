import {
  ScanType,
  CaseType,
  WorkType,
  RestorationType,
  ScannerType,
  SiliconType,
  SubmissionType,
  ArticulatedBy,
} from '@prisma/client';
import { OcclusionInfo, ColorInfo, ImplantInfo } from '@/types/order';

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
  material?: string;
  materialBrand?: string;
  color?: string;
  scanType?: ScanType | null;
  doctorId?: string;
  status?: string;
  // New fields
  tipoCaso?: CaseType | null;
  motivoGarantia?: string;
  seDevuelveTrabajoOriginal?: boolean;
  tipoTrabajo?: WorkType | null;
  tipoRestauracion?: RestorationType | null;
  escanerUtilizado?: ScannerType | null;
  otroEscaner?: string;
  tipoSilicon?: SiliconType | null;
  notaModeloFisico?: string;
  trabajoSobreImplante?: boolean;
  informacionImplante?: ImplantInfo;
  materialSent?: Record<string, boolean>;
  submissionType?: SubmissionType | null;
  oclusionDiseno?: OcclusionInfo;
  colorInfo?: ColorInfo;
  articulatedBy?: ArticulatedBy | null;
}

export interface OrderFormState {
  patientName: string;
  patientId: string;
  description: string;
  notes: string;
  fechaEntregaDeseada: string;
  aiPrompt: string;
  teethNumbers: string;
  material: string;
  materialBrand: string;
  color: string;
  scanType: ScanType | null;
  doctorId: string;
  tipoCaso: CaseType;
  motivoGarantia: string;
  seDevuelveTrabajoOriginal: boolean;
  tipoTrabajo: WorkType;
  tipoRestauracion: RestorationType | null;
  escanerUtilizado: ScannerType | null;
  otroEscaner: string;
  tipoSilicon: SiliconType | null;
  notaModeloFisico: string;
  trabajoSobreImplante: boolean;
  informacionImplante?: ImplantInfo;
  materialSent?: Record<string, boolean>;
  submissionType: SubmissionType | null;
  oclusionDiseno?: OcclusionInfo;
  colorInfo?: ColorInfo;
  articulatedBy: ArticulatedBy | null;
}
