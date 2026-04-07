// ملف: levels.js - النسخة الكاملة بعد التعديل مع Canvas و Ranawy

const { getDB } = require('./database');
const { EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fetch = require('node-fetch');

// تسجيل خط Ranawy (تأكد من وجود الملف في المسار الصحيح)
registerFont(path.join(__dirname, 'assets/fonts/Ranawy.ttf'), { family: 'Ranawy' });
registerFont(path.join(__dirname, 'assets/fonts/Ranawy-Bold.ttf'), { family: 'Ranawy Bold' });

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

// 🎨 رسم XP Bar متقدم
function drawXPBar(ctx, x, y, width, height, percentage) {
    // خلفية البار
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(x, y, width, height);
    
    // البار المتقدم مع تدرج لوني
    const fillWidth = width * Math.min(percentage, 1);
    const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
    gradient.addColorStop(0, '#ff4444');
    gradient.addColorStop(0.5, '#ff8844');
    gradient.addColorStop(1, '#ffcc44');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, fillWidth, height);
    
    // حدود البار
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // كتابة النسبة المئوية
    ctx.font = 'bold 14px "Segoe UI"';
    ctx.fillStyle = '#ffffff';
    const percentText = `${Math.round(percentage * 100)}%`;
    const textWidth = ctx.measureText(percentText).width;
    ctx.fillText(percentText, x + (width - textWidth) / 2, y + 22);
}

// 📊 عرض الليفل بصورة Canvas
async function getLevel(message) {
    const db = getDB();
    if (!db) return;

    const users = db.collection("users");
    const userId = message.author.id;

    let user = await users.findOne({ userId });

    if (!user) {
        user = { userId, xp: 0, level: 1 };
        await users.insertOne(user);
    }

    const level = user.level;
    const xp = user.xp;
    const neededXP = level * 100;
    const percentage = xp / neededXP;
    const rank = await getRank(users, userId);

    // إعدادات Canvas
    const width = 900;
    const height = 350;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. خلفية رئيسية بتدرج لوني
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(0.5, '#16213e');
    bgGradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. إطار خارجي مذهب
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // 3. زوايا مزخرفة
    ctx.fillStyle = '#ffd700';
    // الزاوية اليمين-فوق
    ctx.fillRect(width - 50, 15, 35, 3);
    ctx.fillRect(width - 35, 15, 3, 35);
    // الزاوية اليسار-فوق
    ctx.fillRect(15, 15, 35, 3);
    ctx.fillRect(15, 15, 3, 35);
    // الزاوية اليمين-تحت
    ctx.fillRect(width - 50, height - 18, 35, 3);
    ctx.fillRect(width - 35, height - 50, 3, 35);
    // الزاوية اليسار-تحت
    ctx.fillRect(15, height - 18, 35, 3);
    ctx.fillRect(15, height - 50, 3, 35);

    // 4. صورة المستخدم (Avatar)
    try {
        const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 256 });
        const response = await fetch(avatarURL);
        const buffer = await response.buffer();
        const avatar = await loadImage(buffer);
        
        // دائرة الصورة
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 175, 65, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 35, 110, 130, 130);
        ctx.restore();
        
        // إطار ذهبي حول الصورة
        ctx.beginPath();
        ctx.arc(100, 175, 68, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
    } catch (err) {
        console.error("Avatar load error:", err);
        // رسم دائرة بديلة
        ctx.beginPath();
        ctx.arc(100, 175, 65, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
    }

    // 5. اسم المستخدم (بخط Ranawy)
    ctx.font = 'bold 32px "Ranawy"';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.fillText(message.author.username, 200, 100);
    ctx.shadowColor = 'transparent';

    // 6. Level مع أيقونة
    ctx.font = 'bold 28px "Ranawy"';
    ctx.fillStyle = '#ffaa44';
    ctx.fillText(`⚡ LEVEL ${level}`, 200, 160);
    
    // 7. Rank مع أيقونة
    ctx.font = '24px "Ranawy"';
    ctx.fillStyle = '#44ffaa';
    ctx.fillText(`👑 RANK #${rank}`, 200, 210);
    
    // 8. XP Text
    ctx.font = '18px "Segoe UI"';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`${xp.toLocaleString()} / ${neededXP.toLocaleString()} XP`, 200, 260);

    // 9. XP Bar
    drawXPBar(ctx, 200, 280, 600, 30, percentage);

    // 10. شعار البوت في الأسفل
    ctx.font = '16px "Ranawy"';
    ctx.fillStyle = '#888888';
    ctx.fillText('Devil Bot 😈', width - 150, height - 20);

    // 11. إضافة خلفية شفافة بتأثير glow
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.3;
    for(let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(width - 50, 50, 80 + i*20, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // إرسال الصورة
    const attachment = canvas.toBuffer();
    await message.reply({
        files: [{
            attachment: attachment,
            name: `level_${userId}.png`
        }]
    });
}

// 📊 Embed version (احتياطي لو canvas فشل)
async function getLevelEmbed(message) {
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
    const rank = await getRank(users, userId);
    const name = message.member?.displayName || message.author.username;
    
    const percentage = xp / neededXP;
    const totalBars = 10;
    const filledBars = Math.round(percentage * totalBars);
    const emptyBars = totalBars - filledBars;
    const bar = "█".repeat(filledBars) + "░".repeat(emptyBars);
    const percentText = Math.round(percentage * 100);

    const embed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setAuthor({
            name: `📊 إحصائيات ${name}`,
            iconURL: message.author.displayAvatarURL()
        })
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: "⭐ المستوى", value: `\`${level}\``, inline: true },
            { name: "👑 الرتبة", value: `\`#${rank}\``, inline: true },
            { name: "✨ النقاط", value: `\`${xp} / ${neededXP}\`\n${bar} ${percentText}%`, inline: false }
        )
        .setFooter({ text: "Devil Bot 😈" });

    message.reply({ embeds: [embed] });
}

module.exports = { handleXP, getLevel, getLevelEmbed };