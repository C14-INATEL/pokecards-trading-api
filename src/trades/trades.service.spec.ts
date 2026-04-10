import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TradesService } from './trades.service';
import { PrismaService } from '../prisma/prisma.service';
import { TradeStatus } from '@prisma/client';

type TradeItemData = {
  id: string;
  cardId: string;
  quantity: number;
  offeredTradeId: string | null;
  requestedTradeId: string | null;
};

type TradeWithCards = {
  id: string;
  ownerId: string;
  status: TradeStatus;
  linkedWishlistId: string | null;
  createdAt: Date;
  updatedAt: Date;
  offeredCards: TradeItemData[];
  requestedCards: TradeItemData[];
};

type CreateTradeData = {
  ownerId: string;
  linkedWishlistId?: string | null;
  offeredCards: { create: { cardId: string; quantity: number }[] };
  requestedCards: { create: { cardId: string; quantity: number }[] };
};

type CreateTradeInput = {
  ownerId: string;
  linkedWishlistId?: string | null;
  offeredCards: { cardId: string; quantity: number }[];
  requestedCards: { cardId: string; quantity: number }[];
};

class InMemoryTradeRepository {
  private trades: Map<string, TradeWithCards> = new Map();
  private items: Map<string, TradeItemData> = new Map();
  private idCounter = 0;

  create(args: {
    data: CreateTradeData;
    include?: object;
  }): Promise<TradeWithCards> {
    const { data } = args;
    const id = `trade-${++this.idCounter}`;
    const now = new Date();

    const trade: TradeWithCards = {
      id,
      ownerId: data.ownerId,
      status: TradeStatus.OPEN,
      linkedWishlistId: data.linkedWishlistId ?? null,
      createdAt: now,
      updatedAt: now,
      offeredCards: [],
      requestedCards: [],
    };

    for (const card of data.offeredCards.create) {
      const item: TradeItemData = {
        id: `item-offered-${this.items.size + 1}`,
        cardId: card.cardId,
        quantity: card.quantity,
        offeredTradeId: id,
        requestedTradeId: null,
      };
      this.items.set(item.id, item);
      trade.offeredCards.push(item);
    }

    for (const card of data.requestedCards.create) {
      const item: TradeItemData = {
        id: `item-requested-${this.items.size + 1}`,
        cardId: card.cardId,
        quantity: card.quantity,
        offeredTradeId: null,
        requestedTradeId: id,
      };
      this.items.set(item.id, item);
      trade.requestedCards.push(item);
    }

    this.trades.set(id, trade);
    return Promise.resolve({ ...trade });
  }

  findUnique(args: {
    where: { id: string };
    include?: object;
  }): Promise<TradeWithCards | null> {
    const trade = this.trades.get(args.where.id);
    return Promise.resolve(trade ? { ...trade } : null);
  }

  clear(): void {
    this.trades.clear();
    this.items.clear();
    this.idCounter = 0;
  }
}

