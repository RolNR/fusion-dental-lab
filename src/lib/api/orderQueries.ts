/**
 * Shared Prisma query configurations for order-related operations
 */

/**
 * Standard include configuration for fetching order details with all related data
 * Used across doctor order API endpoints
 */
export const orderDetailInclude = {
  doctor: {
    select: {
      name: true,
      email: true,
      phone: true,
      clinicName: true,
      clinicAddress: true,
      doctorLaboratory: {
        select: {
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      },
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
  pruebas: {
    select: {
      id: true,
      tipo: true,
      nota: true,
      completada: true,
      aprobada: true,
      notasCliente: true,
      registradaAt: true,
      respondidaAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
} as const;
