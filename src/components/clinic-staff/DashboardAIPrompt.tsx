'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AIPromptInput } from './order-form/AIPromptInput';
import type { SpeechRecognition } from '@/types/speech-recognition';

interface DashboardAIPromptProps {
  role: 'doctor' | 'assistant';
}

export function DashboardAIPrompt({ role }: DashboardAIPromptProps) {
  const router = useRouter();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false);
  const pendingTranscriptRef = useRef('');

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
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

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
            setAiPrompt((prev) => (prev ? prev + ' ' + transcript : transcript));
            pendingTranscriptRef.current = '';
          } else {
            // Interim result - store for display purposes
            pendingTranscriptRef.current = transcript;
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

  const handleParseAI = async () => {
    if (!aiPrompt || aiPrompt.trim().length === 0) {
      setAiError('Por favor ingresa una descripción para procesar');
      return;
    }

    setIsParsingAI(true);
    setAiError(null);

    try {
      const response = await fetch('/api/orders/parse-ai-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar con IA');
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('No se pudo procesar el prompt');
      }

      const { confirmedValues, suggestions } = result.data;

      // Store confirmed values, suggestions, and AI prompt in sessionStorage
      sessionStorage.setItem(
        'dashboardAIData',
        JSON.stringify({
          aiPrompt,
          parsedData: confirmedValues,
          suggestions: suggestions || [],
          openReviewModal: true,
        })
      );

      // Redirect to new order page
      router.push(`/${role}/orders/new`);
    } catch (error) {
      console.error('Error parsing with AI:', error);
      setAiError(error instanceof Error ? error.message : 'Error al procesar con IA');
    } finally {
      setIsParsingAI(false);
    }
  };

  return (
    <div className="mb-6 sm:mb-8">
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
        showManualButton={false}
      />
    </div>
  );
}
