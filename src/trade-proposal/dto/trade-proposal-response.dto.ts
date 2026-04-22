import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProposalStatus } from '@prisma/client';

export class ProposalItemResponseDto {
  @ApiProperty({
    description: 'Identificador do item da proposta.',
    format: 'uuid',
    example: '4f2e0d8a-3292-4a52-87ec-2d283f0155e5',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador da proposta associada ao item.',
    format: 'uuid',
    example: '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
  })
  proposalId: string;

  @ApiProperty({
    description: 'Identificador da carta oferecida.',
    format: 'uuid',
    example: 'a78df551-23ad-4eb2-8a9a-7090d455e44d',
  })
  cardId: string;

  @ApiProperty({
    description: 'Quantidade da carta oferecida.',
    example: 2,
  })
  quantity: number;
}

export class TradeProposalResponseDto {
  @ApiProperty({
    description: 'Identificador da proposta.',
    format: 'uuid',
    example: '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador da trade associada.',
    format: 'uuid',
    example: '3a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
  })
  tradeId: string;

  @ApiProperty({
    description: 'Identificador do usuário que fez a proposta.',
    example: 'ash-ketchum',
  })
  proposerId: string;

  @ApiProperty({
    description: 'Status atual da proposta.',
    enum: ProposalStatus,
    example: ProposalStatus.PENDING,
  })
  status: ProposalStatus;

  @ApiPropertyOptional({
    description: 'Mensagem opcional enviada com a proposta.',
    nullable: true,
    example: 'Tenho interesse nas suas cartas raras!',
  })
  message?: string | null;

  @ApiProperty({
    description: 'Data de criação da proposta.',
    type: String,
    format: 'date-time',
    example: '2026-04-10T15:22:31.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Cartas oferecidas na proposta.',
    type: [ProposalItemResponseDto],
  })
  offeredCards: ProposalItemResponseDto[];
}
