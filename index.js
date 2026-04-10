require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const { getDB, connectDB } = require('./database');
const { handleTicketInteraction, sendPanel } = require("./ticket");
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Devil Bot Neon is Online 😈'));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Server running on port ${PORT}`));

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
    client.user.setActivity('Tickets & Levels 🛡️', { type: ActivityType.Watching });

    setTimeout(async () => {
        try {
            startMessages(client);
            handleTicketInteraction(client, OWNER_ID);
            await sendPanel(client);
        } catch (err) {
            console.error("❌ Ready Error:", err);
        }
    }, 3000);
});

client.on('messageCreate', async (message) => {
    try {
        if (!message || message.author.bot || !message.guild) return;

        const db = getDB();
        if (!db) return;
        const users = db.collection("users");

        await handleXP(message).catch(() => {});

        const args = message.content.trim().split(/ +/);
        const command = args[0]?.toLowerCase();
        const mentionedUser = message.mentions.users.first();

        // ================== 👤 USER COMMANDS ==================

        if (command === "!rank") {
            const target = mentionedUser || message.author;
            const user = await users.findOne({ userId: target.id }) || { level: 1, xp: 0 };

            const level = user.level;
            const xp = user.xp;
            const neededXP = level * 100;
            
            // 📊 ديزاين البار الجديد (Neon Style)
            const percentage = Math.min(xp / neededXP, 1);
            const totalBars = 12;
            const filled = Math.round(percentage * totalBars);
            const empty = totalBars - filled;
            const xpBar = "▰".repeat(filled) + "▱".repeat(empty);

            const rankCount = await users.countDocuments({
                $or: [{ level: { $gt: level } }, { level: level, xp: { $gt: xp } }]
            }) + 1;

            const embed = new EmbedBuilder()
                .setColor("#FF0055") // لون نيون أحمر شيطاني
                .setAuthor({ name: `| SESSION DATA: ${target.username}`, iconURL: client.user.displayAvatarURL() })
                .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: "✨ LEVEL", value: `\`\`\`fix\nLVL ${level}\n\`\`\``, inline: true },
                    { name: "👑 RANK", value: `\`\`\`fix\n#${rankCount}\n\`\`\``, inline: true },
                    { name: "🚀 PROGRESS", value: `${xpBar} \`${Math.round(percentage * 100)}%\` \n**${xp}** / **${neededXP}** XP` }
                )
                .setFooter({ text: "SYSTEM STATUS: SECURED 🛡️", iconURL: target.displayAvatarURL() })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        if (command === "!top") {
            const topUsers = await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();
            let desc = "```yaml\nRANK | USER         | LVL\n--------------------------\n";
            
            topUsers.forEach((u, i) => {
                const name = message.guild.members.cache.get(u.userId)?.user.username || "Unknown";
                desc += `${i + 1}    | ${name.padEnd(12)} | ${u.level}\n`;
            });
            desc += "```";

            const embed = new EmbedBuilder()
                .setTitle("🏆 LEADERBOARD - TOP 5")
                .setDescription(desc)
                .setColor("#00FFCC") // لون سيان نيون
                .setThumbnail(message.guild.iconURL());
            return message.reply({ embeds: [embed] });
        }

        // ================== 👑 OWNER COMMANDS ==================
        if (message.author.id !== OWNER_ID) return;

        if (command === "!clear") {
            const amount = parseInt(args[1]);
            if (isNaN(amount)) return;
            await message.channel.bulkDelete(amount, true);
            const m = await message.channel.send(`\`\`\`diff\n- CLEANUP COMPLETED: ${amount} messages removed\n\`\`\``);
            setTimeout(() => m.delete(), 3000);
        }

    } catch (err) {
        console.error("❌ Message Error:", err);
    }
});

client.login(process.env.TOKEN);
