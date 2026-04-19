import { ApiProperty } from '@nestjs/swagger';
import { CreateSiteDto } from './create-site.dto';

export class SiteResponseDto extends CreateSiteDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  user_id: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  created_at: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  updated_at: string;
}

export class SiteSummaryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Kamil Pawlak' })
  full_name: string;

  @ApiProperty({ example: 'Full-Stack Developer', required: false })
  job_title?: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  avatar_url?: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  created_at: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  updated_at: string;
}
