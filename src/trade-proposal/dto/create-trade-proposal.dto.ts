export class CreateTradeProposalDto {
  tradeId: string;
  proposerId: string;
  message?: string;
  offeredCards: Array<{
    cardId: string;
    quantity: number;
  }>;
}
