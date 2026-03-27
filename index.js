const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send('Bot is alive 😈');
});

app.listen(3000, () => {
    console.log('🌐 Web server running...');
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

const TOKEN = process.env.TOKEN;

client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

client.on('messageCreate', (message) => {
    if (message.content === "!ping") {
        message.reply("🏓 Pong from hell!");
    }
});

client.login(TOKEN);
