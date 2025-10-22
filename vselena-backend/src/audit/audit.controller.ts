import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('my-history')
  @ApiOperation({ summary: 'Получение истории действий текущего пользователя' })
  @ApiResponse({ status: 200, description: 'История действий пользователя' })
  @ApiQuery({ name: 'page', required: false, description: 'Номер страницы' })
  @ApiQuery({ name: 'limit', required: false, description: 'Количество записей на странице' })
  @ApiQuery({ name: 'service', required: false, description: 'Фильтр по сервису' })
  @ApiQuery({ name: 'action', required: false, description: 'Фильтр по действию' })
  async getMyHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('service') service?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.getUserAuditHistory(
      user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      service,
      action,
    );
  }

  @Get('my-service-tree')
  @ApiOperation({ summary: 'Получение дерева сервисов текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Дерево сервисов с ролями и правами' })
  async getMyServiceTree(@CurrentUser() user: any) {
    return this.auditService.getUserServiceTree(user.userId);
  }

  @Get('my-statistics')
  @ApiOperation({ summary: 'Получение статистики по сервисам текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Статистика использования сервисов' })
  async getMyStatistics(@CurrentUser() user: any) {
    return this.auditService.getServiceStatistics(user.userId);
  }

  @Get('my-role-history')
  @ApiOperation({ summary: 'Получение истории ролей текущего пользователя' })
  @ApiResponse({ status: 200, description: 'История изменения ролей и прав' })
  async getMyRoleHistory(@CurrentUser() user: any) {
    return this.auditService.getUserRoleHistory(user.userId);
  }

  @Get('user/:userId/history')
  @ApiOperation({ summary: 'Получение истории действий пользователя (только для админов)' })
  @ApiResponse({ status: 200, description: 'История действий пользователя' })
  @ApiQuery({ name: 'page', required: false, description: 'Номер страницы' })
  @ApiQuery({ name: 'limit', required: false, description: 'Количество записей на странице' })
  @ApiQuery({ name: 'service', required: false, description: 'Фильтр по сервису' })
  @ApiQuery({ name: 'action', required: false, description: 'Фильтр по действию' })
  async getUserHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('service') service?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.getUserAuditHistory(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      service,
      action,
    );
  }

  @Get('user/:userId/service-tree')
  @ApiOperation({ summary: 'Получение дерева сервисов пользователя (только для админов)' })
  @ApiResponse({ status: 200, description: 'Дерево сервисов с ролями и правами' })
  async getUserServiceTree(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.auditService.getUserServiceTree(userId);
  }

  @Get('user/:userId/statistics')
  @ApiOperation({ summary: 'Получение статистики по сервисам пользователя (только для админов)' })
  @ApiResponse({ status: 200, description: 'Статистика использования сервисов' })
  async getUserStatistics(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.auditService.getServiceStatistics(userId);
  }

  @Get('user/:userId/role-history')
  @ApiOperation({ summary: 'Получение истории ролей пользователя (только для админов)' })
  @ApiResponse({ status: 200, description: 'История изменения ролей и прав' })
  async getUserRoleHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.auditService.getUserRoleHistory(userId);
  }
}
