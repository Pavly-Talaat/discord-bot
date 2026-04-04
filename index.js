require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const { getDB, connectDB } = require('./database');

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running'));

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

    // 🟢 level (لنفسك)
    if (command === "!level") {
        return await getLevel(message);
    }

    // ================== 🏆 TOP (بالشكل الاحترافي) ==================

    if (command === "!top") {

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
            title = `👑 ${topUser.username.toUpperCase()} | TOP PLAYER`;
        }

        const embed = new EmbedBuilder()
            .setColor("#FFD700")
            .setTitle(title)
            .setDescription(description)
            .setFooter({ text: "🔥 DEVIL SYSTEM" })
            .setTimestamp();

        if (topUser) {
            const avatar = topUser.displayAvatarURL({ dynamic: true, size: 1024 });

            embed
                .setImage(avatar)
                .setThumbnail(avatar);
        }

        return message.reply({ embeds: [embed] });
    }

    // ================== 💀 OWNER ONLY ==================

    const ownerOnly = ["!addxp", "!rexp", "!addlevel", "!relevel"];

    if (ownerOnly.includes(command) && message.author.id !== OWNER_ID) {
        return message.reply("⚠️ هذا الأمر محظور… ملك الشياطين فقط 👑💀");
    }

    // 🔥 addxp
    if (command === "!addxp") {
        if (!mentionedUser) return;
        const amount = parseInt(args[2]);
        if (isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id }) || { userId: mentionedUser.id, xp: 0, level: 1 };

        user.xp += amount;

        await users.updateOne({ userId: mentionedUser.id }, { $set: user }, { upsert: true });

        return message.reply(`🔥 +${amount} XP → ${mentionedUser}`);
    }

    // 💀 rexp
    if (command === "!rexp") {
        if (!mentionedUser) return;
        const amount = parseInt(args[2]);
        if (isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id });
        if (!user) return;

        user.xp = Math.max(0, user.xp - amount);

        await users.updateOne({ userId: mentionedUser.id }, { $set: user });

        return message.reply(`💀 -${amount} XP ← ${mentionedUser}`);
    }

    // 👑 addlevel
    if (command === "!addlevel") {
        if (!mentionedUser) return;
        const amount = parseInt(args[2]);
        if (isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id }) || { userId: mentionedUser.id, xp: 0, level: 1 };

        user.level += amount;

        await users.updateOne({ userId: mentionedUser.id }, { $set: user }, { upsert: true });

        return message.reply(`👑 +${amount} Level → ${mentionedUser}`);
    }

    // 💀 relevel
    if (command === "!relevel") {
        if (!mentionedUser) return;
        const amount = parseInt(args[2]);
        if (isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id });
        if (!user) return;

        user.level = Math.max(1, user.level - amount);

        await users.updateOne({ userId: mentionedUser.id }, { $set: user });

        return message.reply(`💀 -${amount} Level ← ${mentionedUser}`);
    }

    // ================== 🔒 RANK (نفس تصميم level) ==================

    if (command === "!rank") {

        if (!hasPermission(message)) {
            return message.reply("❌ الأمر مرفوض");
        }

        if (!mentionedUser) return message.reply("❌ منشن الشخص");

        return await getLevel(message, mentionedUser);
    }
});

client.login(TOKEN);