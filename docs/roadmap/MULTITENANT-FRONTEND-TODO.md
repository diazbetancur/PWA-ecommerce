# MULTITENANT FRONTEND TODO

## Estado general

- Proyecto: `PWA-ecommerce`
- Fecha de creacion: `2026-04-27`
- Rama actual: `main`
- Objetivo actual: mantener estable el cierre tecnico de los Lotes A, B, C, C.1 y D, y preparar la fase previa a Angular 21.
- Decision principal: el tenant se resuelve unicamente por subdominio en todos los ambientes.
- Estado global: `[~]` Lotes A, B, C, C.1 y D ejecutados; quedan pendientes de SSR host-aware, QA real y tareas transversales previas a Angular 21.

## Leyenda de estados

- `[ ]` Pendiente
- `[~]` En progreso
- `[x]` Cerrado
- `[!]` Bloqueado
- `[?]` Pendiente de decision

## Decisiones arquitectonicas cerradas

- `[x]` Tenant se resuelve unicamente por subdominio.
- `[x]` No se permite `?tenant=`.
- `[x]` No se permite `?store=`.
- `[x]` No se permite fallback por query params.
- `[x]` Local, dev, QA y PDN deben funcionar igual a nivel funcional.
- `[x]` Las diferencias por ambiente solo pueden ser valores de configuracion.
- `[x]` Objetivo de arquitectura: PWA con SSR.

## Decisiones pendientes

- `[?]` Definir comportamiento del dominio raiz sin tenant.
  - Opciones posibles:
    - Landing corporativa.
    - Pantalla informativa existente.
    - Redirect explicito.
- `[?]` Definir convencion oficial para subdominios locales.
  - Ejemplo: `tenant.localhost:4200`.
  - Alternativa: `tenant.local.test`.
- `[?]` Definir politica default de `SHOW_HTTP_ERROR_TOAST` por dominio funcional.
  - Estado actual: queda `opt-in` por `HttpContextToken` para evitar doble mensajeria mientras conviven `MatSnackBar`, mensajes de formulario y `ToastService`.
- `[?]` Definir el punto oficial de inyeccion del host de request para SSR real.
  - Opciones posibles:
    - InjectionToken server-only provisto desde `server.ts`.
    - Adaptador host-aware compartido entre browser y server.
- `[?]` Definir si la futura activacion de SSR vivira en hosting Node dedicado o seguira separada del despliegue estatico actual.

## Pendientes operativos detectados

- `[ ]` Migrar variables de Vercel de `NG_APP_*` a `APP_*`.
- `[ ]` Retirar fallback legacy de `scripts/inject-env-vars.js` despues de validar QA.
- `[ ]` Revisar `features-superadmin/src/lib/services/tenant-admin.service.ts` porque aun construye `?tenant=` para el flujo de repair fuera del stack HTTP base.
- `[!]` Validar envio real de correos de activacion y recuperacion en QA/PDN con proveedor backend real; este lote solo dejo el frontend alineado al contrato seguro.
- `[ ]` Validar en QA el flujo real de correos y acceso para:
  - `create tenant`
  - `activation email`
  - `activate account`
  - `login`
  - `forgot password`
  - `reset email`
  - `reset password`
- `[ ]` Revisar el budget inicial del bundle; despues de C.1 la advertencia subio a `55.06 kB` por encima del limite de `1.00 MB`.
- `[ ]` Asegurar `npx playwright install chromium` o equivalente en CI/bootstrap local para que los smoke tests corran en entornos limpios.
- `[ ]` Verificar manualmente en navegador con sesion real de superadmin que `/admin/tenants` responda `200` y envie `Authorization: Bearer` sin `X-Tenant-Slug`.
- `[ ]` Verificar manualmente en navegador desde `print3d.localhost:4200` que `GET /api/public/tenant/print3d` responda sin `tenant/store` por query y con `X-Tenant-Slug: print3d`.

## Lote A — Tenant resolution por subdominio

Objetivo:
Eliminar toda resolucion heredada por query params y dejar el subdominio como unica fuente de verdad.

Pendientes minimos:

