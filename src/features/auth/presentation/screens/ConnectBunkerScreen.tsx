import React, {useEffect, useState} from 'react';
import {Linking, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AuthStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Button} from '../../../../shared/ui/Button';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {TextField} from '../../../../shared/ui/TextField';
import {useAuthSession} from '../hooks/useAuthSession';

export type ConnectBunkerScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'ConnectBunker'
>;

export function ConnectBunkerScreen({
  navigation,
  route,
}: ConnectBunkerScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const container = useAppContainer();
  const {completeLogin} = useAuthSession();
  const [uri, setUri] = useState(route.params?.uri ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    const next = route.params?.uri;
    if (typeof next === 'string' && next.length > 0) {
      setUri(next);
    }
  }, [route.params?.uri]);

  async function onConnect(): Promise<void> {
    setLoading(true);
    setError(null);
    setAuthUrl(null);
    const result = await container.connectBunker.execute(uri, {
      onAuthUrl: url => {
        setAuthUrl(url);
        void Linking.openURL(url);
      },
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      container.logger.error('Bunker connect failed', {code: result.error.code});
      return;
    }
    await completeLogin(result.value);
  }

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
      <ScreenHeader
        title={t('bunker.title')}
        onBack={() => navigation.goBack()}
        rightLabel={t('bunker.connect')}
        onRightPress={() => {
          void onConnect();
        }}
        rightDisabled={uri.trim().length === 0 || loading}
        rightLoading={loading}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        }}>
        <Text
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
          }}>
          {t('bunker.body')}
        </Text>

        <TextField
          label={t('bunker.uriLabel')}
          value={uri}
          onChangeText={setUri}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t('bunker.uriPlaceholder')}
        />

        {authUrl ? (
          <View
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.background.elevated,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border.default,
              gap: theme.spacing.xs,
            }}>
            <Text
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.heading.fontSize,
                fontWeight: theme.typography.heading.fontWeight,
              }}>
              {t('bunker.approveTitle')}
            </Text>
            <Text
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.caption.fontSize,
                lineHeight: theme.typography.caption.lineHeight,
              }}>
              {t('bunker.approveHint')}
            </Text>
          </View>
        ) : null}

        {error ? (
          <ErrorState title={t('bunker.errorTitle')} message={error} onRetry={onConnect} />
        ) : null}

        <Button
          label={t('bunker.connect')}
          loading={loading}
          disabled={uri.trim().length === 0}
          onPress={onConnect}
        />
      </ScrollView>
    </View>
  );
}
