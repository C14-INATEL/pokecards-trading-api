import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
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

type UpdateTradeData = {
  status?: TradeStatus;
  linkedWishlistId?: string | null;
  offeredCards?: {
    deleteMany: object;
    create: { cardId: string; quantity: number }[];
  };
  requestedCards?: {
    deleteMany: object;
    create: { cardId: string; quantity: number }[];
  };
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

  findMany(): Promise<TradeWithCards[]> {
    return Promise.resolve(
      Array.from(this.trades.values()).map((trade) => ({ ...trade })),
    );
  }

  update(args: {
    where: { id: string };
    data: UpdateTradeData;
    include?: object;
  }): Promise<TradeWithCards> {
    const trade = this.trades.get(args.where.id);
    if (!trade) throw new Error('Not found');

    const { data } = args;

    if (data.status !== undefined) {
      trade.status = data.status;
    }

    if (data.linkedWishlistId !== undefined) {
      trade.linkedWishlistId = data.linkedWishlistId;
    }

    if (data.offeredCards !== undefined) {
      for (const item of trade.offeredCards) {
        this.items.delete(item.id);
      }
      trade.offeredCards = [];
      for (const card of data.offeredCards.create) {
        const item: TradeItemData = {
          id: `item-offered-${this.items.size + 1}`,
          cardId: card.cardId,
          quantity: card.quantity,
          offeredTradeId: trade.id,
          requestedTradeId: null,
        };
        this.items.set(item.id, item);
        trade.offeredCards.push(item);
      }
    }

    if (data.requestedCards !== undefined) {
      for (const item of trade.requestedCards) {
        this.items.delete(item.id);
      }
      trade.requestedCards = [];
      for (const card of data.requestedCards.create) {
        const item: TradeItemData = {
          id: `item-requested-${this.items.size + 1}`,
          cardId: card.cardId,
          quantity: card.quantity,
          offeredTradeId: null,
          requestedTradeId: trade.id,
        };
        this.items.set(item.id, item);
        trade.requestedCards.push(item);
      }
    }

    trade.updatedAt = new Date();
    this.trades.set(trade.id, trade);
    return Promise.resolve({ ...trade });
  }

  delete(args: { where: { id: string } }): Promise<TradeWithCards> {
    const trade = this.trades.get(args.where.id);
    if (!trade) throw new Error('Not found');

    this.trades.delete(args.where.id);
    for (const item of trade.offeredCards) {
      this.items.delete(item.id);
    }
    for (const item of trade.requestedCards) {
      this.items.delete(item.id);
    }

    return Promise.resolve({ ...trade });
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
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
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
        findMany: jest.fn().mockImplementation(() => inMemoryRepo.findMany()),
        update: jest
          .fn()
          .mockImplementation(
            (args: { where: { id: string }; data: UpdateTradeData }) =>
              inMemoryRepo.update(args),
          ),
        delete: jest
          .fn()
          .mockImplementation((args: { where: { id: string } }) =>
            inMemoryRepo.delete(args),
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
            requestedCards: {
              create: [{ cardId: 'mewtwo-base', quantity: 1 }],
            },
          },
          include: { offeredCards: true, requestedCards: true },
        });
      });

      it('should create a trade with the provided linkedWishlistId', async () => {
        const input: CreateTradeInput = {
          ownerId: 'serena-kalos',
          linkedWishlistId: 'wishlist-001',
          offeredCards: [{ cardId: 'braixen-xy', quantity: 1 }],
          requestedCards: [{ cardId: 'greninja-xy', quantity: 1 }],
        };

        const result = await service.create(input);

        expect(result.linkedWishlistId).toBe('wishlist-001');
        expect(prismaServiceMock.trade.create).toHaveBeenCalledWith(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data: expect.objectContaining({ linkedWishlistId: 'wishlist-001' }),
          }),
        );
      });
    });
  });

  describe('findOne', () => {
    describe('fluxo normal', () => {
      it('should return a trade when it exists', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'red-pallet',
            linkedWishlistId: null,
            offeredCards: {
              create: [{ cardId: 'venusaur-base', quantity: 1 }],
            },
            requestedCards: {
              create: [{ cardId: 'squirtle-base', quantity: 2 }],
            },
          },
        });

        const found = await service.findOne(created.id);

        expect(found).toBeDefined();
        expect(found.id).toBe(created.id);
        expect(found.ownerId).toBe('red-pallet');
      });

      it('should return a trade with its offered and requested cards populated', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'blue-viridian',
            linkedWishlistId: null,
            offeredCards: {
              create: [
                { cardId: 'alakazam-base', quantity: 1 },
                { cardId: 'machamp-base', quantity: 1 },
              ],
            },
            requestedCards: {
              create: [{ cardId: 'gengar-base', quantity: 1 }],
            },
          },
        });

        const found = await service.findOne(created.id);

        expect(found.offeredCards).toHaveLength(2);
        expect(found.requestedCards).toHaveLength(1);
        expect(found.offeredCards.map((c) => c.cardId)).toContain(
          'alakazam-base',
        );
        expect(found.offeredCards.map((c) => c.cardId)).toContain(
          'machamp-base',
        );
      });
    });

    describe('fluxo de extensão', () => {
      it('should call prisma.trade.findUnique exactly once', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'clemont-lumiose',
            linkedWishlistId: null,
            offeredCards: { create: [{ cardId: 'heliolisk-xy', quantity: 1 }] },
            requestedCards: {
              create: [{ cardId: 'chesnaught-xy', quantity: 1 }],
            },
          },
        });

        await service.findOne(created.id);

        expect(prismaServiceMock.trade.findUnique).toHaveBeenCalledTimes(1);
      });

      it('should call prisma.trade.findUnique with correct args', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'korrina-shalour',
            linkedWishlistId: null,
            offeredCards: { create: [{ cardId: 'lucario-xy', quantity: 1 }] },
            requestedCards: {
              create: [{ cardId: 'mienshao-xy', quantity: 1 }],
            },
          },
        });

        await service.findOne(created.id);

        expect(prismaServiceMock.trade.findUnique).toHaveBeenCalledWith({
          where: { id: created.id },
          include: { offeredCards: true, requestedCards: true },
        });
      });

      it('should throw NotFoundException when trade does not exist', async () => {
        await expect(service.findOne('id-inexistente')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('findAll', () => {
    describe('fluxo normal', () => {
      it('should return all trades', async () => {
        await inMemoryRepo.create({
          data: {
            ownerId: 'janine-fuchsia',
            linkedWishlistId: null,
            offeredCards: { create: [{ cardId: 'weezing-base', quantity: 1 }] },
            requestedCards: {
              create: [{ cardId: 'arbok-base', quantity: 1 }],
            },
          },
        });
        await inMemoryRepo.create({
          data: {
            ownerId: 'koga-fuchsia',
            linkedWishlistId: null,
            offeredCards: { create: [{ cardId: 'muk-base', quantity: 1 }] },
            requestedCards: {
              create: [{ cardId: 'venomoth-base', quantity: 1 }],
            },
          },
        });

        const result = await service.findAll();

        expect(result).toHaveLength(2);
      });

      it('should return trades with their offered and requested cards populated', async () => {
        await inMemoryRepo.create({
          data: {
            ownerId: 'blaine-cinnabar',
            linkedWishlistId: null,
            offeredCards: {
              create: [
                { cardId: 'arcanine-base', quantity: 1 },
                { cardId: 'magmar-base', quantity: 1 },
              ],
            },
            requestedCards: {
              create: [{ cardId: 'ninetales-base', quantity: 1 }],
            },
          },
        });

        const result = await service.findAll();

        expect(result[0].offeredCards).toHaveLength(2);
        expect(result[0].requestedCards).toHaveLength(1);
        expect(result[0].offeredCards.map((c) => c.cardId)).toContain(
          'arcanine-base',
        );
      });
    });

    describe('fluxo de extensão', () => {
      it('should return an empty array when no trades exist', async () => {
        const result = await service.findAll();

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
      });

      it('should call prisma.trade.findMany with correct args', async () => {
        await service.findAll();

        expect(prismaServiceMock.trade.findMany).toHaveBeenCalledTimes(1);
        expect(prismaServiceMock.trade.findMany).toHaveBeenCalledWith({
          include: { offeredCards: true, requestedCards: true },
        });
      });
    });
  });

  describe('update', () => {
    describe('fluxo normal', () => {
      it('should update the status of an OPEN trade', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'lance-johto',
            linkedWishlistId: null,
            offeredCards: {
              create: [{ cardId: 'dragonite-base', quantity: 1 }],
            },
            requestedCards: {
              create: [{ cardId: 'gyarados-base', quantity: 1 }],
            },
          },
        });

        const result = await service.update(created.id, {
          status: TradeStatus.CANCELLED,
        });

        expect(result.status).toBe(TradeStatus.CANCELLED);
      });

      it('should replace offered and requested cards when provided', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'clair-blackthorn',
            linkedWishlistId: null,
            offeredCards: { create: [{ cardId: 'kingdra-base', quantity: 1 }] },
            requestedCards: {
              create: [{ cardId: 'dragonair-base', quantity: 1 }],
            },
          },
        });

        const result = await service.update(created.id, {
          offeredCards: [
            { cardId: 'milotic-rse', quantity: 1 },
            { cardId: 'salamence-rse', quantity: 2 },
          ],
          requestedCards: [{ cardId: 'flygon-rse', quantity: 1 }],
        });

        expect(result.offeredCards).toHaveLength(2);
        expect(result.requestedCards).toHaveLength(1);
        expect(result.offeredCards.map((c) => c.cardId)).toContain(
          'milotic-rse',
        );
        expect(result.offeredCards.map((c) => c.cardId)).toContain(
          'salamence-rse',
        );
        expect(result.requestedCards[0].cardId).toBe('flygon-rse');
      });

      it('should update the linkedWishlistId when provided', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'steven-hoenn',
            linkedWishlistId: null,
            offeredCards: {
              create: [{ cardId: 'metagross-rse', quantity: 1 }],
            },
            requestedCards: {
              create: [{ cardId: 'aggron-rse', quantity: 1 }],
            },
          },
        });

        const result = await service.update(created.id, {
          linkedWishlistId: '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
        });

        expect(result.linkedWishlistId).toBe(
          '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
        );
      });

      it('should keep ownerId unchanged after an update', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'wallace-sootopolis',
            linkedWishlistId: null,
            offeredCards: { create: [{ cardId: 'milotic-rse', quantity: 1 }] },
            requestedCards: {
              create: [{ cardId: 'kyogre-rse', quantity: 1 }],
            },
          },
        });

        const result = await service.update(created.id, {
          status: TradeStatus.CANCELLED,
        });

        expect(result.ownerId).toBe('wallace-sootopolis');
      });
    });

    describe('fluxo de extensão', () => {
      it('should throw NotFoundException when trade does not exist', async () => {
        await expect(
          service.update('id-inexistente', { status: TradeStatus.CANCELLED }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should not call prisma.trade.update when trade does not exist', async () => {
        await service
          .update('id-inexistente', { status: TradeStatus.CANCELLED })
          .catch(() => {});

        expect(prismaServiceMock.trade.update).not.toHaveBeenCalled();
      });

      it('should throw ConflictException when trade is not OPEN', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'cynthia-sinnoh',
            linkedWishlistId: null,
            offeredCards: { create: [{ cardId: 'garchomp-dp', quantity: 1 }] },
            requestedCards: {
              create: [{ cardId: 'lucario-dp', quantity: 1 }],
            },
          },
        });
        await inMemoryRepo.update({
          where: { id: created.id },
          data: { status: TradeStatus.CONCLUDED },
        });

        await expect(
          service.update(created.id, { status: TradeStatus.CANCELLED }),
        ).rejects.toThrow(ConflictException);
      });

      it('should not call prisma.trade.update when trade is not OPEN', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'cynthia-sinnoh',
            linkedWishlistId: null,
            offeredCards: { create: [{ cardId: 'spiritomb-dp', quantity: 1 }] },
            requestedCards: {
              create: [{ cardId: 'togekiss-dp', quantity: 1 }],
            },
          },
        });
        await inMemoryRepo.update({
          where: { id: created.id },
          data: { status: TradeStatus.CANCELLED },
        });

        await service
          .update(created.id, { status: TradeStatus.OPEN })
          .catch(() => {});

        expect(prismaServiceMock.trade.update).not.toHaveBeenCalled();
      });

      it('should call prisma.trade.update with correct args when replacing cards', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'red-mtsilver',
            linkedWishlistId: null,
            offeredCards: { create: [{ cardId: 'pikachu-base', quantity: 1 }] },
            requestedCards: {
              create: [{ cardId: 'lapras-base', quantity: 1 }],
            },
          },
        });

        await service.update(created.id, {
          status: TradeStatus.CANCELLED,
          offeredCards: [{ cardId: 'snorlax-base', quantity: 1 }],
          requestedCards: [{ cardId: 'articuno-base', quantity: 1 }],
        });

        expect(prismaServiceMock.trade.update).toHaveBeenCalledTimes(1);
        expect(prismaServiceMock.trade.update).toHaveBeenCalledWith({
          where: { id: created.id },
          data: {
            status: TradeStatus.CANCELLED,
            offeredCards: {
              deleteMany: {},
              create: [{ cardId: 'snorlax-base', quantity: 1 }],
            },
            requestedCards: {
              deleteMany: {},
              create: [{ cardId: 'articuno-base', quantity: 1 }],
            },
          },
          include: { offeredCards: true, requestedCards: true },
        });
      });
    });
  });

  describe('delete', () => {
    describe('fluxo normal', () => {
      it('should delete an existing trade without error', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'giovanni-viridian',
            linkedWishlistId: null,
            offeredCards: {
              create: [{ cardId: 'nidoking-base', quantity: 1 }],
            },
            requestedCards: {
              create: [{ cardId: 'rhydon-base', quantity: 1 }],
            },
          },
        });

        await expect(service.delete(created.id)).resolves.toBeUndefined();
        expect(prismaServiceMock.trade.delete).toHaveBeenCalledWith({
          where: { id: created.id },
        });
      });

      it('should make the trade unreachable after deletion', async () => {
        const created = await inMemoryRepo.create({
          data: {
            ownerId: 'sabrina-saffron',
            linkedWishlistId: null,
            offeredCards: {
              create: [{ cardId: 'alakazam-base', quantity: 1 }],
            },
            requestedCards: {
              create: [{ cardId: 'mrmime-base', quantity: 1 }],
            },
          },
        });

        await service.delete(created.id);

        await expect(service.findOne(created.id)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('fluxo de extensão', () => {
      it('should throw NotFoundException when trade does not exist', async () => {
        await expect(service.delete('id-inexistente')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should not call prisma.trade.delete when trade does not exist', async () => {
        await service.delete('id-inexistente').catch(() => {});

        expect(prismaServiceMock.trade.delete).not.toHaveBeenCalled();
      });
    });
  });
});
