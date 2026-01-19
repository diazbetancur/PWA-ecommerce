#!/usr/bin/env node

/**
 * Script para separar componentes inline en archivos HTML y SCSS independientes
 */

const fs = require('fs');
const path = require('path');

// Componentes a procesar (excluir los que ya están separados)
const componentsToProcess = [
  './features-admin/src/lib/pages/loyalty/points-adjustment/points-adjustment.component.ts',
  './features-admin/src/lib/pages/loyalty/redemptions-list/redemptions-list.component.ts',
  './features-admin/src/lib/pages/loyalty/rewards-list/rewards-list.component.ts',
  './features/src/lib/loyalty/components/loyalty-balance/loyalty-balance.component.ts',
  './features/src/lib/loyalty/components/loyalty-nav/loyalty-nav.component.ts',
  './features/src/lib/loyalty/components/redemption-status/redemption-status.component.ts',
  './features/src/lib/loyalty/components/reward-card/reward-card.component.ts',
  './features/src/lib/loyalty/components/tier-badge/tier-badge.component.ts',
  './features/src/lib/loyalty/components/transaction-item/transaction-item.component.ts',
  './features/src/lib/loyalty/pages/loyalty-account/loyalty-account.component.ts',
  './features/src/lib/loyalty/pages/my-redemptions/my-redemptions.component.ts',
  './features/src/lib/loyalty/pages/rewards-catalog/rewards-catalog.component.ts',
  './features/src/lib/loyalty/pages/transactions-history/transactions-history.component.ts',
];

function extractTemplate(content) {
  const templateMatch = content.match(/template:\s*`([\s\S]*?)`\s*,/);
  return templateMatch ? templateMatch[1] : null;
}

function extractStyles(content) {
  const stylesMatch = content.match(/styles:\s*\[\s*`([\s\S]*?)`\s*\]\s*,/);
  return stylesMatch ? stylesMatch[1] : null;
}

function replaceInlineWithUrls(content) {
  // Reemplazar template inline
  content = content.replace(
    /template:\s*`[\s\S]*?`\s*,/,
    "templateUrl: './{{COMPONENT_NAME}}.html',"
  );

  // Reemplazar styles inline
  content = content.replace(
    /styles:\s*\[\s*`[\s\S]*?`\s*\]\s*,/,
    "styleUrl: './{{COMPONENT_NAME}}.scss',"
  );

  return content;
}

function processComponent(componentPath) {
  const fullPath = path.join(__dirname, '..', componentPath);
  const componentDir = path.dirname(fullPath);
  const componentName = path
    .basename(componentPath, '.component.ts')
    .replace('.component', '');
  const baseName = path.basename(fullPath, '.ts');

  console.log(`\nProcesando: ${componentPath}`);

  // Leer el archivo
  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    console.error(`  ❌ Error leyendo archivo: ${error.message}`);
    return false;
  }

  // Extraer template y styles
  const template = extractTemplate(content);
  const styles = extractStyles(content);

  if (!template && !styles) {
    console.log(`  ⚠️  No tiene template o styles inline, saltando...`);
    return true; // Ya está separado
  }

  // Crear archivo HTML si existe template
  if (template) {
    const htmlPath = path.join(componentDir, `${baseName}.html`);
    try {
      fs.writeFileSync(htmlPath, template.trim() + '\n', 'utf8');
      console.log(`  ✅ HTML creado: ${baseName}.html`);
    } catch (error) {
      console.error(`  ❌ Error creando HTML: ${error.message}`);
      return false;
    }
  }

  // Crear archivo SCSS si existe styles
  if (styles) {
    const scssPath = path.join(componentDir, `${baseName}.scss`);
    try {
      fs.writeFileSync(scssPath, styles.trim() + '\n', 'utf8');
      console.log(`  ✅ SCSS creado: ${baseName}.scss`);
    } catch (error) {
      console.error(`  ❌ Error creando SCSS: ${error.message}`);
      return false;
    }
  }

  // Actualizar el archivo .ts
  let newContent = replaceInlineWithUrls(content);
  newContent = newContent.replace(/\{\{COMPONENT_NAME\}\}/g, componentName);

  try {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`  ✅ TS actualizado`);
  } catch (error) {
    console.error(`  ❌ Error actualizando TS: ${error.message}`);
    return false;
  }

  return true;
}

// Procesar todos los componentes
console.log('🚀 Iniciando separación de componentes de lealtad...\n');
console.log(
  `📦 Total de componentes a procesar: ${componentsToProcess.length}\n`
);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

componentsToProcess.forEach((componentPath) => {
  const result = processComponent(componentPath);
  if (result === true) {
    successCount++;
  } else if (result === null) {
    skipCount++;
  } else {
    errorCount++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN');
console.log('='.repeat(60));
console.log(`✅ Procesados exitosamente: ${successCount}`);
console.log(`⚠️  Saltados (ya separados): ${skipCount}`);
console.log(`❌ Errores: ${errorCount}`);
console.log('='.repeat(60) + '\n');

process.exit(errorCount > 0 ? 1 : 0);
