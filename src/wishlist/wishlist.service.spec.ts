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
    });

    describe('fluxo de extensão', () => {
      it('should call prisma.wishlist.create exactly once', async () => {
        const dto: CreateWishlistDto = {
          userId: 'user-101',
          name: 'Lista Estruturada',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-999' },
          ],
        };

        await service.create(dto);

        expect(prismaServiceMock.wishlist.create).toHaveBeenCalledTimes(1);
      });

      it('should call prisma.wishlist.create with correct structure', async () => {
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
    });
  });

  describe('findOne', () => {
    describe('fluxo normal', () => {
      it('should return a wishlist with items when it exists', async () => {
        const created = await inMemoryRepo.create({
          data: {
            userId: 'user-789',
            name: 'Para ler depois',
            items: {
              create: [
                {
                  itemType: WishlistItemType.SPECIFIC_CARD,
                  cardId: 'card-002',
                },
              ],
            },
          },
        });

        const found = await service.findOne(created.id);

        expect(found).toBeDefined();
        expect(found.id).toBe(created.id);
        expect(found.items).toHaveLength(1);
      });

      it('should return wishlist with correct userId and name', async () => {
        const created = await inMemoryRepo.create({
          data: {
            userId: 'user-check',
            name: 'Lista Verificada',
            items: { create: [] },
          },
        });

        const found = await service.findOne(created.id);

        expect(found.userId).toBe('user-check');
        expect(found.name).toBe('Lista Verificada');
        expect(found.items).toHaveLength(0);
      });
    });

    describe('fluxo de extensão', () => {
      it('should call prisma.wishlist.findUnique exactly once', async () => {
        const created = await inMemoryRepo.create({
          data: {
            userId: 'user-args',
            name: 'Lista Args',
            items: { create: [] },
          },
        });

        await service.findOne(created.id);

        expect(prismaServiceMock.wishlist.findUnique).toHaveBeenCalledTimes(1);
      });

      it('should call prisma.wishlist.findUnique with correct args', async () => {
        const created = await inMemoryRepo.create({
          data: {
            userId: 'user-args',
            name: 'Lista Args',
            items: { create: [] },
          },
        });

        await service.findOne(created.id);

        expect(prismaServiceMock.wishlist.findUnique).toHaveBeenCalledWith({
          where: { id: created.id },
          include: { items: true },
        });
      });

      it('should throw NotFoundException when wishlist does not exist', async () => {
        await expect(service.findOne('id-inexistente')).rejects.toThrow(
          NotFoundException,
        );
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
      it('should call prisma.update with correct structure', async () => {
        const created = await service.create({
          userId: 'user-upd-3',
          name: 'Lista Check',
          items: [],
        });

        const dto: UpdateWishlistDto = {
          name: 'Nome Atualizado',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-001' },
          ],
        };

        await service.update(created.id, dto);

        expect(prismaServiceMock.wishlist.update).toHaveBeenCalledWith({
          where: { id: created.id },
          data: {
            name: 'Nome Atualizado',
            items: {
              deleteMany: {},
              create: [
                {
                  itemType: WishlistItemType.SPECIFIC_CARD,
                  cardId: 'card-001',
                },
              ],
            },
          },
          include: { items: true },
        });
      });

      it('should throw NotFoundException when updating a non-existent wishlist', async () => {
        const dto: UpdateWishlistDto = { name: 'Qualquer Nome' };

        await expect(service.update('id-inexistente', dto)).rejects.toThrow(
          NotFoundException,
        );

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

        await expect(service.findOne(created.id)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('fluxo de extensão', () => {
      it('should throw NotFoundException when deleting a non-existent wishlist', async () => {
        await expect(service.delete('id-inexistente')).rejects.toThrow(
          NotFoundException,
        );

        expect(prismaServiceMock.wishlist.delete).not.toHaveBeenCalled();
      });

      it('should call prisma.delete with correct id', async () => {
        const created = await service.create({
          userId: 'user-del-3',
          name: 'Lista Delete Check',
          items: [],
        });

        await service.delete(created.id);

        expect(prismaServiceMock.wishlist.delete).toHaveBeenCalledWith({
          where: { id: created.id },
        });
        expect(prismaServiceMock.wishlist.delete).toHaveBeenCalledTimes(1);
      });
    });
  });
});
