#!/usr/bin/env node

/**
 * Script para inyectar variables de entorno en el build de Angular/Nx para Vercel
 *
 * Este script lee las variables de entorno de Vercel en build-time y genera
 * un archivo environment.runtime.ts que se usará en producción.
 *
 * Variables públicas soportadas:
 * - APP_ENVIRONMENT_NAME: local | dev | qa | pdn
 * - APP_API_BASE_URL: URL base del backend API
 * - APP_PUBLIC_ASSET_BASE_URL: URL pública base para assets/CDN
 * - APP_ENABLE_SERVICE_WORKER: true | false
 * - APP_ENABLE_SSR: true | false
 * - APP_LOG_LEVEL: debug | info | warn | error
 * - APP_ENABLE_CONSOLE_LOGGING: true | false
 * - APP_PUBLIC_VAPID_KEY: Clave pública VAPID
 * - APP_CATEGORY_IMAGE_MAX_MB: Límite público de carga de imágenes
 * - APP_FEATURE_*: Feature flags públicas, por ejemplo APP_FEATURE_ANALYTICS=true
 *
 * Compatibilidad temporal:
 * - También se leen variables legacy NG_APP_* equivalentes para no romper el pipeline actual.
 *
 * Variables prohibidas en frontend:
 * - Cualquier secreto de backend, connection strings, client secrets, private keys o credenciales.
 *
 * Uso:
 *   node scripts/inject-env-vars.js
 */

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_API_BASE_URL =
  'https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net';
const DEFAULT_PUBLIC_ASSET_BASE_URL =
  'https://pub-49f57cb38af14e108e2f36fb4f0dc058.r2.dev';
const DEFAULT_PUBLIC_VAPID_KEY = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';

// Colores para output en terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

console.log(
  `${colors.bright}${colors.blue}🔧 Inyectando variables de entorno para Vercel...${colors.reset}\n`
);

// Detectar si estamos en Vercel
const IS_VERCEL = process.env.VERCEL === '1';
const VERCEL_ENV = process.env.VERCEL_ENV || 'unknown'; // production, preview, development

function getPublicEnv(name, legacyName, defaultValue) {
  if (process.env[name] !== undefined) {
    return process.env[name];
  }

  if (legacyName && process.env[legacyName] !== undefined) {
    return process.env[legacyName];
  }

  return defaultValue;
}

function toBoolean(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
}

function toNumber(value, defaultValue) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function defaultEnvironmentName() {
  if (VERCEL_ENV === 'production') {
    return 'pdn';
  }

  if (VERCEL_ENV === 'preview') {
    return 'qa';
  }

  return 'local';
}

function collectFeatureFlags() {
  const flags = {
    advancedSearch: true,
    darkMode: true,
    notifications: true,
    analytics: toBoolean(
      getPublicEnv('APP_FEATURE_ANALYTICS', 'NG_APP_ENABLE_ANALYTICS', 'false'),
      false
    ),
  };

  for (const [key, value] of Object.entries(process.env)) {
    let featureName;

    if (key.startsWith('APP_FEATURE_')) {
      featureName = key.slice('APP_FEATURE_'.length);
    } else if (key.startsWith('NG_APP_FEATURE_')) {
      featureName = key.slice('NG_APP_FEATURE_'.length);
    }

    if (!featureName) {
      continue;
    }

    flags[featureName.toLowerCase()] = value === 'true';
  }

  return flags;
}

