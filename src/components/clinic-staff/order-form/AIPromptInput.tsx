'use client';

import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface AIPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
  isParsingAI: boolean;
  isLoading: boolean;
  aiError: string | null;
  speechSupported: boolean;
  isListening: boolean;
  onToggleSpeechRecognition: () => void;
  showFullForm: boolean;
  onShowFullForm: () => void;
  heading?: string;
  description?: string;
  showManualButton?: boolean;
}

export function AIPromptInput({
  value,
  onChange,
  onParse,
  isParsingAI,
  isLoading,
  aiError,
  speechSupported,
  isListening,
  onToggleSpeechRecognition,
  showFullForm,
  onShowFullForm,
  heading = 'Crear Orden con IA',
  description = 'Describe la orden en lenguaje natural y la IA completará automáticamente los campos',
  showManualButton = true,
}: AIPromptInputProps) {
  return (
    <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 sm:p-6">
      {/* Header */}
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
          <h3 className="text-lg font-semibold text-foreground">{heading}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <Textarea
          label=""
          id="aiPrompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading || isParsingAI}
          rows={4}
          placeholder="Ejemplo: 'Corona de zirconia para diente 11, color A2, escaneado con iTero, entregar en 5 días...'"
        />

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="primary"
            onClick={onParse}
            isLoading={isParsingAI}
            disabled={isLoading || !value || value.trim().length === 0}
            className="w-full sm:w-auto"
          >
            {isParsingAI ? 'Procesando con IA...' : 'Procesar con IA'}
          </Button>

          {speechSupported && (
            <Button
              type="button"
              variant={isListening ? 'danger' : 'secondary'}
              onClick={onToggleSpeechRecognition}
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

        {/* Error Message */}
        {aiError && <p className="text-sm text-danger font-medium">{aiError}</p>}

        {/* Manual Fill Button */}
        {!showFullForm && showManualButton && (
          <Button
            type="button"
            variant="secondary"
            onClick={onShowFullForm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Completar Manualmente
          </Button>
        )}
      </div>
    </div>
  );
}
