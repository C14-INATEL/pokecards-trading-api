import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(id: string): Promise<TradeProposalWithItems> {
    const proposal = await this.prisma.tradeProposal.findUnique({
      where: { id },
      include: { offeredCards: true },
    });
    if (!proposal) {
      throw new NotFoundException(
        `TradeProposal com id "${id}" não encontrado`,
      );
    }
    return proposal;
  }

  async findAll(tradeId?: string): Promise<TradeProposalWithItems[]> {
    return this.prisma.tradeProposal.findMany({
      where: tradeId ? { tradeId } : undefined,
      include: { offeredCards: true },
    });
  }

  async update(
    id: string,
    status: ProposalStatus,
  ): Promise<TradeProposalWithItems> {
    const existing = await this.prisma.tradeProposal.findUnique({
      where: { id },
      include: { offeredCards: true },
    });
    if (!existing) {
      throw new NotFoundException(
        `TradeProposal com id "${id}" não encontrado`,
      );
    }
    if (existing.status !== ProposalStatus.PENDING) {
      throw new Error(
        `Cannot update proposal with status ${existing.status}`,
      );
    }
    return this.prisma.tradeProposal.update({
      where: { id },
      data: { status },
      include: { offeredCards: true },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.tradeProposal.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        `TradeProposal com id "${id}" não encontrado`,
      );
    }
    await this.prisma.tradeProposal.delete({ where: { id } });
  }
}
