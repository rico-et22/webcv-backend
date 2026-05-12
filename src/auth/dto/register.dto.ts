import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass1', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])/, {
    message: 'password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*[0-9])/, {
    message: 'password must contain at least one number',
  })
  password: string;
}
