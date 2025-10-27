import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuthMicroModule, RolePromotionMicroModule } from '../base/auth-micro-module.interface';

@Injectable()
export class MicroModuleManagerService implements OnModuleInit {
  private modules: Map<string, AuthMicroModule> = new Map();
  private rolePromotionModules: Map<string, RolePromotionMicroModule> = new Map();

  async onModuleInit() {
    console.log('🔧 MicroModuleManager инициализирован');
  }

  /**
   * Регистрация микромодуля
   */
  registerModule(module: AuthMicroModule): void {
    const moduleName = module.getModuleName();
    this.modules.set(moduleName, module);
    
    if (this.isRolePromotionModule(module)) {
      this.rolePromotionModules.set(moduleName, module);
    }
    
    console.log(`✅ Микромодуль ${moduleName} зарегистрирован`);
  }

  /**
   * Отключение микромодуля
   */
  unregisterModule(moduleName: string): boolean {
    const module = this.modules.get(moduleName);
    if (module) {
      this.modules.delete(moduleName);
      this.rolePromotionModules.delete(moduleName);
      console.log(`❌ Микромодуль ${moduleName} отключен`);
      return true;
    }
    return false;
  }

  /**
   * Получение микромодуля по имени
   */
  getModule(moduleName: string): AuthMicroModule | undefined {
    return this.modules.get(moduleName);
  }

  /**
   * Получение всех микромодулей
   */
  getAllModules(): AuthMicroModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Получение всех микромодулей повышения ролей
   */
  getRolePromotionModules(): RolePromotionMicroModule[] {
    return Array.from(this.rolePromotionModules.values());
  }

  /**
   * Получение микромодулей по типу
   */
  getModulesByType(type: string): AuthMicroModule[] {
    return this.getAllModules().filter(module => 
      this.isRolePromotionModule(module) ? 
        (module as RolePromotionMicroModule).type === type : 
        false
    );
  }

  /**
   * Получение активных микромодулей
   */
  getActiveModules(): AuthMicroModule[] {
    return this.getAllModules().filter(module => 
      this.isRolePromotionModule(module) ? 
        (module as RolePromotionMicroModule).config.enabled : 
        true
    );
  }

  /**
   * Проверка, является ли модуль модулем повышения ролей
   */
  private isRolePromotionModule(module: AuthMicroModule): module is RolePromotionMicroModule {
    return 'type' in module && module.type === 'role-promotion';
  }

  /**
   * Получение статистики микромодулей
   */
  getModulesStats() {
    const total = this.modules.size;
    const active = this.getActiveModules().length;
    const rolePromotion = this.rolePromotionModules.size;
    
    return {
      total,
      active,
      inactive: total - active,
      rolePromotion,
      byType: {
        'role-promotion': rolePromotion,
        'two-factor': this.getModulesByType('two-factor').length,
        'social-auth': this.getModulesByType('social-auth').length,
      }
    };
  }
}
