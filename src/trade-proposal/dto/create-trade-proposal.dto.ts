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

export class TradeProposalOfferedCardDto {
  @ApiProperty({
    description: 'Identificador da carta oferecida.',
    example: 'charizard-base-set',
  })
  @IsString()
  @IsNotEmpty()
  cardId: string;

  @ApiProperty({
    description: 'Quantidade da carta oferecida.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateTradeProposalDto {
  @ApiProperty({
    description: 'Identificador da troca a receber a proposta.',
    format: 'uuid',
    example: '8d5530de-bd66-4de9-bf68-ddf0fd49b7f2',
  })
  @IsUUID('4')
  tradeId: string;

  @ApiProperty({
    description: 'Identificador do usuario proponente.',
    example: 'misty-waterflower',
  })
  @IsString()
  @IsNotEmpty()
  proposerId: string;

  @ApiPropertyOptional({
    description: 'Mensagem opcional enviada junto com a proposta.',
    example: 'Posso incluir uma carta rara adicional nesta troca.',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: 'Cartas oferecidas como parte da proposta.',
    type: [TradeProposalOfferedCardDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeProposalOfferedCardDto)
  offeredCards: TradeProposalOfferedCardDto[];
}
