# TODO Frontend Forms Roadmap

## BLOQUE 1: Resumen ejecutivo

### Estado general de los formularios

- Inventario detectado: 27 formularios formales (26 Reactive Forms + 1 template-driven).
- Inventario complementario: 14 UIs form-like (filtros, matrices y ediciones inline con ngModel).
- La arquitectura es funcional, pero no homogénea en UX ni en reglas de validación.
- Coexisten formularios muy bien resueltos con otros que validan solo en submit handler o con feedback global insuficiente.

### Problemas transversales detectados

- Inconsistencia visual entre estilos custom, Material legacy y patrones nuevos tipo Branding.
- Validaciones cross-field y de negocio frecuentemente fuera del FormGroup.
- Errores de backend mayoritariamente mostrados en banner/toast global, no mapeados a campos.
- Campos obligatorios sin marcador visual uniforme.
- Reglas de fecha y carga de archivos duplicadas en múltiples componentes.
- Uso mixto de Reactive + template-driven + ngModel suelto en áreas críticas.
- Tipado fuerte insuficiente: la mayoría de formularios usa FormGroup genérico.

### Riesgos técnicos y UX

- Riesgo alto en formularios complejos de negocio: producto, premios lealtad, ajuste manual de puntos, permisos/roles.
- Riesgo de intentos de submit inválido en casos donde la regla crítica vive fuera del estado formal del form.
- Riesgo de regresión por alto acoplamiento entre UI, reglas condicionales y payloads.

### Incidencias críticas detectadas

- Register (pantalla completa): confirmación de contraseña no se valida en onSubmit.
- Popup form: imagen requerida por negocio, pero no declarada como control requerido del FormGroup.
- User dialog tenant-admin: contraseña opcional en edición sin exigir confirmación cuando se captura nueva password.
- Create role superadmin: permisos obligatorios se validan solo en submit con alert; el botón no refleja esa regla.
- Tenant edit dialog: featureFlagsJson y allowedOrigins sin validación estructural local.

---

## BLOQUE 2: Inventario detallado

### Matriz consolidada de formularios formales

