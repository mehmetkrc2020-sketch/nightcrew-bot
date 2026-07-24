const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    PermissionsBitField, 
    ChannelType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder,
    StringSelectMenuBuilder 
} = require('discord.js');
const http = require('http');

// Render 7/24 Kesintisiz Çalışma Sunucusu
http.createServer((req, res) => {
  res.write("NightCrew Premium Bot 7/24 Aktif!");
  res.end();
}).listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

const TOKEN = process.env.TOKEN;

// Basit Hafıza İçi Seviye (XP) Takip Sistemi
const userXP = new Map();

// Güvenli Bekleme Fonksiyonu (Rate Limit Engelini Aşar)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

client.once('ready', () => {
  console.log(`🚀 [PREMIUM] ${client.user.tag} tam kapasiteyle aktif!`);
  client.user.setActivity('play.nightcrew.com | !yardım', { type: 0 });
});

// ====================================================
// 1. MESAJ XP SİSTEMİ & GELİŞMİŞ OTO-MODERASYON
// ====================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // Seviye/XP Mekanizması
  const userId = message.author.id;
  const currentXP = userXP.get(userId) || 0;
  const newXP = currentXP + Math.floor(Math.random() * 10) + 15;
  userXP.set(userId, newXP);

  // Her 100 XP'de Bir Seviye Atlama Logu
  if (Math.floor(newXP / 100) > Math.floor(currentXP / 100)) {
    const level = Math.floor(newXP / 100);
    const levelMsg = await message.channel.send(`🎉 Tebrikler ${message.author}! **Seviye ${level}** oldun! 🚀`);
    setTimeout(() => levelMsg.delete().catch(() => {}), 5000);
  }

  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // YARDIM MENÜSÜ
  if (command === 'yardim' || command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('👑 NightCrew Premium Komut Paneli')
      .setColor('#6C5CE7')
      .setDescription('Sunucunuzu yönetmek için kullanabileceğiniz gelişmiş komutlar:')
      .addFields(
        { name: '🛠️ Yönetim Komutları', value: '`!sunucukur` - Sıfırdan profesyonel sunucu kurar.\n`!destek-kur` - Gelişmiş bilet paneli kurar.\n`!sil [1-100]` - Toplu mesaj siler.' },
        { name: '👤 Kullanıcı Komutları', value: '`!seviye` - Güncel XP ve seviyenizi gösterir.\n`!ping` - Bot gecikmesini ölçer.' }
      )
      .setFooter({ text: 'NightCrew Network Systems' });
    return message.channel.send({ embeds: [embed] });
  }

  // SEVİYE SORGULAMA
  if (command === 'seviye' || command === 'rank') {
    const xp = userXP.get(message.author.id) || 0;
    const level = Math.floor(xp / 100);
    return message.reply(`📊 **Seviye Durumu:** Seviye **${level}** | Toplam XP: **${xp}**`);
  }

  // MESAJ SİLME
  if (command === 'sil' || command === 'clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('❌ Bu işlem için `Mesajları Yönet` yetkiniz yok.');
    }
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) return message.reply('⚠️ 1-100 arasında miktar girin.');

    await message.channel.bulkDelete(amount, true);
    const m = await message.channel.send(`🧹 **${amount}** adet mesaj temizlendi.`);
    setTimeout(() => m.delete().catch(() => {}), 3000);
  }

  // DESTEK PANELİ KURULUMU
  if (command === 'destek-kur') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const embed = new EmbedBuilder()
      .setTitle('🎫 NightCrew Destek & İletişim Merkezi')
      .setDescription('Aşağıdaki **Destek Bileti Oluştur** butonuna basarak yetkili ekibimizle birebir özel iletişim kanalı açabilirsiniz.\n\n*Gereksiz bilet açmak ceza sebebidir.*')
      .setColor('#00CEC9')
      .setThumbnail(message.guild.iconURL());

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket_v2')
        .setLabel('Destek Bileti Oluştur')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  }

  // ====================================================
  // PROFESYONEL DEV SUNUCU KURULUMU (!sunucukur)
  // ====================================================
  if (command === 'sunucukur') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const statusMsg = await message.channel.send('⏳ **VIP Sunucu Altyapısı Kuruluyor...**\n*Discord engelini aşmak için kanallar sırayla oluşturulacaktır, lütfen bekleyin.*');

    try {
      const guild = message.guild;

      // 1. ADIM: GELİŞMİŞ ROL HİYERARŞİSİ
      const rolesData = [
        { name: '👑 Sunucu Sahibi', color: '#880000', hoist: true },
        { name: '🛡️ Yönetim Ekibi', color: '#E74C3C', hoist: true },
        { name: '⚔️ Moderatör', color: '#2980B9', hoist: true },
        { name: '🌿 Rehber', color: '#2ECC71', hoist: true },
        { name: '💎 VIP+', color: '#00CEC9', hoist: true },
        { name: '🔮 VIP', color: '#6C5CE7', hoist: true },
        { name: '🎬 Streamer / YT', color: '#FF0000', hoist: true },
        { name: '🎮 Oyuncu', color: '#BDC3C7', hoist: true },
        { name: '🤖 Botlar', color: '#95A5A6', hoist: true }
      ];

      for (const r of rolesData) {
        if (!guild.roles.cache.some(role => role.name === r.name)) {
          await guild.roles.create({ name: r.name, color: r.color, hoist: r.hoist });
          await sleep(1000);
        }
      }

      // 2. ADIM: KAPSAMLI KANAL YAPILANMASI
      const fullStructure = [
        {
          category: '📌 ｜ BİLGİLENDİRME & KURAL',
          channels: [
            { name: '📜・kurallar', type: ChannelType.GuildText },
            { name: '📢・duyurular', type: ChannelType.GuildText },
            { name: '🎉・cekilis-ve-etkinlik', type: ChannelType.GuildText },
            { name: '📊・seviye-log', type: ChannelType.GuildText },
            { name: '🚪・giris-cikis', type: ChannelType.GuildText }
          ]
        },
        {
          category: '💬 ｜ GENEL MEYDAN',
          channels: [
            { name: '💬・sohbet', type: ChannelType.GuildText },
            { name: '🤖・bot-komut', type: ChannelType.GuildText },
            { name: '📷・gorsel-paylasim', type: ChannelType.GuildText },
            { name: '💡・oneri-sikayet', type: ChannelType.GuildText }
          ]
        },
        {
          category: '🎫 ｜ DESTEK VE İLETİŞİM',
          channels: [
            { name: '🎫・destek-olustur', type: ChannelType.GuildText },
            { name: '❓・sss-sss', type: ChannelType.GuildText }
          ]
        },
        {
          category: '🔊 ｜ SESLİ MEYDAN',
          channels: [
            { name: '🔊・Sohbet #1', type: ChannelType.GuildVoice },
            { name: '🔊・Sohbet #2', type: ChannelType.GuildVoice },
            { name: '🎵・Müzik Odası', type: ChannelType.GuildVoice },
            { name: '💤・AFK / Dinlenme', type: ChannelType.GuildVoice }
          ]
        },
        {
          category: '🎮 ｜ OYUN ODALARI',
          channels: [
            { name: '🎮・oyun-chat', type: ChannelType.GuildText },
            { name: '🕹️・Oyun Odası #1', type: ChannelType.GuildVoice },
            { name: '🕹️・Oyun Odası #2', type: ChannelType.GuildVoice },
            { name: '🕹️・Oyun Odası #3', type: ChannelType.GuildVoice }
          ]
        },
        {
          category: '🔒 ｜ YÖNETİM MERKEZİ',
          channels: [
            { name: '💬・yetkili-chat', type: ChannelType.GuildText },
            { name: '📝・denetim-log', type: ChannelType.GuildText },
            { name: '🔊・Yetkili Toplantı', type: ChannelType.GuildVoice }
          ]
        }
      ];

      for (const cat of fullStructure) {
        let categoryChannel = guild.channels.cache.find(c => c.name === cat.category && c.type === ChannelType.GuildCategory);
        if (!categoryChannel) {
          categoryChannel = await guild.channels.create({ name: cat.category, type: ChannelType.GuildCategory });
          await sleep(1200);
        }

        for (const ch of cat.channels) {
          if (!guild.channels.cache.some(c => c.name === ch.name)) {
            await guild.channels.create({
              name: ch.name,
              type: ch.type,
              parent: categoryChannel.id
            });
            await sleep(1200); // Discord rate limit takılmasını tamamen sıfırlar
          }
        }
      }

      await statusMsg.edit('✅ **Tüm sunucu mimarisi, VIP roller, kanallar ve log altyapısı eksiksiz kuruldu!**');

    } catch (error) {
      console.error(error);
      statusMsg.edit('⚠️ Kurulum sırasında beklenmeyen bir takılma yaşandı.');
    }
  }
});

