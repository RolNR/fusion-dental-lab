'use client';

import { Icons } from '@/components/ui/Icons';
import { ToothInitialState } from '@/types/initial-tooth-state';

export type InitialStateTool = 'ausente' | 'pilar' | 'implante' | null;

interface InitialStateToolbarProps {
  activeTool: InitialStateTool;
  onToolChange: (tool: InitialStateTool) => void;
  counts: {
    ausente: number;
    pilar: number;
    implante: number;
  };
  disabled?: boolean;
}

export function InitialStateToolbar({
  activeTool,
  onToolChange,
  counts,
  disabled = false,
}: InitialStateToolbarProps) {
  const tools: { id: InitialStateTool; label: string; icon: keyof typeof Icons; state: ToothInitialState }[] = [
    { id: 'ausente', label: 'Ausentes', icon: 'ghost', state: 'AUSENTE' },
    { id: 'pilar', label: 'Pilares', icon: 'screw', state: 'PILAR' },
    { id: 'implante', label: 'Implantes', icon: 'implant', state: 'IMPLANTE' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tools.map((tool) => {
        const Icon = Icons[tool.icon];
        const isActive = activeTool === tool.id;
        const count = counts[tool.id as keyof typeof counts] || 0;

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToolChange(isActive ? null : tool.id)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium
              ${isActive ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : 'bg-muted text-foreground hover:bg-muted/80'}
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <Icon className="h-4 w-4" />
            <span>Marcar {tool.label}</span>
            {count > 0 && (
              <span className={`
                px-1.5 py-0.5 text-xs rounded-full
                ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'}
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
