import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { Wishlist, WishlistItem } from '@prisma/client';

type WishlistWithItems = Wishlist & { items: WishlistItem[] };

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createWishlistDto: CreateWishlistDto,
  ): Promise<WishlistWithItems> {
    const { userId, name, items } = createWishlistDto;

    return this.prisma.wishlist.create({
      data: {
        userId,
        name,
        items: {
          create: items ?? [],
        },
      },
      include: { items: true },
    });
  }

  async findOne(id: string): Promise<WishlistWithItems | null> {
    return this.prisma.wishlist.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async update(
    id: string,
    updateWishlistDto: UpdateWishlistDto,
  ): Promise<WishlistWithItems> {
    const existing = await this.prisma.wishlist.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Wishlist with id "${id}" not found`);
    }

    const { name, items } = updateWishlistDto;

    return this.prisma.wishlist.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(items !== undefined && {
          items: {
            deleteMany: {},
            create: items,
          },
        }),
      },
      include: { items: true },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.wishlist.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Wishlist with id "${id}" not found`);
    }

    await this.prisma.wishlist.delete({ where: { id } });
  }
}
