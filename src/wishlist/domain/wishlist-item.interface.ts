export interface IWishlistItem {
  matches(card: Record<string, unknown>): boolean;
}
