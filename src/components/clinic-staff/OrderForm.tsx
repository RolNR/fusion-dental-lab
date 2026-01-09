'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScanType } from '@prisma/client';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { Doctor } from '@/types/user';
import { getScanTypeOptions } from '@/lib/scanTypeUtils';
import { CaseTypeSection } from './order-form/CaseTypeSection';
import { WorkTypeSection } from './order-form/WorkTypeSection';
import { ImpressionExtendedSection } from './order-form/ImpressionExtendedSection';
import { OcclusionSection } from './order-form/OcclusionSection';
import { MaterialSentSection } from './order-form/MaterialSentSection';
import { ColorExtendedSection } from './order-form/ColorExtendedSection';
import { SubmissionTypeSection } from './order-form/SubmissionTypeSection';
import { ImplantSection } from './order-form/ImplantSection';
import { OrderFormProps } from './order-form/OrderForm.types';
import {
  fetchCurrentDoctor,
  fetchDoctors,
  saveOrder as saveOrderUtil,
  initializeFormState,
} from './order-form/orderFormUtils';

export function OrderForm({ initialData, orderId, role, onSuccess }: OrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentDoctorName, setCurrentDoctorName] = useState<string>('');

  const [formData, setFormData] = useState(initializeFormState(initialData));

  // File upload state for digital scans
  const [upperFile, setUpperFile] = useState<File | null>(null);
  const [lowerFile, setLowerFile] = useState<File | null>(null);
  const [biteFile, setBiteFile] = useState<File | null>(null);

  // Fetch current user info if doctor, or doctors list if assistant
  useEffect(() => {
    if (role === 'doctor') {
      fetchCurrentDoctor().then(setCurrentDoctorName);
    } else if (role === 'assistant') {
      fetchDoctors().then((doctors) => {
        setDoctors(doctors);
        // Set first doctor as default if creating new order
        if (!orderId && doctors.length > 0) {
          setFormData(prev => ({ ...prev, doctorId: doctors[0].id }));
        }
      });
    }
  }, [role, orderId]);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveOrder(false);
  };

  const handleSubmitForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveOrder(true);
  };

  const handleSaveOrder = async (submitForReview: boolean) => {
    setError(null);
    setIsLoading(true);

    try {
      const files = {
        upperFile,
        lowerFile,
        biteFile,
      };

      await saveOrderUtil(
        orderId,
        role,
        formData,
        files,
        submitForReview,
        onSuccess,
        router
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const isEditingDraft = orderId && initialData?.status === 'DRAFT';
  const isEditingNeedsInfo = orderId && initialData?.status === 'NEEDS_INFO';
  const canSubmit = !orderId || isEditingDraft || isEditingNeedsInfo;

  return (
    <form onSubmit={handleSaveDraft} className="space-y-4 sm:space-y-6">
      {error && (
        <div className="rounded-lg bg-danger/10 p-3 sm:p-4 text-sm sm:text-base text-danger">
          {error}
        </div>
      )}

      {role === 'doctor' && (
        <Select
          label="Doctor"
          id="doctorId"
          value=""
          onChange={() => {}}
          disabled={true}
        >
          <option value="">{currentDoctorName || 'Cargando...'}</option>
        </Select>
      )}

      {role === 'assistant' && (
        <div>
          <Select
            label="Doctor"
            id="doctorId"
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
            required
            disabled={isLoading || !!orderId || doctors.length === 0}
          >
            <option value="">Seleccionar doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} ({doctor.email})
              </option>
            ))}
          </Select>
          {doctors.length === 0 && (
            <p className="mt-2 text-sm text-warning">
              No tienes doctores asignados. Contacta al administrador de la clínica para que te asigne doctores.
            </p>
          )}
        </div>
      )}

      {/* AI Prompt - Highlighted Section */}
      <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 sm:p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="rounded-full bg-primary/10 p-2">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Llenar formulario con IA
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Describe la orden en lenguaje natural y la IA completará automáticamente los campos del formulario
            </p>
          </div>
        </div>
        <Textarea
          label=""
          id="aiPrompt"
          value={formData.aiPrompt}
          onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
          disabled={isLoading}
          rows={4}
          placeholder="Ejemplo: 'Corona de zirconia para diente 11, color A2, escaneado con iTero, entregar en 5 días...'"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-2">
        <Input
          label="Nombre del Paciente"
          type="text"
          value={formData.patientName}
          onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
          required
          disabled={isLoading}
          placeholder="Juan Pérez"
        />

        <Input
          label="Fecha de Entrega Deseada"
          type="date"
          value={formData.fechaEntregaDeseada}
          onChange={(e) => setFormData({ ...formData, fechaEntregaDeseada: e.target.value })}
          disabled={isLoading}
          helperText="Fecha en que necesitas el trabajo completado"
        />
      </div>

      {/* Case Type Section */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-6">
        <CaseTypeSection
          tipoCaso={formData.tipoCaso ?? undefined}
          motivoGarantia={formData.motivoGarantia}
          seDevuelveTrabajoOriginal={formData.seDevuelveTrabajoOriginal}
          onChange={(updates) => setFormData({ ...formData, ...updates })}
        />
      </div>

      {/* Work Type Section */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-6">
        <WorkTypeSection
          tipoTrabajo={formData.tipoTrabajo ?? undefined}
          tipoRestauracion={formData.tipoRestauracion ?? undefined}
          onChange={(updates) => setFormData({ ...formData, ...updates })}
        />
      </div>

      <Textarea
        label="Descripción"
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        disabled={isLoading}
        rows={3}
        placeholder="Descripción del trabajo dental..."
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-2">
        <Input
          label="Números de Dientes"
          type="text"
          value={formData.teethNumbers}
          onChange={(e) => setFormData({ ...formData, teethNumbers: e.target.value })}
          disabled={isLoading}
          placeholder="11, 12, 21, 22"
        />

        <Select
          label="Tipo de Escaneo"
          id="scanType"
          value={formData.scanType || ''}
          onChange={(e) => setFormData({ ...formData, scanType: e.target.value ? e.target.value as ScanType : null })}
          disabled={isLoading}
        >
          {getScanTypeOptions().map((option) => (
            <option key={option.value || 'none'} value={option.value || ''}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Impression Extended Section */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-6">
        <ImpressionExtendedSection
          scanType={formData.scanType ?? undefined}
          escanerUtilizado={formData.escanerUtilizado ?? undefined}
          otroEscaner={formData.otroEscaner}
          tipoSilicon={formData.tipoSilicon ?? undefined}
          notaModeloFisico={formData.notaModeloFisico}
          onChange={(field, value) => setFormData({ ...formData, [field]: value })}
        />
      </div>

      {/* Digital Scan File Uploads */}
      {formData.scanType === ScanType.DIGITAL_SCAN && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h3 className="text-lg font-semibold text-foreground">
            Archivos de Escaneo Digital
          </h3>
          <p className="text-sm text-muted-foreground -mt-2">
            Sube los archivos STL o PLY de los escaneos. Los archivos superior, inferior y de mordida son obligatorios.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <FileUpload
              label="Escaneo Superior (Upper)"
              accept=".stl,.ply"
              maxSize={50}
              value={upperFile}
              onChange={setUpperFile}
              required
            />

            <FileUpload
              label="Escaneo Inferior (Lower)"
              accept=".stl,.ply"
              maxSize={50}
              value={lowerFile}
              onChange={setLowerFile}
              required
            />

            <FileUpload
              label="Escaneo de Mordida (Bite)"
              accept=".stl,.ply"
              maxSize={50}
              value={biteFile}
              onChange={setBiteFile}
              required
            />
          </div>
        </div>
      )}

      {/* Implant Section */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-6">
        <ImplantSection
          trabajoSobreImplante={formData.trabajoSobreImplante}
          informacionImplante={formData.informacionImplante}
          onChange={(updates) => setFormData({ ...formData, ...updates })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
        <Input
          label="Material"
          type="text"
          value={formData.material}
          onChange={(e) => setFormData({ ...formData, material: e.target.value })}
          disabled={isLoading}
          placeholder="Zirconia, Porcelana..."
        />

        <Input
          label="Marca del Material"
          type="text"
          value={formData.materialBrand}
          onChange={(e) => setFormData({ ...formData, materialBrand: e.target.value })}
          disabled={isLoading}
          placeholder="IPS e.max..."
        />

        <Input
          label="Color"
          type="text"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          disabled={isLoading}
          placeholder="A2, B1..."
        />
      </div>

      {/* Occlusion Section */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-6">
        <OcclusionSection
          oclusionDiseno={formData.oclusionDiseno}
          onChange={(value) => setFormData({ ...formData, oclusionDiseno: value })}
        />
      </div>

      {/* Material Sent Section */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-6">
        <MaterialSentSection
          materialSent={formData.materialSent}
          onChange={(value) => setFormData({ ...formData, materialSent: value })}
        />
      </div>

      {/* Color Extended Section */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-6">
        <ColorExtendedSection
          colorInfo={formData.colorInfo}
          onChange={(value) => setFormData({ ...formData, colorInfo: value })}
        />
      </div>

      {/* Submission Type Section */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-6">
        <SubmissionTypeSection
          submissionType={formData.submissionType ?? undefined}
          articulatedBy={formData.articulatedBy ?? undefined}
          onChange={(field, value) => setFormData({ ...formData, [field]: value })}
        />
      </div>

      <Textarea
        label="Notas Adicionales"
        id="notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        disabled={isLoading}
        rows={4}
        placeholder="Instrucciones especiales, observaciones..."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button
          type="submit"
          variant="secondary"
          isLoading={isLoading}
          fullWidth
          className="sm:w-auto"
        >
          {orderId ? 'Guardar Cambios' : 'Guardar Borrador'}
        </Button>
        {canSubmit && (
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmitForReview}
            isLoading={isLoading}
            fullWidth
            className="sm:w-auto"
          >
            {orderId ? 'Guardar y Enviar' : 'Enviar para Revisión'}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isLoading}
          fullWidth
          className="sm:w-auto"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
