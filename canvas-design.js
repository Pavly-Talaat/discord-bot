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
    const width = 1200;
    const height = 600;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 🌌 خلفية متدرجة (احترافية جداً)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(0.25, '#1a1a4d');
    gradient.addColorStop(0.5, '#2d1b4e');
    gradient.addColorStop(0.75, '#1a1a4d');
    gradient.addColorStop(1, '#0a0e27');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // ✨ تأثير ضوئي في الخلفية
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 100 + 50;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
        glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    
    // 👤 صورة المستخدم (دائرية كبيرة وفخمة)
    try {
        const avatarSize = 200;
        const avatarX = 80;
        const avatarY = (height - avatarSize) / 2;
        
        const img = await loadImage(userInfo.avatarURL);
        
        // ظل خلف الصورة
        ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // رسم دائرة للصورة
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        
        // إطار ذهبي متعدد الطبقات
        // الطبقة الخارجية
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // الطبقة الداخلية
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
    } catch (err) {
        console.log('⚠️ تعذر تحميل الصورة:', err.message);
    }
    
    // 📝 النصوص (الجزء الأيمن)
    const textX = 380;
    
    // اسم المستخدم (كبير وغامق)
    ctx.font = 'bold 52px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(userInfo.name, textX, 90);
    
    // العنوان الصغير
    ctx.font = '18px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('━━━━━━━ LEVEL CARD ━━━━━━━', textX, 125);
    
    // قسم الليفل الكبير
    const levelBoxY = 160;
    
    // خلفية الليفل
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.beginPath();
    ctx.roundRect(textX, levelBoxY, 300, 120, 15);
    ctx.fill();
    
    // إطار الليفل
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // الليفل (رقم كبير)
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(`${userInfo.level}`, textX + 150, levelBoxY + 95);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('CURRENT LEVEL', textX + 150, levelBoxY + 115);
    
    ctx.textAlign = 'left';
    
    // 👑 الرانك (TOP في السيرفر)
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`🏆 SERVER RANK`, textX, 320);
    
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`#${userInfo.rank}`, textX, 360);
    
    // XP المفصلة
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`✨ EXPERIENCE POINTS`, textX, 420);
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${userInfo.xp} / ${userInfo.neededXP} XP`, textX, 455);
    
    // 📊 Progress Bar (احترافي جداً)
    const barWidth = 700;
    const barHeight = 28;
    const barX = textX;
    const barY = 475;
    
    // خلفية الـ bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 14);
    ctx.fill();
    
    // إطار الـ bar
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // الـ bar المملوء (متدرج فاخر)
    const percentage = userInfo.xp / userInfo.neededXP;
    const fillWidth = barWidth * percentage;
    
    const barGradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
    barGradient.addColorStop(0, '#FFD700');
    barGradient.addColorStop(0.5, '#FFA500');
    barGradient.addColorStop(1, '#FF8C00');
    
    ctx.fillStyle = barGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillWidth, barHeight, 14);
    ctx.fill();
    
    // النسبة المئوية داخل الـ bar
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(percentage * 100)}%`, barX + barWidth / 2, barY + 23);
    
    // Footer
    ctx.textAlign = 'center';
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.fillText('Devil Bot 😈 | Professional Level Card', width / 2, height - 25);
    
    // تاريخ/وقت
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    const now = new Date().toLocaleDateString('en-US');
    ctx.fillText(`Generated: ${now}`, width / 2, height - 5);
    
    return canvas.toBuffer();
}

// 🎨 رسم Top Players Board (احترافي جداً)
async function createLeaderboardCard(topUsers) {
    const width = 1200;
    const height = 700;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 🌌 خلفية متدرجة فاخرة
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(0.25, '#2d1b4e');
    gradient.addColorStop(0.5, '#330066');
    gradient.addColorStop(0.75, '#2d1b4e');
    gradient.addColorStop(1, '#0a0e27');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // ✨ تأثيرات ضوئية
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 80 + 40;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
        glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    
    // العنوان الرئيسي
    ctx.font = 'bold 70px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 3;
    ctx.fillText('🏆 LEADERBOARD 🏆', width / 2, 90);
    ctx.shadowColor = 'transparent';
    
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.fillText('━━━━━━ TOP 5 PLAYERS ━━━━━━', width / 2, 130);
    
    // خط فاصل أنيق
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 160);
    ctx.lineTo(width - 100, 160);
    ctx.stroke();
    
    // اللاعبون
    const startY = 220;
    const spacing = 100;
    
    for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const yPos = startY + i * spacing;
        
        // خلفية الصف
        if (i === 0) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
        } else {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.03)';
        }
        
        ctx.beginPath();
        ctx.roundRect(80, yPos - 40, width - 160, 80, 10);
        ctx.fill();
        
        // الحد الفاصل
        if (i === 0) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        } else {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
        }
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // الترتيب (ميدالية)
        let medal = '🔹';
        let medalColor = '#FFD700';
        let fontSize = 32;
        
        if (i === 0) {
            medal = '🥇';
            medalColor = '#FFD700';
            fontSize = 48;
        } else if (i === 1) {
            medal = '🥈';
            medalColor = '#C0C0C0';
            fontSize = 40;
        } else if (i === 2) {
            medal = '🥉';
            medalColor = '#CD7F32';
            fontSize = 40;
        }
        
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = medalColor;
        ctx.textAlign = 'center';
        ctx.fillText(medal, 130, yPos + 15);
        
        // الترقيم
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText(`#${i + 1}`, 170, yPos + 15);
        
        // اسم المستخدم
        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(user.name, 280, yPos + 15);
        
        // الليفل والـ XP
        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.fillText(`Lvl: ${user.level} | XP: ${user.xp}`, 280, yPos + 45);
        
        // النجوم (للأول)
        if (i === 0) {
            ctx.font = '20px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'right';
            ctx.fillText('⭐ CHAMPION ⭐', width - 120, yPos + 15);
        }
    }
    
    // Footer
    ctx.textAlign = 'center';
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.fillText('━━━━━━ Devil Bot 😈 | Professional Leaderboard ━━━━━━', width / 2, height - 40);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    const now = new Date().toLocaleDateString('en-US');
    ctx.fillText(`Last Updated: ${now}`, width / 2, height - 12);
    
    return canvas.toBuffer();
}

module.exports = { createLevelCard, createLeaderboardCard };
