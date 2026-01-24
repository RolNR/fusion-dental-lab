import { Role } from '@prisma/client';
import { createSubmitOrderHandler } from '@/lib/api/submitOrderHandler';

export const POST = createSubmitOrderHandler([Role.DOCTOR]);
