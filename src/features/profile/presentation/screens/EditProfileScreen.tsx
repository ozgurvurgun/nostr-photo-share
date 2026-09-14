import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {ImageStyle as FastImageStyle} from '@d11/react-native-fast-image';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Button} from '../../../../shared/ui/Button';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {HelpModal} from '../../../../shared/ui/HelpModal';
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {TextField} from '../../../../shared/ui/TextField';
import {useProfile, useUpdateProfile} from '../hooks/useProfile';

export type EditProfileScreenProps = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

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
  const {identity} = useAuthSession();
  const pubkeyHex = identity?.publicKey.toHex() ?? '';
  const profileQuery = useProfile(pubkeyHex.length > 0 ? pubkeyHex : undefined);
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('');
  const [picture, setPicture] = useState('');
  const [nip05, setNip05] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [showNip05Help, setShowNip05Help] = useState(false);

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
      navigation.navigate('Profile', {pubkeyHex});
    } catch {
      // error rendered via updateProfile.error
    }
  }

  const saveError =
    updateProfile.error instanceof Error ? updateProfile.error.message : null;
  const photoLabel =
    displayName.trim() || name.trim() || t('profile.unnamed');
  const pictureUri = picture.trim();

  return (
    <KeyboardScreen style={styles.root}>
      <ScreenHeader
        title={t('editProfile.title')}
        onBack={() => navigation.goBack()}
        rightLabel={t('editProfile.save')}
        onRightPress={() => {
          onSave().catch(() => undefined);
        }}
        rightDisabled={updateProfile.isPending}
        rightLoading={updateProfile.isPending}
      />

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.avatarBlock}>
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
          <Button
            label={t('editProfile.uploadAvatar')}
            variant="secondary"
            onPress={() => navigation.navigate('MediaUpload', {purpose: 'avatar'})}
          />
        </View>

        <Text style={styles.body}>{t('editProfile.body')}</Text>

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
          value={name}
          onChangeText={setName}
          placeholder="still"
        />
        <TextField
          label={t('editProfile.about')}
          value={about}
          onChangeText={setAbout}
          placeholder={t('editProfile.about')}
          multiline
          style={styles.aboutField}
        />
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
      gap: theme.spacing.sm,
    },
    avatarContainer: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.full,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    } as FastImageStyle,
    avatarFallback: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.title.fontSize,
      fontWeight: '700',
    },
    body: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
    },
    aboutField: {
      minHeight: theme.spacing.xxl + theme.spacing.lg,
      textAlignVertical: 'top',
    },
  });
}