- `[x]` Quitar resolucion por `?tenant=` en `tenant-resolution.service.ts`.
- `[x]` Quitar resolucion por `?store=` en `tenant-resolution.service.ts`.
- `[x]` Quitar agregado de tenant por query en `auth-tenant.interceptor.ts`.
- `[x]` Quitar redirect de login con tenant query en `auth.guard.ts`.
- `[x]` Quitar redirect de login con tenant query en `auth-tenant.interceptor.ts`.
- `[x]` Quitar tenant query en `auth.service.ts`.
- `[x]` Revisar y simplificar `tenant-url.service.ts`.
- `[x]` Montar rutas de error de tenant en `app.routes.ts`.
- `[x]` Garantizar pantalla controlada para tenant invalido.
- `[x]` Dejar comportamiento minimo explicito del dominio raiz con redirect temporal a `/admin`.
- `[x]` Cuarentenar providers/interceptors legacy de bootstrap tenant fuera del barrel publico de `@pwa/core`.
- `[x]` Garantizar que el algoritmo de resolucion sea igual en local/dev/qa/pdn.
- `[x]` Garantizar que `localhost` sin subdominio no se trate como tienda.
- `[x]` Garantizar que la tienda solo viva en host con subdominio real.
- `[ ]` Retirar fisicamente `tenant-app-initializer.provider.ts` y `tenant-bootstrap.provider.ts` cuando se ejecute la consolidacion final del flujo tenant.

Criterios de aceptacion:

- `[x]` Ninguna resolucion real usa query params.
- `[x]` Ninguna request HTTP envia `tenant` o `store` por query.
- `[x]` El tenant se obtiene solo desde host/subdominio.
- `[x]` Tenant invalido muestra pantalla controlada.
- `[x]` Dominio raiz tiene comportamiento explicito.
- `[x]` Local, dev, QA y PDN usan el mismo algoritmo.

## Lote B — Configuracion publica por ambiente

Objetivo:
Separar comportamiento de configuracion. Todos los ambientes deben comportarse igual; solo cambian valores.

Pendientes minimos:

- `[x]` Revisar `environment.ts`.
- `[x]` Revisar `environment.dev.ts`.
- `[x]` Revisar `environment.qa.ts`.
- `[x]` Revisar `environment.prod.ts`.
- `[x]` Quitar `mockApi` del flujo funcional normal.
- `[x]` Ampliar contrato de `APP_ENV`.
- `[x]` Revisar `app-env.service.ts`.
- `[x]` Revisar `app-env-initializer.ts`.
- `[x]` Mantener `inject-env-vars.js` solo para valores publicos permitidos.
- `[x]` Documentar variables publicas permitidas.
- `[x]` Documentar variables prohibidas en frontend.

Criterios de aceptacion:

- `[x]` Ningun ambiente cambia reglas funcionales.
- `[x]` Solo cambian valores publicos.
- `[x]` No hay ramas funcionales por `environmentName`.
- `[x]` No hay secretos en frontend.

## Lote C — HTTP, loader y errores

Objetivo:
Estabilizar el flujo base HTTP y preparar UX consistente sin rehacer auth ni formularios completos.

Pendientes minimos:

- `[x]` Dejar un solo interceptor responsable de tenant header.
- `[x]` Retirar o dejar fuera del flujo `tenant-header.interceptor.ts`.
- `[x]` Quitar cualquier tenant query del interceptor activo.
- `[x]` Enviar `X-Tenant-Slug` solo desde contexto tenant real.
- `[x]` Limpiar referencias legacy a `TenantHeaderInterceptor` en documentacion y pruebas internas.
- `[x]` Preparar `X-Correlation-Id`.
- `[x]` Crear o conectar `LoaderService`.
- `[x]` Crear `HttpContextToken` para requests silenciosas.
- `[x]` Montar `loader.component.ts` en `app.html`.
- `[x]` Montar `toast-container.component.ts` en `app.html`.
- `[x]` Crear contrato `AppError`.
- `[x]` Crear mapper base de errores HTTP/red.
- `[x]` Definir `ToastService` como canal recomendado.
- `[ ]` Retirar fisicamente `tenant-header.interceptor.ts` y `tenant-interceptor.provider.ts` cuando se ejecute la consolidacion final del stack HTTP.

Criterios de aceptacion:

- `[x]` Requests no silenciosas muestran loader.
- `[x]` Requests silenciosas no muestran loader.
- `[x]` Error de red muestra mensaje generico consistente.
- `[x]` Errores HTTP quedan normalizados.
- `[x]` No se duplican headers tenant.
- `[x]` No se envia tenant por query.

