import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiClientService } from '@core/services/api-client.service';
import { CatalogService, type Product, type ProductFilters } from '../services/catalog-example.service';

/**
 * Componente de demostración que muestra el uso correcto del ApiClientService
 * - Ejemplos de diferentes tipos de requests
 * - Manejo de errores
 * - Estados de loading
 * - Uso de servicios tipados
 */
@Component({
  selector: 'app-api-usage-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="api-demo">
      <div class="demo-header">
        <h2>🔗 ApiClientService Usage Demo</h2>
        <p>Demostración del uso correcto del ApiClientService con paths relativos</p>
      </div>

      <!-- Client Info -->
      <div class="demo-section">
        <h3>📊 Client Configuration</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Base URL:</label>
            <span class="url">{{ clientInfo().baseUrl }}</span>
          </div>
          <div class="info-item">
            <label>Mock API:</label>
            <span [class]="clientInfo().mockApi ? 'mock' : 'real'">
              {{ clientInfo().mockApi ? '🔧 Mock' : '🌐 Real' }}
            </span>
          </div>
          <div class="info-item">
            <label>Environment:</label>
            <span [class]="clientInfo().environment">{{ clientInfo().environment }}</span>
          </div>
          <div class="info-item">
            <label>Logging:</label>
            <span [class]="clientInfo().loggingEnabled ? 'enabled' : 'disabled'">
              {{ clientInfo().loggingEnabled ? '✅ Enabled' : '❌ Disabled' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Health Check -->
      <div class="demo-section">
        <h3>🏥 Health Check</h3>
        <button
          (click)="performHealthCheck()"
          [disabled]="healthLoading()"
          class="action-button"
        >
          {{ healthLoading() ? '⏳ Checking...' : '🧪 Check API Health' }}
        </button>

        <div *ngIf="healthResult()" class="result-card">
          <div class="result-header">
            <span [class]="healthResult()?.success ? 'success' : 'error'">
              {{ healthResult()?.success ? '✅ Healthy' : '❌ Unhealthy' }}
            </span>
            <span class="timestamp">{{ healthResult()?.timestamp | date:'HH:mm:ss' }}</span>
          </div>

          <div class="result-content">
            <div><strong>Path:</strong> <code>{{ healthResult()?.path }}</code></div>
            <div><strong>Full URL:</strong> <code>{{ healthResult()?.fullUrl }}</code></div>
            <div><strong>Duration:</strong> {{ healthResult()?.duration }}ms</div>
            <div *ngIf="healthResult()?.data" class="data">
              <strong>Response:</strong>
              <pre>{{ healthResult()?.data | json }}</pre>
            </div>
            <div *ngIf="healthResult()?.error" class="error">
              <strong>Error:</strong> {{ healthResult()?.error }}
            </div>
          </div>
        </div>
      </div>

      <!-- Catalog Demo -->
      <div class="demo-section">
        <h3>📦 Catalog Service Demo</h3>

        <!-- Filters -->
        <div class="filters">
          <div class="filter-group">
            <label for="search">Search:</label>
            <input
              id="search"
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search products..."
              class="filter-input"
            >
          </div>

          <div class="filter-group">
            <label for="category">Category:</label>
            <select id="category" [(ngModel)]="selectedCategory" class="filter-select">
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
            </select>
          </div>

          <div class="filter-group">
            <label>
              <input type="checkbox" [(ngModel)]="onlyInStock">
              Only in stock
            </label>
          </div>
        </div>

        <button
          (click)="searchProducts()"
          [disabled]="catalogService.isLoading()"
          class="action-button"
        >
          {{ catalogService.isLoading() ? '⏳ Loading...' : '🔍 Search Products' }}
        </button>

        <!-- Results -->
        <div *ngIf="catalogService.error()" class="error-message">
          ❌ {{ catalogService.error() }}
        </div>

        <div *ngIf="products().length > 0" class="products-grid">
          <div *ngFor="let product of products()" class="product-card">
            <div class="product-header">
              <h4>{{ product.name }}</h4>
              <span class="price">${{ product.price }}</span>
            </div>
            <p class="description">{{ product.description }}</p>
            <div class="product-meta">
              <span class="stock" [class]="product.inStock ? 'in-stock' : 'out-stock'">
                {{ product.inStock ? '✅ In Stock' : '❌ Out of Stock' }}
              </span>
              <div class="tags">
                <span *ngFor="let tag of product.tags" class="tag">{{ tag }}</span>
              </div>
            </div>
            <button
              (click)="getProductDetails(product.id)"
              class="details-button"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      <!-- Advanced Examples -->
      <div class="demo-section">
        <h3>🚀 Advanced API Examples</h3>

        <div class="examples-grid">
          <div class="example-card">
            <h4>🎯 Direct API Calls</h4>
            <p>Direct usage of ApiClientService methods</p>
            <button (click)="testDirectApiCalls()" class="example-button">
              Test Direct Calls
            </button>
          </div>

          <div class="example-card">
            <h4>⚡ Timeout Handling</h4>
            <p>Custom timeout configurations</p>
            <button (click)="testTimeoutHandling()" class="example-button">
              Test Timeouts
            </button>
          </div>

          <div class="example-card">
            <h4>🔒 Admin Endpoints</h4>
            <p>Admin-only API endpoints</p>
            <button (click)="testAdminEndpoints()" class="example-button">
              Test Admin APIs
            </button>
          </div>

          <div class="example-card">
            <h4>📈 Catalog Stats</h4>
            <p>Catalog statistics and metrics</p>
            <button (click)="getCatalogStats()" class="example-button">
              Get Stats
            </button>
          </div>
        </div>

        <div *ngIf="exampleResult()" class="result-card">
          <h4>{{ exampleResult()?.title }}</h4>
          <pre class="example-result">{{ exampleResult()?.data | json }}</pre>
        </div>
      </div>

      <!-- URL Construction Demo -->
      <div class="demo-section">
        <h3>🔗 URL Construction Demo</h3>
        <p>Shows how relative paths are converted to full URLs:</p>

        <div class="url-examples">
          <div *ngFor="let example of urlExamples" class="url-example">
            <div class="relative-path">
              <strong>Relative Path:</strong> <code>{{ example.path }}</code>
            </div>
            <div class="full-url">
              <strong>Full URL:</strong> <code>{{ example.fullUrl }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .api-demo {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .demo-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
    }

    .demo-header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
    }

    .demo-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #667eea;
    }

    .demo-section h3 {
      color: #2d3748;
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem;
      background: #f7fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .info-item label {
      font-weight: 500;
      color: #4a5568;
    }

    .url { color: #2b6cb0; font-family: monospace; }
    .mock { color: #d69e2e; }
    .real { color: #38a169; }
    .production { color: #e53e3e; }
    .development { color: #3182ce; }
    .enabled { color: #38a169; }
    .disabled { color: #a0aec0; }

    .action-button {
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-button:hover:not(:disabled) {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .action-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .result-card {
      margin-top: 1rem;
      padding: 1rem;
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      font-weight: 500;
    }

    .success { color: #38a169; }
    .error { color: #e53e3e; }

    .timestamp {
      color: #718096;
      font-size: 0.875rem;
    }

    .result-content div {
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .data pre, .example-result {
      background: #2d3748;
      color: #f7fafc;
      padding: 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
      overflow-x: auto;
      margin-top: 0.5rem;
    }

    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f7fafc;
      border-radius: 6px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .filter-input, .filter-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .product-card {
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.5rem;
    }

    .product-header h4 {
      margin: 0;
      color: #2d3748;
      font-size: 1rem;
    }

    .price {
      font-weight: 600;
      color: #38a169;
      font-size: 1.1rem;
    }

    .description {
      color: #718096;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .product-meta {
      margin-bottom: 0.75rem;
    }

    .stock {
      font-size: 0.8rem;
      font-weight: 500;
    }

    .in-stock { color: #38a169; }
    .out-stock { color: #e53e3e; }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }

    .tag {
      padding: 0.25rem 0.5rem;
      background: #edf2f7;
      color: #4a5568;
      font-size: 0.75rem;
      border-radius: 12px;
    }

    .details-button {
      width: 100%;
      padding: 0.5rem;
      background: #f7fafc;
      color: #4a5568;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .details-button:hover {
      background: #edf2f7;
    }

    .examples-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .example-card {
      padding: 1rem;
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      text-align: center;
    }

    .example-card h4 {
      margin: 0 0 0.5rem 0;
      color: #2d3748;
    }

    .example-card p {
      color: #718096;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .example-button {
      padding: 0.5rem 1rem;
      background: #4299e1;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .example-button:hover {
      background: #3182ce;
    }

    .error-message {
      color: #e53e3e;
      padding: 0.75rem;
      background: #fed7d7;
      border-radius: 4px;
      margin: 1rem 0;
    }

    .url-examples {
      display: grid;
      gap: 0.75rem;
    }

    .url-example {
      padding: 0.75rem;
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .relative-path, .full-url {
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    .relative-path code, .full-url code {
      background: #edf2f7;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      font-family: monospace;
    }

    @media (max-width: 768px) {
      .api-demo {
        padding: 1rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .filters {
        grid-template-columns: 1fr;
      }

      .products-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ApiUsageDemoComponent implements OnInit {
  private readonly apiClient = inject(ApiClientService);
  readonly catalogService = inject(CatalogService);

  // Signals for reactive state
  readonly healthLoading = signal(false);
  readonly healthResult = signal<{
    success: boolean;
    path: string;
    fullUrl: string;
    duration: number;
    timestamp: Date;
    data?: unknown;
    error?: string;
  } | null>(null);

  readonly products = signal<Product[]>([]);
  readonly exampleResult = signal<{ title: string; data: unknown } | null>(null);
  readonly clientInfo = signal(this.apiClient.getClientInfo());

  // Form state
  searchQuery = '';
  selectedCategory = '';
  onlyInStock = false;

  // URL examples
  readonly urlExamples = [
    { path: '/api/catalog/products', fullUrl: this.apiClient.getFullUrl('/api/catalog/products') },
    { path: '/api/catalog/categories', fullUrl: this.apiClient.getFullUrl('/api/catalog/categories') },
    { path: '/health', fullUrl: this.apiClient.getFullUrl('/health') },
    { path: '/api/admin/users', fullUrl: this.apiClient.getFullUrl('/api/admin/users') },
  ];

  ngOnInit() {
    // Initial health check
    this.performHealthCheck();
  }

  async performHealthCheck() {
    this.healthLoading.set(true);
    const startTime = performance.now();
    const path = '/health';

    try {
      const response = await this.apiClient.getHealthCheck().toPromise();
      const duration = Math.round(performance.now() - startTime);

      this.healthResult.set({
        success: true,
        path,
        fullUrl: this.apiClient.getFullUrl(path),
        duration,
        timestamp: new Date(),
        data: response
      });

      console.log('✅ Health Check Success:', response);

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.healthResult.set({
        success: false,
        path,
        fullUrl: this.apiClient.getFullUrl(path),
        duration,
        timestamp: new Date(),
        error: errorMessage
      });

      console.error('❌ Health Check Failed:', error);
    } finally {
      this.healthLoading.set(false);
    }
  }

  searchProducts() {
    const filters: ProductFilters = {};

    if (this.searchQuery.trim()) {
      filters.q = this.searchQuery.trim();
    }

    if (this.selectedCategory) {
      filters.categoryId = this.selectedCategory;
    }

    if (this.onlyInStock) {
      filters.inStock = true;
    }

    this.catalogService.getProducts(filters).subscribe({
      next: (response) => {
        this.products.set(response.items);
        console.log('Products loaded:', response);
      },
      error: (error) => {
        console.error('Failed to load products:', error);
      }
    });
  }

  getProductDetails(productId: string) {
    this.catalogService.getProductById(productId).subscribe({
      next: (product) => {
        console.log('Product details:', product);
        alert(`Product details loaded for: ${product.name}`);
      },
      error: (error) => {
        console.error('Failed to load product details:', error);
      }
    });
  }

  testDirectApiCalls() {
    // Example of direct API usage with different methods
    Promise.all([
      this.apiClient.get('/api/catalog/categories').toPromise(),
      this.apiClient.getWithParams('/api/catalog/products', { limit: 5 }).toPromise(),
    ]).then(([categories, products]) => {
      this.exampleResult.set({
        title: 'Direct API Calls Result',
        data: { categories, products }
      });
    }).catch(error => {
      this.exampleResult.set({
        title: 'Direct API Calls Error',
        data: { error: error.message }
      });
    });
  }

  testTimeoutHandling() {
    // Test with very short timeout to simulate timeout
    this.apiClient.withTimeout('/api/catalog/products', 'GET', undefined, 1).subscribe({
      next: (response) => {
        this.exampleResult.set({
          title: 'Timeout Test - Unexpected Success',
          data: response
        });
      },
      error: (error) => {
        this.exampleResult.set({
          title: 'Timeout Test - Expected Timeout',
          data: { error: error.message, timeout: '1ms' }
        });
      }
    });
  }

  testAdminEndpoints() {
    // Example of admin API usage
    this.catalogService.getProductsAsAdmin().subscribe({
      next: (products) => {
        this.exampleResult.set({
          title: 'Admin Products (Including Drafts)',
          data: { count: products.length, products: products.slice(0, 3) }
        });
      },
      error: (error) => {
        this.exampleResult.set({
          title: 'Admin Endpoint Error',
          data: { error: error.message, note: 'Requires admin permissions' }
        });
      }
    });
  }

  getCatalogStats() {
    this.catalogService.getCatalogStats().subscribe({
      next: (stats) => {
        this.exampleResult.set({
          title: 'Catalog Statistics',
          data: stats
        });
      },
      error: (error) => {
        this.exampleResult.set({
          title: 'Catalog Stats Error',
          data: { error: error.message }
        });
      }
    });
  }
}
