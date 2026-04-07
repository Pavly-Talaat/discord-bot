const { getDB } = require('./database');
const { AttachmentBuilder } = require("discord.js");
const { createLevelCard, createLeaderboardCard } = require('./canvas-design');

// 🔥 نظام XP
async function handleXP(message) {
    const db = getDB();
    if (!db) return;

    const users = db.collection("users");
    const userId = message.author.id;

    let user = await users.findOne({ userId });

    if (!user) {
        user = { userId, xp: 0, level: 1 };
        await users.insertOne(user);
    }

    user.xp += 3;

    const neededXP = user.level * 100;

    if (user.xp >= neededXP) {
        user.level++;
        user.xp = 0;

        message.channel.send(`🔥 ${message.author} وصل Level ${user.level} 😈`);
    }

    await users.updateOne(
        { userId },
        { $set: { xp: user.xp, level: user.level } }
    );
}

// 👑 حساب الرانك
async function getRank(users, userId) {
    const allUsers = await users.find().sort({ level: -1, xp: -1 }).toArray();

    const index = allUsers.findIndex(u => u.userId === userId);

    return index === -1 ? "?" : index + 1;
}

// 📊 عرض الليفل (بصورة احترافية)
async function getLevel(message) {
    const db = getDB();
    if (!db) return;

    const users = db.collection("users");
    const userId = message.author.id;

    const user = await users.findOne({ userId });

    if (!user) {
        return message.reply("😈 أنت لسه Level 0... ابدأ اكتب!");
    }

    const level = user.level;
    const xp = user.xp;
    const neededXP = level * 100;

    const name = message.member?.displayName || message.author.username;

    // 👑 الرانك
    const rank = await getRank(users, userId);

    try {
        // إنشاء الصورة
        const cardBuffer = await createLevelCard({
            name: name,
            level: level,
            xp: xp,
            neededXP: neededXP,
            rank: rank,
            avatarURL: message.author.displayAvatarURL({ extension: 'png', size: 512 })
        });

        // إرسال الصورة
        const attachment = new AttachmentBuilder(cardBuffer, { name: 'level-card.png' });
        message.reply({ files: [attachment] });
    } catch (err) {
        console.error('❌ خطأ في رسم الكارت:', err);
        message.reply("❌ حدث خطأ في إنشاء كارت الليفل");
    }
}

// 🏆 Top Players Board (صورة احترافية)
async function getLeaderboard(message) {
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

    try {
        // تحضير بيانات اللاعبين
        const topUsersData = [];
        
        for (const user of topUsers) {
            try {
                const discordUser = await message.client.users.fetch(user.userId);
                topUsersData.push({
                    name: discordUser.username,
                    level: user.level,
                    xp: user.xp
                });
            } catch (err) {
                // إذا لم نتمكن من جلب المستخدم، استخدم ID فقط
                topUsersData.push({
                    name: `User #${user.userId}`,
                    level: user.level,
                    xp: user.xp
                });
            }
        }

        // إنشاء الصورة
        const boardBuffer = await createLeaderboardCard(topUsersData);

        // إرسال الصورة
        const attachment = new AttachmentBuilder(boardBuffer, { name: 'leaderboard.png' });
        message.reply({ files: [attachment] });
    } catch (err) {
        console.error('❌ خطأ في رسم اللوحة:', err);
        message.reply("❌ حدث خطأ في إنشاء لوحة الترتيب");
    }
}

module.exports = { handleXP, getLevel, getLeaderboard };