## Lote C.1 — Auth UX: activacion segura, forgot password, reset password, login y creacion tenant

Objetivo:
Cerrar la UX minima de autenticacion sin exponer secretos, alineando login tenant, activacion de cuenta, recuperacion de acceso y creacion segura de tenant con el backend actual.

Pendientes minimos:

- `[x]` Alinear `CreateTenantResponse` al contrato seguro sin `temporaryPassword`.
- `[x]` Quitar de la UI de creacion de tenant cualquier password temporal, token o secreto visible.
- `[x]` Mostrar mensaje seguro de exito segun `activationNotificationAccepted`.
- `[x]` Soportar `PendingActivation` en create tenant, lista y detalle de tenants.
- `[x]` Crear ruta `/account/activate-account`.
- `[x]` Crear ruta `/account/reset-password`.
- `[x]` Crear pantallas dedicadas de activacion y reset con manejo transitorio del `token` por query param.
- `[x]` Reutilizar validacion de password fuerte y confirmacion de password.
- `[x]` Alinear `forgotPassword()` a `POST /api/auth/forgot-password`.
- `[x]` Alinear `resetPassword()` a `POST /api/auth/reset-password` enviando `confirmPassword`.
- `[x]` Agregar `activateAccount()` a `AccountService` contra `POST /api/auth/activate-account`.
- `[x]` Mantener login tenant en `POST /auth/login` y evitar `POST /api/auth/login`.
- `[x]` Quitar credenciales seed y restriccion local innecesaria de password en login.
- `[x]` Extender el mapper central para codigos de activacion, reset, tenant y credenciales.
- `[x]` Alinear mensajes genericos de forgot password en pagina y modal auth.
- `[!]` Validar envio real de correos y apertura de enlaces en ambiente con proveedor de email real.
- `[ ]` Implementar reenvio manual de activacion solo si backend expone un contrato oficial para ese flujo.

Criterios de aceptacion:

- `[x]` La creacion de tenant no muestra passwords temporales ni tokens.
- `[x]` La creacion de tenant muestra solo copy seguro orientado a activacion por correo.
- `[x]` Activacion y reset no muestran ni persisten el token en estado durable.
- `[x]` Activacion y reset validan password fuerte y confirmacion antes de enviar.
- `[x]` Forgot password devuelve copy generico sin filtrar existencia de cuenta.
- `[x]` Login tenant sigue usando el endpoint correcto `/auth/login`.
- `[x]` Los errores de auth y middleware tenant quedan mapeados por el stack central.
- `[x]` `npm run lint` pasa.
- `[x]` `npm run build:prod:browser` pasa.
- `[x]` `npm run test` pasa.
- `[!]` La verificacion de entrega real de correo queda pendiente del backend/ambiente.

## Lote D — PWA, SSR y smoke tests

Objetivo:
Alinear PWA + SSR con tenant por subdominio y crear una red minima de pruebas antes de Angular 21.

Pendientes minimos:

- `[x]` Revisar `ngsw-config.json`.
- `[x]` Retirar o ajustar `dataGroups` que no representen trafico real.
- `[x]` Evitar cualquier cache basada en query params tenant.
- `[x]` Revisar `app.config.server.ts`.
- `[x]` Revisar `main.server.ts`.
- `[x]` Revisar `server.ts`.
- `[x]` Revisar `app.routes.server.ts`.
- `[!]` Preparar HostResolver compatible con SSR.
- `[x]` No activar SSR completo todavia si implica riesgo alto.
- `[x]` Corregir `playwright.config.ts`.
- `[x]` Reemplazar smoke placeholder.
- `[x]` Crear smoke para dominio raiz.
- `[x]` Crear smoke para tenant valido.
- `[x]` Crear smoke para tenant invalido.
- `[x]` Crear smoke para login.
- `[x]` Crear smoke para activate account sin token.
- `[x]` Crear smoke para forgot password.
- `[x]` Crear smoke para reset password sin token.
- `[x]` Crear smoke para catalogo.
- `[x]` Crear smoke para carrito.
- `[x]` Crear smoke para tenant-admin protegido.

Criterios de aceptacion:

- `[x]` PWA no cachea datos por tenant query.
- `[x]` Subdominio es la base de aislamiento.
- `[!]` SSR queda encaminado para resolver host por request, pero sigue pendiente la inyeccion real del host en runtime server.
- `[x]` Smoke tests minimos ejecutan correctamente.
- `[x]` La futura migracion Angular 21 tiene red minima de seguridad.

