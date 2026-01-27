'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'odontogram-tooltips-dismissed';

export interface TooltipState {
  step1Toolbar: boolean;
  step1Implants: boolean;
  step2WorkType: boolean;
  step2SelectTeeth: boolean;
  step2FillDetails: boolean;
}

const DEFAULT_STATE: TooltipState = {
  step1Toolbar: false,
  step1Implants: false,
  step2WorkType: false,
  step2SelectTeeth: false,
  step2FillDetails: false,
};

function getStoredState(): TooltipState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<TooltipState>;
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    // Invalid JSON or localStorage error
  }
  return DEFAULT_STATE;
}

export function useGuidedTooltips() {
  // Use state with lazy initializer to avoid hydration mismatch
  const [dismissedTooltips, setDismissedTooltips] = useState<TooltipState>(DEFAULT_STATE);
  const [hasMounted, setHasMounted] = useState(false);

  // Load from localStorage after mount (client-side only)
  useEffect(() => {
    setDismissedTooltips(getStoredState());
    setHasMounted(true);
  }, []);

  // Persist dismissed state to localStorage
  const persistState = useCallback((state: TooltipState) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage might be full or disabled
    }
  }, []);

  // Dismiss a specific tooltip
  const dismissTooltip = useCallback(
    (key: keyof TooltipState) => {
      setDismissedTooltips((prev) => {
        const newState = { ...prev, [key]: true };
        persistState(newState);
        return newState;
      });
    },
    [persistState]
  );

  // Check if a tooltip should be shown (not dismissed)
  const shouldShowTooltip = useCallback(
    (key: keyof TooltipState): boolean => {
      // Don't show until client-side hydration is complete
      if (!hasMounted) return false;
      return !dismissedTooltips[key];
    },
    [dismissedTooltips, hasMounted]
  );

  // Reset all tooltips (for testing)
  const resetTooltips = useCallback(() => {
    const newState = { ...DEFAULT_STATE };
    setDismissedTooltips(newState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    dismissedTooltips,
    dismissTooltip,
    shouldShowTooltip,
    resetTooltips,
    hasMounted,
  };
}
