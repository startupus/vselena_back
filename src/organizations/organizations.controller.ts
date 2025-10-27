import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import type { CreateOrganizationDto, UpdateOrganizationDto } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать организацию' })
  @ApiResponse({ status: 201, description: 'Организация создана' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.createOrganization(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить организации пользователя' })
  @ApiResponse({ status: 200, description: 'Список организаций' })
  async getUserOrganizations(@CurrentUser() user: any) {
    return this.organizationsService.getUserOrganizations(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить организацию по ID' })
  @ApiResponse({ status: 200, description: 'Организация найдена' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  async getOrganization(@Param('id') id: string) {
    return this.organizationsService.getOrganizationById(id);
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'Получить роли организации (из таблицы organization_roles)' })
  @ApiResponse({ status: 200, description: 'Список ролей организации' })
  async getOrganizationRoles(
    @Param('id') organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.getGlobalRolesFromRolesTable(user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить организацию' })
  @ApiResponse({ status: 200, description: 'Организация обновлена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.updateOrganization(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить организацию' })
  @ApiResponse({ status: 200, description: 'Организация удалена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  async deleteOrganization(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.organizationsService.deleteOrganization(id, user.userId);
    return { message: 'Организация удалена' };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Получить участников организации' })
  @ApiResponse({ status: 200, description: 'Список участников' })
  async getOrganizationMembers(@Param('id') id: string) {
    return this.organizationsService.getOrganizationMembers(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Добавить участника в организацию' })
  @ApiResponse({ status: 201, description: 'Участник добавлен' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async addMemberToOrganization(
    @Param('id') organizationId: string,
    @Body() body: { userId: string; roleName: string },
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.addMemberToOrganization(
      organizationId,
      body.userId,
      body.roleName,
      user.userId,
    );
  }

  @Put(':id/members/:userId/role')
  @ApiOperation({ summary: 'Изменить роль участника организации' })
  @ApiResponse({ status: 200, description: 'Роль изменена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async changeMemberRole(
    @Param('id') organizationId: string,
    @Param('userId') userId: string,
    @Body() body: { roleName: string },
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.changeMemberRole(
      organizationId,
      userId,
      body.roleName,
      user.userId,
    );
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Удалить участника из организации' })
  @ApiResponse({ status: 200, description: 'Участник удален' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async removeMemberFromOrganization(
    @Param('id') organizationId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    await this.organizationsService.removeMemberFromOrganization(
      organizationId,
      userId,
      user.userId,
    );
    return { message: 'Участник удален из организации' };
  }
}