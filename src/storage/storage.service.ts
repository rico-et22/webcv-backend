import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const AVATARS_BUCKET = 'avatars';
const SCREENSHOTS_BUCKET = 'screenshots';

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

  // --------------------------------------------------------------- uploadAvatar

  async uploadAvatar(
    userId: string,
    siteId: string,
    jwt: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; storagePath: string }> {
    this.validateImage(file);

    // Verify the site belongs to this user
    const { data: site, error: siteError } = await this.supabaseService.supabaseAdmin
      .from('sites')
      .select('id, user_id')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      throw new BadRequestException('Site not found');
    }
    if (site.user_id !== userId) {
      throw new ForbiddenException('You do not own this site');
    }

    const ext = this.getExtension(file.mimetype);
    const storagePath = `${userId}/${siteId}/avatar.${ext}`;

    const { error } = await this.supabaseService.clientForUser(jwt).storage
      .from(AVATARS_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Avatar upload failed for site ${siteId}: ${error.message}`);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const url = this.getPublicUrl(AVATARS_BUCKET, storagePath);
    this.logger.log(`Avatar uploaded for site ${siteId}: ${storagePath}`);
    return { url, storagePath };
  }

  // ---------------------------------------------------------- uploadScreenshot

  async uploadScreenshot(
    userId: string,
    siteId: string,
    jwt: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; storagePath: string }> {
    this.validateImage(file);

    // Verify the site belongs to this user
    const { data: site, error: siteError } = await this.supabaseService.supabaseAdmin
      .from('sites')
      .select('id, user_id')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      throw new BadRequestException('Site not found');
    }
    if (site.user_id !== userId) {
      throw new ForbiddenException('You do not own this site');
    }

    const ext = this.getExtension(file.mimetype);
    const timestamp = Date.now();
    const storagePath = `${userId}/${siteId}/${timestamp}.${ext}`;

    const { error } = await this.supabaseService.clientForUser(jwt).storage
      .from(SCREENSHOTS_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(
        `Screenshot upload failed for site ${siteId}: ${error.message}`,
      );
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const url = this.getPublicUrl(SCREENSHOTS_BUCKET, storagePath);
    this.logger.log(`Screenshot uploaded for site ${siteId}: ${storagePath}`);
    return { url, storagePath };
  }

  // --------------------------------------------------------------- deleteFile

  async deleteFile(
    userId: string,
    jwt: string,
    bucket: 'avatars' | 'screenshots',
    path: string,
  ): Promise<void> {
    // Ensure users can only delete their own files
    if (!path.startsWith(`${userId}/`)) {
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    const { error } = await this.supabaseService.clientForUser(jwt).storage
      .from(bucket)
      .remove([path]);

    if (error) {
      this.logger.error(`File deletion failed (${bucket}/${path}): ${error.message}`);
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }

    this.logger.log(`File deleted by user ${userId}: ${bucket}/${path}`);
  }
}
