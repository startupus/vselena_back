import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroModule, AuthMicroModule, ManagementMicroModule, SystemMicroModule } from '../interfaces/micro-module.interface';
import { UIElement } from '../interfaces/ui-element.interface';

/**
 * Сервис для регистрации и управления микромодулями
 */
@Injectable()
export class MicroModuleRegistryService implements OnModuleInit {
  private readonly logger = new Logger(MicroModuleRegistryService.name);
  private readonly modules = new Map<string, MicroModule>();

  constructor(
    // Здесь можно добавить репозитории для БД, если нужно сохранять состояние
  ) {}

  async onModuleInit() {
    this.logger.log('Инициализация реестра микромодулей');
    await this.loadModules();
  }

  /**
   * Регистрация микромодуля
   */
  async registerModule(module: MicroModule): Promise<void> {
    try {
      // Проверяем зависимости
      const dependenciesMet = await this.checkDependencies(module);
      if (!dependenciesMet) {
        throw new Error(`Зависимости для модуля ${module.name} не выполнены`);
      }

      // Инициализируем модуль
      await module.initialize();
      
      // Регистрируем модуль
      this.modules.set(module.name, module);
      
      this.logger.log(`Модуль ${module.name} успешно зарегистрирован`);
    } catch (error) {
      this.logger.error(`Ошибка регистрации модуля ${module.name}:`, error);
      throw error;
    }
  }

  /**
   * Отключение микромодуля
   */
  async unregisterModule(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);
    if (!module) {
      throw new Error(`Модуль ${moduleName} не найден`);
    }

    if (module.isSystem) {
      throw new Error(`Системный модуль ${moduleName} нельзя отключить`);
    }

    try {
      await module.destroy();
      this.modules.delete(moduleName);
      this.logger.log(`Модуль ${moduleName} отключен`);
    } catch (error) {
      this.logger.error(`Ошибка отключения модуля ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Получение модуля по имени
   */
  getModule(moduleName: string): MicroModule | undefined {
    return this.modules.get(moduleName);
  }

  /**
   * Получение всех модулей
   */
  getAllModules(): MicroModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Получение включенных модулей
   */
  getEnabledModules(): MicroModule[] {
    return this.getAllModules().filter(module => module.isEnabled);
  }

  /**
   * Получение модулей по типу
   */
  getModulesByType<T extends MicroModule>(type: new (...args: any[]) => T): T[] {
    return this.getAllModules().filter(module => module instanceof type) as T[];
  }

  /**
   * Получение всех UI элементов
   */
  getAllUIElements(): UIElement[] {
    const elements: UIElement[] = [];
    
    for (const module of this.modules.values()) {
      if (module.isEnabled) {
        elements.push(...module.uiElements);
      }
    }
    
    return elements;
  }

  /**
   * Получение UI элементов для пользователя
   */
  async getUIElementsForUser(user: any): Promise<UIElement[]> {
    const allElements = this.getAllUIElements();
    const userElements: UIElement[] = [];

    for (const element of allElements) {
      if (await this.canUserSeeElement(element, user)) {
        userElements.push(element);
      }
    }

    return userElements.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Проверка, может ли пользователь видеть элемент
   */
  private async canUserSeeElement(element: UIElement, user: any): Promise<boolean> {
    // Проверяем права доступа
    if (element.requiredPermissions.length > 0) {
      const userPermissions = user.permissions || [];
      const hasPermission = element.requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
      if (!hasPermission) return false;
    }

    // Проверяем роли
    if (element.requiredRoles.length > 0) {
      const userRoles = user.roles || [];
      const hasRole = element.requiredRoles.some(role => 
        userRoles.includes(role)
      );
      if (!hasRole) return false;
    }

    // Проверяем условия
    if (element.conditions) {
      if (!await this.checkUIConditions(element.conditions, user)) {
        return false;
      }
    }

    return element.isActive;
  }

  /**
   * Проверка условий UI элемента
   */
  private async checkUIConditions(conditions: any, user: any): Promise<boolean> {
    // Проверяем включенность функции
    if (conditions.featureEnabled) {
      const module = this.modules.get(conditions.featureEnabled);
      if (!module || !module.isEnabled) return false;
    }

    // Проверяем роль пользователя
    if (conditions.userHasRole) {
      const userRoles = user.roles || [];
      if (!userRoles.includes(conditions.userHasRole)) return false;
    }

    // Проверяем право пользователя
    if (conditions.userHasPermission) {
      const userPermissions = user.permissions || [];
      if (!userPermissions.includes(conditions.userHasPermission)) return false;
    }

    // Проверяем организацию
    if (conditions.userInOrganization !== undefined) {
      const hasOrganization = !!user.organizationId;
      if (hasOrganization !== conditions.userInOrganization) return false;
    }

    // Проверяем команду
    if (conditions.userInTeam !== undefined) {
      const hasTeam = !!user.teamId;
      if (hasTeam !== conditions.userInTeam) return false;
    }

    return true;
  }

  /**
   * Проверка зависимостей модуля
   */
  private async checkDependencies(module: MicroModule): Promise<boolean> {
    for (const dependency of module.dependencies) {
      const depModule = this.modules.get(dependency);
      if (!depModule || !depModule.isEnabled) {
        return false;
      }
    }
    return true;
  }

  /**
   * Загрузка модулей из конфигурации
   */
  private async loadModules(): Promise<void> {
    // Здесь можно загружать модули из БД или конфигурации
    this.logger.log('Загрузка модулей из конфигурации');
  }

  /**
   * Получение статистики модулей
   */
  getModuleStats(): {
    total: number;
    enabled: number;
    disabled: number;
    system: number;
    custom: number;
  } {
    const modules = this.getAllModules();
    
    return {
      total: modules.length,
      enabled: modules.filter(m => m.isEnabled).length,
      disabled: modules.filter(m => !m.isEnabled).length,
      system: modules.filter(m => m.isSystem).length,
      custom: modules.filter(m => !m.isSystem).length,
    };
  }
}
