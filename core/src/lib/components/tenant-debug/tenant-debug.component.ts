import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TenantBootstrapService, TenantContextService, ApiClientService } from '@pwa/core';

interface ApiTestResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
  duration: number;
  headers?: Record<string, string>;
  status?: number;
}

@Component({
  selector: 'app-tenant-debug',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="tenant-debug-container">
      <!-- Header -->
      <div class="debug-header">
        <div class="container">
          <h1 class="debug-title">
            🔧 Tenant Debug Panel
            @if (tenantSlug(); as slug) {
              <span class="tenant-badge">{{ slug }}</span>
            }
          </h1>

          <div class="debug-actions">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="refreshTenantInfo()"
              [disabled]="isRefreshing()"
            >
              @if (isRefreshing()) {
                <span class="loading-spinner"></span>
                Actualizando...
              } @else {
                🔄 Refresh
              }
            </button>

            <a routerLink="/" class="btn btn-outline">
              ← Volver a App
            </a>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="debug-grid">
          <!-- Tenant Information Panel -->
          <div class="debug-card">
            <h2 class="card-title">
              📋 Información del Tenant
              <span class="status-indicator" [class]="tenantStatusClass()">
                {{ tenantStatus() }}
              </span>
            </h2>

            <div class="info-section">
              <div class="info-group">
                <h3>Identificación</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Slug:</label>
                    <code>{{ tenantSlug() || 'N/A' }}</code>
                  </div>
                  <div class="info-item">
                    <label>Key/ID:</label>
                    <code>{{ tenantKey() || 'N/A' }}</code>
                  </div>
                  <div class="info-item">
                    <label>Display Name:</label>
                    <span>{{ displayName() || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Status:</label>
                    <span class="status-badge" [class]="tenantStatusClass()">
                      {{ tenantStatus() }}
                    </span>
                  </div>
                </div>
              </div>

              @if (tenantConfig(); as config) {
                <!-- Branding Information -->
                <div class="info-group">
                  <h3>Branding</h3>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Logo URL:</label>
                      @if (config.tenant.branding?.logoUrl; as logoUrl) {
                        <div class="logo-preview">
                          <img [src]="logoUrl" alt="Logo" class="logo-img" loading="lazy" />
                          <code class="logo-url">{{ logoUrl }}</code>
                        </div>
                      } @else {
                        <code>No logo configured</code>
                      }
                    </div>

                    @if (config.tenant.branding; as branding) {
                      <div class="info-item">
                        <label>Primary Color:</label>
                        <div class="color-preview">
                          <div class="color-swatch" [style.backgroundColor]="branding.primaryColor"></div>
                          <code>{{ branding.primaryColor }}</code>
                        </div>
                      </div>
                      <div class="info-item">
                        <label>Secondary Color:</label>
                        <div class="color-preview">
                          <div class="color-swatch" [style.backgroundColor]="branding.secondaryColor"></div>
                          <code>{{ branding.secondaryColor || 'N/A' }}</code>
                        </div>
                      </div>
                      <div class="info-item">
                        <label>Accent Color:</label>
                        <div class="color-preview">
                          <div class="color-swatch" [style.backgroundColor]="branding.accentColor"></div>
                          <code>{{ branding.accentColor || 'N/A' }}</code>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Configuration Details -->
                <div class="info-group">
                  <h3>Configuración</h3>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Locale:</label>
                      <code>{{ config.locale }}</code>
                    </div>
                    <div class="info-item">
                      <label>Currency:</label>
                      <code>{{ config.currency }}</code>
                    </div>
                    <div class="info-item">
                      <label>CDN Base URL:</label>
                      <code>{{ config.cdnBaseUrl || 'N/A' }}</code>
                    </div>
                  </div>
                </div>

                <!-- Features -->
                @if (config.features && Object.keys(config.features).length > 0) {
                  <div class="info-group">
                    <h3>Features Habilitadas</h3>
                    <div class="features-grid">
                      @for (feature of Object.entries(config.features); track feature[0]) {
                        <div class="feature-item" [class.enabled]="feature[1]">
                          <span class="feature-name">{{ feature[0] }}</span>
                          <span class="feature-status">{{ feature[1] ? '✅' : '❌' }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <!-- API Testing Panel -->
          <div class="debug-card">
            <h2 class="card-title">🧪 API Testing</h2>

            <div class="api-test-section">
              <div class="test-form">
                <div class="form-group">
                  <label for="api-endpoint">Endpoint:</label>
                  <div class="input-with-button">
                    <select
                      id="api-endpoint"
                      [(ngModel)]="selectedEndpoint"
                      class="endpoint-select"
                    >
                      <option value="/api/catalog/products">GET /api/catalog/products</option>
                      <option value="/api/catalog/categories">GET /api/catalog/categories</option>
                      <option value="/api/public/health">GET /api/public/health</option>
                      <option value="custom">Custom endpoint...</option>
                    </select>

                    @if (selectedEndpoint() === 'custom') {
                      <input
                        type="text"
                        [(ngModel)]="customEndpoint"
                        placeholder="/api/custom/endpoint"
                        class="custom-endpoint-input"
                      />
                    }
                  </div>
                </div>

                <button
                  type="button"
                  class="btn btn-primary test-button"
                  (click)="runApiTest()"
                  [disabled]="isTestRunning()"
                >
                  @if (isTestRunning()) {
                    <span class="loading-spinner"></span>
                    Ejecutando Test...
                  } @else {
                    🚀 Ejecutar Test
                  }
                </button>
              </div>

              <!-- Headers Preview -->
              <div class="headers-preview">
                <h4>Headers que se enviarán:</h4>
                <div class="headers-list">
                  <div class="header-item">
                    <code>X-Tenant-Slug: {{ tenantSlug() || 'null' }}</code>
                  </div>
                  <div class="header-item">
                    <code>X-Tenant-Key: {{ tenantKey() || 'null' }}</code>
                  </div>
                  <div class="header-item">
                    <code>Content-Type: application/json</code>
                  </div>
                </div>
              </div>

              <!-- Test Results -->
              @if (lastTestResult(); as result) {
                <div class="test-results">
                  <h4>
                    Resultado del Test
                    <span class="result-badge" [class]="result.success ? 'success' : 'error'">
                      {{ result.success ? '✅ Success' : '❌ Error' }}
                    </span>
                    <small class="test-timestamp">
                      {{ result.timestamp | date:'medium' }}
                      ({{ result.duration }}ms)
                    </small>
                  </h4>

                  @if (result.status) {
                    <div class="status-info">
                      <strong>HTTP Status:</strong>
                      <code [class]="getStatusClass(result.status)">{{ result.status }}</code>
                    </div>
                  }

                  @if (result.headers) {
                    <details class="response-headers">
                      <summary>Response Headers</summary>
                      <pre>{{ formatHeaders(result.headers) }}</pre>
                    </details>
                  }

                  <div class="response-data">
                    <h5>Response Data:</h5>
                    @if (result.success && result.data) {
                      <pre class="json-response success">{{ formatJson(result.data) }}</pre>
                    } @else if (result.error) {
                      <pre class="json-response error">{{ result.error }}</pre>
                    }
                  </div>
                </div>
              }

              <!-- Test History -->
              @if (testHistory().length > 0) {
                <div class="test-history">
                  <h4>Historial de Tests (últimos 5)</h4>
                  <div class="history-list">
                    @for (test of testHistory().slice(-5).reverse(); track test.timestamp) {
                      <div class="history-item" [class]="test.success ? 'success' : 'error'">
                        <div class="history-header">
                          <span class="history-endpoint">{{ getEndpointFromTest(test) }}</span>
                          <span class="history-status">{{ test.success ? '✅' : '❌' }}</span>
                          <span class="history-time">{{ test.timestamp | date:'shortTime' }}</span>
                        </div>
                        @if (!test.success) {
                          <div class="history-error">{{ test.error }}</div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Raw Configuration -->
          <div class="debug-card full-width">
            <h2 class="card-title">⚙️ Configuración Completa (Raw JSON)</h2>

            <div class="json-viewer">
              @if (tenantConfig(); as config) {
                <pre class="json-content">{{ formatJson(config) }}</pre>
              } @else {
                <div class="no-data">No hay configuración de tenant disponible</div>
              }
            </div>

            <div class="json-actions">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="copyToClipboard(formatJson(tenantConfig()))"
              >
                📋 Copiar JSON
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                (click)="downloadJson()"
              >
                💾 Descargar JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tenant-debug-container {
      min-height: 100vh;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .debug-header {
      background: white;
      border-bottom: 2px solid #e5e7eb;
      padding: 2rem 0;
      margin-bottom: 2rem;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .debug-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .tenant-badge {
      background: #3b82f6;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .debug-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .debug-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 1024px) {
      .debug-grid {
        grid-template-columns: 1fr 1fr;
      }

      .full-width {
        grid-column: 1 / -1;
      }
    }

    .debug-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      padding: 2rem;
      border: 1px solid #e5e7eb;
    }

    .card-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 2rem 0;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .status-indicator {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-indicator.loading {
      background: #fef3c7;
      color: #92400e;
    }

    .status-indicator.ok {
      background: #d1fae5;
      color: #065f46;
    }

    .status-indicator.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .info-group h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #f3f4f6;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-item label {
      font-weight: 600;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .info-item code {
      background: #f3f4f6;
      padding: 0.5rem;
      border-radius: 0.375rem;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.875rem;
      word-break: break-all;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.loading {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.ok {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .logo-preview {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .logo-img {
      max-width: 120px;
      max-height: 40px;
      object-fit: contain;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 0.5rem;
      background: white;
    }

    .logo-url {
      word-break: break-all;
    }

    .color-preview {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .color-swatch {
      width: 2rem;
      height: 2rem;
      border-radius: 0.375rem;
      border: 2px solid #e5e7eb;
      flex-shrink: 0;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.5rem;
    }

    .feature-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-radius: 0.375rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }

    .feature-item.enabled {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .feature-name {
      font-weight: 500;
      color: #374151;
    }

    /* API Testing Styles */
    .test-form {
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .input-with-button {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .endpoint-select,
    .custom-endpoint-input {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.875rem;
    }

    .endpoint-select {
      flex: 1;
      min-width: 200px;
    }

    .custom-endpoint-input {
      flex: 1;
      min-width: 250px;
    }

    .test-button {
      width: 100%;
      justify-content: center;
    }

    .headers-preview {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 2rem;
    }

    .headers-preview h4 {
      margin: 0 0 0.75rem 0;
      color: #374151;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .headers-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .header-item code {
      background: #1f2937;
      color: #f9fafb;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .test-results {
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .test-results h4 {
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .result-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .result-badge.success {
      background: #d1fae5;
      color: #065f46;
    }

    .result-badge.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .test-timestamp {
      color: #6b7280;
      font-weight: normal;
    }

    .status-info {
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .status-info code {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: 600;
    }

    .status-info code.status-2xx {
      background: #d1fae5;
      color: #065f46;
    }

    .status-info code.status-4xx {
      background: #fef3c7;
      color: #92400e;
    }

    .status-info code.status-5xx {
      background: #fee2e2;
      color: #991b1b;
    }

    .response-headers {
      margin-bottom: 1rem;
    }

    .response-headers summary {
      cursor: pointer;
      font-weight: 600;
      color: #374151;
      padding: 0.5rem;
      background: #f9fafb;
      border-radius: 0.25rem;
    }

    .response-data h5 {
      margin: 0 0 0.5rem 0;
      color: #374151;
      font-weight: 600;
    }

    .json-response {
      background: #1f2937;
      color: #f9fafb;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      max-height: 400px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .json-response.success {
      border-left: 4px solid #10b981;
    }

    .json-response.error {
      border-left: 4px solid #ef4444;
      background: #7f1d1d;
      color: #fecaca;
    }

    /* Test History */
    .test-history {
      border-top: 1px solid #e5e7eb;
      padding-top: 1.5rem;
    }

    .test-history h4 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-weight: 600;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .history-item {
      padding: 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #e5e7eb;
    }

    .history-item.success {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .history-item.error {
      background: #fef2f2;
      border-color: #fecaca;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .history-endpoint {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .history-time {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .history-error {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #dc2626;
      font-family: 'Monaco', 'Consolas', monospace;
    }

    /* JSON Viewer */
    .json-viewer {
      background: #1f2937;
      border-radius: 0.5rem;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .json-content {
      background: #1f2937;
      color: #f9fafb;
      padding: 2rem;
      margin: 0;
      overflow-x: auto;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 500px;
    }

    .no-data {
      padding: 2rem;
      text-align: center;
      color: #6b7280;
      font-style: italic;
    }

    .json-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      border: 1px solid transparent;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
      border-color: #6b7280;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
      border-color: #4b5563;
    }

    .btn-outline {
      background: transparent;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-outline:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .loading-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .debug-title {
        font-size: 1.5rem;
      }

      .debug-actions {
        flex-direction: column;
      }

      .debug-card {
        padding: 1.5rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .history-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class TenantDebugComponent {
  private readonly tenantBootstrap = inject(TenantBootstrapService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly apiClient = inject(ApiClientService);

  // Reactive state
  selectedEndpoint = signal('/api/catalog/products');
  customEndpoint = signal('');
  isTestRunning = signal(false);
  isRefreshing = signal(false);
  lastTestResult = signal<ApiTestResult | null>(null);
  testHistory = signal<ApiTestResult[]>([]);

  // Computed properties from tenant context
  tenantConfig = computed(() => this.tenantContext.getCurrentTenantConfig());
  tenantSlug = computed(() => this.tenantContext.getTenantSlug());
  tenantKey = computed(() => this.tenantContext.getTenantKey());
  tenantStatus = computed(() => this.tenantBootstrap.tenantStatus());
  displayName = computed(() => this.tenantContext.getCurrentTenant()?.displayName);

  tenantStatusClass = computed(() => {
    const status = this.tenantStatus();
    return {
      'loading': status === 'loading',
      'ok': status === 'ok',
      'error': status === 'error'
    };
  });

  /**
   * Refresh tenant information
   */
  async refreshTenantInfo(): Promise<void> {
    this.isRefreshing.set(true);

    try {
      await this.tenantBootstrap.initialize();
      console.log('✅ Tenant info refreshed');
    } catch (error) {
      console.error('❌ Error refreshing tenant info:', error);
    } finally {
      this.isRefreshing.set(false);
    }
  }

  /**
   * Execute API test
   */
  async runApiTest(): Promise<void> {
    const endpoint = this.selectedEndpoint() === 'custom'
      ? this.customEndpoint()
      : this.selectedEndpoint();

    if (!endpoint.trim()) {
      alert('Por favor ingresa un endpoint válido');
      return;
    }

    this.isTestRunning.set(true);
    const startTime = Date.now();

    try {
      console.log(`🧪 Testing API endpoint: ${endpoint}`);

      const response = await this.apiClient.get(endpoint).toPromise();
      const duration = Date.now() - startTime;

      const result: ApiTestResult = {
        success: true,
        data: response,
        timestamp: new Date(),
        duration,
        headers: {
          'X-Tenant-Slug': this.tenantSlug() || '',
          'X-Tenant-Key': this.tenantKey() || '',
          'Content-Type': 'application/json'
        },
        status: 200
      };

      this.lastTestResult.set(result);
      this.addToHistory(result);

      console.log('✅ API test successful:', result);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      const result: ApiTestResult = {
        success: false,
        error: this.formatError(error),
        timestamp: new Date(),
        duration,
        status: error?.status || 0
      };

      this.lastTestResult.set(result);
      this.addToHistory(result);

      console.error('❌ API test failed:', result);
    } finally {
      this.isTestRunning.set(false);
    }
  }

  /**
   * Add test result to history
   */
  private addToHistory(result: ApiTestResult): void {
    const history = [...this.testHistory(), result];
    // Keep only last 10 results
    if (history.length > 10) {
      history.shift();
    }
    this.testHistory.set(history);
  }

  /**
   * Format error for display
   */
  private formatError(error: any): string {
    if (error?.error?.message) {
      return `${error.status} ${error.statusText}: ${error.error.message}`;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return JSON.stringify(error, null, 2);
  }

  /**
   * Format JSON for display
   */
  formatJson(data: any): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }

  /**
   * Format headers for display
   */
  formatHeaders(headers: Record<string, string>): string {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  /**
   * Get CSS class for HTTP status
   */
  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    if (status >= 500) return 'status-5xx';
    return '';
  }

  /**
   * Get endpoint from test result
   */
  getEndpointFromTest(test: ApiTestResult): string {
    // Extract endpoint from test metadata or use a default
    return this.selectedEndpoint() === 'custom'
      ? this.customEndpoint()
      : this.selectedEndpoint();
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      alert('📋 JSON copiado al portapapeles');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      // eslint-disable-next-line deprecation/deprecation
      document.execCommand('copy');
      textArea.remove();
      alert('📋 JSON copiado al portapapeles');
    }
  }

  /**
   * Download configuration as JSON file
   */
  downloadJson(): void {
    const config = this.tenantConfig();
    if (!config) {
      alert('No hay configuración disponible para descargar');
      return;
    }

    const jsonString = this.formatJson(config);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `tenant-config-${this.tenantSlug() || 'unknown'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Utility method to get Object.entries for template
   */
  Object = Object;
}
