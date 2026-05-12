import { ApiProperty } from '@nestjs/swagger';
import { AnalyzeCvResponseDto } from './analyze-cv-response.dto';

export class AnalyzeCvEnvelopeDto {
  @ApiProperty({ type: () => AnalyzeCvResponseDto })
  data: AnalyzeCvResponseDto;

  @ApiProperty({ example: 'CV analyzed successfully' })
  message: string;
}
