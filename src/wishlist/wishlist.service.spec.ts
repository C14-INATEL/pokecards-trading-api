import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { Wishlist, WishlistItem, WishlistItemType } from '@prisma/client';

type WishlistCreateData = {
  userId: string;
  name: string;
  items?: {
    create: Array<{
      itemType: WishlistItemType;
      cardId?: string | null;
      filterType?: string | null;
      filterRarity?: string | null;
    }>;
  };
};

type WishlistUpdateData = {
  name?: string;
  items?: {
    deleteMany: object;
    create: Array<{
      itemType: WishlistItemType;
      cardId?: string | null;
      filterType?: string | null;
      filterRarity?: string | null;
    }>;
  };
};

class InMemoryWishlistRepository {
  private wishlists: Map<string, Wishlist & { items: WishlistItem[] }> =
    new Map();
  private items: Map<string, WishlistItem> = new Map();

  create(args: {
    data: WishlistCreateData;
  }): Promise<Wishlist & { items: WishlistItem[] }> {
    const { data } = args;
    const id = 'mock-uuid';
    const wishlist: Wishlist & { items: WishlistItem[] } = {
      id,
      userId: data.userId,
      name: data.name,
      createdAt: new Date(),
      items: [],
    };

    this.wishlists.set(id, wishlist);

    if (data.items?.create) {
      for (const itemData of data.items.create) {
        const itemId = `item-${this.items.size + 1}`;
        const item: WishlistItem = {
          id: itemId,
          wishlistId: id,
          itemType: itemData.itemType,
          cardId: itemData.cardId ?? null,
          filterType: itemData.filterType ?? null,
          filterRarity: itemData.filterRarity ?? null,
        };
        this.items.set(itemId, item);
        wishlist.items.push(item);
      }
    }

    return Promise.resolve(wishlist);
  }

  findUnique(args: {
    where: { id: string };
    include?: { items: boolean };
  }): Promise<(Wishlist & { items?: WishlistItem[] }) | null> {
    const wishlist = this.wishlists.get(args.where.id);
    if (!wishlist) return Promise.resolve(null);

    const result = { ...wishlist };
    if (args.include?.items) {
      result.items = Array.from(this.items.values()).filter(
        (item) => item.wishlistId === args.where.id,
      );
    }
    return Promise.resolve(result ?? null);
  }

  update(args: {
    where: { id: string };
    data: WishlistUpdateData;
    include?: { items: boolean };
  }): Promise<Wishlist & { items: WishlistItem[] }> {
    const wishlist = this.wishlists.get(args.where.id);
    if (!wishlist) return Promise.resolve(null as any);

    if (args.data.name !== undefined) {
      wishlist.name = args.data.name;
    }

    if (args.data.items !== undefined) {
      for (const [key, item] of this.items.entries()) {
        if (item.wishlistId === args.where.id) {
          this.items.delete(key);
        }
      }
      wishlist.items = [];

      for (const itemData of args.data.items.create) {
        const itemId = `item-${this.items.size + 1}`;
        const item: WishlistItem = {
          id: itemId,
          wishlistId: args.where.id,
          itemType: itemData.itemType,
          cardId: itemData.cardId ?? null,
          filterType: itemData.filterType ?? null,
          filterRarity: itemData.filterRarity ?? null,
        };
        this.items.set(itemId, item);
        wishlist.items.push(item);
      }
    }

    this.wishlists.set(args.where.id, wishlist);
    return Promise.resolve({ ...wishlist });
  }

  delete(args: { where: { id: string } }): Promise<Wishlist> {
    const wishlist = this.wishlists.get(args.where.id);
    if (!wishlist) return Promise.resolve(null as any);

    for (const [key, item] of this.items.entries()) {
      if (item.wishlistId === args.where.id) {
        this.items.delete(key);
      }
    }

    this.wishlists.delete(args.where.id);
    return Promise.resolve(wishlist);
  }

  clear(): void {
    this.wishlists.clear();
    this.items.clear();
  }
}

