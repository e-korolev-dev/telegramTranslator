const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const apiUrl = process.env.API_URL || 'http://api:5000'; // Используйте переменную среды API_URL

let userLanguages = {};
let adminLanguage = null;

async function translateText(text, targetLanguage) {
  try {
    const response = await axios.post(`${apiUrl}/translate`, {
      text: text,
      language: targetLanguage
    });
    return response.data.translated_text;
  } catch (error) {
    console.error('Translation API error:', error);
    throw new Error('Ошибка перевода.');
  }
}

bot.start((ctx) => {
  ctx.reply('Привет! Я бот-переводчик. Используй команду /translate, чтобы установить язык перевода.');
});

bot.command('translate', async (ctx) => {
  const userId = ctx.from.id;
  const languageInput = ctx.message.text.split(' ').slice(1).join(' ');

  const language = await translateText(languageInput, 'english');

  userLanguages[userId] = language;
  ctx.reply(`Язык перевода установлен на ${language}.`);
});

bot.command('admin_translate', async (ctx) => {
  const languageInput = ctx.message.text.split(' ').slice(1).join(' ');

  const language = await translateText(languageInput, 'english');

  adminLanguage = language;
  ctx.reply(`Язык перевода для всех участников установлен на ${language}.`);
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userLanguage = userLanguages[userId] || adminLanguage;
  if (userLanguage) {
    try {
      const translatedText = await translateText(ctx.message.text, userLanguage);
      ctx.reply(`${ctx.from.first_name}: ${translatedText}`);
    } catch (error) {
      ctx.reply('Ошибка перевода сообщения.');
    }
  } else {
    ctx.reply('Язык перевода не установлен. Используй команду /translate или /admin_translate.');
  }
});

async function launchBot() {
  try {
    await bot.launch();
    console.log('Bot launched successfully.');
  } catch (error) {
    console.error('Error launching bot:', error);
  }
}

launchBot();
