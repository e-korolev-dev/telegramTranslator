const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

let userLanguages = {};
let adminLanguage = null;

bot.start((ctx) => {
  ctx.reply('Привет! Я бот-переводчик. Используй команду /translate, чтобы установить язык перевода.');
});

bot.command('translate', (ctx) => {
  const userId = ctx.from.id;
  const language = ctx.message.text.split(' ')[1];
  userLanguages[userId] = language;
  ctx.reply(`Язык перевода установлен на ${language}.`);
});

bot.command('admin_translate', (ctx) => {
  const language = ctx.message.text.split(' ')[1];
  adminLanguage = language;
  ctx.reply(`Язык перевода для всех участников установлен на ${language}.`);
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userLanguage = userLanguages[userId] || adminLanguage;
  if (userLanguage) {
    try {
      const response = await axios.post('http://translation_api:5000/translate', {
        text: ctx.message.text,
        language: userLanguage
      });
      const translatedText = response.data.translated_text;
      ctx.reply(`${ctx.from.first_name}: ${translatedText}`);
    } catch (error) {
      ctx.reply('Ошибка перевода сообщения.');
    }
  } else {
    ctx.reply('Язык перевода не установлен. Используй команду /translate или /admin_translate.');
  }
});

bot.launch();

