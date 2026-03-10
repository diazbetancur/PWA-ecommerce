/**
 * 🎁 Modelos del Sistema de Lealtad
 *
 * Incluye todas las interfaces y tipos necesarios para:
 * - Cuentas de lealtad y balance de puntos
 * - Transacciones de puntos (ganados, gastados, ajustes)
 * - Premios del catálogo
 * - Canjes de premios
 * - Ajustes manuales de puntos
 */

// ==================== ENUMS ====================

/**
 * Tipos de transacciones de puntos
 */
export enum LoyaltyTransactionType {
  EARNED = 'EARNED', // Puntos ganados (compras, acciones)
  REDEEMED = 'REDEEMED', // Puntos gastados (canjes)
  EXPIRED = 'EXPIRED', // Puntos expirados
  ADJUSTED = 'ADJUSTED', // Ajuste manual por admin
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
}

/**
 * Tipos de premios disponibles
 */
export enum RewardType {
  PRODUCT = 'PRODUCT', // Producto físico
  DISCOUNT_PERCENTAGE = 'DISCOUNT_PERCENTAGE', // Descuento porcentual
  DISCOUNT_FIXED = 'DISCOUNT_FIXED', // Descuento monto fijo
  FREE_SHIPPING = 'FREE_SHIPPING', // Envío gratis
}

/**
 * Estados de un canje de premio
 */
export enum RedemptionStatus {
  PENDING = 'PENDING', // Pendiente de aprobación
  APPROVED = 'APPROVED', // Aprobado, listo para usar
  DELIVERED = 'DELIVERED', // Entregado (productos)
  CANCELLED = 'CANCELLED', // Cancelado (puntos reembolsados)
  EXPIRED = 'EXPIRED', // Expirado sin usar
}

/**
 * Niveles/tiers de lealtad
 */
export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

// ==================== CUENTA DE LEALTAD ====================

/**
 * Resumen de la cuenta de lealtad del usuario
 */
export interface LoyaltyAccountSummaryDto {
  /** Balance actual de puntos */
  balance: number;
  /** Total de puntos ganados en toda la vida */
  totalEarned: number;
  /** Total de puntos gastados en toda la vida */
  totalRedeemed: number;
  /** Puntos que vencen en los próximos 60 días */
  pointsExpiringIn60Days?: number;
  /** Últimas transacciones recientes */
  lastTransactions: LoyaltyTransactionDto[];
  /** Nivel/tier actual del usuario (opcional, calculado en el frontend si no viene del backend) */
  tier?: LoyaltyTier | string;
}

// ==================== TRANSACCIONES ====================

/**
 * Transacción de puntos (movimiento individual)
 */
export interface LoyaltyTransactionDto {
  /** ID de la transacción */
  id: string;
  /** Tipo de transacción */
  type: LoyaltyTransactionType | string;
  /** Cantidad de puntos (positivo = ganado, negativo = gastado) */
  points: number;
  /** Descripción del movimiento */
  description: string;
  /** Detalle simplificado para UI */
  detail?: string;
  /** Número de orden relacionada (si aplica) */
  orderNumber?: string | null;
  /** Fecha funcional de transacción */
  transactionDate?: string;
  /** Fecha de expiración asociada */
  expirationDate?: string | null;
  /** Fecha de la transacción */
  createdAt: string;
}

/**
 * Query parameters para obtener transacciones
 */
export interface GetLoyaltyTransactionsQuery {
  /** Número de página */
  page: number;
  /** Tamaño de página */
  pageSize: number;
  /** Filtrar por tipo de transacción */
  type?: LoyaltyTransactionType | string;
  /** Fecha inicial (ISO 8601) */
  fromDate?: string;
  /** Fecha final (ISO 8601) */
  toDate?: string;
}

/**
 * Respuesta paginada de transacciones
 */
export interface PagedLoyaltyTransactionsResponse {
  /** Lista de transacciones */
  items: LoyaltyTransactionDto[];
  /** Página actual */
  page: number;
  /** Tamaño de página */
  pageSize: number;
  /** Total de items */
  totalItems: number;
  /** Total de items (algunos endpoints responden totalCount) */
  totalCount?: number;
  /** Total de páginas */
  totalPages: number;
}

// ==================== PREMIOS ====================

/**
 * Premio del catálogo de lealtad
 */
