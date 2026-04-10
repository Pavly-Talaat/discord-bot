require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const { getDB, connectDB } = require('./database');

// 🔥 استدعاء نظام التذاكر المطور
const { handleTicketInteraction, sendPanel } = require("./ticket");

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// واجهة بسيطة للتأكد من أن السيرفر يعمل على الاستضافة
app.get('/', (req, res) => res.send('Bot is running and monitoring tickets 🎫'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// 🔥 الاتصال بقاعدة البيانات أولاً قبل تشغيل أي شيء
connectDB().catch(console.error);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // ضروري لإدارة التذاكر ورؤية الأعضاء
    ]
});

const TOKEN = process.env.TOKEN;
const OWNER_ID = "880803449632079883";

// 🚀 عند تشغيل البوت ودخوله أونلاين
client.once('ready', async () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);

    // ⏳ انتظار لمدة ثانيتين لضمان استقرار اتصال MongoDB
    setTimeout(async () => {
        try {
            // تشغيل الرسائل التلقائية (الأذكار)
            startMessages(client);
            
            // تشغيل مستمع أزرار التذاكر
            handleTicketInteraction(client, OWNER_ID);
            
            // فحص الروم وإرسال اللوحة إذا لم تكن موجودة
            await sendPanel(client);
            
            console.log("✅ All systems are stable and ready.");
        } catch (err) {
            console.error("❌ Ready Error:", err);
        }
    }, 2000);
});

// 📩 معالج الرسائل (الرتب، النقاط، والأوامر)
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

        if (!command) return;

        // ================== 👤 USER COMMANDS ==================

        if (command === "!ping") {
            return message.reply("🏓 Pong! Bot is active.");
        }

        if (command === "!level") {
            return await getLevel(message);
        }

        if (command === "!top") {
            const topUsers = await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();

            if (!topUsers.length) return message.reply("❌ مفيش بيانات");

            let desc = "";
            for (let i = 0; i < topUsers.length; i++) {
                const medal = ["🥇", "🥈", "🥉"][i] || "🔹";
                const u = topUsers[i];
                desc += `${medal} #${i + 1} - <@${u.userId}> (Level ${u.level})\n`;
            }

            let avatar = null;
            let title = "🏆 Best 5 Players";

            try {
                const topUser = await client.users.fetch(topUsers[0].userId);
                avatar = topUser.displayAvatarURL({ dynamic: true, size: 1024 });
                title = `👑 ${topUser.username} | Top Player`;
            } catch (err) {}

            const embed = new EmbedBuilder()
                .setColor("#FFD700")
                .setTitle(title)
                .setDescription(desc)
                .setFooter({ text: "Devil Bot 😈" });

            if (avatar) {
                embed.setThumbnail(avatar);
                embed.setImage(avatar);
            }

            return message.reply({ embeds: [embed] });
        }

        // ================== 👑 OWNER COMMANDS ==================

        const ownerOnly = ["!addxp", "!rexp", "!addlevel", "!relevel", "!alllevels", "!clear", "!مستوي"];
        if (ownerOnly.includes(command) && message.author.id !== OWNER_ID) {
            return message.reply("❌ الأمر للأونر فقط 👑");
        }

        if (command === "!addxp") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");
            const amount = parseInt(args[2]);
            if (isNaN(amount)) return message.reply("❌ رقم غير صالح");

            await users.updateOne(
                { userId: mentionedUser.id },
                { $inc: { xp: amount }, $setOnInsert: { level: 1 } },
                { upsert: true }
            );
            return message.reply(`🔥 +${amount} XP`);
        }

        if (command === "!rexp") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");
            const amount = parseInt(args[2]);
            if (isNaN(amount)) return message.reply("❌ رقم غير صالح");

            await users.updateOne({ userId: mentionedUser.id }, { $inc: { xp: -amount } });
            return message.reply(`💀 -${amount} XP`);
        }

        if (command === "!addlevel") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");
            const amount = parseInt(args[2]);
            if (isNaN(amount)) return message.reply("❌ رقم غير صالح");

            await users.updateOne(
                { userId: mentionedUser.id },
                { $inc: { level: amount } },
                { upsert: true }
            );
            return message.reply(`👑 +${amount} Level`);
        }

        if (command === "!relevel") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");
            const amount = parseInt(args[2]);
            if (isNaN(amount)) return message.reply("❌ رقم غير صالح");

            await users.updateOne({ userId: mentionedUser.id }, { $inc: { level: -amount } });
            return message.reply(`💀 -${amount} Level`);
        }

        if (command === "!alllevels") {
            const all = await users.find().sort({ level: -1, xp: -1 }).limit(20).toArray();
            let desc = "";
            for (let i = 0; i < all.length; i++) {
                desc += `#${i + 1} <@${all[i].userId}> - Lvl ${all[i].level} | XP ${all[i].xp}\n`;
            }
            return message.reply({ embeds: [new EmbedBuilder().setTitle("📊 All Users").setDescription(desc)] });
        }

        if (command === "!clear") {
            const amount = parseInt(args[1]);
            if (isNaN(amount)) return;
            await message.channel.bulkDelete(amount, true).catch(() => {});
            return message.channel.send(`💀 Deleted ${amount}`).then(m => setTimeout(() => m.delete(), 3000));
        }

        if (command === "!مستوي") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");
            const userId = mentionedUser.id;

            await users.updateOne({ userId }, { $setOnInsert: { userId, xp: 0, level: 1 } }, { upsert: true });
            const user = await users.findOne({ userId });

            const level = user.level;
            const xp = user.xp;
            const neededXP = level * 100;
            const percentage = xp / neededXP;
            const bars = Math.round(percentage * 10);
            const xpBar = "█".repeat(bars) + "░".repeat(10 - bars);

            const rank = await users.countDocuments({
                $or: [{ level: { $gt: level } }, { level: level, xp: { $gt: xp } }]
            }) + 1;

            const embed = new EmbedBuilder()
                .setColor("#2b2d31")
                .setAuthor({ name: `📊 مستوى ${mentionedUser.username}`, iconURL: mentionedUser.displayAvatarURL() })
                .addFields(
                    { name: "⭐ المستوى", value: `\`${level}\``, inline: true },
                    { name: "👑 الرتبة", value: `\`#${rank}\``, inline: true },
                    { name: "✨ النقاط", value: `\`${xp} / ${neededXP}\`\n${xpBar}` }
                );
            return message.reply({ embeds: [embed] });
        }

    } catch (err) {
        console.error("❌ Message Error:", err);
    }
});

client.login(TOKEN);