| Formulario                                | Ubicación                                                                                                          | Objetivo                          | Tipo                            | Campos visibles                                                                                                                                                                                    | Obligatorios                                                  | Validaciones frontend actuales                                                                            | Mensajes actuales                      | Hints backend/dependencias                           | ¿Permite enviar inválido/incompleto?                          | Estado visual                  | Riesgo        | Prioridad |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- | ------------------------------ | ------------- | --------- |
| Login                                     | features-account/src/lib/components/login/login.component.html                                                     | Autenticación                     | Reactive (nonNullable)          | email, password, rememberMe                                                                                                                                                                        | email, password                                               | required, email, minLength(6)                                                                             | inline por campo + alert global        | AccountService.login + redirección por claims        | No                                                            | Custom consistente             | Medio         | Media     |
| Register                                  | features-account/src/lib/components/register/register.component.html                                               | Alta de cliente                   | Reactive (nonNullable)          | firstName, lastName, email, phoneNumber, password, confirmPassword, acceptTerms                                                                                                                    | todos excepto phoneNumber                                     | required, email, minLength(6), requiredTrue                                                               | inline por campo + alert global        | AccountService.register + tenant activo              | Sí (si omiten match en handler)                               | Custom consistente             | Alto          | Alta      |
| Forgot password                           | features-account/src/lib/components/forgot-password/forgot-password.component.html                                 | Recuperación de cuenta            | Reactive (nonNullable)          | email                                                                                                                                                                                              | email                                                         | required, email                                                                                           | inline por campo + alerts              | AccountService.forgotPassword                        | No                                                            | Custom consistente             | Bajo          | Baja      |
| Profile - Información personal            | features-account/src/lib/components/profile/profile.component.html                                                 | Editar perfil                     | Reactive (nonNullable)          | firstName, lastName, email(ro), phoneNumber, documentType, documentNumber, birthDate, address, city, country                                                                                       | firstName, lastName                                           | required (nombres)                                                                                        | alert global (sin inline granular)     | AccountService.updateProfile                         | No                                                            | Custom básico                  | Medio         | Media     |
| Profile - Cambiar contraseña              | features-account/src/lib/components/profile/profile.component.html                                                 | Cambio de contraseña              | Reactive (nonNullable)          | currentPassword, newPassword, confirmPassword                                                                                                                                                      | todos                                                         | required, minLength(6), match en handler                                                                  | alert global                           | AccountService.changePassword                        | No (pero UX pobre)                                            | Custom básico                  | Medio         | Media     |
| Tenant Auth Modal - Login                 | features-account/src/lib/components/tenant-auth-modal/tenant-auth-modal.component.html                             | Login modal storefront            | Reactive (nonNullable)          | email, password, rememberMe                                                                                                                                                                        | email, password                                               | required, email, minLength(6)                                                                             | inline + alert                         | AccountService.login                                 | No                                                            | Custom consistente             | Bajo          | Baja      |
| Tenant Auth Modal - Register              | features-account/src/lib/components/tenant-auth-modal/tenant-auth-modal.component.html                             | Registro modal storefront         | Reactive (nonNullable)          | firstName, lastName, email, phoneNumber, password, confirmPassword, acceptTerms                                                                                                                    | todos excepto phoneNumber                                     | required, email, minLength(6), requiredTrue, match en handler                                             | inline + alert                         | AccountService.register                              | No                                                            | Custom consistente             | Medio         | Baja      |
| Tenant Auth Modal - Forgot                | features-account/src/lib/components/tenant-auth-modal/tenant-auth-modal.component.html                             | Recuperación modal                | Reactive (nonNullable)          | email                                                                                                                                                                                              | email                                                         | required, email                                                                                           | inline + alert                         | AccountService.forgotPassword                        | No                                                            | Custom consistente             | Bajo          | Baja      |
| Category form                             | features-admin/src/lib/pages/categories/categories-form/category-form.component.html                               | Crear/editar categoría            | Reactive (FormGroup)            | name, description, isActive, image                                                                                                                                                                 | name                                                          | required, minLength(3), maxLength(100/500), size image                                                    | inline + dialog/toast backend          | CategoryService create/update                        | No                                                            | Mejorado (alineado a Branding) | Bajo/Medio    | Baja      |
| Product form                              | features-admin/src/lib/pages/products/products-form/product-form.component.html                                    | Crear/editar producto             | Reactive (FormGroup)            | name, sku, brand, short/description, price, compareAtPrice, stock, trackInventory, isOnSale, isTaxIncluded, taxPercentage, media, categorías, tags, SEO, flags                                     | name, price, stock                                            | required, min/max, maxLength, reglas dinámicas tax, size imagen, validaciones manuales distribución stock | mixto inline + toast/snack             | ProductService + multipart + stock por tienda        | Parcialmente                                                  | Mejorado pero denso            | Muy Alto      | Muy Alta  |
| Banner form                               | features-admin/src/lib/pages/banners/banners-form/banners-form.component.html                                      | Crear/editar banner               | Reactive (FormGroup)            | title, subtitle, displayOrder, startDate, endDate, targetUrl, buttonText, isActive, image                                                                                                          | title, displayOrder                                           | required, min(1), maxLength, dateRange handler, size image                                                | inline + snack                         | BannerService create/update                          | Sí (intento posible antes de bloqueo handler)                 | Mejorado                       | Medio         | Media     |
| Popup form                                | features-admin/src/lib/pages/settings/popups-form/popups-form.component.html                                       | Crear/editar popup                | Reactive (FormGroup)            | targetUrl, buttonText, startDate, endDate, isActive, image                                                                                                                                         | imagen por negocio                                            | maxLength, dateRange handler, size image                                                                  | inline parcial + snack                 | PopupService create/update                           | Sí (regla imagen fuera de FormGroup)                          | Material legacy                | Crítico       | Muy Alta  |
| Store form                                | features-admin/src/lib/pages/stores/store-form/store-form.component.html                                           | Crear/editar sucursal             | Reactive (FormGroup)            | name, code, address, city, country, phone, isDefault, isActive(edit)                                                                                                                               | name                                                          | required, minLength(3)                                                                                    | inline + alert global                  | StoreAdminService create/update                      | No                                                            | Custom                         | Bajo/Medio    | Baja      |
| Branding settings - Branding tab          | features-admin/src/lib/pages/settings/branding-settings/branding-settings.component.html                           | Colores + logo/favicon            | Reactive (subgrupo)             | primaryColor, secondaryColor, accentColor, backgroundColor, logo, favicon                                                                                                                          | colores                                                       | required + size image                                                                                     | toasts globales (sin inline por color) | TenantSettingsService.updateBranding (multipart)     | Bloquea en handler, pero botón habilitado                     | Patrón referencia              | Alto UX       | Alta      |
| Branding settings - Contact tab           | features-admin/src/lib/pages/settings/branding-settings/branding-settings.component.html                           | Contacto                          | Reactive (subgrupo)             | email, phone, whatsApp, address                                                                                                                                                                    | email                                                         | required, email                                                                                           | toasts globales                        | updateContact                                        | Bloquea en handler                                            | Patrón referencia              | Medio         | Media     |
| Branding settings - Social tab            | features-admin/src/lib/pages/settings/branding-settings/branding-settings.component.html                           | Redes                             | Reactive (subgrupo)             | facebook, instagram, twitter, tikTok                                                                                                                                                               | ninguno                                                       | sin validadores de URL                                                                                    | toasts globales                        | updateSocial                                         | Sí (si URL inválida sintácticamente)                          | Patrón referencia              | Medio         | Media     |
| Branding settings - Advanced (locale+seo) | features-admin/src/lib/pages/settings/branding-settings/branding-settings.component.html                           | Moneda/impuestos/SEO              | Reactive (subgrupos locale+seo) | locale, currency, currencySymbol, taxRate, title, description, keywords                                                                                                                            | locale, currency, currencySymbol, taxRate, title              | required, min/max tax                                                                                     | toasts globales                        | updateSettings                                       | Bloquea en handler                                            | Patrón referencia              | Medio/Alto UX | Alta      |
| Loyalty reward form                       | features-admin/src/lib/pages/loyalty/reward-form/reward-form.component.html                                        | Crear/editar premio lealtad       | Reactive                        | name, description, rewardType, pointsCost, discountValue, productIds, appliesToAllEligibleProducts, singleProductSelectionRule, couponQuantity, validityDays, availableFrom/until, imageUrl, terms | name, description, rewardType, pointsCost + condicionales     | required, minLength, min + reglas condicionales en handler                                                | submitFeedback + toast, poco inline    | LoyaltyAdminService + ProductService selector        | Sí (intento posible antes de bloquear reglas condicionales)   | Custom funcional               | Muy Alto      | Muy Alta  |
| Loyalty points adjustment                 | features-admin/src/lib/pages/loyalty/points-adjustment/points-adjustment.component.html                            | Ajuste manual de puntos           | Template-driven + estado custom | userEmailSearch, selectedCustomer, points, reason, referenceId                                                                                                                                     | customer, points, reason                                      | required HTML + min/max + UUID + reason len en handler                                                    | inline mínimo + toast + alert global   | LoyaltyAdminService.adjustPoints + TenantUserService | Sí (intento posible sin customer hasta handler)               | Custom inline styles           | Alto          | Alta      |
| Loyalty program config - Compras a puntos | features-admin/src/lib/pages/loyalty/program-config/program-config.component.html                                  | Config acumulación                | Reactive                        | isEnabled, currencyAmount helper, conversionRate(hidden), minPurchaseForPoints, pointsExpirationDays                                                                                               | conversionRate                                                | required, min                                                                                             | toasts globales                        | LoyaltyAdminService.updateProgramConfig              | No                                                            | Custom bueno                   | Medio         | Media     |
| Loyalty program config - Puntos a dinero  | features-admin/src/lib/pages/loyalty/program-config/program-config.component.html                                  | Config uso puntos como dinero     | Reactive                        | isEnabled, moneyPerPoint, allowCombineWithCoupons, maxMoneyPerTransaction, minimumPayableAmount                                                                                                    | moneyPerPoint, minimumPayableAmount                           | required, min, normalización manual                                                                       | toasts globales                        | updatePointsPaymentConfig                            | No                                                            | Custom bueno                   | Medio         | Media     |
| Loyalty adjustments filters               | features-admin/src/lib/pages/loyalty/points-adjustments-page/components/loyalty-adjustments-filters.component.html | Filtrar ajustes                   | Reactive filtro                 | search, fromDate, toDate                                                                                                                                                                           | ninguno                                                       | email(search), parseo/rango fechas                                                                        | dateError + touched                    | emite filtros normalizados                           | No                                                            | Utilitario                     | Medio         | Media     |
| User dialog (tenant-admin)                | features-admin/src/lib/components/user-dialog/user-dialog.component.html                                           | Crear/editar usuario tenant       | Reactive (nonNullable)          | email, firstName, lastName, phoneNumber, roleIds, password, confirmPassword, mustChangePassword                                                                                                    | create: email,nombre,roles,password; edit: email,nombre,roles | required, email, minLength, passwordMismatch custom parcial                                               | inline + banner error                  | TenantUserService + RoleService                      | Sí (password sin confirmación obligatoria en algunos caminos) | Material                       | Alto          | Muy Alta  |
| Role dialog (tenant-admin)                | features-admin/src/lib/components/role-dialog/role-dialog.component.html                                           | Crear/editar rol tenant           | Reactive (FormGroup)            | name, description                                                                                                                                                                                  | name                                                          | required, min/maxLength                                                                                   | inline + banner global                 | RoleService create/update                            | No                                                            | Material                       | Bajo/Medio    | Baja      |
| Tenant create                             | features-superadmin/src/lib/pages/tenant-create/tenant-create.component.html                                       | Crear comercio                    | Reactive (FormGroup)            | name, slug(auto), adminEmail, planCode                                                                                                                                                             | todos                                                         | required, min/maxLength, emailWithDomainValidator                                                         | field invalid + error global           | TenantAdminService.createTenant/getPlans             | No                                                            | Custom sólido                  | Medio         | Media     |
| Admin user dialog (superadmin)            | features-superadmin/src/lib/components/admin-user-dialog/admin-user-dialog.component.html                          | Crear/editar usuario admin global | Reactive (FormGroup)            | create: email,fullName,password,roleNames; edit: email,fullName,isActive                                                                                                                           | modo dependiente                                              | required, email, min/maxLength, minLength(8), roles requerido                                             | inline + banners                       | AdminUserManagementService                           | No                                                            | Material                       | Medio         | Media     |
| Tenant edit dialog                        | features-superadmin/src/lib/components/tenant-edit-dialog/tenant-edit-dialog.component.html                        | Editar comercio                   | Reactive                        | name, planId, allowedOrigins, featureFlagsJson                                                                                                                                                     | name, planId                                                  | required, minLength(3)                                                                                    | inline básico + error global           | TenantAdminService.updateTenant                      | Sí (JSON/origins sin validador formal)                        | Material                       | Alto          | Alta      |
| Create role dialog (superadmin)           | features-superadmin/src/lib/pages/roles/create-role-dialog.component.html                                          | Crear rol global con permisos     | Reactive + estado permisos      | name, description, selectedPermissions                                                                                                                                                             | name + permisos                                               | required, minLength; permisos solo en submit                                                              | inline parcial + alert + error global  | AdminRolesService.getAllPermissions/createRole       | Sí (botón habilitable sin permisos)                           | Material                       | Alto          | Alta      |
| Edit role dialog (superadmin)             | features-superadmin/src/lib/pages/roles/edit-role-dialog.component.html                                            | Editar rol global                 | Reactive                        | name, description                                                                                                                                                                                  | name (si editable)                                            | required, minLength                                                                                       | inline + error global                  | AdminRolesService.updateRole                         | No                                                            | Material                       | Bajo/Medio    | Baja      |
| Loyalty redemptions filters (public)      | features/src/lib/loyalty/pages/loyalty-redemptions-page/components/loyalty-redemptions-filters.component.html      | Filtrar canjes usuario            | Reactive filtro                 | status, fromDate, toDate                                                                                                                                                                           | ninguno                                                       | parseo/rango fechas                                                                                       | dateError                              | emite filtros normalizados                           | No                                                            | Utilitario                     | Bajo          | Baja      |

