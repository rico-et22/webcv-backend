import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsUrl, ValidateIf } from 'class-validator';

export class ContactDto {
  @ApiPropertyOptional({ example: 'kamil@example.com' })
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+48 123 456 789' })
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/kamilpawlak' })
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsUrl()
  linkedin?: string;

  @ApiPropertyOptional({ example: 'https://github.com/kamilpawlak' })
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsUrl()
  github?: string;

  @ApiPropertyOptional({ example: 'https://kamilpawlak.com' })
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsUrl()
  website?: string;
}
