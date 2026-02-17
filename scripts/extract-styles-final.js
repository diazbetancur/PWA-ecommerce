#!/usr/bin/env node

/**
 * Script mejorado para extraer styles inline y crear archivos SCSS
 */

const fs = require('fs');
const path = require('path');

// Componentes con styles inline detectados
const componentsWithStyles = [
  './features/src/lib/loyalty/components/transaction-item/transaction-item.component.ts',
  './features/src/lib/loyalty/components/loyalty-balance/loyalty-balance.component.ts',
  './features/src/lib/loyalty/components/redemption-status/redemption-status.component.ts',
  './features/src/lib/loyalty/components/tier-badge/tier-badge.component.ts',
  './features/src/lib/loyalty/components/reward-card/reward-card.component.ts',
  './features/src/lib/loyalty/components/loyalty-nav/loyalty-nav.component.ts',
  './features/src/lib/loyalty/pages/rewards-catalog/rewards-catalog.component.ts',
  './features/src/lib/loyalty/pages/loyalty-account/loyalty-account.component.ts',
  './features/src/lib/loyalty/pages/transactions-history/transactions-history.component.ts',
  './features/src/lib/loyalty/pages/my-redemptions/my-redemptions.component.ts',
  './features-admin/src/lib/pages/loyalty/rewards-list/rewards-list.component.ts',
  './features-admin/src/lib/pages/loyalty/redemptions-list/redemptions-list.component.ts',
  './features-admin/src/lib/pages/loyalty/points-adjustment/points-adjustment.component.ts',
];

function extractStylesAdvanced(content) {
  // Buscar styles: [ ` ... ` ],
  const startMatch = content.match(/styles:\s*\[\s*`/);
  if (!startMatch) return null;

  const startIndex = startMatch.index + startMatch[0].length;
  let depth = 1; // Ya encontramos el primer backtick
  let endIndex = -1;

  // Buscar el backtick de cierre, manejando escapes
  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';

    // Ignorar backticks escapados
    if (char === '`' && prevChar !== '\\') {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) return null;

  return content.substring(startIndex, endIndex);
}

function processComponent(componentPath) {
  const fullPath = path.join(__dirname, '..', componentPath);
  const componentDir = path.dirname(fullPath);
  const baseName = path.basename(fullPath, '.ts');
  const componentName = baseName.replace('.component', '');


  // Leer el archivo
  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    return false;
  }

  // Verificar si ya tiene styleUrl
  if (content.includes('styleUrl:')) {
    return null;
  }

  // Extraer styles
  const stylesContent = extractStylesAdvanced(content);

  if (!stylesContent) {
    return null;
  }


  // Crear archivo SCSS
  const scssPath = path.join(componentDir, `${baseName}.scss`);

  try {
    fs.writeFileSync(scssPath, stylesContent.trim() + '\n', 'utf8');
  } catch (error) {
    return false;
  }

  // Actualizar el archivo .ts
  let newContent = content;

  // Reemplazar styles inline con styleUrl
  newContent = newContent.replace(
    /styles:\s*\[\s*`[\s\S]*?`\s*\]\s*,/,
    `styleUrl: './${baseName}.scss',`
  );

  try {
    fs.writeFileSync(fullPath, newContent, 'utf8');
  } catch (error) {
    return false;
  }

  return true;
}

// Procesar todos los componentes

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

componentsWithStyles.forEach((componentPath) => {
  const result = processComponent(componentPath);
  if (result === true) {
    successCount++;
  } else if (result === null) {
    skipCount++;
  } else {
    errorCount++;
  }
});


process.exit(errorCount > 0 ? 1 : 0);
