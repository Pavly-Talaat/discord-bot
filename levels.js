const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 }
});

const User = mongoose.model('User', userSchema);

// نظام XP
async function handleXP(message) {
    const userId = message.author.id;

    let user = await User.findOne({ userId });

    if (!user) {
        user = new User({ userId });
    }

    user.xp += 2;

    const neededXP = user.level * 100;

    if (user.xp >= neededXP) {
        user.level++;
        user.xp = 0;

        message.channel.send(`🔥 ${message.author} وصل Level ${user.level} 😈`);
    }

    await user.save();
}

// عرض المستوى
async function getLevel(message) {
    const userId = message.author.id;

    const user = await User.findOne({ userId });

    if (!user) {
        return message.reply("😈 أنت لسه Level 0...");
    }

    message.reply(`🔥 Level: ${user.level}\n💀 XP: ${user.xp}`);
}

module.exports = { handleXP, getLevel };