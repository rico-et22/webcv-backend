import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateSiteDto } from './dto/create-site.dto';
import {
  SiteResponseDto,
  SiteSummaryResponseDto,
} from './dto/site-responses.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { SitesService } from './sites.service';

@ApiTags('sites')
@ApiBearerAuth()
@ApiExtraModels(SiteResponseDto, SiteSummaryResponseDto)
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  // ------------------------------------------------------------------ POST /sites

  @Post()
  @ApiOperation({ summary: 'Create a new portfolio site' })
  @ApiResponse({
    status: 201,
    description: 'Portfolio created successfully',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(SiteResponseDto) },
        message: { type: 'string', example: 'Portfolio created successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateSiteDto,
  ) {
    return this.sitesService.create(req.user.sub, dto);
  }

  // ------------------------------------------------------------------ GET /sites

  @Get()
  @ApiOperation({ summary: 'Get all portfolio sites for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of portfolios returned',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(SiteSummaryResponseDto) },
        },
        message: {
          type: 'string',
          example: 'Portfolios retrieved successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req: { user: { sub: string } }) {
    return this.sitesService.findAll(req.user.sub);
  }

  // ------------------------------------------------------------------ GET /sites/:id

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific portfolio site by ID' })
  @ApiParam({ name: 'id', description: 'Portfolio site UUID' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio returned',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(SiteResponseDto) },
        message: {
          type: 'string',
          example: 'Portfolio retrieved successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — site belongs to another user',
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  findOne(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.sitesService.findOne(req.user.sub, id);
  }

  // ------------------------------------------------------------------ PUT /sites/:id

  @Put(':id')
  @ApiOperation({ summary: 'Update a portfolio site' })
  @ApiParam({ name: 'id', description: 'Portfolio site UUID' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio updated successfully',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(SiteResponseDto) },
        message: { type: 'string', example: 'Portfolio updated successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — site belongs to another user',
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
  ) {
    return this.sitesService.update(req.user.sub, id, dto);
  }

  // ------------------------------------------------------------------ DELETE /sites/:id

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a portfolio site' })
  @ApiParam({ name: 'id', description: 'Portfolio site UUID' })
  @ApiResponse({ status: 200, description: 'Portfolio deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — site belongs to another user',
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  remove(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.sitesService.remove(req.user.sub, id);
  }
}
