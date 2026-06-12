import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Trade, TradeItem, TradeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

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
      throw new NotFoundException(`Trade com id "${id}" não encontrado`);
    }

    return trade;
  }

  async update(id: string, dto: UpdateTradeDto): Promise<TradeWithCards> {
    const existing = await this.prisma.trade.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Trade com id "${id}" não encontrado`);
    }

    if (existing.status !== TradeStatus.OPEN) {
      throw new ConflictException(
        `Troca com status ${existing.status} não pode ser atualizada`,
      );
    }

    const { status, linkedWishlistId, offeredCards, requestedCards } = dto;

    return this.prisma.trade.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(linkedWishlistId !== undefined && { linkedWishlistId }),
        ...(offeredCards !== undefined && {
          offeredCards: { deleteMany: {}, create: offeredCards },
        }),
        ...(requestedCards !== undefined && {
          requestedCards: { deleteMany: {}, create: requestedCards },
        }),
      },
      include: { offeredCards: true, requestedCards: true },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.trade.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Trade com id "${id}" não encontrado`);
    }

    await this.prisma.trade.delete({ where: { id } });
  }
}
