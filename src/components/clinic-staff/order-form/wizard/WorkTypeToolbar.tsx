'use client';

import { RestorationType } from '@prisma/client';
import { Icons } from '@/components/ui/Icons';

interface WorkTypeToolbarProps {
  activeTool: RestorationType | null;
  onToolChange: (tool: RestorationType | null) => void;
  bridgeMode?: boolean;
  bridgeInstruction?: string;
  disabled?: boolean;
}

const WORK_TYPES: { id: RestorationType; label: string; icon: keyof typeof Icons }[] = [
  { id: 'corona', label: 'Corona', icon: 'settings' },
  { id: 'puente', label: 'Puente', icon: 'copy' },
  { id: 'inlay', label: 'Inlay', icon: 'upload' },
  { id: 'onlay', label: 'Onlay', icon: 'file' },
  { id: 'carilla', label: 'Carilla', icon: 'user' },
  { id: 'provisional', label: 'Provisional', icon: 'alertCircle' },
];

export function WorkTypeToolbar({
  activeTool,
  onToolChange,
  bridgeMode = false,
  bridgeInstruction,
  disabled = false,
}: WorkTypeToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {WORK_TYPES.map((workType) => {
          const Icon = Icons[workType.icon];
          const isActive = activeTool === workType.id;

          return (
            <button
              key={workType.id}
              type="button"
              onClick={() => onToolChange(isActive ? null : workType.id)}
              disabled={disabled}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium
                ${isActive ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : 'bg-muted text-foreground hover:bg-muted/80'}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{workType.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bridge mode instruction */}
      {bridgeMode && bridgeInstruction && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30">
          <Icons.info className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm text-primary font-medium">{bridgeInstruction}</span>
        </div>
      )}
    </div>
  );
}
