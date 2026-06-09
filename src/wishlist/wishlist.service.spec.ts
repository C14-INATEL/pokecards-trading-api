import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import {
  WishlistRepository,
  WishlistWithItems,
  WishlistItemInput,
} from './repositories/wishlist.repository';
import { WishlistEntity } from './domain/wishlist.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { WishlistItemType } from '@prisma/client';

class InMemoryWishlistRepository extends WishlistRepository {
  private wishlists: Map<string, WishlistWithItems> = new Map();

  save(
    entity: WishlistEntity,
    items?: WishlistItemInput[],
  ): Promise<WishlistWithItems> {
    const id =
      this.wishlists.size === 0
        ? 'mock-uuid'
        : `mock-uuid-${this.wishlists.size + 1}`;
    const wishlist: WishlistWithItems = {
      id,
      userId: entity.userId,
      name: entity.name,
      createdAt: new Date(),
      items: (items ?? []).map((item, idx) => ({
        id: `item-${idx + 1}`,
        wishlistId: id,
        itemType: item.itemType,
        cardId: item.cardId ?? null,
        filterType: item.filterType ?? null,
        filterRarity: item.filterRarity ?? null,
      })),
    };
    this.wishlists.set(id, wishlist);
    return Promise.resolve(wishlist);
  }

  findById(id: string): Promise<WishlistWithItems | null> {
    return Promise.resolve(this.wishlists.get(id) ?? null);
  }

  findAll(): Promise<WishlistWithItems[]> {
    return Promise.resolve(Array.from(this.wishlists.values()));
  }

  update(
    id: string,
    data: { name?: string; items?: WishlistItemInput[] },
  ): Promise<WishlistWithItems> {
    const wishlist = this.wishlists.get(id);
    if (!wishlist) return Promise.resolve(null as any);

    if (data.name !== undefined) wishlist.name = data.name;
    if (data.items !== undefined) {
      wishlist.items = data.items.map((item, idx) => ({
        id: `item-${idx + 1}`,
        wishlistId: id,
        itemType: item.itemType,
        cardId: item.cardId ?? null,
        filterType: item.filterType ?? null,
        filterRarity: item.filterRarity ?? null,
      }));
    }

    this.wishlists.set(id, wishlist);
    return Promise.resolve({ ...wishlist });
  }

  delete(id: string): Promise<void> {
    this.wishlists.delete(id);
    return Promise.resolve();
  }

  clear(): void {
    this.wishlists.clear();
  }
}

