import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/orderNumberGenerator';
import { Prisma } from '@prisma/client';

const MAX_RETRIES = 3;

interface CreateOrderParams {
  orderData: Omit<Prisma.OrderCreateInput, 'orderNumber'>;
  doctorId: string;
  patientName: string;
}

/**
 * Creates an order with automatic order number generation and retry logic
 * to handle race conditions
 *
 * @param params - Order creation parameters
 * @returns The created order
 * @throws Error if all retries fail
 */
export async function createOrderWithRetry(params: CreateOrderParams) {
  const { orderData, doctorId, patientName } = params;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Generate order number
      const orderNumber = await generateOrderNumber(doctorId, patientName);

      // Attempt to create the order
      const order = await prisma.order.create({
        data: {
          ...orderData,
          orderNumber,
        },
      });

      return order;
    } catch (error) {
      // Check if error is a unique constraint violation on orderNumber
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        error.meta?.target &&
        Array.isArray(error.meta.target) &&
        error.meta.target.includes('orderNumber')
      ) {
        // This is a race condition - retry with a new number
        lastError = new Error(
          `Order number collision detected (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        console.warn(lastError.message);

        // Small delay before retry to reduce collision probability
        await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
        continue;
      }

      // If it's a different error, throw immediately
      throw error;
    }
  }

  // All retries failed
  throw new Error(
    `Failed to create order after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
  );
}
