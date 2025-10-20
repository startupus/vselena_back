import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { Role } from './entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @RequirePermissions('roles.create')
  @ApiOperation({ summary: 'Получение ролей организации' })
  @ApiResponse({ status: 200, description: 'Список ролей' })
  async getOrganizationRoles(@CurrentUser() user: any) {
    return this.rbacService.getOrganizationRoles(user.organizationId);
  }

  @Post()
  @RequirePermissions('roles.create')
  @ApiOperation({ summary: 'Создание новой роли' })
  @ApiResponse({ status: 201, description: 'Роль создана' })
  async createRole(
    @Body() createRoleDto: {
      name: string;
      description: string;
      permissionIds: string[];
    },
    @CurrentUser() user: any,
  ) {
    return this.rbacService.createRole(
      createRoleDto.name,
      createRoleDto.description,
      user.organizationId,
      user.teamId,
      createRoleDto.permissionIds,
    );
  }

  @Patch(':id/permissions')
  @RequirePermissions('roles.update')
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
  @RequirePermissions('roles.delete')
  @ApiOperation({ summary: 'Удаление роли' })
  @ApiResponse({ status: 200, description: 'Роль удалена' })
  async deleteRole(@Param('id') id: string) {
    await this.rbacService.deleteRole(id);
    return { message: 'Role deleted successfully' };
  }
}
