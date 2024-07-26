import { forwardRef, Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { AppModule } from '../app.module';

@Module({
  imports: [forwardRef(() => AppModule)], // forwardRef для разрыва циклической зависимости
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {
}