import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './user.entity';
import { Personnel } from '../personnel/personnel.entity';
import { AuthLog } from './entities/auth-log.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Personnel, AuthLog]),
    JwtModule.register({
      global: true,
      // main.ts refuses to boot if this isn't set — no literal fallback.
      secret: process.env.JWT_SECRET as string,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}