#!/usr/bin/env node

/**
 * Script para verificar el uso directo de HttpClient en el proyecto
 * y asegurar que se use ApiClientService en su lugar
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Archivos permitidos que pueden usar HttpClient directo
const ALLOWED_HTTPCLIENT_FILES = [
  'core/src/lib/services/api-client.service.ts',
  'core/src/lib/services/tenant-bootstrap.service.ts',
  'core/src/lib/services/tenant-config.service.ts', // Necesita HttpClient para JSON locales en mock mode
  'core/src/lib/i18n/transloco.loader.ts',
  // Archivos de configuración
  'apps/pwa/src/app/app.config.ts',
  'apps/pwa/src/app/app.config.enhanced.ts',
  'apps/pwa/src/app/app.config.with-tenant.ts',
  'apps/pwa/src/app/app.config.updated.ts',
];

// Patrones a buscar
const HTTPCLIENT_PATTERNS = [
  /import.*HttpClient.*from.*@angular\/common\/http/,
  /private.*http.*=.*inject\(HttpClient\)/,
  /private.*http.*:.*HttpClient/,
  /constructor\(.*HttpClient.*\)/,
  /this\.http\.(get|post|put|patch|delete)/,
];

const APICLIENT_PATTERNS = [
  /import.*ApiClientService.*from/,
  /private.*api.*=.*inject\(ApiClientService\)/,
  /private.*api.*:.*ApiClientService/,
  /this\.api\.(get|post|put|patch|delete)/,
];

function scanDirectory(dir) {
  const results = {
    violations: [],
    compliantFiles: [],
    stats: {
      totalFiles: 0,
      violationFiles: 0,
      compliantFiles: 0,
      httpclientUsages: 0,
      apiclientUsages: 0,
    },
  };

  function scanFile(filePath) {
    if (
      !filePath.endsWith('.ts') ||
      filePath.includes('.spec.ts') ||
      filePath.includes('.test.ts')
    ) {
      return;
    }

    results.stats.totalFiles++;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      // Verificar si es un archivo permitido
      const isAllowedFile = ALLOWED_HTTPCLIENT_FILES.some((allowed) =>
        relativePath.includes(allowed.replace(/\//g, path.sep))
      );

      const httpclientMatches = [];
      const apiclientMatches = [];

      // Buscar patrones línea por línea
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        HTTPCLIENT_PATTERNS.forEach((pattern) => {
          if (pattern.test(line)) {
            httpclientMatches.push({
              line: index + 1,
              content: line.trim(),
              pattern: pattern.source,
            });
            results.stats.httpclientUsages++;
          }
        });

        APICLIENT_PATTERNS.forEach((pattern) => {
          if (pattern.test(line)) {
            apiclientMatches.push({
              line: index + 1,
              content: line.trim(),
            });
            results.stats.apiclientUsages++;
          }
        });
      });

      if (httpclientMatches.length > 0 && !isAllowedFile) {
        results.violations.push({
          file: relativePath,
          httpclientMatches,
          apiclientMatches,
          isFeature: relativePath.startsWith('features'),
        });
        results.stats.violationFiles++;
      } else if (apiclientMatches.length > 0) {
        results.compliantFiles.push({
          file: relativePath,
          apiclientMatches,
        });
        results.stats.compliantFiles++;
      }
    } catch (error) {
      void (
        `${colors.red}Error leyendo archivo ${filePath}: ${error.message}${colors.reset}`
      );
    }
  }

  function walkDirectory(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          // Omitir node_modules y dist
          if (
            !entry.name.startsWith('.') &&
            entry.name !== 'node_modules' &&
            entry.name !== 'dist'
          ) {
            walkDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          scanFile(fullPath);
        }
      }
    } catch (error) {
      void (
        `${colors.red}Error escaneando directorio ${currentDir}: ${error.message}${colors.reset}`
      );
    }
  }

  walkDirectory(dir);
  return results;
}

function generateReport(results) {
  void (
    `${colors.bold}${colors.cyan}=== REPORTE DE USO DE HTTPCLIENT VS APICLIENTSERVICE ===${colors.reset}\n`
  );

  // Violaciones críticas (archivos de features)
  const featureViolations = results.violations.filter((v) => v.isFeature);
  if (featureViolations.length > 0) {
    void (
      `${colors.bold}${colors.red}🚨 VIOLACIONES CRÍTICAS (Features usando HttpClient directo):${colors.reset}`
    );
    featureViolations.forEach((violation) => {
      violation.httpclientMatches.forEach((match) => {
        void (
          `   Línea ${match.line}: ${colors.yellow}${match.content}${colors.reset}`
        );
      });
    });
  }

  // Otras violaciones
  const otherViolations = results.violations.filter((v) => !v.isFeature);
  if (otherViolations.length > 0) {
    void (
      `${colors.bold}${colors.yellow}⚠️  OTRAS VIOLACIONES (Revisar si son necesarias):${colors.reset}`
    );
    otherViolations.forEach((violation) => {
      violation.httpclientMatches.forEach((match) => {
        void (
          `   Línea ${match.line}: ${colors.cyan}${match.content}${colors.reset}`
        );
      });
    });
  }

  // Archivos que usan ApiClientService correctamente
  if (results.compliantFiles.length > 0) {
    void (
      `${colors.bold}${colors.green}✅ ARCHIVOS CONFORMES (Usando ApiClientService):${colors.reset}`
    );
    results.compliantFiles.forEach((compliant) => {
    });
  }

  // Recomendaciones

  if (featureViolations.length > 0) {
    void (
      `${colors.red}1. URGENTE: Reemplazar HttpClient directo en features con ApiClientService${colors.reset}`
    );
    void (
      `   ${colors.yellow}private readonly http = inject(HttpClient);${colors.reset}`
    );
    void (
      `   ${colors.green}private readonly api = inject(ApiClientService);${colors.reset}\n`
    );
  }

  if (results.stats.httpclientUsages > results.stats.apiclientUsages) {
    void (
      `${colors.yellow}2. Migrar más servicios a usar ApiClientService para beneficiarse del interceptor multi-tenant${colors.reset}`
    );
  }

  void (
    `${colors.green}3. Todos los nuevos servicios deben usar ApiClientService${colors.reset}`
  );
  void (
    `${colors.blue}4. Revisar que el TenantHeaderInterceptor esté configurado correctamente${colors.reset}\n`
  );

  // Resultado final
  const hasViolations = results.violations.length > 0;
  if (hasViolations) {
    void (
      `${colors.bold}${colors.red}❌ VERIFICACIÓN FALLÓ: Se encontraron ${results.violations.length} violaciones${colors.reset}`
    );
    process.exit(1);
  } else {
    void (
      `${colors.bold}${colors.green}✅ VERIFICACIÓN EXITOSA: Todos los archivos usan ApiClientService correctamente${colors.reset}`
    );
  }
}

// Ejecutar verificación
const projectRoot = process.cwd();
void (
  `${colors.cyan}Escaneando proyecto en: ${projectRoot}${colors.reset}\n`
);

const results = scanDirectory(projectRoot);
generateReport(results);