// ====================================================
// 2. TICKET (DESTEK) INTERACTION MİMARİSİ
// ====================================================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'create_ticket_v2') {
    const guild = interaction.guild;
    const user = interaction.user;

    const channelName = `bilet-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    if (guild.channels.cache.some(c => c.name === channelName)) {
      return interaction.reply({ content: '⚠️ Zaten açık durumda bir destek talebiniz bulunuyor!', ephemeral: true });
    }

    let parentCategory = guild.channels.cache.find(c => c.name.includes('DESTEK') && c.type === ChannelType.GuildCategory);

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: parentCategory ? parentCategory.id : null,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 Özel Destek Odası - ${user.username}`)
      .setDescription('Hoş geldiniz! Sorununuzu veya talebinizi detaylıca buraya yazabilirsiniz. Yetkili ekibimiz en kısa sürede dönüş yapacaktır.')
      .setColor('#00CEC9')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket_v2')
        .setLabel('Bileti Kapat ve Sil')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Destek kanalınız oluşturuldu: ${ticketChannel}`, ephemeral: true });
  }

  if (interaction.customId === 'close_ticket_v2') {
    await interaction.reply('🔒 Destek bileti sonlandırılıyor, kanal 5 saniye içinde silinecektir...');
    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);
  }
});

client.login(TOKEN);
