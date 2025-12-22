import { ScanType } from '@prisma/client';

/**
 * Centralized ScanType utilities
 *
 * This file provides a single source of truth for scan type labels and values.
 * If the ScanType enum changes in the schema, only update this file.
 */

export const SCAN_TYPE_LABELS: Record<ScanType, string> = {
  DIGITAL_SCAN: 'Escaneo Digital',
  ANALOG_MOLD: 'Molde Análogo',
};

export function getScanTypeLabel(scanType: ScanType | null): string {
  if (!scanType) return 'Ninguno';
  return SCAN_TYPE_LABELS[scanType];
}

/**
 * Get all available scan type options for forms
 */
export function getScanTypeOptions(): Array<{ value: ScanType | null; label: string }> {
  return [
    { value: null, label: 'Ninguno' },
    { value: ScanType.DIGITAL_SCAN, label: SCAN_TYPE_LABELS[ScanType.DIGITAL_SCAN] },
    { value: ScanType.ANALOG_MOLD, label: SCAN_TYPE_LABELS[ScanType.ANALOG_MOLD] },
  ];
}
