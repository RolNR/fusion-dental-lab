'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Icons } from '@/components/ui/Icons';
import { Doctor } from '@/types/user';
import type { SpeechRecognition } from '@/types/speech-recognition';
import { loadDashboardAIData } from '@/lib/dashboardAIDataLoader';
import { OrderInfoSection } from './order-form/OrderInfoSection';
import { MouthPhotosSection } from './order-form/MouthPhotosSection';
import { CaseTypeSection } from './order-form/CaseTypeSection';
import { DigitalScanSection } from './order-form/DigitalScanSection';
import { OcclusionSection } from './order-form/OcclusionSection';
import { MaterialSentSection } from './order-form/MaterialSentSection';
import { SubmissionTypeSection } from './order-form/SubmissionTypeSection';
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
  uploadFilesToOrder,
} from './order-form/orderFormUtils';
import { AdditionalNotesSection } from './order-form/AdditionalNotesSection';
import { OrderReviewModal } from '@/components/orders/OrderReviewModal';
import { FileUploadProgressModal } from '@/components/orders/FileUploadProgressModal';
import { ValidationErrorSummary } from '@/components/orders/ValidationErrorSummary';
import {
  parseValidationError,
  groupErrorsBySection,
  ValidationErrorDetail,
  enrichErrorsWithToothNumbers,
} from '@/types/validation';
import { ToothData, BridgeDefinition } from '@/types/tooth';
import { OdontogramWizard } from './order-form/wizard';
import { AIPromptInput } from './order-form/AIPromptInput';
import type { AISuggestion } from '@/types/ai-suggestions';
import { InitialToothStatesMap, getToothInitialState } from '@/types/initial-tooth-state';

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
  const shouldRestartRef = useRef(false);

  const [formData, setFormData] = useState(initializeFormState(initialData));

  // Per-tooth configuration state
  const [selectedToothNumber, setSelectedToothNumber] = useState<string | null>(null);
  const [teethData, setTeethData] = useState<Map<string, ToothData>>(new Map());
  const [teethNumbers, setTeethNumbers] = useState<string[]>([]); // All teeth in the order
  const [selectedForConfig, setSelectedForConfig] = useState<string[]>([]); // Teeth currently selected for bulk config
  const [bridges, setBridges] = useState<BridgeDefinition[]>([]); // Bridge definitions

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  // File upload state (max 3 per category)
  const [upperFiles, setUpperFiles] = useState<File[]>([]);
  const [lowerFiles, setLowerFiles] = useState<File[]>([]);
  const [biteFiles, setBiteFiles] = useState<File[]>([]);
  const [photographFiles, setPhotographFiles] = useState<File[]>([]);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  // File upload progress state
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    uploadedCount: 0,
    totalCount: 0,
    currentFileName: '',
    currentProgress: 0,
  });

  // Pre-submission validation state (shown when user tries to submit)
  const [preSubmitErrors, setPreSubmitErrors] = useState<{
    patientName?: string;
    teeth?: string;
    teethIncomplete?: string[];
    digitalScanFiles?: string;
  }>({});

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
    const newTeethData = initializeTeethData(parsed, Array.from(teethData.values()));
    setTeethData(newTeethData);
    setSelectedToothNumber((prev) => getValidSelectedTooth(prev, newTeethData));
  }, [formData.teethNumbers]);

  // Restart recognition after a result (for non-continuous mode)
  const restartRecognition = useCallback(() => {
    if (shouldRestartRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        // Recognition might already be running, ignore
        console.debug('Recognition restart skipped:', error);
      }
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognitionAPI();
        // Use non-continuous mode to avoid Samsung duplicate issues
        // Recognition will auto-restart after each result
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onresult = (event) => {
          // Get the latest result
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript.trim();

          if (result.isFinal && transcript) {
            // Final result - append to the prompt
            setFormData((prev) => ({
              ...prev,
              aiPrompt: prev.aiPrompt ? prev.aiPrompt + ' ' + transcript : transcript,
            }));
          }
        };

        recognition.onerror = (event) => {
          // Ignore no-speech errors when in listening mode (will auto-restart)
          if (event.error === 'no-speech') {
            return;
          }
          console.error('Speech recognition error:', event.error);
          shouldRestartRef.current = false;
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setAiError(
              'Permiso de micrófono denegado. Por favor, habilita el micrófono en la configuración del navegador.'
            );
          }
        };

        recognition.onend = () => {
          // Auto-restart if user hasn't stopped listening
          if (shouldRestartRef.current) {
            // Small delay before restart to prevent rapid cycling
            setTimeout(restartRecognition, 100);
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [restartRecognition]);

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
      shouldRestartRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        shouldRestartRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
        setAiError(null);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        shouldRestartRef.current = false;
        setAiError('Error al iniciar el reconocimiento de voz');
      }
    }
  };

  // Handle adding/removing teeth from the odontogram (X button removes from order)
  const handleToothRemove = (toothNumber: string) => {
    // Remove from order
    setTeethNumbers((prev) => prev.filter((t) => t !== toothNumber));

    // Remove from teethData
    setTeethData((prevData) => {
      const newData = new Map(prevData);
      newData.delete(toothNumber);
      return newData;
    });

    // Remove from selectedForConfig
    setSelectedForConfig((prev) => prev.filter((t) => t !== toothNumber));

    // Update formData.teethNumbers string
    setFormData((prev) => ({
      ...prev,
      teethNumbers: teethNumbers
        .filter((t) => t !== toothNumber)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .join(', '),
    }));
  };

  // Handle clicking on a tooth in the odontogram
  const handleToothToggle = (toothNumber: string) => {
    // Check if tooth is AUSENTE - cannot select missing teeth
    const initialState = getToothInitialState(formData.initialToothStates, toothNumber);
    if (initialState === 'AUSENTE') {
      return; // Cannot select missing teeth
    }

    // Check if tooth is PILAR - auto-set trabajoSobreImplante
    const isPilar = initialState === 'PILAR';

    const isInOrder = teethNumbers.includes(toothNumber);
    const isInSelection = selectedForConfig.includes(toothNumber);

    if (isInOrder) {
      // Tooth is already in order
      if (isInSelection) {
        // Tooth is in current selection - switch to individual mode (select only this tooth)
        setSelectedForConfig([toothNumber]);
      } else {
        // Tooth is in order but not in selection - add to selection
        setSelectedForConfig((prev) =>
          [...prev, toothNumber].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        );
      }
    } else {
      // Add tooth to order AND selection
      const newTeethNumbers = [...teethNumbers, toothNumber].sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10)
      );
      setTeethNumbers(newTeethNumbers);

      // Add to selection
      setSelectedForConfig((prev) =>
        [...prev, toothNumber].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      );

      // Initialize ToothData with default values
      // Auto-set trabajoSobreImplante: true for PILAR teeth
      setTeethData((prevData) => {
        const newData = new Map(prevData);
        newData.set(toothNumber, {
          toothNumber,
          trabajoSobreImplante: isPilar ? true : undefined,
        });
        return newData;
      });

      // Update formData.teethNumbers string
      setFormData((prev) => ({
        ...prev,
        teethNumbers: newTeethNumbers.join(', '),
      }));
    }
  };

  // Handle selecting only one tooth for individual configuration (double-click)
  const handleToothSelectIndividual = (toothNumber: string) => {
    // Check if tooth is AUSENTE
    const initialState = getToothInitialState(formData.initialToothStates, toothNumber);
    if (initialState === 'AUSENTE') {
      return;
    }

    const isPilar = initialState === 'PILAR';
    const isInOrder = teethNumbers.includes(toothNumber);

    if (!isInOrder) {
      // Add to order first
      const newTeethNumbers = [...teethNumbers, toothNumber].sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10)
      );
      setTeethNumbers(newTeethNumbers);

      // Initialize ToothData
      setTeethData((prevData) => {
        const newData = new Map(prevData);
        newData.set(toothNumber, {
          toothNumber,
          trabajoSobreImplante: isPilar ? true : undefined,
        });
        return newData;
      });

      // Update formData.teethNumbers string
      setFormData((prev) => ({
        ...prev,
        teethNumbers: newTeethNumbers.join(', '),
      }));
    }

    // Select only this tooth for configuration
    setSelectedForConfig([toothNumber]);
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveOrder(false);
  };

  // Compute pre-submission validation errors
  // Check if any tooth has implant work
  const hasImplant = useMemo(() => {
    return Array.from(teethData.values()).some((tooth) => tooth.trabajoSobreImplante);
  }, [teethData]);

  const computePreSubmitValidation = useCallback(() => {
    const errors: typeof preSubmitErrors = {};
    const teethArray = Array.from(teethData.values());

    if (!formData.patientName || formData.patientName.trim() === '') {
      errors.patientName = 'El nombre del paciente es requerido';
    }

    // Validate teeth selection
    if (teethArray.length === 0) {
      errors.teeth = 'Al menos un diente debe ser configurado';
    } else {
      // Check if any teeth are missing required fields
      const incompleteTeeth: string[] = [];
      for (const tooth of teethArray) {
        const missingFields: string[] = [];
        if (!tooth.material) missingFields.push('material');
        if (!tooth.tipoRestauracion) missingFields.push('tipo de restauración');

        if (missingFields.length > 0) {
          incompleteTeeth.push(`Diente ${tooth.toothNumber}: falta ${missingFields.join(', ')}`);
        }
      }
      if (incompleteTeeth.length > 0) {
        errors.teethIncomplete = incompleteTeeth;
      }
    }

    // Validate digital scan files - require upper AND lower when isDigitalScan is true
    if (formData.isDigitalScan) {
      const missingFiles: string[] = [];
      if (upperFiles.length === 0) missingFiles.push('arcada superior');
      if (lowerFiles.length === 0) missingFiles.push('arcada inferior');

      if (missingFiles.length > 0) {
        errors.digitalScanFiles = `Escaneo digital requiere archivos STL/PLY de: ${missingFiles.join(' y ')}`;
      }
    }

    return errors;
  }, [formData.patientName, formData.isDigitalScan, teethData, upperFiles, lowerFiles]);

  const handleSubmitForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    // Compute and set validation errors before showing modal
    const errors = computePreSubmitValidation();
    setPreSubmitErrors(errors);
    // Show review modal
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = async () => {
    // Called when user confirms in the review modal
    // Create order, upload files, and submit for review
    await handleSaveOrder(true, true); // true = submit for review, true = redirect to detail
    setShowReviewModal(false);
  };

  const handleSaveAsDraft = async () => {
    // Called when user clicks "Save as Draft" in the review modal
    // Clear pre-submit errors when saving as draft
    setPreSubmitErrors({});
    await handleSaveOrder(false, false); // false = don't submit, false = redirect to list
    setShowReviewModal(false);
  };

  const handleSaveOrder = async (submitForReview: boolean, redirectToDetail = false) => {
    setError(null);
    setValidationErrors(new Map());
    setShowErrorSummary(false);
    // Clear pre-submit errors when attempting to save
    if (!submitForReview) {
      setPreSubmitErrors({});
    }

    // Set appropriate loading state
    if (submitForReview) {
      setIsLoading(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      // Convert teethData Map to array
      const teethArray = Array.from(teethData.values());

      // Merge teeth array into formData
      const dataToSave = {
        ...formData,
        teeth: teethArray.length > 0 ? teethArray : undefined,
      };

      const result = await saveOrderUtil(
        orderId,
        role,
        dataToSave,
        submitForReview,
        onSuccess,
        router
      );

      // If creating a new order, upload files
      if (result) {
        const hasFiles =
          upperFiles.length > 0 ||
          lowerFiles.length > 0 ||
          biteFiles.length > 0 ||
          photographFiles.length > 0 ||
          otherFiles.length > 0;

        if (hasFiles) {
          try {
            setIsUploadingFiles(true);
            await uploadFilesToOrder(
              result.id,
              upperFiles,
              lowerFiles,
              biteFiles,
              photographFiles,
              otherFiles,
              (uploadedCount, totalCount, currentFileName, currentProgress) => {
                setUploadProgress({
                  uploadedCount,
                  totalCount,
                  currentFileName,
                  currentProgress,
                });
              }
            );
            setIsUploadingFiles(false);
          } catch (uploadErr) {
            console.error('Error uploading files:', uploadErr);
            setIsUploadingFiles(false);
            // Don't fail the whole operation if files fail to upload
            // User can add them later from detail page
          }
        }

        // Redirect to detail page if requested
        if (redirectToDetail) {
          router.push(`/${role}/orders/${result.id}`);
        } else if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/${role}/orders`);
          router.refresh();
        }
      }
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
        grouped.set('digitalScan', [
          {
            field: 'isDigitalScan',
            message: err.message,
          },
        ]);
        setValidationErrors(grouped);
        setShowErrorSummary(true);
        setError('Hay errores en el formulario');

        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
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

        // Scroll to top to show the validation error summary
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
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
          // Simple field (e.g., "isDigitalScan")
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
        const toothData = newData.get(suggestion.toothNumber!) || {
          toothNumber: suggestion.toothNumber!,
        };

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

  const hasPreSubmitErrors = Object.keys(preSubmitErrors).length > 0;

  return (
    <form onSubmit={handleSaveDraft} className="space-y-4 sm:space-y-6">
      {/* Pre-submission Validation Errors (shown when review modal was opened with issues) */}
      {hasPreSubmitErrors && !showReviewModal && (
        <div className="rounded-lg bg-danger/10 border border-danger/30 p-4">
          <div className="flex items-start gap-3">
            <Icons.alertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-danger">Información Requerida para Enviar</h3>
                <button
                  type="button"
                  onClick={() => setPreSubmitErrors({})}
                  className="text-danger/60 hover:text-danger transition-colors"
                  aria-label="Cerrar"
                >
                  <Icons.x className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-danger/80 mt-1 mb-2">
                Completa los siguientes campos antes de enviar la orden para revisión:
              </p>
              <ul className="text-sm text-danger/80 space-y-1">
                {preSubmitErrors.patientName && <li>• {preSubmitErrors.patientName}</li>}
                {preSubmitErrors.teeth && <li>• {preSubmitErrors.teeth}</li>}
                {preSubmitErrors.teethIncomplete && preSubmitErrors.teethIncomplete.length > 0 && (
                  <li>
                    • Dientes con información incompleta:
                    <ul className="ml-4 mt-1 space-y-0.5">
                      {preSubmitErrors.teethIncomplete.map((error, idx) => (
                        <li key={idx} className="text-xs">
                          - {error}
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
                {preSubmitErrors.digitalScanFiles && <li>• {preSubmitErrors.digitalScanFiles}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Summary */}
      {showErrorSummary && validationErrors.size > 0 && (
        <ValidationErrorSummary
          errorsBySection={validationErrors}
          onSectionClick={scrollToSection}
          onToothClick={(toothNumber) => {
            // Select the tooth in the odontogram
            setSelectedToothNumber(toothNumber);
          }}
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
          {/* 1. Case Type Section */}
          <CaseTypeSection
            ref={(el) => registerSectionRef('caseType', el)}
            tipoCaso={formData.tipoCaso ?? undefined}
            motivoGarantia={formData.motivoGarantia}
            onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
            hasErrors={getSectionErrorInfo('caseType').hasErrors}
            errorCount={getSectionErrorInfo('caseType').errorCount}
          />

          {/* 2. Patient Info Section */}
          <OrderInfoSection
            ref={(el) => registerSectionRef('patient', el)}
            patientName={formData.patientName}
            fechaEntregaDeseada={formData.fechaEntregaDeseada}
            onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
            disabled={isLoading}
            hasErrors={getSectionErrorInfo('patient').hasErrors}
            errorCount={getSectionErrorInfo('patient').errorCount}
          />

          {/* 3. Tooth Configuration Section (Odontogram Wizard - 2 steps) */}
          <div id="teeth-section" ref={(el) => registerSectionRef('teeth', el)}>
            <OdontogramWizard
              initialStates={formData.initialToothStates}
              teethData={teethData}
              bridges={bridges}
              onInitialStatesChange={(states) =>
                setFormData((prev) => ({ ...prev, initialToothStates: states }))
              }
              onTeethDataChange={(data) => setTeethData(data)}
              onBridgesChange={setBridges}
              onTeethInOrderChange={setTeethNumbers}
              disabled={isLoading}
            />
          </div>

          {/* 4. Digital Scan Section */}
          <DigitalScanSection
            isDigitalScan={formData.isDigitalScan}
            escanerUtilizado={formData.escanerUtilizado ?? undefined}
            otroEscaner={formData.otroEscaner}
            upperFiles={upperFiles}
            lowerFiles={lowerFiles}
            biteFiles={biteFiles}
            onUpperFilesChange={setUpperFiles}
            onLowerFilesChange={setLowerFiles}
            onBiteFilesChange={setBiteFiles}
            onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
            disabled={isLoading}
          />

          {/* 5. Occlusion Section */}
          <OcclusionSection
            ref={(el) => registerSectionRef('occlusion', el)}
            oclusionDiseno={formData.oclusionDiseno}
            onChange={(value) => setFormData((prev) => ({ ...prev, oclusionDiseno: value }))}
            hasErrors={getSectionErrorInfo('occlusion').hasErrors}
            errorCount={getSectionErrorInfo('occlusion').errorCount}
          />

          {/* 6. Material Sent Section */}
          <MaterialSentSection
            materialSent={formData.materialSent}
            onChange={(value) => setFormData((prev) => ({ ...prev, materialSent: value }))}
          />

          {/* 7. Mouth Photos Section - Optional */}
          <MouthPhotosSection
            photographFiles={photographFiles}
            onPhotographFilesChange={setPhotographFiles}
          />

          {/* 8. Submission Type Section */}
          <SubmissionTypeSection
            ref={(el) => registerSectionRef('submission', el)}
            submissionType={formData.submissionType ?? undefined}
            articulatedBy={formData.articulatedBy ?? undefined}
            onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
            hasErrors={getSectionErrorInfo('submission').hasErrors}
            errorCount={getSectionErrorInfo('submission').errorCount}
            hasImplant={hasImplant}
          />

          <AdditionalNotesSection
            ref={(el) => registerSectionRef('notes', el)}
            additionalNotes={formData.notes}
            onChange={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
            hasErrors={getSectionErrorInfo('notes').hasErrors}
            errorCount={getSectionErrorInfo('notes').errorCount}
          />

          {/* Urgent Order Checkbox */}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-3">
              <Icons.zap className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <Checkbox
                  id="isUrgent"
                  label="Orden Urgente"
                  checked={formData.isUrgent || false}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isUrgent: e.target.checked }))}
                  disabled={isLoading}
                />
                <p className="text-sm text-warning/80 mt-2 ml-6">
                  Las órdenes urgentes tienen un recargo del 30% sobre el precio base.
                </p>
              </div>
            </div>
          </div>

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
          upperFiles={upperFiles}
          lowerFiles={lowerFiles}
          biteFiles={biteFiles}
          photographFiles={photographFiles}
          otherFiles={otherFiles}
          onUpperFilesChange={setUpperFiles}
          onLowerFilesChange={setLowerFiles}
          onBiteFilesChange={setBiteFiles}
          onPhotographFilesChange={setPhotographFiles}
          onOtherFilesChange={setOtherFiles}
          onFormDataChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowReviewModal(false)}
          onSaveAsDraft={handleSaveAsDraft}
          isSubmitting={isLoading}
          isSavingDraft={isSavingDraft}
        />
      )}

      {/* File Upload Progress Modal */}
      {isUploadingFiles && (
        <FileUploadProgressModal
          uploadedCount={uploadProgress.uploadedCount}
          totalCount={uploadProgress.totalCount}
          currentFileName={uploadProgress.currentFileName}
          overallProgress={
            uploadProgress.totalCount > 0
              ? (uploadProgress.uploadedCount / uploadProgress.totalCount) * 100 +
                uploadProgress.currentProgress / uploadProgress.totalCount
              : 0
          }
        />
      )}
    </form>
  );
}
