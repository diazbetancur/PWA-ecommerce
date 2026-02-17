#!/usr/bin/env node

/**
 * Script para inyectar variables de entorno en el build de Angular/Nx para Vercel
 *
 * Este script lee las variables de entorno de Vercel en build-time y genera
 * un archivo environment.runtime.ts que se usará en producción.
 *
 * Variables de entorno soportadas:
 * - NG_APP_API_BASE_URL: URL base del backend API
 * - NG_APP_VAPID_PUBLIC_KEY: Clave pública de VAPID para FCM
 * - NG_APP_GA_TRACKING_ID: ID de Google Analytics
 * - NG_APP_ENABLE_ANALYTICS: Habilitar analytics (true/false)
 * - NG_APP_LOG_LEVEL: Nivel de logs (debug/info/warn/error)
 *
 * Uso:
 *   node scripts/inject-env-vars.js
 */

const fs = require('node:fs');
const path = require('node:path');

// Colores para output en terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

void (
  `${colors.bright}${colors.blue}🔧 Inyectando variables de entorno para Vercel...${colors.reset}\n`
);

// Leer variables de entorno
const API_BASE_URL =
  process.env.NG_APP_API_BASE_URL ||
  'https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net';
const VAPID_PUBLIC_KEY =
  process.env.NG_APP_VAPID_PUBLIC_KEY || 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';
const GA_TRACKING_ID = process.env.NG_APP_GA_TRACKING_ID || undefined;
const ENABLE_ANALYTICS = process.env.NG_APP_ENABLE_ANALYTICS === 'true';
const LOG_LEVEL = process.env.NG_APP_LOG_LEVEL || 'warn';
const ENABLE_CONSOLE = process.env.NG_APP_ENABLE_CONSOLE === 'true';

// Detectar si estamos en Vercel
const IS_VERCEL = process.env.VERCEL === '1';
const VERCEL_ENV = process.env.VERCEL_ENV || 'unknown'; // production, preview, development

void (
  `${colors.green}✓${colors.reset} Entorno detectado: ${
    IS_VERCEL ? 'Vercel' : 'Local'
  } (${VERCEL_ENV})`
);
void (
  `${colors.green}✓${colors.reset} API Base URL: ${colors.bright}${API_BASE_URL}${colors.reset}`
);
void (
  `${colors.green}✓${colors.reset} Analytics: ${
    ENABLE_ANALYTICS ? 'Habilitado' : 'Deshabilitado'
  }`
);

// Generar contenido del archivo environment.runtime.ts
const envContent = `import { AppEnvironment } from '@pwa/core';

/**
 * ⚠️  ARCHIVO GENERADO AUTOMÁTICAMENTE
 *
 * Este archivo es generado por scripts/inject-env-vars.js durante el build.
 * NO EDITAR MANUALMENTE - Los cambios se perderán en el próximo build.
 *
 * Para cambiar la configuración, edita las variables de entorno en Vercel
 * o en tu archivo .env local.
 *
 * Generado: ${new Date().toISOString()}
 * Entorno: ${IS_VERCEL ? 'Vercel' : 'Local'} (${VERCEL_ENV})
 */
export const environment: AppEnvironment = {
  production: true,
  mockApi: false,
  apiBaseUrl: '${API_BASE_URL}',
  useTenantHeader: true,
  fcm: {
    vapidPublicKey: '${VAPID_PUBLIC_KEY}'
  },
  analytics: {
    enabled: ${ENABLE_ANALYTICS},
    trackingId: ${GA_TRACKING_ID ? `'${GA_TRACKING_ID}'` : 'undefined'}
  },
  logging: {
    level: '${LOG_LEVEL}',
    enableConsole: ${ENABLE_CONSOLE}
  },
  features: {
    advancedSearch: true,
    darkMode: true,
    notifications: true,
    analytics: ${ENABLE_ANALYTICS}
  }
};
`;

// Ruta del archivo de salida
const outputPath = path.join(
  __dirname,
  '..',
  'apps',
  'pwa',
  'src',
  'environments',
  'environment.runtime.ts'
);

// Crear directorio si no existe
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Escribir archivo
try {
  fs.writeFileSync(outputPath, envContent, 'utf8');
  void (
    `\n${colors.green}${colors.bright}✓ Archivo generado exitosamente:${colors.reset}`
  );
} catch (error) {
  void (
    `\n${colors.red}${colors.bright}✗ Error al generar archivo:${colors.reset}`
  );
  process.exit(1);
}

// Mostrar advertencias si se usan valores por defecto
if (!process.env.NG_APP_API_BASE_URL) {
  void (
    `${colors.yellow}⚠️  NG_APP_API_BASE_URL no definida, usando valor por defecto${colors.reset}`
  );
}

if (VAPID_PUBLIC_KEY === 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY') {
  void (
    `${colors.yellow}⚠️  NG_APP_VAPID_PUBLIC_KEY no definida, usando placeholder${colors.reset}`
  );
}

void (
  `\n${colors.green}${colors.bright}✓ Variables de entorno inyectadas correctamente${colors.reset}\n`
);
