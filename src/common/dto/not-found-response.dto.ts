import { ApiProperty } from '@nestjs/swagger';

export class NotFoundResponseDto {
  @ApiProperty({
    description: 'Codigo HTTP retornado pela API.',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem descritiva do erro.',
    example: 'Wishlist with id "8d5530de-bd66-4de9-bf68-ddf0fd49b7f2" not found',
  })
  message: string;

  @ApiProperty({
    description: 'Descricao resumida da categoria do erro.',
    example: 'Not Found',
  })
  error: string;
}
