# Sistema de Autenticación Completo - PWA eCommerce

## 📋 Resumen

Se ha implementado un sistema de autenticación completo con las siguientes características:

- ✅ Login de usuarios
- ✅ Registro de nuevos usuarios
- ✅ Recuperación de contraseña
- ✅ Gestión de perfil de usuario
- ✅ Cambio de contraseña
- ✅ JWT tokens y refresh tokens
- ✅ Guards para protección de rutas
- ✅ Integración con multi-tenant

## 🏗️ Arquitectura

### Componentes Creados

#### 1. **Modelos** (`features-account/src/lib/models/user.model.ts`)

```typescript
- User: Información del usuario
- LoginRequest: Datos para login
- RegisterRequest: Datos para registro
- AuthResponse: Respuesta de autenticación
- ForgotPasswordRequest: Solicitud de recuperación
- ResetPasswordRequest: Reset de contraseña
- ChangePasswordRequest: Cambio de contraseña
- UpdateProfileRequest: Actualización de perfil
- AuthState: Estado de autenticación
```

#### 2. **Servicios**

##### AccountService (`features-account/src/lib/services/account.service.ts`)

Servicio principal que gestiona toda la lógica de autenticación:

```typescript
// Métodos principales
- login(request: LoginRequest): Promise<void>
- register(request: RegisterRequest): Promise<void>
- logout(): Promise<void>
- forgotPassword(request: ForgotPasswordRequest): Promise<void>
- resetPassword(request: ResetPasswordRequest): Promise<void>
- changePassword(request: ChangePasswordRequest): Promise<void>
- getProfile(): Promise<User>
- updateProfile(request: UpdateProfileRequest): Promise<User>
- refreshToken(): Promise<boolean>
- initializeFromToken(): Promise<void>

// Estado reactivo
state = signal<AuthState>({
  user: User | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null
})
```

**Características:**

- Integrado con `ApiClientService` del core
- Usa `AuthService` del core para gestión de tokens
- Maneja refresh tokens en localStorage
- Estado reactivo con signals
- Manejo de errores centralizado

#### 3. **Componentes UI**

##### LoginComponent

- Formulario reactivo con validaciones
- Opción "Recordarme"
- Toggle de visibilidad de contraseña
- Enlaces a registro y recuperación
- Diseño moderno con gradientes

##### RegisterComponent

- Formulario completo con validaciones
- Validación de contraseñas coincidentes
- Checkbox de términos y condiciones
- Toggle de visibilidad en ambas contraseñas
- Campos: nombre, apellido, email, teléfono, contraseña

##### ForgotPasswordComponent

- Formulario simple con email
- Mensajes de éxito/error
- Enlace para volver al login

##### ProfileComponent

- Vista/edición de información personal
- Cambio de contraseña
- Información de cuenta (rol, fecha registro, último acceso)
- Botón de logout
- Modo edición con cancelación

## 🛣️ Rutas Configuradas

```typescript
/account/login           - Login
/account/register        - Registro
/account/forgot-password - Recuperación de contraseña
/account/profile         - Perfil de usuario
/account                 - Redirect a /account/profile
```

## 🔒 Guards de Seguridad (Ya existentes en Core)

### AuthGuard

Protege rutas que requieren autenticación:

```typescript
import { AuthGuard } from '@pwa/core';

const routes: Routes = [
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
];
```

### RoleGuard

Protege rutas por rol específico:

```typescript
import { RoleGuard } from '@pwa/core';

const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [RoleGuard('admin')],
  },
];
```

### PermissionGuard

Protege rutas por permisos específicos:

```typescript
import { PermissionGuard } from '@pwa/core';

const routes: Routes = [
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [PermissionGuard('users:read')],
  },
];
```

## 🔗 Integración con Backend Azure

### Endpoints Utilizados

