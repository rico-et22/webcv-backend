import {
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AnalyzeCvResponseDto } from './dto/analyze-cv-response.dto';
import { AnalyzeCvEnvelopeDto } from './dto/analyze-cv-envelope.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('analyze-cv')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary:
      'Parse a PDF CV and return prefilled portfolio data using Gemini AI',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF CV file (max 5 MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'CV analyzed — returns prefilled portfolio fields extracted from the PDF',
    type: AnalyzeCvEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No file, wrong MIME type, file too large, or parse failure',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 429,
    description: 'Rate limit: wait 30s between calls',
  })
  async analyzeCv(
    @Request() req: { user: { sub: string } },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ data: AnalyzeCvResponseDto; message: string }> {
    if (!file) {
      throw new Error('No file provided');
    }
    const result = await this.aiService.analyzeCv(req.user.sub, file);
    return { data: result, message: 'CV analyzed successfully' };
  }
}
