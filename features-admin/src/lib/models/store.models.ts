/**
 * 🏪 Modelos del Sistema de Stores (features-admin)
 *
 * Incluye todas las interfaces y tipos necesarios para:
 * - Gestión de tiendas/sucursales
 * - Stock por tienda
 * - Verificación de disponibilidad
 */

// ==================== TIENDAS ====================

/**
 * Tienda/Sucursal del tenant
 */
export interface StoreDto {
  /** ID único de la tienda */
  id: string;
  /** Nombre de la tienda */
  name: string;
  /** Código único de la tienda (opcional) */
  code?: string;
  /** Dirección física */
  address?: string;
  /** Ciudad */
  city?: string;
  /** País */
  country?: string;
  /** Teléfono de contacto */
  phone?: string;
  /** Es la tienda predeterminada */
  isDefault: boolean;
  /** Tienda activa */
  isActive: boolean;
  /** Fecha de creación */
  createdAt: string;
  /** Fecha de última actualización */
  updatedAt: string;
}

/**
 * Request para crear una tienda
 */
export interface CreateStoreRequest {
  /** Nombre de la tienda (mínimo 3 caracteres) */
  name: string;
  /** Código único (opcional) */
  code?: string;
  /** Dirección física */
  address?: string;
  /** Ciudad */
  city?: string;
  /** País */
  country?: string;
  /** Teléfono */
  phone?: string;
  /** Establecer como predeterminada */
  isDefault?: boolean;
}

/**
 * Request para actualizar una tienda
 */
export interface UpdateStoreRequest {
  /** Nombre de la tienda */
  name: string;
  /** Código único */
  code?: string;
  /** Dirección física */
  address?: string;
  /** Ciudad */
  city?: string;
  /** País */
  country?: string;
  /** Teléfono */
  phone?: string;
  /** Es la tienda predeterminada */
  isDefault: boolean;
  /** Tienda activa */
  isActive: boolean;
}

/**
 * Query params para listar tiendas
 */
export interface GetStoresQuery {
  /** Incluir tiendas inactivas */
  includeInactive?: boolean;
}

// ==================== STOCK POR TIENDA ====================

/**
 * Stock de un producto en una tienda específica
 */
export interface ProductStoreStockDto {
  /** ID del registro */
  id: string;
  /** ID del producto */
  productId: string;
  /** ID de la tienda */
  storeId: string;
  /** Nombre de la tienda (para mostrar) */
  storeName: string;
  /** Stock total en la tienda */
  stock: number;
  /** Stock reservado (en órdenes pendientes) */
  reservedStock: number;
  /** Stock disponible (stock - reservedStock) */
  availableStock: number;
  /** Fecha de última actualización */
  updatedAt: string;
}

/**
 * Request para actualizar stock de un producto en una tienda
 */
export interface UpdateProductStoreStockRequest {
  /** ID de la tienda */
  storeId: string;
  /** Nuevo stock total */
  stock: number;
}

/**
 * Request para verificar disponibilidad de stock
 */
export interface CheckStockRequest {
  /** ID del producto */
  productId: string;
  /** Cantidad requerida */
  quantity: number;
  /** ID de la tienda (null para stock legacy) */
  storeId?: string | null;
}

/**
 * Response de verificación de stock
 */
export interface CheckStockResponse {
  /** Stock está disponible */
  isAvailable: boolean;
  /** Cantidad disponible */
  availableStock: number;
  /** Mensaje descriptivo */
  message: string;
  /** ID de la tienda consultada */
  storeId?: string;
  /** Se usó stock legacy (Product.Stock) */
  usedLegacyStock: boolean;
}

// ==================== MIGRACIÓN ====================

/**
 * Request para migrar stock legacy a una tienda
 */
export interface MigrateLegacyStockRequest {
  /** ID de la tienda destino */
  defaultStoreId: string;
}

/**
 * Response de migración de stock
 */
export interface MigrateLegacyStockResponse {
  /** Cantidad de productos migrados */
  migratedProductsCount: number;
  /** ID de la tienda destino */
  targetStoreId: string;
  /** Mensaje de resultado */
  message: string;
}
