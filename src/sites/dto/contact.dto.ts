import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsUrl, ValidateIf } from 'class-validator';

export class ContactDto {
  @ApiPropertyOptional({ example: 'kamil@example.com' })
  @ValidateIf((o) => o.email !== undefined && o.email !== '')
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+48 123 456 789' })
  @ValidateIf((o) => o.phone !== undefined && o.phone !== '')
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/kamilpawlak' })
  @ValidateIf((o) => o.linkedin !== undefined && o.linkedin !== '')
  @IsUrl()
  linkedin?: string;

  @ApiPropertyOptional({ example: 'https://github.com/kamilpawlak' })
  @ValidateIf((o) => o.github !== undefined && o.github !== '')
  @IsUrl()
  github?: string;

  @ApiPropertyOptional({ example: 'https://kamilpawlak.com' })
  @ValidateIf((o) => o.website !== undefined && o.website !== '')
  @IsUrl()
  website?: string;
}
