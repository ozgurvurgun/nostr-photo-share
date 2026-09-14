import React, {useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {ImageStyle as FastImageStyle} from '@d11/react-native-fast-image';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AuthStackParamList} from '../../../../app/navigation/types';
import {bytesToHex, hexToBytes, wipeBytes} from '../../../../core/utilities/hex';
import {copyToClipboard} from '../../../../shared/clipboard';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
import {useToast} from '../../../../shared/ui/Toast';
import type {SelectedImage} from '../../../media-upload/domain/ImageAttachment';
import {useImageUpload} from '../../../media-upload/presentation/hooks/useImageUpload';
import {normalizeRelayUrl} from '../../../relays/domain/RelayUrl';
import {AuthCtaButton} from '../components/AuthCtaButton';
import {AuthScreenGlow} from '../components/AuthScreenGlow';
import {AuthWizardHeader} from '../components/AuthWizardHeader';
import {useAuthSession} from '../hooks/useAuthSession';

export type CreateIdentityScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'CreateIdentity'
>;

const TOTAL_STEPS = 5;

const RELAY_OPTIONS = [
  {
    url: 'wss://relay.damus.io',
    host: 'relay.damus.io',
    blurb: 'createIdentity.relayDamus',
  },
  {
    url: 'wss://nos.lol',
    host: 'nos.lol',
    blurb: 'createIdentity.relayNos',
  },
  {
    url: 'wss://relay.primal.net',
    host: 'relay.primal.net',
    blurb: 'createIdentity.relayPrimal',
  },
] as const;

function suggestUsername(displayName: string): string {
  return displayName
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24);
}

function shortNpub(npub: string): string {
  if (npub.length < 12) {
    return npub;
  }
  return `${npub.slice(0, 5)}...${npub.slice(-4)}`;
}

