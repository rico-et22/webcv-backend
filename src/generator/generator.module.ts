import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';
import { GeneratorController } from './generator.controller';
import { GeneratorService } from './generator.service';

@Module({
  imports: [SupabaseModule, ConfigModule],
  controllers: [GeneratorController],
  providers: [GeneratorService],
})
export class GeneratorModule {}
