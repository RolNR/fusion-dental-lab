import { prisma } from '@/lib/prisma';
import { Prisma, WorkType, RestorationType } from '@prisma/client';

interface ToothData {
  toothNumber: string;
  material?: string;
  materialBrand?: string;
  colorInfo?: Prisma.InputJsonValue;
  tipoTrabajo?: WorkType | null;
  tipoRestauracion?: RestorationType | null;
  trabajoSobreImplante?: boolean;
  informacionImplante?: Prisma.InputJsonValue;
}

interface UpdateOrderWithTeethParams {
  orderId: string;
  orderFields: Omit<Prisma.OrderUpdateInput, 'teeth'>;
  teeth?: ToothData[];
  include?: Prisma.OrderInclude;
}

/**
 * Update an order and its teeth in a transaction
 */
export async function updateOrderWithTeeth<T extends Prisma.OrderInclude>(
  params: UpdateOrderWithTeethParams & { include: T }
): Promise<Prisma.OrderGetPayload<{ include: T }>>;
export async function updateOrderWithTeeth(
  params: UpdateOrderWithTeethParams
): Promise<Prisma.OrderGetPayload<object>>;
export async function updateOrderWithTeeth(
  params: UpdateOrderWithTeethParams
) {
  const { orderId, orderFields, teeth, include } = params;

  return await prisma.$transaction(async (tx) => {
    // Update order fields
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: orderFields,
      include,
    });

    // Handle teeth updates if provided
    if (teeth) {
      const teethNumbers = teeth.map((t) => t.toothNumber);

      // Delete teeth that are no longer in the list
      await tx.tooth.deleteMany({
        where: {
          orderId,
          toothNumber: { notIn: teethNumbers },
        },
      });

      // Upsert each tooth
      for (const tooth of teeth) {
        await tx.tooth.upsert({
          where: {
            orderId_toothNumber: {
              orderId,
              toothNumber: tooth.toothNumber,
            },
          },
          update: {
            material: tooth.material,
            materialBrand: tooth.materialBrand,
            colorInfo: tooth.colorInfo,
            tipoTrabajo: tooth.tipoTrabajo,
            tipoRestauracion: tooth.tipoRestauracion,
            trabajoSobreImplante: tooth.trabajoSobreImplante,
            informacionImplante: tooth.informacionImplante,
          },
          create: {
            orderId,
            toothNumber: tooth.toothNumber,
            material: tooth.material,
            materialBrand: tooth.materialBrand,
            colorInfo: tooth.colorInfo,
            tipoTrabajo: tooth.tipoTrabajo,
            tipoRestauracion: tooth.tipoRestauracion,
            trabajoSobreImplante: tooth.trabajoSobreImplante,
            informacionImplante: tooth.informacionImplante,
          },
        });
      }
    }

    return updatedOrder;
  });
}
