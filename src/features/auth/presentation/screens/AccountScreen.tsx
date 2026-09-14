import React, {useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {ImageStyle as FastImageStyle} from '@d11/react-native-fast-image';
import {useQueryClient} from '@tanstack/react-query';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useLocale} from '../../../../shared/i18n/LocaleProvider';
import {useTheme, useThemePreference} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {SettingsRow} from '../../../../shared/ui/SettingsRow';
import {useToast} from '../../../../shared/ui/Toast';
import {feedQueryKeyRoot} from '../../../feed/presentation/feedQueryKeys';
import {profileQueryKeyRoot} from '../../../profile/presentation/profileQueryKeys';
import {useProfile} from '../../../profile/presentation/hooks/useProfile';
import {socialQueryKeyRoot} from '../../../social/presentation/socialQueryKeys';
import {storyQueryKeyRoot} from '../../../stories/presentation/storyQueryKeys';
import {relayQueryKeyRoot} from '../../../relays/presentation/relayQueryKeys';
import {useAuthSession} from '../hooks/useAuthSession';

export type AccountScreenProps = NativeStackScreenProps<AppStackParamList, 'Account'>;

export function AccountScreen({navigation}: AccountScreenProps): React.JSX.Element {
  const theme = useTheme();
  const {scheme, setScheme} = useThemePreference();
  const {locale, setLocale} = useLocale();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );
  const container = useAppContainer();
  const queryClient = useQueryClient();
  const {identity, setIdentity} = useAuthSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pubkeyHex = identity?.publicKey.toHex() ?? '';
  const profileQuery = useProfile(pubkeyHex.length > 0 ? pubkeyHex : undefined);

  const npub = useMemo(() => {
    if (!identity) {
      return null;
    }
    const encoded = container.nip19.encodeNpub(identity.publicKey.toHex());
    return encoded.ok ? encoded.value : identity.publicKey.toHex();
  }, [container.nip19, identity]);

  async function onLogout(): Promise<void> {
    setLoggingOut(true);
    setError(null);
    const result = await container.logout.execute();
    setLoggingOut(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    queryClient.removeQueries({queryKey: feedQueryKeyRoot});
    queryClient.removeQueries({queryKey: profileQueryKeyRoot});
    queryClient.removeQueries({queryKey: socialQueryKeyRoot});
    queryClient.removeQueries({queryKey: storyQueryKeyRoot});
    queryClient.removeQueries({queryKey: relayQueryKeyRoot});
    setIdentity(null);
  }

  if (!identity) {
    return (
      <View style={styles.root}>
        <ScreenHeader title={t('account.title')} onBack={() => navigation.goBack()} />
        <EmptyState title={t('account.title')} message={t('common.unknownError')} />
      </View>
    );
  }

  const profile = profileQuery.data;
  const displayName =
    profile?.displayName || profile?.name || t('profile.unnamed');
  const handle = profile?.name ? `@${profile.name}` : npub;

  return (
    <View style={styles.root}>
      <ScreenHeader title={t('account.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={displayName}
          onPress={() => navigation.navigate('Profile', {pubkeyHex})}
          style={({pressed}) => [
            styles.profileCard,
            pressed ? styles.pressed : null,
          ]}>
          {profile?.picture ? (
            <View style={styles.avatarRing}>
              <CachedImage
                uri={profile.picture}
                accessibilityLabel={t('profile.avatarA11y', {label: displayName})}
                style={styles.avatarImage}
                containerStyle={styles.avatar}
              />
            </View>
          ) : (
            <View style={[styles.avatarRing, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>
                {(displayName.slice(0, 1) || '?').toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileText}>
            <Text numberOfLines={1} style={styles.profileName}>
              {displayName}
            </Text>
            <Text numberOfLines={1} style={styles.profileHandle}>
              {handle}
            </Text>
          </View>
          <Icon name="chevronRight" size={18} color={theme.colors.text.disabled} />
        </Pressable>

        {error ? (
          <ErrorState
            title={t('account.logoutFailed')}
            message={error}
            onRetry={() => {
              onLogout().catch(() => undefined);
            }}
          />
        ) : null}

        <Text style={styles.section}>{t('account.accountSection')}</Text>
        <View style={styles.group}>
          <SettingsRow
            accent
            icon="user"
            label={t('account.profileAndAccount')}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <View style={styles.divider} />
          <SettingsRow
            accent
            icon="relay"
            label={t('account.relays')}
            onPress={() => navigation.navigate('Relays')}
          />
          <View style={styles.divider} />
          <SettingsRow
            accent
            icon="lock"
            label={t('account.security')}
            onPress={() => navigation.navigate('Security')}
          />
        </View>

        <Text style={styles.section}>{t('account.appearance')}</Text>
        <View style={styles.group}>
          <SettingsRow
            accent
            icon="moon"
            label={t('account.darkMode')}
            detail={
              scheme === 'dark'
                ? t('account.darkModeOn')
                : t('account.darkModeOff')
            }
            switchValue={scheme === 'dark'}
            onSwitchChange={enabled => {
              setScheme(enabled ? 'dark' : 'light');
            }}
          />
          <View style={styles.divider} />
          <SettingsRow
            accent
            icon="globe"
            label={t('account.language')}
            detail={
              locale === 'tr' ? t('account.languageTr') : t('account.languageEn')
            }
            onPress={() => {
              Alert.alert(t('account.languagePickerTitle'), undefined, [
                {
                  text: t('account.languageTr'),
                  onPress: () => {
                    if (locale !== 'tr') {
                      const label = t('account.languageTr');
                      setLocale('tr');
                      toast.show(label, {tone: 'success'});
                    }
                  },
                },
                {
                  text: t('account.languageEn'),
                  onPress: () => {
                    if (locale !== 'en') {
                      const label = t('account.languageEn');
                      setLocale('en');
                      toast.show(label, {tone: 'success'});
                    }
                  },
                },
                {text: t('common.cancel'), style: 'cancel'},
              ]);
            }}
          />
        </View>

        <Text style={styles.section}>{t('account.privacy')}</Text>
        <View style={styles.group}>
          <SettingsRow
            accent
            icon="bell"
            label={t('account.notifications')}
            onPress={() =>
              navigation.navigate('MainTabs', {screen: 'Activity'})
            }
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('account.logout')}
          accessibilityState={{busy: loggingOut, disabled: loggingOut}}
          disabled={loggingOut}
          onPress={() => {
            if (!loggingOut) {
              onLogout().catch(() => undefined);
            }
          }}
          style={({pressed}) => [
            styles.logout,
            pressed || loggingOut ? styles.pressed : null,
          ]}>
          <Icon name="logout" size={18} color={theme.colors.state.error} />
          <Text style={styles.logoutLabel}>
            {loggingOut ? t('common.loading') : t('account.logout')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme, insetBottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingTop: theme.spacing.md,
      paddingBottom: insetBottom + theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    avatarRing: {
      width: 56,
      height: 56,
      borderRadius: theme.radius.full,
      borderWidth: 2,
      borderColor: theme.colors.accent.primary,
      padding: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.full,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    } as FastImageStyle,
    avatarFallback: {
      backgroundColor: theme.colors.background.elevated,
    },
    avatarLetter: {
      color: theme.colors.accent.primary,
      fontWeight: '700',
    },
    profileText: {
      flex: 1,
      minWidth: 0,
    },
    profileName: {
      color: theme.colors.text.primary,
      fontWeight: '700',
      fontSize: theme.typography.heading.fontSize,
    },
    profileHandle: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    section: {
      color: theme.colors.text.disabled,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginTop: theme.spacing.md,
    },
    group: {
      overflow: 'hidden',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border.default,
      marginLeft: theme.spacing.md + 22 + theme.spacing.md,
    },
    logout: {
      marginTop: theme.spacing.lg,
      minHeight: 48,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: 'rgba(229, 115, 115, 0.55)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    logoutLabel: {
      color: theme.colors.state.error,
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
