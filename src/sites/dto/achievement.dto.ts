import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AchievementDto {
  @ApiProperty({ example: '1st place — University Hackathon 2024' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Built a real-time collaboration tool in 24h.' })
  @IsOptional()
  @IsString()
  description?: string;
}
