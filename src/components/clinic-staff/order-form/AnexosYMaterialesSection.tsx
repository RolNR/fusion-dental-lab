'use client';

import { useState } from 'react';
import { ScannerType } from '@prisma/client';
import { CollapsibleSubsection } from '@/components/ui/form';
import { Icons } from '@/components/ui/Icons';
import { MaterialSentSection } from './MaterialSentSection';
import { DigitalScanSection } from './DigitalScanSection';
import { MouthPhotosSection } from './MouthPhotosSection';

type AnexoTab = 'materiales' | 'escaneos' | 'fotografias';

interface AnexosYMaterialesSectionProps {
  // Materiales
  materialSent?: Record<string, boolean>;
  onMaterialSentChange: (value: Record<string, boolean> | undefined) => void;
  materialSentError?: string;
  // Escaneos (Digital scan)
  isDigitalScan?: boolean;
  escanerUtilizado?: ScannerType;
  otroEscaner?: string;
  upperFiles: File[];
  lowerFiles: File[];
  biteFiles: File[];
  onUpperFilesChange: (files: File[]) => void;
  onLowerFilesChange: (files: File[]) => void;
  onBiteFilesChange: (files: File[]) => void;
  onDigitalScanChange: (updates: {
    isDigitalScan?: boolean;
    escanerUtilizado?: ScannerType | null;
    otroEscaner?: string;
  }) => void;
  // Fotografías
  photographFiles?: File[];
  onPhotographFilesChange?: (files: File[]) => void;
  disabled?: boolean;
}

const TABS: { id: AnexoTab; label: string; icon: keyof typeof Icons }[] = [
  { id: 'materiales', label: 'Materiales', icon: 'upload' },
  { id: 'escaneos', label: 'Escaneos', icon: 'upload' },
  { id: 'fotografias', label: 'Fotografías', icon: 'eye' },
];

export function AnexosYMaterialesSection({
  materialSent,
  onMaterialSentChange,
  materialSentError,
  isDigitalScan,
  escanerUtilizado,
  otroEscaner,
  upperFiles,
  lowerFiles,
  biteFiles,
  onUpperFilesChange,
  onLowerFilesChange,
  onBiteFilesChange,
  onDigitalScanChange,
  photographFiles,
  onPhotographFilesChange,
  disabled = false,
}: AnexosYMaterialesSectionProps) {
  const [activeTab, setActiveTab] = useState<AnexoTab>('materiales');

  return (
    <CollapsibleSubsection icon="upload" title="Anexos y materiales enviados">
      <div className="space-y-4">
        <div
          role="tablist"
          aria-label="Secciones de anexos y materiales"
          className="flex flex-wrap gap-2 border-b border-border pb-2"
        >
          {TABS.map((tab) => {
            const Icon = Icons[tab.icon];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="pt-2">
          {activeTab === 'materiales' && (
            <MaterialSentSection
              materialSent={materialSent}
              onChange={onMaterialSentChange}
              errors={materialSentError ? { materialSent: materialSentError } : undefined}
            />
          )}

          {activeTab === 'escaneos' && (
            <DigitalScanSection
              isDigitalScan={isDigitalScan}
              escanerUtilizado={escanerUtilizado}
              otroEscaner={otroEscaner}
              upperFiles={upperFiles}
              lowerFiles={lowerFiles}
              biteFiles={biteFiles}
              onUpperFilesChange={onUpperFilesChange}
              onLowerFilesChange={onLowerFilesChange}
              onBiteFilesChange={onBiteFilesChange}
              onChange={onDigitalScanChange}
              disabled={disabled}
            />
          )}

          {activeTab === 'fotografias' && (
            <MouthPhotosSection
              photographFiles={photographFiles}
              onPhotographFilesChange={onPhotographFilesChange}
            />
          )}
        </div>
      </div>
    </CollapsibleSubsection>
  );
}
