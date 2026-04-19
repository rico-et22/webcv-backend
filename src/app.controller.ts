import { readFileSync } from 'fs';
import { join } from 'path';
import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

const HTML_PAGE = readFileSync(
  join(process.cwd(), 'src', 'auth-callback.html'),
  'utf-8',
);

@ApiExcludeController()
@Controller()
export class AppController {
  @Public()
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  authCallback(): string {
    return HTML_PAGE;
  }
}
