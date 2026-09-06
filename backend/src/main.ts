import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { corsOriginCallback } from './common/cors-origin';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is not set. Copy backend/.env.example to backend/.env and fill it in.',
    );
  }

  const app = await NestFactory.create(AppModule);

  // LAN-only CORS — see cors-origin.ts for exactly what's allowed and why
  // this isn't just `origin: true` any more.
  app.enableCors({
    origin: corsOriginCallback,
    credentials: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());

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
