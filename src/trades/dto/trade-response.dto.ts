import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TradeStatus } from '@prisma/client';

export class TradeItemResponseDto {
  @ApiProperty({
    description: 'Identificador do item.',
    format: 'uuid',
    example: '3fb52d0f-3d65-4113-bd1f-4478f8581e4f',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador da carta.',
    example: 'charizard-base-set',
  })
  cardId: string;

  @ApiProperty({
    description: 'Quantidade da carta.',
    example: 1,
  })
  quantity: number;
}

export class TradeResponseDto {
  @ApiProperty({
    description: 'Identificador da troca.',
    format: 'uuid',
    example: '10a4a04f-3f13-4ed5-989e-0d87868fb306',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador do dono da troca.',
    example: 'ash-ketchum',
  })
  ownerId: string;

  @ApiProperty({
    description: 'Status atual da troca.',
    enum: TradeStatus,
    example: TradeStatus.OPEN,
  })
  status: TradeStatus;

  @ApiPropertyOptional({
    description: 'Identificador de uma wishlist vinculada à troca.',
    format: 'uuid',
    nullable: true,
    example: '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
  })
  linkedWishlistId: string | null;

  @ApiProperty({
    description: 'Cartas oferecidas na troca.',
    type: [TradeItemResponseDto],
  })
  offeredCards: TradeItemResponseDto[];

  @ApiProperty({
    description: 'Cartas solicitadas na troca.',
    type: [TradeItemResponseDto],
  })
  requestedCards: TradeItemResponseDto[];

  @ApiProperty({
    description: 'Data de criação da troca.',
    type: String,
    format: 'date-time',
    example: '2026-04-10T16:08:45.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização da troca.',
    type: String,
    format: 'date-time',
    example: '2026-04-10T16:08:45.000Z',
  })
  updatedAt: Date;
}
