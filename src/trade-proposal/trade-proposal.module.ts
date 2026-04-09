import { Module } from '@nestjs/common';
import { TradeProposalService } from './trade-proposal.service';
import { TradeProposalController } from './trade-proposal.controller';

@Module({
  controllers: [TradeProposalController],
  providers: [TradeProposalService],
})
export class TradeProposalModule {}
