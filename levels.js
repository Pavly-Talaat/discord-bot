const { getDB } = require('./database');

// 🧠 جلب المستخدم
async function getUser(userId) {
    const db = getDB();
    if (!db) return null;

    const users = db.collection("users");

    let user = await users.findOne({ userId });

    if (!user) {
        user = { userId, xp: 0, level: 1, hp: 100 };
        await users.insertOne(user);
    }

    return user;
}

// XP (زي ما هو)
async function handleXP(message) {
    const db = getDB();
    if (!db) return;

    const users = db.collection("users");
    const userId = message.author.id;

    let user = await users.findOne({ userId });

    if (!user) {
        user = { userId, xp: 0, level: 1, hp: 100 };
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
        { $set: user }
    );
}

// 🎯 عرض ليفل (يدعم منشن)
async function getLevel(message, targetUser = null) {
    const userObj = targetUser || message.author;
    const user = await getUser(userObj.id);

    if (!user) return;

    message.reply(
        `👤 ${userObj.username}\n🔥 Level: ${user.level}\n💀 XP: ${user.xp}\n❤️ HP: ${user.hp}`
    );
}

// 🔝 Top 5
async function getTop() {
    const db = getDB();
    if (!db) return [];

    const users = db.collection("users");

    return await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();
}

// ➕ زيادة
async function addStats(userId, hp, level) {
    const db = getDB();
    const users = db.collection("users");

    let user = await getUser(userId);

    user.hp += hp;
    user.level += level;

    await users.updateOne({ userId }, { $set: user });
}

// ➖ تقليل
async function removeStats(userId, hp, level) {
    const db = getDB();
    const users = db.collection("users");

    let user = await getUser(userId);

    user.hp -= hp;
    user.level -= level;

    if (user.hp < 0) user.hp = 0;
    if (user.level < 1) user.level = 1;

    await users.updateOne({ userId }, { $set: user });
}

module.exports = {
    handleXP,
    getLevel,
    getTop,
    addStats,
    removeStats
};