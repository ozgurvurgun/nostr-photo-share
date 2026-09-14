import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AuthStackParamList} from '../../../../app/navigation/types';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {HelpModal} from '../../../../shared/ui/HelpModal';
import {Icon} from '../../../../shared/ui/Icon';
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
import {normalizeRelayUrl} from '../../../relays/domain/RelayUrl';
import {AuthCtaButton} from '../components/AuthCtaButton';
import {AuthScreenGlow} from '../components/AuthScreenGlow';
import {AuthWizardHeader} from '../components/AuthWizardHeader';
import {useAuthSession} from '../hooks/useAuthSession';

export type ImportNsecScreenProps = NativeStackScreenProps<AuthStackParamList, 'ImportNsec'>;

const DEFAULT_LOGIN_RELAY = 'relay.damus.io';

export function ImportNsecScreen({navigation}: ImportNsecScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );
  const container = useAppContainer();
  const {completeLogin} = useAuthSession();
  const [nsec, setNsec] = useState('');
  const [relay, setRelay] = useState(DEFAULT_LOGIN_RELAY);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    return () => {
      setNsec('');
    };
  }, []);

  async function onImport(): Promise<void> {
    setLoading(true);
    setError(null);
    const result = await container.importNsec.execute(nsec);
    if (!result.ok) {
      setLoading(false);
      setError(result.error.message);
      container.logger.error('Import nsec failed', {code: result.error.code});
      setNsec('');
      return;
    }
    const normalized = normalizeRelayUrl(relay);
    if (normalized.ok) {
      try {
        container.relayPool.addRelay(normalized.value);
      } catch {
        // Pool already has the relay or URL was rejected.
      }
    }
    setNsec('');
    setLoading(false);
    await completeLogin(result.value);
  }

  return (
    <KeyboardScreen style={styles.root}>
      <AuthScreenGlow />
      <AuthWizardHeader onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{t('importNsec.eyebrow')}</Text>
        <Text style={styles.title}>{t('importNsec.heading')}</Text>
        <Text style={styles.body}>{t('importNsec.subtitle')}</Text>

        <Text style={styles.fieldLabel}>{t('importNsec.nsecLabel')}</Text>
        <TextInput
          value={nsec}
          onChangeText={setNsec}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!revealed}
          placeholder={t('importNsec.nsecPlaceholder')}
          placeholderTextColor={theme.colors.text.disabled}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            revealed ? t('importNsec.hideKey') : t('importNsec.showKey')
          }
          onPress={() => {
            StillHaptics.selection();
            setRevealed(current => !current);
          }}
          style={styles.showKey}>
          <Text style={styles.showKeyLabel}>
            {revealed ? t('importNsec.hideKey') : t('importNsec.showKey')}
          </Text>
        </Pressable>

        <Text style={styles.fieldLabel}>{t('importNsec.relayLabel')}</Text>
        <TextInput
          value={relay}
          onChangeText={setRelay}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t('importNsec.relayPlaceholder')}
          placeholderTextColor={theme.colors.text.disabled}
          style={styles.input}
        />

        <View style={styles.stayCard}>
          <View style={styles.stayIcon}>
            <Icon name="key" size={18} color={theme.colors.accent.primary} />
          </View>
          <View style={styles.stayText}>
            <Text style={styles.stayTitle}>{t('importNsec.staysOnDevice')}</Text>
            <Text style={styles.stayHint}>{t('importNsec.staysOnDeviceHint')}</Text>
          </View>
        </View>

        {error ? (
          <ErrorState
            title={t('importNsec.errorTitle')}
            message={error}
            onRetry={() => {
              onImport().catch(() => undefined);
            }}
          />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <AuthCtaButton
          label={t('importNsec.import')}
          loading={loading}
          disabled={nsec.trim().length === 0}
          onPress={() => {
            onImport().catch(() => undefined);
          }}
        />
        <View style={styles.guideRow}>
          <Text style={styles.guideMuted}>{t('importNsec.forgotKey')} </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('importNsec.securityGuide')}
            onPress={() => {
              StillHaptics.selection();
              setShowGuide(true);
            }}
            hitSlop={theme.layout.hitSlop}>
            <Text style={styles.guideLink}>{t('importNsec.securityGuide')}</Text>
          </Pressable>
        </View>
      </View>

      <HelpModal
        visible={showGuide}
        title={t('importNsec.securityGuideTitle')}
        body={t('importNsec.securityGuideBody')}
        onClose={() => setShowGuide(false)}
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
    showKey: {
      alignSelf: 'flex-end',
    },
    showKeyLabel: {
      color: theme.colors.accent.primary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '700',
    },
    stayCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.elevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.accent.primary,
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    stayIcon: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.surface,
    },
    stayText: {
      flex: 1,
    },
    stayTitle: {
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    stayHint: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    footer: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingBottom: insetBottom + theme.spacing.md,
      paddingTop: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    guideRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    guideMuted: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    guideLink: {
      color: theme.colors.accent.primary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '700',
    },
  });
}
