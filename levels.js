const { getDB } = require('./database');
const { EmbedBuilder } = require('discord.js');

async function handleXP(message) {
    const db = getDB();
    if (!db) return;

    const users = db.collection("users");
    const userId = message.author.id;

    let user = await users.findOne({ userId });

    if (!user) {
        user = { 
            userId, 
            xp: 0, 
            level: 1,
            username: message.author.username,
            avatar: message.author.displayAvatarURL()
        };
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
        { $set: { 
            xp: user.xp, 
            level: user.level,
            username: message.author.username,
            avatar: message.author.displayAvatarURL()
        } }
    );
}

async function getLevel(message) {
    const db = getDB();
    if (!db) return;

    const users = db.collection("users");
    const userId = message.author.id;

    const user = await users.findOne({ userId });

    if (!user) {
        return message.reply("😈 أنت لسه Level 0... ابدأ اكتب!");
    }

    const neededXP = user.level * 100;
    const progressPercent = (user.xp / neededXP * 100).toFixed(0);
    
    // عمل loading bar
    const barLength = 20;
    const filledBars = Math.round((user.xp / neededXP) * barLength);
    const emptyBars = barLength - filledBars;
    const bar = '▓'.repeat(filledBars) + '░'.repeat(emptyBars);

    // loading animation
    let loadingMsg = await message.reply("⏳ جاري التحميل...");
    
    await new Promise(r => setTimeout(r, 800));

    const levelEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL()
        })
        .addFields(
            { name: '⚙️ المستوى الحالي', value: `**${user.level}**`, inline: true },
            { name: '💫 النقاط الحالية', value: `**${user.xp}**`, inline: true },
            { name: '🎯 النقاط المطلوبة', value: `**${neededXP}**`, inline: true },
            { name: '📊 التقدم', value: `${bar}\n**${progressPercent}%**`, inline: false }
        )
        .setTimestamp();

    await loadingMsg.edit({ content: null, embeds: [levelEmbed] });
}

async function addXP(message, args) {
    const db = getDB();
    if (!db) return;

    // التحقق من permissions
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return message.reply("❌ ليس لديك صلاحيات!");
    }

    const mentioned = message.mentions.users.first();
    if (!mentioned) {
        return message.reply("⚠️ اضكت @User ومية XP\nمثال: !addxp @Pavly 500");
    }

    const xpAmount = parseInt(args[1]);
    if (isNaN(xpAmount) || xpAmount <= 0) {
        return message.reply("⚠️ اكتب رقم صحيح!");
    }

    const users = db.collection("users");
    const targetUserId = mentioned.id;

    let user = await users.findOne({ userId: targetUserId });
    if (!user) {
        user = {
            userId: targetUserId,
            xp: xpAmount,
            level: 1,
            username: mentioned.username,
            avatar: mentioned.displayAvatarURL()
        };
        await users.insertOne(user);
    } else {
        user.xp += xpAmount;
        await users.updateOne(
            { userId: targetUserId },
            { $set: { xp: user.xp, username: mentioned.username, avatar: mentioned.displayAvatarURL() } }
        );
    }

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ تم إضافة XP')
        .addFields(
            { name: '👤 المستخدم', value: `${mentioned}`, inline: true },
            { name: '💫 XP المضاف', value: `**+${xpAmount}**`, inline: true },
            { name: '🔢 إجمالي XP', value: `**${user.xp}**`, inline: true }
        )
        .setTimestamp();

    message.reply({ embeds: [embed] });
}

async function removeXP(message, args) {
    const db = getDB();
    if (!db) return;

    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return message.reply("❌ ليس لديك صلاحيات!");
    }

    const mentioned = message.mentions.users.first();
    if (!mentioned) {
        return message.reply("⚠️ اضكت @User ومية XP\nمثال: !removexp @Pavly 500");
    }

    const xpAmount = parseInt(args[1]);
    if (isNaN(xpAmount) || xpAmount <= 0) {
        return message.reply("⚠️ اكتب رقم صحيح!");
    }

    const users = db.collection("users");
    const targetUserId = mentioned.id;

    let user = await users.findOne({ userId: targetUserId });
    if (!user) {
        return message.reply("❌ المستخدم ما عنده XP!");
    }

    user.xp = Math.max(0, user.xp - xpAmount);
    await users.updateOne(
        { userId: targetUserId },
        { $set: { xp: user.xp } }
    );

    const embed = new EmbedBuilder()
        .setColor('#FF6600')
        .setTitle('❌ تم حذف XP')
        .addFields(
            { name: '👤 المستخدم', value: `${mentioned}`, inline: true },
            { name: '💫 XP المحذوف', value: `**-${xpAmount}**`, inline: true },
            { name: '🔢 إجمالي XP', value: `**${user.xp}**`, inline: true }
        )
        .setTimestamp();

    message.reply({ embeds: [embed] });
}

