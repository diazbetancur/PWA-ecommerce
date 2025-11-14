# PWA Multi-Tenant: Instalación iOS con Branding Dinámico

## 📋 Resumen Ejecutivo

Solución completa para instalación PWA multi-tenant con soporte específico para iOS/iPadOS, branding dinámico desde URLs externas y experiencia nativa de instalación.

### Características Principales

✅ **Detección robusta de iOS/iPadOS** incluyendo Safari y navegadores WebKit  
✅ **Banner de instalación nativo** con instrucciones específicas para iOS  
✅ **Branding 100% dinámico** desde URLs (logos, íconos, colores por tenant)  
✅ **Manifest dinámico** generado on-the-fly por tenant  
✅ **Fallback automático** a assets por defecto si las URLs fallan  
✅ **Gestión de dismiss** con persistencia en localStorage  
✅ **Signals y arquitectura reactiva** con Angular 17+  
✅ **Compatible con SSR** y optimizado para performance

---

## 🏗️ Arquitectura de la Solución

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     AppComponent                             │
│  - Constructor: effect() para aplicar branding PWA          │
│  - Template: incluye <lib-ios-install-banner>               │
└────────────────┬─────────────────────────┬──────────────────┘
                 │                         │
                 ▼                         ▼
    ┌────────────────────┐    ┌───────────────────────┐
    │ TenantContextService│    │ DynamicPwaAssetsService│
    │ - pwaBranding()    │    │ - applyBranding()      │
    │ - isGeneralTenant()│    │ - updateManifest()     │
    └─────────┬──────────┘    │ - updateAppleTouchIcon()│
              │                │ - updateFavicon()      │
              │                └───────────────────────┘
              │
              ▼
    ┌────────────────────┐
    │ PwaInstallService  │
    │ - isIos()          │
    │ - isStandalone()   │
    │ - shouldShowIosBanner()│
    │ - markBannerDismissed()│
    └────────────────────┘
              │
              ▼
    ┌────────────────────────────┐
    │ IosInstallBannerComponent   │
    │ - Muestra solo en iOS       │
    │ - Instrucciones de instalación│
    │ - Usa branding del tenant   │
    └────────────────────────────┘
```

### Flujo de Datos

```
1. Usuario accede → TenantBootstrapService resuelve tenant
                                ↓
2. TenantContextService.pwaBranding() computa branding
                                ↓
3. AppComponent effect detecta cambio → DynamicPwaAssetsService.applyBranding()
                                ↓
4. Se actualizan <link> en <head>: manifest, apple-touch-icon, favicon
                                ↓
5. PwaInstallService detecta plataforma (iOS + no standalone)
                                ↓
6. IosInstallBannerComponent se muestra automáticamente
                                ↓
7. Usuario cierra banner → PwaInstallService.markBannerDismissed()
```

---

## 📁 Estructura de Archivos Creados

### Core Library (`/core`)

```
core/
├── src/lib/
│   ├── models/
│   │   ├── types.ts                    # TenantBranding interface
│   │   └── pwa-branding.types.ts      # Tipos PWA detallados
│   │
│   ├── pwa/
│   │   ├── pwa-install.service.ts     # ⭐ Detección iOS/standalone
│   │   └── dynamic-pwa-assets.service.ts # ⭐ Manipulación <head>
│   │
│   └── services/
│       └── tenant-context.service.ts   # Extendido con pwaBranding()
```

### Shared Library (`/shared`)

```
shared/
└── src/lib/
    └── components/
        └── ios-install-banner/
            └── ios-install-banner.component.ts  # ⭐ Banner iOS
```

### App (`/apps/pwa`)

```
apps/pwa/
├── src/
│   └── app/
│       ├── app.ts                      # Integración con effect()
│       └── app.html                    # Incluye <lib-ios-install-banner>
│
└── public/assets/pwa/
    ├── default-icon-180.svg            # ⭐ Ícono por defecto
    ├── default-favicon.svg             # ⭐ Favicon por defecto
    └── default-logo.svg                # ⭐ Logo por defecto
```

---

## 🔧 Servicios Implementados

### 1. PwaInstallService

**Responsabilidad:** Detección de plataforma y gestión del banner iOS

**Signals expuestos:**

- `isIos: Signal<boolean>` - Detecta iPhone/iPod
- `isIpadOs: Signal<boolean>` - Detecta iPad (incluso si se reporta como MacIntel)
- `isStandalone: Signal<boolean>` - Detecta si la PWA está instalada
- `shouldShowIosBanner: Signal<boolean>` - Computed que decide mostrar banner
- `platformInfo: Signal<PlatformInfo>` - Info completa de plataforma

**Métodos públicos:**

```typescript
markBannerDismissed(): void
  // Descarta el banner en esta sesión

