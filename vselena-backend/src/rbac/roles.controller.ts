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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @ApiOperation({ summary: 'Получение всех доступных ролей' })
  @ApiResponse({ status: 200, description: 'Список ролей' })
  async getAllRoles() {
    return this.rbacService.getAllRoles();
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
    },
    @CurrentUser() user: any,
  ) {
    const organizationId = user.organizations?.[0]?.id;
    const teamId = user.teams?.[0]?.id;
    return this.rbacService.createRole(
      createRoleDto.name,
      createRoleDto.description,
      organizationId,
      teamId,
      createRoleDto.permissionIds,
    );
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
}
