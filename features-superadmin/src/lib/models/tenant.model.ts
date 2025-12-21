/**
 * 🏢 Modelos de Tenant para SuperAdmin
 * Basados en la API del backend
 */

/**
 * Status de un tenant
 */
export enum TenantStatus {
  Pending = 'Pending',
  Seeding = 'Seeding',
  Ready = 'Ready',
  Suspended = 'Suspended',
  Failed = 'Failed',
}

/**
 * Plan del tenant
 */
export enum TenantPlan {
  Basic = 'Basic',
  Premium = 'Premium',
}

/**
 * Límite de un plan
 */
export interface PlanLimit {
  limitCode: string;
  limitValue: number;
  description: string;
}

/**
 * Plan completo con límites
 */
export interface Plan {
  id: string;
  code: string;
  name: string;
  limits: PlanLimit[];
}

/**
 * Tenant en lista (resumen)
 */
export interface TenantListItem {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  planName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tenant detallado
 */
export interface TenantDetail {
  id: string;
  slug: string;
  name: string;
  dbName: string;
  status: TenantStatus;
  planId: string;
  planName: string;
  featureFlagsJson: string | null;
  allowedOrigins: string;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
  recentProvisioningSteps: ProvisioningStep[];
}

/**
 * Paso de provisionamiento
 */
export interface ProvisioningStep {
  step: string;
  status: string;
  timestamp: string;
  details?: string;
}

/**
 * Respuesta paginada de tenants
 */
export interface TenantListResponse {
  items: TenantListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Parámetros para listar tenants
 */
export interface TenantListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TenantStatus;
  planId?: string;
}

/**
 * Request para crear tenant
 */
export interface CreateTenantRequest {
  slug: string;
  name: string;
  planCode: TenantPlan;
}

/**
 * Respuesta al crear tenant
 */
export interface CreateTenantResponse {
  slug: string;
  status: string;
  adminPassword?: string; // Solo se muestra una vez
}

/**
 * Request para actualizar tenant
 */
export interface UpdateTenantRequest {
  name?: string;
  planId?: string;
  featureFlagsJson?: string;
  allowedOrigins?: string;
  isActive?: boolean;
}

/**
 * Request para cambiar status
 */
export interface UpdateTenantStatusRequest {
  status: TenantStatus;
}

/**
 * Request para reparar tenant
 */
export interface RepairTenantRequest {
  tenant: string; // slug
}

/**
 * Respuesta al reparar tenant
 */
export interface RepairTenantResponse {
  tenant: string;
  status: string;
}
