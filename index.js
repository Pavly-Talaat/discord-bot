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

// 👑 تحقق الصلاحيات (Owner + Admin + VIP فقط)
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

    // 🔥 XP System
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

    // 🏆 top
    if (command === "!top") {
        const topUsers = await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();

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

        const embed = new EmbedBuilder()
            .setColor("#FFD700")
            .setTitle("🏆 Top 5 Players")
            .setDescription(description)
            .setFooter({ text: "Devil Bot 😈" });

        message.reply({ embeds: [embed] });
    }

    // ================== 👑 OWNER COMMANDS ==================

    if (command === "!addxp" && message.author.id === OWNER_ID) {
        if (!mentionedUser) return message.reply("❌ منشن الشخص");
        const amount = parseInt(args[2]);
        if (isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id });
        if (!user) user = { userId: mentionedUser.id, xp: 0, level: 1 };

        user.xp += amount;

        await users.updateOne(
            { userId: mentionedUser.id },
            { $set: user },
            { upsert: true }
        );

        return message.reply(`🔥 +${amount} XP → ${mentionedUser}`);
    }

    if (command === "!rexp" && message.author.id === OWNER_ID) {
        if (!mentionedUser) return message.reply("❌ منشن الشخص");
        const amount = parseInt(args[2]);
        if (isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id });
        if (!user) return;

        user.xp = Math.max(0, user.xp - amount);

        await users.updateOne(
            { userId: mentionedUser.id },
            { $set: user }
        );

        return message.reply(`💀 -${amount} XP ← ${mentionedUser}`);
    }

    if (command === "!addlevel" && message.author.id === OWNER_ID) {
        if (!mentionedUser) return message.reply("❌ منشن الشخص");
        const amount = parseInt(args[2]);
        if (isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id });
        if (!user) user = { userId: mentionedUser.id, xp: 0, level: 1 };

        user.level += amount;

        await users.updateOne(
            { userId: mentionedUser.id },
            { $set: user },
            { upsert: true }
        );

        return message.reply(`👑 +${amount} Level → ${mentionedUser}`);
    }

    if (command === "!relevel" && message.author.id === OWNER_ID) {
        if (!mentionedUser) return message.reply("❌ منشن الشخص");
        const amount = parseInt(args[2]);
        if (isNaN(amount)) return;

        let user = await users.findOne({ userId: mentionedUser.id });
        if (!user) return;

        user.level = Math.max(1, user.level - amount);

        await users.updateOne(
            { userId: mentionedUser.id },
            { $set: user }
        );

        return message.reply(`💀 -${amount} Level ← ${mentionedUser}`);
    }

    // ================== 🔒 RANK (Owner + Admin + VIP فقط) ==================

    if (command === "!rank") {

        if (!hasPermission(message)) {
            return message.reply("❌ الأمر مرفوض");
        }

        if (!mentionedUser) return message.reply("❌ منشن الشخص");

        const userId = mentionedUser.id;

        let user = await users.findOne({ userId });

        if (!user) {
            return message.reply("❌ الشخص ده معندوش بيانات");
        }

        const level = user.level;
        const xp = user.xp;
        const neededXP = level * 100;

        const percentage = xp / neededXP;
        const totalBars = 10;
        const filledBars = Math.round(percentage * totalBars);
        const emptyBars = totalBars - filledBars;
        const xpBar = "█".repeat(filledBars) + "░".repeat(emptyBars);

        const allUsers = await users.find().sort({ level: -1, xp: -1 }).toArray();
        const index = allUsers.findIndex(u => u.userId === userId);
        const rank = index === -1 ? "?" : index + 1;

        const member = message.guild.members.cache.get(userId);
        const name = member?.displayName || mentionedUser.username;

        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setAuthor({
                name: `📊 إحصائيات ${name}`,
                iconURL: mentionedUser.displayAvatarURL()
            })
            .setThumbnail(mentionedUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "⭐ المستوى", value: `\`${level}\``, inline: true },
                { name: "👑 الرتبة", value: `\`#${rank}\``, inline: true },
                { name: "✨ النقاط", value: `\`${xp} / ${neededXP}\`\n${xpBar}` }
            )
            .setFooter({ text: "Devil Bot 😈" });

        message.reply({ embeds: [embed] });
    }
});

process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

client.login(TOKEN);