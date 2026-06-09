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
    description: 'Payload inválido para criação da wishlist.',
    type: ValidationErrorResponseDto,
  })
  create(
    @Body() createWishlistDto: CreateWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.create(createWishlistDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as wishlists' })
  @ApiOkResponse({
    description: 'Lista de wishlists retornada com sucesso.',
    type: [WishlistResponseDto],
  })
  findAll(): Promise<WishlistResponseDto[]> {
    return this.wishlistService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma wishlist pelo identificador' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da wishlist.',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOkResponse({
    description: 'Wishlist encontrada com sucesso.',
    type: WishlistResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Wishlist não encontrada.',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string): Promise<WishlistResponseDto> {
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
    description: 'Payload inválido para atualização da wishlist.',
    type: ValidationErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Wishlist não encontrada.',
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
    description: 'Wishlist não encontrada.',
    type: NotFoundResponseDto,
  })
  delete(@Param('id') id: string): Promise<void> {
    return this.wishlistService.delete(id);
  }
}
