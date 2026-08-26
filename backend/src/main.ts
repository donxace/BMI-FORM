import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for LAN access
  app.enableCors({
    origin: true, // Allows all origins, or specify: ['http://localhost:5173', 'http://192.168.1.15:5173']
    credentials: true,
  });


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