# Auditoría Frontend Multitenant eCommerce

## Resumen ejecutivo

El frontend actual es un monorepo Nx con Angular `20.3.x`, `bootstrapApplication`, routing standalone, lazy loading por features y una capa `core/shared/features*` que ya adopta varias prácticas modernas, pero con mezcla relevante de responsabilidades. La app está mejor preparada para una migración incremental que para una reescritura.

El soporte multi-tenant es parcial: existe resolución por subdominio con fallback por `?tenant=` o `?store=`, carga de configuración por tenant y cierto namespacing de storage, pero no hay flujo real para `dominio.com` como landing, no hay resolución server-side del tenant y conviven dos estrategias de bootstrap/tenant sin consolidar.

Para Angular 21, la base técnica es razonable: builder moderno, standalone, strict templates, Material 20, Signals y hydration configurada. Los principales bloqueos no están en Angular puro sino en la deuda de SSR, runtime config, testing e interceptors duplicados.

Los riesgos principales detectados son: SSR presente pero desactivado en despliegue, prerender sin rutas efectivas, runtime config realmente build-time, localStorage para tokens, PWA/data cache no alineado con URLs reales del backend, E2E con configuración inconsistente y arquitectura con código activo mezclado con código legado no conectado.

Recomendación final: **preparar primero y migrar por fases**. No recomiendo saltar directo a Angular 21 hasta cerrar una Fase 0 y una Fase 1 de estabilización.

Validación ejecutada en esta auditoría: `npm run build:prod:browser` compiló correctamente. No ejecuté unit tests ni e2e.

## Arquitectura actual detectada

