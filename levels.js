const fs = require('fs');

let users = {};

if (fs.existsSync('levels.json')) {
    users = JSON.parse(fs.readFileSync('levels.json'));
}

function saveData() {
    fs.writeFileSync('levels.json', JSON.stringify(users, null, 2));
}

function handleXP(message) {
    const userId = message.author.id;

    if (!users[userId]) {
        users[userId] = {
            xp: 0,
            level: 1
        };
    }

    users[userId].xp += 10;

    const neededXP = users[userId].level * 100;

    if (users[userId].xp >= neededXP) {
        users[userId].level++;
        users[userId].xp = 0;

        message.channel.send(`🔥 ${message.author} وصل Level ${users[userId].level} 😈`);
    }

    saveData();
}

function getLevel(message) {
    const userId = message.author.id;

    if (!users[userId]) {
        return message.reply("😈 أنت لسه Level 0... ابدأ اكتب!");
    }

    message.reply(
        `🔥 Level: ${users[userId].level}\n💀 XP: ${users[userId].xp}`
    );
}

module.exports = { handleXP, getLevel };