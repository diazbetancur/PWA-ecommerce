import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import {
  TenantCurrencyPipe,
  TenantCurrencySymbolPipe,
  TenantNumberPipe,
} from '../../pipes/tenant-currency.pipe';
import { TenantContextService } from '../../services/tenant-context.service';

interface CurrencyDemoProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
}

interface TenantCurrencyConfig {
  name: string;
  currency: string;
  locale: string;
  sampleProducts: CurrencyDemoProduct[];
}

/**
 * Componente de demostración para los pipes de moneda multi-tenant
 * Muestra cómo diferentes configuraciones de tenant afectan el formato de precios
 */
@Component({
  selector: 'app-currency-demo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TenantCurrencyPipe,
    TenantCurrencySymbolPipe,
    TenantNumberPipe,
  ],
  template: `
    <div class="currency-demo">
      <div class="demo-header">
        <h2>💰 Demo: Monedas y Formatos Multi-tenant</h2>
        <p>
          Demuestra cómo los precios se adaptan automáticamente según el tenant
        </p>
      </div>

      <!-- Configuración actual del tenant -->
      <div class="current-tenant-info">
        <h3>🏢 Configuración Actual del Tenant</h3>
        <div class="tenant-details">
          <div class="detail-item">
            <label>Moneda:</label>
            <span class="value">{{ tenantContext.getCurrency() }}</span>
          </div>
          <div class="detail-item">
            <label>Locale:</label>
            <span class="value">{{ tenantContext.getLocale() }}</span>
          </div>
          <div class="detail-item">
            <label>Símbolo de moneda:</label>
            <span class="value currency-symbol">
              {{ '' | tenantCurrencySymbol }}
            </span>
          </div>
        </div>
      </div>

      <!-- Simulador de diferentes tenants -->
      <div class="tenant-simulator">
        <h3>🌍 Simulador de Diferentes Tenants</h3>
        <div class="tenant-configs-grid">
          @for (config of tenantConfigs; track config.name) {
          <div class="tenant-config-card">
            <h4>{{ config.name }}</h4>
            <div class="config-info">
              <span class="currency">{{ config.currency }}</span>
              <span class="locale">{{ config.locale }}</span>
            </div>

            <div class="products-preview">
              @for (product of config.sampleProducts.slice(0, 2); track
              product.id) {
              <div class="product-price-demo">
                <span class="product-name">{{ product.name }}</span>
                <span class="product-price">
                  {{
                    formatPriceForLocale(
                      product.price,
                      config.currency,
                      config.locale
                    )
                  }}
                </span>
              </div>
              }
            </div>
          </div>
          }
        </div>
      </div>

      <!-- Prueba interactiva -->
      <div class="interactive-test">
        <h3>🧪 Prueba Interactiva</h3>
        <div class="price-tester">
          <div class="input-section">
            <label for="testPrice">Ingresa un precio:</label>
            <input
              id="testPrice"
              type="number"
              [formControl]="testPriceControl"
              placeholder="29.99"
              step="0.01"
              min="0"
            />
          </div>

          <div class="results-section">
            <h4>Formatos con pipe tenant actual:</h4>
            <div class="format-examples">
              <div class="format-item">
                <label>Formato por defecto:</label>
                <span class="result">
                  {{ testPriceControl.value | tenantCurrency }}
                </span>
              </div>
              <div class="format-item">
                <label>Solo símbolo:</label>
                <span class="result">
                  {{ testPriceControl.value | tenantCurrency : 'symbol' }}
                </span>
              </div>
              <div class="format-item">
                <label>Símbolo compacto:</label>
                <span class="result">
                  {{
                    testPriceControl.value | tenantCurrency : 'symbol-narrow'
                  }}
                </span>
              </div>
              <div class="format-item">
                <label>Con código:</label>
                <span class="result">
                  {{ testPriceControl.value | tenantCurrency : 'code' }}
                </span>
              </div>
              <div class="format-item">
                <label>Sin decimales:</label>
                <span class="result">
                  {{
                    testPriceControl.value | tenantCurrency : 'symbol' : '1.0-0'
                  }}
                </span>
              </div>
              <div class="format-item">
                <label>3 decimales:</label>
                <span class="result">
                  {{
                    testPriceControl.value | tenantCurrency : 'symbol' : '1.3-3'
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Productos de ejemplo con el tenant actual -->
      <div class="products-demo">
        <h3>🛍️ Productos con Precios Multi-tenant</h3>
        <div class="products-grid">
          @for (product of sampleProducts(); track product.id) {
          <div class="demo-product-card">
            <h4>{{ product.name }}</h4>

            <div class="price-section">
              @if (product.originalPrice && product.originalPrice >
              product.price) {
              <span class="original-price">
                {{ product.originalPrice | tenantCurrency }}
              </span>
              }
              <span class="current-price">
                {{ product.price | tenantCurrency }}
              </span>

              @if (product.originalPrice && product.originalPrice >
              product.price) {
              <span class="discount">
                {{
                  calculateDiscount(product.originalPrice, product.price)
                    | tenantNumber : '1.0-0'
                }}% OFF
              </span>
              }
            </div>

            <div class="stock-info">
              <span class="stock-count">
                {{ product.stock | tenantNumber }}
              </span>
              <span class="stock-label">en stock</span>
            </div>
          </div>
          }
        </div>
      </div>

      <!-- Información técnica -->
      <div class="technical-info">
        <h3>⚙️ Información Técnica</h3>
        <div class="info-grid">
          <div class="info-card">
            <h4>TenantCurrencyPipe</h4>
            <ul>
              <li>Usa automáticamente la moneda del tenant</li>
              <li>Formatea según el locale del tenant</li>
              <li>Soporte para diferentes estilos de display</li>
              <li>Configuración automática de decimales por moneda</li>
            </ul>
          </div>

          <div class="info-card">
            <h4>Características Implementadas</h4>
            <ul>
              <li>✅ Formateo automático por tenant</li>
              <li>✅ Separadores de miles según locale</li>
              <li>✅ Símbolos de moneda nativos</li>
              <li>✅ Configuración de decimales por tipo de moneda</li>
              <li>✅ Fallback seguro en caso de error</li>
            </ul>
          </div>

          <div class="info-card">
            <h4>Uso en Componentes</h4>
            <pre><code>{{ codeExamples }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    /* tus estilos tal cual, los dejé igual */
  ],
})
export class CurrencyDemoComponent {
  readonly tenantContext = inject(TenantContextService);

  readonly testPriceControl = new FormControl<number>(29.99, {
    nonNullable: true,
  });

  readonly sampleProducts = signal<CurrencyDemoProduct[]>([
    {
      id: '1',
      name: 'Laptop Gaming Pro',
      price: 1299.99,
      originalPrice: 1499.99,
      stock: 15,
    },
    {
      id: '2',
      name: 'Smartphone Ultra',
      price: 899,
      stock: 8,
    },
    {
      id: '3',
      name: 'Audífonos Inalámbricos',
      price: 249.95,
      originalPrice: 299.95,
      stock: 23,
    },
    {
      id: '4',
      name: 'Monitor 4K',
      price: 599.99,
      stock: 5,
    },
  ]);

  readonly tenantConfigs: TenantCurrencyConfig[] = [
    {
      name: 'Estados Unidos',
      currency: 'USD',
      locale: 'en-US',
      sampleProducts: [
        { id: 'us1', name: 'Laptop', price: 1299.99, stock: 10 },
        { id: 'us2', name: 'Phone', price: 899, stock: 5 },
      ],
    },
    {
      name: 'España',
      currency: 'EUR',
      locale: 'es-ES',
      sampleProducts: [
        { id: 'es1', name: 'Portátil', price: 1199.99, stock: 8 },
        { id: 'es2', name: 'Teléfono', price: 829, stock: 12 },
      ],
    },
    {
      name: 'México',
      currency: 'MXN',
      locale: 'es-MX',
      sampleProducts: [
        { id: 'mx1', name: 'Laptop', price: 25999.99, stock: 6 },
        { id: 'mx2', name: 'Celular', price: 17999, stock: 9 },
      ],
    },
    {
      name: 'Reino Unido',
      currency: 'GBP',
      locale: 'en-GB',
      sampleProducts: [
        { id: 'gb1', name: 'Laptop', price: 999.99, stock: 14 },
        { id: 'gb2', name: 'Mobile', price: 699, stock: 7 },
      ],
    },
    {
      name: 'Japón',
      currency: 'JPY',
      locale: 'ja-JP',
      sampleProducts: [
        { id: 'jp1', name: 'ノートPC', price: 189999, stock: 11 },
        { id: 'jp2', name: 'スマホ', price: 129000, stock: 15 },
      ],
    },
    {
      name: 'Brasil',
      currency: 'BRL',
      locale: 'pt-BR',
      sampleProducts: [
        { id: 'br1', name: 'Notebook', price: 6999.99, stock: 3 },
        { id: 'br2', name: 'Celular', price: 4599, stock: 8 },
      ],
    },
  ];

  /**
   * Formatea un precio para un locale y moneda específicos
   */
  formatPriceForLocale(
    price: number,
    currency: string,
    locale: string
  ): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(price);
    } catch {
      return `${currency} ${price.toLocaleString()}`;
    }
  }

  /**
   * Calcula el porcentaje de descuento
   */
  calculateDiscount(originalPrice: number, currentPrice: number): number {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  /**
   * Ejemplos de código para mostrar en la documentación
   */
  readonly codeExamples = `// En templates
{{ price | tenantCurrency }}
{{ price | tenantCurrency:'symbol-narrow':'1.2-2' }}

// Con ProductCardComponent
<app-product-card [product]="product"></app-product-card>
// Los precios se formatean automáticamente`;
}
