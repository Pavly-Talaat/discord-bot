const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

const TOKEN = process.env.TOKEN;

client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);

    // 👇 تشغيل نظام الرسائل
    startMessages(client);
});

client.on('messageCreate', (message) => {
    if (message.content === "!ping") {
        message.reply("🏓 Pong from hell!");
    }
});

client.login(TOKEN);
