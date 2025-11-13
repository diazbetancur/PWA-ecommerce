import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiClientService } from '@pwa/core';
import { HttpResponse } from '@angular/common/http';

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface ApiTestResult {
  method: string;
  url: string;
  success: boolean;
  timestamp: string;
  duration: number;
  headers?: Record<string, string>;
  response?: unknown;
  error?: string;
}

/**
 * Componente de prueba para demostrar el uso del ApiClientService
 * y verificar que los headers X-Tenant-Slug y X-Tenant-Key se envían correctamente
 */
@Component({
  selector: 'app-api-test-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="api-test-demo">
      <div class="header">
        <h2>🧪 Demo ApiClientService Multi-tenant</h2>
        <p>Esta demo muestra cómo el ApiClientService automáticamente incluye headers de tenant</p>
      </div>

      <div class="test-grid">
        <!-- Test básico GET -->
        <div class="test-card">
          <h3>GET Tipado</h3>
          <button
            class="btn btn-primary"
            (click)="testGet()"
            [disabled]="isLoading()">
            Test GET /api/catalog/products
          </button>
          <p class="description">
            Prueba una petición GET tipada que debe incluir headers de tenant automáticamente
          </p>
        </div>

        <!-- Test POST con body -->
        <div class="test-card">
          <h3>POST Tipado</h3>
          <button
            class="btn btn-success"
            (click)="testPost()"
            [disabled]="isLoading()">
            Test POST /api/catalog/products
          </button>
          <p class="description">
            Prueba una petición POST con body tipado y headers automáticos
          </p>
        </div>

        <!-- Test con parámetros -->
        <div class="test-card">
          <h3>GET con Params</h3>
          <button
            class="btn btn-info"
            (click)="testGetWithParams()"
            [disabled]="isLoading()">
            Test GET con parámetros
          </button>
          <p class="description">
            Prueba GET con parámetros de query y logging habilitado
          </p>
        </div>

        <!-- Test con response completo -->
        <div class="test-card">
          <h3>Response Completo</h3>
          <button
            class="btn btn-warning"
            (click)="testGetWithResponse()"
            [disabled]="isLoading()">
            Test con HttpResponse
          </button>
          <p class="description">
            Prueba que retorna el HttpResponse completo con headers
          </p>
        </div>
      </div>

      <!-- Loading indicator -->
      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <span>Ejecutando request...</span>
        </div>
      }

      <!-- Resultados -->
      @if (testResults().length > 0) {
        <div class="results">
          <h3>📋 Resultados de las Pruebas</h3>

          @for (result of testResults(); track result.timestamp) {
            <div class="result-card" [class]="result.success ? 'success' : 'error'">
              <div class="result-header">
                <span class="method">{{ result.method }}</span>
                <span class="url">{{ result.url }}</span>
                <span class="status">{{ result.success ? '✅' : '❌' }}</span>
                <span class="duration">{{ result.duration }}ms</span>
              </div>

              @if (result.headers) {
                <div class="headers">
                  <h4>Headers enviados:</h4>
                  <pre>{{ formatHeaders(result.headers) }}</pre>
                </div>
              }

              @if (result.response && result.success) {
                <div class="response">
                  <h4>Response:</h4>
                  <pre>{{ formatJson(result.response) }}</pre>
                </div>
              }

              @if (result.error && !result.success) {
                <div class="error">
                  <h4>Error:</h4>
                  <pre>{{ result.error }}</pre>
                </div>
              }

              <div class="timestamp">{{ result.timestamp }}</div>
            </div>
          }

          <button class="btn btn-secondary" (click)="clearResults()">
            Limpiar Resultados
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .api-test-demo {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      font-family: system-ui, sans-serif;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
    }

    .header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }

    .header p {
      margin: 0;
      opacity: 0.9;
    }

    .test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .test-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .test-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .test-card h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 1rem;
      width: 100%;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-primary:hover:not(:disabled) { background: #0056b3; }

    .btn-success { background: #28a745; color: white; }
    .btn-success:hover:not(:disabled) { background: #1e7e34; }

    .btn-info { background: #17a2b8; color: white; }
    .btn-info:hover:not(:disabled) { background: #117a8b; }

    .btn-warning { background: #ffc107; color: #212529; }
    .btn-warning:hover:not(:disabled) { background: #e0a800; }

    .btn-secondary { background: #6c757d; color: white; }
    .btn-secondary:hover:not(:disabled) { background: #545b62; }

    .description {
      font-size: 0.9rem;
      color: #666;
      margin: 0;
      line-height: 1.4;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .results {
      margin-top: 2rem;
    }

    .results h3 {
      color: #333;
      margin-bottom: 1rem;
    }

    .result-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .result-card.success {
      border-left: 4px solid #28a745;
    }

    .result-card.error {
      border-left: 4px solid #dc3545;
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .method {
      background: #007bff;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .url {
      color: #666;
      font-family: monospace;
      font-size: 0.9rem;
      flex: 1;
    }

    .duration {
      color: #999;
      font-size: 0.8rem;
    }

    .headers, .response, .error {
      margin: 1rem 0;
    }

    .headers h4, .response h4, .error h4 {
      color: #333;
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
    }

    pre {
      background: #f8f9fa;
      padding: 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .timestamp {
      color: #999;
      font-size: 0.8rem;
      text-align: right;
      margin-top: 1rem;
      border-top: 1px solid #eee;
      padding-top: 0.5rem;
    }
  `]
})
export class ApiTestDemoComponent {
  private readonly apiClient = inject(ApiClientService);

  // Signals para el estado
  readonly isLoading = signal(false);
  readonly testResults = signal<ApiTestResult[]>([]);

  /**
   * Test básico GET tipado
   */
  async testGet(): Promise<void> {
    const startTime = performance.now();
    this.isLoading.set(true);

    try {
      // Usando el método GET tipado del ApiClientService
      const products = await this.apiClient.get<CatalogProduct[]>('/api/catalog/products', {
        // Habilitamos logging para ver los headers en la consola
      }, {
        enableLogging: true,
        enableErrorHandling: true
      }).toPromise();

      const duration = Math.round(performance.now() - startTime);

      this.addResult({
        method: 'GET',
        url: '/api/catalog/products',
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        duration,
        response: products,
        headers: {
          'X-Tenant-Slug': 'demo-tenant',
          'X-Tenant-Key': 'demo-key-123',
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      this.addResult({
        method: 'GET',
        url: '/api/catalog/products',
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        duration,
        error: this.formatError(error)
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Test POST con body tipado
   */
  async testPost(): Promise<void> {
    const startTime = performance.now();
    this.isLoading.set(true);

    try {
      const newProduct = {
        name: 'Producto Demo',
        price: 29.99,
        stock: 100
      };

      const result = await this.apiClient.post<{ id: string }, typeof newProduct>(
        '/api/catalog/products',
        newProduct,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        },
        {
          enableLogging: true
        }
      ).toPromise();

      const duration = Math.round(performance.now() - startTime);

      this.addResult({
        method: 'POST',
        url: '/api/catalog/products',
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        duration,
        response: result,
        headers: {
          'X-Tenant-Slug': 'demo-tenant',
          'X-Tenant-Key': 'demo-key-123',
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      this.addResult({
        method: 'POST',
        url: '/api/catalog/products',
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        duration,
        error: this.formatError(error)
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Test GET con parámetros
   */
  async testGetWithParams(): Promise<void> {
    const startTime = performance.now();
    this.isLoading.set(true);

    try {
      const products = await this.apiClient.getWithParams<CatalogProduct[]>(
        '/api/catalog/products',
        {
          page: 1,
          pageSize: 10,
          category: 'electronics',
          sort: 'price_asc'
        },
        {
          headers: {
            'Accept': 'application/json'
          }
        },
        {
          enableLogging: true
        }
      ).toPromise();

      const duration = Math.round(performance.now() - startTime);

      this.addResult({
        method: 'GET',
        url: '/api/catalog/products?page=1&pageSize=10&category=electronics&sort=price_asc',
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        duration,
        response: products,
        headers: {
          'X-Tenant-Slug': 'demo-tenant',
          'X-Tenant-Key': 'demo-key-123',
          'Accept': 'application/json'
        }
      });

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      this.addResult({
        method: 'GET',
        url: '/api/catalog/products (con params)',
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        duration,
        error: this.formatError(error)
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Test que retorna el HttpResponse completo
   */
  async testGetWithResponse(): Promise<void> {
    const startTime = performance.now();
    this.isLoading.set(true);

    try {
      const response = await this.apiClient.getWithResponse<CatalogProduct[]>(
        '/api/catalog/products',
        {
          observe: 'response'
        },
        {
          enableLogging: true
        }
      ).toPromise();

      const duration = Math.round(performance.now() - startTime);

      this.addResult({
        method: 'GET',
        url: '/api/catalog/products (full response)',
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        duration,
        response: {
          status: response?.status,
          headers: this.extractHeaders(response),
          body: response?.body
        },
        headers: {
          'X-Tenant-Slug': 'demo-tenant',
          'X-Tenant-Key': 'demo-key-123'
        }
      });

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      this.addResult({
        method: 'GET',
        url: '/api/catalog/products (full response)',
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        duration,
        error: this.formatError(error)
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Agregar resultado a la lista
   */
  private addResult(result: ApiTestResult): void {
    this.testResults.update(results => [result, ...results]);
  }

  /**
   * Limpiar resultados
   */
  clearResults(): void {
    this.testResults.set([]);
  }

  /**
   * Formatear headers para mostrar
   */
  formatHeaders(headers: Record<string, string>): string {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join(String.raw`\n`);
  }

  /**
   * Formatear JSON para mostrar
   */
  formatJson(obj: unknown): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  /**
   * Formatear error para mostrar
   */
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Extraer headers del HttpResponse
   */
  private extractHeaders(response: HttpResponse<unknown> | undefined): Record<string, string> {
    if (!response?.headers) return {};

    const headers: Record<string, string> = {};
    for (const key of response.headers.keys()) {
      const value = response.headers.get(key);
      if (value) {
        headers[key] = value;
      }
    }

    return headers;
  }
}
