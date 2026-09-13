import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Button} from '../../../../shared/ui/Button';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
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

export function RelaysScreen({navigation}: RelaysScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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

  if (listQuery.isLoading && !hydrated) {
    return (
      <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
        <ScreenHeader title={t('relays.title')} onBack={() => navigation.goBack()} />
        <View
          style={{
            paddingHorizontal: theme.spacing.screenEdge,
            paddingTop: theme.spacing.lg,
            gap: theme.spacing.md,
          }}>
          <Skeleton height={64} />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      </View>
    );
  }

  if (listQuery.isError && !hydrated) {
    return (
      <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
        <ScreenHeader title={t('relays.title')} onBack={() => navigation.goBack()} />
        <View style={{paddingHorizontal: theme.spacing.screenEdge, paddingTop: theme.spacing.lg}}>
          <ErrorState
            title={t('relays.loadFailed')}
            message={
              listQuery.error instanceof Error
                ? listQuery.error.message
                : t('common.unknownError')
            }
            onRetry={() => {
              void listQuery.refetch();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
      <ScreenHeader
        title={t('relays.title')}
        onBack={() => navigation.goBack()}
        rightLabel={t('relays.savePublish')}
        onRightPress={() => {
          void onSave();
        }}
        rightDisabled={updateRelayList.isPending}
        rightLoading={updateRelayList.isPending}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: theme.spacing.md,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        }}>
        <OfflineBanner visible={offline} message={t('relays.offlineBanner')} />

        <Text
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.caption.fontSize,
            lineHeight: theme.typography.caption.lineHeight,
          }}>
          {t('relays.body', {min: RECOMMENDED_RELAYS_MIN, max: RECOMMENDED_RELAYS_MAX})}
        </Text>

        {draft.length === 0 ? (
          <EmptyState title={t('relays.emptyTitle')} message={t('relays.emptyMessage')} />
        ) : (
          draft.map(pref => {
            const health = healthByUrl.get(pref.url);
            const status = healthLabel(
              health?.connected ?? false,
              health?.reconnecting ?? false,
            );
            const connected = health?.connected ?? false;
            return (
              <View
                key={pref.url}
                style={{
                  gap: theme.spacing.sm,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border.default,
                  backgroundColor: theme.colors.background.elevated,
                }}>
                <Text
                  selectable
                  style={{
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.body.fontSize,
                    fontWeight: '600',
                  }}>
                  {pref.url.replace(/^wss?:\/\//, '')}
                </Text>
                <Text
                  style={{
                    color: connected
                      ? theme.colors.state.success
                      : theme.colors.text.disabled,
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: '600',
                  }}>
                  {status}
                </Text>
                <View style={{flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap'}}>
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
                    style={({pressed}) => ({
                      paddingVertical: theme.spacing.xs,
                      paddingHorizontal: theme.spacing.sm,
                      opacity: pressed ? 0.7 : 1,
                    })}>
                    <Text
                      style={{
                        color: theme.colors.state.error,
                        fontSize: theme.typography.caption.fontSize,
                        fontWeight: '600',
                      }}>
                      {t('relays.remove')}
                    </Text>
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
          <Text
            style={{
              color: theme.colors.state.error,
              fontSize: theme.typography.caption.fontSize,
            }}>
            {localError}
          </Text>
        ) : null}

        <Button
          label={t('relays.savePublish')}
          loading={updateRelayList.isPending}
          onPress={() => {
            void onSave();
          }}
        />
      </ScrollView>
    </View>
  );
}

function FlagToggle(props: {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: props.active}}
      onPress={props.onPress}
      style={({pressed}) => ({
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        borderWidth: 1,
        borderColor: props.active ? theme.colors.accent.primary : theme.colors.border.default,
        borderRadius: theme.radius.sm,
        backgroundColor: props.active
          ? theme.colors.background.secondary
          : theme.colors.background.primary,
        opacity: pressed ? 0.85 : 1,
      })}>
      <Text
        style={{
          color: props.active ? theme.colors.accent.primary : theme.colors.text.primary,
          fontSize: theme.typography.caption.fontSize,
          fontWeight: '600',
        }}>
        {props.label}
      </Text>
    </Pressable>
  );
}
