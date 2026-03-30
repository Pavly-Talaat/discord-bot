const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 }
});

const User = mongoose.model('User', userSchema);

// XP
async function handleXP(message) {
    let user = await User.findOne({ userId: message.author.id });

    if (!user) {
        user = new User({ userId: message.author.id });
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

// Level
async function getLevel(message) {
    const user = await User.findOne({ userId: message.author.id });

    if (!user) {
        return message.reply("😈 أنت لسه Level 0...");
    }

    message.reply(`🔥 Level: ${user.level}\n💀 XP: ${user.xp}`);
}

module.exports = { handleXP, getLevel };