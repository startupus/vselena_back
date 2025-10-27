import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Получение всех настроек системы' })
  @ApiResponse({ status: 200, description: 'Настройки получены' })
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get('default-user-role')
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Получение роли по умолчанию для новых пользователей' })
  @ApiResponse({ status: 200, description: 'Роль по умолчанию получена' })
  async getDefaultUserRole() {
    const role = await this.settingsService.getDefaultUserRole();
    return { defaultUserRole: role };
  }

  @Post('default-user-role')
  @RequirePermissions('settings.update')
  @ApiOperation({ summary: 'Установка роли по умолчанию для новых пользователей' })
  @ApiResponse({ status: 200, description: 'Роль по умолчанию установлена' })
  async setDefaultUserRole(
    @Body() body: { roleName: string },
    @CurrentUser() user: any
  ) {
    await this.settingsService.setDefaultUserRole(body.roleName);
    console.log(`🔧 Super admin ${user.email} установил роль по умолчанию: ${body.roleName}`);
    return { message: 'Роль по умолчанию успешно установлена', defaultUserRole: body.roleName };
  }
}