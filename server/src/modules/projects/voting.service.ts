import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  ProjectMilestoneEntity,
  MilestoneStatus,
} from './entities/milestone.entity';
import { MilestoneVoteEntity } from './entities/vote.entity';
import { MilestoneVoteSnapshotEntity } from './entities/milestone-vote-snapshot.entity';
import {
  InvestmentEntity,
  InvestmentStatus,
} from '../investments/entities/investment.entity';
import { MilestonesService } from './milestones.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FinancialCalculator } from '../../common/utils/financial-calculator';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(MilestoneVoteEntity)
    private readonly milestoneVotesRepository: Repository<MilestoneVoteEntity>,
    @InjectRepository(MilestoneVoteSnapshotEntity)
    private readonly milestoneVoteSnapshotsRepository: Repository<MilestoneVoteSnapshotEntity>,
    private readonly milestonesService: MilestonesService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async buildVotingSnapshot(
    manager: DataSource['manager'],
    milestoneId: number,
    projectId: number,
  ) {
    const snapshotRepo = manager.getRepository(MilestoneVoteSnapshotEntity);
    const investmentRepo = manager.getRepository(InvestmentEntity);

    await snapshotRepo.delete({ milestoneId });

    const investments = await investmentRepo.find({
      where: {
        projectId,
        status: In([InvestmentStatus.ACTIVE, InvestmentStatus.COMPLETED]),
      },
    });

    const capitalByUser = new Map<number, number>();
    for (const inv of investments) {
      const current = capitalByUser.get(inv.userId) ?? 0;
      capitalByUser.set(
        inv.userId,
        FinancialCalculator.round(current + Number(inv.amount)),
      );
    }

    const rows = Array.from(capitalByUser.entries()).map(([userId, amount]) =>
      snapshotRepo.create({
        milestoneId,
        userId,
        capitalSnapshot: amount,
      }),
    );

    if (rows.length > 0) {
      await snapshotRepo.save(rows);
    }
  }

  async startMilestoneVoting(milestoneId: number, userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);

      const milestone = await milestoneRepo.findOne({
        where: { id: milestoneId },
        relations: ['project'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!milestone) throw new NotFoundException('Milestone not found');
      if (milestone.project.ownerId !== userId) {
        throw new ForbiddenException('Only project owner can start voting');
      }
      if (milestone.status !== MilestoneStatus.ADMIN_REVIEW) {
        throw new BadRequestException(
          'Milestone must be in Admin Review state to start voting',
        );
      }

      const votingDays = 3;
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + votingDays);

      milestone.status = MilestoneStatus.VOTING;
      milestone.votingEndsAt = endsAt;
      await milestoneRepo.save(milestone);

      await this.buildVotingSnapshot(
        manager,
        milestone.id,
        milestone.projectId,
      );

      return { message: 'Voting started', endsAt };
    });
  }

  async submitVote(
    userId: number,
    milestoneId: number,
    isApprove: boolean,
    comment?: string,
  ) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId },
    });

    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status !== MilestoneStatus.VOTING) {
      throw new BadRequestException(
        'Giai đoạn này không trong thời gian bầu chọn.',
      );
    }

    if (milestone.votingEndsAt && new Date() > milestone.votingEndsAt) {
      throw new BadRequestException('Thời gian bầu chọn đã kết thúc.');
    }

    const snapshot = await this.milestoneVoteSnapshotsRepository.findOne({
      where: { milestoneId, userId },
    });

    const totalInvested = Number(snapshot?.capitalSnapshot ?? 0);
    if (totalInvested <= 0) {
      throw new ForbiddenException(
        'Bạn phải là nhà đầu tư của dự án này mới có thể bầu chọn.',
      );
    }

    const investorWeight = totalInvested;

    let vote = await this.milestoneVotesRepository.findOne({
      where: { milestoneId, userId },
    });

    if (vote) {
      throw new BadRequestException(
        'Bạn đã thực hiện bầu chọn cho giai đoạn này rồi.',
      );
    }

    vote = this.milestoneVotesRepository.create({
      milestoneId,
      userId,
      isApprove,
      comment: comment || null,
      investorCapital: investorWeight,
    });

    await this.milestoneVotesRepository.save(vote);
    return {
      message: 'Bầu chọn thành công.',
      isApprove,
      weight: investorWeight.toLocaleString() + ' ₫',
    };
  }

  async closeExpiredVotes() {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const now = new Date();
    const votingMilestones = await milestoneRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.project', 'project')
      .where('m.status = :status', { status: MilestoneStatus.VOTING })
      .andWhere('m.votingEndsAt <= :now', { now })
      .getMany();

    for (const milestone of votingMilestones) {
      await this.processMilestoneFinalResult(milestone);
    }
  }

  async processMilestoneFinalResult(milestone: ProjectMilestoneEntity) {
    const project = milestone.project;
    const totalRaised = Number(project.currentAmount);

    const yesVotes = await this.milestoneVotesRepository.find({
      where: { milestoneId: milestone.id, isApprove: true },
    });
    const yesWeight = yesVotes.reduce(
      (sum, v) => sum + Number(v.investorCapital),
      0,
    );

    if (yesWeight >= totalRaised * 0.5) {
      await this.milestonesService.disburseMilestoneFunds(
        milestone.projectId,
        milestone.id,
      );
    } else {
      milestone.status = MilestoneStatus.DISPUTED;
      await this.dataSource
        .getRepository(ProjectMilestoneEntity)
        .save(milestone);

      this.eventEmitter.emit('milestone.disputed', {
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        title: milestone.title,
      });
    }
  }

  async adminResetMilestoneVote(milestoneId: number) {
    return this.dataSource.transaction(async (manager) => {
      const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);
      const votesRepo = manager.getRepository(MilestoneVoteEntity);
      const milestone = await milestoneRepo.findOne({
        where: { id: milestoneId },
        relations: ['project'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!milestone) throw new NotFoundException('Milestone not found');

      // 1. Delete old votes
      await votesRepo.delete({ milestoneId });

      // 2. Reset status and timer
      milestone.status = MilestoneStatus.VOTING;
      milestone.votingEndsAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h
      await milestoneRepo.save(milestone);

      await this.buildVotingSnapshot(
        manager,
        milestone.id,
        milestone.projectId,
      );

      // Notify Investors (Async)
      this.eventEmitter.emit('milestone.voting_reset', {
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        title: milestone.title,
      });

      return milestone;
    });
  }
}
