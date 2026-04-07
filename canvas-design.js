const { createCanvas, registerFont, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

// تسجيل خطوط احترافية (تأكد من وجود الخطوط في مجلد fonts/)
try {
    registerFont(path.join(__dirname, 'fonts/bold.ttf'), { family: 'Bold' });
} catch (err) {
    console.log('⚠️ تعذر تحميل الخط - استخدام الخط الافتراضي');
}

// 🎨 رسم كارت الليفل احترافي
async function createLevelCard(userInfo) {
    const width = 1000;
    const height = 500;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 🌌 خلفية متدرجة (احترافية)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // ✨ زوايا مستديرة (تأثير احترافي)
    const radius = 20;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.stroke();
    ctx.clip();
    
    // 👤 صورة المستخدم (دائرية)
    try {
        const avatarSize = 150;
        const avatarX = 50;
        const avatarY = (height - avatarSize) / 2;
        
        const img = await loadImage(userInfo.avatarURL);
        
        // رسم دائرة للصورة
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fill();
        ctx.clip();
        
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        
        // إطار ذهبي حول الصورة
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
    } catch (err) {
        console.log('⚠️ تعذر تحميل الصورة:', err.message);
    }
    
    // 📝 النصوص
    const textX = 250;
    
    // اسم المستخدم (كبير وغامق)
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(userInfo.name, textX, 100);
    
    // العنوان الصغير
    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('• LEVEL CARD •', textX, 135);
    
    // ⭐ المستوى
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`${userInfo.level}`, textX, 220);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.fillText('LEVEL', textX, 245);
    
    // 👑 الرتبة والـ XP
    ctx.font = '18px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`🏆 Rank: #${userInfo.rank}`, textX, 300);
    ctx.fillText(`✨ XP: ${userInfo.xp} / ${userInfo.neededXP}`, textX, 340);
    
    // 📊 Progress Bar (احترافي)
    const barWidth = 600;
    const barHeight = 20;
    const barX = textX;
    const barY = 380;
    
    // خلفية الـ bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 10);
    ctx.fill();
    
    // الـ bar المملوء (متدرج)
    const percentage = userInfo.xp / userInfo.neededXP;
    const fillWidth = barWidth * percentage;
    
    const barGradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
    barGradient.addColorStop(0, '#FFD700');
    barGradient.addColorStop(1, '#FFA500');
    
    ctx.fillStyle = barGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillWidth, barHeight, 10);
    ctx.fill();
    
    // النسبة المئوية
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(percentage * 100)}%`, barX + barWidth + 20, barY + 15);
    
    // Footer (الوقت أو معلومة إضافية)
    ctx.textAlign = 'left';
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.fillText('Devil Bot 😈 | Powered by Canvas', textX, height - 20);
    
    return canvas.toBuffer();
}

// 🎨 رسم Top Players Board (احترافي)
async function createLeaderboardCard(topUsers) {
    const width = 1000;
    const height = 600;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 🌌 خلفية متدرجة
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a0033');
    gradient.addColorStop(0.5, '#330066');
    gradient.addColorStop(1, '#1a0033');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // العنوان الرئيسي
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 LEADERBOARD 🏆', width / 2, 80);
    
    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.fillText('TOP PLAYERS', width / 2, 110);
    
    // خط فاصل
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 130);
    ctx.lineTo(width - 100, 130);
    ctx.stroke();
    
    // اللاعبون
    const startY = 180;
    const spacing = 80;
    
    for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const yPos = startY + i * spacing;
        
        // الرقم (ترتيب)
        let medal = '🔹';
        let medalColor = '#FFD700';
        
        if (i === 0) {
            medal = '🥇';
            medalColor = '#FFD700';
        } else if (i === 1) {
            medal = '🥈';
            medalColor = '#C0C0C0';
        } else if (i === 2) {
            medal = '🥉';
            medalColor = '#CD7F32';
        }
        
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = medalColor;
        ctx.fillText(medal, 80, yPos);
        
        // البيانات
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`#${i + 1}`, 150, yPos);
        
        ctx.font = '22px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(user.name, 250, yPos);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'right';
        ctx.fillText(`Level ${user.level}`, width - 100, yPos);
        
        ctx.textAlign = 'left';
    }
    
    // Footer
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Devil Bot 😈 | Updated Live', width / 2, height - 30);
    
    return canvas.toBuffer();
}

module.exports = { createLevelCard, createLeaderboardCard };
