const { getDB } = require('./database');
const { EmbedBuilder } = require("discord.js");

// ⚙️ ID الأدمن (أنت وحدك) - غيّر ده بـ ID ديسكورد بتاعك
const ADMIN_ID = "880803449632079883"; // اكتب ID ديسكورد بتاعك هنا

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

// 🔥 XP Bar
function createXPBar(xp, neededXP) {
    const percentage = xp / neededXP;
    const totalBars = 10;
    const filledBars = Math.round(percentage * totalBars);
    const emptyBars = totalBars - filledBars;

    const bar = "█".repeat(filledBars) + "░".repeat(emptyBars);
    const percentText = Math.round(percentage * 100);

    return `${bar} ${percentText}%`;
}

// 👑 حساب الرانك
async function getRank(users, userId) {
    const allUsers = await users.find().sort({ level: -1, xp: -1 }).toArray();

    const index = allUsers.findIndex(u => u.userId === userId);

    return index === -1 ? "?" : index + 1;
}

// 📊 عرض الليفل
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

    const xpBar = createXPBar(xp, neededXP);

    // 👑 الرانك
    const rank = await getRank(users, userId);

    const embed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setAuthor({
            name: `📊 إحصائيات ${name}`,
            iconURL: message.author.displayAvatarURL()
        })
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            {
                name: "⭐ المستوى",
                value: `\`${level}\``,
                inline: true
            },
            {
                name: "👑 الرتبة",
                value: `\`#${rank}\``,
                inline: true
            },
            {
                name: "✨ النقاط",
                value: `\`${xp} / ${neededXP}\`\n${xpBar}`,
                inline: false
            }
        )
        .setFooter({ text: "Devil Bot 😈" });

    message.reply({ embeds: [embed] });
}

// ========== 🔐 ADMIN COMMANDS ==========

// ✅ التحقق من الأدمن
function isAdmin(userId) {
    return userId === ADMIN_ID;
}

// 📈 إضافة XP
async function addXP(message, args) {
    if (!isAdmin(message.author.id)) {
        return message.reply("❌ أنت لا تملك الصلاحية!");
    }

    const mentioned = message.mentions.users.first() || message.author;
    const xpAmount = parseInt(args[1]) || 10;

    const db = getDB();
    const users = db.collection("users");

    let user = await users.findOne({ userId: mentioned.id });
    if (!user) {
        user = { userId: mentioned.id, xp: 0, level: 1 };
        await users.insertOne(user);
    }

    user.xp += xpAmount;

    const neededXP = user.level * 100;
    if (user.xp >= neededXP) {
        user.level++;
        user.xp = 0;
    }

    await users.updateOne(
        { userId: mentioned.id },
        { $set: { xp: user.xp, level: user.level } }
    );

    const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("✅ تم إضافة XP")
        .addFields(
            { name: "👤 اللاعب", value: `<@${mentioned.id}>`, inline: true },
            { name: "➕ الكمية", value: `+${xpAmount} XP`, inline: true },
            { name: "⭐ الليفل الحالي", value: `${user.level}`, inline: true }
        )
        .setFooter({ text: "Admin Command 👑" });

    message.reply({ embeds: [embed] });
}

// 📉 تقليل XP
async function removeXP(message, args) {
    if (!isAdmin(message.author.id)) {
        return message.reply("❌ أنت لا تملك الصلاحية!");
    }

    const mentioned = message.mentions.users.first() || message.author;
    const xpAmount = parseInt(args[1]) || 10;

    const db = getDB();
    const users = db.collection("users");

    let user = await users.findOne({ userId: mentioned.id });
    if (!user) {
        return message.reply("❌ هذا المستخدم لا يملك XP!");
    }

    user.xp -= xpAmount;
    if (user.xp < 0) user.xp = 0;

    await users.updateOne(
        { userId: mentioned.id },
        { $set: { xp: user.xp } }
    );

    const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("⚡ تم حذف XP")
        .addFields(
            { name: "👤 اللاعب", value: `<@${mentioned.id}>`, inline: true },
            { name: "➖ الكمية", value: `-${xpAmount} XP`, inline: true },
            { name: "⭐ الليفل الحالي", value: `${user.level}`, inline: true }
        )
        .setFooter({ text: "Admin Command 👑" });

    message.reply({ embeds: [embed] });
}

// 🎯 رفع الليفل مباشرة
async function setLevel(message, args) {
    if (!isAdmin(message.author.id)) {
        return message.reply("❌ أنت لا تملك الصلاحية!");
    }

    const mentioned = message.mentions.users.first() || message.author;
    const newLevel = parseInt(args[1]);

    if (!newLevel || newLevel < 1) {
        return message.reply("❌ أدخل ليفل صحيح!");
    }

    const db = getDB();
    const users = db.collection("users");

    let user = await users.findOne({ userId: mentioned.id });
    if (!user) {
        user = { userId: mentioned.id, xp: 0, level: 1 };
        await users.insertOne(user);
    }

    user.level = newLevel;
    user.xp = 0;

    await users.updateOne(
        { userId: mentioned.id },
        { $set: { level: user.level, xp: user.xp } }
    );

    const embed = new EmbedBuilder()
        .setColor("#9900FF")
        .setTitle("🎯 تم تحديث الليفل")
        .addFields(
            { name: "👤 اللاعب", value: `<@${mentioned.id}>`, inline: true },
            { name: "⭐ الليفل الجديد", value: `${newLevel}`, inline: true }
        )
        .setFooter({ text: "Admin Command 👑" });

    message.reply({ embeds: [embed] });
}

// 🔄 إعادة تعيين بيانات اللاعب
async function resetUser(message, args) {
    if (!isAdmin(message.author.id)) {
        return message.reply("❌ أنت لا تملك الصلاحية!");
    }

    const mentioned = message.mentions.users.first() || message.author;

    const db = getDB();
    const users = db.collection("users");

    await users.updateOne(
        { userId: mentioned.id },
        { $set: { level: 1, xp: 0 } },
        { upsert: true }
    );

    const embed = new EmbedBuilder()
        .setColor("#FF6600")
        .setTitle("🔄 تم إعادة تعيين البيانات")
        .setDescription(`تم إعادة تعيين بيانات <@${mentioned.id}>`)
        .setFooter({ text: "Admin Command 👑" });

    message.reply({ embeds: [embed] });
}

// 👑 عرض جميع البيانات
async function showUserData(message, args) {
    if (!isAdmin(message.author.id)) {
        return message.reply("❌ أنت لا تملك الصلاحية!");
    }

    const mentioned = message.mentions.users.first();
    if (!mentioned) {
        return message.reply("❌ اذكر المستخدم!");
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ userId: mentioned.id });
    if (!user) {
        return message.reply("❌ لا توجد بيانات لهذا المستخدم!");
    }

    const embed = new EmbedBuilder()
        .setColor("#0099FF")
        .setTitle("📋 بيانات المستخدم")
        .setThumbnail(mentioned.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: "👤 اسم المستخدم", value: `${mentioned.username}`, inline: true },
            { name: "🆔 الـ ID", value: `${mentioned.id}`, inline: true },
            { name: "⭐ الليفل", value: `${user.level}`, inline: true },
            { name: "✨ XP", value: `${user.xp} / ${user.level * 100}`, inline: true }
        )
        .setFooter({ text: "Admin Command 👑" });

    message.reply({ embeds: [embed] });
}

module.exports = { 
    handleXP, 
    getLevel, 
    addXP, 
    removeXP, 
    setLevel, 
    resetUser,
    showUserData
};
