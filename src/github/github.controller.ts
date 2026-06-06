import {
  Body,
  Controller,
  Logger,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GithubDeployDto } from './dto/github-deploy.dto';
import { GithubExchangeDto } from './dto/github-exchange.dto';
import { GithubService } from './github.service';

@ApiTags('github')
@ApiBearerAuth()
@Controller('github')
export class GithubController {
  private readonly logger = new Logger(GithubController.name);

  constructor(private readonly githubService: GithubService) {}

  @Post('exchange')
  @ApiOperation({
    summary: 'Exchange GitHub OAuth authorization code for an access token',
    description:
      'Call this after the user is redirected back from GitHub OAuth with a `code` param. ' +
      'Returns a short-lived GitHub access token and the authenticated GitHub username. ' +
      'The token is returned to the frontend and should be kept in memory — it is never stored server-side.',
  })
  @ApiBody({ type: GithubExchangeDto })
  @ApiResponse({
    status: 201,
    description: 'GitHub token and username returned successfully',
    schema: {
      example: {
        data: {
          githubToken: 'gho_xxxxxxxxxxxxxxxxxxxx',
          githubUsername: 'kamilpawlak',
        },
        message: 'GitHub account connected successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OAuth code' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid webCV JWT)' })
  @ApiResponse({
    status: 501,
    description: 'GitHub integration is not configured on this server',
  })
  async exchange(@Body() dto: GithubExchangeDto) {
    const result = await this.githubService.exchangeCode(dto.code);
    return {
      data: result,
      message: 'GitHub account connected successfully',
    };
  }

  @Post('deploy/:siteId')
  @ApiOperation({
    summary: 'Deploy portfolio to GitHub Pages',
    description:
      'Generates the static portfolio and pushes it to `<username>.github.io`. ' +
      'Creates the repo if it does not exist; force-pushes on subsequent deploys. ' +
      'Enables GitHub Pages automatically. Repo name is derived from the GitHub username — no configuration needed.',
  })
  @ApiParam({ name: 'siteId', description: 'Portfolio site UUID' })
  @ApiBody({ type: GithubDeployDto })
  @ApiResponse({
    status: 201,
    description: 'Portfolio deployed to GitHub Pages successfully',
    schema: {
      example: {
        data: {
          repoUrl: 'https://github.com/kamilpawlak/kamilpawlak.github.io',
          pagesUrl: 'https://kamilpawlak.github.io',
        },
        message: 'Portfolio deployed to GitHub Pages successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (invalid webCV JWT or expired GitHub token)',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden — you do not own this portfolio, or GitHub token lacks repo scope',
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({
    status: 501,
    description: 'GitHub integration is not configured on this server',
  })
  async deploy(
    @Param('siteId') siteId: string,
    @Body() dto: GithubDeployDto,
    @Request() req: { user: { sub: string } },
  ) {
    const result = await this.githubService.deploy(
      req.user.sub,
      siteId,
      dto.githubToken,
    );
    return {
      data: result,
      message: 'Portfolio deployed to GitHub Pages successfully',
    };
  }
}
