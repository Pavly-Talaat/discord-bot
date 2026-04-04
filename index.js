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

// ⚙️ ID الأدمن (غيّر ده بـ ID ديسكورد بتاعك)
const ADMIN_ID = "YOUR_DISCORD_ID_HERE";

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

    // ========== 🔐 ADMIN COMMANDS ==========
    // 📈 !addxp [@user] [amount]
    if (message.content.startsWith("!addxp")) {
        if (message.author.id !== ADMIN_ID) {
            return message.reply("❌ أنت لا تملك الصلاحية!");
        }
        const mentioned = message.mentions.users.first() || message.author;
        const xpAmount = parseInt(message.content.split(" ")[2]) || 10;

        const db = getDB();
        const users = db.collection("users");

        let user = await users.findOne({ userId: mentioned.id });
        if (!user) {
            user = { userId: mentioned.id, xp: 0, level: 1 };
            await users.insertOne(user);
        }

        user.xp += xpAmount;
        const neededXP = user.level * 100;
        if (user.xp >= neededXP) {
            user.level++;
            user.xp = 0;
        }

        await users.updateOne(
            { userId: mentioned.id },
            { $set: { xp: user.xp, level: user.level } }
        );

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("✅ تم إضافة XP")
            .addFields(
                { name: "👤 اللاعب", value: `<@${mentioned.id}>`, inline: true },
                { name: "➕ الكمية", value: `+${xpAmount} XP`, inline: true },
                { name: "⭐ الليفل", value: `${user.level}`, inline: true }
            )
            .setFooter({ text: "Admin Command 👑" });
        return message.reply({ embeds: [embed] });
    }

    // 📉 !removexp [@user] [amount]
    if (message.content.startsWith("!removexp")) {
        if (message.author.id !== ADMIN_ID) {
            return message.reply("❌ أنت لا تملك الصلاحية!");
        }
        const mentioned = message.mentions.users.first() || message.author;
        const xpAmount = parseInt(message.content.split(" ")[2]) || 10;

        const db = getDB();
        const users = db.collection("users");

        let user = await users.findOne({ userId: mentioned.id });
        if (!user) {
            return message.reply("❌ هذا المستخدم لا يملك XP!");
        }

        user.xp -= xpAmount;
        if (user.xp < 0) user.xp = 0;

        await users.updateOne(
            { userId: mentioned.id },
            { $set: { xp: user.xp } }
        );

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("⚡ تم حذف XP")
            .addFields(
                { name: "👤 اللاعب", value: `<@${mentioned.id}>`, inline: true },
                { name: "➖ الكمية", value: `-${xpAmount} XP`, inline: true },
                { name: "⭐ الليفل", value: `${user.level}`, inline: true }
            )
            .setFooter({ text: "Admin Command 👑" });
        return message.reply({ embeds: [embed] });
    }

    // 🎯 !setlevel [@user] [level]
    if (message.content.startsWith("!setlevel")) {
        if (message.author.id !== ADMIN_ID) {
            return message.reply("❌ أنت لا تملك الصلاحية!");
        }
        const mentioned = message.mentions.users.first() || message.author;
        const newLevel = parseInt(message.content.split(" ")[2]);

        if (!newLevel || newLevel < 1) {
            return message.reply("❌ أدخل ليفل صحيح!");
        }

        const db = getDB();
        const users = db.collection("users");

        let user = await users.findOne({ userId: mentioned.id });
        if (!user) {
            user = { userId: mentioned.id, xp: 0, level: 1 };
            await users.insertOne(user);
        }

        user.level = newLevel;
        user.xp = 0;

        await users.updateOne(
            { userId: mentioned.id },
            { $set: { level: user.level, xp: user.xp } }
        );

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor("#9900FF")
            .setTitle("🎯 تم تحديث الليفل")
            .addFields(
                { name: "👤 اللاعب", value: `<@${mentioned.id}>`, inline: true },
                { name: "⭐ الليفل الجديد", value: `${newLevel}`, inline: true }
            )
            .setFooter({ text: "Admin Command 👑" });
        return message.reply({ embeds: [embed] });
    }

    // 🔄 !reset [@user]
    if (message.content.startsWith("!reset")) {
        if (message.author.id !== ADMIN_ID) {
            return message.reply("❌ أنت لا تملك الصلاحية!");
        }
        const mentioned = message.mentions.users.first() || message.author;

        const db = getDB();
        const users = db.collection("users");

        await users.updateOne(
            { userId: mentioned.id },
            { $set: { level: 1, xp: 0 } },
            { upsert: true }
        );

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor("#FF6600")
            .setTitle("🔄 تم إعادة تعيين البيانات")
            .setDescription(`تم إعادة تعيين بيانات <@${mentioned.id}>`)
            .setFooter({ text: "Admin Command 👑" });
        return message.reply({ embeds: [embed] });
    }

    // 👑 !userdata [@user]
    if (message.content.startsWith("!userdata")) {
        if (message.author.id !== ADMIN_ID) {
            return message.reply("❌ أنت لا تملك الصلاحية!");
        }
        const mentioned = message.mentions.users.first();
        if (!mentioned) {
            return message.reply("❌ اذكر المستخدم!");
        }

        const db = getDB();
        const users = db.collection("users");

        const user = await users.findOne({ userId: mentioned.id });
        if (!user) {
            return message.reply("❌ لا توجد بيانات لهذا المستخدم!");
        }

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor("#0099FF")
            .setTitle("📋 بيانات المستخدم")
            .setThumbnail(mentioned.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "👤 اسم المستخدم", value: `${mentioned.username}`, inline: true },
                { name: "🆔 الـ ID", value: `${mentioned.id}`, inline: true },
                { name: "⭐ الليفل", value: `${user.level}`, inline: true },
                { name: "✨ XP", value: `${user.xp} / ${user.level * 100}`, inline: true }
            )
            .setFooter({ text: "Admin Command 👑" });
        return message.reply({ embeds: [embed] });
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