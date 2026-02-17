import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private context: Record<string, string | undefined> = {};

  setContext(ctx: Record<string, string | undefined>) {
    this.context = { ...this.context, ...ctx };
  }

  log(message?: unknown, ...optionalParams: unknown[]) {
  }
  warn(message?: unknown, ...optionalParams: unknown[]) {
  }
  error(message?: unknown, ...optionalParams: unknown[]) {
  }

  private prefix() {
    const entries = Object.entries(this.context)
      .filter(([, v]) => !!v)
      .map(([k, v]) => `${k}=${v}`);
    return entries.length ? `[${entries.join(' ')}]` : '';
  }
}
