// notifications.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';
import { InvestmentEntity } from '../investments/entities/investment.entity';

@Injectable()
export class NotificationsListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(InvestmentEntity)
    private readonly investmentRepository: Repository<InvestmentEntity>,
  ) {}

  @OnEvent('investment.made', { async: true })
  async handleInvestmentMade(event: { ownerId: number, amount: number, title: string }) {
    await this.notificationsService.createSpecialNotification(
      event.ownerId,
      `Có người vừa đầu tư ${event.amount.toLocaleString('vi-VN')} ₫ vào dự án ${event.title} của bạn.`,
      NotificationType.INVESTMENT_RECEIVED,
    );
  }

  @OnEvent('project.goalReached', { async: true })
  async handleProjectGoalReached(event: { projectId: number, title: string, ownerId: number }) {
    // 1. Tìm tất cả nhà đầu tư của dự án này (Dùng DISTINCT để không bị lặp người)
    const investors = await this.investmentRepository
      .createQueryBuilder('inv')
      .select('DISTINCT inv.userId', 'userId')
      .where('inv.projectId = :projectId', { projectId: event.projectId })
      .getRawMany();

    // 2. Gom dữ liệu
    const data = investors.map(inv => ({
      userId: Number(inv.userId),
      message: `Dự án bạn đầu tư [${event.title}] đã đạt 100% mục tiêu!`,
      type: NotificationType.PROJECT_UPDATE,
    }));

    // Thêm thông báo cho chủ dự án
    data.push({
      userId: event.ownerId,
      message: `Chúc mừng! Dự án ${event.title} của bạn đã gọi vốn thành công!`,
      type: NotificationType.PROJECT_UPDATE,
    });

    // 3. Batch Insert qua Service
    await this.notificationsService.createBatchNotifications(data);
  }

  @OnEvent('project.interestPaid', { async: true })
  async handleProjectInterestPaid(event: { investorId: number, amount: number, title: string }) {
    await this.notificationsService.createSpecialNotification(
      event.investorId,
      `Tiền lãi ${event.amount.toLocaleString('vi-VN')} ₫ từ dự án ${event.title} đã về ví.`,
      NotificationType.PAYMENT_SUCCESS,
    );
  }

  @OnEvent('project.refunded', { async: true })
  async handleProjectRefunded(event: { investorId: number, amount: number, title: string }) {
    await this.notificationsService.createSpecialNotification(
      event.investorId,
      `Dự án ${event.title} không đạt mục tiêu và đã bị hủy. ${event.amount.toLocaleString('vi-VN')} ₫ đã được hoàn vào ví của bạn.`,
      NotificationType.PROJECT_UPDATE,
    );
  }

  @OnEvent('project.approved', { async: true })
  async handleProjectApproved(event: { ownerId: number, title: string }) {
    await this.notificationsService.createSpecialNotification(
      event.ownerId,
      `Dự án của bạn (${event.title}) đã được duyệt! Dự án đã được mở để huy động vốn.`,
      NotificationType.PROJECT_UPDATE,
    );
  }

  @OnEvent('project.rejected', { async: true })
  async handleProjectRejected(event: { ownerId: number, title: string }) {
    await this.notificationsService.createSpecialNotification(
      event.ownerId,
      `Dự án của bạn (${event.title}) đã bị từ chối. Vui lòng kiểm tra lại thông tin và gửi lại nếu cần.`,
      NotificationType.PROJECT_UPDATE,
    );
  }
}