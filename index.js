require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const { getDB, connectDB } = require('./database');
const { handleTicketInteraction, sendPanel } = require("./ticket");
const express = require('express');

// --- إعداد خادم الاستضافة لضمان العمل المستمر ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('System Status: 🟢 ONLINE | Neon OS v3.0'));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Terminal Server Active on Port ${PORT}`));

// --- الاتصال بقاعدة البيانات ---
connectDB().catch(err => console.error("❌ Database Connection Failed:", err));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = process.env.TOKEN;
const OWNER_ID = "880803449632079883"; // معرف الاونر بافلي

client.once('ready', async () => {
    console.log(`🔥 Boot Sequence Complete. Logged in as ${client.user.tag}`);
    startMessages(client);
    // إرسال لوحة التذاكر بتنسيق نيون
    setTimeout(() => sendPanel(client), 2000);
});

// تفعيل نظام التذاكر النيوني
handleTicketInteraction(client, OWNER_ID);

// --- معالج الرسائل والأوامر الشامل ---
client.on('messageCreate', async (message) => {
    try {
        if (!message || message.author.bot || !message.guild) return;

        const db = getDB();
        if (!db) return;
        const users = db.collection("users");

        // 💠 بروتوكول زيادة النقاط التلقائي (XP)
        await handleXP(message).catch(err => console.error("XP System Error:", err));

        const content = message.content.trim();
        const args = content.split(/ +/);
        const command = args[0].toLowerCase();

        // ================== [ 👤 أوامر المستخدمين العامة ] ==================

        if (command === "!ping") {
            return message.reply("📡 **System Latency:** `" + client.ws.ping + "ms` | `STABLE` ✅");
        }

        if (command === "!level") {
            return await getLevel(message);
        }

        if (command === "!top") {
            const topUsers = await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();
            if (!topUsers.length) return message.reply("❌ `DATABASE_EMPTY`: لا توجد بيانات مسجلة.");

            let description = "```fix\n[ TERMINAL LEADERBOARD - TOP 5 ]\n```\n";
            topUsers.forEach((u, i) => {
                const userObj = message.guild.members.cache.get(u.userId);
                const name = userObj ? userObj.user.username : "Unknown_User";
                description += `**#${i + 1}** | \`${name}\` • \`Lvl ${u.level}\` • \`${u.xp} XP\`\n`;
            });

            const topEmbed = new EmbedBuilder()
                .setTitle("🏆 لوحة صدارة النظام النيوني")
                .setDescription(description)
                .setColor("#00f2ff")
                .setFooter({ text: "NEON PROTOCOL: RANKING_MODULE" });
            
            return message.reply({ embeds: [topEmbed] });
        }

        // ================== [ 👑 أوامر الاونر فقط ] ==================

        // 🛡️ حارس الصلاحيات: التحقق من الاونر قبل تنفيذ الأوامر التالية
        const adminCommands = ["!rank", "!clear", "!addxp", "!rexp", "!addlevel", "!relevel"];
        if (adminCommands.some(cmd => command.startsWith(cmd))) {
            if (message.author.id !== OWNER_ID) {
                return message.reply("⚠️ **ACCESS_DENIED:** هذا البروتوكول مخصص لـ الاونر فقط.");
            }

            // 1. أمر !rank @user
            if (command === "!rank") {
                const target = message.mentions.users.first() || message.author;
                const userData = await users.findOne({ userId: target.id }) || { level: 1, xp: 0 };
                
                const level = userData.level;
                const xp = userData.xp;
                const neededXP = level * 100;
                const percentage = Math.min(xp / neededXP, 1);
                const bars = Math.round(percentage * 10);
                const xpBar = "🟦".repeat(bars) + "⬛".repeat(10 - bars);

                const rank = await users.countDocuments({
                    $or: [{ level: { $gt: level } }, { level: level, xp: { $gt: xp } }]
                }) + 1;

                const rankEmbed = new EmbedBuilder()
                    .setColor("#bc13fe")
                    .setAuthor({ name: `📊 TERMINAL STATS: ${target.username}`, iconURL: target.displayAvatarURL() })
                    .addFields(
                        { name: "⭐ Level", value: `\`${level}\``, inline: true },
                        { name: "👑 Global Rank", value: `\`#${rank}\``, inline: true },
                        { name: "✨ Experience Progress", value: `\`${xp} / ${neededXP} XP\`\n${xpBar} ${Math.round(percentage * 100)}%` }
                    )
                    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: "STATUS: ANALYZING_USER_DATA" });

                return message.reply({ embeds: [rankEmbed] });
            }

            // 2. أمر !clear [العدد]
            if (command === "!clear") {
                const amount = parseInt(args[1]) || 10;
                await message.channel.bulkDelete(Math.min(amount + 1, 100), true);
                return message.channel.send(`🧹 **TERMINAL:** تم تنظيف \`${amount}\` سجلات بنجاح.`)
                    .then(m => setTimeout(() => m.delete(), 3000));
            }

            // 3. أمر !addxp @user [العدد]
            if (command === "!addxp") {
                const target = message.mentions.users.first();
                const amount = parseInt(args[2]);
                if (!target || isNaN(amount)) return message.reply("⚠️ **USAGE:** `!addxp @user [Amount]`");

                await users.updateOne({ userId: target.id }, { $inc: { xp: amount } }, { upsert: true });
                return message.reply(`✅ **DATA_INJECTED:** تم إضافة \`${amount}\` XP لـ ${target}.`);
            }

            // 4. أمر !rexp @user [العدد] (طرح XP)
            if (command === "!rexp") {
                const target = message.mentions.users.first();
                const amount = parseInt(args[2]);
                if (!target || isNaN(amount)) return message.reply("⚠️ **USAGE:** `!rexp @user [Amount]`");

                await users.updateOne({ userId: target.id }, { $inc: { xp: -amount } }, { upsert: true });
                return message.reply(`📉 **DATA_REMOVED:** تم سحب \`${amount}\` XP من ${target}.`);
            }

            // 5. أمر !addlevel @user [العدد]
            if (command === "!addlevel") {
                const target = message.mentions.users.first();
                const amount = parseInt(args[2]);
                if (!target || isNaN(amount)) return message.reply("⚠️ **USAGE:** `!addlevel @user [Amount]`");

                await users.updateOne({ userId: target.id }, { $inc: { level: amount } }, { upsert: true });
                return message.reply(`🆙 **LEVEL_BOOST:** تم ترقية ${target} بمقدار \`${amount}\` مستوى.`);
            }

            // 6. أمر !relevel @user [العدد] (طرح مستوى)
            if (command === "!relevel") {
                const target = message.mentions.users.first();
                const amount = parseInt(args[2]);
                if (!target || isNaN(amount)) return message.reply("⚠️ **USAGE:** `!relevel @user [Amount]`");

                await users.updateOne({ userId: target.id }, { $inc: { level: -amount } }, { upsert: true });
                return message.reply(`🔻 **LEVEL_DOWN:** تم خفض مستوى ${target} بمقدار \`${amount}\`.`);
            }
        }

    } catch (err) {
        console.error("❌ CRITICAL_SYSTEM_ERROR:", err);
    }
});

client.login(TOKEN);

