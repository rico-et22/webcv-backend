import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class ProjectDto {
  @ApiProperty({ example: 'webCV' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'A portfolio site generator for IT professionals.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://github.com/kamilpawlak/webcv' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: 'https://example.com/screenshot.png' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
