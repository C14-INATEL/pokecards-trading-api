import { Injectable, NotFoundException } from '@nestjs/common';
import { Trade, TradeItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeDto } from './dto/create-trade.dto';

export type TradeWithCards = Trade & {
  offeredCards: TradeItem[];
  requestedCards: TradeItem[];
};

@Injectable()
export class TradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTradeDto): Promise<TradeWithCards> {
    const { ownerId, linkedWishlistId, offeredCards, requestedCards } = dto;

    return this.prisma.trade.create({
      data: {
        ownerId,
        linkedWishlistId: linkedWishlistId ?? null,
        offeredCards: {
          create: offeredCards,
        },
        requestedCards: {
          create: requestedCards,
        },
      },
      include: { offeredCards: true, requestedCards: true },
    });
  }

  async findOne(id: string): Promise<TradeWithCards> {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      include: { offeredCards: true, requestedCards: true },
    });

    if (!trade) {
      throw new NotFoundException(`Trade com id ${id} não encontrado.`);
    }

    return trade;
  }
}
