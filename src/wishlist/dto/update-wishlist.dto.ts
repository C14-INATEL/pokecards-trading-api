import { WishlistItemType } from '@prisma/client';

export class UpdateWishlistItemDto {
  itemType: WishlistItemType;
  cardId?: string | null;
  filterType?: string | null;
  filterRarity?: string | null;
}

export class UpdateWishlistDto {
  name?: string;
  items?: UpdateWishlistItemDto[];
}