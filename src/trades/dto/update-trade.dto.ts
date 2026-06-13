import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TradeStatus } from '@prisma/client';
import { TradeCardDto } from './create-trade.dto';

export class UpdateTradeDto {
  @ApiPropertyOptional({
    description: 'Novo status da troca.',
    enum: TradeStatus,
    example: TradeStatus.CANCELLED,
  })
  @IsOptional()
  @IsEnum(TradeStatus)
  status?: TradeStatus;

  @ApiPropertyOptional({
    description: 'Identificador de uma wishlist vinculada à troca.',
    format: 'uuid',
    example: '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
  })
  @IsOptional()
  @IsUUID('4')
  linkedWishlistId?: string;

  @ApiPropertyOptional({
    description:
      'Nova lista de cartas oferecidas. Quando enviada, substitui as cartas atuais.',
    type: [TradeCardDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeCardDto)
  offeredCards?: TradeCardDto[];

  @ApiPropertyOptional({
    description:
      'Nova lista de cartas solicitadas. Quando enviada, substitui as cartas atuais.',
    type: [TradeCardDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeCardDto)
  requestedCards?: TradeCardDto[];
}
