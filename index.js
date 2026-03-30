const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 مهم جداً: Trust Proxy (Railway fix)
app.set('trust proxy', 1);

// 🔥 MongoDB اتصال
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err));

// 🔥 Route علشان Railway يفضل شايف السيرفر شغال
app.get('/', (req, res) => {
    res.status(200).send('Bot is alive 😈🔥');
});

// 🔥 تشغيل السيرفر (بدون 0.0.0.0)
app.listen(PORT, () => {
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
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    handleXP(message);

    if (message.content === "!ping") {
        message.reply("🏓 Pong from hell!");
    }

    if (message.content === "!level") {
        getLevel(message);
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