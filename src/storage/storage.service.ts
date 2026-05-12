import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const VALID_BUCKETS = ['avatars', 'screenshots'] as const;

export type StorageBucket = (typeof VALID_BUCKETS)[number];

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // ----------------------------------------------------------------- helpers

  private getExtension(mimetype: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    return map[mimetype] ?? 'bin';
  }

  private validateImage(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed: jpeg, png, webp, gif`,
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds the 50 MB size limit');
    }
  }

  private getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabaseService.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  // ----------------------------------------------------------------- uploadFile

  async uploadFile(
    userId: string,
    jwt: string,
    bucket: StorageBucket,
    file: Express.Multer.File,
  ): Promise<{ url: string; storagePath: string }> {
    this.validateImage(file);

    const ext = this.getExtension(file.mimetype);
    const storagePath = `${userId}/${Date.now()}.${ext}`;

    const { error } = await this.supabaseService
      .clientForUser(jwt)
      .storage.from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(
        `Upload failed (${bucket}/${storagePath}): ${error.message}`,
      );
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const url = this.getPublicUrl(bucket, storagePath);
    this.logger.log(
      `File uploaded by user ${userId}: ${bucket}/${storagePath}`,
    );
    return { url, storagePath };
  }

  // --------------------------------------------------------------- deleteFile

  async deleteFile(
    userId: string,
    jwt: string,
    bucket: StorageBucket,
    path: string,
  ): Promise<void> {
    // Ensure users can only delete their own files
    if (!path.startsWith(`${userId}/`)) {
      throw new ForbiddenException(
        'You do not have permission to delete this file',
      );
    }

    const { error } = await this.supabaseService
      .clientForUser(jwt)
      .storage.from(bucket)
      .remove([path]);

    if (error) {
      this.logger.error(
        `File deletion failed (${bucket}/${path}): ${error.message}`,
      );
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }

    this.logger.log(`File deleted by user ${userId}: ${bucket}/${path}`);
  }
}
