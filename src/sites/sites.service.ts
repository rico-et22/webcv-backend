import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { StorageService } from '../storage/storage.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import {
  SiteResponseDto,
  SiteSummaryResponseDto,
} from './dto/site-responses.dto';

@Injectable()
export class SitesService {
  private readonly logger = new Logger(SitesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly storageService: StorageService,
  ) {}

  // ------------------------------------------------------------------ helpers

  /** Map camelCase DTO fields to snake_case DB columns */
  private toDbRow(dto: Partial<CreateSiteDto>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (dto.fullName !== undefined) row.full_name = dto.fullName;
    if (dto.jobTitle !== undefined) row.job_title = dto.jobTitle;
    if (dto.location !== undefined) row.location = dto.location;
    if (dto.bio !== undefined) row.bio = dto.bio;
    if (dto.avatarStoragePath !== undefined)
      row.avatar_storage_path = dto.avatarStoragePath;
    if (dto.contacts !== undefined) row.contacts = dto.contacts;
    if (dto.skills !== undefined) row.skills = dto.skills;
    if (dto.experience !== undefined) row.experience = dto.experience;
    if (dto.education !== undefined) row.education = dto.education;
    if (dto.projects !== undefined)
      row.projects = dto.projects.map(({ imageUrl: _, ...p }) => p);
    if (dto.achievements !== undefined) row.achievements = dto.achievements;
    return row;
  }

  /** Map snake_case DB columns to camelCase for full site response */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  private fromDbRow(row: any): SiteResponseDto {
    return {
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      jobTitle: row.job_title,
      location: row.location,
      bio: row.bio,
      avatarStoragePath: row.avatar_storage_path,
      contacts: row.contacts,
      skills: row.skills,
      experience: row.experience,
      education: row.education,
      projects: row.projects,
      achievements: row.achievements,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /** Map snake_case DB columns to camelCase for site summary response */
  private fromDbSummaryRow(row: any): SiteSummaryResponseDto {
    return {
      id: row.id,
      fullName: row.full_name,
      jobTitle: row.job_title,
      avatarStoragePath: row.avatar_storage_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

  /**
   * Attach signed URLs to a site or summary response.
   * avatarStoragePath → avatarUrl and per-project imageStoragePath → imageUrl.
   * Runs concurrently via Promise.all.
   */
  private async resolveSignedUrls(
    site: SiteResponseDto | SiteSummaryResponseDto,
  ): Promise<SiteResponseDto | SiteSummaryResponseDto> {
    const result = { ...site };

    const tasks: Promise<void>[] = [];

    if (site.avatarStoragePath) {
      tasks.push(
        this.storageService
          .getSignedUrl('avatars', site.avatarStoragePath)
          .then((url) => {
            result.avatarUrl = url;
          })
          .catch((err: unknown) => {
            this.logger.warn(
              `Could not sign avatar URL for ${site.avatarStoragePath}: ${String(err)}`,
            );
          }),
      );
    }

    // Only SiteResponseDto has projects
    if ('projects' in site && Array.isArray(site.projects)) {
      const signedProjects = await Promise.all(
        (site as SiteResponseDto).projects!.map(async (project) => {
          if (!project.imageStoragePath) return project;
          try {
            const imageUrl = await this.storageService.getSignedUrl(
              'screenshots',
              project.imageStoragePath,
            );
            return { ...project, imageUrl };
          } catch (err: unknown) {
            this.logger.warn(
              `Could not sign project image URL for ${project.imageStoragePath}: ${String(err)}`,
            );
            return project;
          }
        }),
      );
      (result as SiteResponseDto).projects = signedProjects;
    }

    await Promise.all(tasks);
    return result;
  }

  // ------------------------------------------------------------------ create

  async create(userId: string, dto: CreateSiteDto) {
    const { data, error } = await this.supabaseService.supabaseAdmin
      .from('sites')
      .insert({ ...this.toDbRow(dto), user_id: userId })
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to create site for user ${userId}: ${error.message}`,
      );
      throw new Error(error.message);
    }

    const site = await this.resolveSignedUrls(this.fromDbRow(data));
    return { data: site, message: 'Portfolio created successfully' };
  }

  // ------------------------------------------------------------------ findAll

  async findAll(userId: string) {
    const { data, error } = await this.supabaseService.supabaseAdmin
      .from('sites')
      .select(
        'id, full_name, job_title, avatar_storage_path, created_at, updated_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(
        `Failed to fetch sites for user ${userId}: ${error.message}`,
      );
      throw new Error(error.message);
    }

    const signed = await Promise.all(
      data.map((row) => this.resolveSignedUrls(this.fromDbSummaryRow(row))),
    );

    return { data: signed, message: 'Portfolios retrieved successfully' };
  }

  // ------------------------------------------------------------------ findOne

  async findOne(userId: string, id: string) {
    const { data, error } = await this.supabaseService.supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Portfolio not found');
    }

    if (data.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this portfolio');
    }

    const site = await this.resolveSignedUrls(this.fromDbRow(data));
    return { data: site, message: 'Portfolio retrieved successfully' };
  }

  // ------------------------------------------------------------------ update

  async update(userId: string, id: string, dto: UpdateSiteDto) {
    // Verify ownership first
    await this.findOne(userId, id);

    const { data, error } = await this.supabaseService.supabaseAdmin
      .from('sites')
      .update({ ...this.toDbRow(dto), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update site ${id}: ${error.message}`);
      throw new Error(error.message);
    }

    const site = await this.resolveSignedUrls(this.fromDbRow(data));
    return { data: site, message: 'Portfolio updated successfully' };
  }

  // ------------------------------------------------------------------ remove

  async remove(userId: string, id: string) {
    // Verify ownership first (throws 403 if mismatched, 404 if not found)
    await this.findOne(userId, id);

    const { error } = await this.supabaseService.supabaseAdmin
      .from('sites')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Failed to delete site ${id}: ${error.message}`);
      throw new Error(error.message);
    }

    return { message: 'Portfolio deleted successfully' };
  }
}
