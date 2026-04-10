const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder
} = require("discord.js");

const { getDB } = require("./database");

let ticketHandlerLoaded = false;
const PANEL_CHANNEL_ID = "1491908284813148272"; 

// 🔢 عداد التيكت - معالجة خطأ MongoDB المشهور في الاستضافات
async function getNextTicketNumber(db) {
    try {
        const settings = db.collection("settings");
        const result = await settings.findOneAndUpdate(
            { name: "ticketCounter" },
            { $inc: { value: 1 } },
            { upsert: true, returnDocument: "after" }
        );
        // التعامل مع اختلاف إصدارات الـ Driver لـ MongoDB
        const val = result.value ? (result.value.value || result.value) : result.value;
        return val || Math.floor(Math.random() * 1000);
    } catch (err) {
        console.error("❌ Error in getNextTicketNumber:", err);
        return "N/A";
    }
}

// 🎫 إرسال الـ Panel مع التحقق من وجود رسالة سابقة
async function sendPanel(client) {
    try {
        const db = getDB();
        if (!db) return console.log("⏳ waiting for DB...");

        const channel = await client.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
        if (!channel) return console.error("❌ لا يمكن العثور على روم البانل!");

        // 🔍 فحص آخر 50 رسالة للتأكد من عدم التكرار
        const messages = await channel.messages.fetch({ limit: 50 });
        const isExist = messages.some(m => 
            m.author.id === client.user.id && 
            m.embeds.length > 0 && 
            m.embeds[0].title === "الدعم 🎫"
        );

        if (isExist) {
            console.log("✅ الرسالة موجودة بالفعل في الروم، لن يتم التكرار.");
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
            .setFooter({ text: "نظام التذاكر المتطور" });

        await channel.send({ embeds: [embed], components: [row] });
        console.log("🚀 تم إرسال لوحة الدعم بنجاح.");
    } catch (err) {
        console.error("❌ Error in sendPanel:", err);
    }
}

// 🎮 معالج التفاعلات (فتح وإغلاق)
function handleTicketInteraction(client, OWNER_ID) {
    if (ticketHandlerLoaded) return;
    ticketHandlerLoaded = true;

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        const { guild, user, customId, channel } = interaction;

        if (customId === "create_ticket") {
            try {
                // منع التعليق (Interaction Failed)
                await interaction.deferReply({ ephemeral: true });

                const db = getDB();
                const ticketNumber = await getNextTicketNumber(db);

                const ticketChannel = await guild.channels.create({
                    name: `ticket-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
                        { id: OWNER_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                    ]
                });

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("close_ticket")
                        .setLabel("🔒 إغلاق")
                        .setStyle(ButtonStyle.Danger)
                );

                await ticketChannel.send({
                    content: `أهلاً بك ${user} | <@${OWNER_ID}>`,
                    embeds: [new EmbedBuilder().setDescription("اكتب استفسارك هنا وسيتم الرد عليك.").setColor("#5865F2")],
                    components: [closeRow]
                });

                await interaction.editReply({ content: `✅ تم فتح التذكرة: ${ticketChannel}` });
            } catch (err) {
                console.error("❌ Ticket Error:", err);
            }
        }

        if (customId === "close_ticket") {
            if (user.id !== OWNER_ID) return interaction.reply({ content: "❌ للأونر فقط", ephemeral: true });
            
            await interaction.reply("🔒 سيتم حذف التذكرة خلال 3 ثوانٍ...");
            setTimeout(() => channel.delete().catch(() => {}), 3000);
        }
    });
}

module.exports = { handleTicketInteraction, sendPanel };
