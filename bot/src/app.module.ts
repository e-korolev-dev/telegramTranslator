import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { ConfigService } from './config.service';

@Module({
  imports: [BotModule],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppModule {
}
