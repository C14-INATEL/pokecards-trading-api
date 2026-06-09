import { IWishlistItem } from './wishlist-item.interface';

export class SpecificCardItem implements IWishlistItem {
  constructor(
    readonly id: string,
    readonly cardId: string,
    readonly quantity: number = 1,
  ) {}

  matches(card: Record<string, unknown>): boolean {
    return card['id'] === this.cardId;
  }
}
