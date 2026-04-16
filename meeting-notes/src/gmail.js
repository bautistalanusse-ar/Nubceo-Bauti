'use strict';

const { google } = require('googleapis');
const { convert } = require('html-to-text');

/**
 * Crea el cliente OAuth2 de Gmail usando las credenciales del .env
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
 * Busca en Gmail los mails de notas de reunión de Gemini/Google Meet del día de hoy.
 * Google Meet + Gemini manda los mails desde meet-recordings-noreply@google.com
 * con asunto "Notas de la reunión: ..." o "Meeting notes: ..."
 *
 * @returns {Promise<Array>} Lista de emails parseados
 */
async function fetchTodayMeetingNotes() {
  const auth = buildAuth();
  const gmail = google.gmail({ version: 'v1', auth });

  // Construir query para encontrar notas de hoy
  // Acepta tanto español como inglés, ya que depende del idioma de la cuenta
  const query = [
    '(',
    '  from:meet-recordings-noreply@google.com',
    '  OR subject:"Notas de la reunión"',
    '  OR subject:"Meeting notes"',
    ')',
    'newer_than:1d',
  ].join(' ');

  console.log('[Gmail] Buscando notas de reuniones de hoy...');
  console.log('[Gmail] Query:', query);

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 50,
  });

  const messages = listRes.data.messages || [];
  console.log(`[Gmail] Encontrados ${messages.length} mail(s) de notas de reunión`);

  if (messages.length === 0) return [];

  // Obtener contenido completo de cada mail
  const emails = await Promise.all(
    messages.map((msg) => fetchEmailDetail(gmail, msg.id))
  );

  // Filtrar nulls y ordenar por fecha
  return emails
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);
}

/**
 * Obtiene el detalle completo de un mail y lo parsea.
 */
async function fetchEmailDetail(gmail, messageId) {
  try {
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const msg = res.data;
    const headers = msg.payload.headers || [];

    const subject = getHeader(headers, 'Subject') || '(Sin asunto)';
    const from = getHeader(headers, 'From') || '';
    const dateStr = getHeader(headers, 'Date') || '';
    const date = new Date(dateStr);

    // Extraer el cuerpo del mail (HTML o texto plano)
    const rawBody = extractBody(msg.payload);
    const textBody = rawBody.html
      ? convert(rawBody.html, {
          wordwrap: false,
          selectors: [
            { selector: 'a', options: { ignoreHref: true } },
            { selector: 'img', format: 'skip' },
          ],
        })
      : rawBody.plain || '';

    // Verificar que sea del día de hoy
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    if (!isToday) {
      console.log(`[Gmail] Ignorando mail de otra fecha: ${dateStr}`);
      return null;
    }

    return {
      id: messageId,
      subject,
      from,
      date,
      body: textBody,
      bodyHtml: rawBody.html || null,
    };
  } catch (err) {
    console.error(`[Gmail] Error al obtener mail ${messageId}:`, err.message);
    return null;
  }
}

/**
 * Extrae el cuerpo del mail, priorizando HTML sobre texto plano.
 */
function extractBody(payload) {
  let html = '';
  let plain = '';

  function walk(part) {
    if (!part) return;
    const mime = part.mimeType || '';

    if (mime === 'text/html' && part.body?.data) {
      html = Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (mime === 'text/plain' && part.body?.data) {
      plain = Buffer.from(part.body.data, 'base64').toString('utf-8');
    }

    if (part.parts) {
      part.parts.forEach(walk);
    }
  }

  walk(payload);
  return { html, plain };
}

function getHeader(headers, name) {
  const h = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return h ? h.value : null;
}

module.exports = { fetchTodayMeetingNotes };
