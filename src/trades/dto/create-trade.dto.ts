import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class TradeCardDto {
  @ApiProperty({
    description: 'Identificador da carta.',
    example: 'charizard-base-set',
  })
  @IsString()
  @IsNotEmpty()
  cardId: string;

  @ApiProperty({
    description: 'Quantidade da carta.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateTradeDto {
  @ApiProperty({
    description: 'Identificador do dono da troca.',
    example: 'ash-ketchum',
  })
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiPropertyOptional({
    description: 'Identificador de uma wishlist vinculada à troca.',
    format: 'uuid',
    example: '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
  })
  @IsOptional()
  @IsUUID('4')
  linkedWishlistId?: string;

  @ApiProperty({
    description: 'Cartas oferecidas na troca.',
    type: [TradeCardDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeCardDto)
  offeredCards: TradeCardDto[];

  @ApiProperty({
    description: 'Cartas solicitadas na troca.',
    type: [TradeCardDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeCardDto)
  requestedCards: TradeCardDto[];
}
