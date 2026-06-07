import { Test, TestingModule } from '@nestjs/testing';
import { GeneratorController } from './generator.controller';
import { GeneratorService } from './generator.service';
import * as express from 'express';

describe('GeneratorController', () => {
  let controller: GeneratorController;
  let service: GeneratorService;

  const mockGeneratorService = {
    generatePreview: jest.fn(),
    generateZip: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneratorController],
      providers: [
        {
          provide: GeneratorService,
          useValue: mockGeneratorService,
        },
      ],
    }).compile();

    controller = module.get<GeneratorController>(GeneratorController);
    service = module.get<GeneratorService>(GeneratorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('preview', () => {
    it('should correctly set headers and send html', async () => {
      const siteId = 'test-site-id';
      const userId = 'test-user-id';
      const req = { user: { sub: userId } };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as express.Response;
      const htmlContent = '<html><body>Test</body></html>';

      mockGeneratorService.generatePreview.mockResolvedValue(htmlContent);

      await controller.preview(siteId, req, res);

      expect(service.generatePreview).toHaveBeenCalledWith(userId, siteId);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/html; charset=utf-8',
      );
      expect(res.send).toHaveBeenCalledWith(htmlContent);
    });
  });

  describe('zip', () => {
    it('should correctly call generateZip', async () => {
      const siteId = 'test-site-id';
      const userId = 'test-user-id';
      const req = { user: { sub: userId } };
      const res = {} as express.Response;

      await controller.zip(siteId, req, res);

      expect(service.generateZip).toHaveBeenCalledWith(userId, siteId, res);
    });
  });
});
