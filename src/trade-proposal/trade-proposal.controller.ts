import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TradeProposalService } from './trade-proposal.service';
import { CreateTradeProposalDto } from './dto/create-trade-proposal.dto';
import { UpdateTradeProposalDto } from './dto/update-trade-proposal.dto';
import { TradeProposalResponseDto } from './dto/trade-proposal-response.dto';
import { ValidationErrorResponseDto } from '../common/dto/validation-error-response.dto';
import { NotFoundResponseDto } from '../common/dto/not-found-response.dto';

@ApiTags('Trade Proposals')
@Controller('trade-proposals')
export class TradeProposalController {
  constructor(private readonly tradeProposalService: TradeProposalService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova proposta de troca' })
  @ApiCreatedResponse({
    description: 'Proposta criada com sucesso.',
    type: TradeProposalResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido para criação da proposta.',
    type: ValidationErrorResponseDto,
  })
  create(
    @Body() createTradeProposalDto: CreateTradeProposalDto,
  ): Promise<TradeProposalResponseDto> {
    return this.tradeProposalService.create(createTradeProposalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as propostas de troca' })
  @ApiOkResponse({
    description: 'Lista retornada.',
    type: [TradeProposalResponseDto],
  })
  findAll(
    @Query('tradeId') tradeId?: string,
  ): Promise<TradeProposalResponseDto[]> {
    return this.tradeProposalService.findAll(tradeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar proposta pelo id' })
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({
    description: 'Proposta encontrada.',
    type: TradeProposalResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Proposta não encontrada.',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string): Promise<TradeProposalResponseDto> {
    return this.tradeProposalService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar status da proposta' })
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({
    description: 'Proposta atualizada.',
    type: TradeProposalResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido.',
    type: ValidationErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Proposta não encontrada.',
    type: NotFoundResponseDto,
  })
  @ApiConflictResponse({
    description: 'Proposta não está com status PENDING.',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTradeProposalDto,
  ): Promise<TradeProposalResponseDto> {
    return this.tradeProposalService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover proposta' })
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiNoContentResponse({ description: 'Proposta removida.' })
  @ApiNotFoundResponse({
    description: 'Proposta não encontrada.',
    type: NotFoundResponseDto,
  })
  delete(@Param('id') id: string): Promise<void> {
    return this.tradeProposalService.delete(id);
  }
}
