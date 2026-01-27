export interface OrderEmailData {
  orderNumber: string;
  patientName: string;
  doctorName: string;
  clinicName: string;
  teethCount: number;
  isUrgent: boolean;
  createdAt: string;
  orderUrl: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Email template for doctor when their order is submitted for review
 */
export function getDoctorOrderSubmittedEmail(data: OrderEmailData): EmailTemplate {
  const subject = `Orden #${data.orderNumber} enviada para revisión`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 24px 20px; border: 1px solid #e5e7eb; border-top: none; }
    .order-details { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-size: 14px; }
    .detail-value { font-weight: 600; color: #111827; }
    .urgent-badge { background: #fbbf24; color: #78350f; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; display: inline-block; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 16px; font-weight: 600; }
    .btn:hover { background: #1d4ed8; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background: #f9fafb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Orden Enviada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${data.doctorName}</strong>,</p>
      <p>Tu orden ha sido enviada exitosamente para revisión del laboratorio.</p>

      <div class="order-details">
        <div class="detail-row">
          <div class="detail-label">Número de Orden</div>
          <div class="detail-value">#${data.orderNumber}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Paciente</div>
          <div class="detail-value">${data.patientName}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Dientes</div>
          <div class="detail-value">${data.teethCount} ${data.teethCount === 1 ? 'pieza' : 'piezas'}</div>
        </div>
        ${data.isUrgent ? `<div class="detail-row"><div class="detail-label">Prioridad</div><div><span class="urgent-badge">⚡ URGENTE</span></div></div>` : ''}
        <div class="detail-row">
          <div class="detail-label">Fecha de Envío</div>
          <div class="detail-value">${data.createdAt}</div>
        </div>
      </div>

      <p>Recibirás una notificación cuando el laboratorio actualice el estado de tu orden.</p>

      <center>
        <a href="${data.orderUrl}" class="btn">Ver Orden</a>
      </center>
    </div>
    <div class="footer">
      <p>Este correo fue enviado automáticamente por LabWiseLink.<br>Por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Orden Enviada - #${data.orderNumber}

Hola ${data.doctorName},

Tu orden ha sido enviada exitosamente para revisión del laboratorio.

Detalles:
- Número de Orden: #${data.orderNumber}
- Paciente: ${data.patientName}
- Dientes: ${data.teethCount} ${data.teethCount === 1 ? 'pieza' : 'piezas'}
${data.isUrgent ? '- Prioridad: URGENTE' : ''}
- Fecha de Envío: ${data.createdAt}

Ver orden: ${data.orderUrl}

Recibirás una notificación cuando el laboratorio actualice el estado de tu orden.

---
Este correo fue enviado automáticamente por LabWiseLink.
`;

  return { subject, html, text };
}

/**
 * Email template for lab admin when a new order is submitted for review
 */
export function getLabAdminNewOrderEmail(data: OrderEmailData): EmailTemplate {
  const urgentPrefix = data.isUrgent ? '[URGENTE] ' : '';
  const subject = `${urgentPrefix}Nueva orden #${data.orderNumber} de ${data.clinicName}`;

  const headerBg = data.isUrgent ? '#dc2626' : '#059669';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${headerBg}; color: white; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 24px 20px; border: 1px solid #e5e7eb; border-top: none; }
    .order-details { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-size: 14px; }
    .detail-value { font-weight: 600; color: #111827; }
    .urgent-badge { background: #fbbf24; color: #78350f; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; display: inline-block; }
    .btn { display: inline-block; background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 16px; font-weight: 600; }
    .btn:hover { background: #047857; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background: #f9fafb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.isUrgent ? '⚡ Nueva Orden URGENTE' : '📋 Nueva Orden'}</h1>
    </div>
    <div class="content">
      <p>Se ha recibido una nueva orden para revisión.</p>

      <div class="order-details">
        <div class="detail-row">
          <div class="detail-label">Número de Orden</div>
          <div class="detail-value">#${data.orderNumber}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Clínica</div>
          <div class="detail-value">${data.clinicName}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Doctor</div>
          <div class="detail-value">${data.doctorName}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Paciente</div>
          <div class="detail-value">${data.patientName}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Dientes</div>
          <div class="detail-value">${data.teethCount} ${data.teethCount === 1 ? 'pieza' : 'piezas'}</div>
        </div>
        ${data.isUrgent ? `<div class="detail-row"><div class="detail-label">Prioridad</div><div><span class="urgent-badge">⚡ URGENTE</span></div></div>` : ''}
        <div class="detail-row">
          <div class="detail-label">Fecha de Envío</div>
          <div class="detail-value">${data.createdAt}</div>
        </div>
      </div>

      <center>
        <a href="${data.orderUrl}" class="btn">Revisar Orden</a>
      </center>
    </div>
    <div class="footer">
      <p>Este correo fue enviado automáticamente por LabWiseLink.<br>Por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
${data.isUrgent ? '[URGENTE] ' : ''}Nueva Orden - #${data.orderNumber}

Se ha recibido una nueva orden para revisión.

Detalles:
- Número de Orden: #${data.orderNumber}
- Clínica: ${data.clinicName}
- Doctor: ${data.doctorName}
- Paciente: ${data.patientName}
- Dientes: ${data.teethCount} ${data.teethCount === 1 ? 'pieza' : 'piezas'}
${data.isUrgent ? '- Prioridad: URGENTE' : ''}
- Fecha de Envío: ${data.createdAt}

Revisar orden: ${data.orderUrl}

---
Este correo fue enviado automáticamente por LabWiseLink.
`;

  return { subject, html, text };
}
