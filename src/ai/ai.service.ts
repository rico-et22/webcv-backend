import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { AnalyzeCvResponseDto } from './dto/analyze-cv-response.dto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const COOLDOWN_MS = 30_000; // 30 seconds

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly cooldownMap = new Map<string, number>();

  constructor(private readonly configService: ConfigService) {}

  async analyzeCv(
    userId: string,
    file: Express.Multer.File,
  ): Promise<AnalyzeCvResponseDto> {
    // 1. Size check
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File exceeds the 5 MB size limit (received ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      );
    }

    // 2. MIME type check
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Only application/pdf is accepted`,
      );
    }

    // 3. Per-user cooldown check
    const lastCall = this.cooldownMap.get(userId);
    const now = Date.now();
    if (lastCall !== undefined && now - lastCall < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil(
        (COOLDOWN_MS - (now - lastCall)) / 1000,
      );
      throw new HttpException(
        `Rate limit exceeded. Please wait ${remainingSeconds}s before analyzing another CV`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 4. Azure OpenAI Responses API call
    const apiKey = this.configService.getOrThrow<string>(
      'AZURE_OPENAI_API_KEY',
    );
    const endpoint = this.configService.getOrThrow<string>(
      'AZURE_OPENAI_ENDPOINT',
    );
    const apiVersion = this.configService.getOrThrow<string>(
      'AZURE_OPENAI_API_VERSION',
    );
    const deployment = this.configService.getOrThrow<string>(
      'AZURE_OPENAI_DEPLOYMENT',
    );

    const baseUrl = endpoint.replace(/\/+$/, '') + '/openai/v1';

    const client = new OpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
      defaultHeaders: { 'api-key': apiKey },
      defaultQuery: { 'api-version': apiVersion },
    });

    const base64Data = file.buffer.toString('base64');

    const prompt = `You are a CV parser. Analyze the provided PDF CV and extract the following information into a strict JSON object.
Return ONLY valid JSON, no markdown, no explanation, no code fences.
Return data language should be the same as the uploaded CV.

Required JSON structure (all fields optional — include only what you can confidently extract):
{
  "fullName": "string",
  "jobTitle": "string",
  "location": "string (city, country)",
  "bio": "string (professional summary, max 3 sentences. If not provided directly, improvise it. DO NOT DIRECTLY USE EXPERIENCE ITEM DESCRIPTIONS FOR THIS)",
  "contacts": {
    "email": "string",
    "phone": "string",
    "linkedin": "full URL",
    "github": "full URL",
    "website": "full URL"
  },
  "skills": ["string"],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null if current",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null if ongoing"
    }
  ]
}`;

    this.logger.log(
      `Sending CV to Azure AI for user ${userId} (${file.size} bytes)`,
    );

    let result;
    try {
      result = await client.responses.create({
        model: deployment,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                filename: file.originalname || 'document.pdf',
                file_data: `data:application/pdf;base64,${base64Data}`,
              },
              { type: 'input_text', text: prompt },
            ],
          },
        ],
      });
    } catch (err: any) {
      this.logger.error(
        `Azure AI API error for user ${userId}: [${err.status}] ${err.message}`,
      );
      if (err.status === 429) {
        throw new HttpException(
          'Azure AI API quota exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (err.status !== undefined && err.status >= 500) {
        throw new ServiceUnavailableException(
          'AI service is temporarily unavailable. Please try again later.',
        );
      }
      throw err;
    }

    const text = result.output?.[0]?.content?.[0]?.text?.trim() || '';

    // Strip markdown code fences if model wraps the JSON (e.g. ```json ... ```)
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    // 5. Parse AI response
    let parsed: AnalyzeCvResponseDto;
    try {
      parsed = JSON.parse(cleaned) as AnalyzeCvResponseDto;
    } catch {
      this.logger.error(
        `Azure AI returned non-JSON response for user ${userId}: ${cleaned.slice(0, 200)}`,
      );
      throw new BadRequestException(
        'Failed to parse CV analysis result. Please try again.',
      );
    }

    // Update cooldown timestamp on success
    this.cooldownMap.set(userId, Date.now());
    this.logger.log(`CV analyzed successfully for user ${userId}`);

    return parsed;
  }
}
