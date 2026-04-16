import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import {
  InvestmentEntity,
  InvestmentStatus,
} from '../investments/entities/investment.entity';
import { ProjectEntity, ProjectStatus } from '../projects/entities/project.entity';
import { UserEntity, UserRole } from '../users/entities/user.entity';

type DashboardProjectParticipation = {
  id: number;
  title: string;
  fundingProgress: number;
  status: ProjectStatus;
};

type DashboardUser = {
  id: number;
  fullName: string;
  email: string;
  balance: number | string;
  totalInvested: number;
  totalReceived: number;
  feeCollected: number;
  role: string;
  createdAt: Date;
  participatingProjects: DashboardProjectParticipation[];
};

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
    @InjectRepository(InvestmentEntity)
    private readonly investmentsRepository: Repository<InvestmentEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
  ) {}

  async getOverview(): Promise<{
    pendingCount: number;
    fundingCount: number;
    completedCount: number;
    totalFundingCapital: number;
    totalUsers: number;
    totalProjects: number;
    totalTransactions: number;
    systemRevenue: number;
    commissionRate: number;
  }> {
    const [pendingCount, fundingCount, completedCount, totalProjects, totalUsers] =
      await Promise.all([
        this.projectsRepository.count({
          where: { status: ProjectStatus.PENDING },
        }),
        this.projectsRepository.count({
          where: { status: ProjectStatus.FUNDING },
        }),
        this.projectsRepository.count({
          where: { status: ProjectStatus.COMPLETED },
        }),
        this.projectsRepository.count(),
        this.usersRepository.count(),
      ]);

    const totalFundingCapitalRaw = await this.projectsRepository
      .createQueryBuilder('project')
      .select('COALESCE(SUM(project.currentAmount), 0)', 'sum')
      .where('project.status = :status', { status: ProjectStatus.FUNDING })
      .getRawOne<{ sum: string }>();

    const totalFundingCapital = Number(totalFundingCapitalRaw?.sum ?? 0);

    const feeFractionExpr =
      'CASE WHEN COALESCE(project.commission_rate, 0) > 1 THEN COALESCE(project.commission_rate, 0) / 100 ELSE COALESCE(project.commission_rate, 0) END';

    const successfulCapitalRaw = await this.investmentsRepository
      .createQueryBuilder('inv')
      .leftJoin('inv.project', 'project')
      .select('COALESCE(SUM(inv.amount), 0)', 'sum')
      .where('inv.status = :invStatus', {
        invStatus: InvestmentStatus.COMPLETED,
      })
      .andWhere('project.status = :projectStatus', {
        projectStatus: ProjectStatus.COMPLETED,
      })
      .getRawOne<{ sum: string }>();

    const successfulCapital = Number(successfulCapitalRaw?.sum ?? 0);

    const systemRevenueRaw = await this.investmentsRepository
      .createQueryBuilder('inv')
      .leftJoin('inv.project', 'project')
      .select(
        `COALESCE(SUM(inv.amount * (${feeFractionExpr})), 0)`,
        'sum',
      )
      .where('inv.status = :invStatus', {
        invStatus: InvestmentStatus.COMPLETED,
      })
      .andWhere('project.status = :projectStatus', {
        projectStatus: ProjectStatus.COMPLETED,
      })
      .getRawOne<{ sum: string }>();

    const systemRevenue = Number(systemRevenueRaw?.sum ?? 0);
    const commissionRate = successfulCapital > 0
      ? Number(((systemRevenue / successfulCapital) * 100).toFixed(2))
      : 0;

    return {
      pendingCount,
      fundingCount,
      completedCount,
      totalFundingCapital: Number(totalFundingCapital.toFixed(2)),
      totalUsers,
      totalProjects,
      totalTransactions: await this.transactionsRepository.count(),
      systemRevenue,
      commissionRate,
    };
  }

  async getUsersForDashboard(
    role: 'owner' | 'investor',
    page: number,
    pageSize: number,
  ): Promise<{
    items: DashboardUser[];
    page: number;
    pageSize: number;
    total: number;
  }> {
    const targetRole = role === 'owner' ? UserRole.OWNER : UserRole.INVESTOR;
    const feeFractionExpr =
      'CASE WHEN COALESCE(project.commission_rate, 0) > 1 THEN COALESCE(project.commission_rate, 0) / 100 ELSE COALESCE(project.commission_rate, 0) END';

    const [users, total] = await this.usersRepository.findAndCount({
      where: { role: targetRole },
      select: ['id', 'fullName', 'email', 'balance', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const items: DashboardUser[] = [];

    for (const user of users) {
      const totalInvestedRaw = await this.investmentsRepository
        .createQueryBuilder('inv')
        .select('COALESCE(SUM(inv.amount), 0)', 'sum')
        .where('inv.userId = :uid', { uid: user.id })
        .andWhere('inv.status != :withdrawn', {
          withdrawn: InvestmentStatus.WITHDRAWN,
        })
        .getRawOne<{ sum: string }>();

      const totalInvested = Number(totalInvestedRaw?.sum ?? 0);

      const totalReceivedRaw = await this.transactionsRepository
        .createQueryBuilder('tx')
        .select('COALESCE(SUM(tx.amount), 0)', 'sum')
        .where('tx.userId = :uid', { uid: user.id })
        .andWhere('tx.status = :status', {
          status: TransactionStatus.SUCCESS,
        })
        .andWhere('tx.type IN (:...types)', {
          types: [TransactionType.INTEREST_RECEIVE, TransactionType.REFUND],
        })
        .getRawOne<{ sum: string }>();

      const totalReceived = Number(totalReceivedRaw?.sum ?? 0);

      let feeCollected = 0;
      if (role === 'owner') {
        const feeRaw = await this.investmentsRepository
          .createQueryBuilder('inv')
          .leftJoin('inv.project', 'project')
          .select(
            `COALESCE(SUM(inv.amount * (${feeFractionExpr})), 0)`,
            'sum',
          )
          .where('project.ownerId = :oid', { oid: user.id })
          .andWhere('inv.status = :invStatus', {
            invStatus: InvestmentStatus.COMPLETED,
          })
          .andWhere('project.status = :projectStatus', {
            projectStatus: ProjectStatus.COMPLETED,
          })
          .getRawOne<{ sum: string }>();

        feeCollected = Number(feeRaw?.sum ?? 0);
      }

      // Lấy danh sách dự án họ đang tham gia (tối đa 5) dựa trên các investment gần nhất.
      const recentInvestments = await this.investmentsRepository.find({
        where: { userId: user.id },
        relations: ['project'],
        order: { investedAt: 'DESC' },
        take: 30,
      });

      const participatingProjects: DashboardProjectParticipation[] = [];
      const seen = new Set<number>();
      for (const inv of recentInvestments) {
        if (inv.status === InvestmentStatus.WITHDRAWN) {
          continue;
        }
        const p = inv.project;
        if (!p || seen.has(p.id)) {
          continue;
        }
        seen.add(p.id);
        const goal = Number(p.goalAmount);
        const current = Number(p.currentAmount);
        const fundingProgress =
          goal > 0 ? Number(((current / goal) * 100).toFixed(2)) : 0;

        participatingProjects.push({
          id: p.id,
          title: p.title,
          fundingProgress,
          status: p.status,
        });

        if (participatingProjects.length >= 5) {
          break;
        }
      }

      items.push({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        balance: user.balance,
        totalInvested: Number(totalInvested.toFixed(2)),
        totalReceived: Number(totalReceived.toFixed(2)),
        feeCollected: Number(feeCollected.toFixed(2)),
        role: user.role,
        createdAt: user.createdAt,
        participatingProjects,
      });
    }

    return { items, page, pageSize, total };
  }
}

