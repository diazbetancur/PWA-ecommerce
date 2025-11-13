# 🔧 Tenant Debug Panel

Panel de debug completo para inspeccionar y testear la información del tenant en tiempo real.

## 🎯 Acceso al Debug Panel

### **URL Directa**
```
http://localhost:4200/tenant/debug
```

### **Desde la Aplicación**
Agrega un botón de debug en desarrollo:

```typescript
// En cualquier componente
@Component({
  template: `
    <!-- Solo mostrar en desarrollo -->
    @if (!isProduction()) {
      <button 
        type="button"
        class="debug-button"
        routerLink="/tenant/debug"
      >
        🔧 Debug Tenant
      </button>
    }
  `
})
export class SomeComponent {
  isProduction(): boolean {
    return !globalThis.location.hostname.includes('localhost');
  }
}
```

### **Desde el HeaderComponent**
Puedes agregar un enlace discreto en el header:

```typescript
// En header.component.ts template
@if (showDebugLink()) {
  <a routerLink="/tenant/debug" class="debug-link" title="Tenant Debug">
    🔧
  </a>
}

// En el componente
showDebugLink = computed(() => 
  !globalThis.location.hostname.includes('localhost') === false
);
```

## 📋 Características del Debug Panel

### ✅ **Información del Tenant**
- **Identificación**: Slug, Key/ID, Display Name, Status
- **Branding**: Logo preview, colores con swatches visuales
- **Configuración**: Locale, currency, CDN base URL
- **Features**: Lista de features habilitadas/deshabilitadas

### ✅ **API Testing Integrado**
- **Endpoints preconfigurados**:
  - `GET /api/catalog/products`
  - `GET /api/catalog/categories` 
  - `GET /api/public/health`
  - Custom endpoint input
- **Headers preview**: Muestra qué headers de tenant se envían
- **Response viewer**: JSON formateado con syntax highlighting
- **Error handling**: Muestra errores HTTP con detalles
- **Test history**: Últimos 5 tests con timestamps

### ✅ **Configuración Raw**
- **JSON completo**: Toda la configuración del tenant
- **Copy to clipboard**: Botón para copiar JSON
- **Download**: Descarga como archivo .json
- **Syntax highlighting**: Colores para mejor legibilidad

### ✅ **UX Profesional**
- **Responsive design**: Mobile-first approach
- **Loading states**: Spinners durante operaciones
- **Status indicators**: Badges de colores para estados
- **Color swatches**: Preview visual de colores del tenant
- **Logo preview**: Muestra logo con fallback

## 🧪 Casos de Uso de Testing

### **1. Verificar Headers de Tenant**
```bash
1. Navegar a /tenant/debug
2. Ver sección "Headers que se enviarán"
3. Confirmar que X-Tenant-Slug y X-Tenant-Key tienen valores correctos
4. Ejecutar test contra /api/catalog/products
5. Verificar que el backend recibe los headers correctamente
```

### **2. Testing de Endpoints**
```bash
# Test endpoint estándar
1. Seleccionar "/api/catalog/products"
2. Click "Ejecutar Test"
3. Ver respuesta JSON con productos del tenant

# Test endpoint custom  
1. Seleccionar "Custom endpoint..."
2. Ingresar "/api/custom/endpoint"
3. Ejecutar test
4. Ver si el endpoint responde correctamente
```

### **3. Debug de Branding**
```bash
1. Ver sección "Branding"
2. Confirmar que logoUrl apunta a imagen válida
3. Ver preview del logo 
4. Verificar colores con swatches visuales
5. Confirmar que coinciden con el branding aplicado
```

## 🔧 Integración con Desarrollo

### **En app.routes.ts** (Opcional - Solo Desarrollo)
```typescript
export const routes: Routes = [
  // Rutas normales...
  { path: '', redirectTo: '/catalog', pathMatch: 'full' },
  { path: 'catalog', loadChildren: () => import('@pwa/features')... },
  
  // Debug route solo en desarrollo
  ...(isDevMode() ? [{
    path: 'debug',
    redirectTo: '/tenant/debug'
  }] : []),
  
  { path: '**', redirectTo: '/catalog' }
];
```

### **Acceso Rápido Vía Query Param**
```typescript
// En app.component.ts
ngOnInit() {
  // Auto-redirigir a debug si ?debug=tenant en URL
  if (this.router.url.includes('?debug=tenant')) {
    this.router.navigate(['/tenant/debug']);
  }
}
```

### **Hotkey de Desarrollo** (Opcional)
```typescript
// En app.component.ts
@HostListener('window:keydown', ['$event'])
handleKeyDown(event: KeyboardEvent) {
  // Ctrl+Shift+D = Debug panel
  if (event.ctrlKey && event.shiftKey && event.key === 'D') {
    if (!this.isProduction()) {
      this.router.navigate(['/tenant/debug']);
    }
  }
}
```

## 📱 Screenshots de Ejemplo

### **Panel Principal**
- Grid de información del tenant con cards organizadas
- Status indicators con colores (loading/ok/error)  
- Logo preview con fallback para URLs inválidas
- Color swatches para preview visual de branding

### **API Testing**
- Selector de endpoints con opciones comunes
- Input custom para endpoints específicos
- Preview de headers que se enviarán automáticamente
- Response viewer con JSON syntax highlighting
- Historial de tests con timestamps y status

### **Raw Configuration**
- JSON viewer con scroll para configuraciones grandes
- Botones para copy/download de la configuración
- Syntax highlighting para mejor legibilidad

## ⚠️ Consideraciones de Seguridad

### **Solo Desarrollo**
El debug panel debe estar disponible solo en desarrollo:
```typescript
// Guard para producción
export const debugGuard = (): boolean => {
  const isProduction = !globalThis.location.hostname.includes('localhost');
  if (isProduction) {
    console.warn('Debug panel not available in production');
    return false;
  }
  return true;
};
```

### **Información Sensible**
- No mostrar tokens o secrets en el JSON raw
- Sanitizar información sensible del tenant
- Logs de API tests solo en console, no en UI

## 🚀 Extensiones Futuras

### **Posibles Mejoras**
1. **Network tab**: Mostrar todas las requests HTTP en tiempo real
2. **Performance metrics**: Tiempo de carga del tenant, API response times
3. **Theme switcher**: Cambiar tenants en vivo para comparar
4. **Export reports**: Generar reportes de debugging 
5. **WebSocket testing**: Para endpoints de real-time
6. **Tenant comparison**: Side-by-side comparison de configuraciones

---

**🎉 Debug Panel Completo Implementado!**

Ahora tienes acceso completo a toda la información del tenant y capacidad de testing de API en tiempo real. Perfecto para desarrollo y troubleshooting! 🔧
