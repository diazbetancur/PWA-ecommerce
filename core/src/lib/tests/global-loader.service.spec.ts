import { TestBed } from '@angular/core/testing';
import { GlobalLoaderService } from '../services/global-loader.service';
import { LoaderService } from '../services/loader.service';

describe('GlobalLoaderService', () => {
  let service: GlobalLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobalLoaderService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    service.reset();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('aplica delay de entrada y tiempo minimo visible', () => {
    service.beginRequest();

    jest.advanceTimersByTime(279);
    expect(service.isVisible()).toBe(false);

    jest.advanceTimersByTime(1);
    expect(service.isVisible()).toBe(true);

    service.endRequest();

    jest.advanceTimersByTime(399);
    expect(service.isVisible()).toBe(true);

    jest.advanceTimersByTime(1);
    expect(service.isVisible()).toBe(false);
  });

  it('no se oculta mientras existan requests concurrentes activas', () => {
    service.beginRequest();
    service.beginRequest();

    jest.advanceTimersByTime(280);
    expect(service.isVisible()).toBe(true);
    expect(service.activeRequestCount()).toBe(2);

    service.endRequest();
    jest.advanceTimersByTime(1000);

    expect(service.activeRequestCount()).toBe(1);
    expect(service.isVisible()).toBe(true);

    service.endRequest();
    jest.advanceTimersByTime(400);

    expect(service.activeRequestCount()).toBe(0);
    expect(service.isVisible()).toBe(false);
  });

  it('mantiene compatibilidad con el token LoaderService', () => {
    const compatibilityToken = TestBed.inject(LoaderService);

    expect(compatibilityToken).toBe(service);
  });
});
