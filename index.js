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
    try {
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

        // 🟢 level
        if (command === "!level") {
            return await getLevel(message);
        }

        // ================== 🏆 TOP ==================
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

            let topUser = null;
            try {
                topUser = await client.users.fetch(topUsers[0].userId);
            } catch {}

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
                embed.setImage(avatar).setThumbnail(avatar);
            }

            return message.reply({ embeds: [embed] });
        }

        // ================== 💀 OWNER ONLY ==================
        const ownerOnly = ["!addxp", "!rexp", "!addlevel", "!relevel"];

        if (ownerOnly.includes(command) && message.author.id !== OWNER_ID) {
            return message.reply("⚠️ هذا الأمر محظور… خاص بي owner فقط من يتحكم هنا 👑💀");
        }

        // 🔥 addxp
        if (command === "!addxp") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return;

            let user = await users.findOne({ userId: mentionedUser.id }) 
                || { userId: mentionedUser.id, xp: 0, level: 1 };

            user.xp += amount;

            await users.updateOne(
                { userId: mentionedUser.id },
                { $set: user },
                { upsert: true }
            );

            return message.reply(`🔥 +${amount} XP → ${mentionedUser}`);
        }

        // 💀 rexp
        if (command === "!rexp") {
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

        // 👑 addlevel
        if (command === "!addlevel") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return;

            let user = await users.findOne({ userId: mentionedUser.id }) 
                || { userId: mentionedUser.id, xp: 0, level: 1 };

            user.level += amount;

            await users.updateOne(
                { userId: mentionedUser.id },
                { $set: user },
                { upsert: true }
            );

            return message.reply(`👑 +${amount} Level → ${mentionedUser}`);
        }

        // 💀 relevel
        if (command === "!relevel") {
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

        // ================== 🔒 RANK (مضمون 100%) ==================
        if (command === "!rank") {

            if (!hasPermission(message)) {
                return message.reply("❌ الأمر مرفوض");
            }

            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const userId = mentionedUser.id;

            const user = await users.findOne({ userId });

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

            return message.reply({ embeds: [embed] });
        }

    } catch (err) {
        console.error("❌ ERROR:", err);
    }
});

process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

client.login(TOKEN);