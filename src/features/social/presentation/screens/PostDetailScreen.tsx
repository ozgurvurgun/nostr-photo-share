import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {OfflineBanner} from '../../../../shared/ui/OfflineBanner';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {useProfile} from '../../../profile/presentation/hooks/useProfile';
import {useRelayOnline} from '../../../feed/presentation/hooks/useRelayOnline';
import type {Comment} from '../../domain/Comment';
import {useCommentOnPost, useComments} from '../hooks/useComments';

export type PostDetailScreenProps = NativeStackScreenProps<AppStackParamList, 'PostDetail'>;

function LetterAvatar({
  label,
  size,
}: {
  readonly label: string;
  readonly size: number;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.background.elevated,
        borderWidth: 1,
        borderColor: theme.colors.border.default,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.caption.fontSize,
          fontWeight: '700',
        }}>
        {(label.slice(0, 1) || '?').toUpperCase()}
      </Text>
    </View>
  );
}

function CommentRow({
  comment,
  onLongPress,
}: {
  readonly comment: Comment;
  readonly onLongPress: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const profile = useProfile(comment.authorPubkeyHex);
  const indent = comment.isTopLevel ? 0 : theme.spacing.lg;
  const displayName = useMemo(() => {
    const p = profile.data;
    if (p?.displayName) {
      return p.displayName;
    }
    if (p?.name) {
      return p.name;
    }
    return `${comment.authorPubkeyHex.slice(0, 8)}…`;
  }, [profile.data, comment.authorPubkeyHex]);

  return (
    <Pressable
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityHint={t('comments.replyHint')}
      style={({pressed}) => ({
        paddingLeft: indent,
        flexDirection: 'row',
        gap: theme.spacing.sm,
        opacity: pressed ? 0.85 : 1,
      })}>
      {profile.data?.picture ? (
        <Image
          accessibilityLabel={t('profile.avatarA11y', {label: displayName})}
          source={{uri: profile.data.picture}}
          style={{
            width: 36,
            height: 36,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.background.elevated,
          }}
        />
      ) : (
        <LetterAvatar label={displayName} size={36} />
      )}
      <View style={{flex: 1, gap: theme.spacing.xxs}}>
        <Text
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.caption.fontSize,
            fontWeight: '700',
          }}>
          {displayName}
        </Text>
        <Text
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
          }}>
          {comment.content}
        </Text>
      </View>
    </Pressable>
  );
}

export function PostDetailScreen({
  navigation,
  route,
}: PostDetailScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {eventId, authorPubkeyHex} = route.params;
  const commentsQuery = useComments(eventId);
  const commentMutation = useCommentOnPost();
  const online = useRelayOnline();
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const comments = useMemo(
    () => [...(commentsQuery.data?.comments ?? [])],
    [commentsQuery.data],
  );
  const fromCache = commentsQuery.data?.fromCache === true;
  const canSend = draft.trim().length > 0 && !commentMutation.isPending;

  async function onSubmit(): Promise<void> {
    const content = draft.trim();
    if (content.length === 0 || commentMutation.isPending) {
      return;
    }
    try {
      await commentMutation.mutateAsync({
        content,
        rootEventId: eventId,
        rootAuthorPubkeyHex: authorPubkeyHex,
        ...(replyTo
          ? {
              parentEventId: replyTo.id,
              parentAuthorPubkeyHex: replyTo.authorPubkeyHex,
              parentKind: 1111,
            }
          : {}),
      });
      setDraft('');
      setReplyTo(null);
    } catch {
      // Error surfaced via mutation state
    }
  }

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
      <ScreenHeader
        title={t('comments.title')}
        onBack={() => navigation.goBack()}
      />
      <OfflineBanner visible={!online || fromCache} stale={fromCache} />

      {commentsQuery.isError && comments.length === 0 ? (
        <View style={{padding: theme.spacing.screenEdge}}>
          <ErrorState
            title={t('comments.loadFailed')}
            message={
              commentsQuery.error instanceof Error
                ? commentsQuery.error.message
                : t('common.unknownError')
            }
            onRetry={() => {
              void commentsQuery.refetch();
            }}
          />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.screenEdge,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.lg,
            gap: theme.spacing.md,
            flexGrow: 1,
          }}
          windowSize={7}
          maxToRenderPerBatch={8}
          initialNumToRender={8}
          removeClippedSubviews
          ListEmptyComponent={
            commentsQuery.isPending ? (
              <ActivityIndicator color={theme.colors.accent.primary} />
            ) : (
              <EmptyState
                title={t('comments.emptyTitle')}
                message={t('comments.emptyMessage')}
              />
            )
          }
          renderItem={({item}) => (
            <CommentRow comment={item} onLongPress={() => setReplyTo(item)} />
          )}
        />
      )}

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.default,
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: theme.spacing.sm,
          paddingBottom: insets.bottom + theme.spacing.sm,
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.background.primary,
        }}>
        {replyTo ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.radius.sm,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
            }}>
            <Text
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.caption.fontSize,
              }}>
              {t('comments.replyTo', {short: replyTo.authorPubkeyHex.slice(0, 8)})}
            </Text>
            <Pressable
              onPress={() => setReplyTo(null)}
              hitSlop={theme.layout.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={t('comments.cancelReply')}>
              <Icon name="close" size={18} color={theme.colors.accent.primary} />
            </Pressable>
          </View>
        ) : null}
        {commentMutation.isError ? (
          <Text
            style={{
              color: theme.colors.state.error,
              fontSize: theme.typography.caption.fontSize,
            }}>
            {t('comments.postFailed')}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: theme.spacing.sm,
          }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('comments.placeholder')}
            placeholderTextColor={theme.colors.text.disabled}
            multiline
            style={{
              flex: 1,
              minHeight: theme.layout.composerMinHeight,
              maxHeight: theme.layout.composerMaxHeight,
              borderWidth: 1,
              borderColor: theme.colors.border.default,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              color: theme.colors.text.primary,
              fontSize: theme.typography.body.fontSize,
              backgroundColor: theme.colors.background.elevated,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('comments.post')}
            disabled={!canSend}
            onPress={() => {
              void onSubmit();
            }}
            style={({pressed}) => ({
              width: 44,
              height: 44,
              borderRadius: theme.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSend
                ? theme.colors.accent.primary
                : theme.colors.background.elevated,
              opacity: pressed && canSend ? 0.85 : 1,
            })}>
            {commentMutation.isPending ? (
              <ActivityIndicator color={theme.colors.accent.onAccent} size="small" />
            ) : (
              <Icon
                name="send"
                size={20}
                color={
                  canSend ? theme.colors.accent.onAccent : theme.colors.text.disabled
                }
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
