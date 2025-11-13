import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantContextService, TenantCurrencyPipe, TenantCurrencySymbolPipe, TenantNumberPipe } from '@pwa/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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
    TenantNumberPipe
  ],
  template: `
    <div class="currency-demo">
      <div class="demo-header">
        <h2>💰 Demo: Monedas y Formatos Multi-tenant</h2>
        <p>Demuestra cómo los precios se adaptan automáticamente según el tenant</p>
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
            <span class="value currency-symbol">{{ '' | tenantCurrencySymbol }}</span>
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
                @for (product of config.sampleProducts.slice(0, 2); track product.id) {
                  <div class="product-price-demo">
                    <span class="product-name">{{ product.name }}</span>
                    <span class="product-price">
                      {{ formatPriceForLocale(product.price, config.currency, config.locale) }}
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
                <span class="result">{{ testPriceControl.value | tenantCurrency }}</span>
              </div>
              <div class="format-item">
                <label>Solo símbolo:</label>
                <span class="result">{{ testPriceControl.value | tenantCurrency:'symbol' }}</span>
              </div>
              <div class="format-item">
                <label>Símbolo compacto:</label>
                <span class="result">{{ testPriceControl.value | tenantCurrency:'symbol-narrow' }}</span>
              </div>
              <div class="format-item">
                <label>Con código:</label>
                <span class="result">{{ testPriceControl.value | tenantCurrency:'code' }}</span>
              </div>
              <div class="format-item">
                <label>Sin decimales:</label>
                <span class="result">{{ testPriceControl.value | tenantCurrency:'symbol':'1.0-0' }}</span>
              </div>
              <div class="format-item">
                <label>3 decimales:</label>
                <span class="result">{{ testPriceControl.value | tenantCurrency:'symbol':'1.3-3' }}</span>
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
                @if (product.originalPrice && product.originalPrice > product.price) {
                  <span class="original-price">
                    {{ product.originalPrice | tenantCurrency }}
                  </span>
                }
                <span class="current-price">
                  {{ product.price | tenantCurrency }}
                </span>

                @if (product.originalPrice && product.originalPrice > product.price) {
                  <span class="discount">
                    {{ calculateDiscount(product.originalPrice, product.price) | tenantNumber:'1.0-0' }}% OFF
                  </span>
                }
              </div>

              <div class="stock-info">
                <span class="stock-count">{{ product.stock | tenantNumber }}</span>
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
            <pre><code>// En templates
{{ price | tenantCurrency }}
{{ price | tenantCurrency:'symbol-narrow':'1.2-2' }}

// Con ProductCardComponent
&lt;app-product-card [product]="product" /&gt;
// Los precios se formatean automáticamente</code></pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .currency-demo {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      font-family: system-ui, sans-serif;
    }

    .demo-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border-radius: 12px;
    }

    .demo-header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
    }

    .demo-header p {
      margin: 0;
      opacity: 0.9;
    }

    .current-tenant-info {
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      border: 1px solid #e2e8f0;
    }

    .current-tenant-info h3 {
      margin: 0 0 1rem 0;
      color: #374151;
    }

    .tenant-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: white;
      border-radius: 4px;
      border: 1px solid #d1d5db;
    }

    .detail-item label {
      font-weight: 600;
      color: #6b7280;
    }

    .detail-item .value {
      font-weight: 500;
      color: #111827;
    }

    .currency-symbol {
      font-size: 1.2em;
      color: #059669 !important;
    }

    .tenant-simulator {
      margin-bottom: 2rem;
    }

    .tenant-simulator h3 {
      color: #374151;
      margin-bottom: 1rem;
    }

    .tenant-configs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .tenant-config-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .tenant-config-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .tenant-config-card h4 {
      margin: 0 0 1rem 0;
      color: #1f2937;
    }

    .config-info {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .config-info .currency {
      background: #dbeafe;
      color: #1e40af;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .config-info .locale {
      background: #f0fdf4;
      color: #166534;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .products-preview {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .product-price-demo {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: #f9fafb;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .product-price-demo .product-name {
      color: #6b7280;
    }

    .product-price-demo .product-price {
      font-weight: 600;
      color: #059669;
    }

    .interactive-test {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .interactive-test h3 {
      margin: 0 0 1rem 0;
      color: #374151;
    }

    .input-section {
      margin-bottom: 1.5rem;
    }

    .input-section label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #374151;
    }

    .input-section input {
      width: 200px;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 1rem;
    }

    .results-section h4 {
      margin: 0 0 1rem 0;
      color: #374151;
    }

    .format-examples {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 0.75rem;
    }

    .format-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 4px;
      border-left: 3px solid #6366f1;
    }

    .format-item label {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .format-item .result {
      font-weight: 600;
      color: #059669;
      font-family: monospace;
    }

    .products-demo {
      margin-bottom: 2rem;
    }

    .products-demo h3 {
      margin-bottom: 1rem;
      color: #374151;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .demo-product-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.25rem;
      transition: transform 0.2s;
    }

    .demo-product-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .demo-product-card h4 {
      margin: 0 0 1rem 0;
      color: #1f2937;
      font-size: 1rem;
    }

    .price-section {
      margin-bottom: 0.75rem;
    }

    .original-price {
      text-decoration: line-through;
      color: #9ca3af;
      font-size: 0.875rem;
      margin-right: 0.5rem;
    }

    .current-price {
      font-weight: 700;
      color: #059669;
      font-size: 1.1rem;
    }

    .discount {
      background: #fee2e2;
      color: #dc2626;
      padding: 0.125rem 0.375rem;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .stock-info {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.875rem;
    }

    .stock-count {
      font-weight: 600;
      color: #374151;
    }

    .stock-label {
      color: #6b7280;
    }

    .technical-info {
      margin-top: 2rem;
    }

    .technical-info h3 {
      margin-bottom: 1rem;
      color: #374151;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .info-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.25rem;
    }

    .info-card h4 {
      margin: 0 0 1rem 0;
      color: #1f2937;
    }

    .info-card ul {
      margin: 0;
      padding-left: 1.25rem;
    }

    .info-card li {
      margin-bottom: 0.5rem;
      color: #4b5563;
    }

    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      overflow-x: auto;
      margin: 0;
    }

    code {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    }
  `]
})
export class CurrencyDemoComponent {
  readonly tenantContext = inject(TenantContextService);

