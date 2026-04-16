'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic.default();

const NUBCEO_DOMAIN = process.env.NUBCEO_DOMAIN || 'nubceo.com';

/**
 * Analiza las notas de una reunión con Claude y extrae:
 * - Tiempo de participación por persona
 * - Preguntas que hizo la persona de Nubceo al cliente
 * - Puntos de dolor del cliente
 * - Próximos pasos
 *
 * @param {Object} email - Email parseado con subject, body, date
 * @returns {Promise<Object>} Análisis estructurado de la reunión
 */
async function analyzeMeetingNotes(email) {
  console.log(`[Analyzer] Analizando: "${email.subject}"`);

  const prompt = `Sos un asistente que analiza notas y transcripciones de reuniones de ventas B2B.
La empresa vendedora es Nubceo (dominio: ${NUBCEO_DOMAIN}).

Analizá el siguiente contenido de las notas/transcripción de una reunión de Google Meet y extraé exactamente los siguientes puntos.

---
CONTENIDO DE LAS NOTAS:
${email.body}
---

Devolvé ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin texto adicional antes o después):

{
  "titulo_reunion": "string con el nombre/tema de la reunión",
  "fecha": "string con fecha y hora de la reunión",
  "participantes": [
    {
      "nombre": "Nombre completo",
      "empresa": "Nubceo o nombre del cliente",
      "email": "email si está disponible, null si no",
      "es_nubceo": true/false,
      "tiempo_participacion_min": número de minutos aproximados que habló (0 si no se puede determinar),
      "porcentaje_participacion": número del 0 al 100 (0 si no se puede determinar)
    }
  ],
  "preguntas_nubceo_al_cliente": [
    "Pregunta 1 textual o parafraseada",
    "Pregunta 2..."
  ],
  "puntos_de_dolor": [
    "Punto de dolor 1 del cliente",
    "Punto de dolor 2..."
  ],
  "proximos_pasos": [
    {
      "accion": "descripción de la acción",
      "responsable": "quién debe hacerlo (Nubceo / Cliente / nombre)",
      "fecha_limite": "fecha límite si se mencionó, null si no"
    }
  ],
  "duracion_total_min": número total de minutos de la reunión (null si no se puede determinar),
  "notas_adicionales": "cualquier observación relevante no capturada arriba, o null"
}

Reglas importantes:
- "es_nubceo": true para cualquier persona con email @${NUBCEO_DOMAIN} o que claramente trabaje en Nubceo
- Para los tiempos de participación: si hay transcripción con timestamps, calculalos. Si no, estimá en base al texto
- Para las preguntas: incluí solo las que hizo la persona de Nubceo hacia el cliente (no al revés)
- Para los puntos de dolor: son los problemas, frustraciones o necesidades que el CLIENTE expresó
- Para próximos pasos: incluí todo lo que quedó acordado hacer después de la reunión
- Si algún dato no está disponible, usá null o array vacío según corresponda`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const rawText = response.content[0].text.trim();

  // Extraer el JSON de la respuesta (por si Claude agregó algo alrededor)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Claude no devolvió un JSON válido');
  }

  let analysis;
  try {
    analysis = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Error parseando JSON de Claude: ${e.message}`);
  }

  console.log(`[Analyzer] OK - "${analysis.titulo_reunion}" - ${analysis.participantes?.length || 0} participantes`);
  return analysis;
}

/**
 * Procesa todos los emails del día y devuelve los análisis.
 */
async function analyzeAllEmails(emails) {
  const results = [];

  for (const email of emails) {
    try {
      const analysis = await analyzeMeetingNotes(email);
      results.push({ email, analysis, error: null });
    } catch (err) {
      console.error(`[Analyzer] Error con "${email.subject}":`, err.message);
      results.push({ email, analysis: null, error: err.message });
    }
  }

  return results;
}

module.exports = { analyzeMeetingNotes, analyzeAllEmails };
