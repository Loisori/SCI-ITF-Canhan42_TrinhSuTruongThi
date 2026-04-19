import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentsService } from './investments.service';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ProjectStatus } from '../projects/entities/project.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '../users/users.service';

describe('InvestmentsService', () => {
  let service: InvestmentsService;
  let dataSource: jest.Mocked<DataSource>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockUsersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
      getRepository: jest.fn(),
    } as any;

    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    mockUsersService = {
      getUserProfile: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        { provide: DataSource, useValue: dataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<InvestmentsService>(InvestmentsService);
  });

  const mockUsersRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockProjectsRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockInvestmentsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
  };

  const mockSchedulesRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTransactionsRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockManager = {
    getRepository: jest.fn((entity) => {
      switch (entity.name) {
        case 'UserEntity':
          return mockUsersRepo;
        case 'ProjectEntity':
          return mockProjectsRepo;
        case 'InvestmentEntity':
          return mockInvestmentsRepo;
        case 'PaymentScheduleEntity':
          return mockSchedulesRepo;
        case 'TransactionEntity':
          return mockTransactionsRepo;
        default:
          return {};
      }
    }),
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Utility Currency Formatting', () => {
    it('should correctly round currency to 2 decimal places', () => {
      expect((service as any).roundCurrency(123.456)).toBe(123.46);
      expect((service as any).roundCurrency(123.454)).toBe(123.45);
      expect((service as any).roundCurrency(0.1 + 0.2)).toBe(0.3);
    });

    it('should correctly convert commission rate to fraction', () => {
      expect((service as any).toCommissionFraction(5)).toBe(0.05);
      expect((service as any).toCommissionFraction(0.05)).toBe(0.05);
      expect((service as any).toCommissionFraction(null)).toBe(0);
      expect((service as any).toCommissionFraction(-5)).toBe(0);
    });
  });

  describe('Invest Logic', () => {
    const defaultUser = { id: 1, balance: 100000 };
    const defaultProject = {
      id: 1,
      status: ProjectStatus.FUNDING,
      minInvestment: 10000,
      interestRate: 12,
      durationMonths: 6,
      currentAmount: 0,
      goalAmount: 100000,
      ownerId: 2,
      title: 'Test Project',
    };
    const dto: CreateInvestmentDto = { projectId: 1, amount: 12000 };

    beforeEach(() => {
      jest.clearAllMocks();
      mockUsersRepo.findOne.mockResolvedValue(defaultUser);
      mockProjectsRepo.findOne.mockResolvedValue(defaultProject);
      mockInvestmentsRepo.create.mockReturnValue({ id: 100, ...dto });
      mockInvestmentsRepo.save.mockResolvedValue({ id: 100, ...dto });
      mockSchedulesRepo.create.mockImplementation((obj) => obj);
    });

    it('should throw BadRequest if investment is below minimum', async () => {
      await expect(
        service.invest(1, { projectId: 1, amount: 5000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest if user has insufficient balance', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 1, balance: 5000 });
      await expect(
        service.invest(1, { projectId: 1, amount: 15000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest if project is not funding', async () => {
      mockProjectsRepo.findOne.mockResolvedValue({
        ...defaultProject,
        status: ProjectStatus.PENDING,
      });
      await expect(service.invest(1, dto)).rejects.toThrow(BadRequestException);
    });

    it('should calculate monthly interest correctly', async () => {
      await service.invest(1, dto);

      const investmentAmount = 12000;
      const interestRate = 12; // 12% per year -> 1% per month

      // Expected: (12000 * 12) / 100 / 12 = 120
      const expectedMonthlyInterest = 120;

      // verify that schedulesRepo.create was called correctly
      expect(mockSchedulesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expectedMonthlyInterest,
          investmentId: 100,
        }),
      );

      // Ensure 6 schedules are created (durationMonths = 6)
      expect(mockSchedulesRepo.create).toHaveBeenCalledTimes(6);
    });

    it('should include principal in the final repayment schedule', async () => {
      await service.invest(1, dto);

      // monthly interest = 120, final month = principal + monthly interest
      expect(mockSchedulesRepo.create).toHaveBeenNthCalledWith(
        6,
        expect.objectContaining({
          amount: 12120,
          investmentId: 100,
        }),
      );
    });

    it('should correctly handle floating point math with interest', async () => {
      // e.g. amount=10000, interestRate=15.5 -> (10000 * 15.5)/100/12 = 129.16666
      // Rounded becomes 129.17
      const oddProject = {
        ...defaultProject,
        interestRate: 15.5,
        durationMonths: 3,
      };
      mockProjectsRepo.findOne.mockResolvedValue(oddProject);

      await service.invest(1, { projectId: 1, amount: 10000 });

      expect(mockSchedulesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 129.17 }),
      );
    });
  });
});
