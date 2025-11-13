import { TestBed } from '@angular/core/testing';
import { TenantCurrencyPipe, TenantCurrencySymbolPipe, TenantNumberPipe } from '../pipes/tenant-currency.pipe';
import { TenantContextService } from '../services/tenant-context.service';

describe('TenantCurrency Pipes', () => {
  let tenantCurrencyPipe: TenantCurrencyPipe;
  let tenantSymbolPipe: TenantCurrencySymbolPipe;
  let tenantNumberPipe: TenantNumberPipe;
  let mockTenantContext: jasmine.SpyObj<TenantContextService>;

  beforeEach(() => {
    const tenantContextSpy = jasmine.createSpyObj('TenantContextService', {
      'locale': jasmine.createSpy().and.returnValue('en-US'),
      'currency': jasmine.createSpy().and.returnValue('USD'),
      'getLocale': jasmine.createSpy().and.returnValue('en-US'),
      'getCurrency': jasmine.createSpy().and.returnValue('USD')
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: TenantContextService, useValue: tenantContextSpy }
      ]
    });

    mockTenantContext = TestBed.inject(TenantContextService) as jasmine.SpyObj<TenantContextService>;
    tenantCurrencyPipe = new TenantCurrencyPipe();
    tenantSymbolPipe = new TenantCurrencySymbolPipe();
    tenantNumberPipe = new TenantNumberPipe();

    // Inject the mock service manually
    (tenantCurrencyPipe as any).tenantContext = mockTenantContext;
    (tenantSymbolPipe as any).tenantContext = mockTenantContext;
    (tenantNumberPipe as any).tenantContext = mockTenantContext;
  });

  describe('TenantCurrencyPipe', () => {
    it('debe formatear precio con configuración US', () => {
      mockTenantContext.locale.and.returnValue('en-US');
      mockTenantContext.currency.and.returnValue('USD');

      const result = tenantCurrencyPipe.transform(29.99);
      expect(result).toBe('$29.99');
    });

    it('debe formatear precio con configuración EU', () => {
      mockTenantContext.locale.and.returnValue('es-ES');
      mockTenantContext.currency.and.returnValue('EUR');

      const result = tenantCurrencyPipe.transform(29.99);
      expect(result).toContain('€');
      expect(result).toContain('29,99');
    });

    it('debe formatear precio con configuración MX', () => {
      mockTenantContext.locale.and.returnValue('es-MX');
      mockTenantContext.currency.and.returnValue('MXN');

      const result = tenantCurrencyPipe.transform(599.5);
      expect(result).toContain('$');
      expect(result).toContain('599.50');
    });

    it('debe manejar monedas sin decimales (JPY)', () => {
      mockTenantContext.locale.and.returnValue('ja-JP');
      mockTenantContext.currency.and.returnValue('JPY');

      const result = tenantCurrencyPipe.transform(1000);
      expect(result).toBe('¥1,000');
    });

    it('debe retornar null para valores inválidos', () => {
      expect(tenantCurrencyPipe.transform(null)).toBe(null);
      expect(tenantCurrencyPipe.transform('')).toBe(null);
      expect(tenantCurrencyPipe.transform('invalid')).toBe(null);
    });

    it('debe usar fallback básico en caso de error', () => {
      mockTenantContext.locale.and.returnValue('invalid-locale');
      mockTenantContext.currency.and.returnValue('INVALID');

      const result = tenantCurrencyPipe.transform(29.99);
      expect(result).toBe('INVALID 29.99');
    });

    it('debe respetar parámetros de display personalizados', () => {
      mockTenantContext.locale.and.returnValue('en-US');
      mockTenantContext.currency.and.returnValue('USD');

      const symbolResult = tenantCurrencyPipe.transform(29.99, 'symbol');
      const codeResult = tenantCurrencyPipe.transform(29.99, 'code');

      expect(symbolResult).toBe('$29.99');
      expect(codeResult).toBe('USD 29.99');
    });

    it('debe respetar configuración de dígitos personalizados', () => {
      mockTenantContext.locale.and.returnValue('en-US');
      mockTenantContext.currency.and.returnValue('USD');

      const noDecimalsResult = tenantCurrencyPipe.transform(29.99, 'symbol', '1.0-0');
      const threeDecimalsResult = tenantCurrencyPipe.transform(29.99, 'symbol', '1.3-3');

      expect(noDecimalsResult).toBe('$30');
      expect(threeDecimalsResult).toBe('$29.990');
    });
  });

  describe('TenantCurrencySymbolPipe', () => {
    it('debe retornar símbolo de USD', () => {
      mockTenantContext.getLocale.and.returnValue('en-US');
      mockTenantContext.getCurrency.and.returnValue('USD');

      const result = tenantSymbolPipe.transform();
      expect(result).toBe('$');
    });

    it('debe retornar símbolo de EUR', () => {
      mockTenantContext.getLocale.and.returnValue('es-ES');
      mockTenantContext.getCurrency.and.returnValue('EUR');

      const result = tenantSymbolPipe.transform();
      expect(result).toBe('€');
    });

    it('debe usar fallback para monedas desconocidas', () => {
      mockTenantContext.getLocale.and.returnValue('en-US');
      mockTenantContext.getCurrency.and.returnValue('UNKNOWN');

      const result = tenantSymbolPipe.transform();
      expect(result).toBe('UNKNOWN');
    });
  });

  describe('TenantNumberPipe', () => {
    it('debe formatear números según locale US', () => {
      mockTenantContext.getLocale.and.returnValue('en-US');

      const result = tenantNumberPipe.transform(1234567.89);
      expect(result).toBe('1,234,567.89');
    });

    it('debe formatear números según locale EU', () => {
      mockTenantContext.getLocale.and.returnValue('es-ES');

      const result = tenantNumberPipe.transform(1234567.89);
      expect(result).toContain('1.234.567,89');
    });

    it('debe respetar configuración de dígitos', () => {
      mockTenantContext.getLocale.and.returnValue('en-US');

      const result = tenantNumberPipe.transform(1234.56789, '1.2-2');
      expect(result).toBe('1,234.57');
    });

    it('debe retornar null para valores inválidos', () => {
      expect(tenantNumberPipe.transform(null)).toBe(null);
      expect(tenantNumberPipe.transform('')).toBe(null);
      expect(tenantNumberPipe.transform('invalid')).toBe(null);
    });
  });

  describe('Integración con diferentes locales', () => {
    const testCases = [
      {
        locale: 'en-US',
        currency: 'USD',
        value: 1234.56,
        expectedPattern: /\$1,234\.56/
      },
      {
        locale: 'es-ES',
        currency: 'EUR',
        value: 1234.56,
        expectedPattern: /1\.234,56\s*€|€\s*1\.234,56/
      },
      {
        locale: 'es-MX',
        currency: 'MXN',
        value: 1234.56,
        expectedPattern: /\$1,234\.56/
      },
      {
        locale: 'ja-JP',
        currency: 'JPY',
        value: 1234,
        expectedPattern: /¥1,234/
      }
    ];

    for (const testCase of testCases) {
      it(`debe formatear correctamente para ${testCase.locale} con ${testCase.currency}`, () => {
        mockTenantContext.locale.and.returnValue(testCase.locale);
        mockTenantContext.currency.and.returnValue(testCase.currency);

        const result = tenantCurrencyPipe.transform(testCase.value);
        expect(result).toMatch(testCase.expectedPattern);
      });
    }
  });
});

