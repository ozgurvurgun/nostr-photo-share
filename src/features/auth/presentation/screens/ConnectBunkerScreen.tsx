import React, {useEffect, useMemo, useState} from 'react';
import {Linking, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AuthStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
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
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );
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
        Linking.openURL(url).catch(() => undefined);
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
    <KeyboardScreen style={styles.root}>
      <ScreenHeader
        title={t('bunker.title')}
        onBack={() => navigation.goBack()}
        rightLabel={t('bunker.connect')}
        onRightPress={() => {
          onConnect().catch(() => undefined);
        }}
        rightDisabled={uri.trim().length === 0 || loading}
        rightLoading={loading}
      />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.iconWrap}>
            <Icon name="relay" size={24} color={theme.colors.accent.primary} />
          </View>
          <Text style={styles.body}>{t('bunker.body')}</Text>
        </View>

        <TextField
          label={t('bunker.uriLabel')}
          value={uri}
          onChangeText={setUri}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t('bunker.uriPlaceholder')}
        />

        {authUrl ? (
          <View style={styles.approveCard}>
            <Text style={styles.approveTitle}>{t('bunker.approveTitle')}</Text>
            <Text style={styles.approveHint}>{t('bunker.approveHint')}</Text>
          </View>
        ) : null}

        {error ? (
          <ErrorState
            title={t('bunker.errorTitle')}
            message={error}
            onRetry={() => {
              onConnect().catch(() => undefined);
            }}
          />
        ) : null}
      </ScrollView>
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
    infoCard: {
      backgroundColor: theme.colors.background.elevated,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      alignItems: 'center',
      ...theme.elevation.card,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
    },
    body: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
      textAlign: 'center',
    },
    approveCard: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background.elevated,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
      gap: theme.spacing.xs,
      ...theme.elevation.card,
    },
    approveTitle: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: theme.typography.heading.fontWeight,
    },
    approveHint: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
    },
  });
}
