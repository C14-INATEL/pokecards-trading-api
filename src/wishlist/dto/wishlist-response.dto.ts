import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WishlistItemType } from '@prisma/client';

export class WishlistItemResponseDto {
  @ApiProperty({
    description: 'Identificador do item da wishlist.',
    format: 'uuid',
    example: '4f2e0d8a-3292-4a52-87ec-2d283f0155e5',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador da wishlist associada ao item.',
    format: 'uuid',
    example: '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
  })
  wishlistId: string;

  @ApiProperty({
    description: 'Tipo do item registrado na wishlist.',
    enum: WishlistItemType,
    example: WishlistItemType.SPECIFIC_CARD,
  })
  itemType: WishlistItemType;

  @ApiPropertyOptional({
    description: 'Identificador da carta desejada quando o item e especifico.',
    format: 'uuid',
    nullable: true,
    example: 'a78df551-23ad-4eb2-8a9a-7090d455e44d',
  })
  cardId?: string | null;

  @ApiPropertyOptional({
    description: 'Filtro textual por tipo de carta.',
    nullable: true,
    example: 'Pokemon',
  })
  filterType?: string | null;

  @ApiPropertyOptional({
    description: 'Filtro textual por raridade.',
    nullable: true,
    example: 'Rare Holo',
  })
  filterRarity?: string | null;
}

export class WishlistResponseDto {
  @ApiProperty({
    description: 'Identificador da wishlist.',
    format: 'uuid',
    example: '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador do usuario dono da wishlist.',
    example: 'ash-ketchum',
  })
  userId: string;

  @ApiProperty({
    description: 'Nome da wishlist.',
    example: 'Wishlist principal do Ash',
  })
  name: string;

  @ApiProperty({
    description: 'Data de criacao da wishlist.',
    type: String,
    format: 'date-time',
    example: '2026-04-10T15:22:31.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Itens associados a wishlist.',
    type: [WishlistItemResponseDto],
  })
  items: WishlistItemResponseDto[];
}
