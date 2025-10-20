import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { MicroModuleManagerService } from './micro-module-manager.service';

@ApiTags('Micro Module Manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('micro-modules')
export class MicroModuleManagerController {
  constructor(
    private readonly microModuleManagerService: MicroModuleManagerService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику микромодулей' })
  @ApiResponse({ status: 200, description: 'Статистика получена' })
  getStats() {
    return this.microModuleManagerService.getModulesStats();
  }

  @Get('list')
  @ApiOperation({ summary: 'Получить список всех микромодулей' })
  @ApiResponse({ status: 200, description: 'Список микромодулей получен' })
  getAllModules() {
    const modules = this.microModuleManagerService.getAllModules();
    return {
      modules: modules.map(module => ({
        name: module.getModuleName(),
        type: 'type' in module ? (module as any).type : 'unknown',
        config: 'config' in module ? (module as any).config : null,
      }))
    };
  }

  @Get('role-promotion')
  @ApiOperation({ summary: 'Получить микромодули повышения ролей' })
  @ApiResponse({ status: 200, description: 'Микромодули повышения ролей получены' })
  getRolePromotionModules() {
    const modules = this.microModuleManagerService.getRolePromotionModules();
    return {
      modules: modules.map(module => ({
        name: module.getModuleName(),
        config: module.config,
        conditions: module.conditions,
      }))
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Получить активные микромодули' })
  @ApiResponse({ status: 200, description: 'Активные микромодули получены' })
  getActiveModules() {
    const modules = this.microModuleManagerService.getActiveModules();
    return {
      modules: modules.map(module => ({
        name: module.getModuleName(),
        type: 'type' in module ? (module as any).type : 'unknown',
        config: 'config' in module ? (module as any).config : null,
      }))
    };
  }

  @Get(':moduleName')
  @ApiOperation({ summary: 'Получить информацию о конкретном микромодуле' })
  @ApiResponse({ status: 200, description: 'Информация о микромодуле получена' })
  @ApiResponse({ status: 404, description: 'Микромодуль не найден' })
  getModule(@Param('moduleName') moduleName: string) {
    const module = this.microModuleManagerService.getModule(moduleName);
    if (!module) {
      return { error: 'Микромодуль не найден' };
    }
    
    return {
      name: module.getModuleName(),
      type: 'type' in module ? (module as any).type : 'unknown',
      config: 'config' in module ? (module as any).config : null,
      services: module.getServices().map(service => service.name),
      controllers: module.getControllers().map(controller => controller.name),
    };
  }

  @Delete(':moduleName')
  @ApiOperation({ summary: 'Отключить микромодуль' })
  @ApiResponse({ status: 200, description: 'Микромодуль отключен' })
  @ApiResponse({ status: 404, description: 'Микромодуль не найден' })
  unregisterModule(@Param('moduleName') moduleName: string) {
    const success = this.microModuleManagerService.unregisterModule(moduleName);
    return {
      success,
      message: success ? 'Микромодуль отключен' : 'Микромодуль не найден'
    };
  }
}
