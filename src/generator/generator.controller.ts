import * as express from 'express';
import { Controller, Get, Param, Request, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GeneratorService } from './generator.service';

@ApiTags('generator')
@ApiBearerAuth()
@Controller('generator')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Get('preview/:siteId')
  @ApiOperation({ summary: 'Preview portfolio as a self-contained HTML page' })
  @ApiParam({ name: 'siteId', description: 'Portfolio site UUID' })
  @ApiProduces('text/html')
  @ApiResponse({
    status: 200,
    description: 'Self-contained HTML page returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — you do not own this portfolio',
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async preview(
    @Param('siteId') siteId: string,
    @Request() req: { user: { sub: string } },
    @Res() res: express.Response,
  ): Promise<void> {
    const html = await this.generatorService.generatePreview(
      req.user.sub,
      siteId,
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('zip/:siteId')
  @ApiOperation({ summary: 'Download portfolio as a static ZIP file' })
  @ApiParam({ name: 'siteId', description: 'Portfolio site UUID' })
  @ApiProduces('application/zip')
  @ApiResponse({ status: 200, description: 'ZIP file streamed as download' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — you do not own this portfolio',
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async zip(
    @Param('siteId') siteId: string,
    @Request() req: { user: { sub: string } },
    @Res() res: express.Response,
  ): Promise<void> {
    await this.generatorService.generateZip(req.user.sub, siteId, res);
  }
}
