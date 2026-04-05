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

        await handleXP(message);

        const args = message.content.split(" ");
        const command = args[0];
        const mentionedUser = message.mentions.users.first();

        // 🟢 ping
        if (command === "!ping") return message.reply("🏓 Pong!");

        // 🟢 level
        if (command === "!level") return await getLevel(message);

        // ================== 🏆 TOP ==================
        if (command === "!top") {
            const topUsers = await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();

            if (!topUsers.length) return message.reply("❌ مفيش بيانات");

            let description = "";

            for (let i = 0; i < topUsers.length; i++) {
                const u = topUsers[i];

                let medal = ["🥇", "🥈", "🥉"][i] || "🔹";

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

        // ================== 💀 OWNER ONLY ==================
        const ownerOnly = ["!addxp", "!rexp", "!addlevel", "!relevel", "!alllevels", "!clear"];

        if (ownerOnly.includes(command) && message.author.id !== OWNER_ID) {
            return message.reply("⚠️ هذا الأمر محظور… ملك الشياطين فقط 👑💀");
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

        // ================== 👑 ALL LEVELS ==================
        if (command === "!alllevels") {

            const allUsers = await users.find().sort({ level: -1, xp: -1 }).limit(20).toArray();

            if (!allUsers.length) return message.reply("❌ مفيش بيانات");

            let desc = "";

            for (let i = 0; i < allUsers.length; i++) {
                const u = allUsers[i];
                desc += `👑 #${i + 1} - <@${u.userId}>\n⭐ Level: ${u.level} | XP: ${u.xp}\n\n`;
            }

            const embed = new EmbedBuilder()
                .setColor("#00ff99")
                .setTitle("📊 All Users Levels")
                .setDescription(desc)
                .setFooter({ text: "Devil System 😈" });

            return message.reply({ embeds: [embed] });
        }

        // ================== 💀 CLEAR ==================
        if (command === "!clear") {

            const amount = parseInt(args[1]);

            if (isNaN(amount) || amount <= 0 || amount > 100) {
                return message.reply("❌ اكتب رقم من 1 لـ 100");
            }

            await message.channel.bulkDelete(amount, true);

            return message.channel.send(`💀 تم حذف ${amount} رسالة`).then(msg => {
                setTimeout(() => msg.delete(), 3000);
            });
        }

        // ================== 🔒 RANK ==================
        if (command === "!rank") {

            if (!hasPermission(message)) {
                return message.reply("❌ الأمر مرفوض");
            }

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

            let member;
            try {
                member = await message.guild.members.fetch(userId);
            } catch {
                member = null;
            }

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

client.login(TOKEN);