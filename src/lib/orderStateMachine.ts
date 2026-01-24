import { OrderStatus, Role } from '@prisma/client';

/**
 * Order State Machine
 *
 * Defines valid state transitions and role-based permissions for order status changes.
 *
 * State Flow:
 * DRAFT → PENDING_REVIEW (doctor/assistant submits)
 * PENDING_REVIEW → IN_PROGRESS (lab accepts)
 * PENDING_REVIEW → NEEDS_INFO (lab requests info)
 * NEEDS_INFO → PENDING_REVIEW (doctor responds)
 * IN_PROGRESS → COMPLETED (lab completes)
 * * → CANCELLED (any non-terminal state)
 */

// Terminal states that cannot transition further
const TERMINAL_STATES: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];

// Valid state transitions map
const STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.PENDING_REVIEW, OrderStatus.CANCELLED],
  [OrderStatus.PENDING_REVIEW]: [
    OrderStatus.IN_PROGRESS,
    OrderStatus.NEEDS_INFO,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.MATERIALS_SENT]: [
    OrderStatus.IN_PROGRESS,
    OrderStatus.NEEDS_INFO,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.NEEDS_INFO]: [OrderStatus.PENDING_REVIEW, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [], // Terminal state
  [OrderStatus.CANCELLED]: [], // Terminal state
};

// Role-based permissions for state transitions
const ROLE_TRANSITIONS: Record<Role, Record<OrderStatus, OrderStatus[]>> = {
  // Doctors can submit drafts and respond to info requests
  [Role.DOCTOR]: {
    [OrderStatus.DRAFT]: [OrderStatus.PENDING_REVIEW, OrderStatus.CANCELLED],
    [OrderStatus.PENDING_REVIEW]: [],
    [OrderStatus.MATERIALS_SENT]: [],
    [OrderStatus.NEEDS_INFO]: [OrderStatus.PENDING_REVIEW],
    [OrderStatus.IN_PROGRESS]: [],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
  },
  // Lab admins can do all transitions
  [Role.LAB_ADMIN]: {
    [OrderStatus.DRAFT]: [],
    [OrderStatus.PENDING_REVIEW]: [
      OrderStatus.IN_PROGRESS,
      OrderStatus.NEEDS_INFO,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.MATERIALS_SENT]: [
      OrderStatus.IN_PROGRESS,
      OrderStatus.NEEDS_INFO,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.NEEDS_INFO]: [OrderStatus.CANCELLED],
    [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
  },
  // Lab collaborators can mark in progress and complete, but not cancel
  [Role.LAB_COLLABORATOR]: {
    [OrderStatus.DRAFT]: [],
    [OrderStatus.PENDING_REVIEW]: [OrderStatus.IN_PROGRESS, OrderStatus.NEEDS_INFO],
    [OrderStatus.MATERIALS_SENT]: [OrderStatus.IN_PROGRESS, OrderStatus.NEEDS_INFO],
    [OrderStatus.NEEDS_INFO]: [],
    [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
  },
};

/**
 * Check if a state transition is valid regardless of user role
 */
export function isValidTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const allowedTransitions = STATE_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Check if a user with a given role can perform a state transition
 */
export function canUserTransition(
  role: Role,
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  // First check if the transition is valid at all
  if (!isValidTransition(currentStatus, newStatus)) {
    return false;
  }

  // Then check if the user's role allows this transition
  const roleTransitions = ROLE_TRANSITIONS[role];
  if (!roleTransitions) {
    return false;
  }

  const allowedTransitions = roleTransitions[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get all valid next states for a given current state
 */
export function getValidNextStates(currentStatus: OrderStatus): OrderStatus[] {
  return STATE_TRANSITIONS[currentStatus] || [];
}

/**
 * Get all valid next states for a user with a given role
 */
export function getValidNextStatesForRole(role: Role, currentStatus: OrderStatus): OrderStatus[] {
  const roleTransitions = ROLE_TRANSITIONS[role];
  if (!roleTransitions) {
    return [];
  }

  return roleTransitions[currentStatus] || [];
}

/**
 * Check if a state is terminal (no further transitions possible)
 */
export function isTerminalState(status: OrderStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

/**
 * Get the timestamp field that should be updated for a given status transition
 */
export function getTimestampUpdates(newStatus: OrderStatus): Partial<{
  submittedAt: Date;
  materialsSentAt: Date;
  completedAt: Date;
}> {
  const now = new Date();

  switch (newStatus) {
    case OrderStatus.PENDING_REVIEW:
      return { submittedAt: now };
    case OrderStatus.MATERIALS_SENT:
      return { materialsSentAt: now };
    case OrderStatus.COMPLETED:
      return { completedAt: now };
    default:
      return {};
  }
}

/**
 * Validation error messages
 */
export function getTransitionErrorMessage(
  role: Role,
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): string {
  if (!isValidTransition(currentStatus, newStatus)) {
    return `Invalid state transition from ${currentStatus} to ${newStatus}`;
  }

  if (!canUserTransition(role, currentStatus, newStatus)) {
    return `You don't have permission to change status from ${currentStatus} to ${newStatus}`;
  }

  return '';
}
