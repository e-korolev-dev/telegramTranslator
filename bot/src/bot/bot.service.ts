import { Injectable, OnModuleInit } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import axios from 'axios';
import { Message } from '@telegraf/types';
import { ConfigService } from '../config.service';

interface UserLanguage {
  language: string | null;
  name: string;
}

@Injectable()
export class BotService implements OnModuleInit {
  private bot: Telegraf<Context>;
  private apiUrl = process.env.API_URL;
  private userLanguages: { [key: number]: UserLanguage } = {};
  private adminLanguage: string | null = null;
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.bot = new Telegraf(configService.telegramBotToken);
  }

  onModuleInit() {
    this.initializeBot();
  }

  private initializeBot() {
    this.bot.start((ctx) => this.handleStart(ctx));
    this.bot.action('set_language', (ctx) => this.setLanguage(ctx));
    this.bot.action('set_admin_language', (ctx) => this.setAdminLanguage(ctx));
    this.bot.action('user_list', (ctx) => this.userList(ctx));
    this.bot.action('help', (ctx) => this.help(ctx));
    this.bot.command('translate', (ctx) => this.translateCommand(ctx));
    this.bot.command('admin_language', (ctx) => this.adminLanguageCommand(ctx));
    this.bot.hears(/.*/, (ctx) => this.handleText(ctx));
    this.bot.launch().then(() => console.log('Bot is running'));
  }

  private handleStart(ctx: Context) {
    const language = ctx.from?.language_code || null;
    this.userLanguages[ctx.from?.id] = { language, name: ctx.from?.first_name || ctx.from?.username };
    ctx.reply('Welcome! Use the menu below to interact with me.').then(() => console.log('Started conversation with:', ctx.from?.username));
  }

  private setLanguage(ctx: Context) {
    ctx.reply('Please send me the language you prefer to translate to. Use the format /translate <target_language>.').then(() => console.log('Set language for user', ctx.from?.username));
  }

  private setAdminLanguage(ctx: Context) {
    ctx.reply('Please send me the language for admin translations. Use the format /admin_language <target_language>.').then(() => console.log('Set admin language for user', ctx.from?.username));
  }

  private userList(ctx: Context) {
    let userList = 'User list:\n';
    for (const [, { language, name }] of Object.entries(this.userLanguages)) {
      userList += `- ${name} - ${language || 'not set'}\n`;
    }
    ctx.reply(userList).then(() => console.log('Displayed user list'));
  }

  private help(ctx: Context) {
    ctx.reply('Use /translate <target_language> to set your preferred language.\nUse /admin_language <target_language> to set the admin language.\nUse /user_list to see all users and their languages.')
      .then(() => console.log('Helped user', ctx.from?.username));
  }

  private async translateCommand(ctx: Context) {
    const message = ctx.message as Message.TextMessage;
    const targetLanguage = message.text.split(' ')[1];
    if (targetLanguage) {
      if (this.userLanguages[ctx.from.id]) {
        try {
          const response = await axios.post(`${this.apiUrl}/translate`, {
            text: targetLanguage,
            language: 'english',
            action: 'get_language_name',
          });
          const translatedText = response.data.translated_text.trim();
          this.userLanguages[ctx.from.id].language = translatedText;
          await ctx.reply(`Your preferred language has been set to ${translatedText}.`);
        } catch (error) {
          await ctx.reply('Error translating the language name.');
        }
      } else {
        await ctx.reply('Please start the bot using /start first.');
      }
    } else {
      await ctx.reply('Please specify a target language.');
    }
  }

  private async adminLanguageCommand(ctx: Context) {
    const message = ctx.message as Message.TextMessage;
    const targetLanguage = message.text.split(' ')[1];
    if (targetLanguage) {
      try {
        const response = await axios.post(`${this.apiUrl}/translate`, {
          text: targetLanguage,
          language: 'english',
          action: 'get_language_name',
        });
        const translatedText = response.data.translated_text.trim();
        this.adminLanguage = translatedText;
        await ctx.reply(`Admin language has been set to ${translatedText}.`);
      } catch (error) {
        await ctx.reply('Error translating the language name.');
      }
    } else {
      await ctx.reply('Please specify a target language for the admin.');
    }
  }

  private async handleText(ctx: Context) {
    if (!this.userLanguages[ctx.from.id]) {
      await ctx.reply('Please start the bot using /start first.');
      return;
    }
    const senderId = ctx.message.from.id;
    const senderLanguage = this.userLanguages[senderId].language;
    const message = ctx.message as Message.TextMessage;
    const senderText = message.text;
    if (senderLanguage || this.adminLanguage) {
      const chatId = ctx.message.chat.id;
      if (senderLanguage) {
        for (const [userId, { language, name }] of Object.entries(this.userLanguages)) {
          if (this.configService.environment === 'dev' || (parseInt(userId) !== senderId && senderLanguage !== language)) {
            try {
              const translatedText = await this.translateText(senderText, language);
              await this.bot.telegram.sendMessage(chatId, `Translated message for ${name} (${language}): ${translatedText}`);
            } catch (error) {
              console.error(`Translation API error: ${error}`);
            }
          }
        }
      }
      if (this.adminLanguage) {
        try {
          const translatedText = await this.translateText(senderText, this.adminLanguage);
          await this.bot.telegram.sendMessage(chatId, `Default language ${this.adminLanguage}: ${translatedText}`);
        } catch (error) {
          console.error(`Translation API error: ${error}`);
        }
      }
    }
  }

  private async translateText(text: string, targetLanguage: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/translate`, {
        text: text,
        language: targetLanguage,
        action: 'translate_text',
      });
      return response.data.translated_text.trim();
    } catch (error) {
      console.error(`Translation API error: ${error}`);
      throw error;
    }
  }
}
