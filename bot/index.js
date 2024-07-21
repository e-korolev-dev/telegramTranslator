const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const apiUrl = process.env.API_URL;
const environment = process.env.NODE_ENV || 'prod';
let userLanguages = {};
let adminLanguage = null;
bot.start((ctx) => {
  userLanguages[ctx.from.id] = { language: null, name: ctx.from.first_name || ctx.from.username };
  ctx.reply('Welcome! Send me a message and I will translate it for you. Use /translate <target_language> to set your preferred language.');
  console.log('Started conversation with:', ctx.from.username);
});
bot.command('translate', async (ctx) => {
  const targetLanguage = ctx.message.text.split(' ')[1];
  if (targetLanguage) {
    try {
      const response = await axios.post(`${apiUrl}/translate`, {
        text: targetLanguage,
        language: 'english',
      });
      const translatedLanguage = response.data.translated_text.trim();
      if (userLanguages[ctx.from.id]) {
        userLanguages[ctx.from.id].language = translatedLanguage;
        ctx.reply(`Your preferred language has been set to ${targetLanguage} translates to ${translatedLanguage} in english.`);
        console.log(`Set language for user ${ctx.from.username} to ${translatedLanguage}`);
      } else {
        ctx.reply('Please start the bot using /start first.');
      }
    } catch (error) {
      ctx.reply('Error translating the language.');
      console.error(`Translation API error: ${error}`);
    }
  } else {
    ctx.reply('Please specify a target language.');
    console.log(`User ${ctx.from.username} did not specify a target language`);
  }
});
bot.command('admin_language', (ctx) => {
  const targetLanguage = ctx.message.text.split(' ')[1];
  if (targetLanguage) {
    adminLanguage = targetLanguage;
    ctx.reply(`Admin language has been set to ${targetLanguage}.`);
    console.log(`Set admin language to ${targetLanguage}`);
  } else {
    ctx.reply('Please specify a target language for the admin.');
    console.log('Admin did not specify a target language');
  }
});
bot.command('user_list', (ctx) => {
  let userList = 'User list:\n';
  for (const [, { language, name }] of Object.entries(userLanguages)) {
    userList += `- ${name} - ${language || 'not set'}\n`;
  }
  ctx.reply(userList);
  console.log('Displayed user list');
});
const translateText = async (text, targetLanguage) => {
  try {
    const response = await axios.post(`${apiUrl}/translate`, {
      text: text,
      language: targetLanguage,
    });
    return response.data.translated_test.trim();
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