markBannerDismissedPermanently(): void
  // Descarta permanentemente (localStorage por 30 días)

resetBannerDismiss(): void
  // Resetea el estado de dismiss

refreshPlatformDetection(): void
  // Re-detecta la plataforma
```

**Detección robusta de iOS:**

```typescript
// Detecta iOS clásico (iPhone, iPod, iPad pre-iOS 13)
const isIosDevice = /iphone|ipod/.test(userAgent) || (/ipad/.test(userAgent) && 'ontouchend' in document);

// Detecta iPadOS (iOS 13+, reportado como MacIntel)
const isIpadOsDevice = platform === 'macintel' && navigator.maxTouchPoints > 1 && !msStream.MSStream;

// Detecta modo standalone
const isStandaloneMode =
  navStandalone.standalone === true || // iOS Safari
  globalThis.matchMedia('(display-mode: standalone)').matches;
```

---

### 2. DynamicPwaAssetsService

**Responsabilidad:** Actualización dinámica de assets PWA en el `<head>`

**Signals expuestos:**

- `currentBranding: Signal<TenantBranding | null>` - Branding actualmente aplicado
- `assetsApplied: Signal<boolean>` - Si los assets han sido aplicados

**Métodos públicos:**

```typescript
applyBranding(branding: TenantBranding | null): void
  // Aplica el branding completo (manifest, íconos, theme-color)

resetToDefaults(): void
  // Vuelve a los assets por defecto

preloadBrandingAssets(branding: TenantBranding): Promise<void>
  // Pre-carga imágenes para evitar flickering

getCurrentBranding(): TenantBranding | null
  // Obtiene el branding actual
```

**Comportamiento:**

1. **Busca o crea** elementos `<link>` y `<meta>` en el `<head>`
2. **Cachea** referencias DOM para no recrearlos innecesariamente
3. **Usa URLs** proporcionadas por el tenant o **fallback** a assets por defecto
4. **Genera manifest dinámico** como blob URL si no hay manifestUrl

**Ejemplo de uso:**

```typescript
// En AppComponent constructor
effect(() => {
  const branding = this.tenantContext.pwaBranding();
  if (branding) {
    this.dynamicPwaAssets.applyBranding(branding);
  }
});
```

---

### 3. TenantContextService (Extendido)

**Nuevos computed signals:**

```typescript
readonly pwaBranding = computed(() => {
  const tenant = this.currentTenant();
  const config = this.currentConfig();

  if (!tenant || !config) return null;

  return {
    name: tenant.displayName,
    shortName: tenant.displayName?.substring(0, 12),
    description: tenant.description,
    logoUrl: branding?.logoUrl || theme.logoUrl,
    primaryColor: branding?.primaryColor || theme.primary,
    pwaIconUrl: branding?.faviconUrl || theme.faviconUrl,
    // ... más campos
  } as TenantBranding;
});

readonly isGeneralTenant = computed(() => this.isGeneralAdminMode());
```

**Transformación de datos:**

- Convierte `BrandingConfig` + `ThemeConfig` → `TenantBranding`
- Aplica fallbacks inteligentes entre diferentes fuentes
- Retorna `null` si no hay tenant disponible

---

## 🎨 IosInstallBannerComponent

### Características del Componente

**Diseño iOS-native:**

- ✅ Fondo oscuro con `backdrop-filter: blur(20px)` (efecto glassmorphism)
- ✅ Bordes redondeados iOS-style (`border-radius: 13px` para logo)
- ✅ Safe area insets (`env(safe-area-inset-bottom)`)
- ✅ Animación suave `slideUp` al aparecer
- ✅ Material Icons para íconos (compartir, cerrar)
- ✅ Responsive (optimizado para iPhone SE hasta iPhone Pro Max)

**Lógica del componente:**

```typescript
protected readonly shouldShow = computed(
  () => this.pwaInstallService.shouldShowIosBanner()
);

protected readonly tenantBranding = computed(
  () => this.tenantContext.pwaBranding()
);