`angular.json`: **No evidenciado**. El workspace usa Nx con configuración por proyecto en [apps/pwa/project.json](apps/pwa/project.json#L1).

### Inventario técnico real del proyecto

| Área                   | Archivo(s) revisados                                                                                                                                                                                                                                                                                                                                                                                                                                           | Estado actual                                                   | Observaciones                                                                                                    | Riesgo |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| Angular version actual | [package.json](package.json#L1)                                                                                                                                                                                                                                                                                                                                                                                                                                | `20.3.x`                                                        | Core, CLI, compiler, SSR y service worker están alineados en Angular 20                                          | Medio  |
| TypeScript             | [package.json](package.json#L1)<br>[apps/pwa/tsconfig.json](apps/pwa/tsconfig.json#L1)                                                                                                                                                                                                                                                                                                                                                                         | `5.9.2`                                                         | Configuración estricta en app/libs; el base global conserva defaults antiguos pero la app los sobreescribe       | Medio  |
| RxJS                   | [package.json](package.json#L1)                                                                                                                                                                                                                                                                                                                                                                                                                                | `7.8.0`                                                         | Uso mixto con Signals y Observables                                                                              | Bajo   |
| Node esperado          | [package.json](package.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                                                                                                                                                                                                                                                     | **No evidenciado**                                              | No hay `engines`, `.nvmrc` ni `.node-version`; CI usa `lts/*`; existe `@types/node` `18.16.9`                    | Alto   |
| Builder usado          | [apps/pwa/project.json](apps/pwa/project.json#L1)                                                                                                                                                                                                                                                                                                                                                                                                              | `@angular/build:application`                                    | Builder moderno, buen punto de partida para Angular 21                                                           | Bajo   |
| SSR                    | [apps/pwa/src/main.server.ts](apps/pwa/src/main.server.ts#L1)<br>[apps/pwa/src/server.ts](apps/pwa/src/server.ts#L1)<br>[apps/pwa/src/app/app.config.server.ts](apps/pwa/src/app/app.config.server.ts#L1)<br>[apps/pwa/project.json](apps/pwa/project.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                      | Presente en código, no operativo en despliegue actual           | CI fuerza build browser-only y deja nota explícita para “volver a SSR” después de corregir `NG0201`              | Alto   |
| Hydration              | [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)                                                                                                                                                                                                                                                                                                                                                                                            | Habilitada                                                      | `provideClientHydration(withEventReplay())` existe, pero su valor real es limitado sin SSR/prerender efectivo    | Medio  |
| PWA/service worker     | [apps/pwa/project.json](apps/pwa/project.json#L1)<br>[apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1)<br>[apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)                                                                                                                                                                                                                                                                          | Activo en builds productivos                                    | La configuración existe, pero los `dataGroups` no coinciden con las URLs reales absolutas del backend            | Alto   |
| Routing                | [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)                                                                                                                                                                                                                                                                                                                                                                                            | Standalone con shell principal                                  | Se separa público, `tenant-admin` y `admin` por path                                                             | Medio  |
| Lazy loading           | [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)<br>[features/src/lib/catalog/catalog.routes.ts](features/src/lib/catalog/catalog.routes.ts#L1)<br>[features-admin/src/lib/lib.routes.ts](features-admin/src/lib/lib.routes.ts#L1)<br>[features-superadmin/src/lib/admin.routes.ts](features-superadmin/src/lib/admin.routes.ts#L1)                                                                                                         | Sí                                                              | `loadChildren` y `loadComponent` ampliamente usados                                                              | Bajo   |
| Standalone components  | [apps/pwa/src/main.ts](apps/pwa/src/main.ts#L1)<br>[apps/pwa/src/app/app.ts](apps/pwa/src/app/app.ts#L1)                                                                                                                                                                                                                                                                                                                                                       | Sí                                                              | No encontré evidencia de `@NgModule` activo                                                                      | Bajo   |
| Signals                | [apps/pwa/src/app/app.ts](apps/pwa/src/app/app.ts#L1)<br>[core/src/lib/services/tenant-context.service.ts](core/src/lib/services/tenant-context.service.ts#L1)<br>[shared/src/lib/layout/public-layout/public-layout.component.ts](shared/src/lib/layout/public-layout/public-layout.component.ts#L1)                                                                                                                                                          | Uso extendido                                                   | Señales y `computed`/`effect` ya forman parte del estado local                                                   | Bajo   |
| RxJS/state             | [core/src/lib/services/tenant-bootstrap.service.ts](core/src/lib/services/tenant-bootstrap.service.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                                                                                                                                                                                                   | Mixto                                                           | No hay store central tipo NgRx; el estado está repartido entre servicios con Signals y algo de `BehaviorSubject` | Medio  |
| HTTP interceptors      | [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)<br>[core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1)<br>[core/src/lib/interceptors/tenant-header.interceptor.ts](core/src/lib/interceptors/tenant-header.interceptor.ts#L1)                                                                                                                                                                  | 1 interceptor funcional activo, 1 interceptor de clase inactivo | Hay dos estrategias de tenant/header coexistiendo                                                                | Alto   |
| Auth                   | [core/src/lib/auth/auth.service.ts](core/src/lib/auth/auth.service.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                                                                                                                                                                                                                                   | JWT bearer en `localStorage`                                    | Hay refresh token en servicio, pero no vi orquestación automática global                                         | Alto   |
| Guards                 | [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)<br>[core/src/lib/auth/guards/auth.guard.ts](core/src/lib/auth/guards/auth.guard.ts#L1)<br>[core/src/lib/auth/guards/role.guard.ts](core/src/lib/auth/guards/role.guard.ts#L1)<br>[features-superadmin/src/lib/guards/admin-permission.guard.ts](features-superadmin/src/lib/guards/admin-permission.guard.ts#L1)                                                                           | Funcionales                                                     | Estilo moderno y consistente                                                                                     | Bajo   |
| Tenant resolution      | [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1)<br>[core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1)                                                                                                                                                                                                                                             | Subdominio primero, query fallback                              | No modela landing root y no resuelve tenant server-side                                                          | Alto   |
| Runtime config         | [apps/pwa/src/environments/environment.ts](apps/pwa/src/environments/environment.ts#L1)<br>[scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)<br>[core/src/lib/config/app-env-initializer.ts](core/src/lib/config/app-env-initializer.ts#L1)                                                                                                                                                                                                          | Build-time                                                      | No es runtime config real; Vercel genera un `.ts` antes del build                                                | Alto   |
| Environment config     | [apps/pwa/src/environments/environment.ts](apps/pwa/src/environments/environment.ts#L1)<br>[apps/pwa/src/environments/environment.dev.ts](apps/pwa/src/environments/environment.dev.ts#L1)<br>[apps/pwa/src/environments/environment.qa.ts](apps/pwa/src/environments/environment.qa.ts#L1)<br>[apps/pwa/src/environments/environment.prod.ts](apps/pwa/src/environments/environment.prod.ts#L1)                                                               | 4 archivos TS                                                   | `environment.runtime.ts` no está versionado; se genera durante build Vercel                                      | Medio  |
| Assets/images          | [apps/pwa/public/manifest.webmanifest](apps/pwa/public/manifest.webmanifest#L1)<br>[core/src/lib/pwa/dynamic-pwa-assets.service.ts](core/src/lib/pwa/dynamic-pwa-assets.service.ts#L1)<br>[features-admin/src/lib/services/category.service.ts](features-admin/src/lib/services/category.service.ts#L1)<br>[core/src/lib/services/product.service.ts](core/src/lib/services/product.service.ts#L1)                                                             | Assets públicos + CDN + multipart upload                        | No vi `NgOptimizedImage`; branding PWA se aplica por DOM runtime                                                 | Medio  |
| Error handling         | [core/src/lib/errors/global-error-handler.ts](core/src/lib/errors/global-error-handler.ts#L1)<br>[core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1)<br>[shared/src/lib/utils/snackbar-config.ts](shared/src/lib/utils/snackbar-config.ts#L1)                                                                                                                                                                        | Mínimo y fragmentado                                            | `GlobalErrorHandler` solo loguea; componentes resuelven mensajes por helper                                      | Alto   |
| Loader global          | [shared/src/lib/ui/loader/loader.component.ts](shared/src/lib/ui/loader/loader.component.ts#L1)                                                                                                                                                                                                                                                                                                                                                                | **Brecha detectada**                                            | El componente existe, pero no encontré evidencia de uso global                                                   | Medio  |
| Toasts                 | [shared/src/lib/services/toast.service.ts](shared/src/lib/services/toast.service.ts#L1)<br>[shared/src/lib/ui/toast-container/toast-container.component.ts](shared/src/lib/ui/toast-container/toast-container.component.ts#L1)                                                                                                                                                                                                                                 | Existe toast propio                                             | Coexiste con mucho `MatSnackBar` en admin/superadmin                                                             | Medio  |
| Forms                  | [features-account/src/lib/components/login/login.component.ts](features-account/src/lib/components/login/login.component.ts#L1)<br>[features-account/src/lib/components/register/register.component.ts](features-account/src/lib/components/register/register.component.ts#L1)<br>[features-admin/src/lib/pages/categories/categories-form/category-form.component.ts](features-admin/src/lib/pages/categories/categories-form/category-form.component.ts#L19) | `ReactiveForms`                                                 | Validación y UX manejadas bastante por componente                                                                | Medio  |
| UI library             | [package.json](package.json#L1)<br>[features-admin/src/lib/pages/categories/categories-list/categories-list.component.ts](features-admin/src/lib/pages/categories/categories-list/categories-list.component.ts#L11)                                                                                                                                                                                                                                            | Angular Material + UI propia                                    | Material está muy presente en backoffice                                                                         | Medio  |
| Testing                | [jest.config.ts](jest.config.ts#L1)<br>[apps/pwa/jest.config.ts](apps/pwa/jest.config.ts#L1)<br>[apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1)<br>[apps/pwa-e2e/project.json](apps/pwa-e2e/project.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                                              | Jest y Playwright presentes                                     | E2E no maduro: CI tolera fallo y `webServer` usa `pwa:serve` en vez de `ecommerce:serve`                         | Alto   |
| Linting                | [eslint.config.mjs](eslint.config.mjs#L1)<br>[nx.json](nx.json#L1)                                                                                                                                                                                                                                                                                                                                                                                             | ESLint flat + Nx                                                | Las fronteras de módulo son muy permisivas (`* -> *`)                                                            | Medio  |
| Build/deploy           | [apps/pwa/project.json](apps/pwa/project.json#L1)<br>[vercel.json](vercel.json#L1)                                                                                                                                                                                                                                                                                                                                                                             | Build estático en Vercel                                        | Deep links SPA cubiertos por rewrites; SSR no desplegado                                                         | Medio  |
| CI/CD si existe        | [.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                                                                                                                                                                                                                                                                                        | Sí, GitHub Actions                                              | Lint + test + e2e tolerado + build browser-only + Lighthouse opcional                                            | Medio  |

### 3.1 Capas actuales

| Capa actual           | Propósito real actual                                                          | Ejemplos de archivos                                                                                                                                                                                                                                                                                                        | Uso actual              | Problemas detectados                                                              |
| --------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| `apps/pwa`            | Shell de arranque, configuración, SSR y PWA entrypoints                        | [apps/pwa/src/main.ts](apps/pwa/src/main.ts#L1)<br>[apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)<br>[apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)                                                                                                                               | Correcto para bootstrap | Shell delgada, pero con providers que dependen de librerías internas heterogéneas |
| `core`                | Cross-cutting, auth, tenant, http, pwa, config, modelos y servicios de negocio | [core/src/index.ts](core/src/index.ts#L1)<br>[core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1)<br>[core/src/lib/services/product.service.ts](core/src/lib/services/product.service.ts#L1)                                                                                 | Muy cargada             | Mezcla infraestructura, dominio, estado, rutas de error y utilidades PWA          |
| `shared`              | Layouts, UI reusable, toasts, dialogs, componentes visuales                    | [shared/src/index.ts](shared/src/index.ts#L1)<br>[shared/src/lib/layout/public-layout/public-layout.component.ts](shared/src/lib/layout/public-layout/public-layout.component.ts#L1)<br>[shared/src/lib/ui/toast-container/toast-container.component.ts](shared/src/lib/ui/toast-container/toast-container.component.ts#L1) | Activa                  | También contiene layouts no usados y lógica de tema/DOM duplicada                 |
| `features`            | Storefront público: catálogo y loyalty                                         | [features/src/index.ts](features/src/index.ts#L1)<br>[features/src/lib/catalog/catalog.routes.ts](features/src/lib/catalog/catalog.routes.ts#L1)<br>[features/src/lib/lib.routes.ts](features/src/lib/lib.routes.ts#L1)                                                                                                     | Activa                  | Mezcla catálogo + loyalty bajo una sola librería                                  |
| `features-account`    | Login, register, profile y servicios de cuenta                                 | [features-account/src/index.ts](features-account/src/index.ts#L1)<br>[features-account/src/lib/lib.routes.ts](features-account/src/lib/lib.routes.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                 | Activa                  | El estado/auth del feature cruza con `core/auth`                                  |
| `features-orders`     | Pedido/ordenes del cliente                                                     | [features-orders/src/index.ts](features-orders/src/index.ts#L1)<br>[features-orders/src/lib/lib.routes.ts](features-orders/src/lib/lib.routes.ts#L1)                                                                                                                                                                        | Activa pero mínima      | La librería parece mucho más delgada que el resto; revisar cohesión futura        |
| `features-admin`      | Backoffice por tenant                                                          | [features-admin/src/index.ts](features-admin/src/index.ts#L1)<br>[features-admin/src/lib/lib.routes.ts](features-admin/src/lib/lib.routes.ts#L1)                                                                                                                                                                            | Muy activa              | Librería grande, muchas páginas/servicios y UX inconsistente de errores           |
| `features-superadmin` | Administración general de plataforma/tenants                                   | [features-superadmin/src/index.ts](features-superadmin/src/index.ts#L1)<br>[features-superadmin/src/lib/admin.routes.ts](features-superadmin/src/lib/admin.routes.ts#L1)                                                                                                                                                    | Activa                  | Mezcla páginas placeholder, guards, modelos y servicios en la misma capa          |
| `environments`        | Configuración de ambiente compilada                                            | [apps/pwa/src/environments/environment.ts](apps/pwa/src/environments/environment.ts#L1)                                                                                                                                                                                                                                     | Activa                  | No es runtime config real                                                         |
| `scripts`             | Automatización de build/deploy y verificaciones                                | [scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)                                                                                                                                                                                                                                                                 | Activa                  | Parte del despliegue depende de scripts custom no cubiertos por CI principal      |

**Capas no separadas de forma explícita**

- `data-access`: **Brecha detectada**. No hay librería dedicada; los servicios HTTP están repartidos entre `core` y `features-*`.
- `domain/models`: Parcial. Existen modelos en varias libs, pero no como capa estable separada.
- `infrastructure`: **Brecha detectada**. Se mezcla con `core/http`, `core/config`, `core/pwa`.
- `config` como capa de runtime: **Brecha detectada**.
- `utils/helpers`: Existe en piezas sueltas, no como capa consistente.

### Brechas detectadas

- Landing/corporativo para `dominio.com`: **Brecha detectada**. El router principal no modela un flujo público sin tenant; el `tenantGuard` termina llevando al usuario hacia `/admin` cuando no hay tenant.
- Rutas de error de tenant: **Brecha detectada**. [core/src/lib/routes/tenant-error.routes.ts](core/src/lib/routes/tenant-error.routes.ts#L1) exporta rutas, pero no vi evidencia de montaje en [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1).
- Bootstrap alternativo de tenant: **Brecha detectada**. [core/src/lib/providers/tenant-bootstrap.provider.ts](core/src/lib/providers/tenant-bootstrap.provider.ts#L1) y [core/src/lib/providers/tenant-app-initializer.provider.ts](core/src/lib/providers/tenant-app-initializer.provider.ts#L1) existen, pero no están conectados en [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1).
- Global loader por HTTP: **Brecha detectada**.
- Store central formal: **No evidenciado**.
- Resolvers: **No evidenciado**.
- Favoritos tenant-scoped: **No evidenciado**.
- Runtime config cargado por JSON público validado al inicio: **Brecha detectada**.
- SSR tenant-aware por request: **Brecha detectada**.
- Política de headers de seguridad web en deploy: CSP, HSTS, `frame-ancestors`, etc.: **No evidenciado** en [vercel.json](vercel.json#L1).

### Dudas técnicas antes de implementar

1. ¿`dominio.com` debe ser landing corporativo real, selector de tenant, redirección a admin o página informativa? Hoy ese caso no está modelado explícitamente.
2. ¿El fallback por query param (`?tenant=`) seguirá permitido en producción o debe quedar restringido a local/QA? Esta decisión cambia cache, storage y seguridad.
3. ¿La meta de negocio incluye volver a SSR real por tenant o el despliegue productivo seguirá estático/PWA? Hoy el repo contiene ambos caminos y eso genera deuda.
4. ¿Backend puede migrar auth a cookies `HttpOnly` por subdominio, o el contrato obliga a seguir con bearer token en `localStorage`?
5. ¿`qa` debe usar backend dedicado? Hoy [apps/pwa/src/environments/environment.qa.ts](apps/pwa/src/environments/environment.qa.ts#L1) mantiene un `TODO` y apunta a la URL Azure actual.
6. ¿Superadmin y tenant-admin deben seguir conviviendo en la misma SPA o conviene separar shells y políticas de seguridad a futuro?

## Flujo actual de la aplicación

### 3.2 Flujo actual de arranque

- [apps/pwa/src/main.ts](apps/pwa/src/main.ts#L1) usa `bootstrapApplication(App, appConfig)`.
- [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1) registra hydration, zone change detection, router, HttpClient con `fetch`, Transloco, `APP_ENV`, `APP_INITIALIZER`, `ErrorHandler` y service worker.
- El primer `APP_INITIALIZER` usa [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1) para resolver tenant y luego [core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1) para cargar configuración.
- El segundo `APP_INITIALIZER` aplica SEO, tema, manifest, logger, auth, modo de usuario e inicializa push solo en browser.
- [apps/pwa/src/app/app.ts](apps/pwa/src/app/app.ts#L1) escucha branding y aplica assets PWA dinámicos desde [core/src/lib/pwa/dynamic-pwa-assets.service.ts](core/src/lib/pwa/dynamic-pwa-assets.service.ts#L1).
- El template raíz [apps/pwa/src/app/app.html](apps/pwa/src/app/app.html#L1) solo contiene `router-outlet` más el banner iOS.
- En servidor, [apps/pwa/src/app/app.config.server.ts](apps/pwa/src/app/app.config.server.ts#L1) añade `provideServerRendering`, pero el build/deploy actual no consume este camino de forma efectiva.

### 3.3 Flujo actual de navegación

- [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1) define tres segmentos principales:
  - Storefront público bajo `''` con [shared/src/lib/layout/public-layout/public-layout.component.ts](shared/src/lib/layout/public-layout/public-layout.component.ts#L1) y `tenantGuard`.
  - Superadmin bajo `/admin`.
  - Tenant admin bajo `/tenant-admin` con [shared/src/lib/layouts/tenant-admin-layout/tenant-admin-layout.component.ts](shared/src/lib/layouts/tenant-admin-layout/tenant-admin-layout.component.ts#L1), `AuthGuard` y `EmployeeGuard`.
- Hay lazy loading real hacia catálogo, account, orders, admin y superadmin.
- La protección de rutas privadas se basa en guards funcionales:
  - [core/src/lib/auth/guards/auth.guard.ts](core/src/lib/auth/guards/auth.guard.ts#L1)
  - [core/src/lib/auth/guards/role.guard.ts](core/src/lib/auth/guards/role.guard.ts#L1)
  - [features-superadmin/src/lib/guards/admin-permission.guard.ts](features-superadmin/src/lib/guards/admin-permission.guard.ts#L1)
- El fallback `**` redirige a `''`; no hay 404 funcional dedicado en el router principal.
- Las rutas de error de tenant existen en [core/src/lib/routes/tenant-error.routes.ts](core/src/lib/routes/tenant-error.routes.ts#L1), pero no están montadas en el router principal.
- En despliegue estático, los deep links SPA están cubiertos por rewrites en [vercel.json](vercel.json#L1). Para SSR real, esa cobertura no está evidenciada porque SSR no está desplegado.

### 3.4 Flujo actual de HTTP

- [core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1) construye URLs absolutas a partir de `environment.apiBaseUrl`.
- El interceptor activo es [core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1):
  - añade `Authorization` si existe token,
  - añade `X-Tenant-Slug`,
  - y agrega `?tenant=` como fallback para endpoints tenant-scoped.
- El interceptor de clase [core/src/lib/interceptors/tenant-header.interceptor.ts](core/src/lib/interceptors/tenant-header.interceptor.ts#L1) existe, pero no vi evidencia de registro efectivo en [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1).
- En `401`, el interceptor limpia auth y redirige a login tenant-aware o admin según contexto.
- No encontré refresh token automático a nivel interceptor. [features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1) implementa `refreshToken()`, pero no vi orquestación automática.
- `timeout` está declarado en `defaultOptions` de [core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1), pero **no se aplica** con un operador real.
- Retry seguro: **No evidenciado**.
- Cancelación centralizada: **No evidenciado**.
- Loader global conectado al ciclo HTTP: **No evidenciado**.
- Los mensajes al usuario se resuelven por componente con `ToastService` o `MatSnackBar`; no hay política unificada.

### 3.5 Diagrama textual de flujo actual

```text
Request navegador
-> Vercel rewrite a /index.html
-> main.ts
-> bootstrapApplication(App, appConfig)
-> APP_ENV_INITIALIZER
-> TenantResolutionService.resolveTenant()
-> TenantConfigService.load()
-> Theme/SEO/Manifest/Auth/UserMode init
-> Router
-> PublicLayout o TenantAdminLayout o AdminShell
-> Feature lazy route
-> ApiClientService.buildFullUrl()
-> authTenantInterceptor
-> Backend API
```

Camino SSR teórico actual:

```text
Request servidor
-> server.ts / AngularNodeAppEngine
-> main.server.ts
-> app.config.server.ts
-> provideServerRendering(withRoutes(serverRoutes))
-> serverRoutes = prerender "**"
-> build/deploy actual no usa este camino en producción
```

## Multi-tenant actual

- **Resolución del tenant**: [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1) prioriza subdominio y luego query param `tenant` o `store`.
- **Contexto admin**: el mismo resolver trata `admin`, `localhost`, `dev`, `staging`, etc. como etiquetas reservadas.
- **Dónde se guarda el tenant actual**: en memoria reactiva dentro de [core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1) y [core/src/lib/services/tenant-context.service.ts](core/src/lib/services/tenant-context.service.ts#L1).
- **Cómo afecta API base URL**: la `apiBaseUrl` es global por ambiente; el tenant viaja por `X-Tenant-Slug` y a veces por query param.
- **Cómo afecta branding**: se aplica por runtime en tema, favicon, manifest, SEO y ciertos layouts desde:
  - [core/src/lib/services/theme.service.ts](core/src/lib/services/theme.service.ts#L1)
  - [core/src/lib/services/manifest.service.ts](core/src/lib/services/manifest.service.ts#L1)
  - [core/src/lib/services/seo.service.ts](core/src/lib/services/seo.service.ts#L1)
  - [core/src/lib/pwa/dynamic-pwa-assets.service.ts](core/src/lib/pwa/dynamic-pwa-assets.service.ts#L1)
- **Cómo afecta cache/PWA**: por subdominio hay aislamiento natural de origin. Con query param en mismo host, el service worker y caches del origin no quedan aislados por tenant.
- **Cómo afecta token/session**:
  - token principal: `mtkn_{tenantSlug}` y `superadmin_token` en [core/src/lib/auth/auth.service.ts](core/src/lib/auth/auth.service.ts#L1)
  - refresh token: `TenantStorageService` con scope tenant/global en [features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)
  - carrito público: `public_cart_session_id_{tenant}` en [core/src/lib/services/public-cart-ui.service.ts](core/src/lib/services/public-cart-ui.service.ts#L1)
  - modo de usuario: `user_mode_{tenant}` o global en [core/src/lib/services/user-mode.service.ts](core/src/lib/services/user-mode.service.ts#L1)
  - push token: `push_{slug}` en [core/src/lib/push/push.service.ts](core/src/lib/push/push.service.ts#L1)
  - banner PWA iOS: **global**, no tenant-scoped, en [core/src/lib/pwa/pwa-install.service.ts](core/src/lib/pwa/pwa-install.service.ts#L1)
- **Aislamiento real entre tenants**: parcial. Storage y carrito tienen namespacing en varios casos, pero no hay una política única obligatoria y el fallback por query param reduce aislamiento.
- **Landing sin tenant**: **Brecha detectada**. Hoy el flujo principal acaba en `/admin`.
- **Favoritos**: **No evidenciado**.
- **Riesgo de cruce de datos entre tenants**:
  - Medio en subdominios reales.
  - Alto si se usa query fallback en el mismo host con PWA/service worker y claves no unificadas.

## SSR/PWA actual

### SSR actual

- SSR existe en código:
  - [apps/pwa/src/main.server.ts](apps/pwa/src/main.server.ts#L1)
  - [apps/pwa/src/server.ts](apps/pwa/src/server.ts#L1)
  - [apps/pwa/src/app/app.config.server.ts](apps/pwa/src/app/app.config.server.ts#L1)
  - [apps/pwa/src/app/app.routes.server.ts](apps/pwa/src/app/app.routes.server.ts#L1)
- El build principal en [apps/pwa/project.json](apps/pwa/project.json#L1) está en `outputMode: "static"`.
- CI confirma la decisión operativa actual: [.github/workflows/ci.yml](.github/workflows/ci.yml#L1) usa build browser-only y deja pendiente reactivar SSR.
- Hydration está encendida, pero su beneficio real queda degradado porque el despliegue productivo actual es estático.
- El archivo generado por el build [dist/apps/ecommerce/prerendered-routes.json](dist/apps/ecommerce/prerendered-routes.json#L1) quedó con `"routes": {}`, lo que evidencia prerender inefectivo hoy.
- Riesgo SSR multi-tenant: [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1) depende de `DOCUMENT`/URL del browser y no resuelve tenant en servidor. Por tanto, el tenant no está preparado para render server-side real por request.

### PWA/cache actual

- [apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1) define `assetGroups` para shell y assets estáticos.
- El service worker se registra desde [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1) y se activa en builds productivos.
- Los `dataGroups` configurados son `/public/config` y `/catalog/**`, pero el cliente HTTP usa URLs absolutas al backend desde [core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1). Resultado: la cache de datos del SW no está alineada con el tráfico real.
- Los assets PWA de branding se modifican dinámicamente por DOM/Blob desde [core/src/lib/pwa/dynamic-pwa-assets.service.ts](core/src/lib/pwa/dynamic-pwa-assets.service.ts#L1), mientras [apps/pwa/public/manifest.webmanifest](apps/pwa/public/manifest.webmanifest#L1) sigue siendo genérico.
- El banner iOS y su dismiss son globales, no por tenant.
- Recomendación actual: no endurecer PWA multi-tenant antes de definir si producción será exclusivamente por subdominio o si seguirá admitiendo query fallback.

## Runtime config actual

- El estado actual **no es runtime config real**.
- La app usa `environment.ts` compilado por ambiente:
  - [apps/pwa/src/environments/environment.ts](apps/pwa/src/environments/environment.ts#L1)
  - [apps/pwa/src/environments/environment.dev.ts](apps/pwa/src/environments/environment.dev.ts#L1)
  - [apps/pwa/src/environments/environment.qa.ts](apps/pwa/src/environments/environment.qa.ts#L1)
  - [apps/pwa/src/environments/environment.prod.ts](apps/pwa/src/environments/environment.prod.ts#L1)
- Para Vercel existe una variante build-time en [scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1) que genera `environment.runtime.ts` antes de compilar.
- Ese archivo generado **no está versionado** en el repo. No es una falla por sí misma, pero sí confirma que la app no lee config pública en runtime.
- [core/src/lib/config/app-env-initializer.ts](core/src/lib/config/app-env-initializer.ts#L1) valida y loguea, pero **no bloquea el arranque** si falta config crítica.
- Hay un detalle operativo importante:
  - `npm start` usa `serve:development` desde [package.json](package.json#L1) y [apps/pwa/project.json](apps/pwa/project.json#L1).
  - Ese `development` no reemplaza `environment.ts`.
  - Hasta antes del Lote B, el arranque local por defecto caía en `mockApi: true`; tras Lote B el contrato quedó alineado y el flujo normal usa backend real en todos los ambientes.
- En [apps/pwa/public/config/tenants/README.md](apps/pwa/public/config/tenants/README.md#L1) los JSON locales quedaron documentados como soporte aislado de debugging, fuera del runtime principal: **deuda histórica contenida**.

## HTTP/Auth/Error handling actual

- `ApiClientService` es el wrapper base, pero no representa un estándar de plataforma completo todavía.
- El interceptor funcional activo combina auth y tenant en una sola pieza: [core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1).
- Existe otra solución de tenant headers exportada pero no conectada: [core/src/lib/interceptors/tenant-header.interceptor.ts](core/src/lib/interceptors/tenant-header.interceptor.ts#L1).
- Auth actual:
  - JWT bearer en `localStorage`
  - parsing local de claims con `atob`
  - refresh token guardado por `TenantStorageService`
  - logout limpia carrito público y refresh token
- Error handling actual:
  - global: [core/src/lib/errors/global-error-handler.ts](core/src/lib/errors/global-error-handler.ts#L1) solo delega a `LoggerService`
  - por componente: [shared/src/lib/utils/snackbar-config.ts](shared/src/lib/utils/snackbar-config.ts#L1) extrae mensajes
  - UX: mezcla `ToastService` y `MatSnackBar`
- Loader actual:
  - componente existe en [shared/src/lib/ui/loader/loader.component.ts](shared/src/lib/ui/loader/loader.component.ts#L1)
  - integración global con HTTP: **No evidenciado**
- Seguridad:
  - localStorage para access token y refresh token implica riesgo XSS
  - no vi headers CSP/HSTS en [vercel.json](vercel.json#L1)
- Performance:
  - build baseline dejó un bundle inicial de aproximadamente `994 kB` raw, muy cerca del warning budget configurado en [apps/pwa/project.json](apps/pwa/project.json#L1)

## Deuda técnica

| ID    | Deuda técnica                                            | Evidencia                                                                                                                                                                                                                                                                                         | Impacto                                                              | Prioridad     | Recomendación                                                                           |
| ----- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| DT-01 | SSR y despliegue productivo están divergidos             | [apps/pwa/src/server.ts](apps/pwa/src/server.ts#L1)<br>[apps/pwa/project.json](apps/pwa/project.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                               | Duplica caminos y vuelve incierta la migración de Angular 21 con SSR | P0 bloqueante | Elegir explícitamente si Fase 3 migra solo browser build o si primero se restablece SSR |
| DT-02 | Resolución de tenant no preparada para SSR real          | [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1)<br>[core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1)                                                                                | Impide render server-side por tenant y rompe SEO/branding SSR        | P0 bloqueante | Diseñar tenant resolution por request antes de reactivar SSR                            |
| DT-03 | Coexisten dos estrategias de bootstrap/tenant            | [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)<br>[core/src/lib/services/tenant-bootstrap.service.ts](core/src/lib/services/tenant-bootstrap.service.ts#L1)<br>[core/src/lib/providers/tenant-bootstrap.provider.ts](core/src/lib/providers/tenant-bootstrap.provider.ts#L1) | Confusión, código dormido y alto costo de mantenimiento              | P1 alta       | Consolidar en una sola estrategia y retirar la otra                                     |
| DT-04 | No existe flujo root/landing sin tenant                  | [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)<br>[core/src/lib/routes/tenant-error.routes.ts](core/src/lib/routes/tenant-error.routes.ts#L1)                                                                                                                                | `dominio.com` no está modelado; experiencia y SEO limitados          | P1 alta       | Definir explícitamente landing, selector o redirect policy                              |
| DT-05 | Runtime config es build-time y validación no bloquea     | [scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)<br>[core/src/lib/config/app-env-initializer.ts](core/src/lib/config/app-env-initializer.ts#L1)                                                                                                                                        | Alto riesgo de drift entre dev/qa/pdn                                | P1 alta       | Migrar a config pública validada al arranque con fallback seguro                        |
| DT-06 | Interceptors duplicados y estándar HTTP incompleto       | [core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1)<br>[core/src/lib/interceptors/tenant-header.interceptor.ts](core/src/lib/interceptors/tenant-header.interceptor.ts#L1)                                                                            | Inconsistencia de headers, manejo de errores y evolución difícil     | P1 alta       | Unificar a una cadena funcional corta y declarativa                                     |
| DT-07 | Tokens sensibles en `localStorage`                       | [core/src/lib/auth/auth.service.ts](core/src/lib/auth/auth.service.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                                                                      | Riesgo XSS y complejidad multi-tenant                                | P1 alta       | Evaluar cookies `HttpOnly`; si no es viable, centralizar storage y rotación             |
| DT-08 | Manejo de errores y mensajería no unificado              | [core/src/lib/errors/global-error-handler.ts](core/src/lib/errors/global-error-handler.ts#L1)<br>[shared/src/lib/utils/snackbar-config.ts](shared/src/lib/utils/snackbar-config.ts#L1)<br>[shared/src/lib/services/toast.service.ts](shared/src/lib/services/toast.service.ts#L1)                 | UX inconsistente y más deuda al migrar                               | P1 alta       | Definir `AppError` + mapper + un solo canal UX                                          |
| DT-09 | PWA data cache no corresponde al tráfico real            | [apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1)<br>[core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1)                                                                                                                                        | Offline/cache inconsistente y riesgo multi-tenant en query mode      | P1 alta       | Rediseñar cache strategy después de fijar modelo de tenant                              |
| DT-10 | E2E no es una red de seguridad confiable                 | [apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1)<br>[apps/pwa-e2e/project.json](apps/pwa-e2e/project.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                 | Reduce mucho la seguridad de la migración mayor                      | P1 alta       | Arreglar `webServer`, crear smoke tests reales y dejar de tolerar fallo silencioso      |
| DT-11 | Global loader no conectado                               | [shared/src/lib/ui/loader/loader.component.ts](shared/src/lib/ui/loader/loader.component.ts#L1)                                                                                                                                                                                                   | Feedback pobre en operaciones HTTP y forms                           | P2 media      | Implementar loader global por interceptor con opt-out                                   |
| DT-12 | Límites arquitectónicos Nx muy débiles                   | [eslint.config.mjs](eslint.config.mjs#L1)                                                                                                                                                                                                                                                         | Facilita acoplamiento entre capas                                    | P2 media      | Definir tags y restricciones reales por capa                                            |
| DT-13 | Hay código de layout heredado/no conectado               | [shared/src/lib/ui/layout/layout.component.ts](shared/src/lib/ui/layout/layout.component.ts#L1)<br>[shared/src/lib/layout/admin-layout/admin-layout.component.ts](shared/src/lib/layout/admin-layout/admin-layout.component.ts#L1)                                                                | Incrementa ruido y riesgo de regresión                               | P2 media      | Catalogar y retirar o reubicar layouts no usados                                        |
| DT-14 | Bundle inicial cerca del warning budget                  | Validación `build:prod:browser`                                                                                                                                                                                                                                                                   | Riesgo de performance y degradación móvil                            | P2 media      | Medir rutas pesadas, diferir vistas y optimizar imágenes                                |
| DT-15 | Modo mock local documentado pero sin tenants demo reales | [apps/pwa/public/config/tenants/README.md](apps/pwa/public/config/tenants/README.md#L1)                                                                                                                                                                                                           | Onboarding local confuso                                             | P3 baja       | Crear un tenant demo controlado o documentar `start:dev` como path principal            |

## Riesgos de migración Angular 21

| Riesgo                                       | Causa probable                                                                                  | Archivos afectados                                                                                                                                                                                                                                                                          | Impacto                 | Mitigación antes de migrar                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Incompatibilidad Node/TypeScript/RxJS        | No hay contrato explícito de Node; Angular/Nx/Jest deberán alinearse                            | [package.json](package.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                                                                                  | Alto                    | Fase 2: fijar Node LTS soportado, TS exacta y validar matrix oficial                               |
| Incompatibilidad de UI library               | Angular Material/CDK se usa ampliamente en admin y superadmin                                   | [package.json](package.json#L1)<br>[features-admin/src/lib/pages/categories/categories-list/categories-list.component.ts](features-admin/src/lib/pages/categories/categories-list/categories-list.component.ts#L11)                                                                         | Alto                    | Actualizar Material en ventana controlada y probar formularios/tablas/dialogs                      |
| Dependencia implícita de `zone.js`           | La app sigue con `provideZoneChangeDetection` y `zone.js` en polyfills                          | [apps/pwa/project.json](apps/pwa/project.json#L1)<br>[apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)                                                                                                                                                                    | Medio                   | No mezclar Angular 21 con intento de “zoneless” en la misma fase                                   |
| SSR/hydration inconsistente                  | Hydration activada, SSR no desplegado y tenant server-side no resuelto                          | [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)<br>[apps/pwa/src/app/app.config.server.ts](apps/pwa/src/app/app.config.server.ts#L1)<br>[core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1)                     | Alto                    | Mantener browser build durante upgrade; reactivar SSR solo tras estabilizar tenant/request context |
| Service worker/PWA con cache incoherente     | `ngsw-config` no corresponde a URLs API reales                                                  | [apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1)<br>[core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1)                                                                                                                                  | Alto                    | Revisar dataGroups antes de tocar Angular mayor                                                    |
| Builders y despliegue custom                 | Vercel depende de script que genera `environment.runtime.ts`                                    | [scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)<br>[vercel.json](vercel.json#L1)<br>[apps/pwa/project.json](apps/pwa/project.json#L1)                                                                                                                                           | Alto                    | Probar pipeline Vercel completo en QA antes y después del upgrade                                  |
| Scripts personalizados fuera de CI principal | Parte del deploy real no está validada por `build:prod:browser`                                 | [package.json](package.json#L1)<br>[scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)                                                                                                                                                                                              | Medio                   | Añadir validación del build de Vercel en pipeline de migración                                     |
| Dependencias de testing obsoletas            | `jest-preset-angular`, `ts-jest`, Playwright y `@types/node` van por detrás                     | [package.json](package.json#L1)                                                                                                                                                                                                                                                             | Alto                    | Actualizar testing stack después de toolchain base                                                 |
| Tests rotos o poco confiables                | CI tolera fallos e2e y Playwright apunta al proyecto incorrecto                                 | [apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                                        | Alto                    | Corregir baseline e2e antes del upgrade mayor                                                      |
| Uso de APIs browser directas                 | `window`, `document`, `localStorage`, `Notification`, `URL.createObjectURL` en múltiples piezas | [core/src/lib/pwa/pwa-install.service.ts](core/src/lib/pwa/pwa-install.service.ts#L1)<br>[shared/src/lib/ui/header/header.component.ts](shared/src/lib/ui/header/header.component.ts#L1)<br>[shared/src/lib/ui/layout/layout.component.ts](shared/src/lib/ui/layout/layout.component.ts#L1) | Alto si se reactiva SSR | Catalogar acceso directo y encapsularlo detrás de helpers browser-safe                             |
| Lazy routes y rutas dormidas                 | Hay rutas exportadas que no están montadas                                                      | [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)<br>[core/src/lib/routes/tenant-error.routes.ts](core/src/lib/routes/tenant-error.routes.ts#L1)                                                                                                                          | Medio                   | Limpiar el mapa de rutas antes del upgrade                                                         |
| Interceptors funcionales vs clase            | Dos enfoques activos/inactivos conviven                                                         | [core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1)<br>[core/src/lib/interceptors/tenant-header.interceptor.ts](core/src/lib/interceptors/tenant-header.interceptor.ts#L1)                                                                      | Medio                   | Consolidar un solo enfoque antes de migrar                                                         |
| Environments/runtime config                  | La app mezcla env TS y archivo generado en build                                                | [apps/pwa/src/environments/environment.prod.ts](apps/pwa/src/environments/environment.prod.ts#L1)<br>[scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)                                                                                                                            | Alto                    | Diseñar estándar estable de config antes del `ng update`                                           |
| APP_INITIALIZER con alta complejidad         | Bootstrap hace demasiado en arranque                                                            | [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)                                                                                                                                                                                                                         | Medio                   | Reducir responsabilidades por initializer y hacerlas testeables                                    |

### Revisión de dependencias

| Paquete                                                                    |        Versión actual | Uso detectado                                         | Riesgo Angular 21 | Acción recomendada                                                      |
| -------------------------------------------------------------------------- | --------------------: | ----------------------------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `@angular/core` / `@angular/common` / `@angular/router` / `@angular/forms` |             `~20.3.0` | Base de toda la app, standalone y router moderno      | Medio             | Actualizar mayor en Fase 3                                              |
| `@angular/cli` / `@angular/compiler-cli`                                   |             `~20.3.0` | Toolchain Angular                                     | Medio             | Actualizar mayor controlado                                             |
| `@angular/build` / `@angular-devkit/build-angular`                         |             `~20.3.0` | Builder de app Nx/Angular                             | Medio             | Actualizar junto con core/cli                                           |
| `@angular/material` / `@angular/cdk`                                       |            `^20.2.10` | Muy usado en admin/superadmin                         | Alto              | Actualizar mayor y validar tablas, dialogs, form-field, paginator       |
| `@angular/ssr` / `@angular/platform-server`                                |             `~20.3.0` | Código SSR presente pero no operativo en prod         | Alto              | Investigar y actualizar solo con estrategia SSR definida                |
| `@angular/service-worker` / `@angular/pwa`                                 | `~20.3.0` / `^20.3.7` | PWA y SW activos en build prod                        | Medio             | Actualizar mayor y rediseñar cache strategy                             |
| `@jsverse/transloco`                                                       |              `^8.1.0` | i18n en app config y loader                           | Medio             | Investigar compatibilidad y actualizar según soporte Angular 21         |
| `rxjs`                                                                     |              `~7.8.0` | Observable API en servicios y HTTP                    | Medio             | Mantener/alinear en Fase 2 según matrix oficial                         |
| `zone.js`                                                                  |             `~0.15.0` | Polyfills y change detection actual                   | Bajo              | Mantener inicialmente                                                   |
| `typescript`                                                               |              `~5.9.2` | Compilación estricta                                  | Medio             | Ajustar a versión oficialmente soportada por Angular 21                 |
| `nx` / `@nx/angular` / `@nx/*`                                             |              `22.0.1` | Monorepo, testing, lint, Playwright                   | Alto              | Investigar compatibilidad Angular 21 y actualizar si la matrix lo exige |
| `express`                                                                  |             `^4.21.2` | Solo SSR server path                                  | Medio             | Mantener por ahora; reevaluar si SSR vuelve                             |
| `jest-preset-angular`                                                      |             `~14.6.1` | Unit tests Angular                                    | Alto              | Actualizar mayor en fase testing                                        |
| `jest` / `ts-jest`                                                         |   `29.7.0` / `29.1.0` | Unit tests                                            | Medio             | Actualizar después del core upgrade                                     |
| `@playwright/test`                                                         |             `^1.36.0` | E2E                                                   | Medio             | Actualizar y corregir configuración antes de depender de e2e            |
| `angular-eslint` / `eslint`                                                |  `^20.3.0` / `^9.8.0` | Linting                                               | Medio             | Actualizar junto con Nx/Angular                                         |
| `@types/node`                                                              |             `18.16.9` | Tipos Node para build/test/SSR                        | Medio             | Alinear con Node LTS objetivo                                           |
| `prettier`                                                                 |              `^2.6.2` | Formato                                               | Bajo              | Actualizar mayor, separado del upgrade Angular                          |
| `source-map-explorer`                                                      |              `^2.5.3` | Análisis bundle                                       | Bajo              | Mantener                                                                |
| `cross-env`                                                                |              `^7.0.3` | Uso no evidenciado en scripts actuales                | Bajo              | Investigar                                                              |
| `husky` / `lint-staged` / `commitlint`                                     |                varias | DX y hooks                                            | Bajo              | Mantener o actualizar menor                                             |
| Librerías de mapas                                                         |                     — | **No evidenciado** en [package.json](package.json#L1) | —                 | No aplica                                                               |
| Librerías de pagos                                                         |                     — | **No evidenciado** en [package.json](package.json#L1) | —                 | No aplica                                                               |
| Librerías de charts                                                        |                     — | **No evidenciado** en [package.json](package.json#L1) | —                 | No aplica                                                               |
| Librerías de storage externas                                              |                     — | **No evidenciado** en [package.json](package.json#L1) | —                 | No aplica                                                               |

## Arquitectura objetivo recomendada

### Estructura objetivo por capas

| Capa objetivo                     | Responsabilidad                                                  | Qué NO debe contener                         | Ejemplos actuales que deberían moverse o consolidarse                                                                                                                                                                                                                                                                                                                                                                                    | Beneficios                                         | Prioridad |
| --------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------- |
| `src/app/core/config`             | Runtime config, tokens, bootstrap mínimo                         | Servicios de negocio, componentes de feature | [core/src/lib/config/app-env.token.ts](core/src/lib/config/app-env.token.ts#L1)<br>[core/src/lib/config/app-env-initializer.ts](core/src/lib/config/app-env-initializer.ts#L1)<br>[apps/pwa/src/environments/environment.prod.ts](apps/pwa/src/environments/environment.prod.ts#L1)                                                                                                                                                      | Hace predecible el arranque                        | P1        |
| `src/app/core/http`               | `ApiClient`, interceptors, request context, timeout/retry policy | Endpoints de dominio o lógica UI             | [core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1)<br>[core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1)                                                                                                                                                                                                                                         | Unifica cross-cutting HTTP                         | P1        |
| `src/app/core/auth`               | Sesión, claims, guards, auth facade                              | Forms UI de login/register                   | [core/src/lib/auth/auth.service.ts](core/src/lib/auth/auth.service.ts#L1)<br>[core/src/lib/auth/guards/auth.guard.ts](core/src/lib/auth/guards/auth.guard.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                                                                                                                      | Reduce acoplamiento entre feature-auth y auth core | P1        |
| `src/app/core/tenant`             | Resolver, contexto, storage namespace, branding, tenant policy   | Endpoints de catálogo/pedidos                | [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1)<br>[core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1)<br>[core/src/lib/services/tenant-context.service.ts](core/src/lib/services/tenant-context.service.ts#L1)<br>[core/src/lib/services/tenant-bootstrap.service.ts](core/src/lib/services/tenant-bootstrap.service.ts#L1) | Fuente única de verdad para tenant                 | P1        |
| `src/app/core/errors`             | `AppError`, mappers, ProblemDetails, logging policy              | Toast UI concreta                            | [core/src/lib/errors/global-error-handler.ts](core/src/lib/errors/global-error-handler.ts#L1)<br>[shared/src/lib/utils/snackbar-config.ts](shared/src/lib/utils/snackbar-config.ts#L1)                                                                                                                                                                                                                                                   | Error handling consistente                         | P1        |
| `src/app/shared/ui`               | Componentes visuales reutilizables y headless UI                 | Lógica de dominio y llamadas HTTP            | [shared/src/lib/ui/toast-container/toast-container.component.ts](shared/src/lib/ui/toast-container/toast-container.component.ts#L1)<br>[shared/src/lib/components/confirmation-dialog/confirmation-dialog.component.ts](shared/src/lib/components/confirmation-dialog/confirmation-dialog.component.ts#L1)                                                                                                                               | Reuso y menor duplicidad                           | P2        |
| `src/app/shared/validators`       | Validadores, mappers de errores de formulario                    | Estado de features                           | Validaciones hoy dispersas en [features-account/src/lib/components/register/register.component.ts](features-account/src/lib/components/register/register.component.ts#L1) y formularios admin                                                                                                                                                                                                                                            | Consistencia de forms                              | P2        |
| `src/app/layout`                  | Shells de navegación                                             | Llamadas API y lógica de negocio             | [shared/src/lib/layout/public-layout/public-layout.component.ts](shared/src/lib/layout/public-layout/public-layout.component.ts#L1)<br>[shared/src/lib/layouts/tenant-admin-layout/tenant-admin-layout.component.ts](shared/src/lib/layouts/tenant-admin-layout/tenant-admin-layout.component.ts#L1)<br>[shared/src/lib/layout/admin-layout/admin-layout.component.ts](shared/src/lib/layout/admin-layout/admin-layout.component.ts#L1)  | Separa shell de feature                            | P1        |
| `src/app/features/public`         | Landing corporativa y páginas sin tenant                         | Estado tenant o auth global                  | Hoy **Brecha detectada**                                                                                                                                                                                                                                                                                                                                                                                                                 | Habilita `dominio.com` real                        | P1        |
| `src/app/features/tenant-catalog` | Catálogo, categorías públicas, producto, carrito                 | Servicios cross-cutting                      | [features/src/lib/catalog/catalog.routes.ts](features/src/lib/catalog/catalog.routes.ts#L1)<br>[core/src/lib/services/public-cart-ui.service.ts](core/src/lib/services/public-cart-ui.service.ts#L1)                                                                                                                                                                                                                                     | Slice storefront coherente                         | P1        |
| `src/app/features/tenant-auth`    | Login/register/forgot/profile del tenant                         | Auth storage core                            | [features-account/src/lib/lib.routes.ts](features-account/src/lib/lib.routes.ts#L1)<br>[features-account/src/lib/components/login/login.component.ts](features-account/src/lib/components/login/login.component.ts#L1)                                                                                                                                                                                                                   | Aisla UX auth                                      | P1        |
| `src/app/features/tenant-orders`  | Órdenes del cliente                                              | Providers globales                           | [features-orders/src/lib/lib.routes.ts](features-orders/src/lib/lib.routes.ts#L1)                                                                                                                                                                                                                                                                                                                                                        | Cohesión funcional                                 | P2        |
| `src/app/features/tenant-admin`   | Backoffice por tenant                                            | Cross-cutting HTTP/auth/tenant               | [features-admin/src/lib/lib.routes.ts](features-admin/src/lib/lib.routes.ts#L1)                                                                                                                                                                                                                                                                                                                                                          | Reduce tamaño conceptual del monolito frontend     | P1        |
| `src/app/features/platform-admin` | Superadmin/plataforma                                            | Contexto tenant de tienda                    | [features-superadmin/src/lib/admin.routes.ts](features-superadmin/src/lib/admin.routes.ts#L1)                                                                                                                                                                                                                                                                                                                                            | Aísla políticas de plataforma                      | P1        |
| `src/app/data-access/api`         | Repositorios/adapters HTTP por bounded context                   | UI, layout, guards                           | [features-admin/src/lib/services/category.service.ts](features-admin/src/lib/services/category.service.ts#L1)<br>[core/src/lib/services/product.service.ts](core/src/lib/services/product.service.ts#L1)<br>[features-superadmin/src/lib/services/tenant-admin.service.ts](features-superadmin/src/lib/services/tenant-admin.service.ts#L1)                                                                                              | Limita duplicidad de endpoints y mappers           | P1        |
| `src/app/data-access/models`      | DTOs, modelos externos y mappers                                 | Signals, components                          | Modelos hoy repartidos en `core` y `features-*`                                                                                                                                                                                                                                                                                                                                                                                          | Claridad entre modelo interno y payload backend    | P2        |
| `src/app/state`                   | Estado local compartido por dominio con Signals                  | Endpoints HTTP directos                      | [core/src/lib/services/public-cart-ui.service.ts](core/src/lib/services/public-cart-ui.service.ts#L1)<br>[core/src/lib/services/user-mode.service.ts](core/src/lib/services/user-mode.service.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                                                                                  | Hace más visible el estado de UI y sesión          | P2        |

### Estándar recomendado para multi-tenant frontend

**Diseño conceptual**

- **Subdominio como fuente de verdad en producción**. `tenant-a.dominio.com` y `tenant-b.dominio.com` deben ser el mecanismo principal.
- **`dominio.com` sin tenant** debe entrar a una `public landing` explícita, no a `/admin`.
- **Fallback por query param** debe quedar restringido a local/QA o feature flag de diagnóstico.
- **Si tenant no existe** y la ruta requiere tenant, la app debe detener bootstrap funcional de storefront y mostrar una pantalla clara de `tenant not found`.
- **Aislamiento de storage**: ninguna feature debe escribir `localStorage` directamente. Todo pasa por un servicio namespace-aware.
- **Carrito, favoritos, refresh token y UI mode** deben ir con prefijo por tenant.
- **Admin global** debe usar scope propio separado del storefront tenant.
- **PWA cache**: confiar en el aislamiento por subdominio en producción; evitar query-mode productivo con SW activo.
- **Branding** y assets de tenant deben resolverse por configuración tenant-aware y URLs versionadas.
- **No mezclar tenant en query param en endpoints productivos** salvo transición explícita.

**Responsabilidades por servicio**

| Servicio sugerido               | Responsabilidad                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `TenantResolverService`         | Resolver tenant desde host, query debug y política de fallback                           |
| `TenantContextFacade`           | Exponer `tenant`, `status`, `branding`, `requiresTenant`, `isLanding`, `isPlatformAdmin` |
| `TenantSessionNamespaceService` | Generar claves namespaced de auth, cart, favorites, push, ui                             |
| `TenantBrandingService`         | Aplicar tema, favicon, manifest y assets brand-safe                                      |
| `TenantLandingPolicyService`    | Decidir `landing`, `tenant not found`, `platform admin`, `storefront`                    |
| `TenantAssetResolverService`    | Resolver logos, category image base URL, CDN y fallbacks                                 |
| `TenantCachePolicyService`      | Definir qué puede cachearse por tenant y qué no                                          |
| `TenantRouteGuard`              | Bloquear navegación si el tenant requerido no está listo                                 |

**Contratos TypeScript sugeridos**

```ts
export type TenantAppContext = 'landing' | 'storefront' | 'tenant-admin' | 'platform-admin' | 'tenant-not-found';

export interface TenantIdentity {
  slug: string;
  host: string;
  source: 'subdomain' | 'query-debug' | 'server-context';
}

export interface TenantRuntimeContext {
  context: TenantAppContext;
  tenant: TenantIdentity | null;
  requiresTenant: boolean;
  resolved: boolean;
  notFound: boolean;
}

export interface TenantStorageNamespace {
  auth(key: string): string;
  cart(key: string): string;
  favorites(key: string): string;
  ui(key: string): string;
  push(key: string): string;
  global(key: string): string;
}
```

**Riesgos del estándar**

- Si backend no soporta cookies por subdominio, habrá que convivir temporalmente con bearer tokens tenant-scoped.
- Si se mantiene query fallback en producción, el aislamiento de SW y caches seguirá débil.
- Si branding usa URLs no versionadas, pueden aparecer mezclas visuales por cache del navegador/CDN.
- Si `admin` y storefront comparten origin, se complica seguridad y storage.

### Estándar recomendado para runtime config

**Estado actual**

- Compilado por ambiente con TS.
- Vercel genera un `.ts` previo al build.
- No hay fetch de config pública en startup.
- La validación actual no aborta el bootstrap.

**Estándar propuesto**

- Un solo archivo público por ambiente, por ejemplo `app-config.json`, cargado antes de bootstrap.
- Validación de esquema obligatoria; si falla, la app muestra pantalla de configuración inválida y no sigue.
- SSR y browser deben leer la misma semántica de config.
- `dev`, `qa` y `pdn` comparten la misma estructura de contrato, cambia solo el contenido.

**Contrato sugerido**

```ts
export interface PublicRuntimeConfig {
  environmentName: 'dev' | 'qa' | 'pdn';
  apiBaseUrl: string;
  publicAssetBaseUrl: string;
  tenantMode: 'subdomain' | 'subdomain-with-debug-query';
  featureFlags: Record<string, boolean>;
  publicProvider?: 'vercel' | 'custom';
  enableServiceWorker: boolean;
  enableAnalytics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

**Valores recomendados por ambiente**

| Variable              | Dev                            | QA                                         | PDN                 | Nota                                                                                  |
| --------------------- | ------------------------------ | ------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------- |
| `apiBaseUrl`          | backend local o dev compartido | backend QA dedicado                        | backend prod        | Nunca hardcodear URLs de QA/prod en código fuente si se quiere verdadera flexibilidad |
| `publicAssetBaseUrl`  | local/CDN dev                  | CDN QA                                     | CDN prod            | Versionar assets por tenant cuando aplique                                            |
| `environmentName`     | `dev`                          | `qa`                                       | `pdn`               | Explícito                                                                             |
| `tenantMode`          | `subdomain-with-debug-query`   | `subdomain-with-debug-query` o `subdomain` | `subdomain`         | Query fallback solo fuera de PDN                                                      |
| `featureFlags`        | expansivas                     | cercanas a prod                            | estrictas           | Mismas claves en todos los ambientes                                                  |
| `publicProvider`      | `custom`                       | `vercel` o `custom`                        | `vercel` o `custom` | Solo pública                                                                          |
| `enableServiceWorker` | normalmente `false`            | `true`                                     | `true`              | Activación controlada                                                                 |
| `enableAnalytics`     | `false`                        | `false` o limitado                         | `true`              | No usar placeholder permanente                                                        |

**Fallback recomendado si falla la carga**

- No continuar el bootstrap completo.
- Mostrar pantalla técnica amigable.
- Registrar error con `correlationId`.
- Permitir reintento manual.
- En SSR, responder markup de error controlado en vez de HTML parcial.

**Variables que JAMÁS deben ir al frontend**

- Secretos de JWT, signing keys o refresh token signing keys.
- Passwords o connection strings de base de datos.
- Secretos de Azure, AWS, Cloudflare o cualquier proveedor.
- API keys administrativas o de escritura privilegiada.
- Secretos de pagos.
- SMTP credentials.
- VAPID private key.
- Cualquier secreto que permita elevar privilegios sin backend.

### Estándar recomendado para HTTP, errores y loader

**Objetivo**

- Un `ApiClient` delgado.
- 3 a 4 interceptors funcionales máximo.
- Un solo estándar de error y un solo canal de UX.

**Cadena recomendada**

1. `runtimeConfigInterceptor`: asegura base URL válida.
2. `tenantContextInterceptor`: agrega `X-Tenant-Slug` solo donde aplica.
3. `authInterceptor`: agrega token.
4. `requestContextInterceptor`: `correlationId`, loader, timeout, error normalization.

**Políticas**

- `tenant header`: sí, pero no por query param en producción salvo transición.
- `correlationId`: generado por request y visible en errores.
- `global loader`: usar `HttpContextToken` para excluir background requests.
- `ProblemDetails`: mapear `title`, `detail`, `errors`, `status`, `instance`.
- `retry`: solo para `GET`, con backoff corto y límite bajo.
- `timeout`: explícito por tipo de request.
- `POST/PUT/PATCH/DELETE`: sin retry automático.
- `errores de negocio`: se normalizan y se muestran con texto de negocio, no técnico.
- `errores de red`: mensaje amigable y acción de reintento.
- `toasts`: unificar en un `NotificationFacade`; usar snackbars solo si se decide como estándar único.

**Contrato recomendado**

```ts
export interface AppError {
  status?: number;
  code: string;
  message: string;
  userMessage: string;
  correlationId?: string;
  details?: unknown;
}
```

**Mapeo recomendado**

```ts
export interface ProblemDetailsLike {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}
```

### Estándar recomendado para formularios

- Mantener **Reactive Forms** como estándar actual para la migración a Angular 21.
- No recomiendo migrar a Signal Forms en la misma ventana del upgrade mayor.
- Mensajes de validación siempre bajo el input.
- `required` y `optional` visibles en la UI.
- Submit deshabilitado si el formulario es inválido o está guardando.
- Validación en tiempo real después de `touched` o después del primer submit.
- Normalización central de errores backend a errores de campo y errores globales.
- Componentes reutilizables de campo para:
  - label,
  - help text,
  - error text,
  - loading/saving,
  - hint de accesibilidad,
  - `autocomplete`.
- Accesibilidad:
  - `aria-invalid`,
  - `aria-describedby`,
  - foco al primer error,
  - mensajes legibles por screen reader.
- Estados `loading/saving` consistentes.
- Validaciones de negocio encapsuladas en validators compartidos, no repetidas por componente.

**Conviene migrar a nuevas APIs de forms de Angular 21 ahora**

- **No**. Déjalo como fase futura de modernización, no como prerequisito del upgrade mayor.

### Mejoras futuras opcionales

- Introducir `NgOptimizedImage` en storefront y branding crítico.
- Adoptar `deferrable views` en páginas pesadas del catálogo y backoffice.
- Evaluar zoneless solo después de estabilizar Angular 21.
- Evaluar Signal Forms cuando el estándar Reactive Forms ya esté consolidado.
- Separar más el backoffice tenant-admin del storefront si el negocio lo exige.
- Llevar SSR por tenant a una arquitectura server-aware cuando el hosting y backend estén listos.

## Roadmap de migración por fases

### Fase 0 — Auditoría y baseline

- **Objetivo**: congelar baseline técnico y funcional del estado actual.
- **Tareas**: documentar arquitectura, inventariar dependencias, fijar Node/NPM objetivo, validar build actual, listar flujos críticos y riesgos.
- **Archivos probables**: [package.json](package.json#L1), [apps/pwa/project.json](apps/pwa/project.json#L1), [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1), [vercel.json](vercel.json#L1), [.github/workflows/ci.yml](.github/workflows/ci.yml#L1).
- **Riesgo**: bajo.
- **Criterio de aceptación**: existe baseline documentado, build actual validado y lista de riesgos aprobada.
- **Comando de validación**: `npm ci && npm run build:prod:browser`
- **Evidencia esperada**: build exitoso, matriz de dependencias, mapa de arquitectura, checklist pre-migración.

### Fase 1 — Limpieza previa sin cambiar Angular mayor

- **Objetivo**: reducir deuda que vuelve peligrosa la migración.
- **Tareas**: consolidar estrategia tenant bootstrap, decidir flujo `dominio.com`, cablear o retirar rutas de tenant error, estandarizar runtime config, revisar browser APIs directas, corregir E2E config, revisar PWA dataGroups, catalogar código no usado.
- **Archivos probables**: [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1), [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1), [core/src/lib/services/tenant-bootstrap.service.ts](core/src/lib/services/tenant-bootstrap.service.ts#L1), [core/src/lib/routes/tenant-error.routes.ts](core/src/lib/routes/tenant-error.routes.ts#L1), [apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1), [apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1).
- **Riesgo**: medio.
- **Criterio de aceptación**: un solo flujo tenant documentado/activo, E2E baseline corregido, PWA/cache entendida y runtime config con contrato claro.
- **Comando de validación**: `npm run build:prod:browser && npm run lint`
- **Evidencia esperada**: build estable, smoke de navegación estable, reglas de tenant y deploy documentadas.

### Fase 2 — Actualización de toolchain

- **Objetivo**: alinear prerequisitos del ecosistema antes del cambio mayor.
- **Tareas**: fijar Node LTS, revisar compatibilidad oficial Angular/Nx/TS/RxJS, actualizar herramientas auxiliares si hace falta, regenerar lockfile controladamente.
- **Archivos probables**: [package.json](package.json#L1), [.github/workflows/ci.yml](.github/workflows/ci.yml#L1), `package-lock.json`.
- **Riesgo**: medio.
- **Criterio de aceptación**: toolchain acordado y build actual sigue pasando.
- **Comando de validación**: `node -v && npm -v && npm run build:prod:browser`
- **Evidencia esperada**: matrix de compatibilidad, lockfile regenerado y build limpio.

### Fase 3 — Migración Angular core/cli a 21

- **Objetivo**: actualizar Angular y aplicar migraciones automáticas en entorno controlado.
- **Tareas**: crear rama de migración, ejecutar `ng update` o `nx migrate` según matrix oficial, revisar migraciones, corregir breaking changes de compilación, validar routing, hydration y service worker.
- **Archivos probables**: [package.json](package.json#L1), [apps/pwa/project.json](apps/pwa/project.json#L1), [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1), [apps/pwa/src/main.ts](apps/pwa/src/main.ts#L1), [apps/pwa/src/main.server.ts](apps/pwa/src/main.server.ts#L1).
- **Riesgo**: alto.
- **Criterio de aceptación**: app compila, router levanta, Material y testing stack principal siguen operativos.
- **Comando de validación**: `npm run build:prod:browser`
- **Evidencia esperada**: `package.json` actualizado, migraciones ejecutadas, build sin errores.

**Comandos sugeridos a validar contra la matrix oficial antes de ejecutar**

- `npx ng update @angular/core@21 @angular/cli@21`
- `npx ng update @angular/material@21`
- Si Nx lo requiere por compatibilidad oficial: `npx nx migrate @nx/workspace@<compatible> @nx/angular@<compatible>`

### Fase 4 — Actualización de librerías externas

- **Objetivo**: llevar Material, testing, lint y libs auxiliares a versiones compatibles.
- **Tareas**: actualizar Material/CDK, Transloco, Jest stack, Playwright, Angular ESLint y tipos Node; retirar dependencias no usadas.
- **Archivos probables**: [package.json](package.json#L1), [apps/pwa/jest.config.ts](apps/pwa/jest.config.ts#L1), [apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1), [eslint.config.mjs](eslint.config.mjs#L1).
- **Riesgo**: alto.
- **Criterio de aceptación**: dependencias externas alineadas y sin romper build/lint/test principal.
- **Comando de validación**: `npm run lint && npm run build:prod:browser`
- **Evidencia esperada**: matriz de compatibilidad actualizada y PRs por grupo de librerías.

### Fase 5 — Modernización Angular

- **Objetivo**: aprovechar Angular moderno sin reescritura masiva.
- **Tareas**: consolidar interceptors funcionales, simplificar initializers, aplicar `deferrable views` donde convenga, mejorar split de rutas, revisar componentes heredados/no usados.
- **Archivos probables**: [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1), [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1), [core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1), [shared/src/lib/ui/layout/layout.component.ts](shared/src/lib/ui/layout/layout.component.ts#L1).
- **Riesgo**: medio.
- **Criterio de aceptación**: menos duplicidad arquitectónica, mismo comportamiento funcional.
- **Comando de validación**: `npm run build:prod:browser`
- **Evidencia esperada**: diff arquitectónicamente pequeño, sin regressions visibles.

### Fase 6 — Hardening multi-tenant/PWA

- **Objetivo**: cerrar aislamiento entre tenants y estabilizar experiencia PWA.
- **Tareas**: unificar keys storage, eliminar accesos directos a `localStorage`, definir política de tenant query fallback, rediseñar cache strategy, versionar branding/assets, decidir landing root.
- **Archivos probables**: [core/src/lib/services/tenant-storage.service.ts](core/src/lib/services/tenant-storage.service.ts#L1), [core/src/lib/auth/auth.service.ts](core/src/lib/auth/auth.service.ts#L1), [core/src/lib/pwa/pwa-install.service.ts](core/src/lib/pwa/pwa-install.service.ts#L1), [apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1), [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1).
- **Riesgo**: alto.
- **Criterio de aceptación**: storage y cache se comportan por tenant sin contaminación cruzada.
- **Comando de validación**: `npm run build:prod:browser`
- **Evidencia esperada**: smoke test multi-tenant estable y reglas de aislamiento documentadas.

### Fase 7 — QA técnico y funcional

- **Objetivo**: validar la app como producto, no solo como compilación.
- **Tareas**: smoke tests de rutas, auth, carrito, checkout, admin, SSR si aplica, PWA, tenant not found, landing root y subdominios.
- **Archivos probables**: [apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1), `apps/pwa-e2e/src/**/*.ts`.
- **Riesgo**: alto.
- **Criterio de aceptación**: smoke suite mínima verde y rutas críticas verificadas manualmente.
- **Comando de validación**: `npm run e2e`
- **Evidencia esperada**: reporte e2e, checklist funcional firmado, bugs priorizados.

### Fase 8 — Preparación PDN

- **Objetivo**: salida segura a producción.
- **Tareas**: checklist final, rollback plan, variables públicas verificadas, observabilidad básica, performance básica, revisión headers y caching.
- **Archivos probables**: [vercel.json](vercel.json#L1), [.github/workflows/ci.yml](.github/workflows/ci.yml#L1), [scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1).
- **Riesgo**: alto.
- **Criterio de aceptación**: plan de rollback aprobado, build/release reproducible y validación QA completa.
- **Comando de validación**: `npm run build:prod:browser`
- **Evidencia esperada**: release checklist, rollback documentado, validación de config y monitoreo.

## Checklist de validación

### Antes

- [ ] Revisar Angular Update Guide oficial
- [ ] Revisar Version Compatibility oficial
- [ ] Confirmar Node compatible
- [ ] Confirmar TypeScript compatible
- [ ] Confirmar RxJS compatible
- [ ] Confirmar build actual
- [ ] Confirmar SSR actual
- [ ] Confirmar PWA actual
- [ ] Confirmar deploy QA
- [ ] Crear rama `migration/angular-21`
- [ ] Confirmar si `dominio.com` será landing, selector o redirect
- [ ] Confirmar si query fallback de tenant seguirá permitido en producción
- [ ] Corregir baseline E2E antes de depender de él
- [ ] Definir si la migración cubrirá SSR real o solo browser build

### Durante

- [ ] Ejecutar `ng update`
- [ ] Revisar migrations
- [ ] Revisar `package.json`
- [ ] Revisar lockfile
- [ ] Corregir errores TS
- [ ] Corregir errores templates
- [ ] Corregir errores SSR
- [ ] Corregir errores tests
- [ ] Validar rutas
- [ ] Validar que solo exista una estrategia activa de tenant bootstrap
- [ ] Validar interceptors funcionales finales
- [ ] Validar runtime config final en dev/qa/pdn
- [ ] Validar `tenant not found` y root landing

### Después

- [ ] Build production
- [ ] SSR local
- [ ] Deploy QA
- [ ] Smoke test multi-tenant
- [ ] Smoke test auth
- [ ] Smoke test carrito
- [ ] Smoke test checkout
- [ ] Smoke test admin
- [ ] Lighthouse básico
- [ ] Validar service worker
- [ ] Validar rollback
- [ ] Validar headers de seguridad web
- [ ] Validar no contaminación de storage/caches entre tenants

## Primer lote técnico recomendado

La recomendación concreta es **empezar por Fase 0 y preparar inmediatamente cuatro puntos de Fase 1**: decisión de root landing, consolidación del bootstrap tenant, corrección del baseline E2E y definición del estándar de runtime config. Con eso reduces mucho el riesgo sin tocar todavía Angular mayor.

**Primer lote sugerido**

1. Documentar decisión de `dominio.com` y política de tenant fallback.
2. Consolidar una sola estrategia de tenant init y retirar la dormida.
3. Corregir Playwright para que realmente levante `ecommerce`.
4. Definir contrato de runtime config público y plan de validación.
5. Revisar `ngsw-config` contra URLs API reales.
6. Catalogar y retirar layouts/rutas no conectadas.

**Prompt corto para ejecutar solo Fase 0**

```text
Haz únicamente la Fase 0 del plan de migración Angular 21 para este monorepo Nx Angular. No modifiques Angular mayor ni librerías todavía. Quiero: baseline técnico, validación de build actual, inventario de dependencias, matriz de riesgos inicial, decisiones pendientes y checklist pre-migración. Si ejecutas comandos, limítate a validación y diagnóstico.
```

**Prompt corto para ejecutar solo Fase 1**

```text
Ejecuta únicamente la Fase 1 de estabilización previa a Angular 21 en este frontend Nx Angular. No actualices Angular mayor todavía. Prioriza: consolidar flujo tenant/bootstrap, definir comportamiento root sin tenant, corregir baseline E2E, estabilizar runtime config, revisar browser APIs inseguras para SSR y alinear PWA/cache con el tráfico real.
```

**Recomendación final**

No migraría “ya” a Angular 21 en este estado sin preparación previa. La recomendación técnica correcta es: **preparar primero, estabilizar por fases y luego migrar Angular 21 con un browser build seguro como baseline; SSR debe tratarse como una línea de trabajo separada o posterior, no mezclada en el mismo salto mayor**.# Auditoría Frontend Multitenant eCommerce

## Resumen ejecutivo

El frontend actual es un monorepo Nx con Angular `20.3.x`, `bootstrapApplication`, routing standalone, lazy loading por features y una capa `core/shared/features*` que ya adopta varias prácticas modernas, pero con mezcla relevante de responsabilidades. La app está mejor preparada para una migración incremental que para una reescritura.

El soporte multi-tenant es parcial: existe resolución por subdominio con fallback por `?tenant=` o `?store=`, carga de configuración por tenant y cierto namespacing de storage, pero no hay flujo real para `dominio.com` como landing, no hay resolución server-side del tenant y conviven dos estrategias de bootstrap/tenant sin consolidar.

Para Angular 21, la base técnica es razonable: builder moderno, standalone, strict templates, Material 20, Signals y hydration configurada. Los principales bloqueos no están en Angular puro sino en la deuda de SSR, runtime config, testing e interceptors duplicados.

Los riesgos principales detectados son: SSR presente pero desactivado en despliegue, prerender sin rutas efectivas, runtime config realmente build-time, localStorage para tokens, PWA/data cache no alineado con URLs reales del backend, E2E con configuración inconsistente y arquitectura con código activo mezclado con código legado no conectado.

Recomendación final: **preparar primero y migrar por fases**. No recomiendo saltar directo a Angular 21 hasta cerrar una Fase 0 y una Fase 1 de estabilización.

Validación ejecutada en esta auditoría: `npm run build:prod:browser` compiló correctamente. No ejecuté unit tests ni e2e.

## Arquitectura actual detectada

`angular.json`: **No evidenciado**. El workspace usa Nx con configuración por proyecto en [apps/pwa/project.json](apps/pwa/project.json#L1).

### Inventario técnico real del proyecto

| Área                   | Archivo(s) revisados                                                                                                                                                                                                                                                                                                                                                                                                                                           | Estado actual                                                   | Observaciones                                                                                                    | Riesgo |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| Angular version actual | [package.json](package.json#L1)                                                                                                                                                                                                                                                                                                                                                                                                                                | `20.3.x`                                                        | Core, CLI, compiler, SSR y service worker están alineados en Angular 20                                          | Medio  |
| TypeScript             | [package.json](package.json#L1)<br>[apps/pwa/tsconfig.json](apps/pwa/tsconfig.json#L1)                                                                                                                                                                                                                                                                                                                                                                         | `5.9.2`                                                         | Configuración estricta en app/libs; el base global conserva defaults antiguos pero la app los sobreescribe       | Medio  |
| RxJS                   | [package.json](package.json#L1)                                                                                                                                                                                                                                                                                                                                                                                                                                | `7.8.0`                                                         | Uso mixto con Signals y Observables                                                                              | Bajo   |
| Node esperado          | [package.json](package.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                                                                                                                                                                                                                                                     | **No evidenciado**                                              | No hay `engines`, `.nvmrc` ni `.node-version`; CI usa `lts/*`; existe `@types/node` `18.16.9`                    | Alto   |
| Builder usado          | [apps/pwa/project.json](apps/pwa/project.json#L1)                                                                                                                                                                                                                                                                                                                                                                                                              | `@angular/build:application`                                    | Builder moderno, buen punto de partida para Angular 21                                                           | Bajo   |
| SSR                    | [apps/pwa/src/main.server.ts](apps/pwa/src/main.server.ts#L1)<br>[apps/pwa/src/server.ts](apps/pwa/src/server.ts#L1)<br>[apps/pwa/src/app/app.config.server.ts](apps/pwa/src/app/app.config.server.ts#L1)<br>[apps/pwa/project.json](apps/pwa/project.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                      | Presente en código, no operativo en despliegue actual           | CI fuerza build browser-only y deja nota explícita para “volver a SSR” después de corregir `NG0201`              | Alto   |
| Hydration              | [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)                                                                                                                                                                                                                                                                                                                                                                                            | Habilitada                                                      | `provideClientHydration(withEventReplay())` existe, pero su valor real es limitado sin SSR/prerender efectivo    | Medio  |
| PWA/service worker     | [apps/pwa/project.json](apps/pwa/project.json#L1)<br>[apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1)<br>[apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)                                                                                                                                                                                                                                                                          | Activo en builds productivos                                    | La configuración existe, pero los `dataGroups` no coinciden con las URLs reales absolutas del backend            | Alto   |
| Routing                | [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)                                                                                                                                                                                                                                                                                                                                                                                            | Standalone con shell principal                                  | Se separa público, `tenant-admin` y `admin` por path                                                             | Medio  |
| Lazy loading           | [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)<br>[features/src/lib/catalog/catalog.routes.ts](features/src/lib/catalog/catalog.routes.ts#L1)<br>[features-admin/src/lib/lib.routes.ts](features-admin/src/lib/lib.routes.ts#L1)<br>[features-superadmin/src/lib/admin.routes.ts](features-superadmin/src/lib/admin.routes.ts#L1)                                                                                                         | Sí                                                              | `loadChildren` y `loadComponent` ampliamente usados                                                              | Bajo   |
| Standalone components  | [apps/pwa/src/main.ts](apps/pwa/src/main.ts#L1)<br>[apps/pwa/src/app/app.ts](apps/pwa/src/app/app.ts#L1)                                                                                                                                                                                                                                                                                                                                                       | Sí                                                              | No encontré evidencia de `@NgModule` activo                                                                      | Bajo   |
| Signals                | [apps/pwa/src/app/app.ts](apps/pwa/src/app/app.ts#L1)<br>[core/src/lib/services/tenant-context.service.ts](core/src/lib/services/tenant-context.service.ts#L1)<br>[shared/src/lib/layout/public-layout/public-layout.component.ts](shared/src/lib/layout/public-layout/public-layout.component.ts#L1)                                                                                                                                                          | Uso extendido                                                   | Señales y `computed`/`effect` ya forman parte del estado local                                                   | Bajo   |
| RxJS/state             | [core/src/lib/services/tenant-bootstrap.service.ts](core/src/lib/services/tenant-bootstrap.service.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                                                                                                                                                                                                   | Mixto                                                           | No hay store central tipo NgRx; el estado está repartido entre servicios con Signals y algo de `BehaviorSubject` | Medio  |
| HTTP interceptors      | [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)<br>[core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1)<br>[core/src/lib/interceptors/tenant-header.interceptor.ts](core/src/lib/interceptors/tenant-header.interceptor.ts#L1)                                                                                                                                                                  | 1 interceptor funcional activo, 1 interceptor de clase inactivo | Hay dos estrategias de tenant/header coexistiendo                                                                | Alto   |
| Auth                   | [core/src/lib/auth/auth.service.ts](core/src/lib/auth/auth.service.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                                                                                                                                                                                                                                   | JWT bearer en `localStorage`                                    | Hay refresh token en servicio, pero no vi orquestación automática global                                         | Alto   |
| Guards                 | [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)<br>[core/src/lib/auth/guards/auth.guard.ts](core/src/lib/auth/guards/auth.guard.ts#L1)<br>[core/src/lib/auth/guards/role.guard.ts](core/src/lib/auth/guards/role.guard.ts#L1)<br>[features-superadmin/src/lib/guards/admin-permission.guard.ts](features-superadmin/src/lib/guards/admin-permission.guard.ts#L1)                                                                           | Funcionales                                                     | Estilo moderno y consistente                                                                                     | Bajo   |
| Tenant resolution      | [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1)<br>[core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1)                                                                                                                                                                                                                                             | Subdominio primero, query fallback                              | No modela landing root y no resuelve tenant server-side                                                          | Alto   |
| Runtime config         | [apps/pwa/src/environments/environment.ts](apps/pwa/src/environments/environment.ts#L1)<br>[scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)<br>[core/src/lib/config/app-env-initializer.ts](core/src/lib/config/app-env-initializer.ts#L1)                                                                                                                                                                                                          | Build-time                                                      | No es runtime config real; Vercel genera un `.ts` antes del build                                                | Alto   |
| Environment config     | [apps/pwa/src/environments/environment.ts](apps/pwa/src/environments/environment.ts#L1)<br>[apps/pwa/src/environments/environment.dev.ts](apps/pwa/src/environments/environment.dev.ts#L1)<br>[apps/pwa/src/environments/environment.qa.ts](apps/pwa/src/environments/environment.qa.ts#L1)<br>[apps/pwa/src/environments/environment.prod.ts](apps/pwa/src/environments/environment.prod.ts#L1)                                                               | 4 archivos TS                                                   | `environment.runtime.ts` no está versionado; se genera durante build Vercel                                      | Medio  |
| Assets/images          | [apps/pwa/public/manifest.webmanifest](apps/pwa/public/manifest.webmanifest#L1)<br>[core/src/lib/pwa/dynamic-pwa-assets.service.ts](core/src/lib/pwa/dynamic-pwa-assets.service.ts#L1)<br>[features-admin/src/lib/services/category.service.ts](features-admin/src/lib/services/category.service.ts#L1)<br>[core/src/lib/services/product.service.ts](core/src/lib/services/product.service.ts#L1)                                                             | Assets públicos + CDN + multipart upload                        | No vi `NgOptimizedImage`; branding PWA se aplica por DOM runtime                                                 | Medio  |
| Error handling         | [core/src/lib/errors/global-error-handler.ts](core/src/lib/errors/global-error-handler.ts#L1)<br>[core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1)<br>[shared/src/lib/utils/snackbar-config.ts](shared/src/lib/utils/snackbar-config.ts#L1)                                                                                                                                                                        | Mínimo y fragmentado                                            | `GlobalErrorHandler` solo loguea; componentes resuelven mensajes por helper                                      | Alto   |
| Loader global          | [shared/src/lib/ui/loader/loader.component.ts](shared/src/lib/ui/loader/loader.component.ts#L1)                                                                                                                                                                                                                                                                                                                                                                | **Brecha detectada**                                            | El componente existe, pero no encontré evidencia de uso global                                                   | Medio  |
| Toasts                 | [shared/src/lib/services/toast.service.ts](shared/src/lib/services/toast.service.ts#L1)<br>[shared/src/lib/ui/toast-container/toast-container.component.ts](shared/src/lib/ui/toast-container/toast-container.component.ts#L1)                                                                                                                                                                                                                                 | Existe toast propio                                             | Coexiste con mucho `MatSnackBar` en admin/superadmin                                                             | Medio  |
| Forms                  | [features-account/src/lib/components/login/login.component.ts](features-account/src/lib/components/login/login.component.ts#L1)<br>[features-account/src/lib/components/register/register.component.ts](features-account/src/lib/components/register/register.component.ts#L1)<br>[features-admin/src/lib/pages/categories/categories-form/category-form.component.ts](features-admin/src/lib/pages/categories/categories-form/category-form.component.ts#L19) | `ReactiveForms`                                                 | Validación y UX manejadas bastante por componente                                                                | Medio  |
| UI library             | [package.json](package.json#L1)<br>[features-admin/src/lib/pages/categories/categories-list/categories-list.component.ts](features-admin/src/lib/pages/categories/categories-list/categories-list.component.ts#L11)                                                                                                                                                                                                                                            | Angular Material + UI propia                                    | Material está muy presente en backoffice                                                                         | Medio  |
| Testing                | [jest.config.ts](jest.config.ts#L1)<br>[apps/pwa/jest.config.ts](apps/pwa/jest.config.ts#L1)<br>[apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1)<br>[apps/pwa-e2e/project.json](apps/pwa-e2e/project.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                                              | Jest y Playwright presentes                                     | E2E no maduro: CI tolera fallo y `webServer` usa `pwa:serve` en vez de `ecommerce:serve`                         | Alto   |
| Linting                | [eslint.config.mjs](eslint.config.mjs#L1)<br>[nx.json](nx.json#L1)                                                                                                                                                                                                                                                                                                                                                                                             | ESLint flat + Nx                                                | Las fronteras de módulo son muy permisivas (`* -> *`)                                                            | Medio  |
| Build/deploy           | [apps/pwa/project.json](apps/pwa/project.json#L1)<br>[vercel.json](vercel.json#L1)                                                                                                                                                                                                                                                                                                                                                                             | Build estático en Vercel                                        | Deep links SPA cubiertos por rewrites; SSR no desplegado                                                         | Medio  |
| CI/CD si existe        | [.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                                                                                                                                                                                                                                                                                        | Sí, GitHub Actions                                              | Lint + test + e2e tolerado + build browser-only + Lighthouse opcional                                            | Medio  |

### 3.1 Capas actuales

| Capa actual           | Propósito real actual                                                          | Ejemplos de archivos                                                                                                                                                                                                                                                                                                        | Uso actual              | Problemas detectados                                                              |
| --------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| `apps/pwa`            | Shell de arranque, configuración, SSR y PWA entrypoints                        | [apps/pwa/src/main.ts](apps/pwa/src/main.ts#L1)<br>[apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)<br>[apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)                                                                                                                               | Correcto para bootstrap | Shell delgada, pero con providers que dependen de librerías internas heterogéneas |
| `core`                | Cross-cutting, auth, tenant, http, pwa, config, modelos y servicios de negocio | [core/src/index.ts](core/src/index.ts#L1)<br>[core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1)<br>[core/src/lib/services/product.service.ts](core/src/lib/services/product.service.ts#L1)                                                                                 | Muy cargada             | Mezcla infraestructura, dominio, estado, rutas de error y utilidades PWA          |
| `shared`              | Layouts, UI reusable, toasts, dialogs, componentes visuales                    | [shared/src/index.ts](shared/src/index.ts#L1)<br>[shared/src/lib/layout/public-layout/public-layout.component.ts](shared/src/lib/layout/public-layout/public-layout.component.ts#L1)<br>[shared/src/lib/ui/toast-container/toast-container.component.ts](shared/src/lib/ui/toast-container/toast-container.component.ts#L1) | Activa                  | También contiene layouts no usados y lógica de tema/DOM duplicada                 |
| `features`            | Storefront público: catálogo y loyalty                                         | [features/src/index.ts](features/src/index.ts#L1)<br>[features/src/lib/catalog/catalog.routes.ts](features/src/lib/catalog/catalog.routes.ts#L1)<br>[features/src/lib/lib.routes.ts](features/src/lib/lib.routes.ts#L1)                                                                                                     | Activa                  | Mezcla catálogo + loyalty bajo una sola librería                                  |
| `features-account`    | Login, register, profile y servicios de cuenta                                 | [features-account/src/index.ts](features-account/src/index.ts#L1)<br>[features-account/src/lib/lib.routes.ts](features-account/src/lib/lib.routes.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                 | Activa                  | El estado/auth del feature cruza con `core/auth`                                  |
| `features-orders`     | Pedido/ordenes del cliente                                                     | [features-orders/src/index.ts](features-orders/src/index.ts#L1)<br>[features-orders/src/lib/lib.routes.ts](features-orders/src/lib/lib.routes.ts#L1)                                                                                                                                                                        | Activa pero mínima      | La librería parece mucho más delgada que el resto; revisar cohesión futura        |
| `features-admin`      | Backoffice por tenant                                                          | [features-admin/src/index.ts](features-admin/src/index.ts#L1)<br>[features-admin/src/lib/lib.routes.ts](features-admin/src/lib/lib.routes.ts#L1)                                                                                                                                                                            | Muy activa              | Librería grande, muchas páginas/servicios y UX inconsistente de errores           |
| `features-superadmin` | Administración general de plataforma/tenants                                   | [features-superadmin/src/index.ts](features-superadmin/src/index.ts#L1)<br>[features-superadmin/src/lib/admin.routes.ts](features-superadmin/src/lib/admin.routes.ts#L1)                                                                                                                                                    | Activa                  | Mezcla páginas placeholder, guards, modelos y servicios en la misma capa          |
| `environments`        | Configuración de ambiente compilada                                            | [apps/pwa/src/environments/environment.ts](apps/pwa/src/environments/environment.ts#L1)                                                                                                                                                                                                                                     | Activa                  | No es runtime config real                                                         |
| `scripts`             | Automatización de build/deploy y verificaciones                                | [scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)                                                                                                                                                                                                                                                                 | Activa                  | Parte del despliegue depende de scripts custom no cubiertos por CI principal      |

**Capas no separadas de forma explícita**

- `data-access`: **Brecha detectada**. No hay librería dedicada; los servicios HTTP están repartidos entre `core` y `features-*`.
- `domain/models`: Parcial. Existen modelos en varias libs, pero no como capa estable separada.
- `infrastructure`: **Brecha detectada**. Se mezcla con `core/http`, `core/config`, `core/pwa`.
- `config` como capa de runtime: **Brecha detectada**.
- `utils/helpers`: Existe en piezas sueltas, no como capa consistente.

### Brechas detectadas

- Landing/corporativo para `dominio.com`: **Brecha detectada**. El router principal no modela un flujo público sin tenant; el `tenantGuard` termina llevando al usuario hacia `/admin` cuando no hay tenant.
- Rutas de error de tenant: **Brecha detectada**. [core/src/lib/routes/tenant-error.routes.ts](core/src/lib/routes/tenant-error.routes.ts#L1) exporta rutas, pero no vi evidencia de montaje en [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1).
- Bootstrap alternativo de tenant: **Brecha detectada**. [core/src/lib/providers/tenant-bootstrap.provider.ts](core/src/lib/providers/tenant-bootstrap.provider.ts#L1) y [core/src/lib/providers/tenant-app-initializer.provider.ts](core/src/lib/providers/tenant-app-initializer.provider.ts#L1) existen, pero no están conectados en [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1).
- Global loader por HTTP: **Brecha detectada**.
- Store central formal: **No evidenciado**.
- Resolvers: **No evidenciado**.
- Favoritos tenant-scoped: **No evidenciado**.
- Runtime config cargado por JSON público validado al inicio: **Brecha detectada**.
- SSR tenant-aware por request: **Brecha detectada**.
- Política de headers de seguridad web en deploy: CSP, HSTS, `frame-ancestors`, etc.: **No evidenciado** en [vercel.json](vercel.json#L1).

### Dudas técnicas antes de implementar

1. ¿`dominio.com` debe ser landing corporativo real, selector de tenant, redirección a admin o página informativa? Hoy ese caso no está modelado explícitamente.
2. ¿El fallback por query param (`?tenant=`) seguirá permitido en producción o debe quedar restringido a local/QA? Esta decisión cambia cache, storage y seguridad.
3. ¿La meta de negocio incluye volver a SSR real por tenant o el despliegue productivo seguirá estático/PWA? Hoy el repo contiene ambos caminos y eso genera deuda.
4. ¿Backend puede migrar auth a cookies `HttpOnly` por subdominio, o el contrato obliga a seguir con bearer token en `localStorage`?
5. ¿`qa` debe usar backend dedicado? Hoy [apps/pwa/src/environments/environment.qa.ts](apps/pwa/src/environments/environment.qa.ts#L1) mantiene un `TODO` y apunta a la URL Azure actual.
6. ¿Superadmin y tenant-admin deben seguir conviviendo en la misma SPA o conviene separar shells y políticas de seguridad a futuro?

## Flujo actual de la aplicación

### 3.2 Flujo actual de arranque

- [apps/pwa/src/main.ts](apps/pwa/src/main.ts#L1) usa `bootstrapApplication(App, appConfig)`.
- [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1) registra hydration, zone change detection, router, HttpClient con `fetch`, Transloco, `APP_ENV`, `APP_INITIALIZER`, `ErrorHandler` y service worker.
- El primer `APP_INITIALIZER` usa [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1) para resolver tenant y luego [core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1) para cargar configuración.
- El segundo `APP_INITIALIZER` aplica SEO, tema, manifest, logger, auth, modo de usuario e inicializa push solo en browser.
- [apps/pwa/src/app/app.ts](apps/pwa/src/app/app.ts#L1) escucha branding y aplica assets PWA dinámicos desde [core/src/lib/pwa/dynamic-pwa-assets.service.ts](core/src/lib/pwa/dynamic-pwa-assets.service.ts#L1).
- El template raíz [apps/pwa/src/app/app.html](apps/pwa/src/app/app.html#L1) solo contiene `router-outlet` más el banner iOS.
- En servidor, [apps/pwa/src/app/app.config.server.ts](apps/pwa/src/app/app.config.server.ts#L1) añade `provideServerRendering`, pero el build/deploy actual no consume este camino de forma efectiva.

### 3.3 Flujo actual de navegación

- [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1) define tres segmentos principales:
  - Storefront público bajo `''` con [shared/src/lib/layout/public-layout/public-layout.component.ts](shared/src/lib/layout/public-layout/public-layout.component.ts#L1) y `tenantGuard`.
  - Superadmin bajo `/admin`.
  - Tenant admin bajo `/tenant-admin` con [shared/src/lib/layouts/tenant-admin-layout/tenant-admin-layout.component.ts](shared/src/lib/layouts/tenant-admin-layout/tenant-admin-layout.component.ts#L1), `AuthGuard` y `EmployeeGuard`.
- Hay lazy loading real hacia catálogo, account, orders, admin y superadmin.
- La protección de rutas privadas se basa en guards funcionales:
  - [core/src/lib/auth/guards/auth.guard.ts](core/src/lib/auth/guards/auth.guard.ts#L1)
  - [core/src/lib/auth/guards/role.guard.ts](core/src/lib/auth/guards/role.guard.ts#L1)
  - [features-superadmin/src/lib/guards/admin-permission.guard.ts](features-superadmin/src/lib/guards/admin-permission.guard.ts#L1)
- El fallback `**` redirige a `''`; no hay 404 funcional dedicado en el router principal.
- Las rutas de error de tenant existen en [core/src/lib/routes/tenant-error.routes.ts](core/src/lib/routes/tenant-error.routes.ts#L1), pero no están montadas en el router principal.
- En despliegue estático, los deep links SPA están cubiertos por rewrites en [vercel.json](vercel.json#L1). Para SSR real, esa cobertura no está evidenciada porque SSR no está desplegado.

### 3.4 Flujo actual de HTTP

- [core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1) construye URLs absolutas a partir de `environment.apiBaseUrl`.
- El interceptor activo es [core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1):
  - añade `Authorization` si existe token,
  - añade `X-Tenant-Slug`,
  - y agrega `?tenant=` como fallback para endpoints tenant-scoped.
- El interceptor de clase [core/src/lib/interceptors/tenant-header.interceptor.ts](core/src/lib/interceptors/tenant-header.interceptor.ts#L1) existe, pero no vi evidencia de registro efectivo en [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1).
- En `401`, el interceptor limpia auth y redirige a login tenant-aware o admin según contexto.
- No encontré refresh token automático a nivel interceptor. [features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1) implementa `refreshToken()`, pero no vi orquestación automática.
- `timeout` está declarado en `defaultOptions` de [core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1), pero **no se aplica** con un operador real.
- Retry seguro: **No evidenciado**.
- Cancelación centralizada: **No evidenciado**.
- Loader global conectado al ciclo HTTP: **No evidenciado**.
- Los mensajes al usuario se resuelven por componente con `ToastService` o `MatSnackBar`; no hay política unificada.

### 3.5 Diagrama textual de flujo actual

```text
Request navegador
-> Vercel rewrite a /index.html
-> main.ts
-> bootstrapApplication(App, appConfig)
-> APP_ENV_INITIALIZER
-> TenantResolutionService.resolveTenant()
-> TenantConfigService.load()
-> Theme/SEO/Manifest/Auth/UserMode init
-> Router
-> PublicLayout o TenantAdminLayout o AdminShell
-> Feature lazy route
-> ApiClientService.buildFullUrl()
-> authTenantInterceptor
-> Backend API
```

Camino SSR teórico actual:

```text
Request servidor
-> server.ts / AngularNodeAppEngine
-> main.server.ts
-> app.config.server.ts
-> provideServerRendering(withRoutes(serverRoutes))
-> serverRoutes = prerender "**"
-> build/deploy actual no usa este camino en producción
```

## Multi-tenant actual

- **Resolución del tenant**: [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1) prioriza subdominio y luego query param `tenant` o `store`.
- **Contexto admin**: el mismo resolver trata `admin`, `localhost`, `dev`, `staging`, etc. como etiquetas reservadas.
- **Dónde se guarda el tenant actual**: en memoria reactiva dentro de [core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1) y [core/src/lib/services/tenant-context.service.ts](core/src/lib/services/tenant-context.service.ts#L1).
- **Cómo afecta API base URL**: la `apiBaseUrl` es global por ambiente; el tenant viaja por `X-Tenant-Slug` y a veces por query param.
- **Cómo afecta branding**: se aplica por runtime en tema, favicon, manifest, SEO y ciertos layouts desde:
  - [core/src/lib/services/theme.service.ts](core/src/lib/services/theme.service.ts#L1)
  - [core/src/lib/services/manifest.service.ts](core/src/lib/services/manifest.service.ts#L1)
  - [core/src/lib/services/seo.service.ts](core/src/lib/services/seo.service.ts#L1)
  - [core/src/lib/pwa/dynamic-pwa-assets.service.ts](core/src/lib/pwa/dynamic-pwa-assets.service.ts#L1)
- **Cómo afecta cache/PWA**: por subdominio hay aislamiento natural de origin. Con query param en mismo host, el service worker y caches del origin no quedan aislados por tenant.
- **Cómo afecta token/session**:
  - token principal: `mtkn_{tenantSlug}` y `superadmin_token` en [core/src/lib/auth/auth.service.ts](core/src/lib/auth/auth.service.ts#L1)
  - refresh token: `TenantStorageService` con scope tenant/global en [features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)
  - carrito público: `public_cart_session_id_{tenant}` en [core/src/lib/services/public-cart-ui.service.ts](core/src/lib/services/public-cart-ui.service.ts#L1)
  - modo de usuario: `user_mode_{tenant}` o global en [core/src/lib/services/user-mode.service.ts](core/src/lib/services/user-mode.service.ts#L1)
  - push token: `push_{slug}` en [core/src/lib/push/push.service.ts](core/src/lib/push/push.service.ts#L1)
  - banner PWA iOS: **global**, no tenant-scoped, en [core/src/lib/pwa/pwa-install.service.ts](core/src/lib/pwa/pwa-install.service.ts#L1)
- **Aislamiento real entre tenants**: parcial. Storage y carrito tienen namespacing en varios casos, pero no hay una política única obligatoria y el fallback por query param reduce aislamiento.
- **Landing sin tenant**: **Brecha detectada**. Hoy el flujo principal acaba en `/admin`.
- **Favoritos**: **No evidenciado**.
- **Riesgo de cruce de datos entre tenants**:
  - Medio en subdominios reales.
  - Alto si se usa query fallback en el mismo host con PWA/service worker y claves no unificadas.

## SSR/PWA actual

### SSR actual

- SSR existe en código:
  - [apps/pwa/src/main.server.ts](apps/pwa/src/main.server.ts#L1)
  - [apps/pwa/src/server.ts](apps/pwa/src/server.ts#L1)
  - [apps/pwa/src/app/app.config.server.ts](apps/pwa/src/app/app.config.server.ts#L1)
  - [apps/pwa/src/app/app.routes.server.ts](apps/pwa/src/app/app.routes.server.ts#L1)
- El build principal en [apps/pwa/project.json](apps/pwa/project.json#L1) está en `outputMode: "static"`.
- CI confirma la decisión operativa actual: [.github/workflows/ci.yml](.github/workflows/ci.yml#L1) usa build browser-only y deja pendiente reactivar SSR.
- Hydration está encendida, pero su beneficio real queda degradado porque el despliegue productivo actual es estático.
- El archivo generado por el build [dist/apps/ecommerce/prerendered-routes.json](dist/apps/ecommerce/prerendered-routes.json#L1) quedó con `"routes": {}`, lo que evidencia prerender inefectivo hoy.
- Riesgo SSR multi-tenant: [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1) depende de `DOCUMENT`/URL del browser y no resuelve tenant en servidor. Por tanto, el tenant no está preparado para render server-side real por request.

### PWA/cache actual

- [apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1) define `assetGroups` para shell y assets estáticos.
- El service worker se registra desde [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1) y se activa en builds productivos.
- Los `dataGroups` configurados son `/public/config` y `/catalog/**`, pero el cliente HTTP usa URLs absolutas al backend desde [core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1). Resultado: la cache de datos del SW no está alineada con el tráfico real.
- Los assets PWA de branding se modifican dinámicamente por DOM/Blob desde [core/src/lib/pwa/dynamic-pwa-assets.service.ts](core/src/lib/pwa/dynamic-pwa-assets.service.ts#L1), mientras [apps/pwa/public/manifest.webmanifest](apps/pwa/public/manifest.webmanifest#L1) sigue siendo genérico.
- El banner iOS y su dismiss son globales, no por tenant.
- Recomendación actual: no endurecer PWA multi-tenant antes de definir si producción será exclusivamente por subdominio o si seguirá admitiendo query fallback.

## Runtime config actual

- El estado actual **no es runtime config real**.
- La app usa `environment.ts` compilado por ambiente:
  - [apps/pwa/src/environments/environment.ts](apps/pwa/src/environments/environment.ts#L1)
  - [apps/pwa/src/environments/environment.dev.ts](apps/pwa/src/environments/environment.dev.ts#L1)
  - [apps/pwa/src/environments/environment.qa.ts](apps/pwa/src/environments/environment.qa.ts#L1)
  - [apps/pwa/src/environments/environment.prod.ts](apps/pwa/src/environments/environment.prod.ts#L1)
- Para Vercel existe una variante build-time en [scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1) que genera `environment.runtime.ts` antes de compilar.
- Ese archivo generado **no está versionado** en el repo. No es una falla por sí misma, pero sí confirma que la app no lee config pública en runtime.
- [core/src/lib/config/app-env-initializer.ts](core/src/lib/config/app-env-initializer.ts#L1) valida y loguea, pero **no bloquea el arranque** si falta config crítica.
- Hay un detalle operativo importante:
  - `npm start` usa `serve:development` desde [package.json](package.json#L1) y [apps/pwa/project.json](apps/pwa/project.json#L1).
  - Ese `development` no reemplaza `environment.ts`.
  - Hasta antes del Lote B, el arranque local por defecto caía en `mockApi: true`; tras Lote B el contrato quedó alineado y el flujo normal usa backend real en todos los ambientes.
- En [apps/pwa/public/config/tenants/README.md](apps/pwa/public/config/tenants/README.md#L1) los JSON locales quedaron documentados como soporte aislado de debugging, fuera del runtime principal: **deuda histórica contenida**.

## HTTP/Auth/Error handling actual

- `ApiClientService` es el wrapper base, pero no representa un estándar de plataforma completo todavía.
- El interceptor funcional activo combina auth y tenant en una sola pieza: [core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1).
- Existe otra solución de tenant headers exportada pero no conectada: [core/src/lib/interceptors/tenant-header.interceptor.ts](core/src/lib/interceptors/tenant-header.interceptor.ts#L1).
- Auth actual:
  - JWT bearer en `localStorage`
  - parsing local de claims con `atob`
  - refresh token guardado por `TenantStorageService`
  - logout limpia carrito público y refresh token
- Error handling actual:
  - global: [core/src/lib/errors/global-error-handler.ts](core/src/lib/errors/global-error-handler.ts#L1) solo delega a `LoggerService`
  - por componente: [shared/src/lib/utils/snackbar-config.ts](shared/src/lib/utils/snackbar-config.ts#L1) extrae mensajes
  - UX: mezcla `ToastService` y `MatSnackBar`
- Loader actual:
  - componente existe en [shared/src/lib/ui/loader/loader.component.ts](shared/src/lib/ui/loader/loader.component.ts#L1)
  - integración global con HTTP: **No evidenciado**
- Seguridad:
  - localStorage para access token y refresh token implica riesgo XSS
  - no vi headers CSP/HSTS en [vercel.json](vercel.json#L1)
- Performance:
  - build baseline dejó un bundle inicial de aproximadamente `994 kB` raw, muy cerca del warning budget configurado en [apps/pwa/project.json](apps/pwa/project.json#L1)

## Deuda técnica

| ID    | Deuda técnica                                            | Evidencia                                                                                                                                                                                                                                                                                         | Impacto                                                              | Prioridad     | Recomendación                                                                           |
| ----- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| DT-01 | SSR y despliegue productivo están divergidos             | [apps/pwa/src/server.ts](apps/pwa/src/server.ts#L1)<br>[apps/pwa/project.json](apps/pwa/project.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                               | Duplica caminos y vuelve incierta la migración de Angular 21 con SSR | P0 bloqueante | Elegir explícitamente si Fase 3 migra solo browser build o si primero se restablece SSR |
| DT-02 | Resolución de tenant no preparada para SSR real          | [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1)<br>[core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1)                                                                                | Impide render server-side por tenant y rompe SEO/branding SSR        | P0 bloqueante | Diseñar tenant resolution por request antes de reactivar SSR                            |
| DT-03 | Coexisten dos estrategias de bootstrap/tenant            | [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)<br>[core/src/lib/services/tenant-bootstrap.service.ts](core/src/lib/services/tenant-bootstrap.service.ts#L1)<br>[core/src/lib/providers/tenant-bootstrap.provider.ts](core/src/lib/providers/tenant-bootstrap.provider.ts#L1) | Confusión, código dormido y alto costo de mantenimiento              | P1 alta       | Consolidar en una sola estrategia y retirar la otra                                     |
| DT-04 | No existe flujo root/landing sin tenant                  | [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)<br>[core/src/lib/routes/tenant-error.routes.ts](core/src/lib/routes/tenant-error.routes.ts#L1)                                                                                                                                | `dominio.com` no está modelado; experiencia y SEO limitados          | P1 alta       | Definir explícitamente landing, selector o redirect policy                              |
| DT-05 | Runtime config es build-time y validación no bloquea     | [scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)<br>[core/src/lib/config/app-env-initializer.ts](core/src/lib/config/app-env-initializer.ts#L1)                                                                                                                                        | Alto riesgo de drift entre dev/qa/pdn                                | P1 alta       | Migrar a config pública validada al arranque con fallback seguro                        |
| DT-06 | Interceptors duplicados y estándar HTTP incompleto       | [core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1)<br>[core/src/lib/interceptors/tenant-header.interceptor.ts](core/src/lib/interceptors/tenant-header.interceptor.ts#L1)                                                                            | Inconsistencia de headers, manejo de errores y evolución difícil     | P1 alta       | Unificar a una cadena funcional corta y declarativa                                     |
| DT-07 | Tokens sensibles en `localStorage`                       | [core/src/lib/auth/auth.service.ts](core/src/lib/auth/auth.service.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                                                                      | Riesgo XSS y complejidad multi-tenant                                | P1 alta       | Evaluar cookies `HttpOnly`; si no es viable, centralizar storage y rotación             |
| DT-08 | Manejo de errores y mensajería no unificado              | [core/src/lib/errors/global-error-handler.ts](core/src/lib/errors/global-error-handler.ts#L1)<br>[shared/src/lib/utils/snackbar-config.ts](shared/src/lib/utils/snackbar-config.ts#L1)<br>[shared/src/lib/services/toast.service.ts](shared/src/lib/services/toast.service.ts#L1)                 | UX inconsistente y más deuda al migrar                               | P1 alta       | Definir `AppError` + mapper + un solo canal UX                                          |
| DT-09 | PWA data cache no corresponde al tráfico real            | [apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1)<br>[core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1)                                                                                                                                        | Offline/cache inconsistente y riesgo multi-tenant en query mode      | P1 alta       | Rediseñar cache strategy después de fijar modelo de tenant                              |
| DT-10 | E2E no es una red de seguridad confiable                 | [apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1)<br>[apps/pwa-e2e/project.json](apps/pwa-e2e/project.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                 | Reduce mucho la seguridad de la migración mayor                      | P1 alta       | Arreglar `webServer`, crear smoke tests reales y dejar de tolerar fallo silencioso      |
| DT-11 | Global loader no conectado                               | [shared/src/lib/ui/loader/loader.component.ts](shared/src/lib/ui/loader/loader.component.ts#L1)                                                                                                                                                                                                   | Feedback pobre en operaciones HTTP y forms                           | P2 media      | Implementar loader global por interceptor con opt-out                                   |
| DT-12 | Límites arquitectónicos Nx muy débiles                   | [eslint.config.mjs](eslint.config.mjs#L1)                                                                                                                                                                                                                                                         | Facilita acoplamiento entre capas                                    | P2 media      | Definir tags y restricciones reales por capa                                            |
| DT-13 | Hay código de layout heredado/no conectado               | [shared/src/lib/ui/layout/layout.component.ts](shared/src/lib/ui/layout/layout.component.ts#L1)<br>[shared/src/lib/layout/admin-layout/admin-layout.component.ts](shared/src/lib/layout/admin-layout/admin-layout.component.ts#L1)                                                                | Incrementa ruido y riesgo de regresión                               | P2 media      | Catalogar y retirar o reubicar layouts no usados                                        |
| DT-14 | Bundle inicial cerca del warning budget                  | Validación `build:prod:browser`                                                                                                                                                                                                                                                                   | Riesgo de performance y degradación móvil                            | P2 media      | Medir rutas pesadas, diferir vistas y optimizar imágenes                                |
| DT-15 | Modo mock local documentado pero sin tenants demo reales | [apps/pwa/public/config/tenants/README.md](apps/pwa/public/config/tenants/README.md#L1)                                                                                                                                                                                                           | Onboarding local confuso                                             | P3 baja       | Crear un tenant demo controlado o documentar `start:dev` como path principal            |

## Riesgos de migración Angular 21

| Riesgo                                       | Causa probable                                                                                  | Archivos afectados                                                                                                                                                                                                                                                                          | Impacto                 | Mitigación antes de migrar                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Incompatibilidad Node/TypeScript/RxJS        | No hay contrato explícito de Node; Angular/Nx/Jest deberán alinearse                            | [package.json](package.json#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                                                                                  | Alto                    | Fase 2: fijar Node LTS soportado, TS exacta y validar matrix oficial                               |
| Incompatibilidad de UI library               | Angular Material/CDK se usa ampliamente en admin y superadmin                                   | [package.json](package.json#L1)<br>[features-admin/src/lib/pages/categories/categories-list/categories-list.component.ts](features-admin/src/lib/pages/categories/categories-list/categories-list.component.ts#L11)                                                                         | Alto                    | Actualizar Material en ventana controlada y probar formularios/tablas/dialogs                      |
| Dependencia implícita de `zone.js`           | La app sigue con `provideZoneChangeDetection` y `zone.js` en polyfills                          | [apps/pwa/project.json](apps/pwa/project.json#L1)<br>[apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)                                                                                                                                                                    | Medio                   | No mezclar Angular 21 con intento de “zoneless” en la misma fase                                   |
| SSR/hydration inconsistente                  | Hydration activada, SSR no desplegado y tenant server-side no resuelto                          | [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)<br>[apps/pwa/src/app/app.config.server.ts](apps/pwa/src/app/app.config.server.ts#L1)<br>[core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1)                     | Alto                    | Mantener browser build durante upgrade; reactivar SSR solo tras estabilizar tenant/request context |
| Service worker/PWA con cache incoherente     | `ngsw-config` no corresponde a URLs API reales                                                  | [apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1)<br>[core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1)                                                                                                                                  | Alto                    | Revisar dataGroups antes de tocar Angular mayor                                                    |
| Builders y despliegue custom                 | Vercel depende de script que genera `environment.runtime.ts`                                    | [scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)<br>[vercel.json](vercel.json#L1)<br>[apps/pwa/project.json](apps/pwa/project.json#L1)                                                                                                                                           | Alto                    | Probar pipeline Vercel completo en QA antes y después del upgrade                                  |
| Scripts personalizados fuera de CI principal | Parte del deploy real no está validada por `build:prod:browser`                                 | [package.json](package.json#L1)<br>[scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)                                                                                                                                                                                              | Medio                   | Añadir validación del build de Vercel en pipeline de migración                                     |
| Dependencias de testing obsoletas            | `jest-preset-angular`, `ts-jest`, Playwright y `@types/node` van por detrás                     | [package.json](package.json#L1)                                                                                                                                                                                                                                                             | Alto                    | Actualizar testing stack después de toolchain base                                                 |
| Tests rotos o poco confiables                | CI tolera fallos e2e y Playwright apunta al proyecto incorrecto                                 | [apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1)<br>[.github/workflows/ci.yml](.github/workflows/ci.yml#L1)                                                                                                                                                        | Alto                    | Corregir baseline e2e antes del upgrade mayor                                                      |
| Uso de APIs browser directas                 | `window`, `document`, `localStorage`, `Notification`, `URL.createObjectURL` en múltiples piezas | [core/src/lib/pwa/pwa-install.service.ts](core/src/lib/pwa/pwa-install.service.ts#L1)<br>[shared/src/lib/ui/header/header.component.ts](shared/src/lib/ui/header/header.component.ts#L1)<br>[shared/src/lib/ui/layout/layout.component.ts](shared/src/lib/ui/layout/layout.component.ts#L1) | Alto si se reactiva SSR | Catalogar acceso directo y encapsularlo detrás de helpers browser-safe                             |
| Lazy routes y rutas dormidas                 | Hay rutas exportadas que no están montadas                                                      | [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1)<br>[core/src/lib/routes/tenant-error.routes.ts](core/src/lib/routes/tenant-error.routes.ts#L1)                                                                                                                          | Medio                   | Limpiar el mapa de rutas antes del upgrade                                                         |
| Interceptors funcionales vs clase            | Dos enfoques activos/inactivos conviven                                                         | [core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1)<br>[core/src/lib/interceptors/tenant-header.interceptor.ts](core/src/lib/interceptors/tenant-header.interceptor.ts#L1)                                                                      | Medio                   | Consolidar un solo enfoque antes de migrar                                                         |
| Environments/runtime config                  | La app mezcla env TS y archivo generado en build                                                | [apps/pwa/src/environments/environment.prod.ts](apps/pwa/src/environments/environment.prod.ts#L1)<br>[scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1)                                                                                                                            | Alto                    | Diseñar estándar estable de config antes del `ng update`                                           |
| APP_INITIALIZER con alta complejidad         | Bootstrap hace demasiado en arranque                                                            | [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1)                                                                                                                                                                                                                         | Medio                   | Reducir responsabilidades por initializer y hacerlas testeables                                    |

### Revisión de dependencias

| Paquete                                                                    |        Versión actual | Uso detectado                                         | Riesgo Angular 21 | Acción recomendada                                                      |
| -------------------------------------------------------------------------- | --------------------: | ----------------------------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `@angular/core` / `@angular/common` / `@angular/router` / `@angular/forms` |             `~20.3.0` | Base de toda la app, standalone y router moderno      | Medio             | Actualizar mayor en Fase 3                                              |
| `@angular/cli` / `@angular/compiler-cli`                                   |             `~20.3.0` | Toolchain Angular                                     | Medio             | Actualizar mayor controlado                                             |
| `@angular/build` / `@angular-devkit/build-angular`                         |             `~20.3.0` | Builder de app Nx/Angular                             | Medio             | Actualizar junto con core/cli                                           |
| `@angular/material` / `@angular/cdk`                                       |            `^20.2.10` | Muy usado en admin/superadmin                         | Alto              | Actualizar mayor y validar tablas, dialogs, form-field, paginator       |
| `@angular/ssr` / `@angular/platform-server`                                |             `~20.3.0` | Código SSR presente pero no operativo en prod         | Alto              | Investigar y actualizar solo con estrategia SSR definida                |
| `@angular/service-worker` / `@angular/pwa`                                 | `~20.3.0` / `^20.3.7` | PWA y SW activos en build prod                        | Medio             | Actualizar mayor y rediseñar cache strategy                             |
| `@jsverse/transloco`                                                       |              `^8.1.0` | i18n en app config y loader                           | Medio             | Investigar compatibilidad y actualizar según soporte Angular 21         |
| `rxjs`                                                                     |              `~7.8.0` | Observable API en servicios y HTTP                    | Medio             | Mantener/alinear en Fase 2 según matrix oficial                         |
| `zone.js`                                                                  |             `~0.15.0` | Polyfills y change detection actual                   | Bajo              | Mantener inicialmente                                                   |
| `typescript`                                                               |              `~5.9.2` | Compilación estricta                                  | Medio             | Ajustar a versión oficialmente soportada por Angular 21                 |
| `nx` / `@nx/angular` / `@nx/*`                                             |              `22.0.1` | Monorepo, testing, lint, Playwright                   | Alto              | Investigar compatibilidad Angular 21 y actualizar si la matrix lo exige |
| `express`                                                                  |             `^4.21.2` | Solo SSR server path                                  | Medio             | Mantener por ahora; reevaluar si SSR vuelve                             |
| `jest-preset-angular`                                                      |             `~14.6.1` | Unit tests Angular                                    | Alto              | Actualizar mayor en fase testing                                        |
| `jest` / `ts-jest`                                                         |   `29.7.0` / `29.1.0` | Unit tests                                            | Medio             | Actualizar después del core upgrade                                     |
| `@playwright/test`                                                         |             `^1.36.0` | E2E                                                   | Medio             | Actualizar y corregir configuración antes de depender de e2e            |
| `angular-eslint` / `eslint`                                                |  `^20.3.0` / `^9.8.0` | Linting                                               | Medio             | Actualizar junto con Nx/Angular                                         |
| `@types/node`                                                              |             `18.16.9` | Tipos Node para build/test/SSR                        | Medio             | Alinear con Node LTS objetivo                                           |
| `prettier`                                                                 |              `^2.6.2` | Formato                                               | Bajo              | Actualizar mayor, separado del upgrade Angular                          |
| `source-map-explorer`                                                      |              `^2.5.3` | Análisis bundle                                       | Bajo              | Mantener                                                                |
| `cross-env`                                                                |              `^7.0.3` | Uso no evidenciado en scripts actuales                | Bajo              | Investigar                                                              |
| `husky` / `lint-staged` / `commitlint`                                     |                varias | DX y hooks                                            | Bajo              | Mantener o actualizar menor                                             |
| Librerías de mapas                                                         |                     — | **No evidenciado** en [package.json](package.json#L1) | —                 | No aplica                                                               |
| Librerías de pagos                                                         |                     — | **No evidenciado** en [package.json](package.json#L1) | —                 | No aplica                                                               |
| Librerías de charts                                                        |                     — | **No evidenciado** en [package.json](package.json#L1) | —                 | No aplica                                                               |
| Librerías de storage externas                                              |                     — | **No evidenciado** en [package.json](package.json#L1) | —                 | No aplica                                                               |

## Arquitectura objetivo recomendada

### Estructura objetivo por capas

| Capa objetivo                     | Responsabilidad                                                  | Qué NO debe contener                         | Ejemplos actuales que deberían moverse o consolidarse                                                                                                                                                                                                                                                                                                                                                                                    | Beneficios                                         | Prioridad |
| --------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------- |
| `src/app/core/config`             | Runtime config, tokens, bootstrap mínimo                         | Servicios de negocio, componentes de feature | [core/src/lib/config/app-env.token.ts](core/src/lib/config/app-env.token.ts#L1)<br>[core/src/lib/config/app-env-initializer.ts](core/src/lib/config/app-env-initializer.ts#L1)<br>[apps/pwa/src/environments/environment.prod.ts](apps/pwa/src/environments/environment.prod.ts#L1)                                                                                                                                                      | Hace predecible el arranque                        | P1        |
| `src/app/core/http`               | `ApiClient`, interceptors, request context, timeout/retry policy | Endpoints de dominio o lógica UI             | [core/src/lib/services/api-client.service.ts](core/src/lib/services/api-client.service.ts#L1)<br>[core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1)                                                                                                                                                                                                                                         | Unifica cross-cutting HTTP                         | P1        |
| `src/app/core/auth`               | Sesión, claims, guards, auth facade                              | Forms UI de login/register                   | [core/src/lib/auth/auth.service.ts](core/src/lib/auth/auth.service.ts#L1)<br>[core/src/lib/auth/guards/auth.guard.ts](core/src/lib/auth/guards/auth.guard.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                                                                                                                      | Reduce acoplamiento entre feature-auth y auth core | P1        |
| `src/app/core/tenant`             | Resolver, contexto, storage namespace, branding, tenant policy   | Endpoints de catálogo/pedidos                | [core/src/lib/services/tenant-resolution.service.ts](core/src/lib/services/tenant-resolution.service.ts#L1)<br>[core/src/lib/services/tenant-config.service.ts](core/src/lib/services/tenant-config.service.ts#L1)<br>[core/src/lib/services/tenant-context.service.ts](core/src/lib/services/tenant-context.service.ts#L1)<br>[core/src/lib/services/tenant-bootstrap.service.ts](core/src/lib/services/tenant-bootstrap.service.ts#L1) | Fuente única de verdad para tenant                 | P1        |
| `src/app/core/errors`             | `AppError`, mappers, ProblemDetails, logging policy              | Toast UI concreta                            | [core/src/lib/errors/global-error-handler.ts](core/src/lib/errors/global-error-handler.ts#L1)<br>[shared/src/lib/utils/snackbar-config.ts](shared/src/lib/utils/snackbar-config.ts#L1)                                                                                                                                                                                                                                                   | Error handling consistente                         | P1        |
| `src/app/shared/ui`               | Componentes visuales reutilizables y headless UI                 | Lógica de dominio y llamadas HTTP            | [shared/src/lib/ui/toast-container/toast-container.component.ts](shared/src/lib/ui/toast-container/toast-container.component.ts#L1)<br>[shared/src/lib/components/confirmation-dialog/confirmation-dialog.component.ts](shared/src/lib/components/confirmation-dialog/confirmation-dialog.component.ts#L1)                                                                                                                               | Reuso y menor duplicidad                           | P2        |
| `src/app/shared/validators`       | Validadores, mappers de errores de formulario                    | Estado de features                           | Validaciones hoy dispersas en [features-account/src/lib/components/register/register.component.ts](features-account/src/lib/components/register/register.component.ts#L1) y formularios admin                                                                                                                                                                                                                                            | Consistencia de forms                              | P2        |
| `src/app/layout`                  | Shells de navegación                                             | Llamadas API y lógica de negocio             | [shared/src/lib/layout/public-layout/public-layout.component.ts](shared/src/lib/layout/public-layout/public-layout.component.ts#L1)<br>[shared/src/lib/layouts/tenant-admin-layout/tenant-admin-layout.component.ts](shared/src/lib/layouts/tenant-admin-layout/tenant-admin-layout.component.ts#L1)<br>[shared/src/lib/layout/admin-layout/admin-layout.component.ts](shared/src/lib/layout/admin-layout/admin-layout.component.ts#L1)  | Separa shell de feature                            | P1        |
| `src/app/features/public`         | Landing corporativa y páginas sin tenant                         | Estado tenant o auth global                  | Hoy **Brecha detectada**                                                                                                                                                                                                                                                                                                                                                                                                                 | Habilita `dominio.com` real                        | P1        |
| `src/app/features/tenant-catalog` | Catálogo, categorías públicas, producto, carrito                 | Servicios cross-cutting                      | [features/src/lib/catalog/catalog.routes.ts](features/src/lib/catalog/catalog.routes.ts#L1)<br>[core/src/lib/services/public-cart-ui.service.ts](core/src/lib/services/public-cart-ui.service.ts#L1)                                                                                                                                                                                                                                     | Slice storefront coherente                         | P1        |
| `src/app/features/tenant-auth`    | Login/register/forgot/profile del tenant                         | Auth storage core                            | [features-account/src/lib/lib.routes.ts](features-account/src/lib/lib.routes.ts#L1)<br>[features-account/src/lib/components/login/login.component.ts](features-account/src/lib/components/login/login.component.ts#L1)                                                                                                                                                                                                                   | Aisla UX auth                                      | P1        |
| `src/app/features/tenant-orders`  | Órdenes del cliente                                              | Providers globales                           | [features-orders/src/lib/lib.routes.ts](features-orders/src/lib/lib.routes.ts#L1)                                                                                                                                                                                                                                                                                                                                                        | Cohesión funcional                                 | P2        |
| `src/app/features/tenant-admin`   | Backoffice por tenant                                            | Cross-cutting HTTP/auth/tenant               | [features-admin/src/lib/lib.routes.ts](features-admin/src/lib/lib.routes.ts#L1)                                                                                                                                                                                                                                                                                                                                                          | Reduce tamaño conceptual del monolito frontend     | P1        |
| `src/app/features/platform-admin` | Superadmin/plataforma                                            | Contexto tenant de tienda                    | [features-superadmin/src/lib/admin.routes.ts](features-superadmin/src/lib/admin.routes.ts#L1)                                                                                                                                                                                                                                                                                                                                            | Aísla políticas de plataforma                      | P1        |
| `src/app/data-access/api`         | Repositorios/adapters HTTP por bounded context                   | UI, layout, guards                           | [features-admin/src/lib/services/category.service.ts](features-admin/src/lib/services/category.service.ts#L1)<br>[core/src/lib/services/product.service.ts](core/src/lib/services/product.service.ts#L1)<br>[features-superadmin/src/lib/services/tenant-admin.service.ts](features-superadmin/src/lib/services/tenant-admin.service.ts#L1)                                                                                              | Limita duplicidad de endpoints y mappers           | P1        |
| `src/app/data-access/models`      | DTOs, modelos externos y mappers                                 | Signals, components                          | Modelos hoy repartidos en `core` y `features-*`                                                                                                                                                                                                                                                                                                                                                                                          | Claridad entre modelo interno y payload backend    | P2        |
| `src/app/state`                   | Estado local compartido por dominio con Signals                  | Endpoints HTTP directos                      | [core/src/lib/services/public-cart-ui.service.ts](core/src/lib/services/public-cart-ui.service.ts#L1)<br>[core/src/lib/services/user-mode.service.ts](core/src/lib/services/user-mode.service.ts#L1)<br>[features-account/src/lib/services/account.service.ts](features-account/src/lib/services/account.service.ts#L1)                                                                                                                  | Hace más visible el estado de UI y sesión          | P2        |

### Estándar recomendado para multi-tenant frontend

**Diseño conceptual**

- **Subdominio como fuente de verdad en producción**. `tenant-a.dominio.com` y `tenant-b.dominio.com` deben ser el mecanismo principal.
- **`dominio.com` sin tenant** debe entrar a una `public landing` explícita, no a `/admin`.
- **Fallback por query param** debe quedar restringido a local/QA o feature flag de diagnóstico.
- **Si tenant no existe** y la ruta requiere tenant, la app debe detener bootstrap funcional de storefront y mostrar una pantalla clara de `tenant not found`.
- **Aislamiento de storage**: ninguna feature debe escribir `localStorage` directamente. Todo pasa por un servicio namespace-aware.
- **Carrito, favoritos, refresh token y UI mode** deben ir con prefijo por tenant.
- **Admin global** debe usar scope propio separado del storefront tenant.
- **PWA cache**: confiar en el aislamiento por subdominio en producción; evitar query-mode productivo con SW activo.
- **Branding** y assets de tenant deben resolverse por configuración tenant-aware y URLs versionadas.
- **No mezclar tenant en query param en endpoints productivos** salvo transición explícita.

**Responsabilidades por servicio**

| Servicio sugerido               | Responsabilidad                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `TenantResolverService`         | Resolver tenant desde host, query debug y política de fallback                           |
| `TenantContextFacade`           | Exponer `tenant`, `status`, `branding`, `requiresTenant`, `isLanding`, `isPlatformAdmin` |
| `TenantSessionNamespaceService` | Generar claves namespaced de auth, cart, favorites, push, ui                             |
| `TenantBrandingService`         | Aplicar tema, favicon, manifest y assets brand-safe                                      |
| `TenantLandingPolicyService`    | Decidir `landing`, `tenant not found`, `platform admin`, `storefront`                    |
| `TenantAssetResolverService`    | Resolver logos, category image base URL, CDN y fallbacks                                 |
| `TenantCachePolicyService`      | Definir qué puede cachearse por tenant y qué no                                          |
| `TenantRouteGuard`              | Bloquear navegación si el tenant requerido no está listo                                 |

**Contratos TypeScript sugeridos**

```ts
export type TenantAppContext = 'landing' | 'storefront' | 'tenant-admin' | 'platform-admin' | 'tenant-not-found';

export interface TenantIdentity {
  slug: string;
  host: string;
  source: 'subdomain' | 'query-debug' | 'server-context';
}

export interface TenantRuntimeContext {
  context: TenantAppContext;
  tenant: TenantIdentity | null;
  requiresTenant: boolean;
  resolved: boolean;
  notFound: boolean;
}

export interface TenantStorageNamespace {
  auth(key: string): string;
  cart(key: string): string;
  favorites(key: string): string;
  ui(key: string): string;
  push(key: string): string;
  global(key: string): string;
}
```

**Riesgos del estándar**

- Si backend no soporta cookies por subdominio, habrá que convivir temporalmente con bearer tokens tenant-scoped.
- Si se mantiene query fallback en producción, el aislamiento de SW y caches seguirá débil.
- Si branding usa URLs no versionadas, pueden aparecer mezclas visuales por cache del navegador/CDN.
- Si `admin` y storefront comparten origin, se complica seguridad y storage.

### Estándar recomendado para runtime config

**Estado actual**

- Compilado por ambiente con TS.
- Vercel genera un `.ts` previo al build.
- No hay fetch de config pública en startup.
- La validación actual no aborta el bootstrap.

**Estándar propuesto**

- Un solo archivo público por ambiente, por ejemplo `app-config.json`, cargado antes de bootstrap.
- Validación de esquema obligatoria; si falla, la app muestra pantalla de configuración inválida y no sigue.
- SSR y browser deben leer la misma semántica de config.
- `dev`, `qa` y `pdn` comparten la misma estructura de contrato, cambia solo el contenido.

**Contrato sugerido**

```ts
export interface PublicRuntimeConfig {
  environmentName: 'dev' | 'qa' | 'pdn';
  apiBaseUrl: string;
  publicAssetBaseUrl: string;
  tenantMode: 'subdomain' | 'subdomain-with-debug-query';
  featureFlags: Record<string, boolean>;
  publicProvider?: 'vercel' | 'custom';
  enableServiceWorker: boolean;
  enableAnalytics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

**Valores recomendados por ambiente**

| Variable              | Dev                            | QA                                         | PDN                 | Nota                                                                                  |
| --------------------- | ------------------------------ | ------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------- |
| `apiBaseUrl`          | backend local o dev compartido | backend QA dedicado                        | backend prod        | Nunca hardcodear URLs de QA/prod en código fuente si se quiere verdadera flexibilidad |
| `publicAssetBaseUrl`  | local/CDN dev                  | CDN QA                                     | CDN prod            | Versionar assets por tenant cuando aplique                                            |
| `environmentName`     | `dev`                          | `qa`                                       | `pdn`               | Explícito                                                                             |
| `tenantMode`          | `subdomain-with-debug-query`   | `subdomain-with-debug-query` o `subdomain` | `subdomain`         | Query fallback solo fuera de PDN                                                      |
| `featureFlags`        | expansivas                     | cercanas a prod                            | estrictas           | Mismas claves en todos los ambientes                                                  |
| `publicProvider`      | `custom`                       | `vercel` o `custom`                        | `vercel` o `custom` | Solo pública                                                                          |
| `enableServiceWorker` | normalmente `false`            | `true`                                     | `true`              | Activación controlada                                                                 |
| `enableAnalytics`     | `false`                        | `false` o limitado                         | `true`              | No usar placeholder permanente                                                        |

**Fallback recomendado si falla la carga**

- No continuar el bootstrap completo.
- Mostrar pantalla técnica amigable.
- Registrar error con `correlationId`.
- Permitir reintento manual.
- En SSR, responder markup de error controlado en vez de HTML parcial.

**Variables que JAMÁS deben ir al frontend**

- Secretos de JWT, signing keys o refresh token signing keys.
- Passwords o connection strings de base de datos.
- Secretos de Azure, AWS, Cloudflare o cualquier proveedor.
- API keys administrativas o de escritura privilegiada.
- Secretos de pagos.
- SMTP credentials.
- VAPID private key.
- Cualquier secreto que permita elevar privilegios sin backend.

### Estándar recomendado para HTTP, errores y loader

**Objetivo**

- Un `ApiClient` delgado.
- 3 a 4 interceptors funcionales máximo.
- Un solo estándar de error y un solo canal de UX.

**Cadena recomendada**

1. `runtimeConfigInterceptor`: asegura base URL válida.
2. `tenantContextInterceptor`: agrega `X-Tenant-Slug` solo donde aplica.
3. `authInterceptor`: agrega token.
4. `requestContextInterceptor`: `correlationId`, loader, timeout, error normalization.

**Políticas**

- `tenant header`: sí, pero no por query param en producción salvo transición.
- `correlationId`: generado por request y visible en errores.
- `global loader`: usar `HttpContextToken` para excluir background requests.
- `ProblemDetails`: mapear `title`, `detail`, `errors`, `status`, `instance`.
- `retry`: solo para `GET`, con backoff corto y límite bajo.
- `timeout`: explícito por tipo de request.
- `POST/PUT/PATCH/DELETE`: sin retry automático.
- `errores de negocio`: se normalizan y se muestran con texto de negocio, no técnico.
- `errores de red`: mensaje amigable y acción de reintento.
- `toasts`: unificar en un `NotificationFacade`; usar snackbars solo si se decide como estándar único.

**Contrato recomendado**

```ts
export interface AppError {
  status?: number;
  code: string;
  message: string;
  userMessage: string;
  correlationId?: string;
  details?: unknown;
}
```

**Mapeo recomendado**

```ts
export interface ProblemDetailsLike {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}
```

### Estándar recomendado para formularios

- Mantener **Reactive Forms** como estándar actual para la migración a Angular 21.
- No recomiendo migrar a Signal Forms en la misma ventana del upgrade mayor.
- Mensajes de validación siempre bajo el input.
- `required` y `optional` visibles en la UI.
- Submit deshabilitado si el formulario es inválido o está guardando.
- Validación en tiempo real después de `touched` o después del primer submit.
- Normalización central de errores backend a errores de campo y errores globales.
- Componentes reutilizables de campo para:
  - label,
  - help text,
  - error text,
  - loading/saving,
  - hint de accesibilidad,
  - `autocomplete`.
- Accesibilidad:
  - `aria-invalid`,
  - `aria-describedby`,
  - foco al primer error,
  - mensajes legibles por screen reader.
- Estados `loading/saving` consistentes.
- Validaciones de negocio encapsuladas en validators compartidos, no repetidas por componente.

**Conviene migrar a nuevas APIs de forms de Angular 21 ahora**

- **No**. Déjalo como fase futura de modernización, no como prerequisito del upgrade mayor.

### Mejoras futuras opcionales

- Introducir `NgOptimizedImage` en storefront y branding crítico.
- Adoptar `deferrable views` en páginas pesadas del catálogo y backoffice.
- Evaluar zoneless solo después de estabilizar Angular 21.
- Evaluar Signal Forms cuando el estándar Reactive Forms ya esté consolidado.
- Separar más el backoffice tenant-admin del storefront si el negocio lo exige.
- Llevar SSR por tenant a una arquitectura server-aware cuando el hosting y backend estén listos.

## Roadmap de migración por fases

### Fase 0 — Auditoría y baseline

- **Objetivo**: congelar baseline técnico y funcional del estado actual.
- **Tareas**: documentar arquitectura, inventariar dependencias, fijar Node/NPM objetivo, validar build actual, listar flujos críticos y riesgos.
- **Archivos probables**: [package.json](package.json#L1), [apps/pwa/project.json](apps/pwa/project.json#L1), [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1), [vercel.json](vercel.json#L1), [.github/workflows/ci.yml](.github/workflows/ci.yml#L1).
- **Riesgo**: bajo.
- **Criterio de aceptación**: existe baseline documentado, build actual validado y lista de riesgos aprobada.
- **Comando de validación**: `npm ci && npm run build:prod:browser`
- **Evidencia esperada**: build exitoso, matriz de dependencias, mapa de arquitectura, checklist pre-migración.

### Fase 1 — Limpieza previa sin cambiar Angular mayor

- **Objetivo**: reducir deuda que vuelve peligrosa la migración.
- **Tareas**: consolidar estrategia tenant bootstrap, decidir flujo `dominio.com`, cablear o retirar rutas de tenant error, estandarizar runtime config, revisar browser APIs directas, corregir E2E config, revisar PWA dataGroups, catalogar código no usado.
- **Archivos probables**: [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1), [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1), [core/src/lib/services/tenant-bootstrap.service.ts](core/src/lib/services/tenant-bootstrap.service.ts#L1), [core/src/lib/routes/tenant-error.routes.ts](core/src/lib/routes/tenant-error.routes.ts#L1), [apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1), [apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1).
- **Riesgo**: medio.
- **Criterio de aceptación**: un solo flujo tenant documentado/activo, E2E baseline corregido, PWA/cache entendida y runtime config con contrato claro.
- **Comando de validación**: `npm run build:prod:browser && npm run lint`
- **Evidencia esperada**: build estable, smoke de navegación estable, reglas de tenant y deploy documentadas.

### Fase 2 — Actualización de toolchain

- **Objetivo**: alinear prerequisitos del ecosistema antes del cambio mayor.
- **Tareas**: fijar Node LTS, revisar compatibilidad oficial Angular/Nx/TS/RxJS, actualizar herramientas auxiliares si hace falta, regenerar lockfile controladamente.
- **Archivos probables**: [package.json](package.json#L1), [.github/workflows/ci.yml](.github/workflows/ci.yml#L1), `package-lock.json`.
- **Riesgo**: medio.
- **Criterio de aceptación**: toolchain acordado y build actual sigue pasando.
- **Comando de validación**: `node -v && npm -v && npm run build:prod:browser`
- **Evidencia esperada**: matrix de compatibilidad, lockfile regenerado y build limpio.

### Fase 3 — Migración Angular core/cli a 21

- **Objetivo**: actualizar Angular y aplicar migraciones automáticas en entorno controlado.
- **Tareas**: crear rama de migración, ejecutar `ng update` o `nx migrate` según matrix oficial, revisar migraciones, corregir breaking changes de compilación, validar routing, hydration y service worker.
- **Archivos probables**: [package.json](package.json#L1), [apps/pwa/project.json](apps/pwa/project.json#L1), [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1), [apps/pwa/src/main.ts](apps/pwa/src/main.ts#L1), [apps/pwa/src/main.server.ts](apps/pwa/src/main.server.ts#L1).
- **Riesgo**: alto.
- **Criterio de aceptación**: app compila, router levanta, Material y testing stack principal siguen operativos.
- **Comando de validación**: `npm run build:prod:browser`
- **Evidencia esperada**: `package.json` actualizado, migraciones ejecutadas, build sin errores.

**Comandos sugeridos a validar contra la matrix oficial antes de ejecutar**

- `npx ng update @angular/core@21 @angular/cli@21`
- `npx ng update @angular/material@21`
- Si Nx lo requiere por compatibilidad oficial: `npx nx migrate @nx/workspace@<compatible> @nx/angular@<compatible>`

### Fase 4 — Actualización de librerías externas

- **Objetivo**: llevar Material, testing, lint y libs auxiliares a versiones compatibles.
- **Tareas**: actualizar Material/CDK, Transloco, Jest stack, Playwright, Angular ESLint y tipos Node; retirar dependencias no usadas.
- **Archivos probables**: [package.json](package.json#L1), [apps/pwa/jest.config.ts](apps/pwa/jest.config.ts#L1), [apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1), [eslint.config.mjs](eslint.config.mjs#L1).
- **Riesgo**: alto.
- **Criterio de aceptación**: dependencias externas alineadas y sin romper build/lint/test principal.
- **Comando de validación**: `npm run lint && npm run build:prod:browser`
- **Evidencia esperada**: matriz de compatibilidad actualizada y PRs por grupo de librerías.

### Fase 5 — Modernización Angular

- **Objetivo**: aprovechar Angular moderno sin reescritura masiva.
- **Tareas**: consolidar interceptors funcionales, simplificar initializers, aplicar `deferrable views` donde convenga, mejorar split de rutas, revisar componentes heredados/no usados.
- **Archivos probables**: [apps/pwa/src/app/app.config.ts](apps/pwa/src/app/app.config.ts#L1), [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1), [core/src/lib/http/auth-tenant.interceptor.ts](core/src/lib/http/auth-tenant.interceptor.ts#L1), [shared/src/lib/ui/layout/layout.component.ts](shared/src/lib/ui/layout/layout.component.ts#L1).
- **Riesgo**: medio.
- **Criterio de aceptación**: menos duplicidad arquitectónica, mismo comportamiento funcional.
- **Comando de validación**: `npm run build:prod:browser`
- **Evidencia esperada**: diff arquitectónicamente pequeño, sin regressions visibles.

### Fase 6 — Hardening multi-tenant/PWA

- **Objetivo**: cerrar aislamiento entre tenants y estabilizar experiencia PWA.
- **Tareas**: unificar keys storage, eliminar accesos directos a `localStorage`, definir política de tenant query fallback, rediseñar cache strategy, versionar branding/assets, decidir landing root.
- **Archivos probables**: [core/src/lib/services/tenant-storage.service.ts](core/src/lib/services/tenant-storage.service.ts#L1), [core/src/lib/auth/auth.service.ts](core/src/lib/auth/auth.service.ts#L1), [core/src/lib/pwa/pwa-install.service.ts](core/src/lib/pwa/pwa-install.service.ts#L1), [apps/pwa/ngsw-config.json](apps/pwa/ngsw-config.json#L1), [apps/pwa/src/app/app.routes.ts](apps/pwa/src/app/app.routes.ts#L1).
- **Riesgo**: alto.
- **Criterio de aceptación**: storage y cache se comportan por tenant sin contaminación cruzada.
- **Comando de validación**: `npm run build:prod:browser`
- **Evidencia esperada**: smoke test multi-tenant estable y reglas de aislamiento documentadas.

### Fase 7 — QA técnico y funcional

- **Objetivo**: validar la app como producto, no solo como compilación.
- **Tareas**: smoke tests de rutas, auth, carrito, checkout, admin, SSR si aplica, PWA, tenant not found, landing root y subdominios.
- **Archivos probables**: [apps/pwa-e2e/playwright.config.ts](apps/pwa-e2e/playwright.config.ts#L1), `apps/pwa-e2e/src/**/*.ts`.
- **Riesgo**: alto.
- **Criterio de aceptación**: smoke suite mínima verde y rutas críticas verificadas manualmente.
- **Comando de validación**: `npm run e2e`
- **Evidencia esperada**: reporte e2e, checklist funcional firmado, bugs priorizados.

### Fase 8 — Preparación PDN

- **Objetivo**: salida segura a producción.
- **Tareas**: checklist final, rollback plan, variables públicas verificadas, observabilidad básica, performance básica, revisión headers y caching.
- **Archivos probables**: [vercel.json](vercel.json#L1), [.github/workflows/ci.yml](.github/workflows/ci.yml#L1), [scripts/inject-env-vars.js](scripts/inject-env-vars.js#L1).
- **Riesgo**: alto.
- **Criterio de aceptación**: plan de rollback aprobado, build/release reproducible y validación QA completa.
- **Comando de validación**: `npm run build:prod:browser`
- **Evidencia esperada**: release checklist, rollback documentado, validación de config y monitoreo.

## Checklist de validación

### Antes

- [ ] Revisar Angular Update Guide oficial
- [ ] Revisar Version Compatibility oficial
- [ ] Confirmar Node compatible
- [ ] Confirmar TypeScript compatible
- [ ] Confirmar RxJS compatible
- [ ] Confirmar build actual
- [ ] Confirmar SSR actual
- [ ] Confirmar PWA actual
- [ ] Confirmar deploy QA
- [ ] Crear rama `migration/angular-21`
- [ ] Confirmar si `dominio.com` será landing, selector o redirect
- [ ] Confirmar si query fallback de tenant seguirá permitido en producción
- [ ] Corregir baseline E2E antes de depender de él
- [ ] Definir si la migración cubrirá SSR real o solo browser build

### Durante

- [ ] Ejecutar `ng update`
- [ ] Revisar migrations
- [ ] Revisar `package.json`
- [ ] Revisar lockfile
- [ ] Corregir errores TS
- [ ] Corregir errores templates
- [ ] Corregir errores SSR
- [ ] Corregir errores tests
- [ ] Validar rutas
- [ ] Validar que solo exista una estrategia activa de tenant bootstrap
- [ ] Validar interceptors funcionales finales
- [ ] Validar runtime config final en dev/qa/pdn
- [ ] Validar `tenant not found` y root landing

### Después

- [ ] Build production
- [ ] SSR local
- [ ] Deploy QA
- [ ] Smoke test multi-tenant
- [ ] Smoke test auth
- [ ] Smoke test carrito
- [ ] Smoke test checkout
- [ ] Smoke test admin
- [ ] Lighthouse básico
- [ ] Validar service worker
- [ ] Validar rollback
- [ ] Validar headers de seguridad web
- [ ] Validar no contaminación de storage/caches entre tenants

## Primer lote técnico recomendado

La recomendación concreta es **empezar por Fase 0 y preparar inmediatamente cuatro puntos de Fase 1**: decisión de root landing, consolidación del bootstrap tenant, corrección del baseline E2E y definición del estándar de runtime config. Con eso reduces mucho el riesgo sin tocar todavía Angular mayor.

**Primer lote sugerido**

1. Documentar decisión de `dominio.com` y política de tenant fallback.
2. Consolidar una sola estrategia de tenant init y retirar la dormida.
3. Corregir Playwright para que realmente levante `ecommerce`.
4. Definir contrato de runtime config público y plan de validación.
5. Revisar `ngsw-config` contra URLs API reales.
6. Catalogar y retirar layouts/rutas no conectadas.

**Prompt corto para ejecutar solo Fase 0**

```text
Haz únicamente la Fase 0 del plan de migración Angular 21 para este monorepo Nx Angular. No modifiques Angular mayor ni librerías todavía. Quiero: baseline técnico, validación de build actual, inventario de dependencias, matriz de riesgos inicial, decisiones pendientes y checklist pre-migración. Si ejecutas comandos, limítate a validación y diagnóstico.
```

**Prompt corto para ejecutar solo Fase 1**

```text
Ejecuta únicamente la Fase 1 de estabilización previa a Angular 21 en este frontend Nx Angular. No actualices Angular mayor todavía. Prioriza: consolidar flujo tenant/bootstrap, definir comportamiento root sin tenant, corregir baseline E2E, estabilizar runtime config, revisar browser APIs inseguras para SSR y alinear PWA/cache con el tráfico real.
```

**Recomendación final**

No migraría “ya” a Angular 21 en este estado sin preparación previa. La recomendación técnica correcta es: **preparar primero, estabilizar por fases y luego migrar Angular 21 con un browser build seguro como baseline; SSR debe tratarse como una línea de trabajo separada o posterior, no mezclada en el mismo salto mayor**.
