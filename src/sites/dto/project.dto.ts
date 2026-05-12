import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class ProjectDto {
  @ApiProperty({ example: 'webCV' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'A portfolio site generator for IT professionals.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://github.com/kamilpawlak/webcv' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    example:
      '50b61a6d-37d2-473c-a00b-b2da9d1caf9b/22de84be-e6ab-4fbb-9a58-a132f51fb97c/1774082008960.png',
    description:
      'Supabase Storage path in the screenshots bucket. The generator derives the public URL from this at render time.',
  })
  @IsOptional()
  @IsString()
  imageStoragePath?: string;
}
