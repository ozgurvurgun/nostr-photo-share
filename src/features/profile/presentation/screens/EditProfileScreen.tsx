import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {ImageStyle as FastImageStyle} from '@d11/react-native-fast-image';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {copyToClipboard} from '../../../../shared/clipboard';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {HelpModal} from '../../../../shared/ui/HelpModal';
import {Icon} from '../../../../shared/ui/Icon';
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {TextField} from '../../../../shared/ui/TextField';
import {useToast} from '../../../../shared/ui/Toast';
import {useProfile, useUpdateProfile} from '../hooks/useProfile';

export type EditProfileScreenProps = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

function truncateNpub(npub: string): string {
  if (npub.length <= 14) {
    return npub;
  }
  return `${npub.slice(0, 6)}...${npub.slice(-4)}`;
}

export function EditProfileScreen({
  navigation,
  route,
}: EditProfileScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );
  const container = useAppContainer();
  const {identity} = useAuthSession();
  const pubkeyHex = identity?.publicKey.toHex() ?? '';
  const profileQuery = useProfile(pubkeyHex.length > 0 ? pubkeyHex : undefined);
  const updateProfile = useUpdateProfile();
  const toast = useToast();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('');
  const [picture, setPicture] = useState('');
  const [nip05, setNip05] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [showNip05Help, setShowNip05Help] = useState(false);
  const [copied, setCopied] = useState(false);

  const npub = useMemo(() => {
    if (!identity) {
      return '';
    }
    const encoded = container.nip19.encodeNpub(identity.publicKey.toHex());
    return encoded.ok ? encoded.value : identity.publicKey.toHex();
  }, [container.nip19, identity]);

  useEffect(() => {
    if (hydrated || !profileQuery.data) {
      return;
    }
    setName(profileQuery.data.name);
    setDisplayName(profileQuery.data.displayName);
    setAbout(profileQuery.data.about);
    setPicture(profileQuery.data.picture);
    setNip05(profileQuery.data.nip05 ?? '');
    setHydrated(true);
  }, [hydrated, profileQuery.data]);

  useEffect(() => {
    const pictureUrl = route.params?.pictureUrl;
    if (pictureUrl && pictureUrl.trim().length > 0) {
      setPicture(pictureUrl.trim());
    }
  }, [route.params?.pictureUrl]);

  async function onSave(): Promise<void> {
    try {
      await updateProfile.mutateAsync({
        name,
        displayName,
        about,
        picture,
        nip05,
        website: profileQuery.data?.website ?? '',
        banner: profileQuery.data?.banner ?? '',
      });
      StillHaptics.save();
      toast.show(t('common.saved'), {tone: 'success'});
      navigation.navigate('Profile', {pubkeyHex});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('editProfile.saveFailed');
      toast.show(message, {tone: 'error'});
    }
  }

  const saveError =
    updateProfile.error instanceof Error ? updateProfile.error.message : null;
  const photoLabel =
    displayName.trim() || name.trim() || t('profile.unnamed');
  const pictureUri = picture.trim();
  const usernameValue = name.startsWith('@') ? name : name.length > 0 ? `@${name}` : '';

  return (
    <KeyboardScreen style={styles.root}>
      <ScreenHeader
        title={t('editProfile.title')}
        onBack={() => navigation.goBack()}
        rightIcon="check"
        rightLabel={t('editProfile.save')}
        onRightPress={() => {
          onSave().catch(() => undefined);
        }}
        rightDisabled={updateProfile.isPending}
        rightLoading={updateProfile.isPending}
        displayTitle
        border={false}
      />

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.avatarBlock}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('editProfile.uploadAvatar')}
            onPress={() => navigation.navigate('MediaUpload', {purpose: 'avatar'})}
            style={({pressed}) => (pressed ? styles.pressed : null)}>
            <View style={styles.avatarRing}>
              {pictureUri.length > 0 ? (
                <CachedImage
                  uri={pictureUri}
                  accessibilityLabel={t('profile.avatarA11y', {label: photoLabel})}
                  style={styles.avatarImage}
                  containerStyle={styles.avatarContainer}
                />
              ) : (
                <View
                  accessibilityLabel={t('profile.avatarPlaceholderA11y')}
                  style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {(photoLabel.slice(0, 1) || '?').toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Icon name="camera" size={16} color={theme.colors.accent.onAccent} />
              </View>
            </View>
          </Pressable>
        </View>

        <TextField
          label={t('editProfile.displayName')}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('brand')}
        />
        <TextField
          label={t('editProfile.name')}
          autoCapitalize="none"
          autoCorrect={false}
          value={usernameValue}
          onChangeText={text => setName(text.replace(/^@+/, ''))}
          placeholder="@still"
        />
        <TextField
          label={t('editProfile.about')}
          value={about}
          onChangeText={setAbout}
          placeholder={t('editProfile.aboutPlaceholder')}
          multiline
          style={styles.aboutField}
        />

        {npub.length > 0 ? (
          <View style={styles.npubCard}>
            <View style={styles.npubIcon}>
              <Icon name="key" size={20} color={theme.colors.accent.primary} />
            </View>
            <View style={styles.npubText}>
              <Text style={styles.npubTitle}>{t('editProfile.publicKey')}</Text>
              <Text numberOfLines={1} style={styles.npubValue}>
                {truncateNpub(npub)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('editProfile.copyPublicKey')}
              onPress={() => {
                if (copyToClipboard(npub)) {
                  setCopied(true);
                  StillHaptics.selection();
                  toast.show(t('common.copied'), {tone: 'success'});
                }
              }}
              hitSlop={theme.layout.hitSlop}
              style={({pressed}) => (pressed ? styles.pressed : null)}>
              <Icon
                name={copied ? 'check' : 'copy'}
                size={20}
                color={theme.colors.accent.primary}
              />
            </Pressable>
          </View>
        ) : null}

        <TextField
          label={t('editProfile.nip05')}
          autoCapitalize="none"
          autoCorrect={false}
          value={nip05}
          onChangeText={setNip05}
          placeholder={t('editProfile.nip05Placeholder')}
          onHelpPress={() => setShowNip05Help(true)}
        />

        {saveError ? (
          <ErrorState
            title={t('editProfile.saveFailed')}
            message={saveError}
            onRetry={() => {
              onSave().catch(() => undefined);
            }}
          />
        ) : null}
      </ScrollView>

      <HelpModal
        visible={showNip05Help}
        title={t('editProfile.nip05HelpTitle')}
        body={t('editProfile.nip05HelpBody')}
        onClose={() => setShowNip05Help(false)}
      />
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
      paddingBottom: insetBottom + theme.spacing.lg,
      gap: theme.spacing.md,
    },
    avatarBlock: {
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    avatarRing: {
      width: 112,
      height: 112,
      borderRadius: theme.radius.full,
      borderWidth: 2,
      borderColor: theme.colors.accent.primary,
      padding: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarContainer: {
      width: '100%',
      height: '100%',
      borderRadius: theme.radius.full,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    } as FastImageStyle,
    avatarFallback: {
      width: '100%',
      height: '100%',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.title.fontSize,
      fontWeight: '700',
    },
    cameraBadge: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      width: 34,
      height: 34,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: theme.colors.background.primary,
    },
    aboutField: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    npubCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
    },
    npubIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(200, 146, 42, 0.12)',
    },
    npubText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    npubTitle: {
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    npubValue: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
