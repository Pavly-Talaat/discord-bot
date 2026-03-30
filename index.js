const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const express = require('express');
const mongoose = require('mongoose');

// 👁‍🗨 Gemini AI (Safe Mode)
const { GoogleGenerativeAI } = require("@google/generative-ai");

let model;

try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });

    console.log("✅ Gemini Ready");
} catch (err) {
    console.error("❌ Gemini Init Error:", err);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// 🔥 MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err));

// 🔥 Keep Alive
app.get('/', (req, res) => {
    res.send('Bot is alive 😈🔥');
});

// 🔥 Fix Railway
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// 🔥 Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

// 🔥 Commands
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    handleXP(message);

    // Ping
    if (message.content === "!ping") {
        return message.reply("🏓 Pong from hell!");
    }

    // Level
    if (message.content === "!level") {
        return getLevel(message);
    }

    // 👁‍🗨 AI
    if (message.content.startsWith("/ai")) {
        const prompt = message.content.replace("/ai", "").trim();

        if (!prompt) {
            return message.reply("💀 اكتب سؤالك بعد /ai");
        }

        if (!model) {
            return message.reply("❌ Gemini مش جاهز");
        }

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            if (!text) {
                return message.reply("❌ مفيش رد");
            }

            message.reply(`😈 ${text}`);

        } catch (err) {
            console.error("🔥 Gemini Error:", err);

            // 👁‍🗨 أهم سطر: يمنع الكراش
            return message.reply("❌ Gemini فيه مشكلة (راجع الـ API)");
        }
    }
});

// 🔥 Anti crash
process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

client.login(process.env.TOKEN);