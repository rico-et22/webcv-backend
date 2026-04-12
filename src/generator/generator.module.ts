import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { GeneratorController } from './generator.controller';
import { GeneratorService } from './generator.service';

@Module({
  imports: [SupabaseModule],
  controllers: [GeneratorController],
  providers: [GeneratorService],
})
export class GeneratorModule {}