describe('TradesService', () => {
  let service: TradesService;
  let inMemoryRepo: InMemoryTradeRepository;
  let prismaServiceMock: {
    trade: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    inMemoryRepo = new InMemoryTradeRepository();

    prismaServiceMock = {
      trade: {
        create: jest
          .fn()
          .mockImplementation((args: { data: CreateTradeData }) =>
            inMemoryRepo.create(args),
          ),
        findUnique: jest
          .fn()
          .mockImplementation((args: { where: { id: string } }) =>
            inMemoryRepo.findUnique(args),
          ),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradesService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<TradesService>(TradesService);
  });

  afterEach(() => {
    inMemoryRepo.clear();
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('fluxo normal', () => {
      it('should create a trade with offered and requested cards', async () => {
        const input: CreateTradeInput = {
          ownerId: 'ash-ketchum',
          offeredCards: [{ cardId: 'charizard-base', quantity: 1 }],
          requestedCards: [{ cardId: 'blastoise-base', quantity: 1 }],
        };

        const result = await service.create(input);

        expect(result).toBeDefined();
        expect(result.ownerId).toBe('ash-ketchum');
        expect(result.offeredCards).toHaveLength(1);
        expect(result.requestedCards).toHaveLength(1);
        expect(result.offeredCards[0].cardId).toBe('charizard-base');
        expect(result.requestedCards[0].cardId).toBe('blastoise-base');
      });

      it('should create a trade with OPEN status by default', async () => {
        const input: CreateTradeInput = {
          ownerId: 'misty-waterflower',
          offeredCards: [{ cardId: 'starmie-base', quantity: 2 }],
          requestedCards: [{ cardId: 'pikachu-base', quantity: 1 }],
        };

        const result = await service.create(input);

        expect(result.status).toBe(TradeStatus.OPEN);
      });
    });

    describe('fluxo de extensão', () => {
      it('should create a trade with linkedWishlistId as null when not provided', async () => {
        const input: CreateTradeInput = {
          ownerId: 'brock-pewter',
          offeredCards: [{ cardId: 'onix-base', quantity: 1 }],
          requestedCards: [{ cardId: 'geodude-base', quantity: 3 }],
        };

        const result = await service.create(input);

        expect(result.linkedWishlistId).toBeNull();
      });

      it('should call prisma.trade.create with correct structure', async () => {
        const input: CreateTradeInput = {
          ownerId: 'gary-oak',
          offeredCards: [{ cardId: 'eevee-base', quantity: 1 }],
          requestedCards: [{ cardId: 'mewtwo-base', quantity: 1 }],
        };

        await service.create(input);

        expect(prismaServiceMock.trade.create).toHaveBeenCalledTimes(1);
        expect(prismaServiceMock.trade.create).toHaveBeenCalledWith({
          data: {
            ownerId: 'gary-oak',
            linkedWishlistId: null,
            offeredCards: { create: [{ cardId: 'eevee-base', quantity: 1 }] },
            requestedCards: { create: [{ cardId: 'mewtwo-base', quantity: 1 }] },
          },
          include: { offeredCards: true, requestedCards: true },
        });
      });
    });
  });

  describe('findOne', () => {
    describe('fluxo normal', () => {
      it('should return a trade when it exists', async () => {
        const created = await service.create({
          ownerId: 'red-pallet',
          offeredCards: [{ cardId: 'venusaur-base', quantity: 1 }],
          requestedCards: [{ cardId: 'squirtle-base', quantity: 2 }],
        });

        const found = await service.findOne(created.id);

        expect(found).toBeDefined();
        expect(found.id).toBe(created.id);
        expect(found.ownerId).toBe('red-pallet');
        expect(prismaServiceMock.trade.findUnique).toHaveBeenCalledWith({
          where: { id: created.id },
          include: { offeredCards: true, requestedCards: true },
        });
      });

      it('should return a trade with its offered and requested cards populated', async () => {
        const created = await service.create({
          ownerId: 'blue-viridian',
          offeredCards: [
            { cardId: 'alakazam-base', quantity: 1 },
            { cardId: 'machamp-base', quantity: 1 },
          ],
          requestedCards: [{ cardId: 'gengar-base', quantity: 1 }],
        });

        const found = await service.findOne(created.id);

        expect(found.offeredCards).toHaveLength(2);
        expect(found.requestedCards).toHaveLength(1);
        expect(found.offeredCards.map((c) => c.cardId)).toContain('alakazam-base');
        expect(found.offeredCards.map((c) => c.cardId)).toContain('machamp-base');
      });
    });

    describe('fluxo de extensão', () => {
      it('should throw NotFoundException when trade does not exist', async () => {
        await expect(service.findOne('id-inexistente')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should not call prisma.trade.create when searching for a trade', async () => {
        await service.findOne('id-qualquer').catch(() => {});

        expect(prismaServiceMock.trade.create).not.toHaveBeenCalled();
      });
    });
  });
});
