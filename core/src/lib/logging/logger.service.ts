import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private context: Record<string, string | undefined> = {};

  setContext(ctx: Record<string, string | undefined>) {
    this.context = { ...this.context, ...ctx };
  }

  log(message?: unknown, ...optionalParams: unknown[]) {
    console.log(this.prefix(), message, ...optionalParams);
  }
  warn(message?: unknown, ...optionalParams: unknown[]) {
    console.warn(this.prefix(), message, ...optionalParams);
  }
  error(message?: unknown, ...optionalParams: unknown[]) {
    console.error(this.prefix(), message, ...optionalParams);
  }

  private prefix() {
    const entries = Object.entries(this.context)
      .filter(([, v]) => !!v)
      .map(([k, v]) => `${k}=${v}`);
    return entries.length ? `[${entries.join(' ')}]` : '';
  }
}
