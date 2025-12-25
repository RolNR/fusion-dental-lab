import { prisma } from '@/lib/prisma';

// Constants for order number generation
const MAX_CLINIC_CODE_LENGTH = 8;
const MIN_CLINIC_CODE_LENGTH = 3;
const FALLBACK_CLINIC_CODE = 'CLINIC';
const CLINIC_CODE_PAD_CHAR = 'X';

const MAX_PATIENT_INITIALS_LENGTH = 3;
const MIN_PATIENT_INITIALS_LENGTH = 2;
const INITIALS_PAD_CHAR = 'X';

const ORDER_NUMBER_DIGITS = 3;
const ORDER_NUMBER_PAD_CHAR = '0';

/**
 * Generates a clinic code from clinic name
 * Takes first word or first 5 letters, uppercase
 *
 * Examples:
 * - "Smile Dental Clinic" -> "SMILE"
 * - "Dental Care" -> "DENTAL"
 * - "ABC" -> "ABC"
 */
function generateClinicCode(clinicName: string): string {
  // Remove special characters and extra spaces
  const cleaned = clinicName.trim().toUpperCase().replace(/[^A-Z\s]/g, '');

  // Split by spaces
  const words = cleaned.split(/\s+/).filter(word => word.length > 0);

  if (words.length === 0) {
    return FALLBACK_CLINIC_CODE;
  }

  // Take first word, max length
  const firstWord = words[0].slice(0, MAX_CLINIC_CODE_LENGTH);

  // Minimum length check
  if (firstWord.length < MIN_CLINIC_CODE_LENGTH) {
    // If too short, try to add from second word
    if (words.length > 1) {
      return (firstWord + words[1]).slice(0, MAX_CLINIC_CODE_LENGTH);
    }
    // Pad with character if still too short
    return (firstWord + CLINIC_CODE_PAD_CHAR.repeat(MIN_CLINIC_CODE_LENGTH)).slice(
      0,
      MIN_CLINIC_CODE_LENGTH
    );
  }

  return firstWord;
}

/**
 * Generates a human-friendly order number in the format:
 * [CLINIC-CODE]-[PATIENT-INITIALS]-[COUNT]
 *
 * Example: SMILE-JD-001
 *
 * @param clinicId - The clinic ID
 * @param patientName - The patient's full name
 * @returns The generated order number
 */
export async function generateOrderNumber(
  clinicId: string,
  patientName: string
): Promise<string> {
  // Get clinic name
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { name: true },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // Auto-generate clinic code from name
  const clinicCode = generateClinicCode(clinic.name);

  // Extract patient initials (first letter of each word, max 3 letters)
  const patientInitials = extractInitials(patientName);

  // Get the count of existing orders for this clinic
  const orderCount = await prisma.order.count({
    where: { clinicId },
  });

  // Generate sequential number with leading zeros
  const sequentialNumber = String(orderCount + 1).padStart(
    ORDER_NUMBER_DIGITS,
    ORDER_NUMBER_PAD_CHAR
  );

  // Format: CLINIC-INITIALS-000
  return `${clinicCode}-${patientInitials}-${sequentialNumber}`;
}

/**
 * Extracts initials from a patient name
 * Takes first letter of each word, maximum length defined by constant
 *
 * Examples:
 * - "John Doe" -> "JD"
 * - "Maria Smith" -> "MS"
 * - "John Paul Smith" -> "JPS"
 * - "Anne-Marie Johnson" -> "AMJ"
 */
function extractInitials(name: string): string {
  // Remove extra whitespace and split by spaces or hyphens
  const words = name
    .trim()
    .toUpperCase()
    .split(/[\s-]+/)
    .filter(word => word.length > 0);

  // Take first letter of each word, max length
  const initials = words
    .slice(0, MAX_PATIENT_INITIALS_LENGTH)
    .map(word => word[0])
    .join('');

  // If we got less than minimum initials, pad
  if (initials.length < MIN_PATIENT_INITIALS_LENGTH) {
    return (initials + INITIALS_PAD_CHAR).slice(0, MIN_PATIENT_INITIALS_LENGTH);
  }

  return initials;
}

/**
 * Regenerates order number for an existing order
 * Useful for retroactive updates
 */
export async function regenerateOrderNumber(orderId: string): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      clinicId: true,
      patientName: true,
      createdAt: true,
      clinic: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Auto-generate clinic code from name
  const clinicCode = generateClinicCode(order.clinic.name);
  const patientInitials = extractInitials(order.patientName);

  // Get count of orders created before this one in the same clinic
  const previousOrdersCount = await prisma.order.count({
    where: {
      clinicId: order.clinicId,
      createdAt: {
        lt: order.createdAt,
      },
    },
  });

  const sequentialNumber = String(previousOrdersCount + 1).padStart(
    ORDER_NUMBER_DIGITS,
    ORDER_NUMBER_PAD_CHAR
  );

  return `${clinicCode}-${patientInitials}-${sequentialNumber}`;
}
