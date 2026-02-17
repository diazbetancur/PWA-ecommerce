#!/usr/bin/env node
/**
 * Script para debuggear features del tenant
 * Ejecutar en consola del navegador o con node
 */


// Si estamos en el navegador
if (typeof window !== 'undefined') {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.includes('tenant')) {
    }
  }

  const tenantKeys = Object.keys(localStorage).filter((k) =>
    k.includes('tenant')
  );
  tenantKeys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      const parsed = JSON.parse(value || '{}');
      if (parsed.features) {
        Object.entries(parsed.features).forEach(([k, v]) => {
        });
      }
    } catch (e) {
    }
  });
}

// Instrucciones
void (`
const config = JSON.parse(localStorage.getItem('tenant_config_test') || '{}');
`);

