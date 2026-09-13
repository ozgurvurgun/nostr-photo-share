import React, {useEffect, useState} from 'react';
import {Image, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Button} from '../../../../shared/ui/Button';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {HelpModal} from '../../../../shared/ui/HelpModal';
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

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
      <ScreenHeader
        title={t('editProfile.title')}
        onBack={() => navigation.goBack()}
        rightLabel={t('editProfile.save')}
        onRightPress={() => {
          void onSave();
        }}
        rightDisabled={updateProfile.isPending}
        rightLoading={updateProfile.isPending}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        }}>
        <View style={{alignItems: 'center', gap: theme.spacing.sm}}>
          {picture.trim().length > 0 ? (
            <Image
              accessibilityLabel={t('profile.avatarA11y', {label: photoLabel})}
              source={{uri: picture.trim()}}
              style={{
                width: 96,
                height: 96,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.background.elevated,
              }}
            />
          ) : (
            <View
              accessibilityLabel={t('profile.avatarPlaceholderA11y')}
              style={{
                width: 96,
                height: 96,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.background.elevated,
                borderWidth: 1,
                borderColor: theme.colors.border.default,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.title.fontSize,
                  fontWeight: '700',
                }}>
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

        <Text
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.caption.fontSize,
            lineHeight: theme.typography.caption.lineHeight,
          }}>
          {t('editProfile.body')}
        </Text>

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
          style={{
            minHeight: theme.spacing.xxl + theme.spacing.lg,
            textAlignVertical: 'top',
          }}
        />
        <TextField
          label={t('editProfile.picture')}
          autoCapitalize="none"
          autoCorrect={false}
          value={picture}
          onChangeText={setPicture}
          placeholder="https://"
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
              void onSave();
            }}
          />
        ) : null}

        <Button
          label={t('editProfile.save')}
          loading={updateProfile.isPending}
          onPress={() => void onSave()}
        />
      </ScrollView>

      <HelpModal
        visible={showNip05Help}
        title={t('editProfile.nip05HelpTitle')}
        body={t('editProfile.nip05HelpBody')}
        onClose={() => setShowNip05Help(false)}
      />
    </View>
  );
}
