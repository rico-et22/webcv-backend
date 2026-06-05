import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';

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
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    example:
      '50b61a6d-37d2-473c-a00b-b2da9d1caf9b/22de84be-e6ab-4fbb-9a58-a132f51fb97c/1774082008960.png',
    description:
      'Supabase Storage path in the screenshots bucket. Pass this when creating/updating a site.',
  })
  @IsOptional()
  @IsString()
  imageStoragePath?: string;

  @ApiPropertyOptional({
    example:
      'https://xyz.supabase.co/storage/v1/object/sign/screenshots/user-id/ts.png?token=…',
    description:
      'Signed URL (1 hr TTL). Computed from imageStoragePath at read time. Accepted on input and stripped — never persisted.',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

