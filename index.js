require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
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

connectDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;
const OWNER_ID = "880803449632079883";

// 👑 صلاحيات rank
function hasPermission(message) {
    return (
        message.author.id === OWNER_ID ||
        message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
        message.member.roles.cache.some(role => role.name === "VIP")
    );
}

client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const db = getDB();
    if (!db) return;

    const users = db.collection("users");

    await handleXP(message);

    const args = message.content.split(" ");
    const command = args[0];
    const mentionedUser = message.mentions.users.first();

    // 🟢 ping
    if (command === "!ping") {
        return message.reply("🏓 Pong!");
    }

    // 🟢 level
    if (command === "!level") {
        return await getLevel(message);
    }

    // 🏆 top
    if (command === "!top") {
        const topUsers = await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();

        let desc = topUsers.map((u, i) =>
            `${i+1}# - <@${u.userId}> (Level ${u.level})`
        ).join("\n");

        return message.reply({ embeds: [
            new EmbedBuilder()
            .setTitle("🏆 Top 5 Players")
            .setDescription(desc || "❌ مفيش بيانات")
        ]});
    }

    // ================== 💀 OWNER ONLY ==================

    const ownerOnly = ["!addxp", "!rexp", "!addlevel", "!relevel"];

    if (ownerOnly.includes(command) && message.author.id !== OWNER_ID) {
        return message.reply("⚠️ هذا الأمر محظور… خاص بي owner فقط من يتحكم هنا 👑💀");
    }

    // 🔥 addxp
    if (command === "!addxp") {
        const amount = parseInt(args[2]);
        if (!mentionedUser || isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id }) || { userId: mentionedUser.id, xp: 0, level: 1 };

        user.xp += amount;

        await users.updateOne({ userId: mentionedUser.id }, { $set: user }, { upsert: true });

        return message.reply(`🔥 +${amount} XP → ${mentionedUser}`);
    }

    // 💀 rexp
    if (command === "!rexp") {
        const amount = parseInt(args[2]);
        if (!mentionedUser || isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id });
        if (!user) return;

        user.xp = Math.max(0, user.xp - amount);

        await users.updateOne({ userId: mentionedUser.id }, { $set: user });

        return message.reply(`💀 -${amount} XP ← ${mentionedUser}`);
    }

    // 👑 addlevel
    if (command === "!addlevel") {
        const amount = parseInt(args[2]);
        if (!mentionedUser || isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id }) || { userId: mentionedUser.id, xp: 0, level: 1 };

        user.level += amount;

        await users.updateOne({ userId: mentionedUser.id }, { $set: user }, { upsert: true });

        return message.reply(`👑 +${amount} Level → ${mentionedUser}`);
    }

    // 💀 relevel
    if (command === "!relevel") {
        const amount = parseInt(args[2]);
        if (!mentionedUser || isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id });
        if (!user) return;

        user.level = Math.max(1, user.level - amount);

        await users.updateOne({ userId: mentionedUser.id }, { $set: user });

        return message.reply(`💀 -${amount} Level ← ${mentionedUser}`);
    }

    // ================== 👑 rank ==================

    if (command === "!rank") {

        if (!hasPermission(message)) {
            return message.reply("❌ الأمر مرفوض");
        }

        if (!mentionedUser) return message.reply("❌ منشن الشخص");

        return await getLevel(message, mentionedUser);
    }
});

client.login(TOKEN);