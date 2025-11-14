# Guía Rápida: PWA Multi-Tenant con Instalación iOS

## 🚀 Uso Rápido

### 1. Branding del Tenant (Backend/Config)

```typescript
// Configuración del tenant con branding PWA
const tenantConfig: TenantConfig = {
  tenant: {
    id: '123',
    slug: 'mi-tienda',
    displayName: 'Mi Tienda',
    branding: {
      logoUrl: 'https://cdn.example.com/tenants/123/logo.png',
      primaryColor: '#FF6B35',
      faviconUrl: 'https://cdn.example.com/tenants/123/favicon.png',
    },
  },
  theme: {
    primary: '#FF6B35',
    accent: '#004E89',
    logoUrl: 'https://cdn.example.com/tenants/123/logo.png',
    faviconUrl: 'https://cdn.example.com/tenants/123/icon.png',
  },
  // ... resto de configuración
};
```

### 2. Ya Está Integrado ✅

El sistema funciona automáticamente:

1. **TenantContextService** ya computa `pwaBranding()` desde tu configuración
2. **AppComponent** ya tiene el effect que aplica el branding
3. **IosInstallBannerComponent** ya está incluido en `app.html`

### 3. Comportamiento Automático

#### En iOS/iPadOS:

- Banner aparece automáticamente si no está instalado
- Muestra logo y nombre del tenant
- Instrucciones claras de instalación
- Se oculta tras ser descartado (30 días)

#### En Android/Desktop:

- Banner NO se muestra (navegador maneja instalación nativamente)
- Assets PWA ya aplicados (manifest, íconos)

### 4. Testing Local en iOS

```bash
# 1. Servir en red local
npx nx serve ecommerce --host 0.0.0.0

# 2. Abrir en iPhone/iPad Safari:
# http://[TU-IP-LOCAL]:4200/tu-tenant

# 3. Verificar:
# - Logo del tenant visible en banner
# - Nombre correcto del tenant
# - Ícono en "Añadir a pantalla de inicio"
```

### 5. Assets por Defecto

Si un tenant no tiene URLs de branding configuradas, se usan automáticamente:

- `/assets/pwa/default-logo.svg` - Logo placeholder
- `/assets/pwa/default-icon-180.svg` - Ícono PWA
- `/assets/pwa/default-favicon.svg` - Favicon

### 6. Personalización (Opcional)

#### Cambiar expiración del dismiss:

```typescript
// En algún initializer o provider
const pwaInstallService = inject(PwaInstallService);
pwaInstallService.updateConfig({
  bannerDismissExpireDays: 60, // 60 días en lugar de 30
});
```

#### Pre-cargar assets del tenant:

```typescript
// Ya implementado en AppComponent, pero puedes usarlo manualmente:
const dynamicPwaAssets = inject(DynamicPwaAssetsService);
const branding = tenantContext.pwaBranding();

if (branding) {
  await dynamicPwaAssets.preloadBrandingAssets(branding);
  dynamicPwaAssets.applyBranding(branding);
}
```

## 📱 Verificación Rápida

### Desktop (Chrome):

```typescript
// En DevTools Console:
const pwaService = window.ng.getInjector(document.querySelector('app-root')).get(PwaInstallService);
console.log('Platform:', pwaService.platformInfo());
// Debería mostrar: isIos: false, isStandalone: false/true
```

### iOS Safari:

```typescript
// En Safari Inspector Console:
console.log('Is Standalone:', window.navigator.standalone);
// false = no instalado, true = instalado
```

## 🎨 Estructura de Branding

```typescript
interface TenantBranding {
  name: string; // ✅ Requerido
  logoUrl?: string; // URL del logo
  pwaIconUrl?: string; // URL del ícono PWA (180x180)
  faviconUrl?: string; // URL del favicon
  primaryColor?: string; // Color principal
  themeColor?: string; // Color de barra navegador
  backgroundColor?: string; // Color splash screen
}
```

## 🔧 Troubleshooting

### Banner no aparece en iOS:

```typescript
// Verificar en console:
const pwaService = inject(PwaInstallService);
console.log('Should show banner:', pwaService.shouldShowIosBanner());
console.log('Platform info:', pwaService.platformInfo());
console.log('Banner dismissed:', pwaService.bannerDismissed());

// Si bannerDismissed = true, resetear:
pwaService.resetBannerDismiss();
```

### Íconos no se aplican:

```typescript
// Verificar en console:
const assetsService = inject(DynamicPwaAssetsService);
console.log('Assets applied:', assetsService.areAssetsApplied());
console.log('Current branding:', assetsService.getCurrentBranding());

// Forzar aplicación:
const branding = tenantContext.pwaBranding();
assetsService.applyBranding(branding);
```

## 📖 Documentación Completa

Ver: [`docs/PWA-INSTALLATION-IOS-MULTITENANT.md`](./PWA-INSTALLATION-IOS-MULTITENANT.md)

- Arquitectura detallada
- Explicación de servicios
- Diseño del componente
- Performance y buenas prácticas
- Seguridad y mitigaciones
- Extensiones futuras

## ✅ Checklist de Producción

- [ ] Configurar CSP para permitir URLs de CDN de tenants
- [ ] Validar URLs de branding en backend antes de guardar
- [ ] Configurar manifest.json base en `/public/manifest.webmanifest`
- [ ] Añadir analytics para trackear instalaciones PWA
- [ ] Probar en iOS real (no simulador)
- [ ] Probar en iPadOS (reportado como MacIntel)
- [ ] Probar dismiss permanente (localStorage)
- [ ] Verificar assets por defecto se cargan correctamente
- [ ] Probar con tenant sin branding configurado
- [ ] Verificar colores del tema se aplican a barra navegador

---

**¿Dudas?** Consulta la documentación completa en `docs/PWA-INSTALLATION-IOS-MULTITENANT.md`
