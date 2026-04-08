import { PickType } from '@nestjs/mapped-types';
import { CreateSiteDto } from '../../sites/dto/create-site.dto';

export class AnalyzeCvResponseDto extends PickType(CreateSiteDto, [
  'fullName',
  'jobTitle',
  'location',
  'bio',
  'contacts',
  'skills',
  'experience',
  'education',
] as const) {}
