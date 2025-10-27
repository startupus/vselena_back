import { Injectable, Logger } from '@nestjs/common';
import { MicroModule, AuthMicroModule, ManagementMicroModule, SystemMicroModule } from '../interfaces/micro-module.interface';
import { UIElement } from '../interfaces/ui-element.interface';

/**
 * Базовый класс для всех микромодулей
 */
@Injectable()
export abstract class BaseMicroModule implements MicroModule {
  protected readonly logger = new Logger(this.constructor.name);

  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly isEnabled: boolean;
  abstract readonly isSystem: boolean;
  abstract readonly dependencies: string[];
  abstract readonly permissions: string[];
  abstract readonly uiElements: UIElement[];
  abstract readonly priority: number;

  /**
   * Инициализация модуля
   */
  async initialize(): Promise<void> {
    this.logger.log(`Инициализация модуля ${this.name} v${this.version}`);
    
    try {
      await this.onInitialize();
      this.logger.log(`Модуль ${this.name} успешно инициализирован`);
    } catch (error) {
      this.logger.error(`Ошибка инициализации модуля ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Остановка модуля
   */
  async destroy(): Promise<void> {
    this.logger.log(`Остановка модуля ${this.name}`);
    
    try {
      await this.onDestroy();
      this.logger.log(`Модуль ${this.name} остановлен`);
    } catch (error) {
      this.logger.error(`Ошибка остановки модуля ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Проверка зависимостей
   */
  async checkDependencies(): Promise<boolean> {
    // Базовая реализация - всегда true
    // В наследниках можно переопределить
    return true;
  }

  /**
   * Получение конфигурации
   */
  getConfig(): Record<string, any> {
    return {};
  }

  /**
   * Установка конфигурации
   */
  async setConfig(config: Record<string, any>): Promise<void> {
    this.logger.log(`Установка конфигурации для модуля ${this.name}`);
    await this.onConfigChange(config);
  }

  /**
   * Переопределяемые методы
   */
  protected abstract onInitialize(): Promise<void>;
  protected abstract onDestroy(): Promise<void>;
  protected async onConfigChange(config: Record<string, any>): Promise<void> {
    // Базовая реализация - ничего не делает
  }

  /**
   * Общие методы для всех микромодулей
   */
  protected logInitialization(): void {
    this.logger.log(`Модуль ${this.name} v${this.version} инициализирован`);
  }

  protected logDestruction(): void {
    this.logger.log(`Модуль ${this.name} остановлен`);
  }

  protected validateModuleName(): boolean {
    return !!(this.name && this.name.length > 0);
  }

  protected validateVersion(): boolean {
    return !!(this.version && /^\d+\.\d+\.\d+$/.test(this.version));
  }
}

/**
 * Базовый класс для модулей аутентификации
 */
export abstract class BaseAuthMicroModule extends BaseMicroModule implements AuthMicroModule {
  abstract readonly authMethods: string[];

  /**
   * Валидация credentials
   */
  abstract validateCredentials(credentials: any): Promise<boolean>;

  /**
   * Генерация токенов
   */
  abstract generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }>;
}

/**
 * Базовый класс для модулей управления
 */
export abstract class BaseManagementMicroModule extends BaseMicroModule implements ManagementMicroModule {
  abstract readonly managedEntities: string[];

  /**
   * Проверка прав на операцию
   */
  abstract canPerformOperation(operation: string, user: any, target?: any): Promise<boolean>;
}

/**
 * Базовый класс для системных модулей
 */
export abstract class BaseSystemMicroModule extends BaseMicroModule implements SystemMicroModule {
  abstract readonly systemSettings: Record<string, any>;

  /**
   * Валидация системных настроек
   */
  abstract validateSystemSettings(settings: Record<string, any>): Promise<boolean>;

  /**
   * Применение системных настроек
   */
  abstract applySystemSettings(settings: Record<string, any>): Promise<void>;
}