```typescript
POST / auth / login;
Body: {
  email, password;
}
Response: {
  token, refreshToken, user, expiresIn;
}

POST / auth / register;
Body: {
  email, password, firstName, lastName, phoneNumber;
}
Response: {
  token, refreshToken, user, expiresIn;
}

POST / auth / logout;
Response: {
  message;
}

POST / auth / forgot - password;
Body: {
  email;
}
Response: {
  message;
}

POST / auth / reset - password;
Body: {
  token, password;
}
Response: {
  message;
}

POST / auth / change - password;
Body: {
  currentPassword, newPassword;
}
Response: {
  message;
}

GET / auth / profile;
Response: User;

PUT / auth / profile;
Body: {
  firstName, lastName, phoneNumber, avatarUrl;
}
Response: User;

POST / auth / refresh;
Body: {
  refreshToken;
}
Response: {
  token, refreshToken;
}
```

### Interceptor Multi-Tenant

El sistema usa automáticamente el `authTenantInterceptor` que:

- Añade el header `Authorization: Bearer {token}` automáticamente
- Añade el header `X-Tenant-Id` con el slug del tenant
- Maneja errores 401 (sin autenticación) y 403 (sin permisos)
- Integrado con TenantHeaderInterceptor

## 💾 Gestión de Tokens

### JWT Storage

Los tokens se almacenan en localStorage con prefijo por tenant:

```typescript
// Formato: mtkn_{tenantSlug}
localStorage.setItem('mtkn_tenant1', jwtToken);
```

### Refresh Token

Los refresh tokens se almacenan en localStorage:

```typescript
localStorage.setItem('refresh_token', refreshToken);
```

### Decodificación de JWT

El `AuthService` del core decodifica automáticamente el JWT:

```typescript
interface JwtPayload {
  tenantId: string;
  sub: string; // User ID
  role: string;
  permissions: string[];
  exp: number;
}
```

## 🎨 Diseño UI

### Características

- Gradientes modernos (purple/blue)
- Cards con sombras
- Formularios responsivos
- Animaciones suaves
- Estados de carga con spinners
- Mensajes de error/éxito
- Toggle de visibilidad de contraseñas

### Responsive

- Desktop: layout completo
- Mobile: formularios en columna única
- Breakpoint: 640px

## 📦 Uso en la Aplicación

### 1. Importar Rutas

```typescript
// app.routes.ts
import { featuresAccountRoutes } from '@pwa/features-account';

export const appRoutes: Route[] = [
  {
    path: 'account',
    loadChildren: () => featuresAccountRoutes,
  },
];
```

### 2. Inicializar desde Token Existente

```typescript
// app.component.ts
import { AccountService } from '@pwa/features-account';

export class AppComponent implements OnInit {
  private accountService = inject(AccountService);

  async ngOnInit() {
    await this.accountService.initializeFromToken();
  }
}
```

### 3. Usar Estado de Autenticación

```typescript
import { AccountService } from '@pwa/features-account';

export class HeaderComponent {
  private accountService = inject(AccountService);

  get user() {
    return this.accountService.state().user;
  }

  get isAuthenticated() {
    return this.accountService.state().isAuthenticated;
  }

  get isLoading() {
    return this.accountService.state().isLoading;
  }
}
```

### 4. Proteger Rutas

```typescript
import { AuthGuard, RoleGuard } from '@pwa/core';

const routes: Routes = [
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, RoleGuard('admin')],
  },
];
```

## 🔄 Flujo de Autenticación

### Login

1. Usuario completa formulario
2. `AccountService.login()` llama a `/auth/login`
3. Backend retorna token + user
4. Token se guarda en `AuthService.setToken()`
5. User se guarda en estado signal
6. Redirect a home

### Registro

1. Usuario completa formulario con validaciones
2. `AccountService.register()` llama a `/auth/register`
3. Backend crea usuario y retorna token
4. Auto-login automático
5. Redirect a home

### Refresh Token

1. Token expira (detectado en interceptor)
2. `AccountService.refreshToken()` se llama automáticamente
3. Backend valida refreshToken y emite nuevo token
4. Token actualizado en `AuthService`
5. Request original se reintenta

### Logout

1. Usuario hace click en "Cerrar Sesión"
2. `AccountService.logout()` llama a `/auth/logout`
3. Token y refresh token se eliminan
4. Estado se resetea
5. Redirect a home

## ✅ Validaciones Implementadas

### Login

- Email requerido y válido
- Contraseña requerida (mínimo 6 caracteres)

### Registro

