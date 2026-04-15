import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
import {
  AdjustPointsRequest,
  AdjustPointsResponse,
  CreateLoyaltyRewardRequest,
  GetLoyaltyRedemptionsQuery,
  GetLoyaltyRewardsQuery,
  LoyaltyDashboardSummaryDto,
  LoyaltyPointsPaymentConfigDto,
  LoyaltyProgramConfigDto,
  LoyaltyRewardDto,
  PagedLoyaltyRedemptionsResponse,
  PagedLoyaltyRewardsResponse,
  PointsAdjustmentFilters,
  PointsAdjustmentResponse,
  UpdateLoyaltyConfigRequest,
  UpdateLoyaltyPointsPaymentConfigRequest,
  UpdateLoyaltyRewardRequest,
  UpdateRedemptionStatusRequest,
} from '../models/loyalty.models';

/**
 * 🛠️ Servicio de Administración de Lealtad
 *
 * Maneja todas las operaciones administrativas del programa de lealtad:
 * - Gestión de premios (CRUD completo)
 * - Aprobación/gestión de canjes
 * - Ajustes manuales de puntos
 *
 * Endpoints base: `/api/admin/loyalty`
 *
 * Requiere permisos de módulo `loyalty` con acciones específicas:
 * - `loyalty:view` - Ver información
 * - `loyalty:create` - Crear premios, ajustar puntos
 * - `loyalty:update` - Actualizar premios, cambiar estados
 * - `loyalty:delete` - Eliminar premios
 *
 * @example
 * ```typescript
 * constructor(private loyaltyAdminService: LoyaltyAdminService) {}
 *
 * createReward() {
 *   const reward: CreateLoyaltyRewardRequest = {
 *     name: 'Descuento 10%',
 *     description: '10% en tu próxima compra',
 *     rewardType: 'DISCOUNT_PERCENTAGE',
 *     pointsCost: 100,
 *     discountValue: 10,
 *     isActive: true
 *   };
 *
 *   this.loyaltyAdminService.createReward(reward).subscribe({
 *     next: () => alert('Premio creado'),
 *     error: (err) => void ('Error', err)
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class LoyaltyAdminService {
  private readonly apiClient = inject(ApiClientService);
  private readonly baseUrl = '/api/admin/loyalty';

  getDashboardSummary(): Observable<LoyaltyDashboardSummaryDto> {
    return this.apiClient.get<LoyaltyDashboardSummaryDto>(
      `${this.baseUrl}/dashboard/summary`
    );
  }

  // ==================== GESTIÓN DE PREMIOS ====================

  /**
   * Crea un nuevo premio en el catálogo de lealtad
   *
   * Validaciones automáticas:
   * - Nombre requerido (mínimo 3 caracteres)
   * - Costo en puntos mayor a 0
   * - Si es PRODUCT, requiere productId
   * - Si es DISCOUNT_*, requiere discountValue
   *
   * @param request - Datos del premio a crear
   * @returns Observable con el premio creado
   *
   * @example
   * ```typescript
   * const newReward: CreateLoyaltyRewardRequest = {
   *   name: 'Envío Gratis',
   *   description: 'Sin costo de envío en tu próxima orden',
   *   rewardType: 'FREE_SHIPPING',
   *   pointsCost: 50,
   *   stock: null, // ilimitado
   *   isActive: true,
   *   validityDays: 30,
   *   displayOrder: 1
   * };
   *
   * this.loyaltyAdminService.createReward(newReward).subscribe({
   *   next: (reward) => {
   *     void (`Premio creado con ID: ${reward.id}`);
   *     this.router.navigate(['/admin/loyalty/rewards']);
   *   },
   *   error: (err) => {
   *     alert('Error al crear premio: ' + err.error?.detail);
   *   }
   * });
   * ```
   */
  createReward(
    request: CreateLoyaltyRewardRequest
  ): Observable<LoyaltyRewardDto> {
    return this.apiClient.post<LoyaltyRewardDto>(
      `${this.baseUrl}/rewards`,
      this.buildRewardFormData(request)
    );
  }

  /**
   * Obtiene la lista completa de premios (incluye inactivos)
   *
   * A diferencia del endpoint de usuario, este muestra TODOS los premios
   * para que el admin pueda gestionar premios activos e inactivos.
   *
   * @param query - Parámetros de consulta (paginación, filtros)
   * @returns Observable con la lista paginada de premios
   *
   * @example
   * ```typescript
   * const query: GetLoyaltyRewardsQuery = {
   *   page: 1,
   *   pageSize: 50,
   *   isActive: false, // Ver solo premios inactivos
   *   rewardType: 'PRODUCT'
   * };
   *
   * this.loyaltyAdminService.listRewards(query).subscribe(response => {
   *   void (`Total de premios: ${response.totalItems}`);
   *
   *   // Premios con stock bajo
   *   const lowStock = response.items.filter(
   *     r => r.stock !== null && r.stock < 10
   *   );
   *   void (`${lowStock.length} premios con stock bajo`);
   * });
   * ```
   */
  listRewards(
    query: GetLoyaltyRewardsQuery
  ): Observable<PagedLoyaltyRewardsResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.isActive !== undefined) {
      params = params.set('isActive', query.isActive.toString());
    }
    if (query.rewardType) {
      params = params.set('rewardType', query.rewardType);
    }
    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.availableFrom) {
      params = params.set('availableFrom', query.availableFrom);
    }
    if (query.availableUntil) {
      params = params.set('availableUntil', query.availableUntil);
    }
    if (query.createdFrom) {
      params = params.set('createdFrom', query.createdFrom);
    }
    if (query.createdTo) {
      params = params.set('createdTo', query.createdTo);
    }
    if (query.isCurrentlyAvailable !== undefined) {
      params = params.set(
        'isCurrentlyAvailable',
        query.isCurrentlyAvailable.toString()
      );
    }

    return this.apiClient.get<PagedLoyaltyRewardsResponse>(
      `${this.baseUrl}/rewards`,
      {
        params,
      }
    );
  }

  /**
   * Obtiene el detalle completo de un premio específico
   *
   * @param id - ID del premio
   * @returns Observable con los detalles del premio
   *
   * @example
   * ```typescript
   * this.loyaltyAdminService.getRewardById(rewardId).subscribe({
   *   next: (reward) => {
   *     this.rewardForm.patchValue(reward);
   *   },
   *   error: (err) => {
   *     if (err.status === 404) {
   *       alert('Premio no encontrado');
   *       this.router.navigate(['/admin/loyalty/rewards']);
   *     }
   *   }
   * });
   * ```
   */
  getRewardById(id: string): Observable<LoyaltyRewardDto> {
    return this.apiClient.get<LoyaltyRewardDto>(
      `${this.baseUrl}/rewards/${id}`
    );
  }

  /**
   * Actualiza un premio existente
   *
   * Casos de uso comunes:
   * - Cambiar costo en puntos
   * - Actualizar stock disponible
   * - Activar/desactivar premio
   * - Modificar imagen o descripción
   * - Cambiar días de validez
   *
   * @param id - ID del premio a actualizar
   * @param request - Datos actualizados del premio
   * @returns Observable con el premio actualizado
   *
   * @example
   * ```typescript
   * // Reducir stock de un premio
   * this.loyaltyAdminService.getRewardById(rewardId).subscribe(reward => {
   *   const updated: UpdateLoyaltyRewardRequest = {
   *     ...reward,
   *     stock: reward.stock! - 1
   *   };
   *
   *   this.loyaltyAdminService.updateReward(rewardId, updated).subscribe({
   *     next: () => void ('Stock actualizado'),
   *     error: (err) => void ('Error al actualizar', err)
   *   });
   * });
   * ```
   */
  updateReward(
    id: string,
    request: UpdateLoyaltyRewardRequest
  ): Observable<LoyaltyRewardDto> {
    return this.apiClient.put<LoyaltyRewardDto>(
      `${this.baseUrl}/rewards/${id}`,
      this.buildRewardFormData(request)
    );
  }

  private buildRewardFormData(
    request: CreateLoyaltyRewardRequest | UpdateLoyaltyRewardRequest
  ): FormData {
    const formData = new FormData();

    this.appendRequired(formData, 'name', request.name);
    this.appendRequired(formData, 'description', request.description);
    this.appendRequired(formData, 'rewardType', request.rewardType);
    this.appendRequired(formData, 'pointsCost', request.pointsCost);
    this.appendOptionalValue(formData, 'discountValue', request.discountValue);
    this.appendStringArray(formData, 'productIds', request.productIds);
    this.appendOptionalValue(
      formData,
      'appliesToAllEligibleProducts',
      request.appliesToAllEligibleProducts
    );
    this.appendOptionalValue(
      formData,
      'singleProductSelectionRule',
      request.singleProductSelectionRule
    );
    this.appendRequired(formData, 'isActive', request.isActive);
    this.appendOptionalValue(
      formData,
      'couponQuantity',
      request.couponQuantity
    );
    this.appendOptionalValue(formData, 'stock', request.stock);
    this.appendOptionalValue(formData, 'validityDays', request.validityDays);
    this.appendOptionalValue(formData, 'availableFrom', request.availableFrom);
    this.appendOptionalValue(
      formData,
      'availableUntil',
      request.availableUntil
    );
    this.appendOptionalValue(
      formData,
      'termsAndConditions',
      request.termsAndConditions
    );
    this.appendOptionalValue(formData, 'displayOrder', request.displayOrder);
    this.appendOptionalValue(formData, 'image', request.image);

    return formData;
  }

  private appendRequired(
    formData: FormData,
    field: string,
    value: string | number | boolean
  ): void {
    formData.append(field, String(value));
  }

  private appendOptionalValue(
    formData: FormData,
    field: string,
    value?: string | number | boolean | File | null
  ): void {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (value instanceof File) {
      formData.append(field, value);
      return;
    }

    formData.append(field, String(value));
  }

  private appendStringArray(
    formData: FormData,
    field: string,
    values?: string[] | null
  ): void {
    for (const value of values ?? []) {
      if (value) {
        formData.append(field, value);
      }
    }
  }

  /**
   * Elimina un premio del catálogo
   *
   * Si el premio tiene canjes asociados, hace soft delete (solo lo marca como inactivo).
   * Si no tiene canjes, hace hard delete (elimina físicamente).
   *
   * @param id - ID del premio a eliminar
   * @returns Observable vacío (204 No Content)
   *
   * @example
   * ```typescript
   * const confirmed = confirm('¿Eliminar este premio?');
   * if (!confirmed) return;
   *
   * this.loyaltyAdminService.deleteReward(rewardId).subscribe({
   *   next: () => {
   *     alert('Premio eliminado');
   *     this.loadRewards(); // Recargar lista
   *   },
   *   error: (err) => {
   *     alert('Error al eliminar premio');
   *   }
   * });
   * ```
   */
  deleteReward(id: string): Observable<void> {
    return this.apiClient.delete<void>(`${this.baseUrl}/rewards/${id}`);
  }

  // ==================== GESTIÓN DE CANJES ====================

  /**
   * Obtiene todos los canjes realizados por todos los usuarios
   *
   * Incluye información del usuario que realizó el canje (nombre, email).
   * Útil para dashboard administrativo y gestión de canjes pendientes.
   *
   * @param query - Parámetros de consulta (paginación, filtros)
   * @returns Observable con la lista paginada de canjes
   *
   * @example
   * ```typescript
   * // Ver canjes pendientes de aprobación
   * const query: GetLoyaltyRedemptionsQuery = {
   *   page: 1,
   *   pageSize: 50,
   *   status: 'PENDING'
   * };
   *
   * this.loyaltyAdminService.listAllRedemptions(query).subscribe(response => {
   *   void (`${response.totalItems} canjes pendientes`);
   *
   *   // Separar por tipo
   *   const products = response.items.filter(r => r.rewardType === 'PRODUCT');
   *   const discounts = response.items.filter(
   *     r => r.rewardType.includes('DISCOUNT')
   *   );
   *
   *   void (`${products.length} productos por entregar`);
   *   void (`${discounts.length} cupones por aprobar`);
   * });
   * ```
   */
  listAllRedemptions(
    query: GetLoyaltyRedemptionsQuery
  ): Observable<PagedLoyaltyRedemptionsResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.userId) {
      params = params.set('userId', query.userId);
    }
    if (query.fromDate) {
      params = params.set('fromDate', query.fromDate);
    }
    if (query.toDate) {
      params = params.set('toDate', query.toDate);
    }

    return this.apiClient.get<PagedLoyaltyRedemptionsResponse>(
      `${this.baseUrl}/redemptions`,
      { params }
    );
  }

  /**
   * Actualiza el estado de un canje
   *
   * Estados válidos:
   * - APPROVED - Aprobar canje (genera cupón activo)
   * - DELIVERED - Marcar como entregado (solo productos)
   * - CANCELLED - Cancelar y reembolsar puntos
   * - EXPIRED - Marcar como expirado
   *
   * @param id - ID del canje
   * @param request - Nuevo estado y notas opcionales
   * @returns Observable con el canje actualizado
   *
   * @example
   * ```typescript
   * // Aprobar canje de descuento
   * const request: UpdateRedemptionStatusRequest = {
   *   status: 'APPROVED',
   *   adminNotes: 'Aprobado automáticamente'
   * };
   *
   * this.loyaltyAdminService.updateRedemptionStatus(redemptionId, request)
   *   .subscribe({
   *     next: () => {
   *       alert('Canje aprobado');
   *       this.sendEmailToCust
omer(redemptionId);
   *     }
   *   });
   *
   * // Cancelar canje por falta de stock
   * const cancel: UpdateRedemptionStatusRequest = {
   *   status: 'CANCELLED',
   *   adminNotes: 'Producto sin stock, puntos reembolsados'
   * };
   *
   * this.loyaltyAdminService.updateRedemptionStatus(redemptionId, cancel)
   *   .subscribe({
   *     next: () => alert('Canje cancelado y puntos reembolsados')
   *   });
   * ```
   */
  updateRedemptionStatus(
    id: string,
    request: UpdateRedemptionStatusRequest
  ): Observable<{
    id: string;
    status: string;
    approvedAt?: string;
    adminNotes?: string;
  }> {
    return this.apiClient.patch<{
      id: string;
      status: string;
      approvedAt?: string;
      adminNotes?: string;
    }>(`${this.baseUrl}/redemptions/${id}/status`, request);
  }

  // ==================== AJUSTE MANUAL DE PUNTOS ====================

  /**
   * Ajusta puntos manualmente en la cuenta de un usuario
   *
   * Casos de uso:
   * - Regalo de puntos promocionales
   * - Compensación por problemas en órdenes
   * - Corrección de puntos por error del sistema
   * - Puntos por compras en tienda física
   * - Bonos especiales para clientes VIP
   *
   * @param request - Datos del ajuste (usuario, puntos, razón)
   * @returns Observable con el resultado del ajuste
   *
   * @example
   * ```typescript
   * // Agregar puntos de bonificación
   * const adjust: AdjustPointsRequest = {
   *   userId: 'user-id',
   *   points: 150,
   *   reason: 'Bono de bienvenida',
   *   referenceId: 'WELCOME-2025'
   * };
   *
   * this.loyaltyAdminService.adjustPoints(adjust).subscribe({
   *   next: (response) => {
   *     alert(`Puntos ajustados: ${response.pointsAdjusted}`);
   *     void (`Transaction ID: ${response.transactionId}`);
   *     void (`Nuevo balance: ${response.newBalance}`);
   *   },
   *   error: (err) => {
   *     if (err.status === 400) {
   *       alert('Balance insuficiente para deducir puntos');
   *     }
   *   }
   * });
   *
   * // Deducir puntos por corrección
   * const deduct: AdjustPointsRequest = {
   *   userId: 'user-id',
   *   points: -50,
   *   reason: 'Corrección de puntos duplicados',
   *   referenceId: 'CORRECTION-001'
   * };
   *
   * this.loyaltyAdminService.adjustPoints(deduct).subscribe({
   *   next: (response) => alert('Puntos deducidos correctamente')
   * });
   * ```
   */
  adjustPoints(request: AdjustPointsRequest): Observable<AdjustPointsResponse> {
    return this.apiClient.post<AdjustPointsResponse>(
      `${this.baseUrl}/points/adjust`,
      request
    );
  }

  /**
   * Obtiene historial de ajustes manuales de puntos
   */
  listPointsAdjustments(
    filters: PointsAdjustmentFilters
  ): Observable<PointsAdjustmentResponse> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }
    if (filters.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return this.apiClient.get<PointsAdjustmentResponse>(
      `${this.baseUrl}/points/adjustments`,
      { params }
    );
  }

  // ==================== CONFIGURACIÓN DEL PROGRAMA ====================

  /**
   * Obtiene la configuración actual del programa de lealtad
   *
   * Incluye:
   * - Factor de conversión de puntos
   * - Configuración de tiers
   * - Reglas de expiración
   * - Términos y condiciones
   *
   * @returns Observable con la configuración del programa
   *
   * @example
   * ```typescript
   * this.loyaltyAdminService.getProgramConfig().subscribe({
   *   next: (config) => {
   *     void (`1 ${config.currency} = ${config.pointsPerCurrencyUnit} puntos`);
   *     void (`Tier Oro: ${config.goldTierThreshold} puntos`);
   *   }
   * });
   * ```
   */
  getProgramConfig(): Observable<LoyaltyProgramConfigDto> {
    return this.apiClient.get<LoyaltyProgramConfigDto>(
      `${this.baseUrl}/config`
    );
  }

  /**
   * Actualiza la configuración del programa de lealtad
   *
   * Permite modificar:
   * - Factor de conversión (ej: 1 punto por cada 1000 pesos)
   * - Umbrales de tiers
   * - Días de expiración de puntos
   * - Mínimo de puntos para canjear
   * - Estado activo/inactivo del programa
   *
   * @param request - Configuración a actualizar (solo campos modificados)
   * @returns Observable con la configuración actualizada
   *
   * @example
   * ```typescript
   * // Cambiar factor de conversión: 1 punto cada 1500 pesos
   * const update: UpdateLoyaltyConfigRequest = {
   *   pointsPerCurrencyUnit: 1 / 1500,
   *   goldTierThreshold: 5000
   * };
   *
   * this.loyaltyAdminService.updateProgramConfig(update).subscribe({
   *   next: (config) => alert('Configuración actualizada'),
   *   error: (err) => void ('Error al actualizar', err)
   * });
   * ```
   */
  updateProgramConfig(
    request: UpdateLoyaltyConfigRequest
  ): Observable<LoyaltyProgramConfigDto> {
    return this.apiClient.put<LoyaltyProgramConfigDto>(
      `${this.baseUrl}/config`,
      request
    );
  }

  getPointsPaymentConfig(): Observable<LoyaltyPointsPaymentConfigDto> {
    return this.apiClient.get<LoyaltyPointsPaymentConfigDto>(
      `${this.baseUrl}/points-payment-config`
    );
  }

  updatePointsPaymentConfig(
    request: UpdateLoyaltyPointsPaymentConfigRequest
  ): Observable<LoyaltyPointsPaymentConfigDto> {
    return this.apiClient.put<LoyaltyPointsPaymentConfigDto>(
      `${this.baseUrl}/points-payment-config`,
      request
    );
  }
}