export function CreateIdentityScreen({
  navigation,
}: CreateIdentityScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );
  const container = useAppContainer();
  const {completeLogin} = useAuthSession();
  const upload = useImageUpload();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [about, setAbout] = useState('');
  const [pictureUrl, setPictureUrl] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<SelectedImage | null>(null);
  const [secretHex, setSecretHex] = useState('');
  const [nsec, setNsec] = useState('');
  const [npub, setNpub] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backupOk, setBackupOk] = useState(false);
  const [selectedRelays, setSelectedRelays] = useState<ReadonlySet<string>>(
    () => new Set([RELAY_OPTIONS[0].url]),
  );
  const [customRelay, setCustomRelay] = useState('');
  const [relayMs, setRelayMs] = useState<Readonly<Record<string, number>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const secret = container.keyGenerator.generateSecretKey();
    const pubkeyHex = container.keyGenerator.getPublicKeyHex(secret);
    const encodedNsec = container.nip19.encodeNsec(secret);
    const encodedNpub = container.nip19.encodeNpub(pubkeyHex);
    setSecretHex(bytesToHex(secret));
    if (encodedNsec.ok) {
      setNsec(encodedNsec.value);
    }
    if (encodedNpub.ok) {
      setNpub(encodedNpub.value);
    }
    wipeBytes(secret);
    return () => {
      setSecretHex('');
      setNsec('');
    };
  }, [container.keyGenerator, container.nip19]);

  useEffect(() => {
    let cancelled = false;
    RELAY_OPTIONS.forEach(option => {
      const started = Date.now();
      const socket = new WebSocket(option.url);
      const finish = (ms: number | null) => {
        try {
          socket.close();
        } catch {
          // already closed
        }
        if (cancelled || ms === null) {
          return;
        }
        setRelayMs(current => ({...current, [option.url]: ms}));
      };
      const timer = setTimeout(() => finish(null), 2500);
      socket.onopen = () => {
        clearTimeout(timer);
        finish(Date.now() - started);
      };
      socket.onerror = () => {
        clearTimeout(timer);
        finish(null);
      };
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const previewName = displayName.trim() || t('profile.unnamed');
  const handle = username.trim() || suggestUsername(displayName);
  const avatarLetter = (previewName.slice(0, 1) || '?').toUpperCase();
  const localPreview = pendingPhoto?.uri ?? pictureUrl;

  function onChangeDisplayName(value: string): void {
    setDisplayName(value);
    if (!usernameTouched) {
      setUsername(suggestUsername(value));
    }
  }

  function toggleRelay(url: string): void {
    StillHaptics.selection();
    setSelectedRelays(current => {
      const next = new Set(current);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  }

  async function persistIdentity(): Promise<boolean> {
    if (container.authRuntime.getIdentity()) {
      return true;
    }
    if (secretHex.length !== 64) {
      setError(t('createIdentity.errorTitle'));
      return false;
    }
    const secret = hexToBytes(secretHex);
    const result = await container.createIdentity.execute(secret);
    wipeBytes(secret);
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    return true;
  }

  async function publishProfile(pictureOverride?: string): Promise<void> {
    const picture = pictureOverride ?? pictureUrl;
    await container.updateProfile.execute({
      name: handle,
      displayName: displayName.trim(),
      about: about.trim(),
      picture,
      nip05: '',
    });
  }

  async function publishRelays(): Promise<boolean> {
    const urls = [...selectedRelays];
    const custom = normalizeRelayUrl(customRelay);
    if (custom.ok && !urls.includes(custom.value)) {
      urls.push(custom.value);
    }
    if (urls.length === 0) {
      setError(t('createIdentity.needRelay'));
      return false;
    }
    const result = await container.updateRelayList.execute({
      preferences: urls.map(url => ({url, read: true, write: true})),
    });
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    return true;
  }

  async function onContinue(): Promise<void> {
    setError(null);
    if (step === 1) {
      if (displayName.trim().length === 0) {
        setError(t('createIdentity.needName'));
        return;
      }
      if (username.trim().length === 0) {
        setError(t('createIdentity.needUsername'));
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!backupOk) {
        setError(t('createIdentity.backupRequired'));
        return;
      }
      setLoading(true);
      const saved = await persistIdentity();
      if (!saved) {
        setLoading(false);
        return;
      }
      let uploadedPicture = pictureUrl;
      if (pendingPhoto) {
        const attached = await upload.uploadSelected(pendingPhoto);
        if (attached) {
          uploadedPicture = attached.url;
          setPictureUrl(attached.url);
        }
      }
      await publishProfile(uploadedPicture).catch(() => undefined);
      setLoading(false);
      setStep(4);
      return;
    }
    if (step === 4) {
      setLoading(true);
      const saved = await persistIdentity();
      if (!saved) {
        setLoading(false);
        return;
      }
      const okRelays = await publishRelays();
      setLoading(false);
      if (!okRelays) {
        return;
      }
      setStep(5);
    }
  }

  async function onFinish(): Promise<void> {
    setLoading(true);
    const saved = await persistIdentity();
    if (!saved) {
      setLoading(false);
      return;
    }
    const identity = container.authRuntime.getIdentity();
    setLoading(false);
    if (identity) {
      await completeLogin(identity);
    }
  }

  async function onAddPhoto(): Promise<void> {
    const picked = await container.imagePicker.pickImage();
    if (!picked.ok || picked.value === null) {
      return;
    }
    setPendingPhoto(picked.value);
  }

  function onCopySecret(): void {
    StillHaptics.selection();
    const ok = nsec.length > 0 && copyToClipboard(nsec);
    setCopied(ok);
    if (ok) {
      toast.show(t('common.copied'), {tone: 'success'});
    } else {
      setRevealed(true);
    }
  }

  function onBack(): void {
    if (step === 1) {
      navigation.goBack();
      return;
    }
    setError(null);
    setStep(current => Math.max(1, current - 1));
  }

  const ctaLabel =
    step === 3
      ? t('createIdentity.confirmKey')
      : step === 5
        ? t('createIdentity.goFeed')
        : t('createIdentity.continue');

  const ctaDisabled = useMemo(() => {
    if (step === 1) {
      return displayName.trim().length === 0 || username.trim().length === 0;
    }
    if (step === 3) {
      return !backupOk;
    }
    if (step === 4) {
      return selectedRelays.size === 0 && customRelay.trim().length === 0;
    }
    return false;
  }, [backupOk, customRelay, displayName, selectedRelays, step, username]);

  return (
    <KeyboardScreen style={styles.root}>
      <AuthScreenGlow />
      <AuthWizardHeader onBack={onBack} step={step} total={TOTAL_STEPS} />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{t('createIdentity.eyebrow')}</Text>
        <Text style={styles.title}>
          {step === 1
            ? t('createIdentity.step1Title')
            : step === 2
              ? t('createIdentity.step2Title')
              : step === 3
                ? t('createIdentity.step3Title')
                : step === 4
                  ? t('createIdentity.step4Title')
                  : t('createIdentity.step5Title')}
        </Text>
        <Text style={styles.body}>
          {step === 1
            ? t('createIdentity.step1Body')
            : step === 2
              ? t('createIdentity.step2Body')
              : step === 3
                ? t('createIdentity.step3Body')
                : step === 4
                  ? t('createIdentity.step4Body')
                  : t('createIdentity.step5Body')}
        </Text>

        {step === 1 ? (
          <View style={styles.block}>
            <Text style={styles.fieldLabel}>{t('createIdentity.displayName')}</Text>
            <TextInput
              value={displayName}
              onChangeText={onChangeDisplayName}
              placeholder={t('createIdentity.displayNamePlaceholder')}
              placeholderTextColor={theme.colors.text.disabled}
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>{t('createIdentity.username')}</Text>
            <TextInput
              value={username}
              onChangeText={value => {
                setUsernameTouched(true);
                setUsername(value.replace(/\s/g, '').toLowerCase());
              }}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t('createIdentity.usernamePlaceholder')}
              placeholderTextColor={theme.colors.text.disabled}
              style={styles.input}
            />
            <View style={styles.previewCard}>
              <View style={styles.previewAvatar}>
                <Icon name="user" size={22} color={theme.colors.accent.primary} />
              </View>
              <View style={styles.previewText}>
                <Text numberOfLines={1} style={styles.previewName}>
                  {previewName}
                </Text>
                <Text numberOfLines={1} style={styles.previewMeta}>
                  {handle} · {shortNpub(npub)}
                </Text>
              </View>
              <Icon name="check" size={20} color={theme.colors.accent.primary} />
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.block}>
            <View style={styles.photoRow}>
              {localPreview.length > 0 ? (
                <CachedImage
                  uri={localPreview}
                  accessibilityLabel={t('profile.avatarA11y', {label: previewName})}
                  style={styles.avatarImage}
                  containerStyle={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('createIdentity.addPhoto')}
                onPress={() => {
                  onAddPhoto().catch(() => undefined);
                }}
                style={({pressed}) => [
                  styles.photoBtn,
                  pressed ? styles.pressed : null,
                ]}>
                <Text style={styles.photoBtnLabel}>{t('createIdentity.addPhoto')}</Text>
                <Icon name="camera" size={16} color={theme.colors.accent.primary} />
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>{t('createIdentity.about')}</Text>
            <TextInput
              value={about}
              onChangeText={setAbout}
              placeholder={t('createIdentity.aboutPlaceholder')}
              placeholderTextColor={theme.colors.text.disabled}
              multiline
              style={[styles.input, styles.aboutInput]}
            />
            <View style={styles.hintCard}>
              <Icon name="sparkle" size={16} color={theme.colors.accent.primary} />
              <Text style={styles.hintText}>{t('createIdentity.interestsHint')}</Text>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.secretCard}>
            <View style={styles.keyBadge}>
              <Icon name="key" size={22} color={theme.colors.accent.primary} />
            </View>
            <Text style={styles.secretReady}>{t('createIdentity.secretReady')}</Text>
            <View style={styles.nsecRow}>
              <Text selectable style={styles.nsecValue} numberOfLines={1}>
                {revealed ? nsec : 'nsec1••••••••••••••••••••••••••••'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  revealed
                    ? t('createIdentity.hideSecret')
                    : t('createIdentity.revealSecret')
                }
                onPress={() => setRevealed(current => !current)}
                style={({pressed}) => [
                  styles.eyeBtn,
                  pressed ? styles.pressed : null,
                ]}>
                <Icon
                  name={revealed ? 'eyeOff' : 'eye'}
                  size={18}
                  color={theme.colors.text.secondary}
                />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('createIdentity.copySecret')}
              onPress={onCopySecret}
              style={({pressed}) => [
                styles.copyBtn,
                copied ? styles.copyBtnDone : null,
                pressed ? styles.pressed : null,
              ]}>
              <Icon
                name="copy"
                size={16}
                color={copied ? theme.colors.state.success : theme.colors.accent.primary}
              />
              <Text style={[styles.copyLabel, copied ? styles.copyLabelDone : null]}>
                {copied ? t('createIdentity.copied') : t('createIdentity.copySecret')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{checked: backupOk}}
              onPress={() => {
                StillHaptics.selection();
                setBackupOk(current => !current);
              }}
              style={({pressed}) => [
                styles.backupRow,
                backupOk ? styles.backupRowOn : null,
                pressed ? styles.pressed : null,
              ]}>
              <View style={[styles.checkbox, backupOk ? styles.checkboxOn : null]}>
                {backupOk ? (
                  <Icon name="check" size={14} color={theme.colors.accent.onAccent} />
                ) : null}
              </View>
              <View style={styles.backupText}>
                <Text style={styles.backupTitle}>{t('createIdentity.confirmBackup')}</Text>
                <Text style={styles.backupHint}>{t('createIdentity.confirmBackupHint')}</Text>
              </View>
            </Pressable>
            <View style={styles.passcodeNote}>
              <Icon name="lock" size={14} color={theme.colors.accent.primary} />
              <Text style={styles.passcodeNoteText}>
                {t('createIdentity.passcodeNextHint')}
              </Text>
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.block}>
            {RELAY_OPTIONS.map(option => {
              const selected = selectedRelays.has(option.url);
              const ms = relayMs[option.url];
              return (
                <Pressable
                  key={option.url}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: selected}}
                  onPress={() => toggleRelay(option.url)}
                  style={({pressed}) => [
                    styles.relayCard,
                    selected ? styles.relayCardOn : null,
                    pressed ? styles.pressed : null,
                  ]}>
                  <View style={styles.relayIcon}>
                    <Icon name="relay" size={18} color={theme.colors.accent.primary} />
                  </View>
                  <View style={styles.relayText}>
                    <Text style={styles.relayHost}>{option.host}</Text>
                    <Text style={styles.relayMeta}>
                      {t(option.blurb)}
                      {ms !== undefined ? ` · ${ms} ms` : ''}
                    </Text>
                  </View>
                  <View style={[styles.radio, selected ? styles.radioOn : null]}>
                    {selected ? (
                      <Icon name="check" size={14} color={theme.colors.accent.primary} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
            <Text style={styles.fieldLabel}>{t('createIdentity.customRelay')}</Text>
            <TextInput
              value={customRelay}
              onChangeText={setCustomRelay}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="relay.damus.io"
              placeholderTextColor={theme.colors.text.disabled}
              style={styles.input}
            />
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.successCard}>
            <View style={styles.successBadge}>
              <Icon name="check" size={28} color={theme.colors.accent.onAccent} />
            </View>
            <Text style={styles.successName}>{handle || previewName}</Text>
            <Text style={styles.successBody}>
              {t('createIdentity.readyToPublish', {name: handle || previewName})}
            </Text>
            <View style={styles.successList}>
              <View style={styles.successRow}>
                <Icon name="key" size={16} color={theme.colors.accent.primary} />
                <Text style={styles.successItem}>{t('createIdentity.checkKey')}</Text>
              </View>
              <View style={styles.successRow}>
                <Icon name="relay" size={16} color={theme.colors.accent.primary} />
                <Text style={styles.successItem}>
                  {t('createIdentity.checkRelays', {count: selectedRelays.size})}
                </Text>
              </View>
              <View style={styles.successRow}>
                <Icon name="user" size={16} color={theme.colors.accent.primary} />
                <Text style={styles.successItem}>{t('createIdentity.checkTips')}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {error ? (
          <ErrorState
            title={t('createIdentity.errorTitle')}
            message={error}
            onRetry={() => {
              setError(null);
              if (step === 5) {
                onFinish().catch(() => undefined);
              } else {
                onContinue().catch(() => undefined);
              }
            }}
          />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <AuthCtaButton
          label={ctaLabel}
          loading={loading}
          disabled={ctaDisabled}
          onPress={() => {
            if (step === 5) {
              onFinish().catch(() => undefined);
              return;
            }
            onContinue().catch(() => undefined);
          }}
        />
        {step === 3 ? (
          <Text style={styles.neverAsk}>{t('createIdentity.neverAsk')}</Text>
        ) : null}
      </View>
    </KeyboardScreen>
  );
}

function createStyles(theme: Theme, insetBottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    eyebrow: {
      color: theme.colors.accent.primary,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
    },
    title: {
      color: theme.colors.text.primary,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    body: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
      marginBottom: theme.spacing.sm,
    },
    block: {
      gap: theme.spacing.sm,
    },
    fieldLabel: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      marginTop: theme.spacing.xs,
    },
    input: {
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.elevated,
      borderColor: theme.colors.border.default,
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.body.fontSize,
      minHeight: 52,
    },
    aboutInput: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    previewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.elevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      padding: theme.spacing.md,
    },
    previewAvatar: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.surface,
    },
    previewText: {
      flex: 1,
      minWidth: 0,
    },
    previewName: {
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    previewMeta: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    photoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: theme.radius.full,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    } as FastImageStyle,
    avatarFallback: {
      width: 84,
      height: 84,
      borderRadius: theme.radius.full,
      borderWidth: 2,
      borderColor: theme.colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.elevated,
    },
    avatarLetter: {
      color: theme.colors.accent.primary,
      fontSize: 28,
      fontWeight: '700',
    },
    photoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.accent.primary,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.md,
      minHeight: 40,
    },
    photoBtnLabel: {
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    hintCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.elevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      padding: theme.spacing.md,
    },
    hintText: {
      flex: 1,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    secretCard: {
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.elevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    keyBadge: {
      width: 52,
      height: 52,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secretReady: {
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    nsecRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.border.default,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      minHeight: 48,
    },
    nsecValue: {
      flex: 1,
      color: theme.colors.text.secondary,
    },
    eyeBtn: {
      padding: theme.spacing.xs,
    },
    copyBtn: {
      width: '100%',
      minHeight: 48,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.accent.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
    },
    copyBtnDone: {
      borderColor: theme.colors.state.success,
      backgroundColor: 'rgba(46, 125, 50, 0.16)',
    },
    copyLabel: {
      color: theme.colors.accent.primary,
      fontWeight: '600',
    },
    copyLabelDone: {
      color: theme.colors.state.success,
    },
    backupRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },
    backupRowOn: {
      borderColor: theme.colors.accent.primary,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: theme.colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: {
      backgroundColor: theme.colors.accent.primary,
      borderColor: theme.colors.accent.primary,
    },
    backupText: {
      flex: 1,
    },
    backupTitle: {
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    backupHint: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    relayCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.elevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      padding: theme.spacing.md,
    },
    relayCardOn: {
      borderColor: theme.colors.accent.primary,
    },
    relayIcon: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.surface,
    },
    relayText: {
      flex: 1,
    },
    relayHost: {
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    relayMeta: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: theme.colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOn: {
      borderColor: theme.colors.accent.primary,
    },
    successCard: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.elevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      padding: theme.spacing.lg,
    },
    successBadge: {
      width: 56,
      height: 56,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successName: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: '700',
    },
    successBody: {
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    successList: {
      width: '100%',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
    },
    successRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    successItem: {
      color: theme.colors.text.primary,
    },
    footer: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingBottom: insetBottom + theme.spacing.md,
      paddingTop: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    neverAsk: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.caption.fontSize,
      textAlign: 'center',
    },
    passcodeNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.xs,
      alignSelf: 'stretch',
      marginTop: theme.spacing.xs,
      paddingTop: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.subtle,
    },
    passcodeNoteText: {
      flex: 1,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.timestamp.fontSize,
      lineHeight: theme.typography.timestamp.lineHeight + 2,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
