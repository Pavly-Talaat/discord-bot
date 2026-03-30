const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const express = require('express');
const mongoose = require('mongoose');
const axios = require("axios"); // 👁‍🗨 AI

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

// 🔥 Railway Fix
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// 🔥 Discord Bot
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

    // 🏓 Ping
    if (message.content === "!ping") {
        return message.reply("🏓 Pong from hell!");
    }

    // 🔥 Level
    if (message.content === "!level") {
        return getLevel(message);
    }

    // 👁‍🗨 AI (DeepAI Fast)
    if (message.content.startsWith("/ai")) {
        const prompt = message.content.replace("/ai", "").trim();

        if (!prompt) {
            return message.reply("💀 اكتب سؤالك بعد /ai");
        }

        try {
            const res = await axios.post(
                "https://api.deepai.org/api/text-generator",
                { text: prompt },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const text = res.data.output;

            if (!text) {
                return message.reply("❌ مفيش رد");
            }

            message.reply(`😈 ${text}`);

        } catch (err) {
            console.error("AI Error:", err);
            message.reply("❌ الذكاء الصناعي رفض التنفيذ");
        }
    }
});

// 🔥 Anti Crash
process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

// 🔥 Login
client.login(process.env.TOKEN);