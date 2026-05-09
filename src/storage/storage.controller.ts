import {
  Body,
  Controller,
  Delete,
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
import { DeleteFileDto } from './dto/delete-file.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { UploadResponseDto } from './dto/upload-response.dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  // ------------------------------------------------------------ POST /upload

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload an image to a storage bucket',
    description:
      'Uploads an image file to the specified bucket. The file is stored under `userId/<timestamp>.<ext>`. ' +
      'Use this before creating a site to obtain the `storagePath` (and optionally `url`) to embed in the site payload.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'bucket'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpeg, png, webp, gif, max 50 MB)',
        },
        bucket: {
          type: 'string',
          enum: ['avatars', 'screenshots'],
          description: 'Target storage bucket',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No file provided, invalid type/size, or invalid bucket' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upload(
    @Request() req: { user: { sub: string }; headers: { authorization: string } },
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    const jwt = req.headers.authorization.replace('Bearer ', '');
    const result = await this.storageService.uploadFile(req.user.sub, jwt, dto.bucket, file);
    return { data: result, message: 'File uploaded successfully' };
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
