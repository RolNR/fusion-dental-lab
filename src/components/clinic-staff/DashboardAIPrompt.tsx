'use client';

import { useState, useEffect, useRef } from 'react';
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
  const processedResultsRef = useRef<Set<string>>(new Set());

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

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
            setAiPrompt((prev) => (prev + ' ' + finalTranscript).trim());
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
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

  const handleToggleSpeechRecognition = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      processedResultsRef.current.clear();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
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
