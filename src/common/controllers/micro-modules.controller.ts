import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MicroModuleRegistryService } from '../services/micro-module-registry.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequireRoles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('micro-modules')
@Controller('micro-modules')
export class MicroModulesController {
  constructor(private microModuleRegistry: MicroModuleRegistryService) {
    console.log('MicroModulesController: Constructor called');
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Получить список всех микромодулей' })
  @ApiResponse({ status: 200, description: 'Список микромодулей' })
  async getAllModules() {
    console.log('MicroModulesController: getAllModules called');
    const modules = this.microModuleRegistry.getAllModules();
    console.log('Found modules:', modules.length);
    return modules;
  }

  @Get('enabled')
  @Public()
  @ApiOperation({ summary: 'Получить список включенных микромодулей' })
  @ApiResponse({ status: 200, description: 'Список включенных микромодулей' })
  async getEnabledModules() {
    return this.microModuleRegistry.getEnabledModules();
  }

  @Get('ui-elements')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить UI элементы для текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Список доступных UI элементов' })
  async getUIElements(@CurrentUser() user: any) {
    return this.microModuleRegistry.getUIElementsForUser(user);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('super_admin')
  @ApiOperation({ summary: 'Получить статистику микромодулей (только super_admin)' })
  @ApiResponse({ status: 200, description: 'Статистика микромодулей' })
  async getModuleStats() {
    return this.microModuleRegistry.getModuleStats();
  }

  @Post(':moduleName/enable')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('super_admin')
  @ApiOperation({ summary: 'Включить микромодуль (только super_admin)' })
  @ApiResponse({ status: 200, description: 'Микромодуль включен' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async enableModule(@Param('moduleName') moduleName: string) {
    // Здесь должна быть логика включения модуля
    return { message: `Модуль ${moduleName} включен` };
  }

  @Post(':moduleName/disable')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('super_admin')
  @ApiOperation({ summary: 'Отключить микромодуль (только super_admin)' })
  @ApiResponse({ status: 200, description: 'Микромодуль отключен' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async disableModule(@Param('moduleName') moduleName: string) {
    // Здесь должна быть логика отключения модуля
    return { message: `Модуль ${moduleName} отключен` };
  }

  @Get(':moduleName')
  @Public()
  @ApiOperation({ summary: 'Получить информацию о микромодуле' })
  @ApiResponse({ status: 200, description: 'Информация о микромодуле' })
  @ApiResponse({ status: 404, description: 'Микромодуль не найден' })
  async getModule(@Param('moduleName') moduleName: string) {
    const module = this.microModuleRegistry.getModule(moduleName);
    if (!module) {
      return { error: 'Микромодуль не найден' };
    }
    return module;
  }
}
