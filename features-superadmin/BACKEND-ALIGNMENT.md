# 🔄 Alineación con Backend RBAC - Cambios Implementados

> **Fecha**: 15 de febrero de 2026  
> **Estado**: ✅ COMPLETADO

---

## 📋 Resumen de Cambios

El backend implementó cambios en la estructura de rutas para el sistema RBAC de SuperAdmin, diferenciando claramente entre:

- **Usuarios administrativos del sistema** (AdminDb) → `/superadmin/users/*`
- **Usuarios de tenants** (TenantDb) → `/admin/users/*` (requiere X-Tenant-Slug)

### Problema Identificado

El frontend estaba usando `/admin/users` para gestionar usuarios administrativos, pero esta ruta en el backend ahora está reservada para usuarios de tenants, causando un `AmbiguousMatchException`.

---

## 🔧 Cambios Realizados

### 1. AdminUserManagementService

**Archivo**: [`features-superadmin/src/lib/services/admin-user-management.service.ts`](src/lib/services/admin-user-management.service.ts)

| Endpoint Anterior | Endpoint Nuevo | Método |
|------------------|----------------|--------|
| `GET /admin/users` | `GET /superadmin/users` | `getUsers()` |
| `GET /admin/users/{id}` | `GET /superadmin/users/{id}` | `getUserById()` |
| `POST /admin/users` | `POST /superadmin/users` | `createUser()` |
| `PUT /admin/users/{id}` | `PUT /superadmin/users/{id}` | `updateUser()` |
| `PUT /admin/users/{id}/roles` | `PUT /superadmin/users/{id}/roles` | `updateUserRoles()` |
| `PATCH /admin/users/{id}/password` | `PATCH /superadmin/users/{id}/password` | `updatePassword()` |
| `DELETE /admin/users/{id}` | `DELETE /superadmin/users/{id}` | `deleteUser()` |
| `GET /admin/roles` | `GET /superadmin/admin-roles` | `getAllRoles()` |

**Total**: 8 métodos actualizados

---

## ✅ Validaciones

### Rutas del Frontend (NO Modificadas)

Las siguientes rutas son del **Angular Router** y NO deben cambiar:

```typescript
// features-superadmin/src/lib/services/admin-menu.service.ts
{
  route: '/admin/users',        // ✅ Correcto (ruta frontend)
  label: 'Usuarios Admin'
},
{
  route: '/admin/users/roles',  // ✅ Correcto (ruta frontend)
  label: 'Roles y Permisos'
}
```

### Diferencia Importante

| Concepto | Valor | Propósito |
|----------|-------|-----------|
| **Ruta Frontend** | `/admin/users` | Navegación en Angular Router |
| **Endpoint Backend** | `/superadmin/users` | Petición HTTP al API |

---

## 📚 Documentación del Backend

### Endpoints Disponibles

#### Autenticación
- `POST /admin/auth/login` - Login de usuario admin
- `GET /admin/auth/me` - Obtener perfil actual

#### Gestión de Usuarios Admin (SuperAdmin only)
- `GET /superadmin/users` - Listar usuarios admin (paginado)
- `GET /superadmin/users/{userId}` - Obtener detalle de usuario
- `POST /superadmin/users` - Crear nuevo usuario admin
- `PUT /superadmin/users/{userId}` - Actualizar usuario admin
- `PUT /superadmin/users/{userId}/roles` - Actualizar roles
- `PATCH /superadmin/users/{userId}/password` - Cambiar contraseña
- `DELETE /superadmin/users/{userId}` - Eliminar usuario (soft delete)
- `GET /superadmin/admin-roles` - Obtener roles disponibles

#### Auditoría (Fase 3)
- `GET /admin/audit` - Consultar logs de auditoría
- `GET /admin/audit/user/{userId}` - Historial de usuario
- `GET /admin/audit/resource/{resourceType}/{resourceId}` - Historial de recurso

### Roles Administrativos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **SuperAdmin** | Acceso total al sistema | Todos los endpoints |
| **TenantManager** | Gestión de tenants y planes | `/admin/tenants/*`, `/superadmin/tenants/{slug}/plan` |
| **Support** | Solo lectura con información de soporte | Lectura de tenants |
| **Viewer** | Solo visualización básica | Lectura básica |

---

## 🧪 Pruebas Recomendadas

### 1. Verificar Lista de Usuarios
```http
GET {{baseUrl}}/superadmin/users?page=1&pageSize=20
Authorization: Bearer {{token}}
```

### 2. Obtener Roles
```http
GET {{baseUrl}}/superadmin/admin-roles
Authorization: Bearer {{token}}
```

### 3. Crear Usuario
```http
POST {{baseUrl}}/superadmin/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "email": "test@domain.com",
  "fullName": "Test User",
  "password": "Test123!",
  "roleNames": ["Support"]
}
```

### 4. Verificar Error de Autorización
```http
# Debería fallar con 403 si no eres SuperAdmin
GET {{baseUrl}}/superadmin/users
Authorization: Bearer {{tokenNoSuperAdmin}}
```

---

## 🔐 Seguridad

### Autenticación JWT

El backend usa claims simples (sin namespace):

```json
{
  "nameid": "user-guid",
  "email": "admin@domain.com",
  "admin": "true",
  "role": "SuperAdmin"
}
```

### Autorización

Todos los endpoints `/superadmin/*` requieren:
- ✅ Token JWT válido
- ✅ Claim `"admin": "true"`
- ✅ Rol `SuperAdmin` en claim `"role"`

La validación se realiza mediante:
- **Filtro**: `AdminRoleAuthorizationFilter`
- **Atributo**: `[RequireAdminRole("SuperAdmin")]`

---

## 📊 Impacto

### Archivos Modificados
- ✅ `features-superadmin/src/lib/services/admin-user-management.service.ts` (8 endpoints actualizados)

### Archivos NO Modificados
- ✅ `features-superadmin/src/lib/services/admin-menu.service.ts` (rutas de frontend)
- ✅ `features-superadmin/src/lib/admin.routes.ts` (rutas de Angular)
- ✅ Componentes (no requieren cambios, usan el servicio)

### Compatibilidad
- ✅ Compatible con backend versión 3.0+ (con auditoría)
- ✅ No requiere cambios en componentes UI
- ✅ No requiere cambios en guard de permisos
- ✅ No requiere cambios en modelos/DTOs

---

## 🚀 Próximos Pasos

1. **Probar en desarrollo**:
   ```bash
   npm run start:dev
   ```

2. **Verificar login**:
   - Ir a `/admin/auth/login`
   - Login con usuario SuperAdmin
   - Navegar a "Usuarios Admin"

3. **Verificar endpoints**:
   - Abrir DevTools → Network
   - Verificar que las peticiones van a `/superadmin/users`
   - Verificar respuestas 200 OK

4. **Probar CRUD completo**:
   - Crear usuario → ✅ POST `/superadmin/users`
   - Ver detalle → ✅ GET `/superadmin/users/{id}`
   - Editar roles → ✅ PUT `/superadmin/users/{id}/roles`
   - Cambiar contraseña → ✅ PATCH `/superadmin/users/{id}/password`
   - Eliminar → ✅ DELETE `/superadmin/users/{id}`

---

## 📞 Referencias

- **Documentación Backend Completa**: (Proporcionada por usuario el 15/02/2026)
- **Archivo de Pruebas**: `dev/superadmin-tests.http`
- **Código Frontend**: `features-superadmin/src/`
- **Modelos**: `features-superadmin/src/lib/models/admin-user.model.ts`

---

✅ **Cambios completados y listos para probar**
