#!/usr/bin/env node

/**
 * Simulador simple para demostrar cómo funciona el interceptor multi-tenant
 * Ejecuta: node scripts/demo-headers.js
 */

// Simular el funcionamiento del interceptor
class MockTenantContext {
  constructor() {
    this.tenant = {
      slug: 'demo-tenant',
      key: 'demo-key-123'
    };
  }

  shouldIncludeTenantHeaders(url) {
    // No incluir headers para URLs públicas
    if (url.includes('/api/public/') || url.includes('/api/health')) {
      return false;
    }

    // Incluir headers para todas las URLs de API
    if (url.startsWith('/api/') || url.includes('/api/')) {
      return true;
    }

    return false;
  }

  getTenantHeaders() {
    return {
      slug: this.tenant.slug,
      key: this.tenant.key
    };
  }
}

class MockApiClientService {
  constructor() {
    this.tenantContext = new MockTenantContext();
  }

  // Simular el interceptor agregando headers
  addTenantHeaders(url, headers = {}) {
    if (!this.tenantContext.shouldIncludeTenantHeaders(url)) {
      return headers;
    }

    const tenantHeaders = this.tenantContext.getTenantHeaders();

    return {
      ...headers,
      'X-Tenant-Slug': tenantHeaders.slug,
      'X-Tenant-Key': tenantHeaders.key
    };
  }

  async get(url, options = {}) {
    const finalHeaders = this.addTenantHeaders(url, options.headers);

    return {
      url,
      method: 'GET',
      headers: finalHeaders,
      timestamp: new Date().toISOString()
    };
  }

  async post(url, body, options = {}) {
    const finalHeaders = this.addTenantHeaders(url, options.headers);

    return {
      url,
      method: 'POST',
      headers: finalHeaders,
      body,
      timestamp: new Date().toISOString()
    };
  }
}

// Colores para la consola
const colors = {
  green: '\\x1b[32m',
  blue: '\\x1b[34m',
  yellow: '\\x1b[33m',
  red: '\\x1b[31m',
  cyan: '\\x1b[36m',
  reset: '\\x1b[0m',
  bold: '\\x1b[1m'
};

function printHeader(text) {
  console.log(`${colors.bold}${colors.cyan}${text}${colors.reset}`);
}

function printSuccess(text) {
  console.log(`${colors.green}✅ ${text}${colors.reset}`);
}

function printInfo(text) {
  console.log(`${colors.blue}ℹ️  ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`);
}

async function runDemo() {
  const apiClient = new MockApiClientService();

  console.log();
  printHeader('🧪 DEMO: ApiClientService + TenantHeaderInterceptor');
  console.log();

  // Test 1: GET con headers de tenant
  printInfo('Test 1: GET /api/catalog/products');
  const result1 = await apiClient.get('/api/catalog/products');
  console.log('Request:', JSON.stringify(result1, null, 2));

  if (result1.headers['X-Tenant-Slug'] === 'demo-tenant') {
    printSuccess('Header X-Tenant-Slug agregado correctamente');
  }

  if (result1.headers['X-Tenant-Key'] === 'demo-key-123') {
    printSuccess('Header X-Tenant-Key agregado correctamente');
  }

  console.log();

  // Test 2: POST con body y headers
  printInfo('Test 2: POST /api/catalog/products');
  const result2 = await apiClient.post('/api/catalog/products', {
    name: 'Nuevo Producto',
    price: 29.99
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  console.log('Request:', JSON.stringify(result2, null, 2));

  if (result2.headers['X-Tenant-Slug'] && result2.headers['Content-Type']) {
    printSuccess('Headers de tenant + custom headers combinados correctamente');
  }

  console.log();

  // Test 3: URL pública (sin headers)
  printInfo('Test 3: GET /api/public/health (URL pública)');
  const result3 = await apiClient.get('/api/public/health');
  console.log('Request:', JSON.stringify(result3, null, 2));

  if (!result3.headers['X-Tenant-Slug']) {
    printSuccess('Headers de tenant NO agregados para URL pública (correcto)');
  } else {
    printWarning('Headers de tenant agregados a URL pública (incorrecto)');
  }

  console.log();

  // Test 4: URL externa (sin headers)
  printInfo('Test 4: GET https://external-api.com/data (URL externa)');
  const result4 = await apiClient.get('https://external-api.com/data');
  console.log('Request:', JSON.stringify(result4, null, 2));

  if (!result4.headers['X-Tenant-Slug']) {
    printSuccess('Headers de tenant NO agregados para URL externa (correcto)');
  }

  console.log();

  printHeader('📋 RESUMEN DEL COMPORTAMIENTO:');
  console.log();
  console.log(`${colors.green}✅ URLs que reciben headers de tenant:${colors.reset}`);
  console.log('   • /api/catalog/products');
  console.log('   • /api/orders');
  console.log('   • /api/cart');
  console.log('   • Cualquier URL que contenga /api/ (excepto públicas)');
  console.log();

  console.log(`${colors.red}❌ URLs que NO reciben headers:${colors.reset}`);
  console.log('   • /api/public/health');
  console.log('   • /api/public/status');
  console.log('   • https://external-api.com/data');
  console.log('   • URLs que no contengan /api/');
  console.log();

  printHeader('🚀 En tu aplicación Angular:');
  console.log();
  console.log(`${colors.cyan}// Uso del ApiClientService refinado${colors.reset}`);
  console.log('const products = await this.apiClient.get<Product[]>(\'/api/catalog/products\').toPromise();');
  console.log();
  console.log(`${colors.cyan}// Headers agregados automáticamente:${colors.reset}`);
  console.log('// X-Tenant-Slug: demo-tenant');
  console.log('// X-Tenant-Key: demo-key-123');
  console.log();
}

// Ejecutar demo
runDemo().catch(console.error);
