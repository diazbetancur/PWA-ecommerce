import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
import {
  GetLoyaltyRedemptionsQuery,
  GetLoyaltyRewardsQuery,
  GetLoyaltyTransactionsQuery,
  LoyaltyAccountSummaryDto,
  LoyaltyRedemptionsFilters,
  LoyaltyRedemptionsResponse,
  PagedLoyaltyRewardsResponse,
  PagedLoyaltyTransactionsResponse,
  RedeemRewardResponse,
} from '../models/loyalty.models';

/**
 * 🎁 Servicio de Lealtad para Usuarios
 *
 * Maneja todas las operaciones relacionadas con el programa de lealtad
 * desde la perspectiva del usuario final (cliente).
 *
 * Endpoints base: `/me/loyalty`
 *
 * @example
 * ```typescript
 * constructor(private loyaltyService: LoyaltyService) {}
 *
 * ngOnInit() {
 *   // Obtener balance de puntos
 *   this.loyaltyService.getMyAccount().subscribe(account => {
 *     void (`Tengo ${account.pointsBalance} puntos`);
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class LoyaltyService {
  private readonly apiClient = inject(ApiClientService);
  private readonly baseUrl = '/me/loyalty';

  /**
   * Obtiene el resumen de la cuenta de lealtad del usuario autenticado
   *
   * Incluye:
   * - Balance actual de puntos
   * - Tier/nivel del usuario
   * - Puntos ganados y gastados lifetime
   *
   * @returns Observable con el resumen de la cuenta
   *
   * @example
   * ```typescript
   * this.loyaltyService.getMyAccount().subscribe({
   *   next: (account) => {
   *     void (`Balance: ${account.pointsBalance} puntos`);
   *     void (`Tier: ${account.tier}`);
   *   },
   *   error: (err) => void ('Error al cargar cuenta', err)
   * });
   * ```
   */
  getDashboard(): Observable<LoyaltyAccountSummaryDto> {
    return this.apiClient.get<LoyaltyAccountSummaryDto>(this.baseUrl);
  }

  getMyAccount(): Observable<LoyaltyAccountSummaryDto> {
    return this.getDashboard();
  }

  /**
   * Obtiene el historial de transacciones de puntos del usuario
   *
   * Incluye movimientos de:
   * - Puntos ganados (compras, acciones)
   * - Puntos gastados (canjes)
   * - Puntos expirados
   * - Ajustes manuales
   *
   * @param query - Parámetros de consulta (paginación, filtros)
   * @returns Observable con la lista paginada de transacciones
   *
   * @example
   * ```typescript
   * const query: GetLoyaltyTransactionsQuery = {
   *   page: 1,
   *   pageSize: 20,
   *   type: 'EARNED',
   *   fromDate: '2025-01-01T00:00:00Z'
   * };
   *
   * this.loyaltyService.getMyTransactions(query).subscribe(response => {
   *   void (`Total de transacciones: ${response.totalItems}`);
   *   response.items.forEach(tx => {
   *     void (`${tx.description}: ${tx.points} puntos`);
   *   });
   * });
   * ```
   */
  getTransactions(
    query: GetLoyaltyTransactionsQuery
  ): Observable<PagedLoyaltyTransactionsResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.type) {
      params = params.set('type', query.type);
    }
    if (query.fromDate) {
      params = params.set('fromDate', query.fromDate);
    }
    if (query.toDate) {
      params = params.set('toDate', query.toDate);
    }

    return this.apiClient.get<PagedLoyaltyTransactionsResponse>(
      `${this.baseUrl}/transactions`,
      { params }
    );
  }

  getMyTransactions(
    query: GetLoyaltyTransactionsQuery
  ): Observable<PagedLoyaltyTransactionsResponse> {
    return this.getTransactions(query);
  }

  /**
   * Obtiene la lista de premios disponibles para canjear
   *
   * Solo muestra premios activos. El usuario puede filtrar
   * por tipo de premio o ver todos.
   *
   * @param query - Parámetros de consulta (paginación)
   * @returns Observable con la lista paginada de premios
   *
   * @example
   * ```typescript
   * const query: GetLoyaltyRewardsQuery = {
   *   page: 1,
   *   pageSize: 20
   * };
   *
   * this.loyaltyService.getAvailableRewards(query).subscribe(response => {
   *   // Filtrar premios que el usuario puede canjear
   *   const affordable = response.items.filter(
   *     reward => reward.pointsCost <= this.userBalance
   *   );
   *   void (`Puedes canjear ${affordable.length} premios`);
   * });
   * ```
   */
  getAvailableRewards(
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

    return this.apiClient.get<PagedLoyaltyRewardsResponse>(
      `${this.baseUrl}/rewards`,
      { params }
    );
  }

  /**
   * Canjea un premio gastando puntos del usuario
   *
   * Validaciones automáticas:
   * - Usuario tiene puntos suficientes
   * - Premio tiene stock disponible
   * - Premio está activo
   *
   * Genera un código de cupón si es descuento o envío gratis.
   *
   * @param rewardId - ID del premio a canjear
   * @returns Observable con los detalles del canje
   *
   * @example
   * ```typescript
   * this.loyaltyService.redeemReward(rewardId).subscribe({
   *   next: (response) => {
   *     alert(`¡Canje exitoso! Cupón: ${response.couponCode}`);
   *     void (`Nuevo balance: ${response.newBalance} puntos`);
   *
   *     // Guardar cupón en localStorage o estado
   *     this.saveCoupon(response.couponCode);
   *   },
   *   error: (err) => {
   *     if (err.status === 400) {
   *       alert('No tienes suficientes puntos o el premio no tiene stock');
   *     }
   *   }
   * });
   * ```
   */
  redeemReward(rewardId: string): Observable<RedeemRewardResponse> {
    return this.apiClient.post<RedeemRewardResponse>(
      `${this.baseUrl}/rewards/${rewardId}/redeem`,
      {}
    );
  }

  /**
   * Obtiene el historial de canjes realizados por el usuario
   *
   * Incluye canjes en todos los estados:
   * - Pendientes de aprobación
   * - Aprobados (cupones activos)
   * - Entregados (productos)
   * - Cancelados
   * - Expirados
   *
   * @param query - Parámetros de consulta (paginación, filtros)
   * @returns Observable con la lista paginada de canjes
   *
   * @example
   * ```typescript
   * const query: GetLoyaltyRedemptionsQuery = {
   *   page: 1,
   *   pageSize: 20,
   *   status: 'APPROVED'
   * };
   *
   * this.loyaltyService.getMyRedemptions(query).subscribe(response => {
   *   // Mostrar cupones activos
   *   const activeCoupons = response.items.filter(
   *     r => r.status === 'APPROVED' && r.couponCode
   *   );
   *
   *   activeCoupons.forEach(coupon => {
   *     void (`Cupón ${coupon.couponCode} - Expira: ${coupon.expiresAt}`);
   *   });
   * });
   * ```
   */
  getMyRedemptions(
    query: GetLoyaltyRedemptionsQuery
  ): Observable<LoyaltyRedemptionsResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.fromDate) {
      params = params.set('fromDate', query.fromDate);
    }
    if (query.toDate) {
      params = params.set('toDate', query.toDate);
    }

    return this.apiClient.get<LoyaltyRedemptionsResponse>(
      `${this.baseUrl}/redemptions`,
      { params }
    );
  }

  getRedemptions(
    query: LoyaltyRedemptionsFilters
  ): Observable<LoyaltyRedemptionsResponse> {
    return this.getMyRedemptions(query);
  }
}
