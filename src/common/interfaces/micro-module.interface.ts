import { UIElement } from './ui-element.interface';

/**
 * Базовый интерфейс для всех микромодулей
 */
export interface MicroModule {
  /** Уникальное имя модуля */
  name: string;
  
  /** Версия модуля */
  version: string;
  
  /** Отображаемое имя */
  displayName: string;
  
  /** Описание модуля */
  description: string;
  
  /** Включен ли модуль */
  isEnabled: boolean;
  
  /** Системный ли модуль (нельзя отключить) */
  isSystem: boolean;
  
  /** Зависимости от других модулей */
  dependencies: string[];
  
  /** Права доступа, которые предоставляет модуль */
  permissions: string[];
  
  /** UI элементы модуля */
  uiElements: UIElement[];
  
  /** Приоритет загрузки */
  priority: number;
  
  /** Инициализация модуля */
  initialize(): Promise<void>;
  
  /** Остановка модуля */
  destroy(): Promise<void>;
  
  /** Проверка зависимостей */
  checkDependencies(): Promise<boolean>;
  
  /** Получение конфигурации модуля */
  getConfig(): Record<string, any>;
  
  /** Установка конфигурации модуля */
  setConfig(config: Record<string, any>): Promise<void>;
}

/**
 * Интерфейс для модулей аутентификации
 */
export interface AuthMicroModule extends MicroModule {
  /** Поддерживаемые методы аутентификации */
  authMethods: string[];
  
  /** Валидация credentials */
  validateCredentials(credentials: any): Promise<boolean>;
  
  /** Генерация токенов */
  generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }>;
}

/**
 * Интерфейс для модулей управления
 */
export interface ManagementMicroModule extends MicroModule {
  /** Управляемые сущности */
  managedEntities: string[];
  
  /** Проверка прав на операцию */
  canPerformOperation(operation: string, user: any, target?: any): Promise<boolean>;
}

/**
 * Интерфейс для системных модулей
 */
export interface SystemMicroModule extends MicroModule {
  /** Системные настройки */
  systemSettings: Record<string, any>;
  
  /** Валидация системных настроек */
  validateSystemSettings(settings: Record<string, any>): Promise<boolean>;
  
  /** Применение системных настроек */
  applySystemSettings(settings: Record<string, any>): Promise<void>;
}
