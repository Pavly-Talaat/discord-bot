const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const {
    handleXP,
    getLevel,
    getTop,
    addStats,
    removeStats
} = require('./levels');

const express = require('express');
const { connectDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

connectDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;

// 👑 Admin
function isAdmin(member) {
    return member.permissions.has("Administrator");
}

client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    await handleXP(message);

    const args = message.content.split(" ");
    const cmd = args[0];

    if (cmd === "!ping") {
        message.reply("🏓 Pong from Home!");
    }

    // 🎯 level لأي حد
    if (cmd === "!level") {
        const user = message.mentions.users.first();
        await getLevel(message, user);
    }

    // 🔝 top + صورة الاول
    if (cmd === "!top") {
        const top = await getTop();
        if (!top.length) return;

        const firstUser = await client.users.fetch(top[0].userId);

        let text = `👑 TOP DEVIL 👑\n\n`;
        text += `🥇 ${firstUser.username}\n`;
        text += `Level: ${top[0].level} | HP: ${top[0].hp}\n\n`;

        text += "🔥 باقي التوب:\n";

        for (let i = 1; i < top.length; i++) {
            text += `#${i + 1} - Level ${top[i].level} | HP ${top[i].hp}\n`;
        }

        message.channel.send({
            content: text,
            files: [
                {
                    attachment: firstUser.displayAvatarURL({ extension: 'png', size: 512 }),
                    name: "top1.png"
                }
            ]
        });
    }

    // ➕ add
    if (cmd === "!add") {
        if (!isAdmin(message.member)) return;

        const user = message.mentions.users.first();
        const hp = parseInt(args[2]);
        const level = parseInt(args[3]);

        await addStats(user.id, hp, level);

        message.channel.send("😈 تم التعزيز");
    }

    // ➖ remove
    if (cmd === "!remove") {
        if (!isAdmin(message.member)) return;

        const user = message.mentions.users.first();
        const hp = parseInt(args[2]);
        const level = parseInt(args[3]);

        await removeStats(user.id, hp, level);

        message.channel.send("💀 تم الإضعاف");
    }
});

process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

client.login(TOKEN);