'use strict';

/**
 * Demo: genera el HTML del email de resumen con datos de ejemplo.
 * Útil para ver cómo queda el diseño sin necesitar las credenciales.
 *
 * Ejecutar: node demo.js
 * Abre el archivo demo-output.html en el navegador para ver el resultado.
 */

const fs = require('fs');
const { buildEmailHtml, buildEmailSubject } = require('./src/template');

const today = new Date('2025-04-01T18:00:00-03:00');

// Datos de ejemplo simulando lo que devolvería Claude
const mockMeetings = [
  {
    email: {
      subject: 'Notas de la reunión: Demo SRL - Presentación Nubceo',
      date: new Date('2025-04-01T10:30:00-03:00'),
    },
    error: null,
    analysis: {
      titulo_reunion: 'Demo SRL · Presentación de la plataforma Nubceo',
      fecha: '1 de abril de 2025, 10:30 hs',
      duracion_total_min: 42,
      participantes: [
        {
          nombre: 'Lucía Fernández',
          empresa: 'Nubceo',
          email: 'lucia@nubceo.com',
          es_nubceo: true,
          tiempo_participacion_min: 18,
          porcentaje_participacion: 43,
        },
        {
          nombre: 'Carlos Méndez',
          empresa: 'Demo SRL',
          email: 'carlos@demo.com',
          es_nubceo: false,
          tiempo_participacion_min: 21,
          porcentaje_participacion: 50,
        },
        {
          nombre: 'Ana Torres',
          empresa: 'Demo SRL',
          email: null,
          es_nubceo: false,
          tiempo_participacion_min: 3,
          porcentaje_participacion: 7,
        },
      ],
      preguntas_nubceo_al_cliente: [
        '¿Cuántas sucursales o puntos de venta manejan actualmente?',
        '¿Cómo están realizando hoy la conciliación de cobros con tarjetas?',
        '¿Tienen integración con algún sistema de facturación o ERP?',
        '¿Cuánto tiempo dedica el equipo contable a la conciliación manual por mes?',
        '¿Han tenido problemas de diferencias con las liquidadoras de tarjetas?',
      ],
      puntos_de_dolor: [
        'La conciliación manual les lleva entre 3 y 4 días al mes y genera errores frecuentes',
        'No tienen visibilidad en tiempo real de los cobros: se enteran de las liquidaciones con días de retraso',
        'Las diferencias con las tarjetas les generaron pérdidas no detectadas a tiempo en el último trimestre',
        'El sistema actual no soporta múltiples monedas (tienen operaciones en USD)',
      ],
      proximos_pasos: [
        {
          accion: 'Enviar propuesta comercial con el plan que incluye hasta 5 sucursales',
          responsable: 'Nubceo - Lucía Fernández',
          fecha_limite: 'viernes 4 de abril',
        },
        {
          accion: 'Compartir acceso de prueba al módulo de conciliación',
          responsable: 'Nubceo',
          fecha_limite: 'esta semana',
        },
        {
          accion: 'Consultar con el equipo de IT si tienen API disponible para integrar con ERP',
          responsable: 'Carlos Méndez (Demo SRL)',
          fecha_limite: null,
        },
        {
          accion: 'Agendar reunión de seguimiento con gerente financiero incluido',
          responsable: 'Carlos Méndez (Demo SRL)',
          fecha_limite: 'semana del 7 de abril',
        },
      ],
      notas_adicionales:
        'El cliente mostró alto interés en el módulo de alertas automáticas. Mencionó que evaluán también a un competidor (no especificó cuál).',
    },
  },
  {
    email: {
      subject: 'Notas de la reunión: Retail XYZ - Seguimiento propuesta',
      date: new Date('2025-04-01T15:00:00-03:00'),
    },
    error: null,
    analysis: {
      titulo_reunion: 'Retail XYZ · Seguimiento de propuesta comercial',
      fecha: '1 de abril de 2025, 15:00 hs',
      duracion_total_min: 28,
      participantes: [
        {
          nombre: 'Martín Sosa',
          empresa: 'Nubceo',
          email: 'martin@nubceo.com',
          es_nubceo: true,
          tiempo_participacion_min: 14,
          porcentaje_participacion: 50,
        },
        {
          nombre: 'Roberto Paz',
          empresa: 'Retail XYZ',
          email: 'roberto@retailxyz.com',
          es_nubceo: false,
          tiempo_participacion_min: 14,
          porcentaje_participacion: 50,
        },
      ],
      preguntas_nubceo_al_cliente: [
        '¿Pudieron revisar la propuesta que enviamos la semana pasada?',
        '¿Hay algún punto del pricing que necesiten ajustar?',
        '¿Cuándo estarían en condiciones de avanzar con la firma del contrato?',
      ],
      puntos_de_dolor: [
        'El cliente necesita aprobación de casa matriz (Brasil) antes de firmar, lo que retrasa el proceso',
        'Tienen dudas sobre el soporte post-implementación, quieren SLA por escrito',
      ],
      proximos_pasos: [
        {
          accion: 'Agregar cláusula de SLA al contrato (tiempo de respuesta máximo 4 hs)',
          responsable: 'Nubceo',
          fecha_limite: 'lunes 7 de abril',
        },
        {
          accion: 'Elevar aprobación a casa matriz con resumen ejecutivo de la propuesta',
          responsable: 'Roberto Paz (Retail XYZ)',
          fecha_limite: null,
        },
      ],
      notas_adicionales: null,
    },
  },
];

const subject = buildEmailSubject(today, mockMeetings.length);
const html = buildEmailHtml(today, mockMeetings);

fs.writeFileSync('demo-output.html', html, 'utf8');

console.log('✓ Demo generado: demo-output.html');
console.log(`  Asunto del mail: "${subject}"`);
console.log('  Abrí demo-output.html en tu navegador para ver el diseño.');
