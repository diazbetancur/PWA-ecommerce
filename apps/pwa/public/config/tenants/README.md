# Tenant Configuration Files

Esta carpeta contiene archivos de configuración JSON para tenants en modo **Mock API**.

## ⚠️ Importante

- Los archivos demo (`demo-a.json`, `demo-b.json`) han sido **eliminados**
- Esta carpeta solo se usa cuando `mockApi: true` en el environment
- En producción/QA, las configuraciones se cargan desde el backend Azure

## 📝 Cómo Crear un Tenant de Prueba

### 1. Crear archivo JSON

Crea un archivo con el nombre del tenant slug, por ejemplo: `my-store.json`

```json
{
  "tenant": {
    "id": "my-store-id",
    "slug": "my-store",
    "displayName": "My Store",
    "description": "Descripción de mi tienda"
  },
  "theme": {
    "primary": "#1976d2",
    "accent": "#dc004e",
    "logoUrl": "/assets/logo-my-store.png",
    "faviconUrl": "/favicon-my-store.ico",
    "cssVars": {
      "--primary": "#1976d2",
      "--accent": "#dc004e",
      "--background": "#ffffff",
      "--text": "#333333"
    }
  },
  "features": {
    "catalog": true,
    "cart": true,
    "checkout": true,
    "guestCheckout": true,
    "categories": true,
    "push": false
  },
  "limits": {
    "products": 1000,
    "admins": 5,
    "storageMB": 500
  },
  "locale": "es-CO",
  "currency": "COP",
  "cdnBaseUrl": ""
}
```

### 2. Acceder en el navegador

```
http://localhost:4200?tenant=my-store
```

### 3. Verificar en DevTools

Abre la consola (F12) y deberías ver:

```
🌐 [TenantConfigService] Cargando desde: /config/tenants/my-store.json
✅ Tenant cargado exitosamente
```

## 🚀 Uso en QA/Producción

En entornos reales (QA, Production):

1. Los tenants se crean en el backend Azure
2. Se cargan automáticamente desde: `GET /api/public/tenant-config`
3. El header `X-Tenant-Slug` se inyecta automáticamente
4. No se usan estos archivos JSON locales

## 🔍 Debugging

Si el tenant no se carga:

1. **Verifica el nombre del archivo**: Debe ser exactamente `{slug}.json`
2. **Verifica el JSON**: Usa un validador JSON online
3. **Revisa la consola**: F12 → Console → busca errores
4. **Modo Mock**: Verifica que `mockApi: true` en `environment.ts`

## 📂 Estructura Mínima Requerida

```json
{
  "tenant": {
    "id": "required",
    "slug": "required",
    "displayName": "required"
  },
  "theme": {
    "primary": "#1976d2",
    "accent": "#dc004e"
  },
  "features": {},
  "limits": {
    "products": 1000,
    "admins": 5,
    "storageMB": 500
  },
  "locale": "es-CO",
  "currency": "COP",
  "cdnBaseUrl": ""
}
```

## 🆘 Soporte

Si tienes problemas creando tenants de prueba:

1. Revisa la documentación completa en `/docs/MULTI_TENANT_ARCHITECTURE.md`
2. Verifica el servicio `TenantConfigService` en `/core/src/lib/services/tenant-config.service.ts`
3. Consulta ejemplos de uso en `/docs/TENANT_USAGE_EXAMPLES.ts`

---

**Nota**: Para testing real, es recomendable crear tenants directamente en QA/Azure en lugar de usar mock files.