protected readonly logoUrl = computed(() => {
  if (this._logoLoadError()) return null;
  const branding = this.tenantBranding();
  return branding?.logoUrl || branding?.pwaIconUrl || null;
});
```

**Botones de acción:**

1. **"Entendido"** → `dismissPermanently()` - Guarda en localStorage por 30 días
2. **"Más tarde"** → `dismiss()` - Solo descarta en esta sesión

**Instrucciones mostradas:**

```
1️⃣ Toca el botón [ícono compartir] en la barra del navegador
2️⃣ Desplázate y selecciona "Añadir a pantalla de inicio"
```

---

## 🌐 Integración en AppComponent

### Constructor con Effect

```typescript
constructor() {
  // Effect reactivo que se ejecuta cuando el branding cambia
  effect(() => {
    const branding = this.tenantContext.pwaBranding();
    if (branding) {
      // Pre-cargar assets para evitar flickering
      this.dynamicPwaAssets
        .preloadBrandingAssets(branding)
        .then(() => {
          this.dynamicPwaAssets.applyBranding(branding);
        })
        .catch((error) => {
          console.warn('Error precargando branding assets:', error);
          // Aplicar de todas formas
          this.dynamicPwaAssets.applyBranding(branding);
        });
    }
  });
}
```

### Template

```html
<router-outlet></router-outlet>

<!-- Banner de instalación PWA para iOS -->
<lib-ios-install-banner></lib-ios-install-banner>
```

**Ventajas de este approach:**

- El banner se incluye **una sola vez** en el componente raíz
- Se muestra **automáticamente** solo cuando `shouldShowIosBanner()` es true
- No interfiere con rutas ni lazy loading
- Compatible con SSR (no renderiza en servidor)

---

## 📱 Comportamiento por Plataforma

### iOS / iPadOS (Safari, WebKit)

**Flujo de experiencia:**

1. **Usuario accede por primera vez** en Safari iOS
2. **Banner aparece** automáticamente si:
   - ✅ Es iOS/iPadOS
   - ✅ NO está en modo standalone
   - ✅ No ha descartado el banner antes
3. **Usuario ve:**
   - Logo/ícono del tenant (o placeholder si falla la URL)
   - Nombre del tenant
   - Instrucciones claras paso a paso
4. **Usuario puede:**
   - Tocar "Entendido" → no verá el banner por 30 días
   - Tocar "Más tarde" → no verá el banner en esta sesión
   - Cerrar con X → mismo comportamiento que "Más tarde"
5. **Si instala manualmente:**
   - `window.navigator.standalone` se vuelve `true`
   - Banner desaparece automáticamente
   - Assets PWA (manifest, íconos) ya están aplicados

**Limitaciones conocidas:**

- ⚠️ iOS no soporta `beforeinstallprompt` (evento nativo de Chrome)
- ⚠️ No hay forma de detectar si el usuario tocó "Añadir a pantalla de inicio"
- ✅ Solución: Mostrar banner educativo con instrucciones claras

---

### Android / Desktop (Chrome, Edge)

**Flujo de experiencia:**

1. **Usuario accede** en Chrome Android o Desktop
2. **Banner iOS NO se muestra** (condición `isIos === false`)
3. **Navegador maneja instalación nativamente:**
   - Chrome muestra su propio prompt automático
   - Aparece ícono de instalación en la barra de direcciones
4. **Tu código puede extenderse** para capturar `beforeinstallprompt`:

```typescript
// Ejemplo de extensión futura (no incluido en esta solución)
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Mostrar tu propio botón de instalación
});
```

**Ventajas:**

- ✅ Experiencia nativa del navegador ya es buena
- ✅ No necesitas intervenir en Android/Desktop (por ahora)
- ✅ Puedes añadir un botón custom más adelante

---

## 🎯 TenantBranding Interface

### Definición Completa

```typescript
export interface TenantBranding {
  // Información básica
  name: string; // ✅ Requerido
  shortName?: string; // Para manifest (max 12 chars)
  description?: string; // Para manifest y SEO

  // URLs de assets (todas opcionales, con fallback)
  logoUrl?: string; // Logo principal del tenant
  pwaIconUrl?: string; // Ícono PWA (180x180 recomendado)
  faviconUrl?: string; // Favicon (32x32 o 48x48)
  manifestUrl?: string; // Manifest.json pre-generado

