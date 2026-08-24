import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips properties not defined in the DTO
    transform: true, // Automatically converts payloads to DTO instances
  }
  ));

  await app.listen(3000, '0.0.0.0');

  console.log(
    'NestJS running on http://0.0.0.0:3000',
  );
}

bootstrap();