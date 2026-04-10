import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WishlistItemType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWishlistItemDto {
  @ApiProperty({
    description: 'Tipo do item desejado na wishlist.',
    enum: WishlistItemType,
    example: WishlistItemType.FILTER,
  })
  @IsEnum(WishlistItemType)
  itemType: WishlistItemType;

  @ApiPropertyOptional({
    description: 'Identificador da carta quando o item representa uma carta especifica.',
    format: 'uuid',
    nullable: true,
    example: 'a78df551-23ad-4eb2-8a9a-7090d455e44d',
  })
  @IsOptional()
  @IsUUID('4')
  cardId?: string | null;

  @ApiPropertyOptional({
    description: 'Filtro textual aplicado ao tipo da carta.',
    nullable: true,
    example: 'Trainer',
  })
  @IsOptional()
  @IsString()
  filterType?: string | null;

  @ApiPropertyOptional({
    description: 'Filtro textual aplicado a raridade da carta.',
    nullable: true,
    example: 'Ultra Rare',
  })
  @IsOptional()
  @IsString()
  filterRarity?: string | null;
}

export class UpdateWishlistDto {
  @ApiPropertyOptional({
    description: 'Novo nome da wishlist.',
    example: 'Wishlist atualizada do Ash',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Nova lista completa de itens da wishlist. Quando enviada, substitui os itens atuais.',
    type: [UpdateWishlistItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateWishlistItemDto)
  items?: UpdateWishlistItemDto[];
}
