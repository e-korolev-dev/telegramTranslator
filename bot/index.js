const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const apiUrl = process.env.API_URL;
const environment = process.env.NODE_ENV || 'prod';

let userLanguages = {};
let adminLanguage = null;

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('Set Preferred Language', 'set_language')],
  [Markup.button.callback('Set Admin Language', 'set_admin_language')],
  [Markup.button.callback('User List', 'user_list')],
  [Markup.button.callback('Help', 'help')]
]);

bot.start((ctx) => {
  const language = ctx.from.language_code || null;
  userLanguages[ctx.from.id] = { language: language, name: ctx.from.first_name || ctx.from.username };
  ctx.reply('Welcome! Use the menu below to interact with me.', mainMenu);
  console.log('Started conversation with:', ctx.from.username);
});

bot.action('set_language', (ctx) => {
  ctx.reply('Please send me the language you prefer to translate to. Use the format /translate <target_language>.');
});

bot.action('set_admin_language', (ctx) => {
  ctx.reply('Please send me the language for admin translations. Use the format /admin_language <target_language>.');
});

bot.action('user_list', (ctx) => {
  let userList = 'User list:\n';
  for (const [, { language, name }] of Object.entries(userLanguages)) {
    userList += `- ${name} - ${language || 'not set'}\n`;
  }
  ctx.reply(userList);
  console.log('Displayed user list');
});

bot.action('help', (ctx) => {
  ctx.reply('Use /translate <target_language> to set your preferred language.\nUse /admin_language <target_language> to set the admin language.\nUse /user_list to see all users and their languages.');
});

bot.command('translate', async (ctx) => {
  const targetLanguage = ctx.message.text.split(' ')[1];
  if (targetLanguage) {
    if (userLanguages[ctx.from.id]) {
      try {
        const response = await axios.post(`${apiUrl}/translate`, {
          text: targetLanguage,
          language: 'english',
          action: 'get_language_name'
        });
        const translatedText = response.data.translated_text.trim();
        userLanguages[ctx.from.id].language = translatedText;
        ctx.reply(`Your preferred language has been set to ${translatedText}.`);
        console.log(`Set language for user ${ctx.from.username} to ${translatedText}`);
      } catch (error) {
        ctx.reply('Error translating the language name.');
        console.error(`Translation API error: ${error}`);
      }
    } else {
      ctx.reply('Please start the bot using /start first.');
    }
  } else {
    ctx.reply('Please specify a target language.');
    console.log(`User ${ctx.from.username} did not specify a target language`);
  }
});

bot.command('admin_language', async (ctx) => {
  const targetLanguage = ctx.message.text.split(' ')[1];
  if (targetLanguage) {
    try {
      const response = await axios.post(`${apiUrl}/translate`, {
        text: targetLanguage,
        language: 'english',
        action: 'get_language_name'
      });
      const translatedText = response.data.translated_text.trim();
      adminLanguage = translatedText;
      ctx.reply(`Admin language has been set to ${translatedText}.`);
      console.log(`Set admin language to ${translatedText}`);
    } catch (error) {
      ctx.reply('Error translating the language name.');
      console.error(`Translation API error: ${error}`);
    }
  } else {
    ctx.reply('Please specify a target language for the admin.');
    console.log('Admin did not specify a target language');
  }
});

const translateText = async (text, targetLanguage) => {
  try {
    const response = await axios.post(`${apiUrl}/translate`, {
      text: text,
      language: targetLanguage,
      action: 'translate_text'
    });
    return response.data.translated_text.trim();
  } catch (error) {
    console.error(`Translation API error: ${error}`);
    throw error;
  }
};

bot.on('text', async (ctx) => {
  if (!userLanguages[ctx.from.id]) {
    ctx.reply('Please start the bot using /start first.');
    console.log(`User ${ctx.from.username} is not recognized, asked to use /start.`);
    return;
  }

  const senderId = ctx.message.from.id;
  const senderLanguage = userLanguages[senderId].language;
  const senderText = ctx.message.text;
  console.log(`Received message from ${ctx.from.username}: ${senderText}`);

  if (senderLanguage || adminLanguage) {
    const chatId = ctx.message.chat.id;

    if (senderLanguage) {
      for (const [userId, { language, name }] of Object.entries(userLanguages)) {
        if (parseInt(userId) !== senderId || environment === 'dev') {
          try {
            console.log(`Translating message for user ${name} (${language})`);
            const translatedText = await translateText(senderText, language);
            console.log(`Translated text: ${translatedText}`);
            await bot.telegram.sendMessage(chatId, `Translated message for ${name} (${language}): ${translatedText}`);
          } catch (error) {
            console.error(`Translation API error: ${error}`);
          }
        }
      }
    }

    if (adminLanguage) {
      try {
        console.log(`Translating message to admin language ${adminLanguage}`);
        const translatedText = await translateText(senderText, adminLanguage);
        console.log(`Translated text to admin language: ${translatedText}`);
        await bot.telegram.sendMessage(chatId, `Default language ${adminLanguage}: ${translatedText}`);
      } catch (error) {
        console.error(`Translation API error: ${error}`);
      }
    }
  } else {
    console.log(`No preferred language set for user ${ctx.from.username}`);
  }
});

bot.launch().then(() => {
  console.log('Bot is running');
});
