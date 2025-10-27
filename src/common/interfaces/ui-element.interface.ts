/**
 * Интерфейс для UI элементов
 */
export interface UIElement {
  /** Уникальный ID элемента */
  id: string;
  
  /** Название компонента */
  component: string;
  
  /** Путь к компоненту */
  path: string;
  
  /** Отображаемое название */
  displayName: string;
  
  /** Описание элемента */
  description: string;
  
  /** Требуемые права доступа */
  requiredPermissions: string[];
  
  /** Требуемые роли */
  requiredRoles: string[];
  
  /** Условия отображения */
  conditions: UIConditions;
  
  /** Приоритет отображения */
  priority: number;
  
  /** Активен ли элемент */
  isActive: boolean;
  
  /** Метаданные элемента */
  metadata: Record<string, any>;
}

/**
 * Условия отображения UI элемента
 */
export interface UIConditions {
  /** Функция должна быть включена */
  featureEnabled?: string;
  
  /** Пользователь должен иметь роль */
  userHasRole?: string;
  
  /** Пользователь должен иметь право */
  userHasPermission?: string;
  
  /** Пользователь должен быть в организации */
  userInOrganization?: boolean;
  
  /** Пользователь должен быть в команде */
  userInTeam?: boolean;
  
  /** Дополнительные условия */
  custom?: Record<string, any>;
}

/**
 * Группа UI элементов
 */
export interface UIGroup {
  /** ID группы */
  id: string;
  
  /** Название группы */
  name: string;
  
  /** Описание группы */
  description: string;
  
  /** Элементы группы */
  elements: UIElement[];
  
  /** Условия отображения группы */
  conditions: UIConditions;
  
  /** Приоритет группы */
  priority: number;
}

/**
 * Навигационное меню
 */
export interface NavigationMenu {
  /** ID меню */
  id: string;
  
  /** Название меню */
  name: string;
  
  /** Элементы меню */
  items: NavigationItem[];
  
  /** Условия отображения */
  conditions: UIConditions;
}

/**
 * Элемент навигации
 */
export interface NavigationItem {
  /** ID элемента */
  id: string;
  
  /** Название */
  label: string;
  
  /** Иконка */
  icon?: string;
  
  /** URL */
  url: string;
  
  /** Дочерние элементы */
  children?: NavigationItem[];
  
  /** Условия отображения */
  conditions: UIConditions;
  
  /** Приоритет */
  priority: number;
}
