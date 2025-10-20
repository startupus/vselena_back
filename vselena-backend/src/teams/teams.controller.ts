import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { Team } from './entities/team.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('teams')
@Controller('teams')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @RequirePermissions('teams.create')
  @ApiOperation({ summary: 'Создание новой команды' })
  @ApiResponse({ status: 201, description: 'Команда создана' })
  async create(
    @Body() createTeamDto: Partial<Team>,
    @CurrentUser() user: any,
  ) {
    // Устанавливаем organizationId только если он не передан в DTO
    if (!createTeamDto.organizationId) {
      createTeamDto.organizationId = user.organizationId;
    }
    return this.teamsService.create(createTeamDto, user.userId);
  }

  @Get()
  @RequirePermissions('teams.read')
  @ApiOperation({ summary: 'Получение списка команд' })
  @ApiResponse({ status: 200, description: 'Список команд' })
  async findAll(
    @Query('organizationId') organizationId?: string,
    @CurrentUser() user?: any,
  ) {
    const orgId = organizationId || user?.organizationId;
    // Все пользователи видят только свои команды
    return this.teamsService.findAll(orgId, user?.userId);
  }

  @Get(':id')
  @RequirePermissions('teams.read')
  @ApiOperation({ summary: 'Получение команды по ID' })
  @ApiResponse({ status: 200, description: 'Данные команды' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  async findOne(@Param('id') id: string) {
    return this.teamsService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions('teams.update')
  @ApiOperation({ summary: 'Обновление команды' })
  @ApiResponse({ status: 200, description: 'Команда обновлена' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  async update(@Param('id') id: string, @Body() updateTeamDto: Partial<Team>) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Get(':id/members')
  @RequirePermissions('teams.read')
  @ApiOperation({ summary: 'Получение участников команды' })
  @ApiResponse({ status: 200, description: 'Список участников команды' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  async getTeamMembers(@Param('id') id: string) {
    return this.teamsService.getTeamMembers(id);
  }

  @Delete(':id')
  @RequirePermissions('teams.delete')
  @ApiOperation({ summary: 'Удаление команды' })
  @ApiResponse({ status: 200, description: 'Команда удалена' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  async remove(@Param('id') id: string) {
    await this.teamsService.delete(id);
    return { message: 'Team deleted successfully' };
  }
}
