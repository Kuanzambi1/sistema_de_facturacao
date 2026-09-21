import nodemailer from "nodemailer";
import { ENV } from "./env";

/**
 * Serviço de email transacional via SMTP (Brevo).
 *
 * - Se SMTP_HOST estiver configurado, cria um transporter SMTP e envia
 *   os emails directamente.
 * - Caso contrário, regista no console (modo desenvolvimento).
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: EmailAttachment[];
};

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;

  if (ENV.smtpHost && ENV.smtpUser && ENV.smtpPass) {
    _transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: ENV.smtpPort === 465,
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });
    console.log(`[Email] SMTP configurado: ${ENV.smtpHost}:${ENV.smtpPort}`);
    return _transporter;
  }

  return null;
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  console.log(`[Email] sendEmail() chamado — to=${message.to} subject="${message.subject}"`);
  if (!message.to) {
    console.warn("[Email] Destinatário vazio, ignorado.");
    return false;
  }
  const from = message.from ?? ENV.emailFrom;

  const transporter = getTransporter();
  if (transporter) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
      };
      if (message.attachments && message.attachments.length > 0) {
        mailOptions.attachments = message.attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        }));
      }
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email] ✓ Enviado para ${message.to} | messageId=${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`[Email] ✗ Falha ao enviar para ${message.to}:`, error);
      return false;
    }
  }

  // Modo desenvolvimento — sem SMTP configurado
  console.warn(`[Email] (dev, não enviado) to=${message.to} subject="${message.subject}"`);
  return false;
}

export function invoiceEmailHtml(invoice: { fullNumber: string; totalAmount: string | number; atcud?: string | null; clientName?: string | null }, portalUrl?: string): string {
  const total = Number(invoice.totalAmount).toFixed(2);
  const fullNumber = escapeHtml(invoice.fullNumber);
  const clientName = invoice.clientName ? escapeHtml(invoice.clientName) : "";
  const atcud = invoice.atcud ? escapeHtml(invoice.atcud) : "";
  const portal = portalUrl ? `<p><a href="${portalUrl}" style="display:inline-block;background:#004b36;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Ver/descarregar documento</a></p>` : "";
  return `
  <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#222;">
    <h2 style="color:#004b36;">Nova factura emitida</h2>
    <p>Olá${clientName ? ` ${clientName}` : ""},</p>
    <p>Foi emitida a factura <strong>${fullNumber}</strong> no valor de <strong>${total} AOA</strong>.</p>
    ${atcud ? `<p>ATCUD: <code>${atcud}</code></p>` : ""}
    ${portal}
    <p style="color:#777;font-size:12px;">Documento emitido electronicamente. Obrigado pela preferência.</p>
  </div>`;
}

export function reminderEmailHtml(invoice: { fullNumber: string; totalAmount: string | number; dueDate?: Date | string | null; clientName?: string | null }, portalUrl?: string): string {
  const total = Number(invoice.totalAmount).toFixed(2);
  const fullNumber = escapeHtml(invoice.fullNumber);
  const clientName = invoice.clientName ? escapeHtml(invoice.clientName) : "";
  const due = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("pt-AO") : "—";
  const portal = portalUrl ? `<p><a href="${portalUrl}" style="display:inline-block;background:#004b36;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Pagar / ver detalhe</a></p>` : "";
  return `
  <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#222;">
    <h2 style="color:#004b36;">Lembrete de pagamento</h2>
    <p>Olá${clientName ? ` ${clientName}` : ""},</p>
    <p>Recordamos que a factura <strong>${fullNumber}</strong>, no valor de <strong>${total} AOA</strong>, tem vencimento a <strong>${due}</strong>.</p>
    ${portal}
    <p style="color:#777;font-size:12px;">Obrigado pela preferência.</p>
  </div>`;
}
