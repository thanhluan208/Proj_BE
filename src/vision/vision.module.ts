import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VisionService } from './vision.service';
import geminiConfig from './config/gemini.config';

@Module({
  imports: [ConfigModule.forFeature(geminiConfig)],
  providers: [VisionService],
  exports: [VisionService],
})
export class VisionModule {}
