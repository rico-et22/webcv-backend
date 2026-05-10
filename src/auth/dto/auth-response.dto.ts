import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: 'eeb0e10b-f4ba-45ba-8cf8-19ba470be92e' })
  id: string;

  @ApiProperty({ example: 'authenticated' })
  aud: string;

  @ApiProperty({ example: 'authenticated' })
  role: string;

  @ApiProperty({ example: 'ricoet22+test1@gmail.com' })
  email: string;

  @ApiProperty({ example: '2026-04-19T13:38:38.93126Z' })
  created_at: string;

  @ApiProperty({ example: '2026-05-10T19:24:01.952497Z' })
  updated_at: string;
}

export class AuthSessionDataDto {
  @ApiProperty({ example: 'eyJhbGciOiJFUzI1NiIs...' })
  access_token: string;

  @ApiProperty({ example: 'psnzwhdbv64i' })
  refresh_token: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthSessionDataDto })
  data: AuthSessionDataDto;

  @ApiProperty({ example: 'Login successful' })
  message: string;
}

export class RegisterResponseDto {
  @ApiProperty({ type: AuthUserDto })
  data: AuthUserDto;

  @ApiProperty({ example: 'Registration successful. Please verify your email.' })
  message: string;
}
