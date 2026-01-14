'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { Doctor } from '@/types/user';
import type { SpeechRecognition } from '@/types/speech-recognition';
import { OrderInfoSection } from './order-form/OrderInfoSection';
import { DescriptionSection } from './order-form/DescriptionSection';
import { MouthPhotosSection } from './order-form/MouthPhotosSection';
import { MaterialAndColorSection } from './order-form/MaterialAndColorSection';
import { CaseTypeSection } from './order-form/CaseTypeSection';
import { WorkTypeSection } from './order-form/WorkTypeSection';
import { ImpressionExtendedSection } from './order-form/ImpressionExtendedSection';
import { OcclusionSection } from './order-form/OcclusionSection';
import { MaterialSentSection } from './order-form/MaterialSentSection';
import { SubmissionTypeSection } from './order-form/SubmissionTypeSection';
import { ImplantSection } from './order-form/ImplantSection';
import { OrderFormProps } from './order-form/OrderForm.types';
import { TeethNumberSection } from './order-form/TeethNumberSection';
import {
  fetchCurrentDoctor,
  fetchDoctors,
  saveOrder as saveOrderUtil,
  initializeFormState,
  parseAIPrompt,
} from './order-form/orderFormUtils';
import { AdditionalNotesSection } from './order-form/AdditionalNotesSection';
import { OrderReviewModal } from '@/components/orders/OrderReviewModal';
import { ValidationErrorSummary } from '@/components/orders/ValidationErrorSummary';
import {
  parseValidationError,
  groupErrorsBySection,
  ValidationErrorDetail,
} from '@/types/validation';

