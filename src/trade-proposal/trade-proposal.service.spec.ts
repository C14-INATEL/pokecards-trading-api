import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TradeProposalService } from './trade-proposal.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeProposalDto } from './dto/create-trade-proposal.dto';
import { ProposalStatus, TradeProposal, ProposalItem } from '@prisma/client';

// ─── Tipos auxiliares ────────────────────────────────────────────────────────

type TradeProposalWithItems = TradeProposal & { offeredCards: ProposalItem[] };

type CreateProposalData = {
  tradeId: string;
  proposerId: string;
  message?: string | null;
  status: ProposalStatus;
  offeredCards: { create: Array<{ cardId: string; quantity: number }> };
};

// ─── Repositório em memória ──────────────────────────────────────────────────

class InMemoryTradeProposalRepository {
  private proposals: Map<string, TradeProposalWithItems> = new Map();
  private items: Map<string, ProposalItem> = new Map();
  private idCounter = 0;

  create(args: { data: CreateProposalData }): Promise<TradeProposalWithItems> {
    const { data } = args;
    const id = `proposal-${++this.idCounter}`;

    const proposal: TradeProposalWithItems = {
      id,
      tradeId: data.tradeId,
      proposerId: data.proposerId,
      message: data.message ?? null,
      status: data.status,
      createdAt: new Date(),
      offeredCards: [],
    };

    for (const cardData of data.offeredCards.create) {
      const itemId = `item-${this.items.size + 1}`;
      const item: ProposalItem = {
        id: itemId,
        proposalId: id,
        cardId: cardData.cardId,
        quantity: cardData.quantity,
      };
      this.items.set(itemId, item);
      proposal.offeredCards.push(item);
    }

    this.proposals.set(id, proposal);
    return Promise.resolve({ ...proposal });
  }

  findUnique(args: {
    where: { id: string };
    include?: { offeredCards: boolean };
  }): Promise<TradeProposalWithItems | null> {
    const proposal = this.proposals.get(args.where.id);
    if (!proposal) return Promise.resolve(null);
    return Promise.resolve({ ...proposal });
  }

  findMany(args: {
    where?: { tradeId?: string };
    include?: { offeredCards: boolean };
  }): Promise<TradeProposalWithItems[]> {
    let result = Array.from(this.proposals.values());
    if (args.where?.tradeId) {
      result = result.filter((p) => p.tradeId === args.where!.tradeId);
    }
    return Promise.resolve(result.map((p) => ({ ...p })));
  }

  update(args: {
    where: { id: string };
    data: { status: ProposalStatus };
    include?: { offeredCards: boolean };
  }): Promise<TradeProposalWithItems> {
    const proposal = this.proposals.get(args.where.id);
    if (!proposal) throw new Error('Not found');
    proposal.status = args.data.status;
    this.proposals.set(args.where.id, proposal);
    return Promise.resolve({ ...proposal });
  }

  delete(args: { where: { id: string } }): Promise<TradeProposalWithItems> {
    const proposal = this.proposals.get(args.where.id);
    if (!proposal) return Promise.resolve(null as any);
    this.proposals.delete(args.where.id);
    return Promise.resolve(proposal);
  }

  clear(): void {
    this.proposals.clear();
    this.items.clear();
    this.idCounter = 0;
  }
}

// ─── Suite de testes ─────────────────────────────────────────────────────────

