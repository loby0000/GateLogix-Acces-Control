// backend/src/utils/emailService.js
const nodemailer = require('nodemailer');

// Configuración SMTP (Gmail)
const smtpHost = process.env.EMAIL_HOST; // ej: smtp.gmail.com
const smtpPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
const smtpUser = process.env.EMAIL_USER; // cuenta Gmail
const smtpPass = process.env.EMAIL_PASS; // app password de Gmail (sin espacios)
const fromName = process.env.MAILERSEND_FROM_NAME || 'GateLogix';
const fromEmail = smtpUser; // remitente

let transporter = null;
if (smtpHost && smtpPort && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true para 465 (SSL), false para 587 (STARTTLS)
    auth: { user: smtpUser, pass: smtpPass }
  });
}

function dataUrlToAttachment(dataUrl, filename = 'codigo_barras.png') {
  const base64 = (dataUrl || '').split(',')[1];
  if (!base64) {
    throw new Error('barcodeDataUrl inválido, no contiene base64');
  }
  const buffer = Buffer.from(base64, 'base64');
  return {
    filename,
    content: buffer,
    contentType: 'image/png'
  };
}

/**
 * Envía email con el código de barras generado vía SMTP (Gmail).
 * @param {string} toEmail - Correo del usuario destino
 * @param {string} toName - Nombre del usuario
 * @param {string} serial - Serial del equipo
 * @param {string} barcodeDataUrl - Data URL (image/png;base64) del código de barras
 * @param {object} options - Opcionales: asunto, plantilla, texto adicional
 */
async function enviarCodigoBarrasEmail(toEmail, toName, serial, barcodeDataUrl, options = {}) {
  if (!transporter || !fromEmail) {
    throw new Error('SMTP no inicializado: faltan EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS');
  }
  if (!toEmail) {
    throw new Error('Correo destino requerido');
  }

  const attachment = dataUrlToAttachment(barcodeDataUrl, `codigo_barras_${serial || 'equipo'}.png`);
  const subject = options.subject || `Código de barras de su equipo (${serial})`;
  const html = options.html || `
    <div style="font-family:Arial,sans-serif;">
      <h2>Hola ${toName || ''}</h2>
      <p>Se ha registrado el equipo con serial <b>${serial}</b>.</p>
      <p>Adjunto encontrarás el código de barras en formato PNG.</p>
      <p>Gracias,<br/>${fromName}</p>
    </div>
  `;
  const text = options.text || `Se ha registrado el equipo con serial ${serial}. Adjuntamos el código de barras.`;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to: toEmail,
    subject,
    text,
    html,
    attachments: [attachment]
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('📧 Email enviado vía SMTP (Gmail):', info.messageId);
  return info;
}

module.exports = {
  enviarCodigoBarrasEmail
};