### Inventario complementario (UIs form-like con ngModel)

- Rewards list filters: features-admin/src/lib/pages/loyalty/rewards-list/rewards-list.component.html
- Redemptions list filters: features-admin/src/lib/pages/loyalty/redemptions-list/redemptions-list.component.html
- Tenants list filters: features-superadmin/src/lib/pages/tenants-list/tenants-list.component.html
- Admin users list filters: features-superadmin/src/lib/pages/admin-users/admin-users-list.component.html
- Role permissions matrix: features-admin/src/lib/pages/access/role-permissions/role-permissions.component.html
- Product stock inline edit: features-admin/src/lib/pages/stores/product-stock-by-stores/product-stock-by-stores.component.html
- Reward product selector dialog: features-admin/src/lib/pages/loyalty/reward-product-selector-dialog/reward-product-selector-dialog.component.html
- Transactions history filters: features/src/lib/loyalty/pages/transactions-history/transactions-history.component.html
- My redemptions status: features/src/lib/loyalty/pages/my-redemptions/my-redemptions.component.html
- Loyalty transactions history (nuevo): features/src/lib/loyalty/pages/loyalty-transactions-history-page/loyalty-transactions-history-page.component.html
- Banners list search: features-admin/src/lib/pages/banners/banners-list/banners-list.component.html
- Products list search: features-admin/src/lib/pages/products/products-list/products-list.component.html
- Admin user roles dialog: features-superadmin/src/lib/components/admin-user-roles-dialog/admin-user-roles-dialog.component.html
- Tenant debug selector: core/src/lib/components/tenant-debug/tenant-debug.component.html