## Hotfix — Restaurar Authorization header en rutas protegidas

Objetivo:
Restaurar el envio de `Authorization: Bearer <token>` en rutas protegidas de superadmin y backend administrativo sin mezclarlo con la decision de `X-Tenant-Slug`.

Pendientes minimos:

- `[x]` Diagnosticar por qué `/admin/tenants` no envía Bearer token.
- `[x]` Corregir interceptor/servicio de auth para adjuntar token en rutas protegidas.
- `[x]` Validar `/admin/tenants`.
- `[x]` Validar que no se reintroduce tenant por query.
- `[ ]` Validar login/admin en navegador con sesion real.

Criterios de aceptacion:

- `[x]` Request a `/admin/tenants` con token existente agrega `Authorization: Bearer` en prueba focalizada.
- `[x]` Request tenant-scoped mantiene `Authorization` y `X-Tenant-Slug` cuando aplica.
- `[x]` Ninguna request vuelve a agregar `tenant` o `store` por query.
- `[x]` El build browser sigue pasando.
- `[x]` `npm run lint` pasa.
- `[x]` `npm run test` pasa.
- `[ ]` Verificacion manual en DevTools de status `200` para `/admin/tenants`.

## Hotfix — Restaurar X-Tenant-Slug en endpoints publicos tenant-aware

Objetivo:
Restaurar el envio de `X-Tenant-Slug` en endpoints publicos tenant-aware como `/api/public/tenant/:slug` cuando el tenant real ya fue resuelto por subdominio, sin volver a `?tenant=` ni mezclar esa decision con `/admin/*`.

Causa raiz:
`TenantResolutionService` si resuelve `print3d` desde `print3d.localhost`, y `authTenantInterceptor` si puede adjuntar `X-Tenant-Slug`, pero `TenantContextService.shouldIncludeTenantHeaders()` descartaba en bloque todo `/api/public/*`. Ademas, durante el bootstrap sin config cargada, `isGeneralAdminMode()` considera `slug === null`, por lo que el endpoint de bootstrap `/api/public/tenant/:slug` quedaba bloqueado aun teniendo tenant resuelto por el resolver de subdominio.

Pendientes minimos:

- `[x]` Confirmar que `print3d.localhost` sigue resolviendo tenant por subdominio.
- `[x]` Reclasificar `/api/public/tenant/:slug` como endpoint publico tenant-aware.
- `[x]` Mantener `/api/public/health` y otros publicos no tenant-aware sin `X-Tenant-Slug`.
- `[x]` Mantener `/admin/*` y `/superadmin/*` sin `X-Tenant-Slug` y con paso por interceptor para `Authorization`.
- `[x]` Validar que no se reintroducen `tenant` ni `store` por query.
- `[ ]` Validar manualmente la request real desde `print3d.localhost:4200`.

Criterios de aceptacion:

- `[x]` `GET /api/public/tenant/print3d` agrega `X-Tenant-Slug: print3d` en prueba focalizada.
- `[x]` `GET /api/public/tenant/print3d` no agrega `Authorization` si no hay token.
- `[x]` `GET /api/public/tenant/print3d` no agrega `tenant` ni `store` por query.
- `[x]` `GET /api/public/tenant/print3d` sigue llevando `X-Correlation-Id`.
- `[x]` `/admin/tenants` sigue agregando `Authorization` y sigue sin `X-Tenant-Slug`.
- `[x]` Un endpoint tenant-scoped autenticado sigue agregando `Authorization` y `X-Tenant-Slug`.
- `[x]` `npm run lint` pasa.
- `[x]` `npm run build:prod:browser` pasa.
- `[x]` `npm run test` pasa.
- `[ ]` Verificacion manual en DevTools del header `X-Tenant-Slug` para `/api/public/tenant/print3d`.

## Comandos de validacion

```bash
npm run lint
npm run build:prod:browser
npm run test
npx playwright test
```

## Que NO se debe tocar todavia

- Angular 21.
- Upgrade mayor de librerias.
- Signal Forms.
- Zoneless.
- Refactor masivo de carpetas.
- Cambio completo de auth a cookies.
- Reescritura completa de SSR.
- Rediseno total de PWA.

