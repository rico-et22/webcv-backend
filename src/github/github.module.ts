import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeneratorModule } from '../generator/generator.module';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';

@Module({
  imports: [ConfigModule, GeneratorModule],
  controllers: [GithubController],
  providers: [GithubService],
})
export class GithubModule {}
