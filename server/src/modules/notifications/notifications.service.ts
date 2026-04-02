import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createSpecialNotification(userId: number, message: string, type: NotificationType) {
    const notification = this.notificationsRepository.create({
      userId,
      message,
      type,
    });
    const saved = await this.notificationsRepository.save(notification);

    // Emit live via Gateway
    this.notificationsGateway.sendNotificationToUser(userId.toString(), saved);

    return saved;
  }

  async getUserNotifications(userId: number) {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50, // Get last 50 notifications
    });
  }

  async markAsRead(userId: number, notificationId: number) {
    await this.notificationsRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: number) {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: number) {
    return this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
  }
}
