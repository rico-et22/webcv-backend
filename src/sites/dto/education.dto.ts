import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EducationDto {
  @ApiProperty({ example: 'WSIiZ Rzeszów' })
  @IsString()
  @IsNotEmpty()
  institution: string;

  @ApiProperty({ example: 'Bachelor of Computer Science' })
  @IsString()
  @IsNotEmpty()
  degree: string;

  @ApiProperty({ example: '2023-10' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ example: '2027-06' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
