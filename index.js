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

client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot) return;

        const db = getDB();
        if (!db) return;

        const users = db.collection("users");

        await handleXP(message);

        const args = message.content.split(" ");
        const command = args[0];
        const mentionedUser = message.mentions.users.first();

        // ================== 👤 USER COMMANDS ==================

        // 🟢 level
        if (command === "!level") {
            return await getLevel(message);
        }

        // 🏆 top
        if (command === "!top") {

            const topUsers = await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();

            if (!topUsers.length) return message.reply("❌ مفيش بيانات");

            let description = "";

            for (let i = 0; i < topUsers.length; i++) {
                const u = topUsers[i];
                const medal = ["🥇", "🥈", "🥉"][i] || "🔹";
                description += `${medal} #${i + 1} - <@${u.userId}> (Level ${u.level})\n`;
            }

            let topUser = null;
            try {
                topUser = await client.users.fetch(topUsers[0].userId);
            } catch {}

            let title = "🏆 Best 5 Players";
            if (topUser) title = `👑 ${topUser.username.toUpperCase()} | TOP PLAYER`;

            const embed = new EmbedBuilder()
                .setColor("#FFD700")
                .setTitle(title)
                .setDescription(description)
                .setFooter({ text: "🔥 DEVIL SYSTEM" })
                .setTimestamp();

            if (topUser) {
                const avatar = topUser.displayAvatarURL({ dynamic: true, size: 1024 });
                embed.setImage(avatar).setThumbnail(avatar);
            }

            return message.reply({ embeds: [embed] });
        }

        // ================== 💀 OWNER CHECK ==================
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ الأمر مرفوض… هذا النظام تحت سيطرة الأونر فقط 👑💀");
        }

        // ================== 👑 OWNER COMMANDS ==================

        if (command === "!ping") {
            return message.reply("🏓 Pong!");
        }

        // 🔥 addxp
        if (command === "!addxp") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return;

            await users.updateOne(
                { userId: mentionedUser.id },
                { $inc: { xp: amount }, $setOnInsert: { level: 1 } },
                { upsert: true }
            );

            return message.reply(`🔥 +${amount} XP → ${mentionedUser}`);
        }

        // 💀 rexp
        if (command === "!rexp") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return;

            await users.updateOne(
                { userId: mentionedUser.id },
                { $inc: { xp: -amount } }
            );

            return message.reply(`💀 -${amount} XP ← ${mentionedUser}`);
        }

        // 👑 addlevel
        if (command === "!addlevel") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return;

            await users.updateOne(
                { userId: mentionedUser.id },
                { $inc: { level: amount }, $setOnInsert: { xp: 0 } },
                { upsert: true }
            );

            return message.reply(`👑 +${amount} Level → ${mentionedUser}`);
        }

        // 💀 relevel
        if (command === "!relevel") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return;

            await users.updateOne(
                { userId: mentionedUser.id },
                { $inc: { level: -amount } }
            );

            return message.reply(`💀 -${amount} Level ← ${mentionedUser}`);
        }

        // 👑 alllevels
        if (command === "!alllevels") {

            const allUsers = await users.find().sort({ level: -1, xp: -1 }).limit(20).toArray();

            let desc = "";

            for (let i = 0; i < allUsers.length; i++) {
                const u = allUsers[i];
                desc += `👑 #${i + 1} - <@${u.userId}>\n⭐ Level: ${u.level} | XP: ${u.xp}\n\n`;
            }

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("📊 All Users")
                        .setDescription(desc)
                ]
            });
        }

        // 💀 clear
        if (command === "!clear") {
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0 || amount > 100) {
                return message.reply("❌ رقم من 1 لـ 100");
            }

            await message.channel.bulkDelete(amount, true);
            return message.channel.send(`💀 تم حذف ${amount}`).then(m => setTimeout(() => m.delete(), 3000));
        }

        // 👑 rank
        if (command === "!rank") {

            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const userId = mentionedUser.id;

            await users.updateOne(
                { userId },
                { $setOnInsert: { userId, xp: 0, level: 1 } },
                { upsert: true }
            );

            const user = await users.findOne({ userId });

            const level = user.level;
            const xp = user.xp;
            const neededXP = level * 100;

            const percentage = xp / neededXP;
            const bars = Math.round(percentage * 10);
            const xpBar = "█".repeat(bars) + "░".repeat(10 - bars);

            const rank = await users.countDocuments({
                $or: [
                    { level: { $gt: level } },
                    { level: level, xp: { $gt: xp } }
                ]
            }) + 1;

            const embed = new EmbedBuilder()
                .setColor("#2b2d31")
                .setTitle(`📊 ${mentionedUser.username}`)
                .setDescription(`⭐ Level: ${level}\n👑 Rank: #${rank}\n✨ XP: ${xp}/${neededXP}\n${xpBar}`);

            return message.reply({ embeds: [embed] });
        }

    } catch (err) {
        console.error(err);
    }
});

client.login(TOKEN);