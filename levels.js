const { getDB } = require('./database');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

// 🧠 جلب المستخدم
async function getUser(userId) {
    const db = getDB();
    const users = db.collection("users");

    let user = await users.findOne({ userId });

    if (!user) {
        user = { userId, xp: 0, level: 1, hp: 100 };
        await users.insertOne(user);
    }

    return user;
}

// 🔥 XP
async function handleXP(message) {
    const db = getDB();
    const users = db.collection("users");

    const userId = message.author.id;
    let user = await getUser(userId);

    user.xp += 3;

    const neededXP = user.level * 100;

    if (user.xp >= neededXP) {
        user.level++;
        user.xp = 0;

        message.channel.send(`🔥 ${message.author} وصل Level ${user.level}`);
    }

    await users.updateOne({ userId }, { $set: user });
}

// 🎨 Rank Card
async function createRankCard(userObj, data) {
    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext('2d');

    // خلفية
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 800, 300);

    // صورة
    const avatar = await loadImage(
        userObj.displayAvatarURL({ extension: 'png', size: 256 })
    );

    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 150, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 40, 70, 160, 160);
    ctx.restore();

    // الاسم
    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.fillText(userObj.username, 250, 80);

    // level
    ctx.fillStyle = "#facc15";
    ctx.fillText(`Level: ${data.level}`, 250, 130);

    // hp
    ctx.fillStyle = "#ef4444";
    ctx.fillText(`HP: ${data.hp}`, 250, 170);

    // XP BAR
    const barWidth = 400;
    const progress = data.xp / (data.level * 100);

    ctx.fillStyle = "#374151";
    ctx.fillRect(250, 200, barWidth, 25);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(250, 200, barWidth * progress, 25);

    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.fillText(`${data.xp}/${data.level * 100}`, 260, 218);

    return canvas.toBuffer("image/png");
}

// 🎯 عرض
async function getLevel(message, targetUser = null) {
    const userObj = targetUser || message.author;
    const user = await getUser(userObj.id);

    const buffer = await createRankCard(userObj, user);

    await message.channel.send({
        files: [{
            attachment: buffer,
            name: "rank.png"
        }]
    });
}

// 🔝 Top
async function getTop() {
    const db = getDB();
    const users = db.collection("users");

    return await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();
}

// ➕
async function addStats(userId, hp, level) {
    const db = getDB();
    const users = db.collection("users");

    let user = await getUser(userId);

    user.hp += hp;
    user.level += level;

    await users.updateOne({ userId }, { $set: user });
}

// ➖
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