// wishlist.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { WishlistService } from './wishlist.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { Wishlist, WishlistItem, WishlistItemType } from '@prisma/client';

// Tipagem explícita para os dados de criação do Prisma
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

// Mock in-memory repository com tipagem correta
class InMemoryWishlistRepository {
  private wishlists: Map<string, Wishlist & { items: WishlistItem[] }> = new Map();
  private items: Map<string, WishlistItem> = new Map();

  async create(args: { data: WishlistCreateData }): Promise<Wishlist & { items: WishlistItem[] }> {
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

    return wishlist;
  }

  async findUnique(args: {
    where: { id: string };
    include?: { items: boolean };
  }): Promise<(Wishlist & { items?: WishlistItem[] }) | null> {
    const wishlist = this.wishlists.get(args.where.id);
    if (!wishlist) return null;

    const result = { ...wishlist };
    if (args.include?.items) {
      result.items = Array.from(this.items.values()).filter(
        (item) => item.wishlistId === args.where.id,
      );
    }
    return result;
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
    };
  };

  beforeEach(async () => {
    inMemoryRepo = new InMemoryWishlistRepository();

    prismaServiceMock = {
      wishlist: {
        create: jest.fn().mockImplementation((args: { data: WishlistCreateData }) =>
          inMemoryRepo.create(args),
        ),
        findUnique: jest.fn().mockImplementation(
          (args: { where: { id: string }; include?: { items: boolean } }) =>
            inMemoryRepo.findUnique(args),
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
    it('should create a wishlist with items', async () => {
      const dto: CreateWishlistDto = {
        userId: 'user-123',
        name: 'Minha Lista',
        items: [
          { itemType: WishlistItemType.CARD, cardId: 'card-001' },
          { itemType: WishlistItemType.FILTER, filterType: 'color', filterRarity: 'rare' },
        ],
      };

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid');
      expect(result.userId).toBe(dto.userId);
      expect(result.name).toBe(dto.name);
      expect(result.items).toHaveLength(2);
      expect(prismaServiceMock.wishlist.create).toHaveBeenCalledTimes(1);
    });

    it('should create a wishlist without items', async () => {
      const dto: CreateWishlistDto = {
        userId: 'user-456',
        name: 'Lista Vazia',
        items: [],
      };

      const result = await service.create(dto);

      expect(result.items).toHaveLength(0);
      expect(prismaServiceMock.wishlist.create).toHaveBeenCalledWith({
        data: {
          userId: dto.userId,
          name: dto.name,
          items: { create: [] },
        },
        include: { items: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a wishlist with items if it exists', async () => {
      const created = await service.create({
        userId: 'user-789',
        name: 'Para ler depois',
        items: [{ itemType: WishlistItemType.CARD, cardId: 'card-002' }],
      });

      const found = await service.findOne(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.items).toHaveLength(1);
      expect(prismaServiceMock.wishlist.findUnique).toHaveBeenCalledWith({
        where: { id: created.id },
        include: { items: true },
      });
    });

    it('should return null if wishlist does not exist', async () => {
      const result = await service.findOne('non-existent-id');
      expect(result).toBeNull();
    });
  });
});