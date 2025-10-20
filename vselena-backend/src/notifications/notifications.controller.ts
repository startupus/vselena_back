import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить уведомления пользователя' })
  @ApiResponse({ status: 200, description: 'Список уведомлений' })
  async getNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getUserNotifications(user.userId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Получить непрочитанные уведомления' })
  @ApiResponse({ status: 200, description: 'Список непрочитанных уведомлений' })
  async getUnreadNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadNotifications(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить уведомление по ID' })
  @ApiResponse({ status: 200, description: 'Уведомление' })
  @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
  async getNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.getNotificationById(notificationId, user.userId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Отметить уведомление как прочитанное' })
  @ApiResponse({ status: 200, description: 'Уведомление отмечено как прочитанное' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.markAsRead(notificationId, user.userId);
    return { success: true };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Отметить все уведомления как прочитанные' })
  @ApiResponse({ status: 200, description: 'Все уведомления отмечены как прочитанные' })
  async markAllAsRead(@CurrentUser() user: any) {
    await this.notificationsService.markAllAsRead(user.userId);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить уведомление' })
  @ApiResponse({ status: 200, description: 'Уведомление удалено' })
  async deleteNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.deleteNotification(notificationId, user.userId);
    return { success: true };
  }
}
