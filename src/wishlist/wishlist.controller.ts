import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { WishlistResponseDto } from './dto/wishlist-response.dto';
import { NotFoundResponseDto } from '../common/dto/not-found-response.dto';
import { ValidationErrorResponseDto } from '../common/dto/validation-error-response.dto';

@ApiTags('Wishlists')
@ApiExtraModels(WishlistResponseDto)
@Controller('wishlists')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova wishlist' })
  @ApiCreatedResponse({
    description: 'Wishlist criada com sucesso.',
    type: WishlistResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload invalido para criacao da wishlist.',
    type: ValidationErrorResponseDto,
  })
  create(@Body() createWishlistDto: CreateWishlistDto): Promise<WishlistResponseDto> {
    return this.wishlistService.create(createWishlistDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma wishlist pelo identificador' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da wishlist.',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOkResponse({
    description:
      'Retorna a wishlist quando encontrada. Atualmente, ids inexistentes retornam null com status 200.',
    schema: {
      nullable: true,
      allOf: [{ $ref: getSchemaPath(WishlistResponseDto) }],
    },
  })
  findOne(@Param('id') id: string): Promise<WishlistResponseDto | null> {
    return this.wishlistService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma wishlist existente' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da wishlist.',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOkResponse({
    description: 'Wishlist atualizada com sucesso.',
    type: WishlistResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload invalido para atualizacao da wishlist.',
    type: ValidationErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Wishlist nao encontrada.',
    type: NotFoundResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updateWishlistDto: UpdateWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.update(id, updateWishlistDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover uma wishlist' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da wishlist.',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiNoContentResponse({
    description: 'Wishlist removida com sucesso.',
  })
  @ApiNotFoundResponse({
    description: 'Wishlist nao encontrada.',
    type: NotFoundResponseDto,
  })
  delete(@Param('id') id: string): Promise<void> {
    return this.wishlistService.delete(id);
  }
}
