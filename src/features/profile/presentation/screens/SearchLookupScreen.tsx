import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {formatCompactCount} from '../../../../shared/format';
import {countHashtags} from '../../../../shared/hashtags';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {SearchBar} from '../../../../shared/ui/SearchBar';
import {flattenFeedPosts, useFeed} from '../../../feed/presentation/hooks/useFeed';

export type SearchLookupScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'SearchLookup'
>;

const FALLBACK_TAGS = ['nostr', 'fotoğraf', 'tasarım', 'yapayzeka', 'seyahat'] as const;

export function SearchLookupScreen({
  navigation,
  route,
}: SearchLookupScreenProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const container = useAppContainer();
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [error, setError] = useState<string | null>(null);
  const explore = useFeed({});
  const posts = useMemo(
    () => flattenFeedPosts(explore.data?.pages),
    [explore.data?.pages],
  );

  const trends = useMemo(() => {
    const counts = countHashtags(
      posts.map(post => `${post.title} ${post.caption}`),
    );
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const tags =
      ranked.length > 0
        ? ranked.slice(0, 8)
        : FALLBACK_TAGS.map(tag => [tag, counts.get(tag) ?? 0] as const);
    const needle = query.trim().replace(/^#/, '').toLocaleLowerCase('tr-TR');
    if (needle.length === 0) {
      return tags;
    }
    return tags.filter(([tag]) => tag.includes(needle));
  }, [posts, query]);

  function openExplore(raw: string): void {
    StillHaptics.selection();
    navigation.navigate('MainTabs', {screen: 'Search', params: {query: raw}});
  }

  function onSubmit(): void {
    setError(null);
    const raw = query.trim();
    if (raw.length === 0) {
      return;
    }

    const lower = raw.toLowerCase();
    if (/^[0-9a-f]{64}$/.test(lower)) {
      navigation.navigate('Profile', {pubkeyHex: lower});
      return;
    }

    const decoded = container.nip19.decode(raw);
    if (decoded.ok && decoded.value.type === 'npub') {
      navigation.navigate('Profile', {pubkeyHex: decoded.value.data});
      return;
    }
    if (decoded.ok && decoded.value.type === 'nprofile') {
      navigation.navigate('Profile', {pubkeyHex: decoded.value.data.pubkey});
      return;
    }

    if (raw.startsWith('npub') || raw.startsWith('nprofile')) {
      setError(t('search.invalid'));
      return;
    }

    openExplore(raw.startsWith('#') ? raw : `#${raw}`);
  }

  return (
    <KeyboardScreen style={styles.root}>
      <ScreenHeader
        title={t('search.lookupTitle')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <SearchBar
          value={query}
          onChangeText={text => {
            setQuery(text);
            setError(null);
          }}
          onSubmitEditing={onSubmit}
          onClear={() => {
            setQuery('');
            setError(null);
          }}
          placeholder={t('search.lookupPlaceholder')}
          accessibilityLabel={t('search.lookupPlaceholder')}
          autoFocus
        />
        {error ? <ErrorState title={t('search.invalid')} message={error} /> : null}
        <Text style={styles.section}>{t('search.trends')}</Text>
        {trends.map(([tag, count], index) => (
          <Pressable
            key={tag}
            accessibilityRole="button"
            accessibilityLabel={`#${tag}`}
            onPress={() => openExplore(`#${tag}`)}
            style={({pressed}) => [
              styles.trendRow,
              pressed ? styles.pressed : null,
            ]}>
            <Text style={styles.rank}>{String(index + 1).padStart(2, '0')}</Text>
            <View style={styles.trendText}>
              <Text style={styles.tag}>#{tag}</Text>
            </View>
            <Text style={styles.count}>
              {t('search.postsCount', {count: formatCompactCount(count)})}
            </Text>
            <Icon name="chevronRight" size={16} color={theme.colors.text.disabled} />
          </Pressable>
        ))}
      </ScrollView>
    </KeyboardScreen>
  );
}

function createStyles(theme: Theme) {
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
      paddingBottom: theme.spacing.xl,
      gap: theme.spacing.xs,
    },
    section: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    trendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 52,
      gap: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    rank: {
      color: theme.colors.accent.primary,
      fontWeight: '700',
      width: 28,
    },
    trendText: {
      flex: 1,
    },
    tag: {
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    count: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.caption.fontSize,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
