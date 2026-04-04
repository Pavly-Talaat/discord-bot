const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const { handleAICommand } = require('./ai');
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

    // !ping command
    if (message.content === "!ping") {
        message.reply("🏓 Pong from Home!");
    }

    // !level command
    if (message.content === "!level") {
        await getLevel(message);
    }

    // /ai command with Gemini API
    if (message.content.startsWith("/ai ")) {
        const question = message.content.slice(4).trim();
        
        if (!question) {
            return message.reply("❌ برجاء كتابة سؤال: `/ai السؤالك هنا`");
        }

        // Show typing indicator
        await message.channel.sendTyping();

        // Call AI handler
        await handleAICommand(message, question);
    }
});

process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

client.login(TOKEN);
