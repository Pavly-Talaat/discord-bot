const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder
} = require("discord.js");

const { getDB } = require("./database");

const tickets = new Map();
let ticketHandlerLoaded = false;
const PANEL_CHANNEL_ID = "1491908284813148272"; // الروم المراد مراقبتها

// 🔢 عداد التيكت - جلب الرقم التالي من قاعدة البيانات
async function getNextTicketNumber(db) {
    const settings = db.collection("settings");

    const data = await settings.findOneAndUpdate(
        { name: "ticketCounter" },
        { $inc: { value: 1 } },
        { upsert: true, returnDocument: "after" }
    );

    // التعامل مع هيكل البيانات المختلف في نسخ MongoDB
    return data.value ? data.value.value : data.value; 
}

// 🎫 إرسال Panel مع التحقق من وجود رسالة سابقة (الميزة المطلوبة)
async function sendPanel(client) {
    try {
        const db = getDB();
        if (!db) return;

        const settings = db.collection("settings");
        const channel = await client.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
        
        if (!channel) {
            console.error("❌ لم يتم العثور على روم الدعم!");
            return;
        }

        // 🔍 فحص آخر 50 رسالة في الروم للتأكد من عدم وجود البانل
        const messages = await channel.messages.fetch({ limit: 50 });
        const existingPanel = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0 && m.embeds[0].title === "الدعم 🎫");

        // إذا وجدت الرسالة بالفعل، لن يرسلها مرة أخرى
        if (existingPanel) {
            console.log("✅ لوحة الدعم موجودة بالفعل في الروم، لن يتم إعادة الإرسال.");
            return;
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("create_ticket")
                .setLabel("📩 Create Ticket")
                .setStyle(ButtonStyle.Primary)
        );

        const embed = new EmbedBuilder()
            .setTitle("الدعم 🎫")
            .setDescription("لفتح تذكرة جديدة والتواصل مع الإدارة، اضغط على الزر أدناه 📩")
            .setColor("#2b2d31")
            .setFooter({ text: "نظام التذاكر المتطور 😈" });

        const sent = await channel.send({
            embeds: [embed],
            components: [row]
        });

        // تحديث قاعدة البيانات بمعرف الرسالة الجديدة
        await settings.updateOne(
            { name: "ticketPanel" },
            { $set: { messageId: sent.id, channelId: PANEL_CHANNEL_ID } },
            { upsert: true }
        );

        console.log("✅ تم إرسال لوحة الدعم بنجاح.");

    } catch (err) {
        console.error("❌ Panel Error:", err);
    }
}

// 🎮 التعامل مع التفاعلات (فتح وإغلاق التذاكر)
function handleTicketInteraction(client, OWNER_ID) {
    if (ticketHandlerLoaded) return;
    ticketHandlerLoaded = true;

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        const { guild, user, customId } = interaction;

        // ================= إنشاء تذكرة =================
        if (customId === "create_ticket") {
            try {
                await interaction.deferReply({ ephemeral: true });

                // منع السبام (تذكرتين لكل مستخدم يومياً)
                const today = new Date().toDateString();
                if (!tickets.has(user.id)) tickets.set(user.id, { count: 0, date: today });
                const userData = tickets.get(user.id);

                if (userData.date !== today) {
                    userData.count = 0;
                    userData.date = today;
                }

                if (userData.count >= 2 && user.id !== OWNER_ID) {
                    return interaction.editReply({ content: "❌ عذراً، لقد وصلت للحد الأقصى (2 تذكرة يومياً)." });
                }

                const db = getDB();
                const ticketNumber = await getNextTicketNumber(db);

                // إنشاء الروم وتحديد الصلاحيات
                const channel = await guild.channels.create({
                    name: `ticket-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
                        { id: OWNER_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                    ]
                });

                userData.count++;

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("close_ticket")
                        .setLabel("🔒 إغلاق التذكرة")
                        .setStyle(ButtonStyle.Danger)
                );

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle(`تذكرة رقم #${ticketNumber}`)
                    .setDescription(`أهلاً بك ${user}، يرجى كتابة استفسارك هنا وسيقوم الدعم بالرد عليك قريباً.`)
                    .setColor("#00ff00")
                    .setTimestamp();

                await channel.send({
                    content: `${user} | <@${OWNER_ID}>`,
                    embeds: [welcomeEmbed],
                    components: [closeRow]
                });

                // إرسال رسالة في الخاص للمستخدم
                try {
                    await user.send(`🎫 تم إنشاء تذكرتك بنجاح: ${channel}`);
                } catch (e) {}

                await interaction.editReply({ content: `✅ تم فتح التذكرة بنجاح: ${channel}` });

            } catch (err) {
                console.error("Ticket Creation Error:", err);
                await interaction.editReply({ content: "❌ حدث خطأ أثناء محاولة فتح التذكرة." });
            }
        }

        // ================= إغلاق التذكرة =================
        if (customId === "close_ticket") {
            try {
                if (interaction.user.id !== OWNER_ID) {
                    return interaction.reply({ content: "❌ هذا الإجراء متاح للأونر فقط.", ephemeral: true });
                }

                await interaction.reply("🔒 سيتم إغلاق التذكرة وحذف القناة خلال 5 ثوانٍ...");
                
                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 5000);

            } catch (err) {
                console.error("Close Ticket Error:", err);
            }
        }
    });
}

module.exports = {
    handleTicketInteraction,
    sendPanel
};
