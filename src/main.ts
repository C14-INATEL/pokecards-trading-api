import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PokeCards Trading API')
    .setDescription(
      'Documentacao dos endpoints disponiveis para gerenciamento de wishlists e propostas de troca.',
    )
    .setVersion('1.0.0')
    .addTag('Wishlists', 'Operacoes para criar, consultar, atualizar e remover wishlists.')
    .addTag('Trade Proposals', 'Operacoes para registrar propostas de troca.')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    customSiteTitle: 'PokeCards Trading API Docs',
    jsonDocumentUrl: 'docs/json',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
