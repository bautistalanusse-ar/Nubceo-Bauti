'use strict';

require('dotenv').config();

const cron = require('node-cron');
const { fetchTodayMeetingNotes } = require('./src/gmail');
const { analyzeAllEmails } = require('./src/analyzer');
const { sendDailySummary } = require('./src/emailSender');

const NUBCEO_EMAIL = process.env.NUBCEO_EMAIL || 'agenda.virtual@nubceo.com';

/**
 * Proceso principal: busca las notas del día, las analiza y manda el resumen.
 */
async function runDailyProcess() {
  const now = new Date();
  console.log('\n========================================');
  console.log(`[Nubceo Meeting Notes] Iniciando proceso`);
  console.log(`[Nubceo Meeting Notes] Fecha/hora: ${now.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
  console.log('========================================\n');

  try {
    // 1. Buscar notas de reuniones del día en Gmail
    const emails = await fetchTodayMeetingNotes();

    if (emails.length === 0) {
      console.log('[Nubceo Meeting Notes] No hay reuniones con clientes hoy. No se enviará mail.');
      return;
    }

    console.log(`\n[Nubceo Meeting Notes] Procesando ${emails.length} reunión(es)...\n`);

    // 2. Analizar cada email con Claude
    const meetings = await analyzeAllEmails(emails);

    // 3. Enviar el resumen por email a las 6pm
    await sendDailySummary(now, meetings);

    const exitosas = meetings.filter((m) => !m.error).length;
    const fallidas = meetings.filter((m) => m.error).length;

    console.log('\n========================================');
    console.log(`[Nubceo Meeting Notes] Proceso completado`);
    console.log(`  Reuniones procesadas: ${exitosas}`);
    if (fallidas > 0) console.log(`  Reuniones con error: ${fallidas}`);
    console.log(`  Resumen enviado a: ${NUBCEO_EMAIL}`);
    console.log('========================================\n');
  } catch (err) {
    console.error('[Nubceo Meeting Notes] Error fatal:', err);
    process.exit(1);
  }
}

// --run-now: ejecutar inmediatamente (útil para probar sin esperar las 6pm)
const runNow = process.argv.includes('--run-now');

if (runNow) {
  console.log('[Nubceo Meeting Notes] Modo: ejecución inmediata (--run-now)');
  runDailyProcess();
} else {
  // Cron: 18:00 (6pm) todos los días, zona horaria Argentina
  // '0 18 * * *' = a las 18:00:00 todos los días
  console.log('[Nubceo Meeting Notes] Iniciado. Esperando cron de las 18:00 (AR)...');
  console.log('[Nubceo Meeting Notes] Para probar ahora: npm run test-today\n');

  cron.schedule(
    '0 18 * * *',
    () => {
      runDailyProcess();
    },
    {
      timezone: 'America/Argentina/Buenos_Aires',
    }
  );
}
