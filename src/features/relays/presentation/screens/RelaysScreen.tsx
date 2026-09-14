import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
import {OfflineBanner} from '../../../../shared/ui/OfflineBanner';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {Skeleton} from '../../../../shared/ui/Skeleton';
import {TextField} from '../../../../shared/ui/TextField';
import {useToast} from '../../../../shared/ui/Toast';
import {
  RECOMMENDED_RELAYS_MAX,
  RECOMMENDED_RELAYS_MIN,
} from '../../domain/constants';
import type {RelayPreference} from '../../domain/RelayPreference';
import {normalizeRelayUrl} from '../../domain/RelayUrl';
import {useRelayHealth, useRelayList, useUpdateRelayList} from '../hooks/useRelays';

export type RelaysScreenProps = NativeStackScreenProps<AppStackParamList, 'Relays'>;

function healthSubtitle(
  connected: boolean,
  reconnecting: boolean,
  isDefault: boolean,
): string {
  if (isDefault && connected) {
    return t('relays.defaultRelay');
  }
  if (connected) {
    return t('relays.statusConnectedLabel');
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
  const toast = useToast();

  const [draft, setDraft] = useState<RelayPreference[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

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
  const defaultUrl = draft.find(pref => pref.write)?.url ?? draft[0]?.url;

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

  function openRelayMenu(pref: RelayPreference): void {
    StillHaptics.selection();
    Alert.alert(pref.url.replace(/^wss?:\/\//, ''), undefined, [
      {
        text: pref.read ? t('relays.disableRead') : t('relays.enableRead'),
        onPress: () => setPreference(pref.url, {read: !pref.read}),
      },
      {
        text: pref.write ? t('relays.disableWrite') : t('relays.enableWrite'),
        onPress: () => setPreference(pref.url, {write: !pref.write}),
      },
      {
        text: t('relays.remove'),
        style: 'destructive',
        onPress: () => onRemove(pref.url),
      },
      {text: t('common.cancel'), style: 'cancel'},
    ]);
  }

  function onAdd(): void {
    setLocalError(null);
    const normalized = normalizeRelayUrl(addUrl);
    if (!normalized.ok) {
      setLocalError(normalized.error.message);
      toast.show(normalized.error.message, {tone: 'error'});
      return;
    }
    if (draft.some(pref => pref.url === normalized.value)) {
      setLocalError(t('relays.alreadyInList'));
      toast.show(t('relays.alreadyInList'), {tone: 'error'});
      return;
    }
    setDraft(current => [
      ...current,
      {url: normalized.value, read: true, write: true},
    ]);
    setAddUrl('');
    setShowAdd(false);
    StillHaptics.selection();
    toast.show(t('relays.added'), {tone: 'success'});
  }

  async function onSave(options?: {readonly silent?: boolean}): Promise<boolean> {
    setLocalError(null);
    try {
      await updateRelayList.mutateAsync(draft);
      StillHaptics.save();
      if (!options?.silent) {
        toast.show(t('relays.saved'), {tone: 'success'});
      }
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('relays.publishFailed');
      setLocalError(message);
      toast.show(message, {tone: 'error'});
      return false;
    }
  }

  async function onTest(): Promise<void> {
    setTesting(true);
    StillHaptics.selection();
    try {
      if (hydrated) {
        const saved = await onSave({silent: true});
        if (!saved) {
          return;
        }
      }
      const result = await healthQuery.refetch();
      const entries = result.data ?? [];
      const connected = entries.filter(entry => entry.connected).length;
      const total = entries.length;
      if (connected === 0) {
        toast.show(t('relays.testFail'), {tone: 'error'});
        return;
      }
      if (total > 0 && connected < total) {
        toast.show(t('relays.testPartial', {connected, total}), {
          tone: 'info',
        });
        return;
      }
      toast.show(
        connected === 1
          ? t('relays.testOkOne')
          : t('relays.testOk', {count: connected}),
        {tone: 'success'},
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('relays.testFail');
      toast.show(message, {tone: 'error'});
    } finally {
      setTesting(false);
    }
  }

  if (!identity) {
    return <View style={styles.rootEmpty} />;
  }

  if (listQuery.isLoading && !hydrated) {
    return (
      <View style={styles.root}>
        <ScreenHeader
          title={t('relays.title')}
          onBack={() => navigation.goBack()}
          displayTitle
          border={false}
        />
        <View style={styles.loadingBlock}>
          <Skeleton height={72} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </View>
      </View>
    );
  }

  if (listQuery.isError && !hydrated) {
    return (
      <View style={styles.root}>
        <ScreenHeader
          title={t('relays.title')}
          onBack={() => navigation.goBack()}
          displayTitle
          border={false}
        />
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
        rightIcon="plus"
        rightLabel={t('relays.add')}
        onRightPress={() => {
          setShowAdd(current => !current);
          setLocalError(null);
        }}
        displayTitle
        border={false}
      />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <OfflineBanner visible={offline} message={t('relays.offlineBanner')} />

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Icon name="relay" size={22} color={theme.colors.accent.primary} />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>{t('relays.infoTitle')}</Text>
            <Text style={styles.infoBody}>
              {t('relays.infoBody', {
                min: RECOMMENDED_RELAYS_MIN,
                max: RECOMMENDED_RELAYS_MAX,
              })}
            </Text>
          </View>
        </View>

        {draft.length === 0 ? (
          <EmptyState title={t('relays.emptyTitle')} message={t('relays.emptyMessage')} />
        ) : (
          <View style={styles.list}>
            {draft.map((pref, index) => {
              const health = healthByUrl.get(pref.url);
              const connected = health?.connected ?? false;
              const reconnecting = health?.reconnecting ?? false;
              const isDefault = pref.url === defaultUrl;
              const host = pref.url.replace(/^wss?:\/\//, '');
              const dotColor = statusDotColor(connected, reconnecting, theme);
              return (
                <View key={pref.url}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.row}>
                    <View style={[styles.dot, {backgroundColor: dotColor}]} />
                    <View style={styles.rowText}>
                      <Text numberOfLines={1} style={styles.host}>
                        {host}
                      </Text>
                      <Text numberOfLines={1} style={styles.meta}>
                        {healthSubtitle(connected, reconnecting, isDefault)}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('relays.moreA11y')}
                      onPress={() => openRelayMenu(pref)}
                      hitSlop={theme.layout.hitSlop}
                      style={({pressed}) => (pressed ? styles.pressed : null)}>
                      <Icon
                        name="ellipsis"
                        size={20}
                        color={theme.colors.text.secondary}
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {showAdd ? (
          <View style={styles.addBlock}>
            <TextField
              label={t('relays.addLabel')}
              autoCapitalize="none"
              autoCorrect={false}
              value={addUrl}
              onChangeText={setAddUrl}
              placeholder={t('relays.addPlaceholder')}
              autoFocus
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('relays.add')}
              onPress={onAdd}
              style={({pressed}) => [
                styles.secondaryCta,
                pressed ? styles.pressed : null,
              ]}>
              <Text style={styles.secondaryCtaLabel}>{t('relays.add')}</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('relays.testConnection')}
          accessibilityState={{busy: testing || updateRelayList.isPending}}
          disabled={testing || updateRelayList.isPending}
          onPress={() => {
            onTest().catch(() => undefined);
          }}
          style={({pressed}) => [
            styles.primaryCta,
            pressed || testing ? styles.pressed : null,
          ]}>
          <Icon name="bolt" size={18} color={theme.colors.accent.onAccent} />
          <Text style={styles.primaryCtaLabel}>
            {testing || updateRelayList.isPending
              ? t('common.loading')
              : t('relays.testConnection')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('relays.savePublish')}
          disabled={updateRelayList.isPending}
          onPress={() => {
            onSave().catch(() => undefined);
          }}
          style={({pressed}) => [
            styles.saveLink,
            pressed ? styles.pressed : null,
          ]}>
          <Text style={styles.saveLinkLabel}>{t('relays.savePublish')}</Text>
        </Pressable>

        {localError ? (
          <ErrorState title={t('relays.errorTitle')} message={localError} />
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
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      backgroundColor: 'rgba(200, 146, 42, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(200, 146, 42, 0.28)',
    },
    infoIcon: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(18, 17, 15, 0.35)',
    },
    infoText: {
      flex: 1,
      gap: 4,
    },
    infoTitle: {
      color: theme.colors.text.primary,
      fontWeight: '700',
      fontSize: theme.typography.bodyStrong.fontSize,
    },
    infoBody: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
    },
    list: {
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
      overflow: 'hidden',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border.default,
      marginLeft: theme.spacing.md + 10 + theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: theme.radius.full,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    host: {
      color: theme.colors.text.primary,
      fontWeight: '600',
      fontSize: theme.typography.body.fontSize,
    },
    meta: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    addBlock: {
      gap: theme.spacing.sm,
    },
    secondaryCta: {
      minHeight: 48,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.elevated,
    },
    secondaryCtaLabel: {
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    primaryCta: {
      minHeight: 56,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.accent.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    primaryCtaLabel: {
      color: theme.colors.accent.onAccent,
      fontWeight: '700',
      fontSize: theme.typography.button.fontSize,
    },
    saveLink: {
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    saveLinkLabel: {
      color: theme.colors.accent.primary,
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