## Historial de cambios

### 2026-04-27 — Hotfix X-Tenant-Slug restaurado en endpoints publicos tenant-aware

- Resumen: se detecto que la resolucion de tenant por subdominio seguia funcionando, pero la clasificacion HTTP impedia enviar `X-Tenant-Slug` al endpoint de bootstrap `/api/public/tenant/:slug`; el hotfix abrio solo ese patron como endpoint publico tenant-aware, sin reintroducir `tenant/store` por query ni afectar el comportamiento previo de `/admin/*`; se agregaron regresiones para el caso `print3d.localhost`, para la exclusion de `/api/public/health` y para la persistencia del comportamiento de `/admin/tenants`.
- Archivos modificados:
  - `docs/roadmap/MULTITENANT-FRONTEND-TODO.md`
  - `core/src/lib/services/tenant-context.service.ts`
  - `core/src/lib/tests/api-client-integration.spec.ts`
  - `core/src/lib/tests/tenant-context-http-classification.spec.ts`
- Comandos ejecutados:
  - `npx jest --config core/jest.config.ts --runTestsByPath core/src/lib/tests/api-client-integration.spec.ts core/src/lib/tests/tenant-context-http-classification.spec.ts --runInBand`
  - `npm run lint`
  - `npm run build:prod:browser`
  - `npm run test`
- Resultado de validacion:
  - `npx jest --config core/jest.config.ts --runTestsByPath core/src/lib/tests/api-client-integration.spec.ts core/src/lib/tests/tenant-context-http-classification.spec.ts --runInBand` -> OK. `2` suites y `13` pruebas en verde.
  - `npm run lint` -> OK.
  - `npm run build:prod:browser` -> OK. Se mantiene advertencia de budget inicial excedido por `55.22 kB` sobre el limite de `1.00 MB`.
  - `npm run test` -> OK. `1` suite y `2` pruebas en verde para `ecommerce`.
- Riesgos restantes:
  - Falta verificar en navegador con `print3d.localhost:4200` que el backend efectivamente acepte `X-Tenant-Slug: print3d` en `/api/public/tenant/print3d`.
  - Si aparecen mas endpoints debajo de `/api/public/*` que tambien dependan de tenant header, necesitaremos extender la clasificacion de forma explicita, no volver al wildcard.

### 2026-04-27 — Hotfix Authorization restaurado en rutas protegidas

- Resumen: se identifico que `authTenantInterceptor` si sabia adjuntar `Authorization`, pero `TenantContextService.shouldHandleHttpRequest()` dejaba fuera a `/admin/*` y `/superadmin/*`, por lo que requests protegidas como `/admin/tenants` nunca entraban al interceptor y salian sin JWT; el hotfix amplio esa clasificacion sin tocar la logica de `X-Tenant-Slug`, y se agregaron pruebas de regresion para `/admin/tenants` y para la clasificacion HTTP del contexto tenant.
- Archivos modificados:
  - `docs/roadmap/MULTITENANT-FRONTEND-TODO.md`
  - `core/src/lib/services/tenant-context.service.ts`
  - `core/src/lib/tests/api-client-integration.spec.ts`
  - `core/src/lib/tests/tenant-context-http-classification.spec.ts`
- Comandos ejecutados:
  - `npx jest --config core/jest.config.ts --runTestsByPath core/src/lib/tests/api-client-integration.spec.ts core/src/lib/tests/tenant-context-http-classification.spec.ts --runInBand`
  - `npm run lint`
  - `npm run build:prod:browser`
  - `npm run test`
- Resultado de validacion:
  - `npx jest --config core/jest.config.ts --runTestsByPath core/src/lib/tests/api-client-integration.spec.ts core/src/lib/tests/tenant-context-http-classification.spec.ts --runInBand` -> OK. `2` suites y `10` pruebas en verde.
  - `npm run lint` -> OK.
  - `npm run build:prod:browser` -> OK. Se mantiene advertencia de budget inicial excedido por `55.11 kB` sobre el limite de `1.00 MB`.
  - `npm run test` -> OK. `1` suite y `2` pruebas en verde para `ecommerce`.
- Riesgos restantes:
  - Falta la verificacion manual en navegador con sesion real para confirmar `200` en `/admin/tenants` y visualizar el header `Authorization` en DevTools.
  - El flujo de inicializacion de sesion superadmin en recarga fria sigue siendo una pieza sensible aparte de este hotfix y no fue ampliado en este corte.

