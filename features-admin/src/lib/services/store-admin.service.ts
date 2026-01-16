import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
import {
  CheckStockRequest,
  CheckStockResponse,
  CreateStoreRequest,
  GetStoresQuery,
  MigrateLegacyStockRequest,
  MigrateLegacyStockResponse,
  ProductStoreStockDto,
  StoreDto,
  UpdateProductStoreStockRequest,
  UpdateStoreRequest,
} from '../models/store.models';

/**
 * 🏪 Servicio de administración de tiendas
 *
 * Gestiona todas las operaciones CRUD de tiendas y stock por tienda.
 * Usa ApiClientService para comunicación con el backend.
 */
@Injectable({
  providedIn: 'root',
})
export class StoreAdminService {
  private readonly apiClient = inject(ApiClientService);
  private readonly baseUrl = '/admin/stores';

  // ==================== CRUD DE TIENDAS ====================

  /**
   * Obtener lista de tiendas
   * @param query Parámetros de consulta (includeInactive)
   */
  getStores(query?: GetStoresQuery): Observable<StoreDto[]> {
    const params = query ? { includeInactive: query.includeInactive } : {};
    return this.apiClient.get<StoreDto[]>(this.baseUrl, {
      params: params as Record<string, string | boolean>,
    });
  }

  /**
   * Obtener una tienda por ID
   * @param id ID de la tienda
   */
  getStoreById(id: string): Observable<StoreDto> {
    return this.apiClient.get<StoreDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear una nueva tienda
   * @param request Datos de la nueva tienda
   */
  createStore(request: CreateStoreRequest): Observable<StoreDto> {
    return this.apiClient.post<StoreDto>(this.baseUrl, request);
  }

  /**
   * Actualizar una tienda existente
   * @param id ID de la tienda
   * @param request Datos actualizados
   */
  updateStore(id: string, request: UpdateStoreRequest): Observable<StoreDto> {
    return this.apiClient.put<StoreDto>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Eliminar una tienda
   * @param id ID de la tienda
   */
  deleteStore(id: string): Observable<void> {
    return this.apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Establecer una tienda como predeterminada
   * @param id ID de la tienda
   */
  setDefaultStore(id: string): Observable<StoreDto> {
    return this.apiClient.post<StoreDto>(
      `${this.baseUrl}/${id}/set-default`,
      {}
    );
  }

  // ==================== STOCK POR TIENDA ====================

  /**
   * Obtener stock de un producto en todas las tiendas
   * @param productId ID del producto
   */
  getProductStockByStores(
    productId: string
  ): Observable<ProductStoreStockDto[]> {
    return this.apiClient.get<ProductStoreStockDto[]>(
      `${this.baseUrl}/products/${productId}/stock`
    );
  }

  /**
   * Actualizar stock de un producto en una tienda
   * @param productId ID del producto
   * @param request Datos de actualización (storeId y stock)
   */
  updateProductStoreStock(
    productId: string,
    request: UpdateProductStoreStockRequest
  ): Observable<ProductStoreStockDto> {
    return this.apiClient.put<ProductStoreStockDto>(
      `${this.baseUrl}/products/${productId}/stock`,
      request
    );
  }

  /**
   * Verificar disponibilidad de stock
   * @param productId ID del producto
   * @param request Datos de verificación (quantity, storeId)
   */
  checkStock(
    productId: string,
    request: CheckStockRequest
  ): Observable<CheckStockResponse> {
    return this.apiClient.post<CheckStockResponse>(
      `${this.baseUrl}/products/${productId}/check-stock`,
      request
    );
  }

  // ==================== MIGRACIÓN ====================

  /**
   * Migrar stock legacy (Product.Stock) a una tienda
   * @param request ID de la tienda destino
   */
  migrateLegacyStock(
    request: MigrateLegacyStockRequest
  ): Observable<MigrateLegacyStockResponse> {
    return this.apiClient.post<MigrateLegacyStockResponse>(
      `${this.baseUrl}/migrate-legacy-stock`,
      request
    );
  }
}
