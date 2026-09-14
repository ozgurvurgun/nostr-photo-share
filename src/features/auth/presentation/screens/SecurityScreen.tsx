import React, {useEffect, useMemo, useState} from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {hexToBytes, wipeBytes} from '../../../../core/utilities/hex';
import {copyToClipboard} from '../../../../shared/clipboard';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {AuthCtaButton} from '../components/AuthCtaButton';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {useToast} from '../../../../shared/ui/Toast';
import {useAuthSession} from '../hooks/useAuthSession';

export type SecurityScreenProps = NativeStackScreenProps<AppStackParamList, 'Security'>;

const DISPLAY_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export function SecurityScreen({navigation}: SecurityScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );
  const container = useAppContainer();
  const {identity} = useAuthSession();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nsec, setNsec] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const isBunker = identity?.authMethod === 'bunker';

  useEffect(() => {
    return () => {
      setNsec(null);
    };
  }, []);

  async function onVerify(): Promise<void> {
    if (!identity || isBunker) {
      return;
    }
    setLoading(true);
    setError(null);
    setCopied(false);
    // Force Keychain biometrics / device passcode — never use session cache.
    const secret = await container.identityStore.unlockSecretKeyHex();
    setLoading(false);
    if (!secret.ok) {
      setError(secret.error.message);
      return;
    }
    if (!secret.value) {
      setError(t('security.noLocalKey'));
      return;
    }
    let bytes: Uint8Array | null = null;
    try {
      bytes = hexToBytes(secret.value);
      const encoded = container.nip19.encodeNsec(bytes);
      if (!encoded.ok) {
        setError(encoded.error.message);
        return;
      }
      setNsec(encoded.value);
      setRevealed(false);
      StillHaptics.publishSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.unknownError'));
    } finally {
      if (bytes) {
        wipeBytes(bytes);
      }
    }
  }

  function onCopy(): void {
    if (!nsec) {
      return;
    }
    if (copyToClipboard(nsec)) {
      setCopied(true);
      StillHaptics.publishSuccess();
      toast.show(t('common.copied'), {tone: 'success'});
    }
  }

  function onHide(): void {
    setNsec(null);
    setRevealed(false);
    setCopied(false);
  }

  return (
    <KeyboardScreen style={styles.root}>
      <ScreenHeader
        title={t('security.title')}
        onBack={() => navigation.goBack()}
        displayTitle
        border={false}
      />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="lock" size={28} color={theme.colors.accent.primary} />
          </View>
          <Text style={styles.heroTitle}>{t('security.heroTitle')}</Text>
          <Text style={styles.heroBody}>{t('security.heroBody')}</Text>
        </View>

        <View style={styles.accessCard}>
          <Text style={styles.accessTitle}>{t('security.accessTitle')}</Text>
          <Text style={styles.accessBody}>
            {isBunker ? t('security.bunkerBody') : t('security.accessBody')}
          </Text>

          {isBunker ? null : nsec ? (
            <View style={styles.revealBlock}>
              <Text style={styles.fieldLabel}>{t('security.recoveryKey')}</Text>
              <Text selectable style={styles.nsec}>
                {revealed ? nsec : '•'.repeat(Math.min(36, nsec.length))}
              </Text>
              <View style={styles.revealActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    revealed ? t('security.hideKey') : t('security.showKey')
                  }
                  onPress={() => {
                    StillHaptics.selection();
                    setRevealed(current => !current);
                  }}
                  hitSlop={theme.layout.hitSlop}
                  style={({pressed}) => (pressed ? styles.pressed : null)}>
                  <Text style={styles.link}>
                    {revealed ? t('security.hideKey') : t('security.showKey')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('security.copyKey')}
                  onPress={onCopy}
                  hitSlop={theme.layout.hitSlop}
                  style={({pressed}) => (pressed ? styles.pressed : null)}>
                  <Text style={styles.link}>
                    {copied ? t('security.copied') : t('security.copyKey')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('security.hideAgain')}
                  onPress={onHide}
                  hitSlop={theme.layout.hitSlop}
                  style={({pressed}) => (pressed ? styles.pressed : null)}>
                  <Text style={styles.linkMuted}>{t('security.hideAgain')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <AuthCtaButton
              label={t('security.verify')}
              loading={loading}
              onPress={() => {
                onVerify().catch(() => undefined);
              }}
            />
          )}

          {error ? (
            <ErrorState
              title={t('security.unlockFailed')}
              message={error}
              onRetry={() => {
                onVerify().catch(() => undefined);
              }}
            />
          ) : null}
        </View>

        <View style={styles.statusList}>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Icon name="key" size={20} color={theme.colors.accent.primary} />
            </View>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>{t('security.keyStoredTitle')}</Text>
              <Text style={styles.statusHint}>{t('security.keyStoredBody')}</Text>
            </View>
            <Icon name="check" size={20} color={theme.colors.state.success} />
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Icon name="lock" size={20} color={theme.colors.accent.primary} />
            </View>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>{t('security.localTitle')}</Text>
              <Text style={styles.statusHint}>{t('security.localBody')}</Text>
            </View>
            <Icon name="check" size={20} color={theme.colors.state.success} />
          </View>
        </View>
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
      paddingTop: theme.spacing.md,
      paddingBottom: insetBottom + theme.spacing.lg,
      gap: theme.spacing.md,
    },
    heroCard: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      alignItems: 'center',
      backgroundColor: 'rgba(200, 146, 42, 0.14)',
      borderWidth: 1,
      borderColor: 'rgba(200, 146, 42, 0.28)',
    },
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(18, 17, 15, 0.45)',
      marginBottom: theme.spacing.xs,
    },
    heroTitle: {
      color: theme.colors.text.primary,
      fontFamily: DISPLAY_FONT,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '600',
      textAlign: 'center',
    },
    heroBody: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
      textAlign: 'center',
    },
    accessCard: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
    },
    accessTitle: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: '700',
    },
    accessBody: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
      marginBottom: theme.spacing.xs,
    },
    fieldLabel: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      marginTop: theme.spacing.xs,
    },
    revealBlock: {
      gap: theme.spacing.sm,
    },
    nsec: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: 20,
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      padding: theme.spacing.md,
    },
    revealActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    link: {
      color: theme.colors.accent.primary,
      fontWeight: '700',
      fontSize: theme.typography.caption.fontSize,
    },
    linkMuted: {
      color: theme.colors.text.secondary,
      fontWeight: '600',
      fontSize: theme.typography.caption.fontSize,
    },
    statusList: {
      gap: theme.spacing.sm,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
    },
    statusIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(200, 146, 42, 0.12)',
    },
    statusText: {
      flex: 1,
      gap: 2,
    },
    statusTitle: {
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    statusHint: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