### Diferenciación explícita

#### a) Validaciones ya existentes

- required/email/min/max/minLength/maxLength en casi todos los formularios reactivos.
- date range manual en banner/popup y filtros de loyalty.
- validación tamaño de imagen en category/banner/popup/branding/product.
- reglas de negocio en handler: reward, points adjustment, popup image, product stock distribution.

#### b) Validaciones faltantes pero recomendadas

- passwordMatch declarativo en Register y Profile (y where applies en dialogs).
- requiredFile formal para Popup (y otros donde aplique por contrato).
- minSelectedArray para roles/permisos.
- validJson para featureFlagsJson.
- validAllowedOrigins básico para CORS text input.
- validación de tipo de archivo en uploads (además de tamaño).
- validación URL en redes sociales (branding social).

#### c) Mejoras visuales/UX

- marcador visual uniforme de obligatorio.
- errores inline consistentes y no solo toasts.
- estados touched/invalid homogéneos.
- bloqueo de submit también por reglas de negocio críticas.
- indicador de cambios no guardados en formularios tabbed.

---

## BLOQUE 3: Estándar objetivo propuesto

### Patrón visual y funcional unificado

- Adoptar un shell reutilizable de formulario (FormPage/DialogFormShell) con:
  - Header de contexto.
  - Secciones/cards consistentes.
  - Grid responsive uniforme.
  - Action row persistente con estado loading.