### 2026-04-27 — Lote D ejecutado

- Resumen: se limpiaron `dataGroups` heredados del service worker porque no representaban el trafico real del frontend actual; se reemplazo el wildcard `Prerender` del SSR por `RenderMode.Server` para no simular prerender multitenant incoherente; se corrigio la configuracion de Playwright para usar el proyecto real `ecommerce`, un `serve-static` en modo `dev` y una config raiz compatible con `npx playwright test`; y se creo una suite smoke minima de 10 pruebas para dominio raiz, tenant valido, tenant invalido, login, activate sin token, forgot, reset sin token, catalogo, carrito y tenant-admin protegido.
- Archivos modificados:
  - `docs/roadmap/MULTITENANT-FRONTEND-TODO.md`
  - `apps/pwa/ngsw-config.json`
  - `apps/pwa/src/app/app.routes.server.ts`
  - `apps/pwa-e2e/project.json`
  - `apps/pwa-e2e/playwright.config.ts`
  - `apps/pwa-e2e/src/smoke.e2e.ts`
  - `playwright.config.ts`
- Comandos ejecutados:
  - `npm run lint`
  - `npm run build:prod:browser`
  - `npm run test`
  - `npx playwright install chromium`
  - `npx playwright test`
- Resultado de validacion:
  - `npm run lint` -> OK.
  - `npm run build:prod:browser` -> OK. Se mantiene advertencia de budget inicial excedido por `55.06 kB` sobre el limite de `1.00 MB`.
  - `npm run test` -> OK. `1` suite y `2` pruebas en verde para `ecommerce`.
  - `npx playwright test` -> OK. `10` smoke tests en verde.
- Riesgos restantes:
  - SSR host-aware sigue incompleto porque `TenantResolutionService` depende de `DOCUMENT.location` y todavia no recibe el host del request en server runtime.
  - El despliegue productivo actual sigue siendo estatico; no se activo SSR en produccion en este lote.
  - La instalacion de Chromium para Playwright quedo resuelta localmente, pero debe formalizarse en CI/bootstrap para no romper en entornos limpios.
  - Se mantiene el warning de budget inicial excedido.
  - Siguen abiertos los pendientes de QA real para activacion y recuperacion por correo.

### 2026-04-27 — Lote C.1 ejecutado

- Resumen: se cerro la UX minima de auth para activacion segura, forgot password, reset password, login tenant y creacion de tenant sin exponer passwords temporales ni tokens; `AccountService` quedo alineado a `/api/auth/activate-account`, `/api/auth/forgot-password`, `/api/auth/reset-password` y `/auth/login`; se agregaron pantallas dedicadas de activacion y reset con validacion reutilizable de password fuerte; se extendio el mapper central de errores para codigos de activacion, reset y tenant; y el flujo superadmin paso a reflejar `PendingActivation` con copy seguro orientado a correo.
- Archivos modificados:
  - `docs/roadmap/MULTITENANT-FRONTEND-TODO.md`
  - `core/src/lib/errors/http-error.mapper.ts`
  - `features-account/src/lib/lib.routes.ts`
  - `features-account/src/lib/components/index.ts`
  - `features-account/src/lib/models/user.model.ts`
  - `features-account/src/lib/services/account.service.ts`
  - `features-account/src/lib/utils/password-form.utils.ts`
  - `features-account/src/lib/components/activate-account/activate-account.component.ts`
  - `features-account/src/lib/components/activate-account/activate-account.component.html`
  - `features-account/src/lib/components/activate-account/activate-account.component.css`
  - `features-account/src/lib/components/reset-password/reset-password.component.ts`
  - `features-account/src/lib/components/reset-password/reset-password.component.html`
  - `features-account/src/lib/components/reset-password/reset-password.component.css`
  - `features-account/src/lib/components/login/login.component.ts`
  - `features-account/src/lib/components/login/login.component.html`
  - `features-account/src/lib/components/login/login.component.css`
  - `features-account/src/lib/components/forgot-password/forgot-password.component.ts`
  - `features-account/src/lib/components/forgot-password/forgot-password.component.html`
  - `features-account/src/lib/components/forgot-password/forgot-password.component.css`
  - `features-account/src/lib/components/tenant-auth-modal/tenant-auth-modal.component.ts`
  - `features-superadmin/src/lib/models/tenant.model.ts`
  - `features-superadmin/src/lib/pages/tenant-create/tenant-create.component.ts`
  - `features-superadmin/src/lib/pages/tenant-create/tenant-create.component.html`
  - `features-superadmin/src/lib/pages/tenant-create/tenant-create.component.scss`
  - `features-superadmin/src/lib/pages/tenants-list/tenants-list.component.ts`
  - `features-superadmin/src/lib/pages/tenants-list/tenants-list.component.html`
  - `features-superadmin/src/lib/pages/tenants-list/tenants-list.component.scss`
  - `features-superadmin/src/lib/components/tenant-detail-dialog/tenant-detail-dialog.component.ts`
  - `features-superadmin/src/lib/components/tenant-detail-dialog/tenant-detail-dialog.component.html`
  - `features-superadmin/src/lib/components/tenant-detail-dialog/tenant-detail-dialog.component.scss`
