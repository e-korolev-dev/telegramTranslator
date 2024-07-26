// src/config.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  // Метод для получения переменной окружения NODE_ENV
  get environment(): string {
    return process.env.NODE_ENV || 'production';
  }

  // Метод для получения других переменных окружения, если необходимо
  get apiUrl(): string {
    return process.env.API_URL || 'http://localhost:5000';
  }

  get telegramBotToken(): string {
    return process.env.TELEGRAM_BOT_TOKEN || '';
  }

  // Добавьте другие методы для получения нужных переменных окружения
}