describe('WishlistService', () => {
  let service: WishlistService;
  let inMemoryRepo: InMemoryWishlistRepository;
  let prismaServiceMock: {
    wishlist: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    inMemoryRepo = new InMemoryWishlistRepository();

    prismaServiceMock = {
      wishlist: {
        create: jest
          .fn()
          .mockImplementation((args: { data: WishlistCreateData }) =>
            inMemoryRepo.create(args),
          ),
        findUnique: jest
          .fn()
          .mockImplementation(
            (args: { where: { id: string }; include?: { items: boolean } }) =>
              inMemoryRepo.findUnique(args),
          ),
        update: jest
          .fn()
          .mockImplementation(
            (args: {
              where: { id: string };
              data: WishlistUpdateData;
              include?: { items: boolean };
            }) => inMemoryRepo.update(args),
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
        WishlistService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
  });

  afterEach(() => {
    inMemoryRepo.clear();
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('fluxo normal', () => {
      it('should create a wishlist with items', async () => {
        const dto: CreateWishlistDto = {
          userId: 'user-123',
          name: 'Minha Lista',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-001' },
            {
              itemType: WishlistItemType.FILTER,
              filterType: 'color',
              filterRarity: 'rare',
            },
          ],
        };

        const result = await service.create(dto);

        expect(result).toBeDefined();
        expect(result.id).toBe('mock-uuid');
        expect(result.userId).toBe(dto.userId);
        expect(result.name).toBe(dto.name);
        expect(result.items).toHaveLength(2);
      });

      it('should create a wishlist without items', async () => {
        const dto: CreateWishlistDto = {
          userId: 'user-456',
          name: 'Lista Vazia',
          items: [],
        };

        const result = await service.create(dto);

        expect(result.items).toHaveLength(0);
        expect(result.userId).toBe(dto.userId);
        expect(result.name).toBe(dto.name);
      });

      it('should create a wishlist with only FILTER items', async () => {
        const dto: CreateWishlistDto = {
          userId: 'user-789',
          name: 'Lista de Filtros',
          items: [
            {
              itemType: WishlistItemType.FILTER,
              filterType: 'type',
              filterRarity: 'common',
            },
            {
              itemType: WishlistItemType.FILTER,
              filterType: 'color',
              filterRarity: 'rare',
            },
          ],
        };

        const result = await service.create(dto);

        expect(result.items).toHaveLength(2);
        expect(
          result.items.every(
            (item) => item.itemType === WishlistItemType.FILTER,
          ),
        ).toBe(true);
        expect(result.items.every((item) => item.cardId === null)).toBe(true);
      });

      it('should create a wishlist with only SPECIFIC_CARD items', async () => {
        const dto: CreateWishlistDto = {
          userId: 'user-101',
          name: 'Lista de Cartas',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-001' },
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-002' },
          ],
        };

        const result = await service.create(dto);

        expect(result.items).toHaveLength(2);
        expect(
          result.items.every(
            (item) => item.itemType === WishlistItemType.SPECIFIC_CARD,
          ),
        ).toBe(true);
        expect(result.items.every((item) => item.filterType === null)).toBe(
          true,
        );
      });
    });

    describe('fluxo de extensão', () => {
      it('should call prisma with correct structure when creating', async () => {
        const dto: CreateWishlistDto = {
          userId: 'user-101',
          name: 'Lista Estruturada',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-999' },
          ],
        };

        await service.create(dto);

        expect(prismaServiceMock.wishlist.create).toHaveBeenCalledWith({
          data: {
            userId: dto.userId,
            name: dto.name,
            items: {
              create: [
                {
                  itemType: WishlistItemType.SPECIFIC_CARD,
                  cardId: 'card-999',
                },
              ],
            },
          },
          include: { items: true },
        });
      });

      it('should call prisma create exactly once', async () => {
        const dto: CreateWishlistDto = {
          userId: 'user-once',
          name: 'Lista Única',
          items: [],
        };

        await service.create(dto);

        expect(prismaServiceMock.wishlist.create).toHaveBeenCalledTimes(1);
      });

      it('should call prisma with empty create array when items is empty', async () => {
        const dto: CreateWishlistDto = {
          userId: 'user-empty',
          name: 'Lista Sem Itens',
          items: [],
        };

        await service.create(dto);

        expect(prismaServiceMock.wishlist.create).toHaveBeenCalledWith({
          data: {
            userId: dto.userId,
            name: dto.name,
            items: { create: [] },
          },
          include: { items: true },
        });
      });

      it('should return wishlist with createdAt defined', async () => {
        const dto: CreateWishlistDto = {
          userId: 'user-date',
          name: 'Lista com Data',
          items: [],
        };

        const result = await service.create(dto);

        expect(result.createdAt).toBeDefined();
        expect(result.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('findOne', () => {
    describe('fluxo normal', () => {
      it('should return a wishlist with items if it exists', async () => {
        const created = await service.create({
          userId: 'user-789',
          name: 'Para ler depois',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-002' },
          ],
        });

        const found = await service.findOne(created.id);

        expect(found).toBeDefined();
        expect(found?.id).toBe(created.id);
        expect(found?.items).toHaveLength(1);
      });

      it('should return null if wishlist does not exist', async () => {
        const result = await service.findOne('non-existent-id');

        expect(result).toBeNull();
      });

      it('should return wishlist with correct userId and name', async () => {
        const created = await service.create({
          userId: 'user-check',
          name: 'Lista Verificada',
          items: [],
        });

        const found = await service.findOne(created.id);

        expect(found?.userId).toBe('user-check');
        expect(found?.name).toBe('Lista Verificada');
        expect(found?.items).toHaveLength(0);
      });

      it('should return wishlist with all item fields populated', async () => {
        const created = await service.create({
          userId: 'user-fields',
          name: 'Lista Completa',
          items: [
            {
              itemType: WishlistItemType.FILTER,
              filterType: 'color',
              filterRarity: 'legendary',
            },
          ],
        });

        const found = await service.findOne(created.id);

        expect(found?.items).toHaveLength(1);
        expect(found?.items[0].itemType).toBe(WishlistItemType.FILTER);
        expect(found?.items[0].filterType).toBe('color');
        expect(found?.items[0].filterRarity).toBe('legendary');
        expect(found?.items[0].cardId).toBeNull();
      });
    });

    describe('fluxo de extensão', () => {
      it('should call prisma findUnique with correct args', async () => {
        const created = await service.create({
          userId: 'user-args',
          name: 'Lista Args',
          items: [],
        });

        await service.findOne(created.id);

        expect(prismaServiceMock.wishlist.findUnique).toHaveBeenCalledWith({
          where: { id: created.id },
          include: { items: true },
        });
      });

      it('should call prisma findUnique exactly once', async () => {
        const created = await service.create({
          userId: 'user-once',
          name: 'Lista Once',
          items: [],
        });

        await service.findOne(created.id);

        expect(prismaServiceMock.wishlist.findUnique).toHaveBeenCalledTimes(1);
      });

      it('should return empty items array when wishlist has no items', async () => {
        const created = await service.create({
          userId: 'user-empty',
          name: 'Lista Vazia',
          items: [],
        });

        const found = await service.findOne(created.id);

        expect(found?.items).toBeDefined();
        expect(found?.items).toHaveLength(0);
        expect(Array.isArray(found?.items)).toBe(true);
      });

      it('should return null for any non-existent id without throwing', async () => {
        const ids = ['abc-123', 'xyz-999', 'fake-id'];

        for (const id of ids) {
          const result = await service.findOne(id);
          expect(result).toBeNull();
        }
      });
    });
  });

  describe('update', () => {
    describe('fluxo normal', () => {
      it('should update the name of an existing wishlist', async () => {
        const created = await service.create({
          userId: 'user-upd-1',
          name: 'Nome Antigo',
          items: [],
        });

        const dto: UpdateWishlistDto = { name: 'Nome Novo' };
        const result = await service.update(created.id, dto);

        expect(result.name).toBe('Nome Novo');
        expect(result.id).toBe(created.id);
        expect(prismaServiceMock.wishlist.update).toHaveBeenCalledWith({
          where: { id: created.id },
          data: { name: 'Nome Novo' },
          include: { items: true },
        });
      });

      it('should replace all items when items are provided in update', async () => {
        const created = await service.create({
          userId: 'user-upd-2',
          name: 'Lista com Itens',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-old' },
          ],
        });

        const dto: UpdateWishlistDto = {
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-new-1' },
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-new-2' },
          ],
        };
        const result = await service.update(created.id, dto);

        expect(result.items).toHaveLength(2);
        expect(result.items.every((i) => i.cardId !== 'card-old')).toBe(true);
        expect(result.items.map((i) => i.cardId)).toContain('card-new-1');
        expect(result.items.map((i) => i.cardId)).toContain('card-new-2');
      });
    });

    describe('fluxo de extensão', () => {
      it('should throw NotFoundException when updating a non-existent wishlist', async () => {
        const dto: UpdateWishlistDto = { name: 'Qualquer Nome' };

        await expect(service.update('id-inexistente', dto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should not call prisma.update when wishlist does not exist', async () => {
        const dto: UpdateWishlistDto = { name: 'Nome Qualquer' };

        await service.update('id-inexistente', dto).catch(() => {});

        expect(prismaServiceMock.wishlist.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('delete', () => {
    describe('fluxo normal', () => {
      it('should delete an existing wishlist without error', async () => {
        const created = await service.create({
          userId: 'user-del-1',
          name: 'Lista Para Deletar',
          items: [],
        });

        await expect(service.delete(created.id)).resolves.toBeUndefined();
        expect(prismaServiceMock.wishlist.delete).toHaveBeenCalledWith({
          where: { id: created.id },
        });
      });

      it('should make the wishlist unreachable after deletion', async () => {
        const created = await service.create({
          userId: 'user-del-2',
          name: 'Lista Sumindo',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-bye' },
          ],
        });

        await service.delete(created.id);

        const found = await service.findOne(created.id);
        expect(found).toBeNull();
      });
    });

    describe('fluxo de extensão', () => {
      it('should throw NotFoundException when deleting a non-existent wishlist', async () => {
        await expect(service.delete('id-inexistente')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should not call prisma.delete when wishlist does not exist', async () => {
        await service.delete('id-inexistente').catch(() => {});

        expect(prismaServiceMock.wishlist.delete).not.toHaveBeenCalled();
      });
    });
  });
});

// =============================================================================
// Mock puro (jest.fn) — create e findOne
// =============================================================================

const FIXED_DATE = new Date('2024-06-15T12:00:00.000Z');

function makePrismaWishlist(
  overrides?: Partial<Wishlist & { items: WishlistItem[] }>,
): Wishlist & { items: WishlistItem[] } {
  return {
    id: 'wishlist-uuid-001',
    userId: 'user-uuid-001',
    name: 'Minha Lista',
    createdAt: FIXED_DATE,
    items: [],
    ...overrides,
  };
}

function makePrismaItem(overrides?: Partial<WishlistItem>): WishlistItem {
  return {
    id: 'item-uuid-001',
    wishlistId: 'wishlist-uuid-001',
    itemType: WishlistItemType.SPECIFIC_CARD,
    cardId: 'card-001',
    filterType: null,
    filterRarity: null,
    ...overrides,
  };
}

describe('create – mock puro', () => {
  let mockService: WishlistService;

  const prismaMock = {
    wishlist: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    mockService = module.get<WishlistService>(WishlistService);
  });

  it('deve chamar prisma.wishlist.create com a estrutura correta', async () => {
    const dto: CreateWishlistDto = {
      userId: 'user-uuid-001',
      name: 'Minha Lista',
      items: [{ itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-001' }],
    };

    prismaMock.wishlist.create.mockResolvedValue(
      makePrismaWishlist({ items: [makePrismaItem()] }),
    );

    await mockService.create(dto);

    expect(prismaMock.wishlist.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-uuid-001',
        name: 'Minha Lista',
        items: {
          create: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-001' },
          ],
        },
      },
      include: { items: true },
    });
  });

  it('deve chamar prisma.wishlist.create exatamente uma vez', async () => {
    prismaMock.wishlist.create.mockResolvedValue(makePrismaWishlist());

    await mockService.create({
      userId: 'user-uuid-001',
      name: 'Lista',
      items: [],
    });

    expect(prismaMock.wishlist.create).toHaveBeenCalledTimes(1);
  });

  it('deve retornar os dados vindos do prisma sem alteração', async () => {
    const prismaReturn = makePrismaWishlist({ items: [makePrismaItem()] });
    prismaMock.wishlist.create.mockResolvedValue(prismaReturn);

    const result = await mockService.create({
      userId: 'user-uuid-001',
      name: 'Minha Lista',
      items: [
        {
          itemType: WishlistItemType.SPECIFIC_CARD,
          cardId: 'card-001',
        },
      ],
    });

    expect(result.id).toBe('wishlist-uuid-001');
    expect(result.userId).toBe('user-uuid-001');
    expect(result.createdAt).toBe(FIXED_DATE);
    expect(result.items).toHaveLength(1);
  });

  it('não deve chamar prisma.wishlist.findUnique durante o create', async () => {
    prismaMock.wishlist.create.mockResolvedValue(makePrismaWishlist());

    await mockService.create({
      userId: 'user-uuid-001',
      name: 'Lista',
      items: [],
    });

    expect(prismaMock.wishlist.findUnique).not.toHaveBeenCalled();
  });

  it('deve propagar erro lançado pelo prisma', async () => {
    prismaMock.wishlist.create.mockRejectedValue(
      new Error('DB connection failed'),
    );

    await expect(
      mockService.create({
        userId: 'user-uuid-001',
        name: 'Lista',
        items: [],
      }),
    ).rejects.toThrow('DB connection failed');
  });
});

describe('findOne – mock puro', () => {
  let mockService: WishlistService;

  const prismaMock = {
    wishlist: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    mockService = module.get<WishlistService>(WishlistService);
  });

  it('deve chamar prisma.wishlist.findUnique com id e include corretos', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(makePrismaWishlist());

    await mockService.findOne('wishlist-uuid-001');

    expect(prismaMock.wishlist.findUnique).toHaveBeenCalledWith({
      where: { id: 'wishlist-uuid-001' },
      include: { items: true },
    });
  });

  it('deve chamar prisma.wishlist.findUnique exatamente uma vez', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(makePrismaWishlist());

    await mockService.findOne('wishlist-uuid-001');

    expect(prismaMock.wishlist.findUnique).toHaveBeenCalledTimes(1);
  });

  it('deve retornar os dados vindos do prisma sem alteração', async () => {
    const prismaReturn = makePrismaWishlist({
      items: [makePrismaItem({ filterType: 'color', filterRarity: 'rare' })],
    });
    prismaMock.wishlist.findUnique.mockResolvedValue(prismaReturn);

    const result = await mockService.findOne('wishlist-uuid-001');

    expect(result?.id).toBe('wishlist-uuid-001');
    expect(result?.userId).toBe('user-uuid-001');
    expect(result?.createdAt).toBe(FIXED_DATE);
    expect(result?.items).toHaveLength(1);
  });

  it('deve retornar null quando prisma retorna null', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(null);

    const result = await mockService.findOne('id-inexistente');

    expect(result).toBeNull();
  });

  it('não deve chamar prisma.wishlist.create durante o findOne', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(makePrismaWishlist());

    await mockService.findOne('wishlist-uuid-001');

    expect(prismaMock.wishlist.create).not.toHaveBeenCalled();
  });

  it('deve retornar items como array vazio quando wishlist não tem itens', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(
      makePrismaWishlist({ items: [] }),
    );

    const result = await mockService.findOne('wishlist-uuid-001');

    expect(Array.isArray(result?.items)).toBe(true);
    expect(result?.items).toHaveLength(0);
  });
});

// =============================================================================
// Mock puro (jest.fn) — update
// =============================================================================

describe('update – mock puro', () => {
  let mockService: WishlistService;

  const prismaMock = {
    wishlist: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    mockService = module.get<WishlistService>(WishlistService);
  });

  it('deve chamar prisma.wishlist.update com a estrutura correta', async () => {
    const dto: UpdateWishlistDto = {
      name: 'Nome Atualizado',
      items: [{ itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-001' }],
    };

    prismaMock.wishlist.findUnique.mockResolvedValue(makePrismaWishlist());
    prismaMock.wishlist.update.mockResolvedValue(
      makePrismaWishlist({ name: 'Nome Atualizado', items: [makePrismaItem()] }),
    );

    await mockService.update('wishlist-uuid-001', dto);

    expect(prismaMock.wishlist.update).toHaveBeenCalledWith({
      where: { id: 'wishlist-uuid-001' },
      data: {
        name: 'Nome Atualizado',
        items: {
          deleteMany: {},
          create: [{ itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-001' }],
        },
      },
      include: { items: true },
    });
  });

  it('deve retornar os dados atualizados vindos do prisma', async () => {
    const dto: UpdateWishlistDto = { name: 'Nome Novo' };
    const prismaReturn = makePrismaWishlist({ name: 'Nome Novo' });

    prismaMock.wishlist.findUnique.mockResolvedValue(makePrismaWishlist());
    prismaMock.wishlist.update.mockResolvedValue(prismaReturn);

    const result = await mockService.update('wishlist-uuid-001', dto);

    expect(result.name).toBe('Nome Novo');
    expect(result.id).toBe('wishlist-uuid-001');
    expect(result.createdAt).toBe(FIXED_DATE);
  });

  it('deve lançar NotFoundException sem chamar prisma.update quando wishlist não existe', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(null);

    const dto: UpdateWishlistDto = { name: 'Qualquer' };

    await expect(mockService.update('id-inexistente', dto)).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.wishlist.update).not.toHaveBeenCalled();
  });

  it('deve propagar erro lançado pelo prisma.update', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(makePrismaWishlist());
    prismaMock.wishlist.update.mockRejectedValue(new Error('DB update failed'));

    await expect(
      mockService.update('wishlist-uuid-001', { name: 'Erro' }),
    ).rejects.toThrow('DB update failed');
  });
});

// =============================================================================
// Mock puro (jest.fn) — delete
// =============================================================================

describe('delete – mock puro', () => {
  let mockService: WishlistService;

  const prismaMock = {
    wishlist: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    mockService = module.get<WishlistService>(WishlistService);
  });

  it('deve chamar prisma.wishlist.delete com o id correto', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(makePrismaWishlist());
    prismaMock.wishlist.delete.mockResolvedValue(makePrismaWishlist());

    await mockService.delete('wishlist-uuid-001');

    expect(prismaMock.wishlist.delete).toHaveBeenCalledWith({
      where: { id: 'wishlist-uuid-001' },
    });
  });

  it('deve resolver sem retorno (void) ao deletar com sucesso', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(makePrismaWishlist());
    prismaMock.wishlist.delete.mockResolvedValue(makePrismaWishlist());

    await expect(mockService.delete('wishlist-uuid-001')).resolves.toBeUndefined();
    expect(prismaMock.wishlist.delete).toHaveBeenCalledTimes(1);
  });

  it('deve lançar NotFoundException sem chamar prisma.delete quando wishlist não existe', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(null);

    await expect(mockService.delete('id-inexistente')).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.wishlist.delete).not.toHaveBeenCalled();
  });

  it('deve propagar erro lançado pelo prisma.delete', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValue(makePrismaWishlist());
    prismaMock.wishlist.delete.mockRejectedValue(new Error('DB delete failed'));

    await expect(mockService.delete('wishlist-uuid-001')).rejects.toThrow(
      'DB delete failed',
    );
  });
});