const ENVIRONMENT_NAME = getPublicEnv(
  'APP_ENVIRONMENT_NAME',
  'NG_APP_ENVIRONMENT_NAME',
  defaultEnvironmentName()
);
const API_BASE_URL = getPublicEnv(
  'APP_API_BASE_URL',
  'NG_APP_API_BASE_URL',
  DEFAULT_API_BASE_URL
);
const PUBLIC_ASSET_BASE_URL = getPublicEnv(
  'APP_PUBLIC_ASSET_BASE_URL',
  'NG_APP_CATEGORY_PUBLIC_BASE_URL',
  DEFAULT_PUBLIC_ASSET_BASE_URL
);
const ENABLE_SERVICE_WORKER = toBoolean(
  getPublicEnv(
    'APP_ENABLE_SERVICE_WORKER',
    'NG_APP_ENABLE_SERVICE_WORKER',
    'true'
  ),
  true
);
const ENABLE_SSR = toBoolean(
  getPublicEnv('APP_ENABLE_SSR', 'NG_APP_ENABLE_SSR', 'false'),
  false
);
const LOG_LEVEL = getPublicEnv('APP_LOG_LEVEL', 'NG_APP_LOG_LEVEL', 'warn');
const ENABLE_CONSOLE = toBoolean(
  getPublicEnv('APP_ENABLE_CONSOLE_LOGGING', 'NG_APP_ENABLE_CONSOLE', 'false'),
  false
);
const PUBLIC_VAPID_KEY = getPublicEnv(
  'APP_PUBLIC_VAPID_KEY',
  'NG_APP_VAPID_PUBLIC_KEY',
  DEFAULT_PUBLIC_VAPID_KEY
);
const CATEGORY_IMAGE_MAX_MB = toNumber(
  getPublicEnv(
    'APP_CATEGORY_IMAGE_MAX_MB',
    'NG_APP_CATEGORY_IMAGE_MAX_MB',
    '1'
  ),
  1
);
const FEATURE_FLAGS = collectFeatureFlags();

console.log(
  `${colors.green}✓${colors.reset} Entorno detectado: ${
    IS_VERCEL ? 'Vercel' : 'Local'
  } (${VERCEL_ENV})`
);
console.log(
  `${colors.green}✓${colors.reset} Environment Name: ${colors.bright}${ENVIRONMENT_NAME}${colors.reset}`
);
console.log(
  `${colors.green}✓${colors.reset} API Base URL: ${colors.bright}${API_BASE_URL}${colors.reset}`
);
console.log(
  `${colors.green}✓${colors.reset} Service Worker: ${
    ENABLE_SERVICE_WORKER ? 'Habilitado' : 'Deshabilitado'
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
  environmentName: '${ENVIRONMENT_NAME}',
  production: true,
  apiBaseUrl: '${API_BASE_URL}',
  publicAssetBaseUrl: '${PUBLIC_ASSET_BASE_URL}',
  enableServiceWorker: ${ENABLE_SERVICE_WORKER},
  enableSSR: ${ENABLE_SSR},
  logLevel: '${LOG_LEVEL}',
  featureFlags: ${JSON.stringify(FEATURE_FLAGS, null, 2)},
  enableConsoleLogging: ${ENABLE_CONSOLE},
  publicVapidKey: '${PUBLIC_VAPID_KEY}',
  categoryImageMaxSizeMb: ${CATEGORY_IMAGE_MAX_MB},
  useTenantHeader: true,
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
  console.log(
    `\n${colors.green}${colors.bright}✓ Archivo generado exitosamente:${colors.reset}`
  );
} catch (error) {
  console.error(
    `\n${colors.red}${colors.bright}✗ Error al generar archivo:${colors.reset}`,
    error
  );
  process.exit(1);
}

// Mostrar advertencias si se usan valores por defecto
if (!process.env.APP_ENVIRONMENT_NAME && !process.env.NG_APP_ENVIRONMENT_NAME) {
  console.warn(
    `${colors.yellow}⚠️  APP_ENVIRONMENT_NAME no definida, usando ${ENVIRONMENT_NAME}${colors.reset}`
  );
}

if (!process.env.APP_API_BASE_URL && !process.env.NG_APP_API_BASE_URL) {
  console.warn(
    `${colors.yellow}⚠️  APP_API_BASE_URL no definida, usando valor por defecto${colors.reset}`
  );
}

if (PUBLIC_VAPID_KEY === DEFAULT_PUBLIC_VAPID_KEY) {
  console.warn(
    `${colors.yellow}⚠️  APP_PUBLIC_VAPID_KEY no definida, usando placeholder${colors.reset}`
  );
}

console.log(
  `\n${colors.green}${colors.bright}✓ Variables de entorno inyectadas correctamente${colors.reset}\n`
);
