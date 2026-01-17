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
import { loadDashboardAIData } from '@/lib/dashboardAIDataLoader';
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
import { OrderFormProps, OrderFormState } from './order-form/OrderForm.types';
import {
  fetchCurrentDoctor,
  fetchDoctors,
  saveOrder as saveOrderUtil,
  initializeFormState,
  parseAIPrompt,
  parseTeethNumbers,
  initializeTeethData,
  getValidSelectedTooth,
} from './order-form/orderFormUtils';
import { AdditionalNotesSection } from './order-form/AdditionalNotesSection';
import { OrderReviewModal } from '@/components/orders/OrderReviewModal';
import { ValidationErrorSummary } from '@/components/orders/ValidationErrorSummary';
import {
  parseValidationError,
  groupErrorsBySection,
  ValidationErrorDetail,
  enrichErrorsWithToothNumbers,
} from '@/types/validation';
import { ToothData } from '@/types/tooth';
import { ToothConfigurationSection } from './order-form/ToothConfigurationSection';
import { AIPromptInput } from './order-form/AIPromptInput';
import type { AISuggestion } from '@/types/ai-suggestions';

export function OrderForm({ initialData, orderId, role, onSuccess }: OrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Map<string, ValidationErrorDetail[]>>(
    new Map()
  );
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [teethWithErrors, setTeethWithErrors] = useState<Set<string>>(new Set());
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentDoctorName, setCurrentDoctorName] = useState<string>('');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFullForm, setShowFullForm] = useState(!!orderId); // Show full form only when editing existing order

  // Refs for scrolling to sections
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const processedResultsRef = useRef<Set<string>>(new Set());

  const [formData, setFormData] = useState(initializeFormState(initialData));

  // File upload state for digital scans
  const [upperFile, setUpperFile] = useState<File | null>(null);
  const [lowerFile, setLowerFile] = useState<File | null>(null);

  // File upload state for mouth photos
  const [mouthPhotoFile, setMouthPhotoFile] = useState<File | null>(null);

  // Per-tooth configuration state
  const [selectedToothNumber, setSelectedToothNumber] = useState<string | null>(null);
  const [teethData, setTeethData] = useState<Map<string, ToothData>>(new Map());
  const [teethNumbers, setTeethNumbers] = useState<string[]>([]);

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

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

  // Initialize teeth data from initialData when editing
  useEffect(() => {
    if (initialData?.teeth && initialData.teeth.length > 0) {
      const initialTeethMap = new Map<string, ToothData>();
      initialData.teeth.forEach((tooth) => {
        initialTeethMap.set(tooth.toothNumber, tooth);
      });
      setTeethData(initialTeethMap);
    }
  }, [initialData]);

  // Parse teethNumbers and manage tooth selection
  useEffect(() => {
    const parsed = parseTeethNumbers(formData.teethNumbers);
    setTeethNumbers(parsed);
    setTeethData((prev) => initializeTeethData(parsed, prev));
    setSelectedToothNumber((prev) => getValidSelectedTooth(prev, parsed));
  }, [formData.teethNumbers]);

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

          // Process only new results starting from resultIndex
          // Use content-based deduplication (without index) for Samsung devices
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const transcript = event.results[i][0].transcript.trim();

              // Use only transcript content (no index) to detect duplicates on Samsung
              if (transcript && !processedResultsRef.current.has(transcript)) {
                processedResultsRef.current.add(transcript);
                finalTranscript += transcript + ' ';
              }
            }
          }

          if (finalTranscript) {
            setFormData((prev) => ({
              ...prev,
              aiPrompt: (prev.aiPrompt + ' ' + finalTranscript).trim(),
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
          processedResultsRef.current.clear(); // Reset for next session
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

  // Load dashboard AI data on mount
  useEffect(() => {
    const dashboardData = loadDashboardAIData();
    if (dashboardData) {
      // Update form data
      setFormData((prev) => ({
        ...prev,
        ...dashboardData.formData,
      }));

      // Update teeth data
      if (dashboardData.teethData.size > 0) {
        setTeethData(dashboardData.teethData);
        setTeethNumbers(dashboardData.teethNumbers);

        if (dashboardData.selectedToothNumber) {
          setSelectedToothNumber(dashboardData.selectedToothNumber);
        }
      }

      // Load AI suggestions
      if (dashboardData.suggestions && dashboardData.suggestions.length > 0) {
        setAiSuggestions(dashboardData.suggestions);
      }

      // Show full form and review modal
      if (dashboardData.shouldShowFullForm) {
        setShowFullForm(true);
      }

      if (dashboardData.shouldShowReviewModal) {
        // Delay to ensure state is updated
        setTimeout(() => {
          setShowReviewModal(true);
        }, 100);
      }
    }
  }, []);

  const handleToggleSpeechRecognition = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      processedResultsRef.current.clear(); // Reset for next session
    } else {
      try {
        processedResultsRef.current.clear(); // Reset when starting
        recognitionRef.current.start();
        setIsListening(true);
        setAiError(null);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setAiError('Error al iniciar el reconocimiento de voz');
      }
    }
  };

  // Handle adding/removing teeth from the odontogram
  const handleToothToggle = (toothNumber: string) => {
    setTeethNumbers((prev) => {
      if (prev.includes(toothNumber)) {
        // Remove tooth
        const updated = prev.filter((t) => t !== toothNumber);

        // Also remove from teethData
        setTeethData((prevData) => {
          const newData = new Map(prevData);
          newData.delete(toothNumber);
          return newData;
        });

        // Clear selection if removing current tooth
        if (selectedToothNumber === toothNumber) {
          setSelectedToothNumber(null);
        }

        return updated;
      } else {
        // Add tooth
        const updated = [...prev, toothNumber].sort((a, b) => {
          // Sort numerically by FDI notation
          return parseInt(a, 10) - parseInt(b, 10);
        });

        // Initialize empty ToothData
        setTeethData((prevData) => {
          const newData = new Map(prevData);
          newData.set(toothNumber, { toothNumber });
          return newData;
        });

        // Auto-select if no tooth selected
        if (!selectedToothNumber) {
          setSelectedToothNumber(toothNumber);
        }

        return updated;
      }
    });

    // Update the formData.teethNumbers string (comma-separated)
    setFormData((prev) => {
      const currentTeeth = teethNumbers.includes(toothNumber)
        ? teethNumbers.filter((t) => t !== toothNumber)
        : [...teethNumbers, toothNumber].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      return {
        ...prev,
        teethNumbers: currentTeeth.join(', '),
      };
    });
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

  const handleSaveAsDraft = async () => {
    // Called when user clicks "Save as Draft" in the review modal
    await handleSaveOrder(false);
    setShowReviewModal(false);
  };

  const handleSaveOrder = async (submitForReview: boolean) => {
    setError(null);
    setValidationErrors(new Map());
    setShowErrorSummary(false);

    // Set appropriate loading state
    if (submitForReview) {
      setIsLoading(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      const files = {
        upperFile,
        lowerFile,
        mouthPhotoFile,
      };

      // Convert teethData Map to array
      const teethArray = Array.from(teethData.values());

      // Merge teeth array into formData
      const dataToSave = {
        ...formData,
        teeth: teethArray.length > 0 ? teethArray : undefined,
      };

      await saveOrderUtil(orderId, role, dataToSave, files, submitForReview, onSuccess, router);
    } catch (err) {
if (!(err instanceof Error)) {
        setError('Error desconocido');
        return;
      }

      // When saving as draft, ignore validation errors for missing required fields
      if (!submitForReview) {
        const validationError = parseValidationError(err);
        // If it's a validation error, suppress it when saving as draft
        if (validationError || err.message.includes('archivos STL/PLY obligatorios')) {
          // Silently ignore validation errors when saving as draft
          return;
        }
        // Show non-validation errors (e.g., network errors)
        setError(err.message);
        return;
      }

      // When submitting for review, show all validation errors
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
        // Enrich errors with tooth numbers from teethData
        const teethArray = Array.from(teethData.values());
        const enrichedDetails = enrichErrorsWithToothNumbers(validationError.details, teethArray);

        // Extract teeth with errors
        const errorsSet = new Set<string>();
        enrichedDetails.forEach((detail) => {
          if (detail.toothNumber) {
            errorsSet.add(detail.toothNumber);
          }
        });
        setTeethWithErrors(errorsSet);

        const grouped = groupErrorsBySection(enrichedDetails);
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
      setIsSavingDraft(false);
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
      const { confirmedValues, suggestions } = await parseAIPrompt(formData.aiPrompt);

      // Extract teeth array if present (AI response may include teeth)
      const parsedData = confirmedValues as Partial<OrderFormState> & { teeth?: ToothData[] };
      const { teeth, ...otherData } = parsedData;

      // Auto-fill form fields with parsed data (excluding teeth)
      setFormData((prev) => ({
        ...prev,
        ...otherData,
        // Keep existing values if AI didn't provide them
        patientName: otherData.patientName || prev.patientName,
        doctorId: prev.doctorId, // Don't override doctor selection
      }));

      // If teeth array exists, convert it to Map and update teethData
      if (teeth && Array.isArray(teeth) && teeth.length > 0) {
        const teethMap = new Map<string, ToothData>();
        const toothNumbersArray: string[] = [];

        teeth.forEach((tooth: ToothData) => {
          if (tooth.toothNumber) {
            teethMap.set(tooth.toothNumber, tooth);
            toothNumbersArray.push(tooth.toothNumber);
          }
        });

        setTeethData(teethMap);
        setTeethNumbers(toothNumbersArray); // Update the array state for odontogram

        // Auto-select the first tooth if none selected
        if (!selectedToothNumber && toothNumbersArray.length > 0) {
          setSelectedToothNumber(toothNumbersArray[0]);
        }

        // Also extract tooth numbers to teethNumbers field (comma-separated string)
        const toothNumbers = toothNumbersArray.join(', ');
        setFormData((prev) => ({
          ...prev,
          teethNumbers: toothNumbers,
        }));
      }

      // Store AI suggestions
      setAiSuggestions(suggestions);

      // Show full form after successful AI processing
      setShowFullForm(true);

      // Open review modal immediately after successful AI processing
      setShowReviewModal(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error al procesar con IA');
      // Show full form even on error so user can manually fill it
      setShowFullForm(true);
    } finally {
      setIsParsingAI(false);
    }
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    if (suggestion.category === 'order') {
      // Apply suggestion to order-level field (handles nested paths like "colorInfo.shadeType")
      setFormData((prev) => {
        const fieldPath = suggestion.field.split('.');

        if (fieldPath.length === 1) {
          // Simple field (e.g., "scanType")
          return {
            ...prev,
            [suggestion.field]: suggestion.value,
          };
        } else {
          // Nested field (e.g., "colorInfo.shadeType")
          const result = { ...prev };
          let current: Record<string, unknown> = result;

          // Navigate to the nested object, creating it if needed
          for (let i = 0; i < fieldPath.length - 1; i++) {
            const key = fieldPath[i];
            if (!current[key] || typeof current[key] !== 'object') {
              current[key] = {};
            }
            current[key] = { ...(current[key] as Record<string, unknown>) };
            current = current[key] as Record<string, unknown>;
          }

          // Set the final value
          current[fieldPath[fieldPath.length - 1]] = suggestion.value;
          return result as OrderFormState;
        }
      });
    } else if (suggestion.category === 'tooth' && suggestion.toothNumber) {
      // Check if the tooth exists in teethNumbers
      if (!teethNumbers.includes(suggestion.toothNumber)) {
        // TODO: Add toast notification warning
        console.warn(`Primero selecciona el diente ${suggestion.toothNumber}`);
        return;
      }

      // Apply suggestion to tooth-specific field (handles nested paths)
      setTeethData((prev) => {
        const newData = new Map(prev);
        const toothData = newData.get(suggestion.toothNumber!) || { toothNumber: suggestion.toothNumber! };

        const fieldPath = suggestion.field.split('.');

        if (fieldPath.length === 1) {
          // Simple field
          newData.set(suggestion.toothNumber!, {
            ...toothData,
            [suggestion.field]: suggestion.value,
          });
        } else {
          // Nested field (e.g., "colorInfo.shadeType")
          const updatedTooth = { ...toothData };
          let current: Record<string, unknown> = updatedTooth;

          for (let i = 0; i < fieldPath.length - 1; i++) {
            const key = fieldPath[i];
            if (!current[key] || typeof current[key] !== 'object') {
              current[key] = {};
            }
            current[key] = { ...(current[key] as Record<string, unknown>) };
            current = current[key] as Record<string, unknown>;
          }

          current[fieldPath[fieldPath.length - 1]] = suggestion.value;
          newData.set(suggestion.toothNumber!, updatedTooth as ToothData);
        }

        return newData;
      });
    }

    // Remove applied suggestion from the list
    setAiSuggestions((prev) => prev.filter((s) => s !== suggestion));

    // Log success (TODO: Add toast notification)
    console.log(`Campo "${suggestion.label}" actualizado con valor:`, suggestion.value);
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

      {showFullForm && role === 'doctor' && (
        <Select label="Doctor" id="doctorId" value="" onChange={() => {}} disabled={true}>
          <option value="">{currentDoctorName || 'Cargando...'}</option>
        </Select>
      )}

      {showFullForm && role === 'assistant' && (
        <div>
          <Select
            label="Doctor"
            id="doctorId"
            value={formData.doctorId}
            onChange={(e) => setFormData((prev) => ({ ...prev, doctorId: e.target.value }))}
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
      <AIPromptInput
        value={formData.aiPrompt}
        onChange={(value) => setFormData((prev) => ({ ...prev, aiPrompt: value }))}
        onParse={handleParseAIPrompt}
        isParsingAI={isParsingAI}
        isLoading={isLoading}
        aiError={aiError}
        speechSupported={speechSupported}
        isListening={isListening}
        onToggleSpeechRecognition={handleToggleSpeechRecognition}
        showFullForm={showFullForm}
        onShowFullForm={() => setShowFullForm(true)}
      />

      {/* Show full form only after AI processing or when editing */}
      {showFullForm && (
        <>
          {/* Order Info Section */}
          <OrderInfoSection
            ref={(el) => registerSectionRef('patient', el)}
            patientName={formData.patientName}
            fechaEntregaDeseada={formData.fechaEntregaDeseada}
            onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
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
        onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
        hasErrors={getSectionErrorInfo('caseType').hasErrors}
        errorCount={getSectionErrorInfo('caseType').errorCount}
      />

      {/* Work Type Section - Per-tooth configuration */}
      {selectedToothNumber && (
        <WorkTypeSection
          ref={(el) => registerSectionRef('workType', el)}
          tipoTrabajo={teethData.get(selectedToothNumber)?.tipoTrabajo ?? undefined}
          tipoRestauracion={teethData.get(selectedToothNumber)?.tipoRestauracion ?? undefined}
          onChange={(updates) => {
            setTeethData((prev) => {
              const updated = new Map(prev);
              const currentData = updated.get(selectedToothNumber) || { toothNumber: selectedToothNumber };
              updated.set(selectedToothNumber, { ...currentData, ...updates });
              return updated;
            });
          }}
          hasErrors={getSectionErrorInfo('workType').hasErrors}
          errorCount={getSectionErrorInfo('workType').errorCount}
        />
      )}

      {/* Description Section */}
      <DescriptionSection
        ref={(el) => registerSectionRef('notes', el)}
        description={formData.description}
        onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
        disabled={isLoading}
        hasErrors={getSectionErrorInfo('notes').hasErrors}
        errorCount={getSectionErrorInfo('notes').errorCount}
      />

      {/* Tooth Configuration Section (Odontogram) */}
      <div ref={(el) => registerSectionRef('teeth', el)}>
        <ToothConfigurationSection
          teethNumbers={teethNumbers}
          selectedTooth={selectedToothNumber}
          onToothSelect={setSelectedToothNumber}
          onToothToggle={handleToothToggle}
          teethData={teethData}
          onTeethDataChange={setTeethData}
          teethWithErrors={teethWithErrors}
          validationErrors={validationErrors}
        />
      </div>

      {/* Implant Section - Per-tooth configuration */}
      {selectedToothNumber && (
        <ImplantSection
          ref={(el) => registerSectionRef('implant', el)}
          trabajoSobreImplante={teethData.get(selectedToothNumber)?.trabajoSobreImplante}
          informacionImplante={teethData.get(selectedToothNumber)?.informacionImplante ?? undefined}
          onChange={(updates) => {
            setTeethData((prev) => {
              const updated = new Map(prev);
              const currentData = updated.get(selectedToothNumber) || { toothNumber: selectedToothNumber };
              updated.set(selectedToothNumber, { ...currentData, ...updates });
              return updated;
            });
          }}
          hasErrors={getSectionErrorInfo('implant').hasErrors}
          errorCount={getSectionErrorInfo('implant').errorCount}
        />
      )}

      {/* Material and Color Section - Per-tooth configuration */}
      {selectedToothNumber && (
        <MaterialAndColorSection
          ref={(el) => registerSectionRef('material', el)}
          material={teethData.get(selectedToothNumber)?.material ?? ''}
          materialBrand={teethData.get(selectedToothNumber)?.materialBrand ?? ''}
          colorInfo={teethData.get(selectedToothNumber)?.colorInfo ?? undefined}
          onMaterialChange={(field, value) => {
            setTeethData((prev) => {
              const updated = new Map(prev);
              const currentData = updated.get(selectedToothNumber) || { toothNumber: selectedToothNumber };
              updated.set(selectedToothNumber, { ...currentData, [field]: value });
              return updated;
            });
          }}
          onColorInfoChange={(value) => {
            setTeethData((prev) => {
              const updated = new Map(prev);
              const currentData = updated.get(selectedToothNumber) || { toothNumber: selectedToothNumber };
              updated.set(selectedToothNumber, { ...currentData, colorInfo: value });
              return updated;
            });
          }}
          disabled={isLoading}
          hasErrors={getSectionErrorInfo('material').hasErrors}
          errorCount={getSectionErrorInfo('material').errorCount}
        />
      )}

      {/* Occlusion Section */}
      <OcclusionSection
        ref={(el) => registerSectionRef('occlusion', el)}
        oclusionDiseno={formData.oclusionDiseno}
        onChange={(value) => setFormData((prev) => ({ ...prev, oclusionDiseno: value }))}
        hasErrors={getSectionErrorInfo('occlusion').hasErrors}
        errorCount={getSectionErrorInfo('occlusion').errorCount}
      />

      {/* Material Sent Section */}
      <MaterialSentSection
        materialSent={formData.materialSent}
        onChange={(value) => setFormData((prev) => ({ ...prev, materialSent: value }))}
      />

     {/* Impression Extended Section */}
      <ImpressionExtendedSection
        ref={(el) => registerSectionRef('impression', el)}
        scanType={formData.scanType ?? undefined}
        escanerUtilizado={formData.escanerUtilizado ?? undefined}
        otroEscaner={formData.otroEscaner}
        tipoSilicon={formData.tipoSilicon ?? undefined}
        notaModeloFisico={formData.notaModeloFisico}
        onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
        disabled={isLoading}
        upperFile={upperFile}
        lowerFile={lowerFile}
        onUpperFileChange={setUpperFile}
        onLowerFileChange={setLowerFile}
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
      
      {/* Submission Type Section */}
      <SubmissionTypeSection
        ref={(el) => registerSectionRef('submission', el)}
        submissionType={formData.submissionType ?? undefined}
        articulatedBy={formData.articulatedBy ?? undefined}
        onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
        hasErrors={getSectionErrorInfo('submission').hasErrors}
        errorCount={getSectionErrorInfo('submission').errorCount}
      />

      <AdditionalNotesSection
        ref={(el) => registerSectionRef('notes', el)}
        additionalNotes={formData.notes}
        onChange={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
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
        </>
      )}

      {/* Order Review Modal */}
      {showReviewModal && (
        <OrderReviewModal
          formData={{
            ...formData,
            teeth: Array.from(teethData.values()),
          }}
          suggestions={aiSuggestions}
          onApplySuggestion={handleApplySuggestion}
          upperFile={upperFile}
          lowerFile={lowerFile}
          mouthPhotoFile={mouthPhotoFile}
          onUpperFileChange={setUpperFile}
          onLowerFileChange={setLowerFile}
          onMouthPhotoFileChange={setMouthPhotoFile}
          orderId={orderId}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowReviewModal(false)}
          onSaveAsDraft={handleSaveAsDraft}
          isSubmitting={isLoading}
          isSavingDraft={isSavingDraft}
        />
      )}
    </form>
  );
}