describe('TradeProposalService', () => {
  let service: TradeProposalService;
  let inMemoryRepo: InMemoryTradeProposalRepository;
  let prismaServiceMock: {
    tradeProposal: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    inMemoryRepo = new InMemoryTradeProposalRepository();

    prismaServiceMock = {
      tradeProposal: {
        create: jest.fn().mockImplementation((args) => inMemoryRepo.create(args)),
        findUnique: jest.fn().mockImplementation((args) => inMemoryRepo.findUnique(args)),
        findMany: jest.fn().mockImplementation((args) => inMemoryRepo.findMany(args)),
        update: jest.fn().mockImplementation((args) => inMemoryRepo.update(args)),
        delete: jest.fn().mockImplementation((args) => inMemoryRepo.delete(args)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeProposalService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<TradeProposalService>(TradeProposalService);
  });

  afterEach(() => {
    inMemoryRepo.clear();
    jest.clearAllMocks();
  });

  describe('create', () => {
    // ═══════════════════════════════════════════════════════════════════════════
    // FLUXO NORMAL (happy path)
    // ═══════════════════════════════════════════════════════════════════════════

    describe('fluxo normal', () => {
      it('should create a trade proposal with offered cards', async () => {
        const dto: CreateTradeProposalDto = {
          tradeId: 'trade-001',
          proposerId: 'user-001',
          message: 'Quero trocar!',
          offeredCards: [{ cardId: 'card-001', quantity: 2 }],
        };

        const result = await service.create(dto);

        expect(result).toBeDefined();
        expect(result.tradeId).toBe('trade-001');
        expect(result.proposerId).toBe('user-001');
        expect(result.message).toBe('Quero trocar!');
        expect(result.offeredCards).toHaveLength(1);
      });

      it('should create a trade proposal with PENDING status by default', async () => {
        const dto: CreateTradeProposalDto = {
          tradeId: 'trade-002',
          proposerId: 'user-002',
          offeredCards: [{ cardId: 'card-002', quantity: 1 }],
        };

        const result = await service.create(dto);

        expect(result.status).toBe(ProposalStatus.PENDING);
      });

      it('should create a trade proposal without message', async () => {
        const dto: CreateTradeProposalDto = {
          tradeId: 'trade-003',
          proposerId: 'user-003',
          offeredCards: [{ cardId: 'card-003', quantity: 1 }],
        };

        const result = await service.create(dto);

        expect(result.message).toBeNull();
      });

      it('should create a trade proposal with multiple offered cards', async () => {
        const dto: CreateTradeProposalDto = {
          tradeId: 'trade-004',
          proposerId: 'user-004',
          offeredCards: [
            { cardId: 'card-010', quantity: 1 },
            { cardId: 'card-011', quantity: 3 },
            { cardId: 'card-012', quantity: 2 },
          ],
        };

        const result = await service.create(dto);

        expect(result.offeredCards).toHaveLength(3);
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // FLUXO DE EXTENSÃO (edge cases)
    // ═══════════════════════════════════════════════════════════════════════════

    describe('fluxo de extensão', () => {
      it('should create a trade proposal with empty offered cards', async () => {
        const dto: CreateTradeProposalDto = {
          tradeId: 'trade-005',
          proposerId: 'user-005',
          offeredCards: [],
        };

        const result = await service.create(dto);

        expect(result.offeredCards).toHaveLength(0);
      });

      it('should call prisma with correct structure when creating', async () => {
        const dto: CreateTradeProposalDto = {
          tradeId: 'trade-008',
          proposerId: 'user-008',
          offeredCards: [{ cardId: 'card-008', quantity: 1 }],
        };

        await service.create(dto);

        expect(prismaServiceMock.tradeProposal.create).toHaveBeenCalledWith({
          data: {
            tradeId: dto.tradeId,
            proposerId: dto.proposerId,
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: {
              create: [{ cardId: 'card-008', quantity: 1 }],
            },
          },
          include: { offeredCards: true },
        });
      });

      it('should call prisma create exactly once', async () => {
        const dto: CreateTradeProposalDto = {
          tradeId: 'trade-009',
          proposerId: 'user-009',
          offeredCards: [{ cardId: 'card-009', quantity: 1 }],
        };

        await service.create(dto);

        expect(prismaServiceMock.tradeProposal.create).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('findOne', () => {
    describe('fluxo normal', () => {
      it('should return a trade proposal when it exists', async () => {
        const created = await service.create({
          tradeId: 'trade-fo-001',
          proposerId: 'user-fo-001',
          offeredCards: [{ cardId: 'card-fo-001', quantity: 1 }],
        });
        const result = await service.findOne(created.id);
        expect(result).toBeDefined();
        expect(result.id).toBe(created.id);
        expect(result.offeredCards).toHaveLength(1);
      });

      it('should return proposal with correct proposerId and status', async () => {
        const created = await service.create({
          tradeId: 'trade-fo-002',
          proposerId: 'user-fo-002',
          offeredCards: [],
        });
        const result = await service.findOne(created.id);
        expect(result.proposerId).toBe('user-fo-002');
        expect(result.status).toBe(ProposalStatus.PENDING);
      });
    });

    describe('fluxo de extensão', () => {
      it('should throw NotFoundException when proposal does not exist', async () => {
        await expect(service.findOne('id-inexistente')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should call prisma.tradeProposal.findUnique with correct args', async () => {
        const created = await service.create({
          tradeId: 'trade-fo-003',
          proposerId: 'user-fo-003',
          offeredCards: [],
        });
        await service.findOne(created.id);
        expect(prismaServiceMock.tradeProposal.findUnique).toHaveBeenCalledWith({
          where: { id: created.id },
          include: { offeredCards: true },
        });
      });
    });
  });

  describe('findAll', () => {
    describe('fluxo normal', () => {
      it('should return all trade proposals', async () => {
        await service.create({ tradeId: 'trade-fa-001', proposerId: 'user-fa-001', offeredCards: [] });
        await service.create({ tradeId: 'trade-fa-002', proposerId: 'user-fa-002', offeredCards: [] });
        const result = await service.findAll();
        expect(result).toHaveLength(2);
      });

      it('should return only proposals matching tradeId filter', async () => {
        await service.create({ tradeId: 'trade-fa-filter', proposerId: 'user-fa-003', offeredCards: [] });
        await service.create({ tradeId: 'trade-fa-other', proposerId: 'user-fa-004', offeredCards: [] });
        const result = await service.findAll('trade-fa-filter');
        expect(result).toHaveLength(1);
        expect(result[0].tradeId).toBe('trade-fa-filter');
      });
    });

    describe('fluxo de extensão', () => {
      it('should return empty array when no proposals exist', async () => {
        const result = await service.findAll();
        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
      });

      it('should call prisma.tradeProposal.findMany with correct args', async () => {
        await service.findAll('trade-fa-005');
        expect(prismaServiceMock.tradeProposal.findMany).toHaveBeenCalledWith({
          where: { tradeId: 'trade-fa-005' },
          include: { offeredCards: true },
        });
      });
    });
  });
});
