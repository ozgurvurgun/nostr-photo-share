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
    home: 'Ana',
    search: 'Ara',
    create: 'Ekle',
    profile: 'Profil',
  },

  welcome: {
    createIdentity: 'Yeni kimlik oluştur',
    importNsec: 'Gizli anahtar ile giriş',
    connectBunker: 'Uzak imzalayıcı bağla',
  },

  createIdentity: {
    title: 'Yeni kimlik',
    body: 'Yeni bir kimlik oluşturulur. Gizli anahtarın yalnızca bu cihazda, güvenli alanda saklanır; dışa aktarmadıkça tekrar göremezsin.',
    generate: 'Kimlik oluştur',
    errorTitle: 'Kimlik oluşturulamadı',
  },

  importNsec: {
    title: 'Gizli anahtar ile giriş',
    body: 'Gizli anahtarın uygulamaya girer. Mümkünse uzak imzalayıcı tercih et. Still anahtarı yalnızca bu cihazın güvenli alanında tutar; günlüklerde veya düz metinde saklamaz.',
    securityWarning: 'Güvenlik uyarısı',
    nsecLabel: 'Gizli anahtar',
    nsecPlaceholder: 'nsec1...',
    confirmRisk: 'Güvenlik riskini anladığımı onaylıyorum.',
    confirmAcknowledged: 'Risk onaylandı',
    confirmRequired: 'İçe aktarmadan önce güvenlik riskini onayla.',
    import: 'Giriş yap',
    errorTitle: 'Giriş başarısız',
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
  },

  search: {
    title: 'Ara',
    subtitle: 'Profil adresi veya genel anahtar ile profil aç',
    placeholder: 'npub1... veya genel anahtar',
    openProfile: 'Profili aç',
    invalid: 'Geçerli bir profil adresi veya 64 karakterlik genel anahtar gir.',
    explore: 'Keşfet',
    exploreEmptyTitle: 'Henüz keşfedilecek fotoğraf yok',
    exploreEmptyMessage: 'Ağdaki genel fotoğraflar burada görünür.',
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
    you: 'Sen',
    storiesA11y: '{{label}} hikayeleri{{unseen}}',
    unseenSuffix: ', görülmemiş',
    seenSuffix: ', görüldü',
  },

  comments: {
    title: 'Yorumlar',
    loadFailed: 'Yorumlar yüklenemedi',
    emptyTitle: 'Henüz yorum yok',
    emptyMessage: 'Bu fotoğrafa ilk yorumu sen bırak.',
    placeholder: 'Yorum yaz',
    post: 'Yorumu gönder',
    postFailed: 'Yorum gönderilemedi. Tekrar dene.',
    replyTo: '{{short}} kişisine yanıt...',
    replyHint: 'Yanıtlamak için uzun bas',
    cancelReply: 'İptal',
  },

  account: {
    title: 'Hesap',
    method: 'Giriş: {{method}}',
    uploadImage: 'Görsel yükle',
    relays: 'Bağlantı sunucuları',
    logout: 'Çıkış yap',
    logoutFailed: 'Çıkış başarısız',
  },

  profile: {
    title: 'Profil',
    edit: 'Profili düzenle',
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
    postsStat: 'gönderi',
    gridTitle: 'Gönderiler',
    gridEmptyTitle: 'Henüz gönderi yok',
    gridEmptySelf: 'İlk fotoğrafını paylaşmak için Ekle sekmesini kullan.',
    gridEmptyOther: 'Bu kişinin henüz fotoğraf gönderisi yok.',
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