  // Colores (hex, rgb, hsl)
  primaryColor?: string; // Color principal
  secondaryColor?: string; // Color secundario
  backgroundColor?: string; // Background del splash screen
  themeColor?: string; // Color de la barra de navegador
}
```

### Ejemplo de Branding Real

```typescript
const exampleBranding: TenantBranding = {
  name: 'Tienda Ejemplo',
  shortName: 'Tienda',
  description: 'Tu tienda online de confianza',

  // URLs desde CDN o backend
  logoUrl: 'https://cdn.example.com/tenants/123/logo.png',
  pwaIconUrl: 'https://cdn.example.com/tenants/123/icon-180.png',
  faviconUrl: 'https://cdn.example.com/tenants/123/favicon.png',

  // Colores personalizados
  primaryColor: '#FF6B35',
  secondaryColor: '#004E89',
  backgroundColor: '#FFFFFF',
  themeColor: '#FF6B35',
};
```

### Fallback Automático

Si una URL no está definida o falla al cargar:

| Campo         | Fallback                                         |
| ------------- | ------------------------------------------------ |
| `logoUrl`     | `/assets/pwa/default-logo.svg`                   |
| `pwaIconUrl`  | `/assets/pwa/default-icon-180.svg`               |
| `faviconUrl`  | `/assets/pwa/default-favicon.svg`                |
| `manifestUrl` | Generado dinámicamente o `/manifest.webmanifest` |

---

## 🚀 Performance y Buenas Prácticas

### 1. Pre-carga de Imágenes

```typescript
// Se pre-cargan assets antes de aplicarlos
await this.dynamicPwaAssets.preloadBrandingAssets(branding);
```

**Ventajas:**

- Evita flickering cuando se aplica el branding
- Mejora perceived performance
- Promise.allSettled() no falla si una imagen falla

### 2. Caché de Elementos DOM

```typescript
private manifestLink: HTMLLinkElement | null = null;
private appleTouchIconLink: HTMLLinkElement | null = null;
```

**Ventajas:**

- No se recrean elementos innecesariamente
- Se reutilizan referencias DOM
- Menos manipulación del DOM = mejor performance

### 3. Signals y Computeds

```typescript
readonly shouldShowIosBanner = computed(() => {
  const platform = this._platformInfo();
  const banner = this._bannerState();
  return (platform.isIos || platform.isIpadOs) &&
         !platform.isStandalone &&
         !banner.dismissed;
});
```

**Ventajas:**

- Re-cómputo automático solo cuando cambian las dependencias
- No hay subscripciones manuales que limpiar
- Código más declarativo y legible

### 4. localStorage con Expiración

```typescript
// Dismiss permanente expira en 30 días
const expirationMs = expireDays * 24 * 60 * 60 * 1000;
const isExpired = Date.now() - dismissedAt > expirationMs;
```

**Ventajas:**

- El banner reaparece después de 30 días (configurable)
- Balance entre no molestar y recordar la opción de instalar

### 5. Compatible con SSR

```typescript
if (!this.isBrowser) {
  return; // No ejecutar lógica del navegador en servidor
}
```

**Ventajas:**

- No hay errores en SSR
- `window`, `document`, `localStorage` se usan solo en cliente

---

## 🔐 Consideraciones de Seguridad

### URLs Externas

**⚠️ Riesgo:** URLs controladas por el tenant podrían apuntar a contenido malicioso

**✅ Mitigación:**

1. **Validar URLs en el backend** antes de guardarlas
2. **Usar CSP (Content Security Policy)** para restringir orígenes:
   ```html
   <meta http-equiv="Content-Security-Policy" content="img-src 'self' https://cdn.tudominio.com;" />
   ```
3. **Servir assets a través de tu CDN** en lugar de URLs arbitrarias
4. **Fallback automático** si una URL falla o es bloqueada

### Manifest Dinámico

**⚠️ Riesgo:** Manifest generado podría tener datos incorrectos

**✅ Mitigación:**

1. **Validar datos** antes de generar el manifest:
   ```typescript
   const manifest = {
     name: sanitize(branding.name),
     short_name: sanitize(branding.shortName),
     // ...
   };
   ```
2. **Usar blob URLs** (generadas localmente, no externas)
3. **Opción de manifest pre-generado** en backend

---

## 📊 Métricas y Analytics (Futuro)

### Eventos a Trackear

```typescript
// Ejemplo de tracking (no incluido)
analytics.track('pwa_banner_shown', {
  tenant: tenantSlug,
  platform: 'ios',
  timestamp: Date.now(),
});

analytics.track('pwa_banner_dismissed', {
  tenant: tenantSlug,
  dismissType: 'permanent', // 'permanent' | 'session'
});

