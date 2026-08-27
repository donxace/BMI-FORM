import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PersonnelLoginDto } from './dto/personnel-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
    async login(@Body() loginDto: LoginDto) {
  console.log('BODY:', loginDto);

  return this.authService.validateAndLogin(loginDto);
}

  @HttpCode(HttpStatus.OK)
  @Post('personnel-login')
  async personnelLogin(@Body() dto: PersonnelLoginDto) {
    console.log('PERSONNEL LOGIN:', dto.rfid_uid);

    return this.authService.personnelLogin(dto);
  }
}