- Comandos ejecutados:
  - `npm run lint`
  - `npm run build:prod:browser`
  - `npm run test`
- Resultado de validacion:
  - `npm run lint` -> OK.
  - `npm run build:prod:browser` -> OK. Se mantuvo advertencia de budget inicial excedido por `55.06 kB` sobre el limite de `1.00 MB`.
  - `npm run test` -> OK. `1` suite y `2` pruebas en verde para `ecommerce`.
- Riesgos restantes:
  - La entrega real de correos de activacion y recuperacion sigue dependiendo del backend y del proveedor configurado en QA/PDN.
  - El frontend no implementa reenvio manual de activacion porque ese contrato no forma parte de este lote.
  - El bundle inicial siguio creciendo y conviene revisar si el budget debe ajustarse o si hay recorte pendiente en rutas iniciales.

### 2026-04-27 — Lote C ejecutado

- Resumen: se consolido `authTenantInterceptor` como flujo HTTP activo para `Authorization`, `X-Tenant-Slug` y `X-Correlation-Id`; se conecto `LoaderService` con soporte de requests silenciosas mediante `HttpContextToken`; se montaron `loader` y `toast-container` globales en `app.html`; se creo el contrato `AppError` con mapper base de errores HTTP/red; se actualizo la utilidad `extractApiErrorMessage` para reutilizar el mapper; y se limpiaron referencias documentales y de test al `TenantHeaderInterceptor` fuera del runtime activo.
- Archivos modificados:
  - `docs/roadmap/MULTITENANT-FRONTEND-TODO.md`
  - `apps/pwa/src/app/app.config.ts`
  - `apps/pwa/src/app/app.ts`
  - `apps/pwa/src/app/app.html`
  - `core/src/lib/http/auth-tenant.interceptor.ts`
  - `core/src/lib/http/http-context.tokens.ts`
  - `core/src/lib/http/index.ts`
  - `core/src/lib/services/api-client.service.ts`
  - `core/src/lib/services/loader.service.ts`
  - `core/src/lib/services/tenant-context.service.ts`
  - `core/src/lib/errors/app-error.ts`
  - `core/src/lib/errors/http-error.mapper.ts`
  - `core/src/lib/errors/global-error-handler.ts`
  - `core/src/lib/api/adapters/http-api.adapter.ts`
  - `core/src/lib/interceptors/tenant-header.interceptor.ts`
  - `core/src/lib/tests/api-client-integration.spec.ts`
  - `core/src/lib/services/index.ts`
  - `core/src/index.ts`
  - `shared/src/lib/ui/loader/loader.component.ts`
  - `shared/src/lib/ui/loader/loader.component.scss`
  - `shared/src/lib/utils/snackbar-config.ts`
  - `shared/src/lib/layout/public-layout/public-layout.component.ts`
  - `shared/src/lib/layout/public-layout/public-layout.component.html`
  - `shared/src/lib/layouts/tenant-admin-layout/tenant-admin-layout.component.ts`
  - `shared/src/lib/layouts/tenant-admin-layout/tenant-admin-layout.component.html`
  - `features-admin/RBAC-FEATURE.md`
  - `docs/ESTADO-ACTUAL.md`
- Comandos ejecutados:
  - `npx jest --config core/jest.config.ts --runTestsByPath core/src/lib/tests/api-client-integration.spec.ts --runInBand`
  - `npm run lint`
  - `npm run build:prod:browser`
