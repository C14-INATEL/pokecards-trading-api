// wishlist.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { Wishlist } from '@prisma/client';

@Controller('wishlists')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  create(@Body() createWishlistDto: CreateWishlistDto): Promise<Wishlist> {
    return this.wishlistService.create(createWishlistDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Wishlist | null> {
    return this.wishlistService.findOne(id);
  }
}