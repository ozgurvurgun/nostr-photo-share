import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Button} from '../../../../shared/ui/Button';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
import {OfflineBanner} from '../../../../shared/ui/OfflineBanner';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {Skeleton} from '../../../../shared/ui/Skeleton';
import {TextField} from '../../../../shared/ui/TextField';
import {
  RECOMMENDED_RELAYS_MAX,
  RECOMMENDED_RELAYS_MIN,
} from '../../domain/constants';
import type {RelayPreference} from '../../domain/RelayPreference';
import {normalizeRelayUrl} from '../../domain/RelayUrl';
import {useRelayHealth, useRelayList, useUpdateRelayList} from '../hooks/useRelays';

export type RelaysScreenProps = NativeStackScreenProps<AppStackParamList, 'Relays'>;

function healthLabel(connected: boolean, reconnecting: boolean): string {
  if (connected) {
    return t('relays.statusConnected');
  }
  if (reconnecting) {
    return t('relays.statusReconnecting');
  }
  return t('relays.statusOffline');
}

function statusDotColor(
  connected: boolean,
  reconnecting: boolean,
  theme: Theme,
): string {
  if (connected) {
    return theme.colors.state.success;
  }
  if (reconnecting) {
    return theme.colors.state.warning;
  }
  return theme.colors.text.disabled;
}

