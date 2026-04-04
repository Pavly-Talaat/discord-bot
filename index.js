const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel, addXP, removeXP, addLevel, removeLevel, getTopUsers } = require('./levels');
const express = require('express');
const { connectDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// 🔥 الاتصال بقاعدة البيانات
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

    await handleXP(message);

    // !ping
    if (message.content === "!ping") {
        message.reply("🏓 Pong from Home!");
    }

    // !level
    if (message.content === "!level") {
        await getLevel(message);
    }

    // !top
    if (message.content === "!top") {
        await getTopUsers(message);
    }

    // !addxp @user <amount>
    if (message.content.startsWith("!addxp")) {
        const args = message.content.split(" ");
        await addXP(message, args);
    }

    // !removexp @user <amount>
    if (message.content.startsWith("!removexp")) {
        const args = message.content.split(" ");
        await removeXP(message, args);
    }

    // !addlevel @user <amount>
    if (message.content.startsWith("!addlevel")) {
        const args = message.content.split(" ");
        await addLevel(message, args);
    }

    // !removelevel @user <amount>
    if (message.content.startsWith("!removelevel")) {
        const args = message.content.split(" ");
        await removeLevel(message, args);
    }
});

process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

client.login(TOKEN);
