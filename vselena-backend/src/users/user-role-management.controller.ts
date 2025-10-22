import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { UserRoleManagementService } from './user-role-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

export class PromoteUserRoleDto {
  @ApiProperty({ description: 'ID пользователя для повышения роли' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Название новой роли' })
  @IsString()
  @IsNotEmpty()
  newRoleName: string;
}

export class DemoteUserRoleDto {
  @ApiProperty({ description: 'ID пользователя для понижения роли' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Название роли для удаления' })
  @IsString()
  @IsNotEmpty()
  roleName: string;
}

@ApiTags('user-role-management')
@Controller('user-role-management')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserRoleManagementController {
  constructor(
    private userRoleManagementService: UserRoleManagementService,
  ) {}

  @Post('promote')
  @ApiOperation({ summary: 'Повышение роли пользователя (только для супер-админов)' })
  @ApiResponse({ status: 200, description: 'Роль успешно повышена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Пользователь или роль не найдены' })
  async promoteUserRole(
    @Body() dto: PromoteUserRoleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.userRoleManagementService.promoteUserRole(
      dto.userId,
      dto.newRoleName,
      currentUser.userId,
    );
  }

  @Post('demote')
  @ApiOperation({ summary: 'Понижение роли пользователя (только для супер-админов)' })
  @ApiResponse({ status: 200, description: 'Роль успешно понижена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Пользователь или роль не найдены' })
  async demoteUserRole(
    @Body() dto: DemoteUserRoleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.userRoleManagementService.demoteUserRole(
      dto.userId,
      dto.roleName,
      currentUser.userId,
    );
  }

  @Post('check-promotions/:userId')
  @ApiOperation({ summary: 'Проверка и применение условий для автоматического повышения ролей' })
  @ApiResponse({ status: 200, description: 'Условия проверены и применены' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async checkAndApplyRolePromotions(@Param('userId') userId: string) {
    return this.userRoleManagementService.checkAndApplyRolePromotions(userId);
  }

  @Get('available-roles/:userId')
  @ApiOperation({ summary: 'Получение доступных ролей для повышения' })
  @ApiResponse({ status: 200, description: 'Список доступных ролей' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getAvailableRolesForPromotion(@Param('userId') userId: string) {
    return this.userRoleManagementService.getAvailableRolesForPromotion(userId);
  }

  @Get('role-history/:userId')
  @ApiOperation({ summary: 'Получение истории изменений ролей пользователя' })
  @ApiResponse({ status: 200, description: 'История ролей пользователя' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getUserRoleHistory(@Param('userId') userId: string) {
    return this.userRoleManagementService.getUserRoleHistory(userId);
  }
}
