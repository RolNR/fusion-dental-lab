'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function ColorSchemeProvider() {
  const searchParams = useSearchParams();
  const useFusionColors = searchParams.get('fusion-colors') === '1';

  useEffect(() => {
    const root = document.documentElement;

    if (useFusionColors) {
      // Rojo Fusión colors
      root.style.setProperty('--color-primary', '239 43 36');
      root.style.setProperty('--color-primary-hover', '220 35 30');
      root.style.setProperty('--color-focus-ring', '239 43 36');
    } else {
      // Original sky blue colors
      root.style.setProperty('--color-primary', '56 189 248');
      root.style.setProperty('--color-primary-hover', '14 165 233');
      root.style.setProperty('--color-focus-ring', '56 189 248');
    }
  }, [useFusionColors]);

  return null;
}
