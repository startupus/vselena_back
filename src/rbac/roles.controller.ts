import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { RoleHierarchyService } from './role-hierarchy.service';
import { Role } from './entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(
    private readonly rbacService: RbacService,
    private readonly roleHierarchyService: RoleHierarchyService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получение всех доступных ролей' })
  @ApiResponse({ status: 200, description: 'Список ролей' })
  async getAllRoles() {
    return this.rbacService.getAllRoles();
  }

  @Get('for-settings')
  @ApiOperation({ summary: 'Получение ролей для настроек (только глобальные, без permissions)' })
  @ApiResponse({ status: 200, description: 'Список глобальных ролей' })
  async getRolesForSettings() {
    return this.rbacService.getRolesForSettings();
  }

  @Get('assignable')
  @ApiOperation({ summary: 'Получение ролей доступных для назначения (только super_admin, admin, viewer)' })
  @ApiResponse({ status: 200, description: 'Список ролей для назначения' })
  async getAssignableRoles() {
    return this.rbacService.getAssignableRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получение роли по ID' })
  @ApiResponse({ status: 200, description: 'Роль найдена' })
  @ApiResponse({ status: 404, description: 'Роль не найдена' })
  async getRole(@Param('id') id: string) {
    return this.rbacService.getRoleById(id);
  }

  @Get('organization')
  @ApiOperation({ summary: 'Получение ролей организации' })
  @ApiResponse({ status: 200, description: 'Список ролей' })
  async getOrganizationRoles(@CurrentUser() user: any) {
    const organizationId = user.organizations?.[0]?.id;
    if (!organizationId) {
      throw new Error('User has no organization');
    }
    return this.rbacService.getOrganizationRoles(organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Создание новой роли' })
  @ApiResponse({ status: 201, description: 'Роль создана' })
  async createRole(
    @Body() createRoleDto: {
      name: string;
      description: string;
      permissionIds: string[];
      organizationId?: string;
      teamId?: string;
      isSystem?: boolean;
      permissions?: string[];
    },
    @CurrentUser() user: any,
  ) {
    // Используем переданные параметры или значения по умолчанию из пользователя
    const organizationId = createRoleDto.organizationId || user.organizations?.[0]?.id;
    const teamId = createRoleDto.teamId || user.teams?.[0]?.id;
    
    return this.rbacService.createRole(
      createRoleDto.name,
      createRoleDto.description,
      organizationId,
      teamId,
      createRoleDto.permissionIds,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновление роли' })
  @ApiResponse({ status: 200, description: 'Роль обновлена' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: {
      name?: string;
      description?: string;
    },
  ) {
    return this.rbacService.updateRole(id, updateRoleDto);
  }

  @Patch(':id/permissions')
  @ApiOperation({ summary: 'Обновление прав роли' })
  @ApiResponse({ status: 200, description: 'Права роли обновлены' })
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() updatePermissionsDto: { permissionIds: string[] },
  ) {
    await this.rbacService.updateRolePermissions(id, updatePermissionsDto.permissionIds);
    return { message: 'Role permissions updated successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удаление роли' })
  @ApiResponse({ status: 200, description: 'Роль удалена' })
  async deleteRole(@Param('id') id: string) {
    await this.rbacService.deleteRole(id);
    return { message: 'Role deleted successfully' };
  }

  // @Get('hierarchy')
  // @RequireRoles('super_admin', 'admin')
  // @ApiOperation({ summary: 'Получить иерархию ролей' })
  // @ApiResponse({ status: 200, description: 'Иерархия ролей' })
  // async getRoleHierarchy() {
  //   return this.roleHierarchyService.getRoleHierarchy();
  // }

  // @Get('assignable')
  // @ApiOperation({ summary: 'Получить роли, которые может назначать пользователь' })
  // @ApiResponse({ status: 200, description: 'Список назначаемых ролей' })
  // async getAssignableRoles(@CurrentUser() user: any) {
  //   return this.roleHierarchyService.getAssignableRoles(user.userId);
  // }

  // @Post('assign')
  // @RequireRoles('super_admin', 'admin', 'manager')
  // @ApiOperation({ summary: 'Назначить роль пользователю' })
  // @ApiResponse({ status: 201, description: 'Роль назначена' })
  // @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  // async assignRole(
  //   @Body() assignRoleDto: {
  //     targetUserId: string;
  //     roleName: string;
  //     expiresAt?: string;
  //   },
  //   @CurrentUser() user: any,
  // ) {
  //   const expiresAt = assignRoleDto.expiresAt ? new Date(assignRoleDto.expiresAt) : undefined;
  //   await this.roleHierarchyService.assignRoleToUser(
  //     user.userId,
  //     assignRoleDto.targetUserId,
  //     assignRoleDto.roleName,
  //     expiresAt,
  //   );
  //   return { message: 'Role assigned successfully' };
  // }

  // @Delete('assign')
  // @RequireRoles('super_admin', 'admin', 'manager')
  // @ApiOperation({ summary: 'Удалить роль у пользователя' })
  // @ApiResponse({ status: 200, description: 'Роль удалена' })
  // @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  // async removeRole(
  //   @Body() removeRoleDto: {
  //     targetUserId: string;
  //     roleName: string;
  //   },
  //   @CurrentUser() user: any,
  // ) {
  //   await this.roleHierarchyService.removeRoleFromUser(
  //     user.userId,
  //     removeRoleDto.targetUserId,
  //     removeRoleDto.roleName,
  //   );
  //   return { message: 'Role removed successfully' };
  // }

  @Get('global')
  @ApiOperation({ summary: 'Получить глобальные роли' })
  @ApiResponse({ status: 200, description: 'Список глобальных ролей' })
  async getGlobalRoles() {
    return this.rbacService.getGlobalRoles();
  }

  @Get('team')
  @ApiOperation({ summary: 'Получить роли команд' })
  @ApiResponse({ status: 200, description: 'Список ролей команд' })
  async getTeamRoles() {
    return this.rbacService.getTeamRoles();
  }

  @Get('hierarchy/test')
  @ApiOperation({ summary: 'Тестирование иерархической системы ролей' })
  @ApiResponse({ status: 200, description: 'Информация о ролях пользователя' })
  async testRoleHierarchy(@CurrentUser() user: any) {
    const allRoles = await this.roleHierarchyService.getAllUserRoles(user.userId);
    
    return {
      userId: user.userId,
      email: user.email,
      roles: allRoles,
      message: 'Иерархическая система ролей работает!'
    };
  }
}