export function OrderForm({ initialData, orderId, role, onSuccess }: OrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Map<string, ValidationErrorDetail[]>>(
    new Map()
  );
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentDoctorName, setCurrentDoctorName] = useState<string>('');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Refs for scrolling to sections
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [formData, setFormData] = useState(initializeFormState(initialData));

  // File upload state for digital scans
  const [upperFile, setUpperFile] = useState<File | null>(null);
  const [lowerFile, setLowerFile] = useState<File | null>(null);
  const [biteFile, setBiteFile] = useState<File | null>(null);

  // File upload state for mouth photos
  const [mouthPhotoFile, setMouthPhotoFile] = useState<File | null>(null);

  // Fetch current user info if doctor, or doctors list if assistant
  useEffect(() => {
    if (role === 'doctor') {
      fetchCurrentDoctor().then(setCurrentDoctorName);
    } else if (role === 'assistant') {
      fetchDoctors().then((doctors) => {
        setDoctors(doctors);
        // Set first doctor as default if creating new order
        if (!orderId && doctors.length > 0) {
          setFormData((prev) => ({ ...prev, doctorId: doctors[0].id }));
        }
      });
    }
  }, [role, orderId]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES'; // Spanish language

        recognition.onresult = (event) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }

          if (finalTranscript) {
            setFormData((prev) => ({
              ...prev,
              aiPrompt: prev.aiPrompt + finalTranscript,
            }));
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setAiError(
              'Permiso de micrófono denegado. Por favor, habilita el micrófono en la configuración del navegador.'
            );
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleToggleSpeechRecognition = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setAiError(null);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setAiError('Error al iniciar el reconocimiento de voz');
      }
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveOrder(false);
  };

  const handleSubmitForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    // Show review modal instead of immediately submitting
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = async () => {
    // Called when user confirms in the review modal
    await handleSaveOrder(true);
    setShowReviewModal(false);
  };

  const handleSaveOrder = async (submitForReview: boolean) => {
    setError(null);
    setValidationErrors(new Map());
    setShowErrorSummary(false);
    setIsLoading(true);

    try {
      const files = {
        upperFile,
        lowerFile,
        biteFile,
        mouthPhotoFile,
      };

      await saveOrderUtil(orderId, role, formData, files, submitForReview, onSuccess, router);
    } catch (err) {
if (!(err instanceof Error)) {
        setError('Error desconocido');
        return;
      }

      // Check if it's a file validation error (client-side)
      if (err.message.includes('archivos STL/PLY obligatorios')) {
        const grouped = new Map();
        grouped.set('impression', [
          {
            field: 'scanType',
            message: err.message,
          },
        ]);
        setValidationErrors(grouped);
        setShowErrorSummary(true);
        setError('Hay errores en el formulario');

        setTimeout(() => scrollToSection('impression'), 100);
        return;
      }

      // Check if it's a validation error with details
      const validationError = parseValidationError(err);

      if (validationError) {
        const grouped = groupErrorsBySection(validationError.details);
        setValidationErrors(grouped);
        setShowErrorSummary(true);
        setError(validationError.message);

        // Scroll to first error section
        const firstSection = Array.from(grouped.keys())[0];
        if (firstSection) {
          setTimeout(() => scrollToSection(firstSection), 100);
        }
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current.get(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add a small offset for better visibility
      setTimeout(() => {
        window.scrollBy({ top: -100, behavior: 'smooth' });
      }, 300);
    }
  };

  const registerSectionRef = (sectionId: string, element: HTMLDivElement | null) => {
    if (element) {
      sectionRefs.current.set(sectionId, element);
    } else {
      sectionRefs.current.delete(sectionId);
    }
  };

  const getSectionErrorInfo = (sectionId: string) => {
    const errors = validationErrors.get(sectionId);
    const info = {
      hasErrors: !!errors && errors.length > 0,
      errorCount: errors?.length || 0,
    };
    return info;
  };

  const handleParseAIPrompt = async () => {
    if (!formData.aiPrompt || formData.aiPrompt.trim().length === 0) {
      setAiError('Por favor escribe una descripción de la orden');
      return;
    }

    setAiError(null);
    setIsParsingAI(true);

    try {
      const parsedData = await parseAIPrompt(formData.aiPrompt);

      // Auto-fill form fields with parsed data
      setFormData((prev) => ({
        ...prev,
        ...parsedData,
        // Keep existing values if AI didn't provide them
        patientName: parsedData.patientName || prev.patientName,
        doctorId: prev.doctorId, // Don't override doctor selection
      }));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error al procesar con IA');
    } finally {
      setIsParsingAI(false);
    }
  };

  const isEditingDraft = orderId && initialData?.status === 'DRAFT';
  const isEditingNeedsInfo = orderId && initialData?.status === 'NEEDS_INFO';
  const canSubmit = !orderId || isEditingDraft || isEditingNeedsInfo;

  return (
    <form onSubmit={handleSaveDraft} className="space-y-4 sm:space-y-6">
      {/* Validation Error Summary */}
      {showErrorSummary && validationErrors.size > 0 && (
        <ValidationErrorSummary
          errorsBySection={validationErrors}
          onSectionClick={scrollToSection}
          onDismiss={() => setShowErrorSummary(false)}
        />
      )}

      {/* Generic Error (fallback for non-validation errors) */}
      {error && !showErrorSummary && (
        <div className="rounded-lg bg-danger/10 p-3 sm:p-4 text-sm sm:text-base text-danger">
          {error}
        </div>
      )}

      {role === 'doctor' && (
        <Select label="Doctor" id="doctorId" value="" onChange={() => {}} disabled={true}>
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
              No tienes doctores asignados. Contacta al administrador de la clínica para que te
              asigne doctores.
            </p>
          )}
        </div>
      )}

      {/* AI Prompt - Highlighted Section */}
      <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 sm:p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="rounded-full bg-primary/10 p-2">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Llenar formulario con IA</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Describe la orden en lenguaje natural y la IA completará automáticamente los campos
              del formulario
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <Textarea
            label=""
            id="aiPrompt"
            value={formData.aiPrompt}
            onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
            disabled={isLoading || isParsingAI}
            rows={4}
            placeholder="Ejemplo: 'Corona de zirconia para diente 11, color A2, escaneado con iTero, entregar en 5 días...'"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="primary"
              onClick={handleParseAIPrompt}
              isLoading={isParsingAI}
              disabled={isLoading || !formData.aiPrompt || formData.aiPrompt.trim().length === 0}
              className="w-full sm:w-auto"
            >
              {isParsingAI ? 'Procesando con IA...' : 'Procesar con IA'}
            </Button>
            {speechSupported && (
              <Button
                type="button"
                variant={isListening ? 'danger' : 'secondary'}
                onClick={handleToggleSpeechRecognition}
                disabled={isLoading || isParsingAI}
                className="w-full sm:w-auto"
              >
                {isListening ? (
                  <>
                    <Icons.micOff className="h-4 w-4 mr-2" />
                    <span>Detener</span>
                  </>
                ) : (
                  <>
                    <Icons.mic className="h-4 w-4 mr-2" />
                    <span>Dictar</span>
                  </>
                )}
              </Button>
            )}
            {!speechSupported && (
              <p className="text-sm text-muted-foreground">
                Reconocimiento de voz no disponible en este navegador
              </p>
            )}
          </div>
          {aiError && <p className="text-sm text-danger font-medium">{aiError}</p>}
        </div>
      </div>

      {/* Order Info Section */}
      <OrderInfoSection
        ref={(el) => registerSectionRef('patient', el)}
        patientName={formData.patientName}
        fechaEntregaDeseada={formData.fechaEntregaDeseada}
        onChange={(field, value) => setFormData({ ...formData, [field]: value })}
        disabled={isLoading}
        hasErrors={getSectionErrorInfo('patient').hasErrors}
        errorCount={getSectionErrorInfo('patient').errorCount}
      />

      {/* Case Type Section */}
      <CaseTypeSection
        ref={(el) => registerSectionRef('caseType', el)}
        tipoCaso={formData.tipoCaso ?? undefined}
        motivoGarantia={formData.motivoGarantia}
        seDevuelveTrabajoOriginal={formData.seDevuelveTrabajoOriginal}
        onChange={(updates) => setFormData({ ...formData, ...updates })}
        hasErrors={getSectionErrorInfo('caseType').hasErrors}
        errorCount={getSectionErrorInfo('caseType').errorCount}
      />

      {/* Work Type Section */}
      <WorkTypeSection
        ref={(el) => registerSectionRef('workType', el)}
        tipoTrabajo={formData.tipoTrabajo ?? undefined}
        tipoRestauracion={formData.tipoRestauracion ?? undefined}
        onChange={(updates) => setFormData({ ...formData, ...updates })}
        hasErrors={getSectionErrorInfo('workType').hasErrors}
        errorCount={getSectionErrorInfo('workType').errorCount}
      />

      {/* Description Section */}
      <DescriptionSection
        ref={(el) => registerSectionRef('notes', el)}
        description={formData.description}
        onChange={(value) => setFormData({ ...formData, description: value })}
        disabled={isLoading}
        hasErrors={getSectionErrorInfo('notes').hasErrors}
        errorCount={getSectionErrorInfo('notes').errorCount}
      />
      {/* Teeth Number Section */}
      <TeethNumberSection
        ref={(el) => registerSectionRef('teeth', el)}
        teethNumbers={formData.teethNumbers}
        onChange={(field, value) => setFormData({ ...formData, [field]: value })}
        disabled={isLoading}
        hasErrors={getSectionErrorInfo('teeth').hasErrors}
        errorCount={getSectionErrorInfo('teeth').errorCount}
      />

      {/* Impression Extended Section */}
      <ImpressionExtendedSection
        ref={(el) => registerSectionRef('impression', el)}
        scanType={formData.scanType ?? undefined}
        escanerUtilizado={formData.escanerUtilizado ?? undefined}
        otroEscaner={formData.otroEscaner}
        tipoSilicon={formData.tipoSilicon ?? undefined}
        notaModeloFisico={formData.notaModeloFisico}
        onChange={(field, value) => setFormData({ ...formData, [field]: value })}
        disabled={isLoading}
        upperFile={upperFile}
        lowerFile={lowerFile}
        biteFile={biteFile}
        onUpperFileChange={setUpperFile}
        onLowerFileChange={setLowerFile}
        onBiteFileChange={setBiteFile}
        hasErrors={getSectionErrorInfo('impression').hasErrors}
        errorCount={getSectionErrorInfo('impression').errorCount}
      />

      {/* Mouth Photos Section - Optional */}
      <MouthPhotosSection
        value={mouthPhotoFile}
        onChange={setMouthPhotoFile}
        orderId={orderId}
        onUploadComplete={(fileId) => {
          // No action needed after upload for now
        }}
      />

      {/* Implant Section */}
      <ImplantSection
        ref={(el) => registerSectionRef('implant', el)}
        trabajoSobreImplante={formData.trabajoSobreImplante}
        informacionImplante={formData.informacionImplante}
        onChange={(updates) => setFormData({ ...formData, ...updates })}
        hasErrors={getSectionErrorInfo('implant').hasErrors}
        errorCount={getSectionErrorInfo('implant').errorCount}
      />

      {/* Material and Color Section */}
      <MaterialAndColorSection
        ref={(el) => registerSectionRef('material', el)}
        material={formData.material}
        materialBrand={formData.materialBrand}
        colorInfo={formData.colorInfo}
        onMaterialChange={(field, value) => setFormData({ ...formData, [field]: value })}
        onColorInfoChange={(value) => setFormData({ ...formData, colorInfo: value })}
        disabled={isLoading}
        hasErrors={getSectionErrorInfo('material').hasErrors}
        errorCount={getSectionErrorInfo('material').errorCount}
      />

      {/* Occlusion Section */}
      <OcclusionSection
        ref={(el) => registerSectionRef('occlusion', el)}
        oclusionDiseno={formData.oclusionDiseno}
        onChange={(value) => setFormData({ ...formData, oclusionDiseno: value })}
        hasErrors={getSectionErrorInfo('occlusion').hasErrors}
        errorCount={getSectionErrorInfo('occlusion').errorCount}
      />

      {/* Material Sent Section */}
      <MaterialSentSection
        materialSent={formData.materialSent}
        onChange={(value) => setFormData({ ...formData, materialSent: value })}
      />

      {/* Submission Type Section */}
      <SubmissionTypeSection
        ref={(el) => registerSectionRef('submission', el)}
        submissionType={formData.submissionType ?? undefined}
        articulatedBy={formData.articulatedBy ?? undefined}
        onChange={(field, value) => setFormData({ ...formData, [field]: value })}
        hasErrors={getSectionErrorInfo('submission').hasErrors}
        errorCount={getSectionErrorInfo('submission').errorCount}
      />

      <AdditionalNotesSection
        ref={(el) => registerSectionRef('notes', el)}
        additionalNotes={formData.notes}
        onChange={(value) => setFormData({ ...formData, notes: value })}
        hasErrors={getSectionErrorInfo('notes').hasErrors}
        errorCount={getSectionErrorInfo('notes').errorCount}
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

      {/* Order Review Modal */}
      {showReviewModal && (
        <OrderReviewModal
          formData={formData}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowReviewModal(false)}
          isSubmitting={isLoading}
        />
      )}
    </form>
  );
}