/**
 * Test de integración que verifica el comportamiento completo
 */
describe('TenantCurrency Integration Tests', () => {
  it('debe funcionar con diferentes configuraciones de tenant en tiempo real', () => {
    const mockContext = jasmine.createSpyObj('TenantContextService', {
      'locale': jasmine.createSpy(),
      'currency': jasmine.createSpy()
    });

    const pipe = new TenantCurrencyPipe();
    (pipe as any).tenantContext = mockContext;

    // Simular cambio de tenant de US a EUR
    mockContext.locale.and.returnValue('en-US');
    mockContext.currency.and.returnValue('USD');

    let result = pipe.transform(99.99);
    expect(result).toBe('$99.99');

    // Cambiar a configuración europea
    mockContext.locale.and.returnValue('es-ES');
    mockContext.currency.and.returnValue('EUR');

    result = pipe.transform(99.99);
    expect(result).toContain('€');
    expect(result).toContain('99,99');
  });
});

/**
 * Función de utilidad para testing manual en consola
 */
export function testCurrencyPipes() {
  console.group('🧪 Test Manual de Currency Pipes');

  const testValues = [29.99, 1234.56, 0.99, 10000];
  const localeConfigs = [
    { locale: 'en-US', currency: 'USD' },
    { locale: 'es-ES', currency: 'EUR' },
    { locale: 'es-MX', currency: 'MXN' },
    { locale: 'ja-JP', currency: 'JPY' }
  ];

  console.log('📊 Resultados por configuración:');

  for (const config of localeConfigs) {
    console.log(`\\n🌍 ${config.locale} - ${config.currency}:`);

    for (const value of testValues) {
      try {
        const formatted = new Intl.NumberFormat(config.locale, {
          style: 'currency',
          currency: config.currency
        }).format(value);

        console.log(`  ${value} → ${formatted}`);
      } catch (error) {
        console.log(`  ${value} → ERROR: ${error.message}`);
      }
    }
  }

  console.groupEnd();
}

// Exportar para uso en navegador
if (globalThis.window !== undefined) {
  (globalThis as any).testCurrencyPipes = testCurrencyPipes;
}
