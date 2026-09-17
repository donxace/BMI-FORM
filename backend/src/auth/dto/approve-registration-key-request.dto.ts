import { IsNotEmpty, IsString } from 'class-validator';

// Body for POST /auth/registration-keys/requests/:id/approve — the admin
// picks which tier the resulting key grants (see GenerateRegistrationKeyDto
// for why this isn't a static @IsIn: validity depends on the request's own
// system, resolved server-side in AuthService.approveRegistrationKeyRequest).
export class ApproveRegistrationKeyRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'A role is required to approve this request.' })
  role!: string;
}
