import { Prisma, OrderStatus } from '@prisma/client';

export interface OrderFilterParams {
  search?: string | null;
  status?: OrderStatus | null;
  clinicId?: string | null;
  laboratoryId?: string | null;
  doctorId?: string | null;
  doctorIds?: string[] | null;
}

/**
 * Builds a Prisma where clause for order queries with search and filter support
 * @param params - Filter parameters including search, status, and role-specific constraints
 * @returns Prisma where clause for Order.findMany
 */
export function buildOrderWhereClause(params: OrderFilterParams): Prisma.OrderWhereInput {
  const { search, status, clinicId, laboratoryId, doctorId, doctorIds } = params;

  const where: Prisma.OrderWhereInput = {};

  // Role-specific constraints
  if (laboratoryId) {
    where.clinic = { laboratoryId };
  }

  if (clinicId) {
    where.clinicId = clinicId;
  }

  if (doctorId) {
    where.doctorId = doctorId;
  }

  if (doctorIds && doctorIds.length > 0) {
    where.doctorId = { in: doctorIds };
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

    // Include clinic name in search for lab roles
    if (laboratoryId && !clinicId) {
      searchConditions.push({
        clinic: { name: { contains: search.trim(), mode: 'insensitive' } },
      });
    }

    where.OR = searchConditions;
  }

  return where;
}
