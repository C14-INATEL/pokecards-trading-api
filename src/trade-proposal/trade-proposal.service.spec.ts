import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TradeProposalService } from './trade-proposal.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeProposalDto } from './dto/create-trade-proposal.dto';
import {
  ProposalStatus,
  TradeStatus,
  TradeProposal,
  ProposalItem,
} from '@prisma/client';

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
      result = result.filter((p) => p.tradeId === args.where.tradeId);
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

  updateMany(args: {
    where: { tradeId: string; id: { not: string }; status: ProposalStatus };
    data: { status: ProposalStatus };
  }): Promise<{ count: number }> {
    let count = 0;
    for (const [, proposal] of this.proposals) {
      if (
        proposal.tradeId === args.where.tradeId &&
        proposal.id !== args.where.id.not &&
        proposal.status === args.where.status
      ) {
        proposal.status = args.data.status;
        count++;
      }
    }
    return Promise.resolve({ count });
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
      updateMany: jest.Mock;
      delete: jest.Mock;
    };
    trade: {
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    inMemoryRepo = new InMemoryTradeProposalRepository();

    prismaServiceMock = {
      tradeProposal: {
        create: jest
          .fn()
          .mockImplementation((args: { data: CreateProposalData }) =>
            inMemoryRepo.create(args),
          ),
        findUnique: jest
          .fn()
          .mockImplementation(
            (args: {
              where: { id: string };
              include?: { offeredCards: boolean };
            }) => inMemoryRepo.findUnique(args),
          ),
        findMany: jest
          .fn()
          .mockImplementation(
            (args: {
              where?: { tradeId?: string };
              include?: { offeredCards: boolean };
            }) => inMemoryRepo.findMany(args),
          ),
        update: jest
          .fn()
          .mockImplementation(
            (args: {
              where: { id: string };
              data: { status: ProposalStatus };
              include?: { offeredCards: boolean };
            }) => inMemoryRepo.update(args),
          ),
        updateMany: jest
          .fn()
          .mockImplementation(
            (args: {
              where: {
                tradeId: string;
                id: { not: string };
                status: ProposalStatus;
              };
              data: { status: ProposalStatus };
            }) => inMemoryRepo.updateMany(args),
          ),
        delete: jest
          .fn()
          .mockImplementation((args: { where: { id: string } }) =>
            inMemoryRepo.delete(args),
          ),
      },
      trade: {
        update: jest.fn().mockResolvedValue({}),
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
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-fo-001',
            proposerId: 'user-fo-001',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [{ cardId: 'card-fo-001', quantity: 1 }] },
          },
        });
        const result = await service.findOne(fakeProposal.id);
        expect(result).toBeDefined();
        expect(result.id).toBe(fakeProposal.id);
        expect(result.offeredCards).toHaveLength(1);
      });

      it('should return proposal with correct proposerId and status', async () => {
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-fo-002',
            proposerId: 'user-fo-002',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });
        const result = await service.findOne(fakeProposal.id);
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
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-fo-003',
            proposerId: 'user-fo-003',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });
        await service.findOne(fakeProposal.id);
        expect(prismaServiceMock.tradeProposal.findUnique).toHaveBeenCalledWith(
          {
            where: { id: fakeProposal.id },
            include: { offeredCards: true },
          },
        );
      });
    });
  });

  describe('findAll', () => {
    describe('fluxo normal', () => {
      it('should return all trade proposals', async () => {
        await inMemoryRepo.create({
          data: {
            tradeId: 'trade-fa-001',
            proposerId: 'user-fa-001',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });
        await inMemoryRepo.create({
          data: {
            tradeId: 'trade-fa-002',
            proposerId: 'user-fa-002',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });
        const result = await service.findAll();
        expect(result).toHaveLength(2);
      });

      it('should return only proposals matching tradeId filter', async () => {
        await inMemoryRepo.create({
          data: {
            tradeId: 'trade-fa-filter',
            proposerId: 'user-fa-003',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });
        await inMemoryRepo.create({
          data: {
            tradeId: 'trade-fa-other',
            proposerId: 'user-fa-004',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });
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

  describe('update', () => {
    describe('fluxo normal', () => {
      it('should accept a PENDING proposal', async () => {
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-u-001',
            proposerId: 'user-u-001',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [{ cardId: 'card-u-001', quantity: 1 }] },
          },
        });
        const result = await service.update(fakeProposal.id, {
          status: ProposalStatus.ACCEPTED,
        });
        expect(result.status).toBe(ProposalStatus.ACCEPTED);
      });

      it('should reject a PENDING proposal', async () => {
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-u-002',
            proposerId: 'user-u-002',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });
        const result = await service.update(fakeProposal.id, {
          status: ProposalStatus.REJECTED,
        });
        expect(result.status).toBe(ProposalStatus.REJECTED);
      });

      it('should cancel all other PENDING proposals of the same trade when accepted', async () => {
        const tradeId = 'trade-u-cancel-001';

        const accepted = await inMemoryRepo.create({
          data: {
            tradeId,
            proposerId: 'user-u-cancel-001',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });
        await inMemoryRepo.create({
          data: {
            tradeId,
            proposerId: 'user-u-cancel-002',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });
        await inMemoryRepo.create({
          data: {
            tradeId,
            proposerId: 'user-u-cancel-003',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });

        await service.update(accepted.id, { status: ProposalStatus.ACCEPTED });

        const all = await service.findAll(tradeId);
        const others = all.filter((p) => p.id !== accepted.id);
        expect(others.every((p) => p.status === ProposalStatus.CANCELLED)).toBe(
          true,
        );
      });

      it('should set parent Trade status to CONCLUDED when proposal is accepted', async () => {
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-u-close-001',
            proposerId: 'user-u-close-001',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });

        await service.update(fakeProposal.id, { status: ProposalStatus.ACCEPTED });

        expect(prismaServiceMock.trade.update).toHaveBeenCalledWith({
          where: { id: fakeProposal.tradeId },
          data: { status: TradeStatus.CONCLUDED },
        });
      });
    });

    describe('fluxo de extensão', () => {
      it('should throw NotFoundException when proposal does not exist', async () => {
        await expect(
          service.update('id-inexistente', { status: ProposalStatus.ACCEPTED }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should not call prisma.tradeProposal.update when proposal does not exist', async () => {
        await service
          .update('id-inexistente', { status: ProposalStatus.ACCEPTED })
          .catch(() => {});
        expect(prismaServiceMock.tradeProposal.update).not.toHaveBeenCalled();
      });

      it('should throw ConflictException when proposal status is not PENDING', async () => {
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-u-003',
            proposerId: 'user-u-003',
            message: null,
            status: ProposalStatus.ACCEPTED,
            offeredCards: { create: [] },
          },
        });

        await expect(
          service.update(fakeProposal.id, { status: ProposalStatus.ACCEPTED }),
        ).rejects.toThrow(ConflictException);
      });

      it('should not cancel other proposals when proposal is REJECTED', async () => {
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-u-rej-001',
            proposerId: 'user-u-rej-001',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });

        await service.update(fakeProposal.id, { status: ProposalStatus.REJECTED });

        expect(
          prismaServiceMock.tradeProposal.updateMany,
        ).not.toHaveBeenCalled();
      });

      it('should not update trade status when proposal is REJECTED', async () => {
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-u-rej-002',
            proposerId: 'user-u-rej-002',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });

        await service.update(fakeProposal.id, { status: ProposalStatus.REJECTED });

        expect(prismaServiceMock.trade.update).not.toHaveBeenCalled();
      });

      it('should call prisma.tradeProposal.updateMany with correct args when accepted', async () => {
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-u-args-001',
            proposerId: 'user-u-args-001',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });

        await service.update(fakeProposal.id, { status: ProposalStatus.ACCEPTED });

        expect(
          prismaServiceMock.tradeProposal.updateMany,
        ).toHaveBeenCalledWith({
          where: {
            tradeId: fakeProposal.tradeId,
            id: { not: fakeProposal.id },
            status: ProposalStatus.PENDING,
          },
          data: { status: ProposalStatus.CANCELLED },
        });
      });
    });
  });

  describe('delete', () => {
    describe('fluxo normal', () => {
      it('should delete an existing trade proposal without error', async () => {
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-d-001',
            proposerId: 'user-d-001',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [] },
          },
        });
        await expect(service.delete(fakeProposal.id)).resolves.toBeUndefined();
        expect(prismaServiceMock.tradeProposal.delete).toHaveBeenCalledWith({
          where: { id: fakeProposal.id },
        });
      });

      it('should make proposal unreachable after deletion', async () => {
        const fakeProposal = await inMemoryRepo.create({
          data: {
            tradeId: 'trade-d-002',
            proposerId: 'user-d-002',
            message: null,
            status: ProposalStatus.PENDING,
            offeredCards: { create: [{ cardId: 'card-d-001', quantity: 1 }] },
          },
        });
        await service.delete(fakeProposal.id);
        await expect(service.findOne(fakeProposal.id)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('fluxo de extensão', () => {
      it('should throw NotFoundException when proposal does not exist', async () => {
        await expect(service.delete('id-inexistente')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should not call prisma.tradeProposal.delete when proposal does not exist', async () => {
        await service.delete('id-inexistente').catch(() => {});
        expect(prismaServiceMock.tradeProposal.delete).not.toHaveBeenCalled();
      });
    });
  });
});
