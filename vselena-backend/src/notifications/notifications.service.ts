import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepo: Repository<Notification>,
  ) {}

  /**
   * Создать уведомление для пользователя
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> = {},
  ): Promise<Notification> {
    const notification = this.notificationsRepo.create({
      userId,
      type,
      title,
      message,
      data,
    });

    return this.notificationsRepo.save(notification);
  }

  /**
   * Получить уведомления пользователя
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Получить непрочитанные уведомления
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return this.notificationsRepo.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Получить уведомление по ID
   */
  async getNotificationById(notificationId: string, userId: string): Promise<Notification | null> {
    return this.notificationsRepo.findOne({
      where: { id: notificationId, userId },
    });
  }

  /**
   * Отметить уведомление как прочитанное
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationsRepo.update(
      { id: notificationId, userId },
      { isRead: true },
    );
  }

  /**
   * Отметить все уведомления как прочитанные
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  /**
   * Удалить уведомление
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationsRepo.delete({ id: notificationId, userId });
  }

  /**
   * Создать уведомление о приглашении
   */
  async createInvitationNotification(
    userId: string,
    invitationData: {
      invitationId: string;
      inviterName: string;
      teamName?: string;
      organizationName?: string;
      type: 'team' | 'organization';
    },
  ): Promise<Notification> {
    const { invitationId, inviterName, teamName, organizationName, type } = invitationData;
    
    const title = `Приглашение в ${type === 'team' ? 'команду' : 'организацию'}`;
    const message = `${inviterName} пригласил вас в ${type === 'team' ? `команду "${teamName}"` : `организацию "${organizationName}"`}`;
    
    return this.createNotification(
      userId,
      NotificationType.INVITATION,
      title,
      message,
      {
        invitationId,
        inviterName,
        teamName,
        organizationName,
        type,
      },
    );
  }
}
