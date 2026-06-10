'use strict';

// GET /api/nubo-stats
//
// Env vars requeridas:
//   PIPEDRIVE_TOKEN        — API token de Pipedrive
//   GOOGLE_CLIENT_ID       — OAuth2 client id (mismo que meeting-notes)
//   GOOGLE_CLIENT_SECRET   — OAuth2 client secret
//   GOOGLE_REFRESH_TOKEN   — OAuth2 refresh token
//   GOOGLE_CALENDAR_ID     — ID del calendario (opcional, default "primary")
//   NUBCEO_DOMAIN          — dominio interno para filtrar externos (default "nubceo.com")
//   ALLOWED_ORIGIN         — origen permitido en CORS (ej: https://sales.nubceo.com)

// ─── Pipedrive ───────────────────────────────────────────────────────────────

const PD_BASE = 'https://api.pipedrive.com/v1';
const OPEN_PIPELINES = new Set([149, 151, 159]);

async function pdFetch(path, params = {}) {
  const url = new URL(`${PD_BASE}${path}`);
  url.searchParams.set('api_token', process.env.PIPEDRIVE_TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = await r.json();
  return j.data || [];
}

async function pdAllPages(path, params = {}) {
  const pages = Array.from({ length: 18 }, (_, i) =>
    pdFetch(path, { ...params, limit: 500, start: i * 500 })
  );
  const results = await Promise.all(pages);
  const all = [];
  for (const data of results) {
    if (!data?.length) break;
    all.push(...data);
  }
  return all;
}

// Espejo exacto de actSt() del dashboard
function actSt(d) {
  const pend = d.undone_activities_count || 0;
  if (!pend || !d.next_activity_date) return 'noact';
  const now = new Date();
  const isOverdue = d.next_activity_time
    ? new Date(`${d.next_activity_date}T${d.next_activity_time}`) < now
    : (() => {
        const nd = new Date(d.next_activity_date); nd.setHours(0, 0, 0, 0);
        const td = new Date(); td.setHours(0, 0, 0, 0);
        return nd < td;
      })();
  if (isOverdue) return pend > 1 ? 'over_future' : 'over';
  return 'ok';
}

function daysSince(iso) {
  if (!iso) return null;
  const d = new Date(iso.slice(0, 10)); d.setHours(0, 0, 0, 0);
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.round((n - d) / 864e5);
}

async function pipedriveStats() {
  const d7 = new Date(); d7.setDate(d7.getDate() - 7);
  const d7str = d7.toISOString().slice(0, 10);

  const [rawDeals, meetingActs] = await Promise.all([
    pdAllPages('/deals', { status: 'open' }),
    pdFetch('/activities', { type: 'meeting', done: 1, start_date: d7str, limit: 500 })
  ]);

  const deals = rawDeals.filter(d => OPEN_PIPELINES.has(d.pipeline_id));
  const total = deals.length;
  const okCount = deals.filter(d => actSt(d) === 'ok').length;

  const atencion = deals
    .filter(d => ['noact', 'over', 'over_future'].includes(actSt(d)))
    .map(d => ({
      nombre: d.title || '—',
      comercial: d.user_id?.name || d.owner_name || '—',
      dias: daysSince(d.last_activity_date) ?? daysSince(d.add_time?.slice(0, 10)) ?? 0
    }))
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 5);

  return {
    seguimientosAlDia: total ? Math.round((okCount / total) * 100) : 0,
    primerasReuniones7d: Array.isArray(meetingActs) ? meetingActs.length : 0,
    atencion
  };
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Caché en memoria — se renueva automáticamente cuando expira
let _tok = null, _tokExp = 0;

async function googleToken() {
  if (_tok && Date.now() < _tokExp - 60_000) return _tok;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    })
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('google_token_refresh_failed');
  _tok = j.access_token;
  _tokExp = Date.now() + (j.expires_in || 3600) * 1000;
  return _tok;
}

async function gFetch(url) {
  const tok = await googleToken();
  const r = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
  if (!r.ok) return null;
  return r.json();
}

// ─── Google Calendar ──────────────────────────────────────────────────────────