- Nombre y apellido requeridos
- Email requerido y válido
- Teléfono opcional
- Contraseña mínimo 6 caracteres
- Confirmar contraseña debe coincidir
- Términos y condiciones requeridos

### Cambio de Contraseña

- Contraseña actual requerida
- Nueva contraseña mínimo 6 caracteres
- Confirmar nueva contraseña debe coincidir

### Actualización de Perfil

- Nombre y apellido requeridos
- Email no se puede cambiar
- Teléfono opcional

## 🧪 Testing

### Tests Pendientes

```bash
# AccountService
- login success
- login failure
- register success
- register failure
- logout
- getProfile
- updateProfile
- changePassword
- refreshToken

# Components
- LoginComponent form validation
- RegisterComponent password match
- ProfileComponent edit mode
- ForgotPasswordComponent email validation
```

## ✅ Estado de Implementación

### Completado

1. ✅ Modelos, servicios, componentes de autenticación
2. ✅ Rutas integradas en app.routes.ts
3. ✅ AccountService inicializado en app.ts
4. ✅ Header con estado de autenticación (usuario, menú, logout)
5. ✅ Guards aplicados a rutas protegidas (orders, checkout, admin, profile)
6. ✅ Protección por roles (admin, superadmin)

### Pendiente

1. ⏳ Tests unitarios para AccountService y componentes
2. ⏳ E2E tests con Playwright
3. ⏳ Verificar integración con backend Azure real
4. ⏳ Implementar reset password component (con token en URL)
5. ⏳ Avatar upload functionality
6. ⏳ Email verification flow
7. ⏳ Two-factor authentication
8. ⏳ Remember me con cookies seguras

## 🚀 Cómo Probar

### 1. Iniciar la aplicación

```bash
npm start
# o
npx nx serve pwa
```

### 2. Navegación

- **Home**: http://localhost:4200
- **Login**: http://localhost:4200/account/login
- **Registro**: http://localhost:4200/account/register
- **Perfil**: http://localhost:4200/account/profile (requiere auth)
- **Órdenes**: http://localhost:4200/orders (requiere auth)

### 3. Flujo de Prueba

1. **Registro**:

   - Ir a /account/register
   - Completar formulario
   - Se crea usuario y auto-login
   - Redirección a home con usuario logueado

2. **Login**:

   - Ir a /account/login
   - Ingresar credenciales
   - Marcar "Recordarme" para persistir sesión
   - Ver nombre de usuario en header

3. **Header Interactivo**:

   - Ver nombre del usuario en desktop
   - Click en botón de usuario
   - Ver menú desplegable: Mi Perfil, Mis Pedidos, Cerrar Sesión

4. **Perfil**:

   - Click en "Mi Perfil"
   - Ver información del usuario
   - Editar datos (nombre, apellido, teléfono)
   - Cambiar contraseña
   - Cerrar sesión

5. **Guards**:

   - Sin login, intentar acceder /orders → redirect a /account/login
   - Sin login, intentar acceder /checkout → redirect a /account/login
   - Sin rol admin, intentar acceder /admin → sin acceso
   - Sin rol superadmin, intentar acceder /superadmin → sin acceso

6. **Refresh Token** (si backend lo implementa):
   - Login con "Recordarme"
   - Cerrar tab/navegador
   - Reabrir aplicación
   - Usuario sigue logueado automáticamente

## 📚 Dependencias

- `@angular/core`: ^20.3.0
- `@angular/forms`: ^20.3.0
- `@angular/router`: ^20.3.0
- `rxjs`: ^7.8.0
- `@pwa/core`: workspace:\* (ApiClientService, AuthService)

## 🔍 Troubleshooting

### Token no se persiste

Verificar que `TenantBootstrapService.init()` se ejecuta antes que `AccountService.initializeFromToken()`

### Errores 401/403

Verificar que `authTenantInterceptor` está registrado en providers

### Guards no funcionan

Verificar que `AuthService.init(tenantSlug)` se ejecuta en app initialization

### Refresh token no funciona

Verificar que el backend implementa `/auth/refresh` correctamente

---

**Autor**: GitHub Copilot  
**Fecha**: 14 de noviembre de 2025  
**Versión**: 1.0.0