async function addLevel(message, args) {
    const db = getDB();
    if (!db) return;

    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return message.reply("❌ ليس لديك صلاحيات!");
    }

    const mentioned = message.mentions.users.first();
    if (!mentioned) {
        return message.reply("⚠️ اضكت @User ومية Level\nمثال: !addlevel @Pavly 5");
    }

    const levelAmount = parseInt(args[1]);
    if (isNaN(levelAmount) || levelAmount <= 0) {
        return message.reply("⚠️ اكتب رقم صحيح!");
    }

    const users = db.collection("users");
    const targetUserId = mentioned.id;

    let user = await users.findOne({ userId: targetUserId });
    if (!user) {
        user = {
            userId: targetUserId,
            xp: 0,
            level: levelAmount,
            username: mentioned.username,
            avatar: mentioned.displayAvatarURL()
        };
        await users.insertOne(user);
    } else {
        user.level += levelAmount;
        await users.updateOne(
            { userId: targetUserId },
            { $set: { level: user.level, username: mentioned.username, avatar: mentioned.displayAvatarURL() } }
        );
    }

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('⬆️ تم إضافة Level')
        .addFields(
            { name: '👤 المستخدم', value: `${mentioned}`, inline: true },
            { name: '📈 Level المضاف', value: `**+${levelAmount}**`, inline: true },
            { name: '🏆 المستوى الكلي', value: `**${user.level}**`, inline: true }
        )
        .setTimestamp();

    message.reply({ embeds: [embed] });
}

async function removeLevel(message, args) {
    const db = getDB();
    if (!db) return;

    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return message.reply("❌ ليس لديك صلاحيات!");
    }

    const mentioned = message.mentions.users.first();
    if (!mentioned) {
        return message.reply("⚠️ اضكت @User ومية Level\nمثال: !removelevel @Pavly 5");
    }

    const levelAmount = parseInt(args[1]);
    if (isNaN(levelAmount) || levelAmount <= 0) {
        return message.reply("⚠️ اكتب رقم صحيح!");
    }

    const users = db.collection("users");
    const targetUserId = mentioned.id;

    let user = await users.findOne({ userId: targetUserId });
    if (!user) {
        return message.reply("❌ المستخدم ما عنده Level!");
    }

    user.level = Math.max(1, user.level - levelAmount);
    await users.updateOne(
        { userId: targetUserId },
        { $set: { level: user.level } }
    );

    const embed = new EmbedBuilder()
        .setColor('#FF6600')
        .setTitle('⬇️ تم حذف Level')
        .addFields(
            { name: '👤 المستخدم', value: `${mentioned}`, inline: true },
            { name: '📉 Level المحذوف', value: `**-${levelAmount}**`, inline: true },
            { name: '🏆 المستوى الكلي', value: `**${user.level}**`, inline: true }
        )
        .setTimestamp();

    message.reply({ embeds: [embed] });
}

async function getTopUsers(message) {
    const db = getDB();
    if (!db) return;

    const users = db.collection("users");
    const topUsers = await users
        .find()
        .sort({ level: -1, xp: -1 })
        .limit(5)
        .toArray();

    if (topUsers.length === 0) {
        return message.reply("❌ لا يوجد بيانات حتى الآن!");
    }

    // الشخص الأول
    const firstPlace = topUsers[0];
    const firstEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 القائمة الذهبية - TOP 5 🏆')
        .setThumbnail(firstPlace.avatar)
        .addFields(
            { 
                name: '👑 #1 - المرتبة الأولى', 
                value: `**${firstPlace.username}**\n🎯 Level: **${firstPlace.level}**\n💫 XP: **${firstPlace.xp}**`, 
                inline: false 
            }
        )
        .setTimestamp();

    // باقي التوب 5
    let topList = '';
    for (let i = 1; i < topUsers.length; i++) {
        const user = topUsers[i];
        const neededXP = user.level * 100;
        const progressPercent = (user.xp / neededXP * 100).toFixed(0);
        topList += `\n**#${i + 1}** - ${user.username}\n   🎯 Level: ${user.level} | 💫 XP: ${user.xp} | ⏳ ${progressPercent}%\n`;
    }

    firstEmbed.addFields(
        { 
            name: '📊 باقي المراتب', 
            value: topList, 
            inline: false 
        }
    );

    message.reply({ embeds: [firstEmbed] });
}

module.exports = { handleXP, getLevel, addXP, removeXP, addLevel, removeLevel, getTopUsers };
