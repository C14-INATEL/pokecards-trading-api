import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { TradeProposalModule } from './trade-proposal/trade-proposal.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PrismaModule, WishlistModule, TradeProposalModule, HealthModule],
})
export class AppModule {}
