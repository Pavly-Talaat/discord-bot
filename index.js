const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const express = require('express');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 AI Setup
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// السيرفر (عشان Railway)
app.get('/', (req, res) => {
    res.send('Bot is alive 😈');
});

app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// إعداد البوت
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;

// تشغيل البوت
client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

// الأوامر
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    handleXP(message);

    if (message.content === "!ping") {
        message.reply("🏓 Pong from hell!");
    }

    if (message.content === "!level") {
        getLevel(message);
    }

    // 😈 AI COMMAND
    if (message.content.startsWith("!ai")) {
        const prompt = message.content.slice(3).trim();

        if (!prompt) {
            return message.reply("😈 اكتب حاجة بعد !ai");
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a cool helpful assistant." },
                    { role: "user", content: prompt }
                ]
            });

            const reply = response.choices[0].message.content;

            message.reply(reply.slice(0, 2000));

        } catch (err) {
            console.error(err);
            message.reply("💀 حصل خطأ في الذكاء الاصطناعي");
        }
    }
});

// منع الكراش
process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});

// تسجيل الدخول
client.login(TOKEN);