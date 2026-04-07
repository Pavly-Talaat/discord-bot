require("dotenv").config();

const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel, getLeaderboard } = require('./levels');
const { getDB, connectDB } = require('./database');

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// 🔥 DB
connectDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;

client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // 🔥 XP
    await handleXP(message);

    // 🟢 ping
    if (message.content === "!ping") {
        return message.reply("🏓 Pong!");
    }

    // 🟢 level (صورة احترافية)
    if (message.content === "!level") {
        return await getLevel(message);
    }

    // 🏆 Best 5 Players (صورة احترافية)
    if (message.content === "!top" || message.content === "!best" || message.content === "!leaderboard") {
        return await getLeaderboard(message);
    }
});

process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

client.login(TOKEN);
