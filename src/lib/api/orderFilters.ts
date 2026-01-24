import { Prisma, OrderStatus } from '@prisma/client';

export interface OrderFilterParams {
  search?: string | null;
  status?: OrderStatus | null;
  laboratoryId?: string | null;
  doctorId?: string | null;
}

/**
 * Builds a Prisma where clause for order queries with search and filter support
 * @param params - Filter parameters including search, status, and role-specific constraints
 * @returns Prisma where clause for Order.findMany
 */
export function buildOrderWhereClause(params: OrderFilterParams): Prisma.OrderWhereInput {
  const { search, status, laboratoryId, doctorId } = params;

  const where: Prisma.OrderWhereInput = {};

  // Lab users: filter by doctor's laboratory membership
  if (laboratoryId) {
    where.doctor = { doctorLaboratoryId: laboratoryId };
  }

  if (doctorId) {
    where.doctorId = doctorId;
  }

  // Status filter
  if (status) {
    where.status = status;
  }

  // Text search across multiple fields
  if (search && search.trim()) {
    const searchConditions: Prisma.OrderWhereInput[] = [
      { patientName: { contains: search.trim(), mode: 'insensitive' } },
      { orderNumber: { contains: search.trim(), mode: 'insensitive' } },
    ];

    // Include doctor name in search if not filtering by specific doctor
    if (!doctorId) {
      searchConditions.push({
        doctor: { name: { contains: search.trim(), mode: 'insensitive' } },
      });
    }

    where.OR = searchConditions;
  }

  return where;
}
