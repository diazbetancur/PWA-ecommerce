import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject } from 'rxjs';

@Component({
  selector: 'lib-app-button, app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled || loading"
      (click)="clicked.emit($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
})
class MockAppButtonComponent {
  @Input() variant = 'primary';
  @Input() icon?: string;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() clicked = new EventEmitter<MouseEvent>();
}

jest.mock('@pwa/core', () => ({
  ProductService: class ProductService {
    readonly mockToken = 'ProductService';
  },
  AppEnvService: class AppEnvService {
    readonly mockToken = 'AppEnvService';
  },
}));

jest.mock('@pwa/shared', () => ({
  AppButtonComponent: MockAppButtonComponent,
  buildAppSnackBarConfig: (_message: string, config?: unknown) => config ?? {},
  ConfirmationDialogService: class ConfirmationDialogService {
    readonly mockToken = 'ConfirmationDialogService';
  },
  extractApiErrorMessage: (error: HttpErrorResponse) =>
    error.error?.detail || 'Error al crear el producto',
}));

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppEnvService, ProductService } from '@pwa/core';
import { ConfirmationDialogService } from '@pwa/shared';
import { StoreAdminService } from '../../../services/store-admin.service';
import { ProductFormComponent } from './product-form.component';

describe('ProductFormComponent', () => {
  let fixture: ComponentFixture<ProductFormComponent>;
  let component: ProductFormComponent;
  let productService: {
    create: jest.Mock;
    update: jest.Mock;
    getById: jest.Mock;
  };
  let storeAdminService: {
    getStores: jest.Mock;
  };
  let router: {
    navigate: jest.Mock;
  };
  let snackBar: {
    open: jest.Mock;
  };
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    productService = {
      create: jest.fn(),
      update: jest.fn(),
      getById: jest.fn(),
    };

    storeAdminService = {
      getStores: jest.fn(() => of([])),
    };

    router = {
      navigate: jest.fn(),
    };

    snackBar = {
      open: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        {
          provide: ProductService,
          useValue: productService,
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
          },
        },
        {
          provide: MatSnackBar,
          useValue: snackBar,
        },
        {
          provide: MatDialog,
          useValue: {
            open: jest.fn(),
          },
        },
        {
          provide: StoreAdminService,
          useValue: storeAdminService,
        },
        {
          provide: AppEnvService,
          useValue: {
            categoryImageMaxSizeMb: 1,
          },
        },
        {
          provide: ConfirmationDialogService,
          useValue: {
            alert: jest.fn(),
            confirm: jest.fn(() => of(false)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('mantiene visible el boton Crear y permite reintentar cuando falla la creacion', () => {
    const createRequest$ = new Subject<unknown>();
    productService.create.mockReturnValue(createRequest$.asObservable());

    component.form.patchValue({
      name: 'Producto demo',
      price: 10,
      stock: 5,
      isTaxIncluded: true,
      isActive: true,
      isFeatured: false,
      trackInventory: false,
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.submitting()).toBe(true);
    expect(
      fixture.debugElement.query(By.css('form.product-form'))
    ).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.loading-container'))).toBeNull();

    const pendingSubmitButton = fixture.debugElement.query(
      By.css('button[type="submit"]')
    );
    expect(pendingSubmitButton).toBeTruthy();
    expect(
      (pendingSubmitButton.nativeElement as HTMLButtonElement).disabled
    ).toBe(true);

    createRequest$.error(
      new HttpErrorResponse({
        status: 400,
        error: {
          detail: 'El SKU ya existe',
        },
      })
    );
    fixture.detectChanges();

    expect(component.submitting()).toBe(false);
    expect(
      fixture.debugElement.query(By.css('form.product-form'))
    ).toBeTruthy();

    const submitButtonAfterError = fixture.debugElement.query(
      By.css('button[type="submit"]')
    );
    expect(submitButtonAfterError).toBeTruthy();
    expect(
      (submitButtonAfterError.nativeElement as HTMLButtonElement).disabled
    ).toBe(false);
  });
});
