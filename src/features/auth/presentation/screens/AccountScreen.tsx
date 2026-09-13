import React, {useMemo, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {useQueryClient} from '@tanstack/react-query';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Button} from '../../../../shared/ui/Button';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {feedQueryKeyRoot} from '../../../feed/presentation/feedQueryKeys';
import {profileQueryKeyRoot} from '../../../profile/presentation/profileQueryKeys';
import {socialQueryKeyRoot} from '../../../social/presentation/socialQueryKeys';
import {storyQueryKeyRoot} from '../../../stories/presentation/storyQueryKeys';
import {relayQueryKeyRoot} from '../../../relays/presentation/relayQueryKeys';
import {useAuthSession} from '../hooks/useAuthSession';

export type AccountScreenProps = NativeStackScreenProps<AppStackParamList, 'Account'>;

/** Session / logout shell moved out of the feed home screen. */
export function AccountScreen({navigation}: AccountScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const container = useAppContainer();
  const queryClient = useQueryClient();
  const {identity, setIdentity} = useAuthSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          padding: theme.spacing.screenEdge,
        }}
      />
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
      <ScreenHeader title={t('account.title')} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        }}>
        <View
          style={{
            backgroundColor: theme.colors.background.elevated,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border.default,
            padding: theme.spacing.md,
            gap: theme.spacing.xs,
          }}>
          <Text
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.caption.fontSize,
              fontWeight: '600',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}>
            {t('account.method', {method: identity.authMethod})}
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.caption.fontSize,
              lineHeight: theme.typography.caption.lineHeight,
            }}>
            {npub}
          </Text>
        </View>

        {error ? (
          <ErrorState title={t('account.logoutFailed')} message={error} onRetry={onLogout} />
        ) : null}

        <Button
          label={t('account.uploadImage')}
          variant="secondary"
          onPress={() => navigation.navigate('MediaUpload', {purpose: 'general'})}
        />
        <Button
          label={t('account.relays')}
          variant="secondary"
          onPress={() => navigation.navigate('Relays')}
        />
        <Button
          label={t('account.logout')}
          variant="danger"
          loading={loggingOut}
          onPress={onLogout}
        />
      </ScrollView>
    </View>
  );
}