  readonly testPriceControl = new FormControl<number>(29.99, { nonNullable: true });

  readonly sampleProducts = signal<CurrencyDemoProduct[]>([
    {
      id: '1',
      name: 'Laptop Gaming Pro',
      price: 1299.99,
      originalPrice: 1499.99,
      stock: 15
    },
    {
      id: '2',
      name: 'Smartphone Ultra',
      price: 899,
      stock: 8
    },
    {
      id: '3',
      name: 'Audífonos Inalámbricos',
      price: 249.95,
      originalPrice: 299.95,
      stock: 23
    },
    {
      id: '4',
      name: 'Monitor 4K',
      price: 599.99,
      stock: 5
    }
  ]);

  readonly tenantConfigs: TenantCurrencyConfig[] = [
    {
      name: 'Estados Unidos',
      currency: 'USD',
      locale: 'en-US',
      sampleProducts: [
        { id: 'us1', name: 'Laptop', price: 1299.99, stock: 10 },
        { id: 'us2', name: 'Phone', price: 899, stock: 5 }
      ]
    },
    {
      name: 'España',
      currency: 'EUR',
      locale: 'es-ES',
      sampleProducts: [
        { id: 'es1', name: 'Portátil', price: 1199.99, stock: 8 },
        { id: 'es2', name: 'Teléfono', price: 829, stock: 12 }
      ]
    },
    {
      name: 'México',
      currency: 'MXN',
      locale: 'es-MX',
      sampleProducts: [
        { id: 'mx1', name: 'Laptop', price: 25999.99, stock: 6 },
        { id: 'mx2', name: 'Celular', price: 17999, stock: 9 }
      ]
    },
    {
      name: 'Reino Unido',
      currency: 'GBP',
      locale: 'en-GB',
      sampleProducts: [
        { id: 'gb1', name: 'Laptop', price: 999.99, stock: 14 },
        { id: 'gb2', name: 'Mobile', price: 699, stock: 7 }
      ]
    },
    {
      name: 'Japón',
      currency: 'JPY',
      locale: 'ja-JP',
      sampleProducts: [
        { id: 'jp1', name: 'ノートPC', price: 189999, stock: 11 },
        { id: 'jp2', name: 'スマホ', price: 129000, stock: 15 }
      ]
    },
    {
      name: 'Brasil',
      currency: 'BRL',
      locale: 'pt-BR',
      sampleProducts: [
        { id: 'br1', name: 'Notebook', price: 6999.99, stock: 3 },
        { id: 'br2', name: 'Celular', price: 4599, stock: 8 }
      ]
    }
  ];

  /**
   * Formatea un precio para un locale y moneda específicos
   */
  formatPriceForLocale(price: number, currency: string, locale: string): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
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
}
