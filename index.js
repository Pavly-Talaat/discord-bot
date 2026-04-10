require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const { getDB, connectDB } = require('./database');

// 🔥 استدعاء نظام التذاكر المطور
const { handleTicketInteraction, sendPanel } = require("./ticket");

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Devil Bot is Online 😈'));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Server running on port ${PORT}`));

// 🔥 الاتصال بقاعدة البيانات
connectDB().catch(console.error);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const OWNER_ID = "880803449632079883";

client.once('ready', async () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    
    // وضع حالة البوت
    client.user.setActivity('Tickets & Levels 🛡️', { type: ActivityType.Watching });

    // تأخير لضمان استقرار الاتصال
    setTimeout(async () => {
        try {
            startMessages(client);
            handleTicketInteraction(client, OWNER_ID);
            await sendPanel(client);
            console.log("✅ All systems initialized.");
        } catch (err) {
            console.error("❌ Ready Sequence Error:", err);
        }
    }, 3000);
});

client.on('messageCreate', async (message) => {
    try {
        if (!message || message.author.bot || !message.guild) return;

        const db = getDB();
        if (!db) return;
        const users = db.collection("users");

        // نظام النقاط (XP)
        await handleXP(message).catch(() => {});

        const args = message.content.trim().split(/ +/);
        const command = args[0]?.toLowerCase();
        const mentionedUser = message.mentions.users.first();

        // ================== 👤 USER COMMANDS ==================

        if (command === "!ping") {
            return message.reply(`🏓 **Pong!** \`Delay: ${client.ws.ping}ms\``);
        }

        if (command === "!level") {
            return await getLevel(message);
        }

        // 📊 تم استبدال !مستوي بـ !rank بناءً على طلبك
        if (command === "!rank") {
            const target = mentionedUser || message.author;
            const userId = target.id;

            await users.updateOne({ userId }, { $setOnInsert: { userId, xp: 0, level: 1 } }, { upsert: true });
            const user = await users.findOne({ userId });

            const level = user.level;
            const xp = user.xp;
            const neededXP = level * 100;
            const percentage = xp / neededXP;
            const bars = Math.round(percentage * 10);
            const xpBar = "█".repeat(bars) + "░".repeat(10 - bars);

            const rankCount = await users.countDocuments({
                $or: [{ level: { $gt: level } }, { level: level, xp: { $gt: xp } }]
            }) + 1;

            const embed = new EmbedBuilder()
                .setColor("#2b2d31")
                .setAuthor({ name: `📊 إحصائيات ${target.username}`, iconURL: target.displayAvatarURL() })
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "⭐ المستوى", value: `\`${level}\``, inline: true },
                    { name: "👑 الرتبة", value: `\`#${rankCount}\``, inline: true },
                    { name: "✨ النقاط", value: `\`${xp} / ${neededXP}\`\n${xpBar}` }
                )
                .setFooter({ text: "Devil System 😈" })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        if (command === "!top") {
            const topUsers = await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();
            let desc = "";
            topUsers.forEach((u, i) => {
                const medal = ["🥇", "🥈", "🥉", "🔹", "🔹"][i];
                desc += `${medal} **#${i + 1}** | <@${u.userId}> - \`Lvl ${u.level}\`\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle("🏆 قائمة المتصدرين")
                .setDescription(desc || "لا يوجد بيانات بعد")
                .setColor("#FFD700");
            return message.reply({ embeds: [embed] });
        }

        // ================== 👑 OWNER COMMANDS ==================

        if (message.author.id !== OWNER_ID) return;

        if (command === "!addxp") {
            if (!mentionedUser) return;
            const amount = parseInt(args[2]) || 0;
            await users.updateOne({ userId: mentionedUser.id }, { $inc: { xp: amount } }, { upsert: true });
            return message.reply(`✅ تم إضافة \`${amount}\` XP لـ ${mentionedUser.username}`);
        }

        if (command === "!clear") {
            const amount = parseInt(args[1]);
            if (isNaN(amount)) return;
            await message.channel.bulkDelete(amount, true);
            return message.channel.send(`🧹 تم مسح \`${amount}\` رسالة.`).then(m => setTimeout(() => m.delete(), 3000));
        }

    } catch (err) {
        console.error("❌ Message Error:", err);
    }
});

client.login(process.env.TOKEN);
