#!/usr/bin/env node
/**
 * Script para debuggear features del tenant
 * Ejecutar en consola del navegador o con node
 */

console.log('='.repeat(60));
console.log('🔍 DEBUGGING TENANT FEATURES');
console.log('='.repeat(60));

// Si estamos en el navegador
if (typeof window !== 'undefined') {
  console.log('\n📦 LocalStorage Keys:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.includes('tenant')) {
      console.log(`  - ${key}`);
    }
  }

  console.log('\n🔧 Tenant Config (si está cargado):');
  const tenantKeys = Object.keys(localStorage).filter((k) =>
    k.includes('tenant')
  );
  tenantKeys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      const parsed = JSON.parse(value || '{}');
      console.log(`\n${key}:`, parsed);
      if (parsed.features) {
        console.log('\n✨ Features disponibles:');
        Object.entries(parsed.features).forEach(([k, v]) => {
          console.log(`  ${v ? '✅' : '❌'} ${k}`);
        });
      }
    } catch (e) {
      console.log(`  ${key}: ${value} (no JSON)`);
    }
  });
}

// Instrucciones
console.log('\n📋 Para verificar en el navegador:');
console.log('1. Abre DevTools (F12)');
console.log('2. Ve a la pestaña "Console"');
console.log('3. Pega este código:');
console.log(`
const config = JSON.parse(localStorage.getItem('tenant_config_test') || '{}');
console.log('Tenant:', config.tenant?.slug);
console.log('Features:', config.features);
console.log('Loyalty enabled?', config.features?.loyalty || config.features?.enableLoyalty);
console.log('MultiStore enabled?', config.features?.multiStore || config.features?.enableMultiStore);
`);

console.log('\n🎯 Valores esperados por guards:');
console.log('  - features.loyalty (boolean)');
console.log('  - features.multiStore (boolean)');
console.log('\n' + '='.repeat(60));
