import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class ContactDto {
  @ApiPropertyOptional({ example: 'kamil@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+48 123 456 789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/kamilpawlak' })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiPropertyOptional({ example: 'https://github.com/kamilpawlak' })
  @IsOptional()
  @IsUrl()
  github?: string;

  @ApiPropertyOptional({ example: 'https://kamilpawlak.com' })
  @IsOptional()
  @IsUrl()
  website?: string;
}
