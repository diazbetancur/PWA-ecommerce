import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiClientService } from '../../services/api-client.service';
import { TenantBootstrapService } from '../../services/tenant-bootstrap.service';
import { TenantContextService } from '../../services/tenant-context.service';

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
  templateUrl: './tenant-debug.component.html',
  styleUrl: './tenant-debug.component.scss',
})
export class TenantDebugComponent {
  private readonly tenantBootstrap = inject(TenantBootstrapService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly apiClient = inject(ApiClientService);

  selectedEndpoint = signal('/api/catalog/products');
  customEndpoint = signal('');
  isTestRunning = signal(false);
  isRefreshing = signal(false);
  lastTestResult = signal<ApiTestResult | null>(null);
  testHistory = signal<ApiTestResult[]>([]);

  tenantConfig = computed(() => this.tenantContext.getCurrentTenantConfig());
  tenantSlug = computed(() => this.tenantContext.getTenantSlug());
  tenantKey = computed(() => this.tenantContext.getTenantKey());
  tenantStatus = computed(() => this.tenantBootstrap.tenantStatus());
  displayName = computed(
    () => this.tenantContext.getCurrentTenant()?.displayName
  );

  tenantStatusClass = computed(() => {
    const status = this.tenantStatus();
    return {
      loading: status === 'resolving',
      ok: status === 'resolved',
      error:
        status === 'error' || status === 'not-found' || status === 'timeout',
    };
  });

  async refreshTenantInfo(): Promise<void> {
    this.isRefreshing.set(true);
    try {
      await this.tenantBootstrap.initialize();
    } catch (error) {
      console.error('Error refreshing tenant info:', error);
    } finally {
      this.isRefreshing.set(false);
    }
  }

  async runApiTest(): Promise<void> {
    const endpoint =
      this.selectedEndpoint() === 'custom'
        ? this.customEndpoint()
        : this.selectedEndpoint();

    if (!endpoint.trim()) {
      alert('Por favor ingresa un endpoint válido');
      return;
    }

    this.isTestRunning.set(true);
    const startTime = Date.now();

    try {
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
          'Content-Type': 'application/json',
        },
        status: 200,
      };

      this.lastTestResult.set(result);
      this.addToHistory(result);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      const result: ApiTestResult = {
        success: false,
        error: this.formatError(error),
        timestamp: new Date(),
        duration,
        status: error?.status || 0,
      };

      this.lastTestResult.set(result);
      this.addToHistory(result);
    } finally {
      this.isTestRunning.set(false);
    }
  }

  private addToHistory(result: ApiTestResult): void {
    const history = [...this.testHistory(), result];
    if (history.length > 10) {
      history.shift();
    }
    this.testHistory.set(history);
  }

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

  formatJson(data: any): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }

  formatHeaders(headers: Record<string, string>): string {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    if (status >= 500) return 'status-5xx';
    return '';
  }

  getEndpointFromTest(test: ApiTestResult): string {
    return this.selectedEndpoint() === 'custom'
      ? this.customEndpoint()
      : this.selectedEndpoint();
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      alert('📋 JSON copiado al portapapeles');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      alert('📋 JSON copiado al portapapeles');
    }
  }

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
    a.download = `tenant-config-${
      this.tenantSlug() || 'unknown'
    }-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  Object = Object;
}
