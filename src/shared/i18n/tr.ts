/**
 * Turkish UI copy for Still (tr-TR). English can be added later as another locale file.
 */
export const tr = {
  brand: 'Still',
  brandTagline: 'Fotoğraflar, sakin kalsın. Kendi kimliğinle giriş yap.',

  common: {
    back: 'Geri',
    cancel: 'İptal',
    close: 'Kapat',
    save: 'Kaydet',
    retry: 'Yeniden dene',
    loading: 'Yükleniyor...',
    unknownError: 'Bilinmeyen hata',
    offline:
      'Çevrimdışı görünüyorsun. Varsa önbellekteki içerik gösteriliyor.',
    offlineStaleSuffix: '(güncel olmayabilir)',
    helpA11y: '{{topic}} hakkında bilgi',
    stepOf: 'Adım {{current}} / {{total}}',
    uploadingPercent: 'Yükleniyor... {{percent}}%',
  },

  tabs: {
    home: 'Ana sayfa',
    search: 'Keşfet',
    create: 'Ekle',
    activity: 'Aktivite',
    profile: 'Profil',
  },

  welcome: {
    createIdentity: 'Yeni kimlik oluştur',
    importNsec: 'Gizli anahtar ile giriş',
    connectBunker: 'Uzak imzalayıcı bağla',
    skip: 'Atla',
    start: 'Başla',
    continue: 'Devam et',
    createAccount: 'Hesabını oluştur',
    hasAccount: 'Zaten hesabın var mı?',
    signIn: 'Giriş yap',
    slide1Eyebrow: 'Still, yeniden tasarlandı',
    slide1Title: 'Kendin ol\nKendi ağında.',
    slide1Body:
      'Merkeziyetsiz sosyal deneyimin en güzel hali.\nPaylaş, keşfet ve bağlantılarını kendin yönet.',
    slide2Eyebrow: 'Özgürce paylaş',
    slide2Title: 'Sesin,\nsana ait.',
    slide2Body:
      'Nostr ile içeriklerin tek bir platforma bağlı değil.\nFikrin nerede olursa olsun seninle.',
    slide3Eyebrow: 'Hazır mısın?',
    slide3Title: 'Yeni sosyal\ndünyana hoş geldin.',
    slide3Body:
      'Kimliğini oluştur, arkadaşlarını bul ve akışına\nkendi rengini kat.',
    slideA11y: 'Tanıtım, sayfa {{current}} / {{total}}',
  },

  createIdentity: {
    title: 'Yeni kimlik',
    body: 'Yeni bir kimlik oluşturulur. Gizli anahtarın yalnızca bu cihazda, güvenli alanda saklanır; dışa aktarmadıkça tekrar göremezsin.',
    generate: 'Kimlik oluştur',
    errorTitle: 'Kimlik oluşturulamadı',
    eyebrow: 'Nostr kimliği',
    stepOf: '{{current}}/{{total}}',
    step1Title: 'Kimliğini oluştur',
    step1Body:
      "Still'de hesabın bir e-posta değil, sana ait bir Nostr kimliğidir.",
    displayName: 'Görünen ad',
    username: 'Kullanıcı adı',
    continue: 'Devam et',
    step2Title: 'Profilini hazırla',
    step2Body: 'İnsanların seni tanıması için birkaç küçük dokunuş ekle.',
    addPhoto: 'Fotoğraf ekle',
    about: 'Biyografi',
    aboutPlaceholder: 'Seni anlatan kısa bir cümle...',
    interestsHint: 'İlgi alanlarını daha sonra da düzenleyebilirsin.',
    step3Title: 'Anahtarını güvene al',
    step3Body:
      'Gizli anahtarın hesabının tek giriş yoludur.\nKaybedersen geri alamazsın.',
    secretReady: 'Gizli anahtarın oluşturuldu',
    copySecret: 'Gizli anahtarı kopyala',
    copied: 'Kopyalandı',
    confirmBackup: 'Yedeklemeyi onayla',
    confirmBackupHint: 'Gizli anahtarı güvenli bir yere kaydettim.',
    confirmKey: 'Anahtarımı onayladım',
    neverAsk: 'Still ekibin gizli anahtarını asla istemez.',
    revealSecret: 'Gizli anahtarı göster',
    hideSecret: 'Gizli anahtarı gizle',
    backupRequired: 'Devam etmeden önce yedeklemeyi onayla.',
    step4Title: "Relay'lerini seç",
    step4Body:
      'Paylaşımlarının dağıtılacağı güvenilir ağ noktalarını belirle.',
    customRelay: 'Özel relay adresi',
    relayDamus: "Genel amaçlı",
    relayNos: 'Hızlı ve güvenilir',
    relayPrimal: "Topluluk relay'i",
    step5Title: "Still'e hoş geldin",
    step5Body:
      'Kimliğin hazır. Şimdi keşfetmeye ve bağlantı kurmaya başlayabilirsin.',
    readyToPublish: '{{name}} kimliğinle yayın yapmaya hazırsın.',
    checkKey: 'Anahtar hazır',
    checkRelays: '{{count}} relay bağlı',
    checkTips: 'Öneriler hazır',
    goFeed: 'Akışa git',
    needName: 'Görünen ad gerekli',
    needRelay: 'En az bir relay seç',
  },

  importNsec: {
    title: 'Gizli anahtar ile giriş',
    body: 'Gizli anahtarın uygulamaya girer. Mümkünse uzak imzalayıcı tercih et. Still anahtarı yalnızca bu cihazın güvenli alanında tutar; günlüklerde veya düz metinde saklamaz.',
    securityWarning: 'Güvenlik uyarısı',
    nsecLabel: 'Nostr anahtarın',
    nsecPlaceholder: 'nsec1... veya npub1...',
    confirmRisk: 'Güvenlik riskini anladığımı onaylıyorum.',
    confirmAcknowledged: 'Risk onaylandı',
    confirmRequired: 'İçe aktarmadan önce güvenlik riskini onayla.',
    import: 'Giriş yap',
    errorTitle: 'Giriş başarısız',
    eyebrow: "Still'e geri dön",
    heading: 'Tekrar\nhoş geldin.',
    subtitle:
      'Nostr kimliğinle giriş yap. E-posta veya şifreye ihtiyacın yok.',
    showKey: 'Anahtarı göster',
    hideKey: 'Anahtarı gizle',
    relayLabel: 'Bağlanılacak relay',
    relayPlaceholder: 'relay.damus.io',
    staysOnDevice: 'Anahtarın cihazda kalır',
    staysOnDeviceHint: 'Still gizli anahtarını sunucuna göndermez.',
    forgotKey: 'Anahtarını mı unuttun?',
    securityGuide: 'Güvenlik rehberine bak',
    securityGuideTitle: 'Güvenlik rehberi',
    securityGuideBody:
      'Gizli anahtarın (nsec) hesabının tek girişi. Still bu anahtarı yalnızca bu cihazın güvenli alanında tutar; sunucuya göndermez. Kaybedersen hesabı geri alamazsın. Yedeklerini çevrimdışı ve güvende sakla.',
  },

  bunker: {
    title: 'Uzak imzalayıcı bağla',
    body: 'Uzak imzalayıcı bağlantısı ile giriş yap. Ana gizli anahtarın dışarıda kalır; Still yalnızca oturum bilgisini bu cihazda tutar.',
    uriLabel: 'Bağlantı adresi',
    uriPlaceholder: 'bunker://...',
    connect: 'Bağlan',
    approveTitle: 'Bağlantıyı onayla',
    approveHint:
      'Onay sayfası açıldı. Bir şey görünmediyse imzalayıcı uygulamasından manuel aç.',
    errorTitle: 'Bağlantı başarısız',
  },

  session: {
    restoreFailed: 'Oturum geri yüklenemedi',
    clearAndContinue: 'Oturumu temizle ve devam et',
  },

  feed: {
    storiesUnavailable: 'Hikayeler yüklenemedi',
    storiesUnavailableFallback: 'Hikayeler alınamadı',
    feedUpdateFailed: 'Akış güncellenemedi',
    feedUpdateFailedFallback: 'Yenilenemedi',
    loadFailed: 'Akış yüklenemedi',
    emptyTitle: 'Henüz fotoğraf yok',
    emptyFollows:
      'Takip ettiklerinden yeni fotoğraf yok. Gönderi paylaş veya daha fazla kişi takip et.',
    emptyGlobal:
      'Gönderi paylaş veya profillerinden insanları takip ederek akışını şekillendir.',
    createPost: 'Gönderi oluştur',
    globalHint:
      'Genel fotoğraflar gösteriliyor. Akışı kişiselleştirmek için profillerinden insanları takip et.',
    imageUnavailable: 'Görsel yok',
    like: 'Beğen',
    liked: 'Beğenildi',
    likeCountA11y: '{{count}} beğeni',
    comment: 'Yorum',
    commentCountA11y: '{{count}} yorum',
    share: 'Paylaş',
    shareFailed: 'Paylaşılamadı',
    save: 'Kaydet',
    saved: 'Kaydedildi',
    authorA11y: 'Yazar {{short}}',
    doubleTapLikeA11y: 'Beğenmek için iki kez dokun',
    gridCellA11y: 'Gönderi',
    timeSec: '{{count}}sn',
    timeMin: '{{count}}dk',
    timeHour: '{{count}}sa',
    timeDay: '{{count}}g',
    timeWeek: '{{count}}h',
    timeSecLong: '{{count}} saniye önce',
    timeMinLong: '{{count}} dakika önce',
    timeHourLong: '{{count}} saat önce',
    timeDayLong: '{{count}} gün önce',
    timeWeekLong: '{{count}} hafta önce',
    likesLabel: '{{count}} beğeni',
    forYou: 'Senin için',
    following: 'Takip ettiklerin',
    searchA11y: 'Ara',
    messagesA11y: 'Mesajlar',
    moreA11y: 'Daha fazla',
    followingEmptyTitle: 'Henüz kimseyi takip etmiyorsun',
    followingEmptyMessage:
      'Profillerinden insanları takip et; gönderileri burada görünsün.',
  },

  messages: {
    title: 'Mesajlar',
    emptyTitle: 'Mesajlar yakında',
    emptyMessage: 'Doğrudan mesajlar henüz hazır değil.',
  },

  activity: {
    title: 'Aktiviteler',
    markAllRead: 'Tümünü okundu olarak işaretle',
    newCount: '{{count}} yeni aktivite',
    tabAll: 'Tümü',
    tabMentions: 'Bahsetmeler',
    emptyTitle: 'Henüz aktivite yok',
    emptyMessage: 'Beğeniler, yorumlar ve yeni takipler burada görünecek.',
    emptyMentionsTitle: 'Henüz bahsetme yok',
    emptyMentionsMessage: 'Birisi seni etiketlediğinde burada görünecek.',
  },

  search: {
    title: 'Keşfet',
    lookupTitle: 'Arama',
    subtitle: 'Profil adresi veya genel anahtar ile profil aç',
    placeholder: 'ilgi alanlarını keşfet',
    lookupPlaceholder: 'Kişi, konu veya etiket ara',
    openProfile: 'Profili aç',
    invalid: 'Geçerli bir profil adresi veya 64 karakterlik genel anahtar gir.',
    explore: 'Keşfet',
    exploreEmptyTitle: 'Henüz keşfedilecek fotoğraf yok',
    exploreEmptyMessage: 'Ağdaki genel fotoğraflar burada görünür.',
    trends: 'Trend konular',
    postsCount: '{{count}} paylaşım',
    catAll: 'Tümü',
    catPhoto: 'Fotoğraf',
    catArt: 'Sanat',
    catTech: 'Teknoloji',
    settingsA11y: 'Ayarlar',
  },

  createPost: {
    title: 'Yeni gönderi',
    body: 'Galeriden bir görsel seç; ardından açıklama yazıp paylaş.',
    chooseImage: 'Galeriden seç',
    replaceImage: 'Görseli değiştir',
    titleLabel: 'Başlık (isteğe bağlı)',
    titlePlaceholder: 'Kısa başlık',
    titleOptionalPlaceholder: 'Boş bırakırsan açıklamadan üretilir',
    captionLabel: 'Açıklama',
    captionPlaceholder: 'Bir şeyler yaz...',
    publish: 'Paylaş',
    uploadFailed: 'Yükleme başarısız',
    publishFailed: 'Yayınlanamadı',
    needImage: 'Yayınlamadan önce bir görsel yükle',
    needTitle: 'Başlık gerekli',
    titleTooLong: 'Başlık en fazla {{max}} karakter olabilir',
    captionTooLong: 'Açıklama en fazla {{max}} karakter olabilir',
    previewA11y: 'Seçilen görsel önizlemesi',
    uploading: 'Yükleniyor... {{percent}}%',
    stepPick: 'Yeni fotoğraf',
    stepShare: 'Paylaş',
    next: 'İleri',
    backToPhoto: 'Fotoğrafa dön',
    defaultTitle: 'Fotoğraf',
    pickPlaceholder: 'Fotoğraf seçmek için dokun',
  },

  createStory: {
    title: 'Yeni hikaye',
    body: 'Galeriden bir görsel seç; 24 saat sonra süresi dolacak.',
    chooseImage: 'Galeriden seç',
    replaceImage: 'Görseli değiştir',
    captionLabel: 'Açıklama',
    captionPlaceholder: 'Bir şeyler yaz...',
    share: 'Paylaş',
    uploadFailed: 'Yükleme başarısız',
    publishFailed: 'Yayınlanamadı',
    needImage: 'Yayınlamadan önce bir görsel yükle',
    captionTooLong: 'Açıklama en fazla {{max}} karakter olabilir',
    previewA11y: 'Seçilen hikaye görseli',
    uploading: 'Yükleniyor... {{percent}}%',
    stepPick: 'Yeni hikaye',
    stepShare: 'Paylaş',
    next: 'İleri',
    backToPhoto: 'Fotoğrafa dön',
    expiryHint: 'Bu hikaye 24 saat sonra otomatik olarak kaybolur.',
    pickPlaceholder: 'Hikaye görseli seçmek için dokun',
  },

  storyViewer: {
    loadFailed: 'Hikayeler yüklenemedi',
    emptyTitle: 'Aktif hikaye yok',
    emptyMessage: 'Bu kişinin hikayelerinin süresi dolmuş olabilir.',
    closeA11y: 'Hikaye görüntüleyiciyi kapat',
    prevA11y: 'Önceki hikaye',
    nextA11y: 'Sonraki hikaye',
    prevAuthorA11y: 'Önceki kullanıcının hikayeleri',
    nextAuthorA11y: 'Sonraki kullanıcının hikayeleri',
    pauseA11y: 'Hikayeyi duraklat',
    imageFallback: 'Hikaye görseli',
  },

  storyRing: {
    createA11y: 'Hikaye oluştur',
    yourStory: 'Hikâyen',
    you: 'Senin',
    storiesA11y: '{{label}} hikayeleri{{unseen}}',
    unseenSuffix: ', görülmemiş',
    seenSuffix: ', görüldü',
  },

  comments: {
    title: 'Yorumlar',
    postTitle: 'Paylaşım',
    sectionTitle: 'Yorumlar',
    loadFailed: 'Yorumlar yüklenemedi',
    emptyTitle: 'Henüz yorum yok',
    emptyMessage: 'Bu fotoğrafa ilk yorumu sen bırak.',
    placeholder: 'Yorum ekle...',
    post: 'Yorumu gönder',
    postFailed: 'Yorum gönderilemedi. Tekrar dene.',
    replyTo: '{{short}} kişisine yanıt...',
    replyHint: 'Yanıtlamak için dokun',
    replyAction: 'Yanıtla',
    cancelReply: 'İptal',
    shareA11y: 'Paylaşımı paylaş',
  },

  account: {
    title: 'Ayarlar',
    method: 'Giriş: {{method}}',
    profileAndAccount: 'Profil ve hesap',
    relays: 'Relay bağlantıları',
    security: 'Güvenlik ve anahtarlar',
    privacy: 'Gizlilik',
    accountSection: 'Hesap',
    notifications: 'Bildirimler',
    uploadImage: 'Görsel yükle',
    logout: 'Oturumu kapat',
    logoutFailed: 'Çıkış başarısız',
    securityTitle: 'Güvenlik ve anahtarlar',
    securityBody:
      'Gizli anahtarın (nsec) hesabının tek girişi. Still bu anahtarı yalnızca bu cihazın güvenli alanında tutar; sunucuya göndermez. Kaybedersen hesabı geri alamazsın. Yedeklerini çevrimdışı ve güvende sakla.',
  },

  profile: {
    title: 'Profil',
    edit: 'Düzenle',
    create: 'Profil oluştur',
    follow: 'Takip et',
    following: 'Takip ediliyor',
    unfollow: 'Takibi bırak',
    unnamed: 'İsimsiz',
    loadFailed: 'Profil yüklenemedi',
    followFailed: 'Takip güncellenemedi. Tekrar dene.',
    loadingA11y: 'Profil yükleniyor',
    avatarA11y: '{{label}} profil fotoğrafı',
    avatarPlaceholderA11y: 'Profil fotoğrafı yok',
    emptyTitle: 'Profil boş',
    emptySelf:
      'Kimliğin hazır. Tanıtmak için isim soyisim, kullanıcı adı, biyografi veya profil fotoğrafı ekle.',
    emptyOther: 'Bu kişi henüz bir profil yayınlamadı.',
    nip05Verified: 'Doğrulandı',
    nip05Failed: 'Doğrulanamadı',
    nip05Unverified: 'Doğrulama bekleniyor',
    verifiedUsername: 'Doğrulanmış kullanıcı adı',
    postsStat: 'Paylaşım',
    followersStat: 'Takipçi',
    followingStat: 'Takip',
    gridTitle: 'Gönderiler',
    gridEmptyTitle: 'Henüz gönderi yok',
    gridEmptySelf: 'İlk fotoğrafını paylaşmak için Ekle sekmesini kullan.',
    gridEmptyOther: 'Bu kişinin henüz fotoğraf gönderisi yok.',
    savedEmptyTitle: 'Kaydedilen yok',
    savedEmptyMessage: 'Beğendiğin gönderileri kaydet, burada görünsün.',
    taggedEmptyTitle: 'Etiketlenen yok',
    taggedEmptyMessage: 'Bu kişi henüz bir fotoğrafta etiketlenmedi.',
    shareProfile: 'Profili paylaş',
    shareFailed: 'Paylaşılamadı',
    messageA11y: 'Mesaj gönder',
    moreA11y: 'Daha fazla',
  },

  editProfile: {
    title: 'Profili düzenle',
    body: 'İsim soyisim herkese görünür. Kullanıcı adı @ile gösterilir. İstersen doğrulanmış kullanıcı adı ekleyebilirsin.',
    displayName: 'İsim soyisim',
    name: 'Kullanıcı adı',
    about: 'Hakkında',
    picture: 'Profil fotoğrafı bağlantısı',
    nip05: 'Doğrulanmış kullanıcı adı',
    nip05Placeholder: 'isim@ornek.com',
    nip05HelpTitle: 'Doğrulanmış kullanıcı adı nedir?',
    nip05HelpBody:
      'Doğrulanmış kullanıcı adı, e-posta gibi görünen bir adrestir (örnek: isim@ornek.com).\n\nBu adresin ait olduğu site senin genel anahtarını yayınlar. Böylece herkes bu adın gerçekten sana ait olduğunu kontrol edebilir.\n\nBu bir giriş yöntemi değildir - yalnızca kimliğini tanınır ve güvenilir hale getirir.\n\nNasıl alınır?\n1. Bir alan adı veya topluluk hizmeti üzerinden doğrulanmış kullanıcı adı iste (ör. nostr.org.tr gibi topluluklar).\n2. Sana verilen adresi (isim@alanadi.com) buraya yaz.\n3. Kaydet; Still adresin doğru eşleşip eşleşmediğini kontrol eder.',
    save: 'Kaydet',
    uploadAvatar: 'Profil fotoğrafı yükle',
    saveFailed: 'Kaydedilemedi',
  },

  mediaUpload: {
    titleAvatar: 'Profil fotoğrafı',
    titleImage: 'Görsel yükle',
    choosePhoto: 'Fotoğraf seç',
    uploadAnother: 'Başka yükle',
    useAsAvatar: 'Profil fotoğrafı olarak kullan',
    uploadFailed: 'Yükleme başarısız',
    uploadComplete: 'Yükleme tamam',
    body: 'JPEG, PNG veya WebP, en fazla 10 MiB.',
    previewA11y: 'Seçilen görsel önizlemesi',
    uploading: 'Yükleniyor... {{percent}}%',
    openViewerA11y: 'Tam ekran görüntüle',
    stepPick: 'Seç',
    stepUpload: 'Yükle',
    stepDone: 'Tamam',
    pickPlaceholder: 'Fotoğraf seçmek için dokun',
  },

  mediaViewer: {
    zoomA11y: 'Yakınlaştırmak için sıkıştır, hareket ettirmek için sürükle',
    closeA11y: 'Görüntüleyiciyi kapat',
  },

  relays: {
    title: 'Bağlantı sunucuları',
    body: 'Okuma ve yazma için yaklaşık {{min}}-{{max}} sunucu tut. Yayınlarken yazma listesi tercih edilir.',
    loadFailed: 'Sunucular yüklenemedi',
    emptyTitle: 'Henüz sunucu yok',
    emptyMessage: 'Başlamak için bir sunucu adresi ekle.',
    offlineBanner:
      'Bağlı sunucu yok. Listeyi yine düzenleyebilirsin; yayın için bağlantı gerekir.',
    alreadyInList: 'Bu sunucu zaten listede',
    publishFailed: 'Sunucu listesi kaydedilemedi',
    errorTitle: 'Sunucu listesi hatası',
    addLabel: 'Sunucu adresi ekle',
    addPlaceholder: 'wss://ornek.com',
    add: 'Sunucu ekle',
    savePublish: 'Kaydet ve yayınla',
    read: 'Oku',
    write: 'Yaz',
    remove: 'Kaldır',
    statusConnected: 'bağlı',
    statusReconnecting: 'yeniden bağlanıyor',
    statusOffline: 'çevrimdışı',
    flagOn: 'açık',
    flagOff: 'kapalı',
  },
} as const;

export type TrStrings = typeof tr;

type NestedValue = string | {[key: string]: NestedValue};

function lookup(path: string): string | undefined {
  const parts = path.split('.');
  let node: NestedValue | undefined = tr as unknown as NestedValue;
  for (const part of parts) {
    if (node === undefined || typeof node === 'string') {
      return undefined;
    }
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Interpolate `{{key}}` placeholders. */
export function t(
  path: string,
  vars?: Readonly<Record<string, string | number>>,
): string {
  const template = lookup(path) ?? path;
  if (!vars) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined ? `{{${key}}}` : String(value);
  });
}
