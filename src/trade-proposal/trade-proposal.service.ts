import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeProposalDto } from './dto/create-trade-proposal.dto';
import { ProposalStatus, TradeProposal, ProposalItem } from '@prisma/client';

type TradeProposalWithItems = TradeProposal & { offeredCards: ProposalItem[] };

@Injectable()
export class TradeProposalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createTradeProposalDto: CreateTradeProposalDto,
  ): Promise<TradeProposalWithItems> {
    const { tradeId, proposerId, message, offeredCards } =
      createTradeProposalDto;

    if (!tradeId || !proposerId) {
      throw new BadRequestException(
        'tradeId and proposerId are required fields',
      );
    }

    return this.prisma.tradeProposal.create({
      data: {
        tradeId,
        proposerId,
        message: message ?? null,
        status: ProposalStatus.PENDING,
        offeredCards: {
          create: offeredCards ?? [],
        },
      },
      include: { offeredCards: true },
    });
  }
}
