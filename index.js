require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
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

    // 🟢 level
    if (message.content === "!level") {
        return await getLevel(message);
    }

    // 🏆 Best 5 Players (👑 نسخة احترافية)
    if (message.content === "!best") {
        const db = getDB();
        if (!db) return;

        const users = db.collection("users");

        const topUsers = await users
            .find()
            .sort({ level: -1, xp: -1 })
            .limit(5)
            .toArray();

        if (!topUsers.length) {
            return message.reply("❌ مفيش بيانات لسه");
        }

        let description = "";

        for (let i = 0; i < topUsers.length; i++) {
            const u = topUsers[i];

            let medal = "🔹";
            if (i === 0) medal = "🥇";
            else if (i === 1) medal = "🥈";
            else if (i === 2) medal = "🥉";

            description += `${medal} **#${i + 1}** - <@${u.userId}> (Level ${u.level})\n`;
        }

        // 👑 Top 1
        let topUser = null;
        try {
            topUser = await client.users.fetch(topUsers[0].userId);
        } catch (err) {
            console.log("❌ Failed to fetch top user");
        }

        let title = "🏆 Best 5 Players";

        if (topUser) {
            title = `👑 ${topUser.username} | Top Player`;
        }

        const embed = new EmbedBuilder()
            .setColor("#FFD700")
            .setTitle(title)
            .setDescription(description)
            .setFooter({ text: "Devil Bot 😈" });

        if (topUser) {
            const avatar = topUser.displayAvatarURL({ dynamic: true, size: 1024 });
            embed.setImage(avatar);
        }

        message.reply({ embeds: [embed] });
    }
});

process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

client.login(TOKEN);