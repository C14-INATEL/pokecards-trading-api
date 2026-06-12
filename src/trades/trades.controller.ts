import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
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

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma troca' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da troca.',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOkResponse({
    description: 'Troca atualizada.',
    type: TradeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido para atualização da troca.',
    type: ValidationErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Troca não encontrada.',
    type: NotFoundResponseDto,
  })
  @ApiConflictResponse({
    description: 'Troca não está com status OPEN.',
  })
  update(
    @Param('id') id: string,
    @Body() updateTradeDto: UpdateTradeDto,
  ): Promise<TradeResponseDto> {
    return this.tradesService.update(id, updateTradeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover uma troca' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da troca.',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiNoContentResponse({ description: 'Troca removida.' })
  @ApiNotFoundResponse({
    description: 'Troca não encontrada.',
    type: NotFoundResponseDto,
  })
  delete(@Param('id') id: string): Promise<void> {
    return this.tradesService.delete(id);
  }
}
