const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

let userLanguages = {};
let adminLanguage = null;

// Функция для перевода текста с определением языка
async function translateText(text, targetLanguage) {
  const response = await axios.post('http://translation_api:5000/translate', {
    text: text,
    language: targetLanguage
  });
  return response.data.translated_text;
}

bot.start((ctx) => {
  ctx.reply('Привет! Я бот-переводчик. Используй команду /translate, чтобы установить язык перевода.');
});

bot.command('translate', async (ctx) => {
  const userId = ctx.from.id;
  const languageInput = ctx.message.text.split(' ').slice(1).join(' ');

  // Переводим введенный пользователем язык на английский
  const language = await translateText(languageInput, 'english');

  userLanguages[userId] = language;
  ctx.reply(`Язык перевода установлен на ${language}.`);
});

bot.command('admin_translate', async (ctx) => {
  const languageInput = ctx.message.text.split(' ').slice(1).join(' ');

  // Переводим введенный администратором язык на английский
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

bot.launch();