- Resultado de validacion:
  - `npx jest --config core/jest.config.ts --runTestsByPath core/src/lib/tests/api-client-integration.spec.ts --runInBand` -> OK. `7` pruebas en verde.
  - `npm run lint` -> OK.
  - `npm run build:prod:browser` -> OK. La advertencia de budget inicial excedido subio a `32.29 kB`.
- Riesgos restantes:
  - `SHOW_HTTP_ERROR_TOAST` queda en modo `opt-in`; los formularios legacy con `MatSnackBar` no fueron migrados en este lote.
  - `tenant-header.interceptor.ts` y `tenant-interceptor.provider.ts` siguen presentes como legado fuera del flujo activo.
  - `features-superadmin/src/lib/services/tenant-admin.service.ts` aun construye `?tenant=` en un repair route fuera del stack HTTP base.
  - El bundle inicial aumento y dejo la advertencia de budget en `32.29 kB`; conviene medir si el root global `loader`/`toast` justifica ajuste o si hace falta recorte posterior.
  - Sigue pendiente migrar Vercel de `NG_APP_*` a `APP_*` y retirar el fallback legacy despues de validar QA.

### 2026-04-27 — Lote B ejecutado

- Resumen: se normalizo el contrato publico `AppEnv`, se alinearon `environment.ts`, `environment.dev.ts`, `environment.qa.ts` y `environment.prod.ts` al mismo shape, se retiro `mockApi` del flujo funcional de runtime, `TenantConfigService` y `ApiFactoryService` quedaron en modo backend real, `provideServiceWorker` quedo atado a `enableServiceWorker`, y `inject-env-vars.js` paso a aceptar solo variables publicas permitidas con compatibilidad temporal para `NG_APP_*`.
- Archivos modificados:
  - `docs/roadmap/MULTITENANT-FRONTEND-TODO.md`
  - `docs/AUDITORIA-FRONTEND-MULTITENANT-ANGULAR21.md`
  - `apps/pwa/src/environments/environment.ts`
  - `apps/pwa/src/environments/environment.dev.ts`
  - `apps/pwa/src/environments/environment.qa.ts`
  - `apps/pwa/src/environments/environment.prod.ts`
  - `apps/pwa/src/app/app.config.ts`
  - `apps/pwa/public/config/tenants/README.md`
  - `core/src/lib/config/app-env.token.ts`
  - `core/src/lib/services/app-env.service.ts`
  - `core/src/lib/config/app-env-initializer.ts`
  - `core/src/lib/services/tenant-config.service.ts`
  - `core/src/lib/api/api-factory.service.ts`
  - `core/src/lib/services/api-client.service.ts`
  - `core/src/lib/push/push.service.ts`
  - `scripts/inject-env-vars.js`
- Comandos ejecutados:
  - `npm run lint`
  - `npm run build:prod:browser`
- Resultado de validacion:
  - `npm run lint` -> OK.
  - `npm run build:prod:browser` -> OK. Se mantuvo la advertencia existente de budget inicial excedido por `15.39 kB`.

### 2026-04-27 — Lote A ejecutado

- Resumen: se elimino la resolucion de tenant por query params en el flujo activo, se quitaron redirects de auth con `?tenant=`, se alineo `tenant-url.service.ts` a subdominio-only, se montaron las rutas existentes de error de tenant y se cuarentenaron exports legacy de bootstrap/interceptor desde el barrel publico.
- Archivos modificados:
  - `docs/roadmap/MULTITENANT-FRONTEND-TODO.md`
  - `core/src/lib/services/tenant-resolution.service.ts`
  - `core/src/lib/http/auth-tenant.interceptor.ts`
  - `core/src/lib/auth/guards/auth.guard.ts`
  - `core/src/lib/auth/auth.service.ts`
  - `core/src/lib/services/tenant-url.service.ts`
  - `apps/pwa/src/app/app.routes.ts`
  - `core/src/lib/routes/tenant-error.routes.ts`
  - `core/src/index.ts`
- Comandos ejecutados:
  - `npm run build:prod:browser`
  - `npm run lint`
- Resultado de validacion:
  - `npm run build:prod:browser` -> OK. Se mantuvo una advertencia existente de budget inicial excedido por `15.03 kB`.
  - `npm run lint` -> OK.
