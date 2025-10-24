import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);

  handleError(error: unknown): void {
    this.logger.error('Global error', error);
  }
}
