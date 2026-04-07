const Jimp = require('jimp');
const axios = require('axios');

// تحميل صورة من URL
async function downloadImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (err) {
        console.log('⚠️ تعذر تحميل الصورة:', err.message);
        return null;
    }
}

// 🎨 رسم كارت الليفل احترافي بـ Jimp
async function createLevelCard(userInfo) {
    try {
        // إنشاء صورة جديدة
        const image = new Jimp({
            width: 1200,
            height: 600,
            color: 0x0a0e27ff // خلفية داكنة
        });

        // تحميل صورة المستخدم
        let avatarBuffer = null;
        if (userInfo.avatarURL) {
            avatarBuffer = await downloadImage(userInfo.avatarURL);
        }

        // إذا كانت الصورة موجودة، أضفها
        if (avatarBuffer) {
            try {
                const avatar = await Jimp.read(avatarBuffer);
                
                // تغيير حجم الصورة
                avatar.resize({
                    w: 180,
                    h: 180,
                    fit: 'cover'
                });

                // إضافة الصورة في الزاوية اليسرى
                image.composite(avatar, 50, 210);
            } catch (err) {
                console.log('⚠️ خطأ في معالجة الصورة:', err.message);
            }
        }

        // كتابة النصوص
        const font14 = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);
        const font16 = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
        const font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

        // اسم المستخدم
        image.print({
            font: font32,
            x: 350,
            y: 80,
            text: userInfo.name,
            maxWidth: 800
        });

        // العنوان
        image.print({
            font: font16,
            x: 350,
            y: 140,
            text: '━━━ LEVEL CARD ━━━'
        });

        // الليفل
        image.print({
            font: font32,
            x: 350,
            y: 200,
            text: `Level: ${userInfo.level}`
        });

        // الرانك
        image.print({
            font: font16,
            x: 350,
            y: 270,
            text: `🏆 Server Rank: #${userInfo.rank}`
        });

        // الـ XP
        image.print({
            font: font16,
            x: 350,
            y: 320,
            text: `✨ Experience: ${userInfo.xp} / ${userInfo.neededXP} XP`
        });

        // Progress Bar (نص بسيط)
        const percentage = Math.round((userInfo.xp / userInfo.neededXP) * 100);
        image.print({
            font: font14,
            x: 350,
            y: 380,
            text: `Progress: ${percentage}% [${'█'.repeat(Math.floor(percentage / 10))}${'░'.repeat(10 - Math.floor(percentage / 10))}]`
        });

        // Footer
        image.print({
            font: font14,
            x: 50,
            y: 550,
            text: `Devil Bot 😈 | Generated: ${new Date().toLocaleDateString('en-US')}`
        });

        return await image.png().toBuffer();
    } catch (err) {
        console.error('❌ خطأ في إنشاء الكارت:', err);
        return null;
    }
}

// 🎨 رسم Leaderboard
async function createLeaderboardCard(topUsers) {
    try {
        const image = new Jimp({
            width: 1200,
            height: 150 + topUsers.length * 100,
            color: 0x0a0e27ff
        });

        const font14 = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);
        const font16 = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
        const font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

        // العنوان
        image.print({
            font: font32,
            x: 100,
            y: 20,
            text: '🏆 LEADERBOARD - TOP 5 PLAYERS 🏆',
            maxWidth: 1000
        });

        // خط فاصل
        image.print({
            font: font14,
            x: 100,
            y: 80,
            text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        });

        // اللاعبون
        for (let i = 0; i < topUsers.length; i++) {
            const user = topUsers[i];
            const yPos = 130 + i * 100;

            let medal = '🔹';
            if (i === 0) medal = '🥇 #1 ⭐ CHAMPION';
            else if (i === 1) medal = '🥈 #2';
            else if (i === 2) medal = '🥉 #3';
            else medal = `🔹 #${i + 1}`;

            image.print({
                font: font16,
                x: 100,
                y: yPos,
                text: `${medal} ${user.name}`
            });

            image.print({
                font: font14,
                x: 100,
                y: yPos + 40,
                text: `Level: ${user.level} | XP: ${user.xp}`
            });
        }

        // Footer
        const footerY = 120 + topUsers.length * 100;
        image.print({
            font: font14,
            x: 100,
            y: footerY,
            text: `Devil Bot 😈 | Updated: ${new Date().toLocaleDateString('en-US')}`
        });

        return await image.png().toBuffer();
    } catch (err) {
        console.error('❌ خطأ في إنشاء اللوحة:', err);
        return null;
    }
}

module.exports = { createLevelCard, createLeaderboardCard };
