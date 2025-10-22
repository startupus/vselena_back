import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Создание новой организации' })
  @ApiResponse({ status: 201, description: 'Организация создана' })
  async create(@Body() createOrganizationDto: Partial<Organization>, @CurrentUser() user: any) {
    return this.organizationsService.create(createOrganizationDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получение списка организаций' })
  @ApiResponse({ status: 200, description: 'Список организаций' })
  async findAll(@CurrentUser() user: any) {
    // Все пользователи видят только свои организации
    return this.organizationsService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получение организации по ID' })
  @ApiResponse({ status: 200, description: 'Данные организации' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновление организации' })
  @ApiResponse({ status: 200, description: 'Организация обновлена' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  async update(@Param('id') id: string, @Body() updateOrganizationDto: Partial<Organization>) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Получение участников организации' })
  @ApiResponse({ status: 200, description: 'Список участников организации' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  async getOrganizationMembers(@Param('id') id: string) {
    return this.organizationsService.getOrganizationMembers(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удаление организации' })
  @ApiResponse({ status: 200, description: 'Организация удалена' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  async remove(@Param('id') id: string) {
    await this.organizationsService.delete(id);
    return { message: 'Organization deleted successfully' };
  }
}
