import { inject, Injectable } from '@angular/core';
import { HttpApiAdapter } from './adapters/http-api.adapter';

@Injectable({ providedIn: 'root' })
export class ApiFactoryService {
  private readonly httpAdapter = inject(HttpApiAdapter);

  get adapter() {
    return this.httpAdapter;
  }
}
