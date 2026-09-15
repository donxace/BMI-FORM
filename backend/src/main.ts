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

  // Passing '0.0.0.0' explicitly here would bind IPv4-only — Node then
  // never listens on ::1, so a browser that resolves "localhost" to its
  // IPv6 loopback address gets a hard connection-refused ("Failed to
  // fetch"), even though curl/other tools on the same machine often
  // succeed by preferring IPv4. Omitting the host binds the unspecified
  // IPv6 address instead, which is dual-stack by default on Windows/Linux
  // (still reachable by IPv4 LAN clients via an IPv4-mapped address) —
  // this keeps the "reachable from other machines on the LAN" goal while
  // also covering IPv6 loopback.
  await app.listen(3000);

  console.log(
    'NestJS running on port 3000 (all interfaces, IPv4 + IPv6)',
  );
}

bootstrap();