describe('WishlistService', () => {
  let service: WishlistService;
  let inMemoryRepo: InMemoryWishlistRepository;

  beforeEach(async () => {
    inMemoryRepo = new InMemoryWishlistRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: WishlistRepository, useValue: inMemoryRepo },
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
        };

        const result = await service.create(dto);

        expect(result.items).toHaveLength(0);
        expect(result.userId).toBe(dto.userId);
        expect(result.name).toBe(dto.name);
      });
    });

    describe('fluxo de extensão', () => {
      it('should call repository.save exactly once', async () => {
        const saveSpy = jest.spyOn(inMemoryRepo, 'save');
        const dto: CreateWishlistDto = {
          userId: 'user-101',
          name: 'Lista Estruturada',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-999' },
          ],
        };

        await service.create(dto);

        expect(saveSpy).toHaveBeenCalledTimes(1);
      });

      it('should call repository.save with entity built from dto', async () => {
        const saveSpy = jest.spyOn(inMemoryRepo, 'save');
        const dto: CreateWishlistDto = {
          userId: 'user-101',
          name: 'Lista Estruturada',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-999' },
          ],
        };

        await service.create(dto);

        expect(saveSpy).toHaveBeenCalledWith(
          expect.objectContaining({ userId: dto.userId, name: dto.name }),
          dto.items,
        );
      });
    });
  });

  describe('findOne', () => {
    describe('fluxo normal', () => {
      it('should return a wishlist with items when it exists', async () => {
        const entity = WishlistEntity.create('user-789', 'Para ler depois');
        const created = await inMemoryRepo.save(entity, [
          { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-002' },
        ]);

        const found = await service.findOne(created.id);

        expect(found).toBeDefined();
        expect(found.id).toBe(created.id);
        expect(found.items).toHaveLength(1);
      });

      it('should return wishlist with correct userId and name', async () => {
        const entity = WishlistEntity.create('user-check', 'Lista Verificada');
        const created = await inMemoryRepo.save(entity, []);

        const found = await service.findOne(created.id);

        expect(found.userId).toBe('user-check');
        expect(found.name).toBe('Lista Verificada');
        expect(found.items).toHaveLength(0);
      });
    });

    describe('fluxo de extensão', () => {
      it('should call repository.findById exactly once', async () => {
        const findByIdSpy = jest.spyOn(inMemoryRepo, 'findById');
        const entity = WishlistEntity.create('user-args', 'Lista Args');
        const created = await inMemoryRepo.save(entity, []);

        await service.findOne(created.id);

        expect(findByIdSpy).toHaveBeenCalledTimes(1);
      });

      it('should call repository.findById with correct id', async () => {
        const findByIdSpy = jest.spyOn(inMemoryRepo, 'findById');
        const entity = WishlistEntity.create('user-args', 'Lista Args');
        const created = await inMemoryRepo.save(entity, []);

        await service.findOne(created.id);

        expect(findByIdSpy).toHaveBeenCalledWith(created.id);
      });

      it('should throw NotFoundException when wishlist does not exist', async () => {
        await expect(service.findOne('id-inexistente')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('findAll', () => {
    describe('fluxo normal', () => {
      it('should return all wishlists with items', async () => {
        await service.create({
          userId: 'user-list-1',
          name: 'Lista Um',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-001' },
          ],
        });
        await service.create({
          userId: 'user-list-2',
          name: 'Lista Dois',
          items: [],
        });

        const result = await service.findAll();

        expect(result).toHaveLength(2);
        expect(result[0].items).toHaveLength(1);
        expect(result[1].items).toHaveLength(0);
      });

      it('should return an empty array when there are no wishlists', async () => {
        await expect(service.findAll()).resolves.toEqual([]);
      });
    });

    describe('fluxo de extensão', () => {
      it('should call repository.findAll exactly once', async () => {
        const findAllSpy = jest.spyOn(inMemoryRepo, 'findAll');

        await service.findAll();

        expect(findAllSpy).toHaveBeenCalledTimes(1);
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
      it('should call repository.update with correct args', async () => {
        const updateSpy = jest.spyOn(inMemoryRepo, 'update');
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

        expect(updateSpy).toHaveBeenCalledWith(created.id, {
          name: 'Nome Atualizado',
          items: [
            { itemType: WishlistItemType.SPECIFIC_CARD, cardId: 'card-001' },
          ],
        });
      });

      it('should throw NotFoundException when updating a non-existent wishlist', async () => {
        const updateSpy = jest.spyOn(inMemoryRepo, 'update');
        const dto: UpdateWishlistDto = { name: 'Qualquer Nome' };

        await expect(service.update('id-inexistente', dto)).rejects.toThrow(
          NotFoundException,
        );

        expect(updateSpy).not.toHaveBeenCalled();
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
        const deleteSpy = jest.spyOn(inMemoryRepo, 'delete');

        await expect(service.delete('id-inexistente')).rejects.toThrow(
          NotFoundException,
        );

        expect(deleteSpy).not.toHaveBeenCalled();
      });

      it('should call repository.delete with correct id', async () => {
        const deleteSpy = jest.spyOn(inMemoryRepo, 'delete');
        const created = await service.create({
          userId: 'user-del-3',
          name: 'Lista Delete Check',
          items: [],
        });

        await service.delete(created.id);

        expect(deleteSpy).toHaveBeenCalledWith(created.id);
        expect(deleteSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
