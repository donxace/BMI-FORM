import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  // Accepts either the account's username or its email — whichever the
  // user has on hand. Resolved to a single account server-side.
  @IsString()
  @IsNotEmpty()
  identifier!: string;
}
