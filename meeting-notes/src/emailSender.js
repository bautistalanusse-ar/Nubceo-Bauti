'use strict';

const { google } = require('googleapis');
const { buildEmailHtml, buildEmailSubject } = require('./template');

const NUBCEO_EMAIL = process.env.NUBCEO_EMAIL || 'agenda.virtual@nubceo.com';

/**
 * Construye el cliente Gmail OAuth2.
 */
function buildAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  auth.setCredentials({
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return auth;
}

/**
 * Envía el resumen diario de reuniones a agenda.virtual@nubceo.com
 *
 * @param {Date} date - Fecha del día
 * @param {Array} meetings - Array de { email, analysis, error }
 */
async function sendDailySummary(date, meetings) {
  const auth = buildAuth();
  const gmail = google.gmail({ version: 'v1', auth });

  const subject = buildEmailSubject(date, meetings.length);
  const htmlBody = buildEmailHtml(date, meetings);

  // Construir el mensaje en formato RFC 2822
  const rawEmail = buildRawEmail({
    to: NUBCEO_EMAIL,
    subject,
    htmlBody,
  });

  console.log(`[EmailSender] Enviando resumen a ${NUBCEO_EMAIL}...`);
  console.log(`[EmailSender] Asunto: "${subject}"`);

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawEmail,
    },
  });

  console.log(`[EmailSender] Email enviado. ID: ${response.data.id}`);
  return response.data;
}

/**
 * Construye un email en formato base64url RFC 2822.
 */
function buildRawEmail({ to, subject, htmlBody }) {
  const boundary = `nubceo_${Date.now()}`;

  const lines = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(stripHtml(htmlBody)).toString('base64'),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(htmlBody).toString('base64'),
    ``,
    `--${boundary}--`,
  ];

  const raw = lines.join('\r\n');
  // Codificar en base64url (requerido por Gmail API)
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

module.exports = { sendDailySummary };
