export type ToothInitialState = 'NORMAL' | 'AUSENTE' | 'PILAR' | 'IMPLANTE';

export type InitialToothStatesMap = Record<string, ToothInitialState>;

/**
 * Get the initial state for a specific tooth.
 * Returns 'NORMAL' if the tooth is not in the map.
 */
export function getToothInitialState(
  states: InitialToothStatesMap | undefined | null,
  toothNumber: string
): ToothInitialState {
  return states?.[toothNumber] ?? 'NORMAL';
}

/**
 * Check if a tooth can be selected for work based on its initial state.
 * AUSENTE teeth cannot be selected (they are missing).
 * NORMAL and PILAR teeth can be selected.
 */
export function isToothSelectable(state: ToothInitialState): boolean {
  return state !== 'AUSENTE';
}

/**
 * Count how many teeth have a specific state.
 */
export function countTeethWithState(
  states: InitialToothStatesMap | undefined | null,
  targetState: ToothInitialState
): number {
  if (!states) return 0;
  return Object.values(states).filter((state) => state === targetState).length;
}

/**
 * Get all tooth numbers with a specific state.
 */
export function getTeethWithState(
  states: InitialToothStatesMap | undefined | null,
  targetState: ToothInitialState
): string[] {
  if (!states) return [];
  return Object.entries(states)
    .filter(([, state]) => state === targetState)
    .map(([toothNumber]) => toothNumber);
}

/**
 * Get summary text for initial tooth states.
 * Returns empty string if no states are set.
 */
export function getInitialStatesSummary(states: InitialToothStatesMap | undefined | null): string {
  if (!states || Object.keys(states).length === 0) return '';

  const ausenteCount = countTeethWithState(states, 'AUSENTE');
  const pilarCount = countTeethWithState(states, 'PILAR');
  const implanteCount = countTeethWithState(states, 'IMPLANTE');

  const parts: string[] = [];
  if (ausenteCount > 0) {
    parts.push(`${ausenteCount} ausente${ausenteCount > 1 ? 's' : ''}`);
  }
  if (pilarCount > 0) {
    parts.push(`${pilarCount} pilar${pilarCount > 1 ? 'es' : ''}`);
  }
  if (implanteCount > 0) {
    parts.push(`${implanteCount} implante${implanteCount > 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}
