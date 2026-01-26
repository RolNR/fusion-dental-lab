'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import type { ToothData } from '@/types/tooth';

interface CollapsibleToothCardProps {
  tooth: ToothData;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CollapsibleToothCard({
  tooth,
  isExpanded,
  onToggle,
  children,
}: CollapsibleToothCardProps) {
  return (
    <div className="rounded-lg border-l-4 border-primary bg-muted/20 overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        className="!w-full !justify-between !pl-4 !pr-4 !py-3 !rounded-none hover:!bg-muted/30"
      >
        <h3 className="font-semibold text-lg text-foreground">Diente {tooth.toothNumber}</h3>
        <Icons.chevronDown
          className={`h-5 w-5 text-foreground transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </Button>

      {isExpanded && <div className="pl-4 pr-4 pb-3">{children}</div>}
    </div>
  );
}

interface CollapsibleToothListProps {
  teeth: ToothData[];
  renderToothDetails: (tooth: ToothData) => React.ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleToothList({
  teeth,
  renderToothDetails,
  defaultExpanded = true,
}: CollapsibleToothListProps) {
  const [expandedTeeth, setExpandedTeeth] = useState<Set<string>>(
    defaultExpanded ? new Set(teeth.map((t) => t.toothNumber)) : new Set()
  );

  const toggleTooth = (toothNumber: string) => {
    setExpandedTeeth((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toothNumber)) {
        newSet.delete(toothNumber);
      } else {
        newSet.add(toothNumber);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {teeth.map((tooth) => (
        <CollapsibleToothCard
          key={tooth.toothNumber}
          tooth={tooth}
          isExpanded={expandedTeeth.has(tooth.toothNumber)}
          onToggle={() => toggleTooth(tooth.toothNumber)}
        >
          {renderToothDetails(tooth)}
        </CollapsibleToothCard>
      ))}
    </div>
  );
}