export function RelaysScreen({navigation}: RelaysScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );
  const {identity} = useAuthSession();
  const pubkeyHex = identity?.publicKey.toHex() ?? '';
  const listQuery = useRelayList(pubkeyHex.length > 0 ? pubkeyHex : undefined);
  const healthQuery = useRelayHealth(pubkeyHex.length > 0 ? pubkeyHex : undefined);
  const updateRelayList = useUpdateRelayList();

  const [draft, setDraft] = useState<RelayPreference[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(false);
  }, [pubkeyHex]);

  useEffect(() => {
    if (hydrated || !listQuery.data) {
      return;
    }
    setDraft(listQuery.data.preferences.map(pref => ({...pref})));
    setHydrated(true);
  }, [hydrated, listQuery.data]);

  const healthByUrl = useMemo(() => {
    const map = new Map<string, {connected: boolean; reconnecting: boolean}>();
    for (const entry of healthQuery.data ?? []) {
      map.set(entry.url, {
        connected: entry.connected,
        reconnecting: entry.reconnecting,
      });
    }
    return map;
  }, [healthQuery.data]);

  const anyConnected = (healthQuery.data ?? []).some(entry => entry.connected);
  const offline = healthQuery.isFetched && !anyConnected;

  function setPreference(url: string, patch: Partial<RelayPreference>): void {
    setDraft(current =>
      current.map(pref => {
        if (pref.url !== url) {
          return pref;
        }
        const next = {...pref, ...patch};
        if (!next.read && !next.write) {
          return pref;
        }
        return next;
      }),
    );
  }

  function onRemove(url: string): void {
    setDraft(current => current.filter(pref => pref.url !== url));
  }

  function onAdd(): void {
    setLocalError(null);
    const normalized = normalizeRelayUrl(addUrl);
    if (!normalized.ok) {
      setLocalError(normalized.error.message);
      return;
    }
    if (draft.some(pref => pref.url === normalized.value)) {
      setLocalError(t('relays.alreadyInList'));
      return;
    }
    setDraft(current => [
      ...current,
      {url: normalized.value, read: true, write: true},
    ]);
    setAddUrl('');
  }

  async function onSave(): Promise<void> {
    setLocalError(null);
    try {
      await updateRelayList.mutateAsync(draft);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('relays.publishFailed');
      setLocalError(message);
    }
  }

  if (!identity) {
    return <View style={styles.rootEmpty} />;
  }

  if (listQuery.isLoading && !hydrated) {
    return (
      <View style={styles.root}>
        <ScreenHeader title={t('relays.title')} onBack={() => navigation.goBack()} />
        <View style={styles.loadingBlock}>
          <Skeleton height={64} />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      </View>
    );
  }

  if (listQuery.isError && !hydrated) {
    return (
      <View style={styles.root}>
        <ScreenHeader title={t('relays.title')} onBack={() => navigation.goBack()} />
        <View style={styles.errorBlock}>
          <ErrorState
            title={t('relays.loadFailed')}
            message={
              listQuery.error instanceof Error
                ? listQuery.error.message
                : t('common.unknownError')
            }
            onRetry={() => {
              listQuery.refetch().catch(() => undefined);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardScreen style={styles.root}>
      <ScreenHeader
        title={t('relays.title')}
        onBack={() => navigation.goBack()}
        rightLabel={t('relays.savePublish')}
        onRightPress={() => {
          onSave().catch(() => undefined);
        }}
        rightDisabled={updateRelayList.isPending}
        rightLoading={updateRelayList.isPending}
      />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <OfflineBanner visible={offline} message={t('relays.offlineBanner')} />

        <Text style={styles.body}>
          {t('relays.body', {min: RECOMMENDED_RELAYS_MIN, max: RECOMMENDED_RELAYS_MAX})}
        </Text>

        {draft.length === 0 ? (
          <EmptyState title={t('relays.emptyTitle')} message={t('relays.emptyMessage')} />
        ) : (
          draft.map(pref => {
            const health = healthByUrl.get(pref.url);
            const connected = health?.connected ?? false;
            const reconnecting = health?.reconnecting ?? false;
            const status = healthLabel(connected, reconnecting);
            const dotColor = statusDotColor(connected, reconnecting, theme);
            return (
              <View key={pref.url} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Icon name="relay" size={20} color={theme.colors.text.secondary} />
                  <Text selectable style={styles.cardUrl}>
                    {pref.url.replace(/^wss?:\/\//, '')}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, {backgroundColor: dotColor}]} />
                  <Text style={[styles.statusLabel, {color: dotColor}]}>{status}</Text>
                </View>
                <View style={styles.flagsRow}>
                  <FlagToggle
                    label={t('relays.read')}
                    active={pref.read}
                    onPress={() => setPreference(pref.url, {read: !pref.read})}
                  />
                  <FlagToggle
                    label={t('relays.write')}
                    active={pref.write}
                    onPress={() => setPreference(pref.url, {write: !pref.write})}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('relays.remove')}
                    onPress={() => onRemove(pref.url)}
                    hitSlop={theme.layout.hitSlop}
                    style={({pressed}) => [
                      styles.removeButton,
                      pressed ? styles.pressed : null,
                    ]}>
                    <Text style={styles.removeLabel}>{t('relays.remove')}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        <TextField
          label={t('relays.addLabel')}
          autoCapitalize="none"
          autoCorrect={false}
          value={addUrl}
          onChangeText={setAddUrl}
          placeholder={t('relays.addPlaceholder')}
        />
        <Button label={t('relays.add')} variant="secondary" onPress={onAdd} />

        {localError ? (
          <ErrorState title={t('relays.errorTitle')} message={localError} />
        ) : null}
      </ScrollView>
    </KeyboardScreen>
  );
}

function FlagToggle(props: {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createFlagStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: props.active}}
      onPress={props.onPress}
      style={({pressed}) => [
        styles.flag,
        props.active ? styles.flagActive : styles.flagInactive,
        pressed ? styles.pressed : null,
      ]}>
      <Text style={[styles.flagLabel, props.active ? styles.flagLabelActive : null]}>
        {props.label}
      </Text>
    </Pressable>
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
    rootEmpty: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing.screenEdge,
    },
    loadingBlock: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    errorBlock: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingTop: theme.spacing.lg,
    },
    content: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingTop: theme.spacing.md,
      paddingBottom: insetBottom + theme.spacing.lg,
      gap: theme.spacing.md,
    },
    body: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
    },
    card: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
      backgroundColor: theme.colors.background.elevated,
      ...theme.elevation.card,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    cardUrl: {
      flex: 1,
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: theme.radius.full,
    },
    statusLabel: {
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
    },
    flagsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    removeButton: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
    },
    removeLabel: {
      color: theme.colors.state.error,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}

function createFlagStyles(theme: Theme) {
  return StyleSheet.create({
    flag: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.sm,
    },
    flagActive: {
      borderColor: theme.colors.accent.primary,
      backgroundColor: theme.colors.background.secondary,
    },
    flagInactive: {
      borderColor: theme.colors.border.default,
      backgroundColor: theme.colors.background.primary,
    },
    flagLabel: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
    },
    flagLabelActive: {
      color: theme.colors.accent.primary,
    },
    pressed: {
      opacity: 0.85,
    },
  });
}
