import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiver = require('archiver') as typeof import('archiver');
import type { Archiver } from 'archiver';
import * as Handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as express from 'express';
import { AchievementDto } from '../sites/dto/achievement.dto';
import { ContactDto } from '../sites/dto/contact.dto';
import { EducationDto } from '../sites/dto/education.dto';
import { ExperienceDto } from '../sites/dto/experience.dto';
import { ProjectDto } from '../sites/dto/project.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { registerHelpers } from './helpers/handlebars-helpers';
import { SiteData, TemplateContext } from './interfaces/site-data.interface';

@Injectable()
export class GeneratorService {
  private readonly logger = new Logger(GeneratorService.name);

  private readonly indexTpl: Handlebars.TemplateDelegate;
  private readonly styleTpl: Handlebars.TemplateDelegate;
  private readonly scriptTpl: Handlebars.TemplateDelegate;
  private readonly fontDataUri: string;
  private readonly fontRelativePath = 'assets/fonts/inter-latin-wght-normal.woff2';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    registerHelpers();
    this.registerPartials();
    this.indexTpl = this.compileTemplate('index.hbs');
    this.styleTpl = this.compileTemplate('style.hbs');
    this.scriptTpl = this.compileTemplate('script.hbs');
    this.fontDataUri = this.loadFontAsDataUri();
  }

  /** Builds the public URL for a file in the screenshots Supabase Storage bucket. */
  private storagePublicUrl(storagePath: string): string {
    const base = this.configService.get<string>('SUPABASE_URL');
    return `${base}/storage/v1/object/public/screenshots/${storagePath}`;
  }

  private loadFontAsDataUri(): string {
    const fontPath = path.join(__dirname, 'fonts', 'inter-latin-wght-normal.woff2');
    const buffer = fs.readFileSync(fontPath);
    return `data:font/woff2;base64,${buffer.toString('base64')}`;
  }

  // ------------------------------------------------------------------ template setup

  private tplPath(...segments: string[]): string {
    return path.join(__dirname, 'templates', ...segments);
  }

  private readTemplate(...segments: string[]): string {
    return fs.readFileSync(this.tplPath(...segments), 'utf-8');
  }

  private compileTemplate(...segments: string[]): Handlebars.TemplateDelegate {
    return Handlebars.compile(this.readTemplate(...segments));
  }

  private registerPartials(): void {
    const partials = [
      'hero',
      'about',
      'experience',
      'education',
      'skills',
      'projects',
      'achievements',
      'contact',
    ];
    for (const name of partials) {
      Handlebars.registerPartial(name, this.readTemplate('partials', `${name}.hbs`));
    }
  }

  // ------------------------------------------------------------------ data fetching

  private async fetchSite(userId: string, siteId: string): Promise<SiteData> {
    const { data, error } = await this.supabaseService.supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Portfolio not found');
    }

    if (data.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this portfolio');
    }

    return this.mapRowToSiteData(data as Record<string, unknown>);
  }

  private mapRowToSiteData(row: Record<string, unknown>): SiteData {
    return {
      id: row.id as string,
      fullName: row.full_name as string,
      jobTitle: row.job_title as string | undefined,
      location: row.location as string | undefined,
      bio: row.bio as string | undefined,
      avatarUrl: row.avatar_url as string | undefined,
      contacts: row.contacts as ContactDto | undefined,
      skills: row.skills as string[] | undefined,
      experience: row.experience as ExperienceDto[] | undefined,
      education: row.education as EducationDto[] | undefined,
      projects: row.projects as ProjectDto[] | undefined,
      achievements: row.achievements as AchievementDto[] | undefined,
    };
  }

  // ------------------------------------------------------------------ context

  private prepareSiteContext(
    site: SiteData,
    inlineMode: boolean,
    inlineCss?: string,
    inlineJs?: string,
  ): TemplateContext {
    const hasExperience = Array.isArray(site.experience) && site.experience.length > 0;
    const hasEducation = Array.isArray(site.education) && site.education.length > 0;
    const hasSkills = Array.isArray(site.skills) && site.skills.length > 0;
    const hasProjects = Array.isArray(site.projects) && site.projects.length > 0;
    const hasAchievements = Array.isArray(site.achievements) && site.achievements.length > 0;

    const contacts = site.contacts ?? {};
    const hasContacts = !!(
      contacts.email ||
      contacts.phone ||
      contacts.linkedin ||
      contacts.github ||
      contacts.website
    );

    const firstName = site.fullName.split(' ')[0] ?? site.fullName;

    return {
      ...site,
      firstName,
      hasAvatarUrl: !!site.avatarUrl,
      hasBio: !!site.bio,
      hasJobTitle: !!site.jobTitle,
      hasLocation: !!site.location,
      hasContacts,
      hasExperience,
      hasEducation,
      hasSkills,
      hasProjects,
      hasAchievements,
      inlineMode,
      inlineCss,
      inlineJs,
    };
  }

  // ------------------------------------------------------------------ image helpers

  private readonly imgExtMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  /** Fetches an image URL. Returns null on any error. */
  private async fetchImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') ?? 'image/jpeg';
      const buffer = Buffer.from(await res.arrayBuffer());
      return { buffer, contentType };
    } catch (err) {
      this.logger.warn(`Failed to fetch image ${url}: ${(err as Error).message}`);
      return null;
    }
  }

  /** Replaces remote image URLs with base64 data URIs in the site data clone (preview mode). */
  private async inlineImages(site: SiteData): Promise<SiteData> {
    const clone = { ...site };

    const toDataUri = async (url: string): Promise<string> => {
      const result = await this.fetchImage(url);
      if (!result) return url;
      return `data:${result.contentType};base64,${result.buffer.toString('base64')}`;
    };

    if (clone.avatarUrl) clone.avatarUrl = await toDataUri(clone.avatarUrl);

    if (clone.projects?.length) {
      clone.projects = await Promise.all(
        clone.projects.map(async (p) => {
          if (!p.imageStoragePath) return p;
          const publicUrl = this.storagePublicUrl(p.imageStoragePath);
          return { ...p, imageUrl: await toDataUri(publicUrl) };
        }),
      );
    }

    return clone;
  }

  /**
   * Fetches remote images, appends them to the archive as local files,
   * and returns a site data clone with updated local paths (ZIP mode).
   */
  private async bundleImages(site: SiteData, archive: Archiver): Promise<SiteData> {
    const clone = { ...site };

    if (clone.avatarUrl) {
      const result = await this.fetchImage(clone.avatarUrl);
      if (result) {
        const ext = this.imgExtMap[result.contentType] ?? 'jpg';
        const localPath = `assets/img/avatar.${ext}`;
        archive.append(result.buffer, { name: localPath });
        clone.avatarUrl = localPath;
      }
    }

    if (clone.projects?.length) {
      clone.projects = await Promise.all(
        clone.projects.map(async (p, i) => {
          if (!p.imageStoragePath) return p;
          const publicUrl = this.storagePublicUrl(p.imageStoragePath);
          const result = await this.fetchImage(publicUrl);
          if (!result) return p;
          const ext = this.imgExtMap[result.contentType] ?? 'jpg';
          const localPath = `assets/img/project-${i}.${ext}`;
          archive.append(result.buffer, { name: localPath });
          return { ...p, imageUrl: localPath };
        }),
      );
    }

    return clone;
  }

  // ------------------------------------------------------------------ public API

  async generatePreview(userId: string, siteId: string): Promise<string> {
    const site = await this.fetchSite(userId, siteId);
    const inlinedSite = await this.inlineImages(site);
    const css = this.styleTpl({ fontSrc: this.fontDataUri });
    const js = this.scriptTpl({});
    const context = this.prepareSiteContext(inlinedSite, true, css, js);
    return this.indexTpl(context);
  }

  async generateZip(userId: string, siteId: string, res: express.Response): Promise<void> {
    const site = await this.fetchSite(userId, siteId);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="portfolio-${siteId}.zip"`,
    );

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: Error) => {
      this.logger.error(`Archiver error for site ${siteId}: ${err.message}`);
    });
    archive.pipe(res);

    // Fetch images and bundle them as local files; updates src paths in the clone.
    const bundledSite = await this.bundleImages(site, archive);

    const css = this.styleTpl({ fontSrc: this.fontRelativePath });
    const js = this.scriptTpl({});
    const context = this.prepareSiteContext(bundledSite, false);
    const html = this.indexTpl(context);

    const fontPath = path.join(__dirname, 'fonts', 'inter-latin-wght-normal.woff2');
    const fontBuffer = fs.readFileSync(fontPath);

    archive.append(html, { name: 'index.html' });
    archive.append(css, { name: 'style.css' });
    archive.append(js, { name: 'script.js' });
    archive.append(fontBuffer, { name: 'assets/fonts/inter-latin-wght-normal.woff2' });

    await archive.finalize();
  }
}
