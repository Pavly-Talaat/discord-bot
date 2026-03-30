const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 Web Server (Railway)
app.get('/', (req, res) => {
    res.send('Bot is alive 😈');
});

app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// 🔥 MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

// 🔥 AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// 🔥 Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;

// 🔥 Ready
client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

// 🔥 Commands
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    handleXP(message);

    if (message.content === "!ping") {
        return message.reply("🏓 Pong from hell!");
    }

    if (message.content === "!level") {
        return getLevel(message);
    }

    // 🤖 AI Command
    if (message.content.startsWith("!ai")) {
        const prompt = message.content.slice(4);

        if (!prompt) return message.reply("💀 اكتب سؤال يا شيطان");

        try {
            const result = await model.generateContent(prompt);
            const response = result.response.text();

            message.reply(response.slice(0, 2000));
        } catch (err) {
            console.error(err);
            message.reply("❌ AI فشل في الرد");
        }
    }
});

// 🔥 حماية من الكراش
process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});

// 🔥 Login
client.login(process.env.TOKEN);