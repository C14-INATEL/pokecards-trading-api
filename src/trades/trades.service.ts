import { Injectable, NotFoundException } from '@nestjs/common';
import { TradeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type TradeItemData = {
  id: string;
  cardId: string;
  quantity: number;
  offeredTradeId: string | null;
  requestedTradeId: string | null;
};

export type TradeWithCards = {
  id: string;
  ownerId: string;
  status: TradeStatus;
  linkedWishlistId: string | null;
  createdAt: Date;
  updatedAt: Date;
  offeredCards: TradeItemData[];
  requestedCards: TradeItemData[];
};

export type CreateTradeInput = {
  ownerId: string;
  linkedWishlistId?: string | null;
  offeredCards: { cardId: string; quantity: number }[];
  requestedCards: { cardId: string; quantity: number }[];
};

@Injectable()
export class TradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(_dto: CreateTradeInput): Promise<TradeWithCards> {
    throw new Error('Not implemented');
  }

  async findOne(_id: string): Promise<TradeWithCards> {
    throw new NotFoundException('Not implemented');
  }
}
