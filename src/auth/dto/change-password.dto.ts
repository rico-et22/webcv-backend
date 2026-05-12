import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass1' })
  @IsString()
  currentPassword: string;

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