- Adoptar FieldShell para input/select/textarea/checkbox/radio/date/file/autocomplete:
  - Label + helper + control + meta (contador/hint) + error slot.
  - Estados visuales consistentes (default/focus/touched/invalid/disabled/loading).

### Cómo deben mostrarse errores

- Regla base: mostrar error al estar touched o tras submit intentado.
- Cross-field: error a nivel de grupo (ej: password mismatch, date range).
- Errores backend:
  - Intentar mapear a campo cuando exista clave reconocible.
  - Si no es mapeable, mostrar banner global del formulario.
- Evitar confiar solo en toast para errores de validación.

### Cuándo marcar touched

- Al salir del campo (blur).
- En submit inválido: markAllAsTouched.
- En formularios por tabs: tocar solo subgrupo al guardar esa sección.

### Cuándo bloquear submit

- form.invalid.
- regla de negocio crítica incumplida (required file, selección mínima, rango inválido, JSON inválido).
- estado saving/loading activo.
- falta de cambios en modo edición cuando ese flujo lo requiera.

### Cuándo permitir submit

- Formulario válido + reglas de negocio satisfechas.
- En edición: válido + cambios (o reenvío explícito permitido por negocio).
- En filtros: permitir aplicar si parsea correctamente; permitir limpiar siempre.

### Estrategia de accesibilidad

- labels semánticos reales o mat-label equivalentes.
- aria-invalid y aria-describedby conectando hint/error.
- role alert en banners críticos.
- focus al primer campo inválido tras submit fallido.
- no depender solo del color para indicar error/estado.

### Estrategia reutilizable por control

- Input/select/textarea: FieldShell.
- Checkbox/radio: GroupField con legend + error de grupo.
- Date/date-range: DateField/DateRange validator compartido.
- File upload: FileUploadField con preview + reglas tamaño/tipo + estado de reemplazo.
- Autocomplete/selector remoto: AsyncSelector con loading y empty states.

### Consistencia sin romper arquitectura actual

- Mantener contratos HTTP, nombres de campos y servicios.
- Solo mover validación/UX a wrappers/validators reutilizables.
- Reglas de negocio complejas permanecen, pero documentadas y cubiertas por validadores de grupo cuando sea seguro.

---

