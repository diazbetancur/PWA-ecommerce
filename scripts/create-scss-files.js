#!/usr/bin/env node

/**
 * Script para crear archivos SCSS desde styles inline
 */

const fs = require('fs');
const path = require('path');

// Componentes a procesar
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

function extractAndCreateScss(componentPath) {
  const fullPath = path.join(__dirname, '..', componentPath);
  const componentDir = path.dirname(fullPath);
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

  // Buscar styles con diferentes patrones
  let stylesContent = null;

  // Patrón 1: styles: [`...`],
  const pattern1 = /styles:\s*\[\s*`([\s\S]*?)`\s*\]/;
  const match1 = content.match(pattern1);
  if (match1) {
    stylesContent = match1[1];
  }

  // Patrón 2: styles: ['...'],
  if (!stylesContent) {
    const pattern2 = /styles:\s*\[\s*'([\s\S]*?)'\s*\]/;
    const match2 = content.match(pattern2);
    if (match2) {
      stylesContent = match2[1];
    }
  }

  // Patrón 3: styles: ["..."],
  if (!stylesContent) {
    const pattern3 = /styles:\s*\[\s*"([\s\S]*?)"\s*\]/;
    const match3 = content.match(pattern3);
    if (match3) {
      stylesContent = match3[1];
    }
  }

  if (!stylesContent) {
    console.log(`  ⚠️  No se encontraron styles inline`);
    return null;
  }

  // Crear archivo SCSS
  const scssPath = path.join(componentDir, `${baseName}.scss`);

  // Verificar si ya existe
  if (fs.existsSync(scssPath)) {
    console.log(`  ⚠️  SCSS ya existe, saltando...`);
    return null;
  }

  try {
    fs.writeFileSync(scssPath, stylesContent.trim() + '\n', 'utf8');
    console.log(
      `  ✅ SCSS creado: ${baseName}.scss (${stylesContent.length} caracteres)`
    );
  } catch (error) {
    console.error(`  ❌ Error creando SCSS: ${error.message}`);
    return false;
  }

  // Actualizar el archivo .ts para usar styleUrl
  let newContent = content;

  // Reemplazar styles inline con styleUrl
  if (match1) {
    newContent = newContent.replace(pattern1, `styleUrl: './${baseName}.scss'`);
  }

  try {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`  ✅ TS actualizado con styleUrl`);
  } catch (error) {
    console.error(`  ❌ Error actualizando TS: ${error.message}`);
    return false;
  }

  return true;
}

// Procesar todos los componentes
console.log('🚀 Iniciando creación de archivos SCSS...\n');
console.log(
  `📦 Total de componentes a procesar: ${componentsToProcess.length}\n`
);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

componentsToProcess.forEach((componentPath) => {
  const result = extractAndCreateScss(componentPath);
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
console.log(`⚠️  Saltados (sin styles/ya existe): ${skipCount}`);
console.log(`❌ Errores: ${errorCount}`);
console.log('='.repeat(60) + '\n');

process.exit(errorCount > 0 ? 1 : 0);
