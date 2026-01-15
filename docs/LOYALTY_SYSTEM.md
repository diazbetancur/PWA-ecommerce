# 💎 Sistema de Programa de Lealtad

Sistema completo de gestión de programa de lealtad implementado en el e-commerce multi-tenant.

## 📋 Contenido

- [Arquitectura](#arquitectura)
- [Módulos](#módulos)
- [Componentes](#componentes)
- [Rutas](#rutas)
- [Estilos](#estilos)
- [Uso](#uso)

## 🏗️ Arquitectura

El sistema está dividido en dos módulos principales:

### 1. **Módulo de Usuario** (`features/`)

Permite a los clientes:

- Ver su cuenta de lealtad y balance de puntos
- Explorar el catálogo de premios
- Canjear premios con sus puntos
- Ver historial de transacciones y canjes

### 2. **Módulo de Administrador** (`features-admin/`)

Permite a los administradores:

- Ver dashboard con métricas del programa
- Gestionar premios (crear, editar, activar/desactivar)
- Revisar y aprobar/rechazar canjes
- Realizar ajustes manuales de puntos
- **Configurar el programa** (factor de conversión, tiers, reglas)

## 📦 Módulos

### Modelos (`loyalty.models.ts`)

```typescript
// Enums
- LoyaltyTransactionType: EARNED | REDEEMED | EXPIRED | ADJUSTED
- RewardType: PRODUCT | DISCOUNT_PERCENTAGE | DISCOUNT_FIXED | FREE_SHIPPING
- RedemptionStatus: PENDING | APPROVED | DELIVERED | CANCELLED | EXPIRED
- LoyaltyTier: BRONZE | SILVER | GOLD | PLATINUM

// Interfaces principales
- LoyaltyAccountDto: Cuenta de lealtad del usuario
- LoyaltyRewardDto: Premio disponible
- LoyaltyRedemptionDto: Canje de premio
- LoyaltyTransactionDto: Transacción de puntos
```

### Servicios

**LoyaltyService** (`features/`)

```typescript
// Operaciones de usuario
getMyAccount(): Observable<LoyaltyAccountDto>
getMyTransactions(query): Observable<PagedResult<LoyaltyTransactionDto>>
getAvailableRewards(query): Observable<PagedResult<LoyaltyRewardDto>>
redeemReward(rewardId): Observable<LoyaltyRedemptionDto>
getMyRedemptions(query): Observable<PagedResult<LoyaltyRedemptionDto>>
```

**LoyaltyAdminService** (`features-admin/`)

```typescript
// Operaciones administrativas
createReward(request): Observable<LoyaltyRewardDto>
listRewards(query): Observable<PagedResult<LoyaltyRewardDto>>
updateReward(id, data): Observable<LoyaltyRewardDto>
deleteReward(id): Observable<void>
listAllRedemptions(query): Observable<PagedResult<LoyaltyRedemptionDto>>
updateRedemptionStatus(id, request): Observable<LoyaltyRedemptionDto>
adjustPoints(request): Observable<LoyaltyTransactionDto>
getStatistics(query): Observable<LoyaltyStatisticsDto>
getProgramConfig(): Observable<LoyaltyProgramConfigDto>
updateProgramConfig(request): Observable<LoyaltyProgramConfigDto>
```

## 🧩 Componentes

### Componentes Compartidos

#### 1. **LoyaltyBalanceComponent**

Muestra el balance de puntos del usuario con estilo visual atractivo.

```typescript
@Input() points: number;
@Input() tier?: string;
@Input() showLabel: boolean = true;
@Input() showTier: boolean = true;
@Input() label: string = 'Puntos Disponibles';
@Input() compact: boolean = false;
@Input() size: 'normal' | 'large' = 'normal';
```

#### 2. **RewardCardComponent**

Tarjeta de premio con imagen, descripción y acciones.

```typescript
@Input() reward: LoyaltyRewardDto;
@Input() showActions: boolean = true;
@Input() actionLabel: string = 'Canjear';
@Input() disabled: boolean = false;
@Output() actionClick: EventEmitter<LoyaltyRewardDto>;
```

#### 3. **TierBadgeComponent**

Badge distintivo del nivel/tier del usuario.

```typescript
@Input() tier: string;
@Input() size: 'small' | 'normal' | 'large' = 'normal';
@Input() showIcon: boolean = true;
```

#### 4. **TransactionItemComponent**

Item individual de transacción de puntos.

```typescript
@Input() transaction: LoyaltyTransactionDto;
```

#### 5. **RedemptionStatusComponent**

Badge de estado de canje.

```typescript
@Input() status: string;
@Input() size: 'small' | 'normal' | 'large' = 'normal';
@Input() showIcon: boolean = true;
```

#### 6. **LoyaltyNavComponent**

Navegación entre secciones del programa de lealtad.

### Páginas de Usuario

1. **LoyaltyAccountComponent** - Mi cuenta de lealtad
2. **RewardsCatalogComponent** - Catálogo de premios
3. **MyRedemptionsComponent** - Mis canjes
4. **TransactionsHistoryComponent** - Historial de puntos

### Páginas de Administrador

1. **LoyaltyDashboardComponent** - Dashboard con métricas
2. **RewardsListComponent** - Gestión de premios
3. **RedemptionsListComponent** - Gestión de canjes
4. **PointsAdjustmentComponent** - Ajuste de puntos
5. **ProgramConfigComponent** - Configuración del programa

## 🛣️ Rutas

### Rutas de Usuario

```
/loyalty
  /account          - Mi cuenta de lealtad
  /rewards          - Catálogo de premios
  /redemptions      - Mis canjes
  /transactions     - Historial de puntos
```

### Rutas de Administrador

```
/tenant-admin/loyalty
  /dashboard            - Panel general
  /rewards              - Gestión de premios
  /redemptions          - Canjes de usuarios
  /points-adjustment    - Ajustar puntos
  /config               - Configuración del programa
```

## 🎨 Estilos

### Variables CSS (`loyalty-theme.scss`)

#### Colores de Tier

```scss
--loyalty-tier-bronze: #cd7f32
--loyalty-tier-silver: #c0c0c0
--loyalty-tier-gold: #ffd700
--loyalty-tier-platinum: #e5e4e2
```

#### Gradientes

```scss
--loyalty-gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--loyalty-gradient-success: linear-gradient(135deg, #28a745 0%, #20c997 100%)
--loyalty-gradient-danger: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)
```

#### Colores de Estado

```scss
--loyalty-status-pending: #ffc107
--loyalty-status-approved: #28a745
--loyalty-status-delivered: #17a2b8
--loyalty-status-cancelled: #dc3545
--loyalty-status-expired: #6c757d
```

### Animaciones

```scss
@keyframes loyaltyFadeIn { ... }
@keyframes loyaltyScaleUp { ... }
@keyframes loyaltySlideInRight { ... }
@keyframes loyaltyPulse { ... }
@keyframes loyaltyShimmer { ... }
@keyframes loyaltyBounce { ... }
```

### Clases Utilitarias

```scss
.loyalty-fade-in         // Animación de entrada
.loyalty-scale-up        // Animación de escala
.loyalty-pulse           // Pulso infinito
.loyalty-skeleton        // Loading skeleton
.loyalty-card            // Tarjeta base
.loyalty-hover-lift      // Efecto hover
```

## 🚀 Uso

### Ejemplo: Mostrar Balance

```typescript
import { LoyaltyBalanceComponent } from '@pwa/features';

<lib-loyalty-balance
  [points]="1250"
  [tier]="'GOLD'"
  [size]="'large'"
/>
```

### Ejemplo: Tarjeta de Premio

```typescript
import { RewardCardComponent } from '@pwa/features';

<lib-reward-card
  [reward]="reward"
  [showActions]="true"
  actionLabel="Canjear Premio"
  (actionClick)="onRedeemClick($event)"
/>
```

### Ejemplo: Uso del ToastService

```typescript
import { ToastService } from '@pwa/shared';

constructor(private toastService: ToastService) {}

onSuccess() {
  this.toastService.success('Premio canjeado exitosamente!');
}

onError() {
  this.toastService.error('No tienes suficientes puntos');
}
```

## 🔐 Permisos

### Usuario

- Requiere autenticación (`AuthGuard`)
- Acceso a rutas `/loyalty/*`

### Administrador

- Requiere autenticación (`AuthGuard`)
- Requiere permiso de módulo (`modulePermissionGuard('loyalty')`)
- Acceso a rutas `/tenant-admin/loyalty/*`

## 📱 Responsive

Todos los componentes son completamente responsivos con breakpoints en:

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🌐 Navegación

### Header (Usuario)

- Dropdown de usuario incluye enlace "💎 Programa de Lealtad"
- Menú móvil incluye acceso directo

### Menú Admin

- Módulo "Programa de Lealtad" con 4 submódulos
- Navegación jerárquica con iconos distintivos
- Menú dinámico basado en permisos JWT

## 📊 Integración con Backend

El sistema consume los siguientes endpoints:

### Usuario

- `GET /me/loyalty/account`
- `GET /me/loyalty/transactions`
- `GET /me/loyalty/rewards`
- `POST /me/loyalty/redeem/{rewardId}`
- `GET /me/loyalty/redemptions`

### Admin

- `POST /admin/loyalty/rewards`
- `GET /admin/loyalty/rewards`
- `PUT /admin/loyalty/rewards/{id}`
- `DELETE /admin/loyalty/rewards/{id}`
- `GET /admin/loyalty/redemptions`
- `PUT /admin/loyalty/redemptions/{id}/status`
- `POST /admin/loyalty/adjust-points`
- `GET /admin/loyalty/statistics`
- `GET /admin/loyalty/config`
- `PUT /admin/loyalty/config`

## 🧪 Testing

Todos los componentes y servicios están preparados para testing:

- Unit tests con Jest
- Signals de Angular para reactividad
- Standalone components para testing aislado

## 📝 Notas de Implementación

1. **Signals**: Todo el estado reactivo usa Angular Signals
2. **Standalone**: Todos los componentes son standalone
3. **Lazy Loading**: Las rutas usan lazy loading con `loadComponent`
4. **NX Boundaries**: Modelos duplicados entre features y features-admin
5. **Multi-tenant**: Integración completa con sistema multi-tenant
6. **Accesibilidad**: ARIA labels, roles y keyboard navigation

## 🔄 Flujo de Canje

1. Usuario explora catálogo de premios
2. Selecciona premio y confirma canje
3. Sistema valida puntos disponibles
4. Se crea redemption con estado `PENDING`
5. Admin revisa y aprueba (`APPROVED`)
6. Admin marca como entregado (`DELIVERED`)
7. Usuario ve canje completado en su historial

## ⚙️ Configuración del Programa

La página de **Configuración del Programa** permite a los administradores personalizar completamente el comportamiento del sistema de lealtad.

### Factor de Conversión

Define cuántos puntos se otorgan por cada compra:

**Ejemplo de configuración:**

- **Monto en COP**: 1000 (mil pesos)
- **Puntos Otorgados**: 0.001 (calculado automáticamente)
- **Resultado**: 1 punto por cada 1000 pesos gastados

Si un cliente compra por $50,000, recibirá **50 puntos**.

### Umbrales de Tiers

Configura los puntos lifetime necesarios para cada nivel:

- **🥉 Bronce**: 0 puntos (nivel inicial)
- **🥈 Plata**: 500 puntos
- **🥇 Oro**: 2000 puntos
- **💎 Platino**: 5000 puntos

### Reglas del Programa

- **Puntos Mínimos para Canjear**: Cantidad mínima necesaria para comenzar a canjear premios
- **Días de Expiración**: Después de cuántos días expiran los puntos (vacío = nunca expiran)
- **Estado del Programa**: Activar/desactivar el programa completo
- **Términos y Condiciones**: Texto legal mostrado a los usuarios

### Ejemplo de Uso

```typescript
// Obtener configuración actual
this.loyaltyAdminService.getProgramConfig().subscribe((config) => {
  console.log(`Factor: 1 punto cada ${1 / config.pointsPerCurrencyUnit} ${config.currency}`);
});

// Actualizar factor de conversión (1 punto cada 1500 pesos)
const update: UpdateLoyaltyConfigRequest = {
  pointsPerCurrencyUnit: 1 / 1500,
  goldTierThreshold: 3000,
};

this.loyaltyAdminService.updateProgramConfig(update).subscribe({
  next: () => console.log('Configuración actualizada'),
  error: (err) => console.error('Error:', err),
});
```

## 📈 Métricas del Dashboard

- Total de usuarios activos en programa
- Puntos totales emitidos
- Canjes realizados (total y por período)
- Premios más populares
- Distribución de usuarios por tier
- Actividad reciente

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2026  
**Desarrollado por**: PWA eCommerce Team
