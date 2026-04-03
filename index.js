// index.js
const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const { askAI, clearChat } = require('./ai');
const express = require('express');
const { connectDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Devil Bot is running 🔥😈');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

connectDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
    console.error("❌ خطأ فادح: لم يتم العثور على TOKEN في متغيرات البيئة!");
    process.exit(1);
}

client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    await handleXP(message);

    if (message.content === "!ping") {
        message.reply("🏓 Pong!");
    }

    if (message.content === "!level") {
        await getLevel(message);
    }

    if (message.content.startsWith("/ai")) {
        const question = message.content.slice(4).trim();
        if (!question) {
            return message.reply("❌ اكتب سؤالك بعد `/ai`\nمثال: `/ai كيف حالك؟`");
        }
        
        await message.channel.sendTyping();
        const aiResponse = await askAI(question, message.author.id);
        
        if (aiResponse.length > 2000) {
            const chunks = aiResponse.match(/[\s\S]{1,1900}/g) || [];
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            await message.reply(aiResponse);
        }
    }
    
    if (message.content === "/clearai") {
        const result = clearChat(message.author.id);
        message.reply(result);
    }
});

process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

client.login(TOKEN);