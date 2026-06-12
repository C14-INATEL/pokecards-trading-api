import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProposalStatus } from '@prisma/client';

export class UpdateTradeProposalDto {
  @ApiPropertyOptional({
    description: 'Novo status da proposta.',
    enum: ProposalStatus,
    example: ProposalStatus.ACCEPTED,
  })
  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;
}
