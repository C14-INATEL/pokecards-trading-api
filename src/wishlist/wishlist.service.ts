// wishlist.service.ts (stub inicial para TDD)
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { Wishlist } from '@prisma/client';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWishlistDto: CreateWishlistDto): Promise<Wishlist> {
    // Implementação virá depois que o teste falhar
    throw new Error('Method not implemented.');
  }

  async findOne(id: string): Promise<Wishlist | null> {
    throw new Error('Method not implemented.');
  }
}