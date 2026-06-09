import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WishlistEntity } from '../domain/wishlist.entity';
import {
  WishlistRepository,
  WishlistItemInput,
  WishlistWithItems,
} from './wishlist.repository';

@Injectable()
export class PrismaWishlistRepository extends WishlistRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  save(
    entity: WishlistEntity,
    items?: WishlistItemInput[],
  ): Promise<WishlistWithItems> {
    return this.prisma.wishlist.create({
      data: {
        userId: entity.userId,
        name: entity.name,
        items: { create: items ?? [] },
      },
      include: { items: true },
    });
  }

  findById(id: string): Promise<WishlistWithItems | null> {
    return this.prisma.wishlist.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  findAll(): Promise<WishlistWithItems[]> {
    return this.prisma.wishlist.findMany({
      include: { items: true },
    });
  }

  update(
    id: string,
    data: { name?: string; items?: WishlistItemInput[] },
  ): Promise<WishlistWithItems> {
    return this.prisma.wishlist.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.items !== undefined && {
          items: { deleteMany: {}, create: data.items },
        }),
      },
      include: { items: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.wishlist.delete({ where: { id } });
  }
}
