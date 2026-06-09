import { Injectable, NotFoundException } from '@nestjs/common';
import {
  WishlistRepository,
  WishlistWithItems,
} from './repositories/wishlist.repository';
import { WishlistEntity } from './domain/wishlist.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly repository: WishlistRepository) {}

  async create(
    createWishlistDto: CreateWishlistDto,
  ): Promise<WishlistWithItems> {
    const wishlist = WishlistEntity.create(
      createWishlistDto.userId,
      createWishlistDto.name,
    );
    return this.repository.save(wishlist, createWishlistDto.items);
  }

  async findOne(id: string): Promise<WishlistWithItems> {
    const wishlist = await this.repository.findById(id);
    if (!wishlist) {
      throw new NotFoundException(`Wishlist com id "${id}" não encontrada`);
    }
    return wishlist;
  }

  async findAll(): Promise<WishlistWithItems[]> {
    return this.repository.findAll();
  }

  async update(
    id: string,
    updateWishlistDto: UpdateWishlistDto,
  ): Promise<WishlistWithItems> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Wishlist com id "${id}" não encontrada`);
    }
    return this.repository.update(id, {
      name: updateWishlistDto.name,
      items: updateWishlistDto.items,
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Wishlist com id "${id}" não encontrada`);
    }
    await this.repository.delete(id);
  }
}
