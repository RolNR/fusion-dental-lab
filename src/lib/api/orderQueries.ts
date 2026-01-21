/**
 * Shared Prisma query configurations for order-related operations
 */

/**
 * Standard include configuration for fetching order details with all related data
 * Used across doctor and assistant order API endpoints
 */
export const orderDetailInclude = {
  clinic: {
    select: {
      name: true,
      email: true,
      phone: true,
      address: true,
      laboratory: {
        select: {
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      },
    },
  },
  doctor: {
    select: {
      name: true,
      email: true,
    },
  },
  createdBy: {
    select: {
      name: true,
      role: true,
    },
  },
  files: true,
  teeth: {
    orderBy: {
      toothNumber: 'asc' as const,
    },
  },
  comments: {
    include: {
      author: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
} as const;
