import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { 
  ProjectMilestoneEntity, 
  MilestoneStatus 
} from './entities/milestone.entity';
import { MilestoneVoteEntity } from './entities/vote.entity';
import { 
  InvestmentEntity, 
  InvestmentStatus 
} from '../investments/entities/investment.entity';
import { MilestonesService } from './milestones.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(MilestoneVoteEntity)
    private readonly milestoneVotesRepository: Repository<MilestoneVoteEntity>,
    private readonly milestonesService: MilestonesService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async startMilestoneVoting(milestoneId: number, userId: number) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId },
      relations: ['project']
    });

    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.project.ownerId !== userId) {
      throw new ForbiddenException('Only project owner can start voting');
    }
    if (milestone.status !== MilestoneStatus.ADMIN_REVIEW) {
      throw new BadRequestException('Milestone must be in Admin Review state to start voting');
    }

    const votingDays = 3;
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + votingDays);

    milestone.status = MilestoneStatus.VOTING;
    milestone.votingEndsAt = endsAt;
    await milestoneRepo.save(milestone);

    return { message: 'Voting started', endsAt };
  }

  async submitVote(userId: number, milestoneId: number, isApprove: boolean, comment?: string) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({ where: { id: milestoneId } });

    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status !== MilestoneStatus.VOTING) {
      throw new BadRequestException('Giai đoạn này không trong thời gian bầu chọn.');
    }

    if (milestone.votingEndsAt && new Date() > milestone.votingEndsAt) {
      throw new BadRequestException('Thời gian bầu chọn đã kết thúc.');
    }

    const investmentRepo = this.dataSource.getRepository(InvestmentEntity);
    const investments = await investmentRepo.find({
      where: { projectId: milestone.projectId, userId: userId },
    });

    const activeInvestments = investments.filter(
      (inv) => inv.status !== InvestmentStatus.WITHDRAWN,
    );
    const totalInvested = activeInvestments.reduce(
      (sum, inv) => sum + Number(inv.amount),
      0,
    );

    if (totalInvested <= 0) {
      throw new ForbiddenException('Bạn phải là nhà đầu tư của dự án này mới có thể bầu chọn.');
    }

    const investorWeight = totalInvested;

    let vote = await this.milestoneVotesRepository.findOne({
      where: { milestoneId, userId },
    });

    if (vote) {
      throw new BadRequestException('Bạn đã thực hiện bầu chọn cho giai đoạn này rồi.');
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
      weight: investorWeight.toLocaleString() + ' ₫' 
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
    const yesWeight = yesVotes.reduce((sum, v) => sum + Number(v.investorCapital), 0);

    if (yesWeight >= totalRaised * 0.5) {
      await this.milestonesService.disburseMilestoneFunds(milestone.projectId, milestone.id);
    } else {
      milestone.status = MilestoneStatus.DISPUTED;
      await this.dataSource.getRepository(ProjectMilestoneEntity).save(milestone);

      this.eventEmitter.emit('milestone.disputed', {
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        title: milestone.title,
      });
    }
  }

  async adminResetMilestoneVote(milestoneId: number) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({ where: { id: milestoneId }, relations: ['project'] });
    if (!milestone) throw new NotFoundException('Milestone not found');

    // 1. Delete old votes
    await this.milestoneVotesRepository.delete({ milestoneId });

    // 2. Reset status and timer
    milestone.status = MilestoneStatus.VOTING;
    milestone.votingEndsAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h
    await milestoneRepo.save(milestone);

    // Notify Investors (Async)
    this.eventEmitter.emit('milestone.voting_reset', {
      projectId: milestone.projectId,
      milestoneId: milestone.id,
      title: milestone.title,
    });

    return milestone;
  }
}
