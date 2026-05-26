import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface PurchaseEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  paymentMethod: string;
  shippingMethod?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly adminEmail: string;
  private enabled: boolean;

  constructor(private configService: ConfigService) {
    this.adminEmail = this.configService.get<string>('EMAIL_ADMIN', 'darmfma@gmail.com');
    this.enabled = this.configService.get<boolean>('EMAIL_ENABLED', true);

    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');

    if (!emailUser || !emailPassword) {
      this.logger.warn('Email credentials not configured — email notifications disabled.');
      this.enabled = false;
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('EMAIL_SERVICE', 'gmail'),
      auth: { user: emailUser, pass: emailPassword },
    });

    this.logger.log(`EmailService ready. Admin: ${this.adminEmail}`);
  }

  private get from(): string {
    return this.configService.get<string>('EMAIL_FROM', '"Hydra TCG" <noreply@hydra-tcg.com>');
  }

  async sendPurchaseNotification(data: PurchaseEmailData): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: this.adminEmail,
        subject: `🛒 Nueva Compra - Pedido #${data.orderId.substring(0, 8)}`,
        html: this.purchaseHtml(data),
      });
      this.logger.log(`Purchase email sent to admin for order ${data.orderId}`);
    } catch (err) {
      this.logger.error(`Purchase email failed: ${err.message}`);
    }
  }

  async sendCustomerConfirmation(data: PurchaseEmailData): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: data.customerEmail,
        subject: `🎉 ¡Gracias por tu compra! - Pedido #${data.orderId.substring(0, 8)}`,
        html: this.customerConfirmationHtml(data),
      });
    } catch (err) {
      this.logger.error(`Customer confirmation email failed: ${err.message}`);
    }
  }

  async sendPaymentConfirmation(data: PurchaseEmailData): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: this.adminEmail,
        subject: `✅ Pago Confirmado - Pedido #${data.orderId.substring(0, 8)}`,
        html: this.paymentHtml(data, true),
      });
    } catch (err) {
      this.logger.error(`Payment confirmation email failed: ${err.message}`);
    }
  }

  async sendCustomerPaymentConfirmation(data: PurchaseEmailData): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: data.customerEmail,
        subject: `💳 Pago Recibido - Pedido #${data.orderId.substring(0, 8)}`,
        html: this.paymentHtml(data, false),
      });
    } catch (err) {
      this.logger.error(`Customer payment email failed: ${err.message}`);
    }
  }

  async sendChatAlert(senderName: string, messageContent: string): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: this.adminEmail,
        subject: `💬 Nuevo mensaje en el chat de Hydra - de ${senderName}`,
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nuevo Mensaje en Hydra Collectables</title>
</head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#0b0f19;color:#e2e8f0;">
  <div style="background:linear-gradient(135deg,#0d9488,#14b8a6);padding:35px 20px;border-radius:16px 16px 0 0;text-align:center;box-shadow:0 4px 20px rgba(13,148,136,0.15);">
    <h1 style="color:white;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.025em;text-shadow:0 2px 4px rgba(0,0,0,0.1);">💬 Nuevo Mensaje Recibido</h1>
    <p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:15px;">Un cliente se ha puesto en contacto a través del chat</p>
  </div>
  <div style="background:#111827;padding:35px;border-radius:0 0 16px 16px;border:1px solid #1f2937;border-top:none;box-shadow:0 10px 25px rgba(0,0,0,0.3);">
    <div style="margin-bottom:25px;">
      <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#0d9488;">Cliente</span>
      <p style="font-size:18px;font-weight:600;color:#f3f4f6;margin:5px 0 0 0;">${senderName}</p>
    </div>
    
    <div style="margin-bottom:30px;">
      <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#0d9488;">Mensaje</span>
      <div style="background:#1f2937;padding:20px;border-radius:12px;border:1px solid #374151;color:#f3f4f6;font-size:15px;line-height:1.6;font-style:italic;margin-top:5px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.1);">
        "${messageContent}"
      </div>
    </div>
    
    <div style="text-align:center;margin-top:35px;">
      <a href="https://admin.hydracollectables.com/dashboard/chat" style="background:#0d9488;color:white;padding:14px 28px;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 4px 14px rgba(13,148,136,0.3);transition:all 0.2s ease-in-out;">
        Responder en el Panel Admin
      </a>
    </div>
    
    <div style="margin-top:40px;border-top:1px solid #1f2937;padding-top:20px;text-align:center;font-size:12px;color:#6b7280;">
      <p style="margin:0;">Este es un correo automático del sistema de notificaciones de Hydra Collectables.</p>
    </div>
  </div>
</body>
</html>`,
      });
      this.logger.log(`Chat alert email sent to admin for message from ${senderName}`);
    } catch (err) {
      this.logger.error(`Chat alert email failed: ${err.message}`);
    }
  }

  private itemsTable(items: PurchaseEmailData['items'], color: string): string {
    const rows = items
      .map(
        (i) => `<tr>
          <td style="padding:10px;border-bottom:1px solid #eee">${i.name}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${i.price}</td>
        </tr>`,
      )
      .join('');
    return `<table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:${color};color:white">
        <th style="padding:10px;text-align:left">Producto</th>
        <th style="padding:10px;text-align:center">Cant.</th>
        <th style="padding:10px;text-align:right">Precio</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  }

  private purchaseHtml(data: PurchaseEmailData): string {
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center">
        <h1>🎉 Nueva Compra Realizada</h1></div>
      <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px">
        <p><strong>Pedido:</strong> ${data.orderId}</p>
        <p><strong>Cliente:</strong> ${data.customerName} &lt;${data.customerEmail}&gt;</p>
        <p><strong>Pago:</strong> ${data.paymentMethod}</p>
        ${this.itemsTable(data.items, '#667eea')}
        <p style="font-size:24px;font-weight:bold;color:#764ba2">Total: ${data.totalAmount}</p>
      </div></body></html>`;
  }

  private customerConfirmationHtml(data: PurchaseEmailData): string {
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#00C853,#B2FF59);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center">
        <h1>¡Gracias por tu compra!</h1></div>
      <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px">
        <p><strong>Pedido:</strong> ${data.orderId}</p>
        ${this.itemsTable(data.items, '#2E7D32')}
        <p style="font-size:24px;font-weight:bold;color:#2E7D32">Total: ${data.totalAmount}</p>
        <p>Te notificaremos cuando tu pedido sea enviado.</p>
      </div></body></html>`;
  }

  private paymentHtml(data: PurchaseEmailData, isAdmin: boolean): string {
    const color = isAdmin ? '#667eea' : '#2E7D32';
    const title = isAdmin ? '✅ Pago Confirmado' : '💳 Pago Recibido';
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:${color};color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center">
        <h1>${title}</h1></div>
      <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px">
        <p><strong>Pedido:</strong> ${data.orderId}</p>
        <p><strong>Cliente:</strong> ${data.customerName}</p>
        ${this.itemsTable(data.items, color)}
        <p style="font-size:24px;font-weight:bold;color:${color}">Total: ${data.totalAmount}</p>
      </div></body></html>`;
  }
}
