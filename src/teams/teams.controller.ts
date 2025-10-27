import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import type { CreateTeamDto, UpdateTeamDto } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('teams')
@Controller('teams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать команду' })
  @ApiResponse({ status: 201, description: 'Команда создана' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async createTeam(
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.createTeam(dto, user.userId);
  }

  @Get('accessible')
  @ApiOperation({ summary: 'Получить все доступные команды пользователя' })
  @ApiResponse({ status: 200, description: 'Список всех доступных команд' })
  async getAccessibleTeams(@CurrentUser() user: any) {
    return this.teamsService.getAccessibleTeams(user.userId);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Получить команды организации' })
  @ApiResponse({ status: 200, description: 'Список команд организации' })
  async getOrganizationTeams(@Param('organizationId') organizationId: string) {
    return this.teamsService.getOrganizationTeams(organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить команды пользователя' })
  @ApiResponse({ status: 200, description: 'Список команд' })
  async getUserTeams(@CurrentUser() user: any) {
    return this.teamsService.getUserTeams(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить команду по ID' })
  @ApiResponse({ status: 200, description: 'Команда найдена' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  async getTeam(@Param('id') id: string) {
    return this.teamsService.getTeamById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить команду' })
  @ApiResponse({ status: 200, description: 'Команда обновлена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  async updateTeam(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.updateTeam(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить команду' })
  @ApiResponse({ status: 200, description: 'Команда удалена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  async deleteTeam(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.deleteTeam(id, user.userId);
    return { message: 'Команда удалена' };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Получить участников команды' })
  @ApiResponse({ status: 200, description: 'Список участников' })
  async getTeamMembers(@Param('id') id: string) {
    return this.teamsService.getTeamMembers(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Добавить участника в команду' })
  @ApiResponse({ status: 201, description: 'Участник добавлен' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async addMemberToTeam(
    @Param('id') teamId: string,
    @Body() body: { userId: string; roleName: string },
    @CurrentUser() user: any,
  ) {
    return this.teamsService.addMemberToTeam(
      teamId,
      body.userId,
      body.roleName,
      user.userId,
    );
  }

  @Put(':id/members/:userId/role')
  @ApiOperation({ summary: 'Изменить роль участника команды' })
  @ApiResponse({ status: 200, description: 'Роль изменена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async changeMemberRole(
    @Param('id') teamId: string,
    @Param('userId') userId: string,
    @Body() body: { roleName: string },
    @CurrentUser() user: any,
  ) {
    return this.teamsService.changeMemberRole(
      teamId,
      userId,
      body.roleName,
      user.userId,
    );
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Удалить участника из команды' })
  @ApiResponse({ status: 200, description: 'Участник удален' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async removeMemberFromTeam(
    @Param('id') teamId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.removeMemberFromTeam(
      teamId,
      userId,
      user.userId,
    );
    return { message: 'Участник удален из команды' };
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'Получить роли команды (из таблицы team_roles)' })
  @ApiResponse({ status: 200, description: 'Список ролей команды' })
  async getTeamRoles(
    @Param('id') teamId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.getTeamRolesFromRolesTable(teamId, user.userId);
  }
}