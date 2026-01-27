import * as sendpulse from 'sendpulse-api';

const API_USER_ID = process.env.SENDPULSE_API_USER_ID || '';
const API_SECRET = process.env.SENDPULSE_API_SECRET || '';
const TOKEN_STORAGE = '/tmp/';
const SENDER_EMAIL = process.env.SENDPULSE_SENDER_EMAIL || '';
const SENDER_NAME = process.env.SENDPULSE_SENDER_NAME || 'LabWiseLink';

let isInitialized = false;

function initSendPulse(): Promise<void> {
  return new Promise((resolve) => {
    if (isInitialized) {
      resolve();
      return;
    }
    sendpulse.init(API_USER_ID, API_SECRET, TOKEN_STORAGE, () => {
      isInitialized = true;
      resolve();
    });
  });
}

interface EmailRecipient {
  name: string;
  email: string;
}

interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
}

interface SendPulseResponse {
  result?: boolean;
  id?: string;
  error_code?: number;
  message?: string;
}

/**
 * Sends an email using SendPulse SMTP API
 *
 * @param options - Email options including recipients, subject, and content
 * @returns Promise<boolean> - true if email was sent successfully, false otherwise
 *
 * @example
 * await sendEmail({
 *   to: [{ name: 'Doctor', email: 'doctor@clinic.com' }],
 *   subject: 'Orden enviada',
 *   html: '<h1>Tu orden fue enviada</h1>',
 *   text: 'Tu orden fue enviada',
 * });
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  // Skip sending if SendPulse is not configured
  if (!API_USER_ID || !API_SECRET) {
    console.warn('[Email] SendPulse no configurado, omitiendo envío de email:', options.subject);
    return false;
  }

  if (!SENDER_EMAIL) {
    console.warn('[Email] SENDPULSE_SENDER_EMAIL no configurado, omitiendo envío de email');
    return false;
  }

  try {
    await initSendPulse();

    return new Promise((resolve) => {
      const email = {
        html: options.html,
        text: options.text || '',
        subject: options.subject,
        from: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: options.to,
      };

      sendpulse.smtpSendMail((data: SendPulseResponse) => {
        if (data.result) {
          console.log('[Email] Enviado exitosamente:', {
            subject: options.subject,
            recipients: options.to.map((r) => r.email),
            id: data.id,
          });
          resolve(true);
        } else {
          console.error('[Email] Error al enviar:', {
            subject: options.subject,
            error: data.message,
            code: data.error_code,
          });
          resolve(false);
        }
      }, email);
    });
  } catch (error) {
    console.error('[Email] Error inesperado al enviar email:', error);
    return false;
  }
}
