import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { TradeProposalService } from './trade-proposal.service';
import { CreateTradeProposalDto } from './dto/create-trade-proposal.dto';
import { TradeProposalResponseDto } from './dto/trade-proposal-response.dto';
import { ValidationErrorResponseDto } from '../common/dto/validation-error-response.dto';

@ApiTags('Trade Proposals')
@ApiExtraModels(TradeProposalResponseDto)
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
}
