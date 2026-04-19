import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'authenticated' })
  role: string;

  @ApiProperty({ example: '2026-01-01T12:00:00Z' })
  created_at: string;
}
