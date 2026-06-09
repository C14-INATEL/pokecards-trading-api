export class WishlistEntity {
  readonly userId: string;
  readonly name: string;

  private constructor(userId: string, name: string) {
    this.userId = userId;
    this.name = name;
  }

  static create(userId: string, name: string): WishlistEntity {
    return new WishlistEntity(userId, name);
  }
}