export interface LoyaltyRewardDto {
  /** ID del premio */
  id: string;
  /** Nombre del premio */
  name: string;
  /** Descripción detallada */
  description: string;
  /** Tipo de premio */
  rewardType: RewardType | string;
  /** Costo en puntos */
  pointsCost: number;
  /** Valor del descuento (si aplica) */
  discountValue?: number;
  /** ID del producto asociado (si aplica) */
  productId?: string | null;
  /** IDs de productos asociados (si aplica) */
  productIds?: string[] | null;
  /** Nombre del producto (si aplica) */
  productName?: string | null;
  /** Si aplica a todos los productos elegibles */
  appliesToAllEligibleProducts?: boolean;
  /** Regla de selección cuando aplica solo a un producto */
  singleProductSelectionRule?: string | null;
  /** URL de la imagen */
  imageUrl?: string;
  /** Stock disponible (null = ilimitado) */
  stock?: number | null;
  /** Cantidad de cupones configurados */
  couponQuantity?: number | null;
  /** Cupones emitidos */
  couponsIssued?: number;
  /** Cupones disponibles */
  couponsAvailable?: number;
  /** Si el premio está activo */
  isActive: boolean;
  /** Días de validez del cupón/premio (null = sin expiración) */
  validityDays?: number | null;
  /** Inicio de disponibilidad */
  availableFrom?: string | null;
  /** Fin de disponibilidad */
  availableUntil?: string | null;
  /** Disponible actualmente */
  isCurrentlyAvailable?: boolean;
  /** Términos y condiciones */
  termsAndConditions?: string;
  /** Orden de visualización en el catálogo */
  displayOrder: number;
  /** Fecha de creación */
  createdAt: string;
  /** Fecha de última actualización */
  updatedAt?: string;
}

/**
 * Request para crear un nuevo premio
 */
export interface CreateLoyaltyRewardRequest {
  /** Nombre del premio */
  name: string;
  /** Descripción del premio */
  description: string;
  /** Tipo de premio */
  rewardType: RewardType | string;
  /** Costo en puntos */
  pointsCost: number;
  /** Valor del descuento (requerido para tipos DISCOUNT_*) */
  discountValue?: number;
  /** ID del producto (requerido para tipo PRODUCT) */
  productId?: string | null;
  /** URL de la imagen */
  imageUrl?: string;
  /** Stock disponible (null = ilimitado) */
  stock?: number | null;
  /** Si el premio está activo */
  isActive: boolean;
  /** Días de validez */
  validityDays?: number | null;
  /** Términos y condiciones */
  termsAndConditions?: string;
  /** Orden de visualización */
  displayOrder?: number;
}

/**
 * Request para actualizar un premio existente
 * Tiene la misma estructura que CreateLoyaltyRewardRequest
 */
export type UpdateLoyaltyRewardRequest = CreateLoyaltyRewardRequest;

/**
 * Query parameters para obtener premios
 */
export interface GetLoyaltyRewardsQuery {
  /** Número de página */
  page: number;
  /** Tamaño de página */
  pageSize: number;
  /** Filtrar por estado activo */
  isActive?: boolean;
  /** Filtrar por tipo de premio */
  rewardType?: RewardType | string;
}

/**
 * Respuesta paginada de premios
 */
export interface PagedLoyaltyRewardsResponse {
  /** Lista de premios */
  items: LoyaltyRewardDto[];
  /** Página actual */
  page: number;
  /** Tamaño de página */
  pageSize: number;
  /** Total de items */
  totalItems: number;
  /** Total de items (algunos endpoints responden totalCount) */
  totalCount?: number;
  /** Total de páginas */
  totalPages: number;
}

// ==================== CANJES ====================

/**
 * Canje de premio realizado
 */
export interface LoyaltyRedemptionDto {
  /** ID del canje */
  id: string;
  /** ID del usuario (solo en vista admin) */
  userId?: string;
  /** Nombre del usuario (solo en vista admin) */
  userName?: string;
  /** Email del usuario (solo en vista admin) */
  userEmail?: string;
  /** ID del premio canjeado */
  rewardId: string;
  /** Nombre del premio */
  rewardName: string;
  /** Tipo de premio */
  rewardType: RewardType | string;
  /** Puntos gastados */
  pointsSpent: number;
  /** Código de cupón generado (si aplica) */
  couponCode?: string | null;
  /** Estado del canje */
  status: RedemptionStatus | string;
  /** Fecha del canje */
  redeemedAt: string;
  /** Fecha de aprobación */
  approvedAt?: string | null;
  /** Fecha de entrega */
  deliveredAt?: string | null;
  /** Fecha de expiración */
  expiresAt?: string | null;
  /** Notas del administrador */
  adminNotes?: string | null;
  /** ID de la orden asociada (si aplica) */
  orderId?: string | null;
  /** Número de orden asociada (si aplica) */
  orderNumber?: string | null;
}