analytics.track('pwa_installed', {
  tenant: tenantSlug,
  platform: 'ios',
  // Detectado por cambio en isStandalone
});
```

---

## 🧪 Testing

### Test de Detección iOS

```typescript
describe('PwaInstallService', () => {
  it('should detect iPhone', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'iPhone OS 15_0',
      writable: true,
    });

    const service = TestBed.inject(PwaInstallService);
    expect(service.isIos()).toBe(true);
  });

  it('should detect iPadOS as MacIntel with touch', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      writable: true,
    });

    const service = TestBed.inject(PwaInstallService);
    expect(service.isIpadOs()).toBe(true);
  });
});
```

### Test del Banner

```typescript
describe('IosInstallBannerComponent', () => {
  it('should show banner on iOS when not standalone', () => {
    // Mock PwaInstallService
    const mockPwaService = {
      shouldShowIosBanner: signal(true),
    };

    const fixture = TestBed.createComponent(IosInstallBannerComponent);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.ios-install-banner');
    expect(banner).toBeTruthy();
  });
});
```

---

## 🔮 Extensiones Futuras

### 1. Soporte Android Custom Prompt

```typescript
// Capturar beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  this.deferredPrompt = e;
  this.showInstallButton.set(true);
});

// Mostrar prompt cuando usuario hace clic
async showInstallPrompt() {
  if (!this.deferredPrompt) return;

  this.deferredPrompt.prompt();
  const { outcome } = await this.deferredPrompt.userChoice;

  console.log('User choice:', outcome);
  this.deferredPrompt = null;
}
```

### 2. A/B Testing del Banner

```typescript
// Diferentes variantes de mensaje
const variants = {
  variant_a: 'Instala la app para una experiencia más rápida',
  variant_b: 'Añade a tu pantalla de inicio y ahorra tiempo',
  variant_c: 'Acceso rápido desde tu iPhone',
};

// Elegir variante aleatoria o según segmento
const variant = getExperimentVariant(userId);
```

### 3. Banner Contextual

```typescript
// Mostrar banner en momentos específicos
if (pageViews > 3 && !isInstalled) {
  showBanner();
}

// O después de una acción exitosa
if (checkoutComplete && !isInstalled) {
  showBanner('¡Instala la app para ofertas exclusivas!');
}
```

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Add to Home Screen - Apple](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Web App Manifest - MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA on iOS - Web.dev](https://web.dev/customize-install/)

### Herramientas de Testing

- **Safari Remote Debugging:** Para probar en iOS real desde Mac
- **BrowserStack:** Testing en múltiples dispositivos iOS
- **Lighthouse:** Auditoría PWA

### Detección de iOS en diferentes navegadores

| Navegador         | User Agent        | Peculiaridades                    |
| ----------------- | ----------------- | --------------------------------- |
| Safari iOS        | `iPhone` o `iPad` | `navigator.standalone` disponible |
| Chrome iOS        | `CriOS`           | Usa WebKit internamente           |
| Firefox iOS       | `FxiOS`           | Usa WebKit internamente           |
| Safari iPadOS 13+ | `Macintosh`       | `maxTouchPoints > 1` es la clave  |

---

## ✅ Checklist de Implementación

- [x] **PwaInstallService** creado con detección iOS/iPadOS robusta
- [x] **DynamicPwaAssetsService** implementado con manipulación de `<head>`
- [x] **TenantContextService** extendido con `pwaBranding()` computed
- [x] **IosInstallBannerComponent** con diseño iOS-native
- [x] **Integración en AppComponent** con effect reactivo
- [x] **Assets por defecto** creados (SVGs en `/public/assets/pwa/`)
- [x] **Exports en core/shared** actualizados
- [x] **TypeScript/ESLint** sin errores
- [x] **Documentación completa** con arquitectura y ejemplos

---

## 🎓 Conclusión

Esta solución proporciona una experiencia de instalación PWA **profesional, escalable y multi-tenant**, con énfasis en:

1. ✅ **iOS/iPadOS como ciudadanos de primera clase** (no afterthought)
2. ✅ **Branding 100% dinámico** sin assets locales por tenant
3. ✅ **Arquitectura reactiva** con signals (Angular 17+)
4. ✅ **Performance optimizada** con pre-carga y caché DOM
5. ✅ **Fallbacks robustos** para manejo de errores
6. ✅ **Extensible** para Android/Desktop en el futuro

**La solución está lista para producción** y puede desplegarse inmediatamente. Los tenants verán su branding automáticamente aplicado, y los usuarios de iOS tendrán una experiencia de instalación guiada y elegante.

---

**Autor:** Arquitecto Senior Frontend Angular  
**Fecha:** 14 de noviembre de 2025  
**Versión:** 1.0.0  
**Stack:** Angular 17+ (Standalone), Nx, PWA, Multi-tenant
