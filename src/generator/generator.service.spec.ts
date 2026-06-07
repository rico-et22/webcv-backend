import { Test, TestingModule } from '@nestjs/testing';
import { GeneratorService } from './generator.service';
import { SupabaseService } from '../supabase/supabase.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as express from 'express';

// Mock archiver before importing it indirectly via generator.service
jest.mock('archiver', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    pipe: jest.fn(),
    append: jest.fn(),
    finalize: jest.fn().mockResolvedValue(undefined),
  }));
});
import * as archiver from 'archiver';

describe('GeneratorService', () => {
  let service: GeneratorService;

  const mockSupabaseAdmin = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  const mockSupabaseService = {
    supabaseAdmin: mockSupabaseAdmin,
  };

  const mockStorageService = {
    getSignedUrl: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockSiteDataRow = {
    id: 'test-site-id',
    user_id: 'test-user-id',
    full_name: 'John Doe',
    job_title: 'Developer',
    bio: 'Hello world',
    avatar_storage_path: 'avatars/avatar.jpg',
    contacts: { email: 'john@example.com' },
    skills: ['TypeScript'],
    experience: [],
    education: [],
    projects: [
      {
        id: '1',
        title: 'Project 1',
        imageStoragePath: 'projects/p1.jpg',
      },
    ],
    achievements: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeneratorService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GeneratorService>(GeneratorService);

    // Mock global fetch
    global.fetch = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('generatePreview', () => {
    it('should throw NotFoundException if site does not exist', async () => {
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      });

      await expect(
        service.generatePreview('test-user-id', 'test-site-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the site', async () => {
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { ...mockSiteDataRow, user_id: 'other-user-id' },
        error: null,
      });

      await expect(
        service.generatePreview('test-user-id', 'test-site-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should generate valid html preview and inline images', async () => {
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: mockSiteDataRow,
        error: null,
      });

      mockStorageService.getSignedUrl.mockResolvedValue(
        'http://signed-url.com/image.jpg',
      );

      // Mock fetch returning a valid response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from('fake-image-data')),
      });

      const html = await service.generatePreview(
        'test-user-id',
        'test-site-id',
      );

      expect(html).toContain('John Doe');
      expect(html).toContain('Developer');
      // Should contain base64 string due to inlined images
      expect(html).toContain('data:image/jpeg;base64,ZmFrZS1pbWFnZS1kYXRh');

      // Should have called signed url generation for avatar and 1 project
      expect(mockStorageService.getSignedUrl).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateFiles', () => {
    it('should collect all static files including font license', async () => {
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: mockSiteDataRow,
        error: null,
      });
      mockStorageService.getSignedUrl.mockResolvedValue(
        'http://signed-url.com/image.jpg',
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from('fake-image-data')),
      });

      const files = await service.generateFiles('test-user-id', 'test-site-id');

      const filePaths = files.map((f) => f.path);
      expect(filePaths).toContain('index.html');
      expect(filePaths).toContain('style.css');
      expect(filePaths).toContain('script.js');
      expect(filePaths).toContain('assets/fonts/inter-latin-wght-normal.woff2');
      expect(filePaths).toContain('assets/fonts/FONT-LICENSE.txt');
      expect(filePaths).toContain('assets/img/avatar.jpg');
      expect(filePaths).toContain('assets/img/project-0.jpg');
    });
  });

  describe('generateZip', () => {
    it('should set zip headers and stream files to response', async () => {
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: mockSiteDataRow,
        error: null,
      });
      mockStorageService.getSignedUrl.mockResolvedValue(
        'http://signed-url.com/image.jpg',
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from('fake-image-data')),
      });

      const res = {
        setHeader: jest.fn(),
      } as unknown as express.Response;

      await service.generateZip('test-user-id', 'test-site-id', res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/zip',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="portfolio-test-site-id.zip"',
      );

      const mockArchiverInstance = (archiver as unknown as jest.Mock).mock
        .results[0].value;

      expect(mockArchiverInstance.pipe).toHaveBeenCalledWith(res);
      expect(mockArchiverInstance.append).toHaveBeenCalled();
      expect(mockArchiverInstance.finalize).toHaveBeenCalled();
    });
  });
});