const nubceoDomain = () => process.env.NUBCEO_DOMAIN || 'nubceo.com';

function isExternal(event) {
  return (event.attendees || []).some(
    a => !a.email?.endsWith(nubceoDomain()) && !a.resource
  );
}

function calUrl(calId, tMin, tMax) {
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`;
  const p = new URLSearchParams({
    timeMin: tMin.toISOString(),
    timeMax: tMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '200'
  });
  return `${base}?${p}`;
}

async function calendarStats() {
  const calId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const now = new Date();

  const yStart = new Date(now); yStart.setDate(now.getDate() - 1); yStart.setHours(0, 0, 0, 0);
  const yEnd   = new Date(yStart); yEnd.setHours(23, 59, 59, 999);
  const tStart = new Date(now); tStart.setHours(0, 0, 0, 0);
  const tEnd   = new Date(now); tEnd.setHours(23, 59, 59, 999);
  const fEnd   = new Date(now); fEnd.setDate(now.getDate() + 30);

  const [ayerJ, hoyJ, futJ] = await Promise.all([
    gFetch(calUrl(calId, yStart, yEnd)),
    gFetch(calUrl(calId, tStart, tEnd)),
    gFetch(calUrl(calId, tEnd, fEnd))
  ]);

  const hoyEvs = (hoyJ?.items || []).filter(isExternal);

  const reunionesHoyLista = hoyEvs.map(e => {
    const dt = e.start?.dateTime;
    const hora = dt
      ? new Date(dt).toLocaleTimeString('es-AR', {
          hour: '2-digit', minute: '2-digit',
          timeZone: 'America/Argentina/Buenos_Aires'
        })
      : '00:00';
    const ext = (e.attendees || []).find(
      a => !a.email?.endsWith(nubceoDomain()) && !a.resource
    );
    const con = ext?.displayName || ext?.email?.split('@')[1] || e.summary || '—';
    return { hora, con };
  });

  return {
    reunionesAyer: (ayerJ?.items || []).filter(isExternal).length,
    reunionesHoyLista,
    reunionesAgendadas: (futJ?.items || []).filter(isExternal).length
  };
}

// ─── Gmail — minutas de ayer ──────────────────────────────────────────────────

async function minutasResumen() {
  const q = encodeURIComponent(
    '(from:meet-recordings-noreply@google.com OR subject:"Notas de la reunión" OR subject:"Meeting notes") newer_than:1d'
  );
  const list = await gFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=5`
  );
  const msgs = list?.messages || [];
  if (!msgs.length) return 'sin minutas';

  const subjects = await Promise.all(
    msgs.slice(0, 3).map(async m => {
      const j = await gFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject`
      );
      const raw = j?.payload?.headers?.find(h => h.name === 'Subject')?.value || '';
      return raw.replace(/^(Notas de la reunión|Meeting notes):\s*/i, '').trim();
    })
  );

  const titles = subjects.filter(Boolean);
  if (!titles.length) return 'sin minutas';
  return titles.length === 1
    ? `Reunión: ${titles[0]}.`
    : `${titles.length} reuniones: ${titles.join('; ')}.`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || '';

  if (req.method === 'OPTIONS') {
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') return res.status(405).end();
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);

  const [pd, cal, minR] = await Promise.allSettled([
    pipedriveStats(),
    calendarStats(),
    minutasResumen()
  ]);

  // Cada fuente falla de forma independiente; el endpoint siempre devuelve 200
  const pdVal  = pd.status  === 'fulfilled' ? pd.value  : {};
  const calVal = cal.status === 'fulfilled' ? cal.value : {};
  const min    = minR.status === 'fulfilled' ? minR.value : 'sin minutas';

  return res.status(200).json({
    seguimientosAlDia:  pdVal.seguimientosAlDia  ?? 0,
    primerasReuniones7d: pdVal.primerasReuniones7d ?? 0,
    reunionesAyer:      calVal.reunionesAyer      ?? 0,
    minutasResumen:     min,
    reunionesHoyLista:  calVal.reunionesHoyLista  ?? [],
    reunionesAgendadas: calVal.reunionesAgendadas ?? 0,
    atencion:           pdVal.atencion            ?? []
  });
};
