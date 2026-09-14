import React, {useMemo} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {formatRelativeTime} from '../../../../shared/format';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useKeyboardBottomInset} from '../../../../shared/keyboard';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {Skeleton} from '../../../../shared/ui/Skeleton';
import {useProfile} from '../../../profile/presentation/hooks/useProfile';
import type {Comment} from '../../domain/Comment';

const AVATAR = 36;

export type CommentsSheetProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly comments: readonly Comment[];
  readonly loading: boolean;
  readonly error: Error | null;
  readonly onRetry: () => void;
  readonly draft: string;
  readonly onChangeDraft: (value: string) => void;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
  readonly replyTo: Comment | null;
  readonly onReply: (comment: Comment) => void;
  readonly onCancelReply: () => void;
  readonly nowSec: number;
};

function LetterAvatar({
  label,
  size,
  styles,
}: {
  readonly label: string;
  readonly size: number;
  readonly styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={[styles.avatarFallback, {width: size, height: size}]}>
      <Text style={styles.avatarInitial}>
        {(label.slice(0, 1) || '?').toUpperCase()}
      </Text>
    </View>
  );
}

function CommentRow({
  comment,
  nowSec,
  onReply,
  styles,
  theme,
}: {
  readonly comment: Comment;
  readonly nowSec: number;
  readonly onReply: () => void;
  readonly styles: ReturnType<typeof createStyles>;
  readonly theme: Theme;
}): React.JSX.Element {
  const profile = useProfile(comment.authorPubkeyHex);
  const displayName = useMemo(() => {
    const p = profile.data;
    if (p?.displayName) {
      return p.displayName;
    }
    if (p?.name) {
      return p.name;
    }
    return `${comment.authorPubkeyHex.slice(0, 8)}...`;
  }, [profile.data, comment.authorPubkeyHex]);
  const picture = profile.data?.picture ?? '';
  const indent = comment.isTopLevel ? 0 : theme.spacing.lg;

  return (
    <View style={[styles.commentRow, {paddingLeft: theme.spacing.md + indent}]}>
      {picture.length > 0 ? (
        <CachedImage
          uri={picture}
          accessibilityLabel={t('profile.avatarA11y', {label: displayName})}
          containerStyle={styles.avatarContainer}
        />
      ) : (
        <LetterAvatar label={displayName} size={AVATAR} styles={styles} />
      )}
      <View style={styles.commentBody}>
        <Text style={styles.commentAuthor}>{displayName}</Text>
        <Text style={styles.commentText}>{comment.content}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('comments.replyAction')}
          onPress={onReply}
          hitSlop={theme.layout.hitSlop}
          style={({pressed}) => (pressed ? styles.pressed : null)}>
          <Text style={styles.replyMeta}>
            {t('comments.replyAction')} · {formatRelativeTime(comment.createdAt, nowSec)}
          </Text>
        </Pressable>
      </View>
      <Icon name="heart" size={16} color={theme.colors.text.disabled} />
    </View>
  );
}

export function CommentsSheet({
  visible,
  onClose,
  comments,
  loading,
  error,
  onRetry,
  draft,
  onChangeDraft,
  onSubmit,
  submitting,
  replyTo,
  onReply,
  onCancelReply,
  nowSec,
}: CommentsSheetProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardBottomInset();
  const keyboardLift =
    keyboardInset > 0 ? Math.max(0, keyboardInset - insets.bottom) : 0;
  const composerPad =
    keyboardLift > 0 ? theme.spacing.sm : insets.bottom + theme.spacing.sm;
  const styles = useMemo(
    () => createStyles(theme, composerPad),
    [theme, composerPad],
  );
  const canSend = draft.trim().length > 0 && !submitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.sheet,
            Platform.OS === 'android' && keyboardLift > 0
              ? {marginBottom: keyboardLift}
              : null,
          ]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('comments.title')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              hitSlop={theme.layout.hitSlop}
              style={({pressed}) => (pressed ? styles.pressed : null)}>
              <Icon name="close" size={22} color={theme.colors.text.primary} />
            </Pressable>
          </View>

          {error && comments.length === 0 ? (
            <ErrorState
              title={t('comments.loadFailed')}
              message={error.message || t('common.unknownError')}
              onRetry={onRetry}
            />
          ) : (
            <FlatList
              data={comments as Comment[]}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                loading ? (
                  <View style={styles.skeletonList}>
                    {[0, 1, 2].map(i => (
                      <View key={i} style={styles.skeletonRow}>
                        <Skeleton width={AVATAR} height={AVATAR} radius={999} />
                        <View style={styles.skeletonLines}>
                          <Skeleton width="40%" height={12} />
                          <Skeleton width="90%" height={14} />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    title={t('comments.emptyTitle')}
                    message={t('comments.emptyMessage')}
                  />
                )
              }
              renderItem={({item}) => (
                <CommentRow
                  comment={item}
                  nowSec={nowSec}
                  styles={styles}
                  theme={theme}
                  onReply={() => {
                    StillHaptics.selection();
                    onReply(item);
                  }}
                />
              )}
            />
          )}

          {replyTo ? (
            <View style={styles.replyChip}>
              <Text style={styles.replyLabel}>
                {t('comments.replyTo', {short: replyTo.authorPubkeyHex.slice(0, 8)})}
              </Text>
              <Pressable
                onPress={onCancelReply}
                accessibilityRole="button"
                accessibilityLabel={t('comments.cancelReply')}
                hitSlop={theme.layout.hitSlop}
                style={({pressed}) => (pressed ? styles.pressed : null)}>
                <Icon name="close" size={16} color={theme.colors.text.secondary} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={onChangeDraft}
              placeholder={t('comments.placeholder')}
              placeholderTextColor={theme.colors.text.disabled}
              autoFocus
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('comments.post')}
              disabled={!canSend}
              onPress={onSubmit}
              style={({pressed}) => [
                styles.send,
                pressed && canSend ? styles.pressed : null,
              ]}>
              {submitting ? (
                <ActivityIndicator color={theme.colors.accent.primary} size="small" />
              ) : (
                <Icon
                  name="send"
                  size={20}
                  color={
                    canSend ? theme.colors.accent.primary : theme.colors.text.disabled
                  }
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(theme: Theme, composerPadBottom: number) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.overlay.scrim,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    sheet: {
      maxHeight: '78%',
      minHeight: '48%',
      backgroundColor: theme.colors.background.elevated,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      overflow: 'hidden',
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border.default,
      marginTop: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    title: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: '700',
    },
    list: {
      paddingVertical: theme.spacing.sm,
      flexGrow: 1,
    },
    commentRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      paddingRight: theme.spacing.md,
      alignItems: 'flex-start',
    },
    commentBody: {
      flex: 1,
      gap: 2,
    },
    commentAuthor: {
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    commentText: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    replyMeta: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.timestamp.fontSize,
      marginTop: 4,
    },
    avatarContainer: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: theme.radius.full,
      overflow: 'hidden',
      backgroundColor: theme.colors.background.elevated,
    },
    avatarFallback: {
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      color: theme.colors.text.secondary,
      fontWeight: '700',
    },
    skeletonList: {
      gap: theme.spacing.md,
      padding: theme.spacing.md,
    },
    skeletonRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
    },
    skeletonLines: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    replyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      gap: theme.spacing.sm,
    },
    replyLabel: {
      flex: 1,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: composerPadBottom,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.default,
      backgroundColor: theme.colors.background.elevated,
    },
    input: {
      flex: 1,
      minHeight: 44,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      paddingHorizontal: theme.spacing.md,
      color: theme.colors.text.primary,
    },
    send: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
