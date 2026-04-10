import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { TradeResponseDto } from './dto/trade-response.dto';
import { NotFoundResponseDto } from '../common/dto/not-found-response.dto';
import { ValidationErrorResponseDto } from '../common/dto/validation-error-response.dto';

@ApiTags('Trades')
@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma troca' })
  @ApiCreatedResponse({
    description: 'Troca criada com sucesso.',
    type: TradeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido para criação da troca.',
    type: ValidationErrorResponseDto,
  })
  create(@Body() createTradeDto: CreateTradeDto): Promise<TradeResponseDto> {
    return this.tradesService.create(createTradeDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma troca por ID' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da troca.',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOkResponse({
    description: 'Troca encontrada.',
    type: TradeResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Troca não encontrada.',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string): Promise<TradeResponseDto> {
    return this.tradesService.findOne(id);
  }
}
