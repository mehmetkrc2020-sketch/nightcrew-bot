const http = require('http');
const { 
    Client, 
    GatewayIntentBits, 
    ChannelType, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');

// Render üzerinde botun 7/24 kesintisiz çalışmasını sağlayan arka plan sunucusu
http.createServer((req, res) => {
    res.write("NightCrew Bot 7/24 Aktif!");
    res.end();
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// TOKEN ARTIK KODUN İÇİNDE GÖRÜNMÜYOR (RENDER ENVIRONMENT VARIABLE'DAN ALINIYOR)
const TOKEN = process.env.TOKEN;

client.on('ready', () => {
    console.log(`✅ NightCrew Sistem Botu (${client.user.tag}) aktif!`);
    client.user.setActivity('play.nightcrew.com | !yardım', { type: 0 });
});

// ====================================================
// 1. OTO-ROL VE HOŞ GELDİN MESAJI
// ====================================================
client.on('guildMemberAdd', async (member) => {
    try {
        const autoRole = member.guild.roles.cache.find(r => r.name === '🎮 Oyuncu');
        if (autoRole) await member.roles.add(autoRole);

        const welcomeChannel = member.guild.channels.cache.find(c => c.name === '📜・giris-cikis-log' || c.name === '💬・sohbet');
        if (welcomeChannel) {
            const embed = new EmbedBuilder()
                .setTitle('👋 Aramıza Hoş Geldin!')
                .setDescription(`Aramıza hoş geldin ${member}! **${member.guild.name}** sunucusunda seninle birlikte **${member.guild.memberCount}** kişiyiz.\n\nLütfen kuralları okumayı unutma!`)
                .setColor('#6C5CE7')
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();

            welcomeChannel.send({ embeds: [embed] });
        }
    } catch (err) {
        console.error('Oto-rol hatası:', err);
    }
});

// ====================================================
// 2. TICKET (DESTEK BİLETİ) SİSTEMİ
// ====================================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;

        const ticketChannel = await guild.channels.create({
            name: `destek-${member.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        const closeBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 Bileti Kapat')
                .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
            content: `Merhaba ${member}, talebiniz oluşturuldu. Yetkililerimiz en kısa sürede ilgilenecektir.`,
            components: [closeBtn]
        });

        await interaction.reply({ content: `Biletiniz açıldı: ${ticketChannel}`, ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply('🔒 Bilet 5 saniye içinde kapatılıyor...');
        setTimeout(() => interaction.channel.delete(), 5000);
    }
});

// ====================================================
// 3. KOMUTLAR VE OTOMATİK SUNUCU KURULUMU
// ====================================================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Sil Komutu
    if (command === 'sil' || command === 'clear') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ Bu komut için yetkiniz yetersiz.');
        }
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('⚠️ Lütfen 1-100 arasında bir sayı girin.');
        }

        await message.channel.bulkDelete(amount, true);
        const msg = await message.channel.send(`🧹 **${amount}** mesaj silindi.`);
        setTimeout(() => msg.delete(), 3000);
    }

    // Destek Menüsü Kurma Komutu
    if (command === 'destek-kur') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const embed = new EmbedBuilder()
            .setTitle('🎫 NightCrew Destek Sistemi')
            .setDescription('Yetkili ekibimizle özel olarak görüşmek veya yardım almak için aşağıdaki butona tıklayabilirsiniz.')
            .setColor('#00CEC9');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('🎫 Destek Bileti Oluştur')
                .setStyle(ButtonStyle.Primary)
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }

    // Otomatik Sunucu Kurulum Komutu
    if (command === 'sunucukur') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        message.channel.send('⏳ **NightCrew** sunucusu kuruluyor...');
        const guild = message.guild;

        try {
            // Roller
            const rKurucu = await guild.roles.create({ name: '👑 KURUCU', color: '#880000', hoist: true });
            const rAile = await guild.roles.create({ name: '🛡️ NightCrew Ailesi', color: '#9B59B6', hoist: true });
            const rYonetici = await guild.roles.create({ name: '⚡ Yönetici', color: '#E74C3C', hoist: true });
            const rMod = await guild.roles.create({ name: '⚔️ Moderatör', color: '#2980B9', hoist: true });
            const rDMod = await guild.roles.create({ name: '🗡️ D.Moderatör', color: '#3498DB', hoist: true });
            const rAsistan = await guild.roles.create({ name: '📜 Asistan', color: '#1ABC9C', hoist: true });
            const rDAsistan = await guild.roles.create({ name: '📄 D.Asistan', color: '#16A085', hoist: true });
            const rRehberPlus = await guild.roles.create({ name: '⚜️ Rehber+', color: '#2ECC71', hoist: true });
            const rRehber = await guild.roles.create({ name: '🌱 Rehber', color: '#27AE60', hoist: true });
            const rDRehber = await guild.roles.create({ name: '🌿 D.Rehber', color: '#55EFC4', hoist: true });
            const rYetkili = await guild.roles.create({ name: '🔑 Yetkili', color: '#718093', hoist: true });
            const rYT = await guild.roles.create({ name: '🎬 YouTube', color: '#FF0000', hoist: true });
            const rSponsor = await guild.roles.create({ name: '💎 SPONSOR', color: '#00CEC9', hoist: true });
            const rNightVIPPlus = await guild.roles.create({ name: '🔮 NightVİP+', color: '#6C5CE7', hoist: true });
            const rNightVIP = await guild.roles.create({ name: '🔮 NightVİP', color: '#A29BFE', hoist: true });
            const rUltraVIP = await guild.roles.create({ name: '🌟 UltraVİP', color: '#F1C40F', hoist: true });
            const rMegaVIP = await guild.roles.create({ name: '✨ MegaVİP', color: '#F39C12', hoist: true });
            const rVIP = await guild.roles.create({ name: '⭐ VİP', color: '#E67E22', hoist: true });
            const rOyuncu = await guild.roles.create({ name: '🎮 Oyuncu', color: '#BDC3C7', hoist: true });

            // Kanallar
            const catInfo = await guild.channels.create({ name: '📌 │ NightCrew', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: '📜・kurallar', parent: catInfo.id });
            await guild.channels.create({ name: '📢・duyurular', parent: catInfo.id });

            const catTopluluk = await guild.channels.create({ name: '💬 │ Topluluk', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: '💬・sohbet', parent: catTopluluk.id });
            await guild.channels.create({ name: '🤖・bot-komut', parent: catTopluluk.id });

            const catYonetim = await guild.channels.create({
                name: '🔒 │ Yönetim',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: rYetkili.id, allow: [PermissionFlagsBits.ViewChannel] }
                ]
            });
            await guild.channels.create({ name: '💬・yetkili-sohbet', parent: catYonetim.id });

            message.channel.send('✅ **Sunucu kurulumu başarıyla tamamlandı!**');
        } catch (e) {
            console.error(e);
        }
    }
});

client.login(TOKEN);