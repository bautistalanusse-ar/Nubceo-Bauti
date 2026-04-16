'use strict';

/**
 * Script de configuración de OAuth2 para Gmail.
 *
 * Ejecutar: node setup-oauth.js
 *
 * Prerequisitos:
 * 1. Ir a https://console.cloud.google.com/
 * 2. Crear un proyecto o usar uno existente
 * 3. Habilitar la Gmail API
 * 4. Crear credenciales OAuth2 (tipo "Aplicación de escritorio")
 * 5. Descargar el JSON y copiar client_id y client_secret al .env
 * 6. Ejecutar este script para obtener los tokens de acceso
 */

require('dotenv').config();

const { google } = require('googleapis');
const readline = require('readline');

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Error: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben estar en el .env');
    console.error('Seguí los pasos en el comentario de este archivo para obtenerlos.');
    process.exit(1);
  }

  const auth = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob'
  );

  // Scopes necesarios:
  // - gmail.readonly: leer emails con las notas de reunión
  // - gmail.send: enviar el resumen diario
  const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ];

  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n===========================================');
  console.log('CONFIGURACIÓN DE GMAIL OAUTH2');
  console.log('===========================================\n');
  console.log('1. Abrí este link en tu navegador:\n');
  console.log(authUrl);
  console.log('\n2. Iniciá sesión con la cuenta que recibe las notas de Gemini');
  console.log('   (la que tiene agenda.virtual@nubceo.com en los participantes)\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('3. Pegá acá el código que aparece en la pantalla: ', async (code) => {
    rl.close();

    try {
      const { tokens } = await auth.getToken(code.trim());

      console.log('\n===========================================');
      console.log('TOKENS OBTENIDOS - Agregá esto al .env:');
      console.log('===========================================\n');
      console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('\nListo! Ya podés ejecutar: npm start');
    } catch (err) {
      console.error('Error al obtener tokens:', err.message);
    }
  });
}

main();
