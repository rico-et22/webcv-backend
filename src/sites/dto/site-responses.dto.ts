import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSiteDto } from './create-site.dto';

export class SiteResponseDto extends CreateSiteDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiPropertyOptional({
    example:
      'https://xyz.supabase.co/storage/v1/object/sign/avatars/user-id/ts.jpg?token=…',
    description:
      'Signed URL (1 hr TTL). Computed from avatarStoragePath at read time. Not an input field.',
  })
  avatarUrl?: string;

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

  @ApiPropertyOptional({
    example:
      'https://xyz.supabase.co/storage/v1/object/sign/avatars/user-id/ts.jpg?token=…',
    description: 'Signed URL (1 hr TTL). Computed from avatarStoragePath at read time.',
  })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'user-id/ts.jpg' })
  avatarStoragePath?: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  updatedAt: string;
}
