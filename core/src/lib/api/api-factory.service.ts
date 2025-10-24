import { inject, Injectable } from '@angular/core';
import { APP_ENV, AppEnv } from '../config/app-env.token';
import { HttpApiAdapter } from './adapters/http-api.adapter';
import { MockApiAdapter } from './adapters/mock-api.adapter';

@Injectable({ providedIn: 'root' })
export class ApiFactoryService {
  private readonly env: AppEnv = inject(APP_ENV);
  private readonly httpAdapter = inject(HttpApiAdapter);
  private readonly mockAdapter = inject(MockApiAdapter);

  get adapter() {
    return this.env.mockApi ? this.mockAdapter : this.httpAdapter;
  }
}
