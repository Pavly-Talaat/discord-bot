const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const { connectDB } = require('./database');

const {
    handleXP,
    getLevel,
    getTop,
    addStats,
    removeStats
} = require('./levels');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is alive 😈');
});

app.listen(PORT, '0.0.0.0');

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
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    await handleXP(message);

    const args = message.content.split(" ");
    const cmd = args[0];

    if (cmd === "!ping") {
        message.reply("🏓 Pong from hell!");
    }

    if (cmd === "!level") {
        const user = message.mentions.users.first();
        await getLevel(message, user);
    }

    if (cmd === "!top") {
        const top = await getTop();

        let text = "👑 TOP 5 👑\n\n";

        const firstUser = await client.users.fetch(top[0].userId);

        text += `🥇 ${firstUser.username} (Level ${top[0].level})\n\n`;

        for (let i = 1; i < top.length; i++) {
            text += `#${i + 1} - Level ${top[i].level}\n`;
        }

        await message.channel.send({
            content: text,
            files: [{
                attachment: firstUser.displayAvatarURL({ extension: 'png', size: 512 }),
                name: "top1.png"
            }]
        });
    }

    if (cmd === "!add") {
        if (!isAdmin(message.member)) return;

        const user = message.mentions.users.first();
        const hp = parseInt(args[2]);
        const level = parseInt(args[3]);

        await addStats(user.id, hp, level);

        message.reply("😈 تم التعزيز");
    }

    if (cmd === "!remove") {
        if (!isAdmin(message.member)) return;

        const user = message.mentions.users.first();
        const hp = parseInt(args[2]);
        const level = parseInt(args[3]);

        await removeStats(user.id, hp, level);

        message.reply("💀 تم الإضعاف");
    }
});

client.login(TOKEN);