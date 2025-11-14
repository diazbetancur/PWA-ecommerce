/**
 * 🎯 Modelo de Item del Menú del Administrador General
 *
 * Define la estructura de cada elemento del menú lateral del módulo superadmin.
 * Soporta menús anidados, iconos, badges, y control de acceso basado en permisos.
 */

/**
 * Tipo de icono que se puede usar en el menú
 * - 'material': Material Icons (ej: 'dashboard', 'people')
 * - 'custom': Path SVG personalizado
 */
export type IconType = 'material' | 'custom';

/**
 * Tipo de badge que puede mostrar un item del menú
 */
export interface MenuBadge {
  text: string;
  color?: 'primary' | 'accent' | 'warn' | 'success' | 'info';
  tooltip?: string;
}

/**
 * Modelo principal del item del menú
 */
export interface AdminMenuItem {
  /**
   * Identificador único del item (usado para tracking y analytics)
   */
  id: string;

  /**
   * Etiqueta visible del menú
   */
  label: string;

  /**
   * Icono a mostrar (nombre de Material Icon o path SVG)
   */
  icon?: string;

  /**
   * Tipo de icono (por defecto 'material')
   */
  iconType?: IconType;

  /**
   * Ruta a la que navega al hacer clic
   * Si tiene children, esta ruta puede ser opcional
   */
  route?: string;

  /**
   * Lista de permisos requeridos para ver este item
   * Si está vacío, el item es visible para todos los usuarios autenticados
   * La lógica es AND: el usuario debe tener TODOS los permisos listados
   */
  requiredPermissions?: string[];

  /**
   * Lista de roles requeridos (alternativa a permisos)
   * La lógica es OR: el usuario debe tener AL MENOS UNO de los roles
   */
  requiredRoles?: string[];

  /**
   * Badge opcional a mostrar (ej: "NEW", "3")
   */
  badge?: MenuBadge;

  /**
   * Items hijos para crear menús colapsables
   */
  children?: AdminMenuItem[];

  /**
   * Si el item está deshabilitado (no clicable)
   */
  disabled?: boolean;

  /**
   * Si el item está expandido por defecto (solo para items con children)
   */
  expanded?: boolean;

  /**
   * Orden de aparición (menor número = más arriba)
   */
  order?: number;

  /**
   * Si debe mostrarse un separador después de este item
   */
  showDivider?: boolean;

  /**
   * Tooltip explicativo al hacer hover
   */
  tooltip?: string;

  /**
   * Si el link debe abrirse en una nueva ventana
   */
  external?: boolean;

  /**
   * Clase CSS personalizada para el item
   */
  cssClass?: string;
}

/**
 * Configuración del menú completo
 */
export interface AdminMenuConfig {
  /**
   * Lista de items del menú principal
   */
  items: AdminMenuItem[];

  /**
   * Si el menú está colapsado por defecto
   */
  collapsed?: boolean;

  /**
   * Ancho del menú cuando está expandido (en px)
   */
  expandedWidth?: number;

  /**
   * Ancho del menú cuando está colapsado (en px)
   */
  collapsedWidth?: number;

  /**
   * Posición del menú
   */
  position?: 'left' | 'right';
}

/**
 * Estado del item del menú (usado internamente por el componente)
 */
export interface MenuItemState {
  item: AdminMenuItem;
  visible: boolean;
  active: boolean;
  expanded: boolean;
  level: number;
}
