import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeProposalDto } from './dto/create-trade-proposal.dto';
import { UpdateTradeProposalDto } from './dto/update-trade-proposal.dto';
import {
  ProposalStatus,
  TradeStatus,
  TradeProposal,
  ProposalItem,
} from '@prisma/client';

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
    dto: UpdateTradeProposalDto,
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
      throw new ConflictException(
        `Proposta com status ${existing.status} não pode ser atualizada`,
      );
    }
    const updated = await this.prisma.tradeProposal.update({
      where: { id },
      data: { status: dto.status },
      include: { offeredCards: true },
    });

    if (dto.status === ProposalStatus.ACCEPTED) {
      await this.prisma.tradeProposal.updateMany({
        where: {
          tradeId: existing.tradeId,
          id: { not: id },
          status: ProposalStatus.PENDING,
        },
        data: { status: ProposalStatus.CANCELLED },
      });

      await this.prisma.trade.update({
        where: { id: existing.tradeId },
        data: { status: TradeStatus.CONCLUDED },
      });
    }

    return updated;
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
