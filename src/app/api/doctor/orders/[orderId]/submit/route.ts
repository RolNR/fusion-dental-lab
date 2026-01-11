import { Role } from '@prisma/client';
import { createSubmitOrderHandler } from '@/lib/api/submitOrderHandler';

export const POST = createSubmitOrderHandler([
  Role.DOCTOR,
  Role.CLINIC_ASSISTANT,
  Role.CLINIC_ADMIN,
]);
