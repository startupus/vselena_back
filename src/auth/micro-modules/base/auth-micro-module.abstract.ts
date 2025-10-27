import { Injectable } from '@nestjs/common';
import { AuthMicroModuleConfig } from './auth-micro-module.interface';

@Injectable()
export abstract class BaseAuthMicroModule {
  abstract readonly config: AuthMicroModuleConfig;

  /**
   * Инициализация микромодуля
   */
  async initialize(): Promise<void> {
    console.log(`🔧 Инициализация микромодуля: ${this.config.name} v${this.config.version}`);
  }

  /**
   * Проверка зависимостей
   */
  async checkDependencies(): Promise<boolean> {
    if (!this.config.dependencies || this.config.dependencies.length === 0) {
      return true;
    }

    // Здесь можно добавить логику проверки зависимостей
    console.log(`🔍 Проверка зависимостей для ${this.config.name}:`, this.config.dependencies);
    return true;
  }

  /**
   * Включение/выключение модуля
   */
  async toggle(enabled: boolean): Promise<void> {
    this.config.enabled = enabled;
    console.log(`🔄 Микромодуль ${this.config.name} ${enabled ? 'включен' : 'выключен'}`);
  }

  /**
   * Получение статуса модуля
   */
  getStatus(): { enabled: boolean; healthy: boolean; dependencies: boolean } {
    return {
      enabled: this.config.enabled,
      healthy: true, // Здесь можно добавить health check
      dependencies: true, // Здесь можно добавить проверку зависимостей
    };
  }
}
