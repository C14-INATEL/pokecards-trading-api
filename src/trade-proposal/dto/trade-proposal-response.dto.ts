import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProposalStatus } from '@prisma/client';

export class ProposalItemResponseDto {
  @ApiProperty({
    description: 'Identificador do item oferecido na proposta.',
    format: 'uuid',
    example: '3fb52d0f-3d65-4113-bd1f-4478f8581e4f',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador da carta oferecida.',
    example: 'charizard-base-set',
  })
  cardId: string;

  @ApiProperty({
    description: 'Quantidade da carta oferecida.',
    example: 1,
  })
  quantity: number;

  @ApiProperty({
    description: 'Identificador da proposta associada.',
    format: 'uuid',
    example: '10a4a04f-3f13-4ed5-989e-0d87868fb306',
  })
  proposalId: string;
}

export class TradeProposalResponseDto {
  @ApiProperty({
    description: 'Identificador da proposta.',
    format: 'uuid',
    example: '10a4a04f-3f13-4ed5-989e-0d87868fb306',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador da troca associada a proposta.',
    format: 'uuid',
    example: '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
  })
  tradeId: string;

  @ApiProperty({
    description: 'Identificador do usuario que enviou a proposta.',
    example: 'misty-waterflower',
  })
  proposerId: string;

  @ApiProperty({
    description: 'Status atual da proposta.',
    enum: ProposalStatus,
    example: ProposalStatus.PENDING,
  })
  status: ProposalStatus;

  @ApiPropertyOptional({
    description: 'Mensagem opcional enviada junto com a proposta.',
    nullable: true,
    example: 'Posso incluir uma carta rara adicional nesta troca.',
  })
  message?: string | null;

  @ApiProperty({
    description: 'Data de criacao da proposta.',
    type: String,
    format: 'date-time',
    example: '2026-04-10T16:08:45.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Cartas oferecidas na proposta.',
    type: [ProposalItemResponseDto],
  })
  offeredCards: ProposalItemResponseDto[];
}
