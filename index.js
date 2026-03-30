const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const express = require('express');
const mongoose = require('mongoose');

// 👁‍🗨 Gemini AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 مهم جداً: Railway fix
app.set('trust proxy', 1);

// 🔥 MongoDB اتصال
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err));

// 🔥 Route علشان Railway يفضل شايف السيرفر شغال
app.get('/', (req, res) => {
    res.status(200).send('Bot is alive 😈🔥');
});

// 🔥 تشغيل السيرفر (FIX SIGTERM)
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// 🔥 إعداد البوت
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;

// 🔥 لما البوت يشتغل
client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

// 🔥 الأوامر
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    handleXP(message);

    // 🏓 Ping
    if (message.content === "!ping") {
        message.reply("🏓 Pong from hell!");
    }

    // 🔥 Level
    if (message.content === "!level") {
        getLevel(message);
    }

    // 👁‍🗨 AI Command
    if (message.content.startsWith("/ai")) {
        const prompt = message.content.replace("/ai", "").trim();

        if (!prompt) {
            return message.reply("💀 اكتب سؤالك بعد /ai");
        }

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            message.reply(`😈 ${text}`);
        } catch (err) {
            console.error(err);
            message.reply("❌ خطأ شيطاني حصل");
        }
    }
});

// 🔥 منع الكراش
process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});

// 🔥 تسجيل الدخول
client.login(TOKEN);