/**
 * Respuesta al canjear un premio
 */
export interface RedeemRewardResponse {
  /** ID del canje generado */
  redemptionId: string;
  /** Mensaje de confirmación */
  message: string;
  /** Puntos restantes después del canje */
  remainingPoints: number;
  /** Código de cupón generado (si aplica) */
  couponCode?: string;
  /** Fecha de expiración del cupón (si aplica) */
  expiresAt?: string;
}

/**
 * Request para actualizar el estado de un canje
 */
export interface UpdateRedemptionStatusRequest {
  /** Nuevo estado */
  status: RedemptionStatus | string;
  /** Notas del administrador */
  adminNotes?: string;
}

/**
 * Query parameters para obtener canjes
 */
export interface GetLoyaltyRedemptionsQuery {
  /** Número de página */
  page: number;
  /** Tamaño de página */
  pageSize: number;
  /** Filtrar por estado */
  status?: RedemptionStatus | string;
  /** Filtrar por usuario (solo admin) */
  userId?: string;
  /** Fecha inicial */
  fromDate?: string;
  /** Fecha final */
  toDate?: string;
}

/**
 * Respuesta paginada de canjes
 */
export interface PagedLoyaltyRedemptionsResponse {
  /** Lista de canjes */
  items: LoyaltyRedemptionDto[];
  /** Página actual */
  page: number;
  /** Tamaño de página */
  pageSize: number;
  /** Total de items */
  totalItems: number;
  /** Total de items (algunos endpoints responden totalCount) */
  totalCount?: number;
  /** Total de páginas */
  totalPages: number;
}

export interface LoyaltyRedemptionItem extends LoyaltyRedemptionDto {}

export interface LoyaltyRedemptionsResponse
  extends PagedLoyaltyRedemptionsResponse {}

export interface LoyaltyRedemptionsFilters {
  page: number;
  pageSize: number;
  status?: RedemptionStatus | string;
  fromDate?: string;
  toDate?: string;
}

// ==================== AJUSTE MANUAL DE PUNTOS ====================

/**
 * Request para ajustar puntos manualmente (admin)
 */
export interface AdjustPointsRequest {
  /** ID del usuario */
  userId: string;
  /** Cantidad de puntos (positivo = agregar, negativo = deducir) */
  points: number;
  /** Razón del ajuste (requerido) */
  reason: string;
  /** Referencia opcional (orden, ticket, etc.) */
  referenceId?: string;
}

/**
 * Respuesta al ajustar puntos
 */
export interface AdjustPointsResponse {
  /** ID del usuario */
  userId: string;
  /** Puntos ajustados */
  pointsAdjusted: number;
  /** Balance anterior */
  previousBalance: number;
  /** Nuevo balance */
  newBalance: number;
  /** Razón del ajuste */
  reason: string;
  /** Referencia */
  referenceId?: string;
  /** Fecha del ajuste */
  adjustedAt: string;
}

// ==================== TIPOS AUXILIARES ====================

/**
 * Colores asociados a cada tier
 */
export const TIER_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
};

/**
 * Etiquetas para mostrar en UI
 */
export const TIER_LABELS: Record<string, string> = {
  BRONZE: 'Bronce',
  SILVER: 'Plata',
  GOLD: 'Oro',
  PLATINUM: 'Platino',
};

/**
 * Etiquetas para tipos de premios
 */
export const REWARD_TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Producto',
  DISCOUNT_PERCENTAGE: 'Descuento %',
  DISCOUNT_FIXED: 'Descuento Fijo',
  FREE_SHIPPING: 'Envío Gratis',
};

/**
 * Etiquetas para estados de canjes
 */
export const REDEMPTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
};

/**
 * Colores para estados de canjes
 */
export const REDEMPTION_STATUS_COLORS: Record<string, string> = {
  PENDING: 'warning',
  APPROVED: 'success',
  DELIVERED: 'info',
  CANCELLED: 'danger',
  EXPIRED: 'secondary',
};
