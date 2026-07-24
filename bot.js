const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    PermissionsBitField, 
    ChannelType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');
const http = require('http');

// Render 7/24 Aktif Tutma Sunucusu
http.createServer((req, res) => {
  res.write("NightCrew Ultimate Bot 7/24 Online!");
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

// Veri Depoları (Memory-based)
const userXP = new Map();
const tempVoiceChannels = new Set();

// Discord Rate-Limit Engelleyici (Bekleme Fonksiyonu)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

client.once('ready', () => {
  console.log(`👑 [ULTIMATE VIP] ${client.user.tag} başarıyla aktifleştirildi!`);
  client.user.setActivity('NightCrew Network | !yardim', { type: 0 });
});

// ====================================================
// 1. OTO-ROL VE HOŞ GELDİN KARŞILAMA SİSTEMİ
// ====================================================
client.on('guildMemberAdd', async (member) => {
  try {
    // Oto Rol Verme
    const autoRole = member.guild.roles.cache.find(r => r.name === '🎮 Oyuncu');
    if (autoRole) await member.roles.add(autoRole);

    // Hoş Geldin Log Mesajı
    const welcomeChannel = member.guild.channels.cache.find(c => c.name.includes('giris-cikis') || c.name.includes('sohbet'));
    if (welcomeChannel) {
      const embed = new EmbedBuilder()
        .setTitle('🎉 Sunucumuza Yeni Biri Katıldı!')
        .setDescription(`Aramıza hoş geldin ${member}! Seninle birlikte **${member.guild.memberCount}** kişi olduk.\n\nRolün (<@&${autoRole?.id}>) otomatik olarak tanımlandı!`)
        .setColor('#2ECC71')
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
      welcomeChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Oto-rol/karşılama hatası:', err);
  }
});

// ====================================================
// 2. ÖZEL SES ODASI OLUŞTURUCU (JOIN TO CREATE)
// ====================================================
client.on('voiceStateUpdate', async (oldState, newState) => {
  const user = newState.member;
  
  // Odaya Katılma Kontrolü
  if (newState.channel && newState.channel.name.includes('➕ Oda Oluştur')) {
    const category = newState.channel.parent;
    const createdChannel = await newState.guild.channels.create({
      name: `🔊｜${user.displayName}'in Odası`,
      type: ChannelType.GuildVoice,
      parent: category ? category.id : null,
      permissionOverwrites: [
        { id: user.id, allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers] }
      ]
    });
    tempVoiceChannels.add(createdChannel.id);
    await user.voice.setChannel(createdChannel);
  }

  // Boşalan Özel Odayı Silme Kontrolü
  if (oldState.channel && tempVoiceChannels.has(oldState.channel.id)) {
    if (oldState.channel.members.size === 0) {
      tempVoiceChannels.delete(oldState.channel.id);
      await oldState.channel.delete().catch(() => {});
    }
  }
});

// ====================================================
// 3. MESAJ KONTROLÜ, OTO-MODERASYON, XP & SELAMLAMA
// ====================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const msg = message.content.toLowerCase().trim();

  // A. OTO-MODERASYON (Reklam & Küfür Filtresi)
  const kufurler = ['amk', 'aq', 'oç', 'pic', 'piç', 'sg', 'sik'];
  const hasReklam = /(discord\.gg|discord\.com\/invite|http:\/\//i.test(message.content);
  const hasKufur = kufurler.some(word => msg.split(' ').includes(word));

  if ((hasReklam || hasKufur) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await message.delete().catch(() => {});
    const warnMsg = await message.channel.send(`⚠️ ${message.author}, reklam veya küfür içerikli mesaj gönderemezsin!`);
    setTimeout(() => warnMsg.delete().catch(() => {}), 4000);
    return;
  }

  // B. HER HANGİ BİR CHAT'TE YAZILAN SELAMA CEVAP VERME SİSTEMİ
  const selamlar = ['sa', 'selam', 'selamun aleykum', 'selamün aleyküm', 'slm', 'merhaba', 'sea'];
  const kelimeler = msg.split(/\s+/);
  if (selamlar.some(s => msg === s || kelimeler[0] === s)) {
    await message.reply(`Aleykümselam 👋 Hoş geldin **${message.author.username}**! Keyifli vakit geçirmeni dileriz.`);
  }

  // C. SEVİYE / XP SİSTEMİ
  const userId = message.author.id;
  const currentXP = userXP.get(userId) || 0;
  const addedXP = Math.floor(Math.random() * 10) + 15;
  const newXP = currentXP + addedXP;
  userXP.set(userId, newXP);

  if (Math.floor(newXP / 100) > Math.floor(currentXP / 100)) {
    const level = Math.floor(newXP / 100);
    const lvlMsg = await message.channel.send(`🎉 Tebrikler ${message.author}! Sohbet ettikçe yükseliyorsun: **Seviye ${level}** oldun! 🚀`);
    setTimeout(() => lvlMsg.delete().catch(() => {}), 5000);
  }

  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // D. KOMUTLAR
  if (command === 'yardim' || command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('👑 NightCrew Ultimate Komut Paneli')
      .setColor('#6C5CE7')
      .setDescription('Sunucuda kullanabileceğin gelişmiş komut listesi:')
      .addFields(
        { name: '🛠️ Yönetici Komutları', value: '`!sunucukur` - Sıfırdan devasa VIP sunucu kurar.\n`!destek-kur` - Gelişmiş bilet panelini kurar.\n`!sil [1-100]` - Kanalı temizler.' },
        { name: '📊 Kullanıcı Komutları', value: '`!seviye` - Seviye ve XP durumunu gösterir.\n`!ping` - Bot gecikmesini gösterir.' }
      )
      .setFooter({ text: 'NightCrew Premium Systems' });
    return message.channel.send({ embeds: [embed] });
  }

  if (command === 'seviye' || command === 'rank') {
    const xp = userXP.get(message.author.id) || 0;
    const level = Math.floor(xp / 100);
    const embed = new EmbedBuilder()
      .setTitle(`📊 XP & Seviye Kartı - ${message.author.username}`)
      .setColor('#00CEC9')
      .addFields(
        { name: 'Mevcut Seviye', value: `\`${level}\``, inline: true },
        { name: 'Toplam XP', value: `\`${xp}\``, inline: true },
        { name: 'Sonraki Seviye', value: `\`${(level + 1) * 100 - xp} XP kaldı\``, inline: true }
      );
    return message.channel.send({ embeds: [embed] });
  }

  if (command === 'sil' || command === 'clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const amount = parseInt(args[0]) || 10;
    await message.channel.bulkDelete(Math.min(amount, 100), true);
    const m = await message.channel.send(`🧹 **${amount}** adet mesaj temizlendi.`);
    setTimeout(() => m.delete().catch(() => {}), 3000);
  }

  if (command === 'destek-kur') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    const embed = new EmbedBuilder()
      .setTitle('🎫 NightCrew Destek & Bilet Merkezi')
      .setDescription('Herhangi bir sorununuz veya şikayetiniz için aşağıdaki butona tıklayarak yetkili ekibimizle özel görüşme başlatabilirsiniz.')
      .setColor('#00CEC9');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('create_ticket_v3').setLabel('Bilet Aç').setEmoji('🎫').setStyle(ButtonStyle.Success)
    );
    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  }

  // E. EKSİKSİZ DEV SUNUCU KURULUMU (!sunucukur)
  if (command === 'sunucukur') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const statusMsg = await message.channel.send('⏳ **VIP Sunucu Altyapısı İnşa Ediliyor... (Discord engeline takılmamak için sırayla kurulur)**');
    const guild = message.guild;

    try {
      // Rol Mimarisi
      const roles = [
        { name: '👑 Sunucu Sahibi', color: '#880000' },
        { name: '🛡️ Yönetim Ekibi', color: '#E74C3C' },
        { name: '⚔️ Moderatör', color: '#2980B9' },
        { name: '🌿 Rehber', color: '#2ECC71' },
        { name: '💎 VIP+', color: '#00CEC9' },
        { name: '🔮 VIP', color: '#6C5CE7' },
        { name: '🎮 Oyuncu', color: '#BDC3C7' }
      ];

      for (const r of roles) {
        if (!guild.roles.cache.some(role => role.name === r.name)) {
          await guild.roles.create({ name: r.name, color: r.color, hoist: true });
          await sleep(800);
        }
      }

      // Kanal Mimarisi
      const structure = [
        {
          category: '📌 ｜ BİLGİLENDİRME',
          channels: [
            { name: '📜・kurallar', type: ChannelType.GuildText },
            { name: '📢・duyurular', type: ChannelType.GuildText },
            { name: '🚪・giris-cikis', type: ChannelType.GuildText }
          ]
        },
        {
          category: '💬 ｜ GENEL MEYDAN',
          channels: [
            { name: '💬・sohbet', type: ChannelType.GuildText },
            { name: '🤖・bot-komut', type: ChannelType.GuildText },
            { name: '📷・gorsel-paylasim', type: ChannelType.GuildText }
          ]
        },
        {
          category: '🎫 ｜ DESTEK MERKEZİ',
          channels: [
            { name: '🎫・destek-olustur', type: ChannelType.GuildText }
          ]
        },
        {
          category: '🔊 ｜ ÖZEL SES ODALARI',
          channels: [
            { name: '➕ Oda Oluştur', type: ChannelType.GuildVoice },
            { name: '🔊・Genel Sohbet #1', type: ChannelType.GuildVoice },
            { name: '🔊・Genel Sohbet #2', type: ChannelType.GuildVoice }
          ]
        }
      ];

      for (const cat of structure) {
        let categoryChannel = guild.channels.cache.find(c => c.name === cat.category && c.type === ChannelType.GuildCategory);
        if (!categoryChannel) {
          categoryChannel = await guild.channels.create({ name: cat.category, type: ChannelType.GuildCategory });
          await sleep(1000);
        }

        for (const ch of cat.channels) {
          if (!guild.channels.cache.some(c => c.name === ch.name)) {
            await guild.channels.create({ name: ch.name, type: ch.type, parent: categoryChannel.id });
            await sleep(1000);
          }
        }
      }

      await statusMsg.edit('✅ **Tüm VIP roller, oto-ses kanalları, bilet altyapısı ve kategoriler kuruldu!**');
    } catch (err) {
      console.error(err);
      statusMsg.edit('⚠️ Kurulum sırasında bir hata oluştu.');
    }
  }
});

// ====================================================
// 4. BİLET (TICKET) İŞLEMLERİ
// ====================================================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'create_ticket_v3') {
    const guild = interaction.guild;
    const user = interaction.user;
    const channelName = `bilet-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    if (guild.channels.cache.some(c => c.name === channelName)) {
      return interaction.reply({ content: '⚠️ Zaten açık bir biletiniz var!', ephemeral: true });
    }

    const parentCat = guild.channels.cache.find(c => c.name.includes('DESTEK') && c.type === ChannelType.GuildCategory);

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: parentCat ? parentCat.id : null,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 Bilet: ${user.username}`)
      .setDescription('Talebinizi detaylıca buraya yazabilirsiniz. Yetkililer kısa sürede dönüş yapacaktır.')
      .setColor('#00CEC9');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('close_ticket_v3').setLabel('Bileti Kapat').setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Biletiniz açıldı: ${ticketChannel}`, ephemeral: true });
  }

  if (interaction.customId === 'close_ticket_v3') {
    await interaction.reply('🔒 Bilet 5 saniye içinde kapatılıyor...');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
});

client.login(TOKEN);
