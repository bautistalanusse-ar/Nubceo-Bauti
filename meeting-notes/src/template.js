'use strict';

/**
 * Genera el HTML del email de resumen diario de reuniones.
 */
function buildEmailHtml(date, meetings) {
  const dateStr = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  const meetingSections = meetings.map((m, i) => buildMeetingSection(m, i + 1)).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resumen de Reuniones</title>
<style>
  body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; color: #222; }
  .container { max-width: 720px; margin: 0 auto; }
  .header { background: #0f172a; color: #fff; padding: 28px 32px; border-radius: 12px 12px 0 0; }
  .header h1 { margin: 0 0 4px 0; font-size: 22px; }
  .header p { margin: 0; color: #94a3b8; font-size: 14px; }
  .logo { font-weight: 800; color: #38bdf8; letter-spacing: -0.5px; }
  .meeting-card { background: #fff; border-radius: 0; border-left: 4px solid #38bdf8; margin-bottom: 4px; padding: 24px 32px; }
  .meeting-card:last-child { border-radius: 0 0 12px 12px; }
  .meeting-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
  .meeting-meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 18px 0 8px 0; display: flex; align-items: center; gap: 6px; }
  .section-title span { font-size: 16px; }
  .participant-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 4px; }
  .participant-table th { text-align: left; padding: 6px 10px; background: #f1f5f9; color: #475569; font-weight: 600; font-size: 12px; }
  .participant-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
  .participant-table tr:last-child td { border-bottom: none; }
  .badge-nubceo { background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-client { background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .bar-container { height: 8px; background: #e2e8f0; border-radius: 4px; min-width: 60px; display: inline-block; vertical-align: middle; margin-left: 8px; }
  .bar-fill { height: 100%; border-radius: 4px; background: #38bdf8; }
  .bar-fill.nubceo { background: #3b82f6; }
  .list-items { list-style: none; padding: 0; margin: 0; }
  .list-items li { padding: 7px 0 7px 20px; position: relative; font-size: 14px; border-bottom: 1px solid #f8fafc; line-height: 1.5; }
  .list-items li:last-child { border-bottom: none; }
  .list-items li::before { content: "•"; position: absolute; left: 0; color: #38bdf8; font-weight: 700; }
  .list-items.questions li::before { content: "?"; color: #8b5cf6; }
  .list-items.pain li::before { content: "!"; color: #ef4444; }
  .next-steps-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .next-steps-table th { text-align: left; padding: 6px 10px; background: #f1f5f9; color: #475569; font-weight: 600; font-size: 12px; }
  .next-steps-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .next-steps-table tr:last-child td { border-bottom: none; }
  .resp-nubceo { color: #1d4ed8; font-weight: 600; }
  .resp-client { color: #15803d; font-weight: 600; }
  .divider { border: none; border-top: 2px solid #e2e8f0; margin: 0; }
  .footer { background: #0f172a; color: #475569; padding: 20px 32px; font-size: 12px; border-radius: 0 0 12px 12px; text-align: center; }
  .footer a { color: #38bdf8; text-decoration: none; }
  .error-card { background: #fff5f5; border-left: 4px solid #ef4444; padding: 16px 24px; margin-bottom: 4px; font-size: 14px; color: #7f1d1d; }
  .no-data { color: #94a3b8; font-style: italic; font-size: 13px; }
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <h1><span class="logo">Nubceo</span> · Resumen de Reuniones</h1>
    <p>${capitalizeFirst(dateStr)} · ${meetings.length} ${meetings.length !== 1 ? 'reuniones' : 'reunión'} con ${meetings.length !== 1 ? 'clientes' : 'cliente'}</p>
  </div>

  ${meetingSections}

  <div class="footer">
    Generado automáticamente por el sistema de notas de reuniones de Nubceo.<br>
    Fuente: <strong>Google Meet + Gemini AI</strong> · Análisis: <strong>Claude AI</strong>
  </div>

</div>
</body>
</html>`;
}

function buildMeetingSection({ email, analysis, error }, index) {
  if (error || !analysis) {
    return `
    <div class="error-card">
      <strong>Reunión ${index}:</strong> ${email.subject}<br>
      <small>No se pudo procesar esta reunión: ${error || 'error desconocido'}</small>
    </div>`;
  }

  const a = analysis;
  const duracion = a.duracion_total_min ? `${a.duracion_total_min} min` : 'N/D';
  const hora = email.date
    ? email.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
    : '';

  return `
  <hr class="divider">
  <div class="meeting-card">
    <div class="meeting-title">📋 ${a.titulo_reunion || email.subject}</div>
    <div class="meeting-meta">
      ${hora ? `Recibido: ${hora} hs` : ''} · Duración: ${duracion}
    </div>

    <!-- PARTICIPANTES -->
    <div class="section-title"><span>⏱</span> Tiempo de participación</div>
    ${buildParticipantsTable(a.participantes)}

    <!-- PREGUNTAS NUBCEO -->
    <div class="section-title"><span>❓</span> Preguntas realizadas por Nubceo al cliente</div>
    ${buildList(a.preguntas_nubceo_al_cliente, 'questions')}

    <!-- PUNTOS DE DOLOR -->
    <div class="section-title"><span>🔴</span> Puntos de dolor del cliente</div>
    ${buildList(a.puntos_de_dolor, 'pain')}

    <!-- PRÓXIMOS PASOS -->
    <div class="section-title"><span>✅</span> Próximos pasos</div>
    ${buildNextSteps(a.proximos_pasos)}

    ${a.notas_adicionales ? `
    <div class="section-title"><span>💬</span> Notas adicionales</div>
    <p style="font-size:14px; color:#475569; margin:4px 0;">${a.notas_adicionales}</p>
    ` : ''}
  </div>`;
}

function buildParticipantsTable(participantes) {
  if (!participantes || participantes.length === 0) {
    return `<p class="no-data">No se identificaron participantes.</p>`;
  }

  const rows = participantes.map((p) => {
    const badge = p.es_nubceo
      ? `<span class="badge-nubceo">Nubceo</span>`
      : `<span class="badge-client">Cliente</span>`;

    const pct = p.porcentaje_participacion || 0;
    const mins = p.tiempo_participacion_min || 0;
    const barClass = p.es_nubceo ? 'nubceo' : '';
    const bar = pct > 0
      ? `<div class="bar-container"><div class="bar-fill ${barClass}" style="width:${Math.min(pct, 100)}%"></div></div>`
      : '';

    const tiempoStr = mins > 0
      ? `${mins} min (${pct}%) ${bar}`
      : `<span class="no-data">N/D</span>`;

    return `<tr>
      <td><strong>${escapeHtml(p.nombre || 'Desconocido')}</strong></td>
      <td>${badge}</td>
      <td>${tiempoStr}</td>
    </tr>`;
  }).join('');

  return `<table class="participant-table">
    <thead><tr><th>Nombre</th><th>Empresa</th><th>Participación</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function buildList(items, className = '') {
  if (!items || items.length === 0) {
    return `<p class="no-data">No se identificaron en esta reunión.</p>`;
  }
  const lis = items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join('');
  return `<ul class="list-items ${className}">${lis}</ul>`;
}

function buildNextSteps(pasos) {
  if (!pasos || pasos.length === 0) {
    return `<p class="no-data">No se identificaron próximos pasos.</p>`;
  }

  const rows = pasos.map((p) => {
    const resp = String(p.responsable || '').toLowerCase();
    const isNubceo = resp.includes('nubceo') || resp.includes('vendedor') || resp.includes('comercial');
    const respClass = isNubceo ? 'resp-nubceo' : 'resp-client';
    const fechaStr = p.fecha_limite ? `<small style="color:#94a3b8">${escapeHtml(p.fecha_limite)}</small>` : '';

    return `<tr>
      <td>${escapeHtml(p.accion || '')}</td>
      <td><span class="${respClass}">${escapeHtml(p.responsable || 'N/D')}</span></td>
      <td>${fechaStr || '<span class="no-data">-</span>'}</td>
    </tr>`;
  }).join('');

  return `<table class="next-steps-table">
    <thead><tr><th>Acción</th><th>Responsable</th><th>Fecha límite</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Genera el asunto del email.
 */
function buildEmailSubject(date, count) {
  const dateStr = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  return `Resumen de Reuniones con Clientes · ${dateStr} · ${count} ${count !== 1 ? 'reuniones' : 'reunión'}`;
}

module.exports = { buildEmailHtml, buildEmailSubject };
