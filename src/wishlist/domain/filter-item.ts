import { IWishlistItem } from './wishlist-item.interface';

export class FilterItem implements IWishlistItem {
  constructor(
    readonly filterType?: string,
    readonly filterRarity?: string,
  ) {}

  matches(card: Record<string, unknown>): boolean {
    const typeMatch = this.filterType ? card['type'] === this.filterType : true;
    const rarityMatch = this.filterRarity
      ? card['rarity'] === this.filterRarity
      : true;
    return typeMatch && rarityMatch;
  }
}
