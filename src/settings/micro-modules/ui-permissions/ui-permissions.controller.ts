import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UIPermissionsService } from './ui-permissions.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RequireRoles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';

@ApiTags('ui-permissions')
@Controller('ui-permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UIPermissionsController {
  constructor(private uiPermissionsService: UIPermissionsService) {}

  @Get('elements')
  @ApiOperation({ summary: 'Получить UI элементы для текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Список доступных UI элементов' })
  async getUIElements(@CurrentUser() user: any) {
    return this.uiPermissionsService.getUIElementsForUser(user.userId);
  }

  @Get('navigation/:menuId')
  @ApiOperation({ summary: 'Получить навигационное меню для пользователя' })
  @ApiResponse({ status: 200, description: 'Навигационное меню' })
  async getNavigationMenu(
    @Param('menuId') menuId: string,
    @CurrentUser() user: any,
  ) {
    return this.uiPermissionsService.getNavigationMenuForUser(user.userId, menuId);
  }

  @Post('elements')
  @RequireRoles('super_admin')
  @ApiOperation({ summary: 'Создать UI элемент (только super_admin)' })
  @ApiResponse({ status: 201, description: 'UI элемент создан' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async createUIElement(
    @Body() elementData: any,
    @CurrentUser() user: any,
  ) {
    return this.uiPermissionsService.createUIElement(elementData, user.userId);
  }

  @Put('elements/:elementId')
  @RequireRoles('super_admin')
  @ApiOperation({ summary: 'Обновить UI элемент (только super_admin)' })
  @ApiResponse({ status: 200, description: 'UI элемент обновлен' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async updateUIElement(
    @Param('elementId') elementId: string,
    @Body() updateData: any,
    @CurrentUser() user: any,
  ) {
    return this.uiPermissionsService.updateUIElement(elementId, updateData, user.userId);
  }

  @Delete('elements/:elementId')
  @RequireRoles('super_admin')
  @ApiOperation({ summary: 'Удалить UI элемент (только super_admin)' })
  @ApiResponse({ status: 200, description: 'UI элемент удален' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async deleteUIElement(
    @Param('elementId') elementId: string,
    @CurrentUser() user: any,
  ) {
    await this.uiPermissionsService.deleteUIElement(elementId, user.userId);
    return { message: 'UI элемент удален' };
  }
}
