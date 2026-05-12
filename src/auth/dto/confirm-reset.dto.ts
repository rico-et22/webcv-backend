import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ConfirmResetDto {
  @ApiProperty({
    description:
      'Access token from the Supabase password reset link (hash fragment)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  accessToken: string;

  @ApiProperty({ example: 'NewPass1', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])/, {
    message: 'newPassword must contain at least one uppercase letter',
  })
  @Matches(/(?=.*[0-9])/, {
    message: 'newPassword must contain at least one number',
  })
  newPassword: string;
}
