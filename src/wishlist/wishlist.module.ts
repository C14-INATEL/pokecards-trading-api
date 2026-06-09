import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WishlistRepository } from './repositories/wishlist.repository';
import { PrismaWishlistRepository } from './repositories/prisma-wishlist.repository';

@Module({
  imports: [PrismaModule],
  controllers: [WishlistController],
  providers: [
    WishlistService,
    { provide: WishlistRepository, useClass: PrismaWishlistRepository },
  ],
})
export class WishlistModule {}
