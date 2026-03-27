const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP } = require('./levels');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is alive 😈');
});

app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;

client.once('clientReady', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);

    startMessages(client); // تشغيل الرسائل
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    handleXP(message); // نظام الليفل

    if (message.content === "!ping") {
        message.reply("🏓 Pong from hell!");
    }
});

client.login(TOKEN);