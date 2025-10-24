# eCommerce PWA

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve ecommerce
```

# eCommerce PWA (Angular 20 + Nx)

Multi-tenant PWA con SSR (prod), SW, i18n, adapters mock/real y push web.

## Ejecutar

```powershell
# Dev (mock API)
npx nx serve ecommerce

# Dev (real API)
npm run start:real

# Lint / Tests
npm run lint
npm run test

# Build prod SSR (puede fallar si SSR no está habilitado)
npm run build:prod

# Build prod browser-only (genera SW/ngsw.json)
npm run build:prod:browser
npx nx serve-static ecommerce
```

## Tenants y branding

- Cambia de tenant vía query: `?tenant=demo-a` o `?tenant=demo-b` (hot switch en dev desde el header).
- También puedes resolver por hostname simple (demo-a / demo-b) o editar `apps/pwa/public/config/tenants/*.json`.
- Theme/manifest dinámicos: favicon, palette y cssVars por tenant.

## Mock vs real

- `APP_ENV.mockApi=true` por defecto (ver `apps/pwa/src/environments/*`).
- Para real API: `start:real` y configura `API_BASE_URL`.

## Push Web (VAPID)

- Configura `FCM_VAPID_KEY` en env.
- Botón de prueba en Admin (visible si `features.push=true`).

## PWA Offline

- SW se genera en `build:prod:browser`.
- Para reset: unregister SW + clear caches + hard reload.

## SSR

- Build SSR (experimental): `npm run build:prod`.
- Nota: mantenemos APP_INITIALIZER con TODO de deprecation; los accesos DOM/SwPush están protegidos para SSR.

## Variables de entorno

- `API_BASE_URL`, `FCM_VAPID_KEY`.

## Troubleshooting

- FOUC: asegúrate que `ThemeService.applyTheme` corre tras `TenantConfigService.load`.
- Manifest: verifica `<link rel="manifest">` apunta a blob en runtime.
- SW: si no hay `ngsw.json`, usa `build:prod:browser` temporalmente.
- $localize: si ves `$localize is not defined`, verifica `@angular/localize`instalado y polyfill en`project.json`.

## Install Nx Console
