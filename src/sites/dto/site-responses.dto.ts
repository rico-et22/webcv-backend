import { ApiProperty } from '@nestjs/swagger';
import { CreateSiteDto } from './create-site.dto';

export class SiteResponseDto extends CreateSiteDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  updatedAt: string;
}

export class SiteSummaryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Kamil Pawlak' })
  fullName: string;

  @ApiProperty({ example: 'Full-Stack Developer', required: false })
  jobTitle?: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  avatarUrl?: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  updatedAt: string;
}
