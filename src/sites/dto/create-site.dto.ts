import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AchievementDto } from './achievement.dto';
import { ContactDto } from './contact.dto';
import { EducationDto } from './education.dto';
import { ExperienceDto } from './experience.dto';
import { ProjectDto } from './project.dto';

export class CreateSiteDto {
  @ApiProperty({ example: 'Kamil Pawlak' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: 'Full-Stack Developer' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Rzeszów, Poland' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: 'Passionate developer with 3+ years of experience...',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://example.com/storage/avatar.png' })
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'user-id/site-id/avatar.png' })
  @IsOptional()
  @IsString()
  avatarStoragePath?: string;

  @ApiPropertyOptional({ type: () => ContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contacts?: ContactDto;

  @ApiPropertyOptional({ example: ['TypeScript', 'NestJS', 'React'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ type: () => [ExperienceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];

  @ApiPropertyOptional({ type: () => [EducationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @ApiPropertyOptional({ type: () => [ProjectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects?: ProjectDto[];

  @ApiPropertyOptional({ type: () => [AchievementDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AchievementDto)
  achievements?: AchievementDto[];
}
