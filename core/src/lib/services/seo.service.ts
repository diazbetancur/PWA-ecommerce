import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TenantConfig } from '../models/types';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  apply(config: TenantConfig) {
    const appName = config.tenant.displayName;
    this.title.setTitle(appName);
    this.meta.updateTag({ name: 'application-name', content: appName });
    this.meta.updateTag({ name: 'theme-color', content: config.theme.primary });
    // Basic OpenGraph / Twitter tags
    this.meta.updateTag({ property: 'og:title', content: appName });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: appName });
  }
}
