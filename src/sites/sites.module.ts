import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';

@Module({
  imports: [SupabaseModule],
  controllers: [SitesController],
  providers: [SitesService],
})
export class SitesModule {}
