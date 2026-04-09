import { Controller, Post, Body } from '@nestjs/common';
import { TradeProposalService } from './trade-proposal.service';
import { CreateTradeProposalDto } from './dto/create-trade-proposal.dto';

@Controller('trade-proposals')
export class TradeProposalController {
  constructor(private readonly tradeProposalService: TradeProposalService) {}

  @Post()
  create(@Body() createTradeProposalDto: CreateTradeProposalDto) {
    return this.tradeProposalService.create(createTradeProposalDto);
  }
}
