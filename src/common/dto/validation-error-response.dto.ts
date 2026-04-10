import { ApiProperty } from '@nestjs/swagger';

export class ValidationErrorResponseDto {
  @ApiProperty({
    description: 'Codigo HTTP retornado pela API.',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Lista de mensagens de validacao.',
    type: [String],
    example: ['name should not be empty', 'items must be an array'],
  })
  message: string[];

  @ApiProperty({
    description: 'Descricao resumida da categoria do erro.',
    example: 'Bad Request',
  })
  error: string;
}
