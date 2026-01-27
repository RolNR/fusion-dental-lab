import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import {
  getDoctorOrderSubmittedEmail,
  getLabAdminNewOrderEmail,
  OrderEmailData,
} from '@/lib/email-templates';

interface OrderDoctor {
  id: string;
  name: string;
  email: string;
  clinicName: string | null;
  doctorLaboratoryId: string | null;
}

interface OrderForNotification {
  id: string;
  orderNumber: string;
  patientName: string;
  isUrgent: boolean;
  createdAt: Date;
  doctor: OrderDoctor;
  _count?: { teeth: number };
}

/**
 * Sends email notifications when an order is submitted for review.
 * Sends to:
 * 1. Doctor - confirmation that their order was submitted
 * 2. Lab Admins - notification of new order to review
 *
 * This function is non-blocking and catches all errors internally.
 * It should be called with .catch() to handle any uncaught errors gracefully.
 *
 * @param order - The order that was just submitted
 */
export async function sendOrderSubmittedNotifications(
  order: OrderForNotification
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Get teeth count if not provided
  let teethCount = order._count?.teeth;
  if (teethCount === undefined) {
    const countResult = await prisma.tooth.count({
      where: { orderId: order.id },
    });
    teethCount = countResult;
  }

  const emailData: OrderEmailData = {
    orderNumber: order.orderNumber,
    patientName: order.patientName,
    doctorName: order.doctor.name,
    clinicName: order.doctor.clinicName || 'Sin clínica',
    teethCount: teethCount,
    isUrgent: order.isUrgent,
    createdAt: new Date(order.createdAt).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    orderUrl: '', // Will be set per recipient
  };

  // 1. Send email to Doctor
  try {
    const doctorEmail = getDoctorOrderSubmittedEmail({
      ...emailData,
      orderUrl: `${baseUrl}/doctor/orders/${order.id}`,
    });

    await sendEmail({
      to: [{ name: order.doctor.name, email: order.doctor.email }],
      subject: doctorEmail.subject,
      html: doctorEmail.html,
      text: doctorEmail.text,
    });
  } catch (error) {
    console.error('[OrderNotifications] Error enviando email al doctor:', error);
  }

  // 2. Send email to Lab Admin(s)
  if (order.doctor.doctorLaboratoryId) {
    try {
      const laboratory = await prisma.laboratory.findUnique({
        where: { id: order.doctor.doctorLaboratoryId },
        include: {
          labAdmins: {
            where: { role: Role.LAB_ADMIN },
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (laboratory?.labAdmins && laboratory.labAdmins.length > 0) {
        const labAdminEmail = getLabAdminNewOrderEmail({
          ...emailData,
          orderUrl: `${baseUrl}/lab-admin/orders/${order.id}`,
        });

        await sendEmail({
          to: laboratory.labAdmins.map((admin) => ({
            name: admin.name,
            email: admin.email,
          })),
          subject: labAdminEmail.subject,
          html: labAdminEmail.html,
          text: labAdminEmail.text,
        });
      }
    } catch (error) {
      console.error(
        '[OrderNotifications] Error enviando email a lab admins:',
        error
      );
    }
  }
}
