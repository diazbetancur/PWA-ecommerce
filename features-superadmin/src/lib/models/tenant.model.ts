export enum TenantStatus {
  Pending = 'Pending',
  Seeding = 'Seeding',
  Ready = 'Ready',
  Suspended = 'Suspended',
  Failed = 'Failed',
}

export enum TenantPlan {
  Basic = 'Basic',
  Premium = 'Premium',
}

export interface PlanLimit {
  limitCode: string;
  limitValue: number;
  description: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  limits: PlanLimit[];
}

export interface TenantListItem {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  planName: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface ProvisioningStep {
  step: string;
  status: string;
  timestamp: string;
  details?: string;
}

export interface TenantListResponse {
  items: TenantListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TenantListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TenantStatus;
  planId?: string;
}

export interface CreateTenantRequest {
  slug: string;
  name: string;
  planCode: TenantPlan;
  adminEmail: string;
}

/**
 * Respuesta exitosa del backend al crear un tenant
 * El backend devuelve los campos directamente sin anidar
 */
export interface CreateTenantResponse {
  slug: string;
  status: string;
  adminEmail: string;
  temporaryPassword: string;
  message: string;
}

/**
 * Respuesta de error del backend al crear un tenant
 */
export interface CreateTenantError {
  error: string;
  suggestion?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  planId?: string;
  featureFlagsJson?: string;
  allowedOrigins?: string;
  isActive?: boolean;
}

export interface UpdateTenantStatusRequest {
  status: TenantStatus;
}

export interface RepairTenantRequest {
  tenant: string;
}

export interface RepairTenantResponse {
  tenant: string;
  status: string;
}
