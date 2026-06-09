import { Wishlist, WishlistItem, WishlistItemType } from '@prisma/client';
import { WishlistEntity } from '../domain/wishlist.entity';

export type WishlistWithItems = Wishlist & { items: WishlistItem[] };

export type WishlistItemInput = {
  itemType: WishlistItemType;
  cardId?: string;
  filterType?: string;
  filterRarity?: string;
};

export abstract class WishlistRepository {
  abstract save(
    entity: WishlistEntity,
    items?: WishlistItemInput[],
  ): Promise<WishlistWithItems>;

  abstract findById(id: string): Promise<WishlistWithItems | null>;

  abstract findAll(): Promise<WishlistWithItems[]>;

  abstract update(
    id: string,
    data: { name?: string; items?: WishlistItemInput[] },
  ): Promise<WishlistWithItems>;

  abstract delete(id: string): Promise<void>;
}
