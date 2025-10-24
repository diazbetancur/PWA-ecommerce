import { inject, Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { APP_ENV, AppEnv } from '../../lib/config/app-env.token';
import { LoggerService } from '../logging/logger.service';
import { TenantConfigService } from '../services/tenant-config.service';

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly swPush = inject(SwPush);
  private readonly env: AppEnv = inject(APP_ENV);
  private readonly tenant = inject(TenantConfigService);
  private readonly logger = inject(LoggerService);

  // Basic permission request
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in globalThis)) return 'denied';
    return Notification.requestPermission();
  }

  async getToken(): Promise<string | null> {
    // Prefer browser Push API via SwPush for token (VAPID). If not enabled or unsupported, return null.
    if (!this.swPush.isEnabled) return null;
    if (!this.env?.fcm?.vapidPublicKey) return null;
    try {
      const sub = await this.swPush.requestSubscription({
        serverPublicKey: this.env.fcm.vapidPublicKey,
      });
      // Persist token (mock): send to backend or store locally per-tenant.
      const token = btoa(JSON.stringify(sub));
      const slug = this.tenant.tenantSlug ?? 'default';
      globalThis.localStorage?.setItem(`push_${slug}`, token);
      return token;
    } catch (e) {
      this.logger.warn('Push subscription failed', e);
      return null; // optional feature, continue without failing
    }
  }

  async init(): Promise<void> {
    const cfg = this.tenant.config;
    if (!cfg?.features?.['push']) {
      return; // behind plan flag
    }
    const perm = await this.requestPermission();
    if (perm !== 'granted') {
      return;
    }
    await this.getToken();
  }
}
