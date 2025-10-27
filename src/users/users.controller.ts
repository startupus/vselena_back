import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('check-email')
  @Public()
  @ApiOperation({ summary: 'Проверка существования email' })
  @ApiResponse({ status: 200, description: 'Email существует' })
  @ApiResponse({ status: 404, description: 'Email не найден' })
  async checkEmail(@Body() checkEmailDto: { email: string }) {
    const user = await this.usersService.findByEmail(checkEmailDto.email);
    if (user) {
      return { exists: true };
    }
    throw new NotFoundException('Email не найден');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание нового пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь создан' })
  async create(@Body() createUserDto: Partial<User>) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение списка пользователей в контексте текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Список пользователей' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @CurrentUser() currentUser: any
  ) {
    console.log('🔍🔍🔍 GET /api/users called for user:', currentUser.userId);
    // Возвращаем только пользователей в контексте текущего пользователя
    const users = await this.usersService.getUsersInContext(currentUser.userId);
    
    // Применяем пагинацию
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = users.slice(start, end);
    
    return {
      users: paginatedUsers,
      total: users.length
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Данные текущего пользователя' })
  async getMe(@CurrentUser() user: any) {
    return this.usersService.findById(user.userId);
  }

  @Get('in-context')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение пользователей из контекста текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Список пользователей из доступных организаций/команд' })
  async getUsersInContext(@CurrentUser() user: any) {
    console.log('🔍🔍🔍 GET /api/users/in-context called for user:', user.userId);
    return this.usersService.getUsersInContext(user.userId);
  }

  @Get('team-members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение сотрудников команд пользователя' })
  @ApiResponse({ status: 200, description: 'Список сотрудников команд' })
  async getTeamMembers(@CurrentUser() user: any) {
    return this.usersService.getTeamMembers(user.userId);
  }

  @Get(':id/teams')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение команд пользователя' })
  @ApiResponse({ status: 200, description: 'Список команд пользователя' })
  async getUserTeams(@Param('id') id: string) {
    return this.usersService.getUserTeams(id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновление текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь обновлен' })
  async updateMe(@CurrentUser() user: any, @Body() updateUserDto: Partial<User>) {
    return this.usersService.update(user.userId, updateUserDto);
  }

  @Patch(':id/team')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Изменение команды пользователя' })
  @ApiResponse({ status: 200, description: 'Команда пользователя обновлена' })
  async updateUserTeam(
    @Param('id') userId: string,
    @Body() updateTeamDto: { teamId: string },
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.updateUserTeam(userId, updateTeamDto.teamId, currentUser.userId);
  }

  @Patch(':id/organization')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Изменение организации пользователя' })
  @ApiResponse({ status: 200, description: 'Организация пользователя обновлена' })
  async updateUserOrganization(
    @Param('id') userId: string,
    @Body() updateOrgDto: { organizationId: string },
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.updateUserOrganization(userId, updateOrgDto.organizationId, currentUser.userId);
  }

  @Patch(':id/transfer-team')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Перенос пользователя между командами' })
  @ApiResponse({ status: 200, description: 'Пользователь перенесен между командами' })
  async transferUserBetweenTeams(
    @Param('id') userId: string,
    @Body() transferDto: { fromTeamId: string | null, toTeamId: string | null, roleId: string },
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.transferUserBetweenTeams(
      userId, 
      transferDto.fromTeamId, 
      transferDto.toTeamId, 
      currentUser.userId,
      transferDto.roleId
    );
  }

  @Patch(':id/change-role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Изменение роли пользователя' })
  @ApiResponse({ status: 200, description: 'Роль пользователя изменена' })
  async changeUserRole(
    @Param('id') userId: string,
    @Body() changeRoleDto: { roleId: string, organizationId?: string, teamId?: string },
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.changeUserRole(
      userId,
      changeRoleDto.roleId,
      currentUser.userId,
      changeRoleDto.organizationId,
      changeRoleDto.teamId
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение пользователя по ID' })
  @ApiResponse({ status: 200, description: 'Данные пользователя' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/can-manage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Проверить, может ли текущий пользователь управлять указанным пользователем' })
  @ApiResponse({ status: 200, description: 'Результат проверки прав' })
  async canManageUser(
    @Param('id') targetUserId: string,
    @CurrentUser() currentUser: any,
    @Query('organizationId') organizationId?: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.usersService.canManageUser(
      currentUser.userId,
      targetUserId,
      { organizationId, teamId },
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновление пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь обновлен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async update(@Param('id') id: string, @Body() updateUserDto: Partial<User>) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id/from-context')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление пользователя из доступных команд/организаций' })
  @ApiResponse({ status: 200, description: 'Пользователь удален из контекста' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async removeFromContext(
    @Param('id') id: string,
    @CurrentUser() currentUser: any
  ) {
    console.log(`🎯 CONTROLLER: removeFromContext called with id=${id}, currentUser=${JSON.stringify(currentUser)}`);
    await this.usersService.removeUserFromContext(
      id,
      currentUser.userId
    );
    return { message: 'User removed from context successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь удален' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async remove(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }

}
