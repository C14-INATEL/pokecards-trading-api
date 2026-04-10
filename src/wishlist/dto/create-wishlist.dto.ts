// dto/create-wishlist.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WishlistItemType } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WishlistItemDto {
  @ApiProperty({
    description: 'Tipo do item desejado na wishlist.',
    enum: WishlistItemType,
    example: WishlistItemType.SPECIFIC_CARD,
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
  cardId?: string;

  @ApiPropertyOptional({
    description: 'Filtro textual aplicado ao tipo da carta.',
    nullable: true,
    example: 'Pokemon',
  })
  @IsOptional()
  @IsString()
  filterType?: string;

  @ApiPropertyOptional({
    description: 'Filtro textual aplicado a raridade da carta.',
    nullable: true,
    example: 'Rare Holo',
  })
  @IsOptional()
  @IsString()
  filterRarity?: string;
}

export class CreateWishlistDto {
  @ApiProperty({
    description: 'Identificador do usuario dono da wishlist.',
    example: 'ash-ketchum',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Nome da wishlist.',
    example: 'Wishlist principal do Ash',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Itens desejados na wishlist.',
    type: [WishlistItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items: WishlistItemDto[];
}
