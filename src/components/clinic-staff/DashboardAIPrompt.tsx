'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AIPromptInput } from './order-form/AIPromptInput';
import { AIResultsSummary } from './order-form/AIResultsSummary';
import type { AISuggestion } from '@/types/ai-suggestions';
import type { SpeechRecognition } from '@/types/speech-recognition';

interface DashboardAIPromptProps {
  role: 'doctor' | 'assistant';
}

export function DashboardAIPrompt({ role }: DashboardAIPromptProps) {
  const router = useRouter();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Iterative AI state
  const [accumulatedValues, setAccumulatedValues] = useState<Record<string, unknown> | null>(null);
  const [accumulatedSuggestions, setAccumulatedSuggestions] = useState<AISuggestion[]>([]);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false);
  const pendingTranscriptRef = useRef('');

  // Track which input receives speech (initial prompt vs follow-up)
  const followUpTextRef = useRef<(text: string) => void | null>(null);

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
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onresult = (event) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript.trim();

          if (result.isFinal && transcript) {
            if (showSummary && followUpTextRef.current) {
              // In summary mode, append to follow-up text via ref callback
              followUpTextRef.current(transcript);
            } else {
              // In initial prompt mode, append to aiPrompt
              setAiPrompt((prev) => (prev ? prev + ' ' + transcript : transcript));
            }
            pendingTranscriptRef.current = '';
          } else {
            pendingTranscriptRef.current = transcript;
          }
        };

        recognition.onerror = (event) => {
          if (event.error === 'no-speech') return;
          console.error('Speech recognition error:', event.error);
          shouldRestartRef.current = false;
          setIsListening(false);
        };

        recognition.onend = () => {
          if (shouldRestartRef.current) {
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
  }, [restartRecognition, showSummary]);

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
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        shouldRestartRef.current = false;
      }
    }
  };

  const handleAIPromptChange = (value: string) => {
    setAiPrompt(value);
    setAiError(null);
  };

  const callParseAPI = async (
    prompt: string,
    context?: { previousValues: Record<string, unknown>; promptHistory: string[] }
  ) => {
    const body: Record<string, unknown> = { prompt };
    if (context) {
      body.context = context;
    }

    const response = await fetch('/api/orders/parse-ai-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al procesar con IA');
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error('No se pudo procesar el prompt');
    }

    return result.data as { confirmedValues: Record<string, unknown>; suggestions: AISuggestion[] };
  };

  // Initial prompt handler
  const handleParseAI = async () => {
    if (!aiPrompt || aiPrompt.trim().length === 0) {
      setAiError('Por favor ingresa una descripción para procesar');
      return;
    }

    setIsParsingAI(true);
    setAiError(null);

    try {
      const { confirmedValues, suggestions } = await callParseAPI(aiPrompt);

      setAccumulatedValues(confirmedValues);
      setAccumulatedSuggestions(suggestions || []);
      setPromptHistory([aiPrompt]);
      setShowSummary(true);
    } catch (error) {
      console.error('Error parsing with AI:', error);
      setAiError(error instanceof Error ? error.message : 'Error al procesar con IA');
    } finally {
      setIsParsingAI(false);
    }
  };

  // Follow-up prompt handler
  const handleFollowUp = async (followUpPrompt: string) => {
    if (!accumulatedValues) return;

    setIsParsingAI(true);
    setAiError(null);

    try {
      const { confirmedValues, suggestions } = await callParseAPI(followUpPrompt, {
        previousValues: accumulatedValues,
        promptHistory,
      });

      setAccumulatedValues(confirmedValues);
      setAccumulatedSuggestions(suggestions || []);
      setPromptHistory((prev) => [...prev, followUpPrompt]);
    } catch (error) {
      console.error('Error in follow-up:', error);
      setAiError(error instanceof Error ? error.message : 'Error al procesar con IA');
      // Keep previous accumulated values intact
    } finally {
      setIsParsingAI(false);
    }
  };

  // Apply accumulated values and redirect to form
  const handleApply = () => {
    if (!accumulatedValues) return;

    sessionStorage.setItem(
      'dashboardAIData',
      JSON.stringify({
        aiPrompt: promptHistory.join(' | '),
        parsedData: accumulatedValues,
        suggestions: accumulatedSuggestions,
        openReviewModal: true,
      })
    );

    router.push(`/${role}/orders/new`);
  };

  // Reset to initial state
  const handleStartOver = () => {
    setAccumulatedValues(null);
    setAccumulatedSuggestions([]);
    setPromptHistory([]);
    setShowSummary(false);
    setAiPrompt('');
    setAiError(null);

    // Stop speech recognition if active
    if (isListening && recognitionRef.current) {
      shouldRestartRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="mb-6 sm:mb-8">
      {showSummary && accumulatedValues ? (
        <>
          <AIResultsSummary
            confirmedValues={accumulatedValues}
            suggestions={accumulatedSuggestions}
            onFollowUp={handleFollowUp}
            onApply={handleApply}
            onStartOver={handleStartOver}
            isProcessing={isParsingAI}
            speechSupported={speechSupported}
            isListening={isListening}
            onToggleSpeechRecognition={handleToggleSpeechRecognition}
          />
          {aiError && <p className="mt-2 text-sm text-danger font-medium">{aiError}</p>}
        </>
      ) : (
        <AIPromptInput
          value={aiPrompt}
          onChange={handleAIPromptChange}
          onParse={handleParseAI}
          isParsingAI={isParsingAI}
          isLoading={false}
          aiError={aiError}
          speechSupported={speechSupported}
          isListening={isListening}
          onToggleSpeechRecognition={handleToggleSpeechRecognition}
          showFullForm={false}
          onShowFullForm={() => router.push(`/${role}/orders/new`)}
          heading="Crea tu próxima orden con IA"
          description="Describe la orden en lenguaje natural. La IA procesará la información y te mostrará una vista previa para confirmar."
          showManualButton={true}
        />
      )}
    </div>
  );
}
