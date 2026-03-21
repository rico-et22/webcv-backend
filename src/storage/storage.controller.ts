import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
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
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeleteFileDto } from './dto/delete-file.dto';
import { UploadResponseDto } from './dto/upload-response.dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  // ------------------------------------------------------------ POST /avatar

  @Post('avatar/:siteId')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload or replace the avatar for a portfolio site' })
  @ApiParam({ name: 'siteId', description: 'UUID of the site to attach the avatar to' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpeg, png, webp, gif, max 50 MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Avatar uploaded', type: UploadResponseDto })
  @ApiResponse({ status: 400, description: 'No file provided or invalid file type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'You do not own this site' })
  async uploadAvatar(
    @Request() req: { user: { sub: string }; headers: { authorization: string } },
    @Param('siteId') siteId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const jwt = req.headers.authorization.replace('Bearer ', '');
    const result = await this.storageService.uploadAvatar(req.user.sub, siteId, jwt, file);
    return { data: result, message: 'Avatar uploaded successfully' };
  }

  // ------------------------------------------------- POST /screenshot/:siteId

  @Post('screenshot/:siteId')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a screenshot for a portfolio site' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'siteId', description: 'UUID of the site to attach the screenshot to' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpeg, png, webp, gif, max 50 MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Screenshot uploaded', type: UploadResponseDto })
  @ApiResponse({ status: 400, description: 'No file provided, invalid type, or site not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'You do not own this site' })
  async uploadScreenshot(
    @Request() req: { user: { sub: string }; headers: { authorization: string } },
    @Param('siteId') siteId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const jwt = req.headers.authorization.replace('Bearer ', '');
    const result = await this.storageService.uploadScreenshot(req.user.sub, siteId, jwt, file);
    return { data: result, message: 'Screenshot uploaded successfully' };
  }

  // ------------------------------------------------------------ DELETE /file

  @Delete('file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file from storage by its path and bucket' })
  @ApiBody({ type: DeleteFileDto })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 400, description: 'Delete failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'You do not have permission to delete this file' })
  async deleteFile(
    @Request() req: { user: { sub: string }; headers: { authorization: string } },
    @Body() dto: DeleteFileDto,
  ) {
    const jwt = req.headers.authorization.replace('Bearer ', '');
    await this.storageService.deleteFile(req.user.sub, jwt, dto.bucket, dto.path);
    return { message: 'File deleted successfully' };
  }
}