## BLOQUE 4: Plan de implementación incremental

### Fase 0: Baseline y trazabilidad (sin cambios visuales)

- Congelar comportamiento actual por formulario (payload esperado, bloqueos, mensajes).
- Checklist de no regresión por formulario.
- Prioridad: inmediata.

### Fase 1: Guardrails críticos de validación

- Formularios: Register, Popup, User Dialog tenant-admin, Create Role superadmin, Tenant Edit.
- Objetivo: cerrar submit inválido/incompleto crítico.
- Riesgo: medio.
- Criterio de aceptación:
  - no submit sin confirmación/archivo/permisos/estructura mínima cuando aplique,
  - sin cambio de endpoint ni shape de payload.

### Fase 2: Formularios account (alto impacto usuario)

- Formularios: Login, Forgot, Register, TenantAuthModal, Profile.
- Objetivo: UX de error consistente + validación cross-field declarativa.
- Riesgo: medio-bajo.
- Aceptación: errores inline completos, bloqueo correcto, navegación intacta.

### Fase 3: CRUD tenant-admin de complejidad baja/media

- Formularios: Category, Banner, Store, Role Dialog.
- Objetivo: patrón visual/validación unificado reutilizable.
- Riesgo: medio.
- Aceptación: sin cambios de lógica negocio ni contratos.

### Fase 4: Configuración por secciones/tabs

- Formularios: Branding Settings, Program Config, filtros reactivos loyalty.
- Objetivo: manejo de touched por sección, feedback inline y estados dirty.
- Riesgo: medio.
- Aceptación: guardado parcial confiable + UX clara de estado.

### Fase 5: Formularios complejos de negocio

- Formularios: Product Form, Reward Form, Points Adjustment, Product Stock by Stores, Role Permissions Matrix.
- Objetivo: consolidar reglas condicionales y reducir validación dispersa en handlers.
- Riesgo: alto.
- Aceptación: paridad funcional total + pruebas manuales dirigidas por caso de negocio.

### Orden recomendado por impacto/riesgo

1. Popup, Register, User Dialog, Create Role superadmin, Tenant Edit.
2. Product Form y Reward Form (tras utilidades compartidas).
3. Points Adjustment, Stock by Stores, Role Permissions.
4. Resto de formularios y filtros.

---

## BLOQUE 5: Backlog accionable

### Quick wins

- [ ] Implementar validadores reutilizables: passwordMatch, dateRange, requiredFile, minSelectedArray, validJson.
- [ ] Register: validar confirmPassword en FormGroup y en onSubmit.
- [ ] Popup: formalizar regla de imagen requerida en estado de validación de submit.
- [ ] User Dialog tenant-admin: exigir confirmación cuando password tenga valor.
- [ ] Create Role superadmin: bloquear botón si no hay permisos seleccionados.
- [ ] Tenant Edit: validar JSON de featureFlags localmente antes de enviar.

### Mejoras medias

- [ ] Crear FieldShell reutilizable para input/select/textarea.
- [ ] Crear FileUploadField reutilizable para logo/favicon/category/banner/product.
- [ ] Unificar mapper de errores backend a errores de campo + banner global.
- [ ] Unificar DateRange validator en banner/popup/filtros.
- [ ] Agregar dirty-state indicator en formularios por tabs (branding/program config).
- [ ] Convertir Points Adjustment de template-driven a reactive typed.

### Formularios complejos (plan aparte)

- [ ] Product Form: separar subgrupos y normalizar reglas condicionales.
- [ ] Reward Form: mover reglas de negocio repetidas a validadores de grupo.
- [ ] Role Permissions Matrix: estandarizar edición masiva con guardas y confirmaciones.
- [ ] Product Stock by Stores: formalizar reglas de stock con estado coherente de edición.

### Dependencias y componentes reutilizables a crear

- [ ] shared/forms/validators (passwordMatch/dateRange/requiredFile/minSelectedArray/validJson).
- [ ] shared/forms/components/field-shell.
- [ ] shared/forms/components/file-upload-field.
- [ ] shared/forms/services/form-error-mapper.
- [ ] shared/forms/components/filter-bar.

### Notas de alcance

- No cambiar contratos HTTP.
- No renombrar campos usados por backend.
- No mover reglas de negocio sin justificar y probar.
- Etiquetar cada cambio como:
  - validación existente preservada,
  - validación nueva recomendada,
  - mejora visual/UX.
