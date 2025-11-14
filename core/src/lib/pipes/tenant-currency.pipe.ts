import { Pipe, PipeTransform, inject, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { TenantContextService } from '../services/tenant-context.service';

/**
 * Pipe personalizado para formatear moneda según la configuración del tenant
 * Se adapta automáticamente a la moneda y locale del tenant actual
 *
 * @example
 * // En el template
 * {{ price | tenantCurrency }}
 * {{ price | tenantCurrency:'symbol':'1.0-0' }}
 * {{ price | tenantCurrency:'symbol-narrow':'1.2-2' }}
 *
 * // Resultado según tenant:
 * // US tenant: $29.99
 * // EU tenant: €29,99
 * // MX tenant: $29.99 MXN
 */
@Pipe({
  name: 'tenantCurrency',
  standalone: true,
  pure: false, // Necesario para reactividad con signals
})
export class TenantCurrencyPipe implements PipeTransform {
  private readonly tenantContext = inject(TenantContextService);

  // Signals computados para reactividad
  private readonly currentLocale = computed(() => this.tenantContext.locale());
  private readonly currentCurrency = computed(() =>
    this.tenantContext.currency()
  );

  /**
   * Transforma un valor numérico a formato de moneda del tenant
   *
   * @param value - Valor numérico a formatear
   * @param display - Formato de visualización ('code'|'symbol'|'symbol-narrow')
   * @param digitsInfo - Información de dígitos (ej: '1.2-2')
   * @param locale - Locale específico (opcional, usa el del tenant por defecto)
   * @returns string - Valor formateado en la moneda del tenant
   */
  transform(
    value: number | string | null | undefined,
    display: 'code' | 'symbol' | 'symbol-narrow' | string = 'symbol',
    digitsInfo?: string,
    locale?: string
  ): string | null {
    // Validar valor de entrada
    if (value == null || value === '' || Number.isNaN(Number(value))) {
      return null;
    }

    // Usar configuración del tenant o valores por defecto
    const tenantLocale = locale || this.currentLocale() || 'en-US';
    const tenantCurrency = this.currentCurrency() || 'USD';

    // Configuración de dígitos por defecto basada en la moneda
    const defaultDigitsInfo = this.getDefaultDigitsInfo(tenantCurrency);
    const finalDigitsInfo = digitsInfo || defaultDigitsInfo;

    try {
      // Crear CurrencyPipe con el locale correcto cada vez
      const currencyPipe = new CurrencyPipe(tenantLocale);
      const formatted = currencyPipe.transform(
        value,
        tenantCurrency,
        display,
        finalDigitsInfo,
        tenantLocale
      );

      return formatted;
    } catch (error) {
      // Fallback en caso de error
      console.warn(`[TenantCurrencyPipe] Error formatting currency:`, {
        value,
        currency: tenantCurrency,
        locale: tenantLocale,
        error,
      });

      // Formato básico como fallback
      return this.basicCurrencyFormat(Number(value), tenantCurrency);
    }
  }

  /**
   * Obtiene la configuración por defecto de dígitos según la moneda
   * @param currency - Código de moneda
   * @returns string - Configuración de dígitos
   */
  private getDefaultDigitsInfo(currency: string): string {
    const currencyDefaults: Record<string, string> = {
      // Monedas sin decimales
      JPY: '1.0-0', // Yen japonés
      KRW: '1.0-0', // Won coreano
      VND: '1.0-0', // Dong vietnamita
      CLP: '1.0-0', // Peso chileno

      // Monedas con 2 decimales (mayoría)
      USD: '1.2-2', // Dólar estadounidense
      EUR: '1.2-2', // Euro
      GBP: '1.2-2', // Libra esterlina
      MXN: '1.2-2', // Peso mexicano
      CAD: '1.2-2', // Dólar canadiense
      AUD: '1.2-2', // Dólar australiano
      BRL: '1.2-2', // Real brasileño
      ARS: '1.2-2', // Peso argentino
      COP: '1.2-2', // Peso colombiano

      // Monedas con 3 decimales
      BHD: '1.3-3', // Dinar bahreini
      JOD: '1.3-3', // Dinar jordano
      KWD: '1.3-3', // Dinar kuwaití
    };

    return currencyDefaults[currency] || '1.2-2'; // Por defecto 2 decimales
  }

  /**
   * Formato básico de respaldo cuando falla el CurrencyPipe nativo
   * @param value - Valor numérico
   * @param currency - Código de moneda
   * @returns string - Formato básico
   */
  private basicCurrencyFormat(value: number, currency: string): string {
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${currency} ${formatted}`;
  }
}

/**
 * Pipe adicional para casos donde se necesita solo el símbolo de la moneda
 */
@Pipe({
  name: 'tenantCurrencySymbol',
  standalone: true,
  pure: false,
})
export class TenantCurrencySymbolPipe implements PipeTransform {
  private readonly tenantContext = inject(TenantContextService);
  private readonly currencyPipe = new CurrencyPipe('en-US');

  /**
   * Obtiene solo el símbolo de la moneda del tenant
   * @param locale - Locale específico (opcional)
   * @returns string - Símbolo de la moneda
   */
  transform(locale?: string): string {
    const tenantLocale = locale || this.tenantContext.getLocale();
    const tenantCurrency = this.tenantContext.getCurrency();

    try {
      // Formatear un valor pequeño para extraer el símbolo
      const formatted = this.currencyPipe.transform(
        1,
        tenantCurrency,
        'symbol',
        '1.0-0',
        tenantLocale
      );

      // Extraer solo el símbolo (remover números y espacios)
      return formatted?.replaceAll(/[\d\s,]/g, '') || tenantCurrency;
    } catch {
      return this.getBasicCurrencySymbol(tenantCurrency);
    }
  }

  /**
   * Obtiene símbolos básicos de moneda como fallback
   */
  private getBasicCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      MXN: '$',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      BRL: 'R$',
      ARS: '$',
      COP: '$',
      CLP: '$',
    };

    return symbols[currency] || currency;
  }
}

/**
 * Pipe para formatear números según el locale del tenant
 */
@Pipe({
  name: 'tenantNumber',
  standalone: true,
  pure: false,
})
export class TenantNumberPipe implements PipeTransform {
  private readonly tenantContext = inject(TenantContextService);

  /**
   * Formatea un número según el locale del tenant
   * @param value - Valor numérico
   * @param digitsInfo - Configuración de dígitos
   * @param locale - Locale específico (opcional)
   * @returns string - Número formateado
   */
  transform(
    value: number | string | null | undefined,
    digitsInfo?: string,
    locale?: string
  ): string | null {
    if (value == null || value === '' || Number.isNaN(Number(value))) {
      return null;
    }

    const tenantLocale = locale || this.tenantContext.getLocale();
    const numValue = Number(value);

    try {
      return numValue.toLocaleString(
        tenantLocale,
        this.parseDigitsInfo(digitsInfo)
      );
    } catch {
      return numValue.toString();
    }
  }

  /**
   * Convierte digitsInfo string a opciones de Intl.NumberFormat
   */
  private parseDigitsInfo(digitsInfo?: string): Intl.NumberFormatOptions {
    if (!digitsInfo) {
      return { minimumFractionDigits: 0, maximumFractionDigits: 3 };
    }

    const match = digitsInfo.match(/^(\d+)\.(\d+)-(\d+)$/);
    if (match) {
      return {
        minimumIntegerDigits: Number(match[1]),
        minimumFractionDigits: Number(match[2]),
        maximumFractionDigits: Number(match[3]),
      };
    }

    return { minimumFractionDigits: 0, maximumFractionDigits: 3 };
  }
}
