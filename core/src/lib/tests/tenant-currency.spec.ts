import { TestBed } from '@angular/core/testing';
import {
  TenantCurrencyPipe,
  TenantCurrencySymbolPipe,
  TenantNumberPipe,
} from '../pipes/tenant-currency.pipe';
import { TenantContextService } from '../services/tenant-context.service';

describe('TenantCurrency Pipes', () => {
  let tenantCurrencyPipe: TenantCurrencyPipe;
  let tenantSymbolPipe: TenantCurrencySymbolPipe;
  let tenantNumberPipe: TenantNumberPipe;
  let mockTenantContext: any;

  beforeEach(() => {
    const tenantContextSpy = {
      locale: jest.fn().mockReturnValue('en-US'),
      currency: jest.fn().mockReturnValue('USD'),
      getLocale: jest.fn().mockReturnValue('en-US'),
      getCurrency: jest.fn().mockReturnValue('USD'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TenantContextService, useValue: tenantContextSpy },
      ],
    });

    mockTenantContext = TestBed.inject(TenantContextService) as any;

    // Crear los pipes dentro del contexto de inyección de Angular
    TestBed.runInInjectionContext(() => {
      tenantCurrencyPipe = new TenantCurrencyPipe();
      tenantSymbolPipe = new TenantCurrencySymbolPipe();
      tenantNumberPipe = new TenantNumberPipe();
    });
  });

  describe('TenantCurrencyPipe', () => {
    it('debe formatear precio con configuración US', () => {
      // Recrear el pipe con la configuración actualizada
      mockTenantContext.locale.mockReturnValue('en-US');
      mockTenantContext.currency.mockReturnValue('USD');
      const pipe = TestBed.runInInjectionContext(
        () => new TenantCurrencyPipe()
      );

      const result = pipe.transform(29.99);
      expect(result).toBe('$29.99');
    });

    it('debe formatear precio con configuración EU', () => {
      mockTenantContext.locale.mockReturnValue('es-ES');
      mockTenantContext.currency.mockReturnValue('EUR');
      const pipe = TestBed.runInInjectionContext(
        () => new TenantCurrencyPipe()
      );

      const result = pipe.transform(29.99);
      // Acepta tanto EUR (código) como € (símbolo)
      expect(result).toMatch(/EUR|€/);
      expect(result).toContain('29');
    });

    it('debe formatear precio con configuración MX', () => {
      mockTenantContext.locale.mockReturnValue('es-MX');
      mockTenantContext.currency.mockReturnValue('MXN');
      const pipe = TestBed.runInInjectionContext(
        () => new TenantCurrencyPipe()
      );

      const result = pipe.transform(599.5);
      // Acepta tanto MXN (código) como $ (símbolo)
      expect(result).toMatch(/MXN|\$/);
      expect(result).toContain('599');
    });

    it('debe manejar monedas sin decimales (JPY)', () => {
      mockTenantContext.locale.mockReturnValue('ja-JP');
      mockTenantContext.currency.mockReturnValue('JPY');
      const pipe = TestBed.runInInjectionContext(
        () => new TenantCurrencyPipe()
      );

      const result = pipe.transform(1000);
      // Acepta tanto JPY (código) como ¥ (símbolo)
      expect(result).toMatch(/JPY|¥/);
      expect(result).toContain('1');
    });

    it('debe retornar null para valores inválidos', () => {
      expect(tenantCurrencyPipe.transform(null)).toBe(null);
      expect(tenantCurrencyPipe.transform('')).toBe(null);
      expect(tenantCurrencyPipe.transform('invalid')).toBe(null);
    });

    it('debe usar fallback básico en caso de error', () => {
      mockTenantContext.locale.mockReturnValue('invalid-locale');
      mockTenantContext.currency.mockReturnValue('INVALID');
      const pipe = TestBed.runInInjectionContext(
        () => new TenantCurrencyPipe()
      );

      const result = pipe.transform(29.99);
      expect(result).toBe('INVALID 29.99');
    });

    it('debe respetar parámetros de display personalizados', () => {
      mockTenantContext.locale.mockReturnValue('en-US');
      mockTenantContext.currency.mockReturnValue('USD');
      const pipe = TestBed.runInInjectionContext(
        () => new TenantCurrencyPipe()
      );

      const symbolResult = pipe.transform(29.99, 'symbol');
      const codeResult = pipe.transform(29.99, 'code');

      expect(symbolResult).toBe('$29.99');
      expect(codeResult).toMatch(/USD\s*29\.99|USD29\.99/);
    });

    it('debe respetar configuración de dígitos personalizados', () => {
      mockTenantContext.locale.mockReturnValue('en-US');
      mockTenantContext.currency.mockReturnValue('USD');
      const pipe = TestBed.runInInjectionContext(
        () => new TenantCurrencyPipe()
      );

      const noDecimalsResult = pipe.transform(29.99, 'symbol', '1.0-0');
      const threeDecimalsResult = pipe.transform(29.99, 'symbol', '1.3-3');

      expect(noDecimalsResult).toBe('$30');
      expect(threeDecimalsResult).toBe('$29.990');
    });
  });

  describe('TenantCurrencySymbolPipe', () => {
    it('debe retornar símbolo de USD', () => {
      mockTenantContext.getLocale.mockReturnValue('en-US');
      mockTenantContext.getCurrency.mockReturnValue('USD');

      const result = tenantSymbolPipe.transform();
      expect(result).toBe('$');
    });

    it('debe retornar símbolo de EUR', () => {
      mockTenantContext.getLocale.mockReturnValue('es-ES');
      mockTenantContext.getCurrency.mockReturnValue('EUR');

      const result = tenantSymbolPipe.transform();
      expect(result).toBe('€');
    });

    it('debe usar fallback para monedas desconocidas', () => {
      mockTenantContext.getLocale.mockReturnValue('en-US');
      mockTenantContext.getCurrency.mockReturnValue('UNKNOWN');

      const result = tenantSymbolPipe.transform();
      expect(result).toBe('UNKNOWN');
    });
  });

  describe('TenantNumberPipe', () => {
    it('debe formatear números según locale US', () => {
      mockTenantContext.getLocale.mockReturnValue('en-US');

      const result = tenantNumberPipe.transform(1234567.89);
      expect(result).toBe('1,234,567.89');
    });

    it('debe formatear números según locale EU', () => {
      mockTenantContext.getLocale.mockReturnValue('es-ES');

      const result = tenantNumberPipe.transform(1234567.89);
      expect(result).toContain('1.234.567,89');
    });

    it('debe respetar configuración de dígitos', () => {
      mockTenantContext.getLocale.mockReturnValue('en-US');

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
        expectedPattern: /\$1,234\.56/,
      },
      {
        locale: 'es-ES',
        currency: 'EUR',
        value: 1234.56,
        expectedPattern: /EUR.*1.*234|1.*234.*EUR|€.*1.*234|1.*234.*€/,
      },
      {
        locale: 'es-MX',
        currency: 'MXN',
        value: 1234.56,
        expectedPattern: /MXN.*1.*234|1.*234.*MXN|\$.*1.*234|1.*234.*\$/,
      },
      {
        locale: 'ja-JP',
        currency: 'JPY',
        value: 1234,
        expectedPattern: /JPY.*1.*234|1.*234.*JPY|¥.*1.*234|1.*234.*¥/,
      },
    ];

    for (const testCase of testCases) {
      it(`debe formatear correctamente para ${testCase.locale} con ${testCase.currency}`, () => {
        mockTenantContext.locale.mockReturnValue(testCase.locale);
        mockTenantContext.currency.mockReturnValue(testCase.currency);
        const pipe = TestBed.runInInjectionContext(
          () => new TenantCurrencyPipe()
        );

        const result = pipe.transform(testCase.value);
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
    const mockContext = {
      locale: jest.fn(),
      currency: jest.fn(),
      getLocale: jest.fn(),
      getCurrency: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TenantContextService, useValue: mockContext }],
    });

    // Simular cambio de tenant de US a EUR
    mockContext.locale.mockReturnValue('en-US');
    mockContext.currency.mockReturnValue('USD');
    let pipe = TestBed.runInInjectionContext(() => new TenantCurrencyPipe());

    let result = pipe.transform(99.99);
    expect(result).toBe('$99.99');

    // Cambiar a configuración europea (recrear pipe para que tome la nueva config)
    mockContext.locale.mockReturnValue('es-ES');
    mockContext.currency.mockReturnValue('EUR');
    pipe = TestBed.runInInjectionContext(() => new TenantCurrencyPipe());

    result = pipe.transform(99.99);
    // Acepta tanto EUR (código) como € (símbolo)
    expect(result).toMatch(/EUR|\u20AC/);
    expect(result).toContain('99');
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
    { locale: 'ja-JP', currency: 'JPY' },
  ];

  console.log('📊 Resultados por configuración:');

  for (const config of localeConfigs) {
    console.log(`\\n🌍 ${config.locale} - ${config.currency}:`);

    for (const value of testValues) {
      try {
        const formatted = new Intl.NumberFormat(config.locale, {
          style: 'currency',
          currency: config.currency,
        }).format(value);

        console.log(`  ${value} → ${formatted}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log(`  ${value} → ERROR: ${errorMessage}`);
      }
    }
  }

  console.groupEnd();
}

// Exportar para uso en navegador
if (globalThis.window !== undefined) {
  (globalThis as any).testCurrencyPipes = testCurrencyPipes;
}
