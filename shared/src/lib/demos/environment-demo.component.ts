import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiClientService, AppEnvService } from '@core';

/**
 * Componente de demostración para mostrar el nuevo sistema de configuración de entorno
 * y cómo usar el ApiClientService con diferentes backends
 */
@Component({
  selector: 'app-environment-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="environment-demo">
      <div class="demo-card">
        <h2>🌐 Environment Configuration Demo</h2>

        <!-- Environment Info -->
        <div class="env-section">
          <h3>📊 Current Environment</h3>
          <div class="env-info">
            <div class="info-item">
              <span class="label">Mode:</span>
              <span class="value" [class]="env.isProduction ? 'production' : 'development'">
                {{ env.isProduction ? 'Production' : 'Development' }}
              </span>
            </div>

            <div class="info-item">
              <span class="label">API:</span>
              <span class="value" [class]="env.useMockApi ? 'mock' : 'real'">
                {{ env.useMockApi ? '🔧 Mock API' : '🌐 Real API' }}
              </span>
            </div>

            <div class="info-item">
              <span class="label">Base URL:</span>
              <span class="value url">{{ env.apiBaseUrl }}</span>
            </div>

            <div class="info-item">
              <span class="label">Tenant Headers:</span>
              <span class="value" [class]="env.useTenantHeader ? 'enabled' : 'disabled'">
                {{ env.useTenantHeader ? '✅ Enabled' : '❌ Disabled' }}
              </span>
            </div>

            <div class="info-item">
              <span class="label">Logging:</span>
              <span class="value" [class]="env.isConsoleLoggingEnabled ? 'enabled' : 'disabled'">
                {{ env.isConsoleLoggingEnabled ? '📝 Console Enabled' : '🔇 Console Disabled' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Features -->
        <div class="env-section" *ngIf="env.environment.features">
          <h3>🎛️ Feature Flags</h3>
          <div class="features-grid">
            <div
              *ngFor="let feature of getFeatures()"
              class="feature-item"
              [class.enabled]="feature.enabled"
            >
              <span class="feature-name">{{ feature.name }}</span>
              <span class="feature-status">
                {{ feature.enabled ? '✅' : '❌' }}
              </span>
            </div>
          </div>
        </div>

        <!-- API Test Section -->
        <div class="env-section">
          <h3>🔗 API Connection Test</h3>
          <div class="api-test">
            <button
              (click)="testApiConnection()"
              [disabled]="isLoading()"
              class="test-button"
            >
              {{ isLoading() ? '⏳ Testing...' : '🧪 Test API Connection' }}
            </button>

            <div class="test-result" *ngIf="apiResult()">
              <div class="result-header">
                <span class="status" [class]="apiResult()?.success ? 'success' : 'error'">
                  {{ apiResult()?.success ? '✅ Success' : '❌ Error' }}
                </span>
                <span class="timestamp">{{ apiResult()?.timestamp | date:'HH:mm:ss' }}</span>
              </div>

              <div class="result-details">
                <div><strong>Endpoint:</strong> {{ apiResult()?.endpoint }}</div>
                <div><strong>Duration:</strong> {{ apiResult()?.duration }}ms</div>
                <div *ngIf="apiResult()?.data"><strong>Response:</strong> {{ apiResult()?.data | json }}</div>
                <div *ngIf="apiResult()?.error" class="error"><strong>Error:</strong> {{ apiResult()?.error }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Environment Switch Guide -->
        <div class="env-section">
          <h3>⚡ Quick Environment Switch</h3>
          <div class="switch-guide">
            <div class="command-item">
              <span class="command-label">Development (Mock):</span>
              <code class="command">npm start</code>
            </div>
            <div class="command-item">
              <span class="command-label">Development (Real API):</span>
              <code class="command">npm run start:real</code>
            </div>
            <div class="command-item">
              <span class="command-label">Production:</span>
              <code class="command">npm run build:prod</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .environment-demo {
      padding: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .demo-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border: 1px solid #e5e7eb;
    }

    h2 {
      color: #1f2937;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      font-weight: 600;
    }

    h3 {
      color: #374151;
      margin-bottom: 1rem;
      font-size: 1.125rem;
      font-weight: 500;
    }

    .env-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .env-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .env-info {
      display: grid;
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .label {
      font-weight: 500;
      color: #374151;
      min-width: 120px;
    }

    .value {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.875rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .value.production { background: #fef3c7; color: #d97706; }
    .value.development { background: #dbeafe; color: #2563eb; }
    .value.mock { background: #fce7f3; color: #be185d; }
    .value.real { background: #dcfce7; color: #16a34a; }
    .value.enabled { background: #dcfce7; color: #16a34a; }
    .value.disabled { background: #fee2e2; color: #dc2626; }
    .value.url {
      background: #f3f4f6;
      color: #374151;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .feature-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .feature-item.enabled {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }

    .feature-name {
      font-weight: 500;
      color: #374151;
    }

    .api-test {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .test-button {
      align-self: flex-start;
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .test-button:hover:not(:disabled) {
      background: #2563eb;
    }

    .test-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .test-result {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .status.success { color: #16a34a; font-weight: 600; }
    .status.error { color: #dc2626; font-weight: 600; }

    .timestamp {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .result-details {
      font-size: 0.875rem;
      color: #374151;
    }

    .result-details > div {
      margin-bottom: 0.25rem;
    }

    .result-details .error {
      color: #dc2626;
    }

    .switch-guide {
      display: grid;
      gap: 0.75rem;
    }

    .command-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .command-label {
      min-width: 160px;
      font-weight: 500;
      color: #374151;
    }

    .command {
      background: #1f2937;
      color: #f9fafb;
      padding: 0.375rem 0.75rem;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.875rem;
    }

    @media (max-width: 640px) {
      .environment-demo {
        padding: 1rem;
      }

      .demo-card {
        padding: 1.5rem;
      }

      .command-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .command-label {
        min-width: unset;
      }
    }
  `]
})
export class EnvironmentDemoComponent {
  private readonly envService = inject(AppEnvService);
  private readonly apiClient = inject(ApiClientService);

  // Expose environment service for template
  readonly env = this.envService;

  // Loading state
  readonly isLoading = signal(false);

  // API test result
  readonly apiResult = signal<{
    success: boolean;
    endpoint: string;
    duration: number;
    timestamp: Date;
    data?: unknown;
    error?: string;
  } | null>(null);

  /**
   * Get features as array for template iteration
   */
  getFeatures() {
    const features = this.env.environment.features || {};
    return Object.entries(features).map(([name, enabled]) => ({
      name,
      enabled
    }));
  }

  /**
   * Test API connection based on current environment
   */
  async testApiConnection() {
    this.isLoading.set(true);
    const startTime = performance.now();

    try {
      // Determine test endpoint based on environment
      const testEndpoint = this.env.useMockApi ? '/api/health' : '/health';

      // Make API call with timeout
      const response = await this.apiClient.get(testEndpoint, {}, {
        timeout: 10000,
        enableLogging: true
      }).toPromise();

      const duration = Math.round(performance.now() - startTime);

      this.apiResult.set({
        success: true,
        endpoint: testEndpoint,
        duration,
        timestamp: new Date(),
        data: response
      });

      console.log('✅ API Connection Test Successful', { response, duration });

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.apiResult.set({
        success: false,
        endpoint: this.env.useMockApi ? '/api/health' : '/health',
        duration,
        timestamp: new Date(),
        error: errorMessage
      });

      console.error('❌ API Connection Test Failed', { error, duration });
    } finally {
      this.isLoading.set(false);
    }
  }
}
