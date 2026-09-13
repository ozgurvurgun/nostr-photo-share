import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import {Icon, type IconName} from './Icon';

export type ScreenHeaderProps = {
  readonly title: string;
  readonly onBack?: () => void;
  /** Defaults to chevron when onBack is set; use close for dismissible flows. */
  readonly backIcon?: Extract<IconName, 'chevronLeft' | 'close'>;
  readonly backAccessibilityLabel?: string;
  readonly rightLabel?: string;
  readonly onRightPress?: () => void;
  readonly rightDisabled?: boolean;
  readonly rightLoading?: boolean;
  /** When false, safe-area top padding is omitted (parent already applied it). */
  readonly includeSafeArea?: boolean;
  readonly border?: boolean;
};

/**
 * Shared top bar for stack screens - matches CreatePost / CreateStory chrome.
 */
export function ScreenHeader({
  title,
  onBack,
  backIcon = 'chevronLeft',
  backAccessibilityLabel,
  rightLabel,
  onRightPress,
  rightDisabled = false,
  rightLoading = false,
  includeSafeArea = true,
  border = true,
}: ScreenHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const canRight = Boolean(rightLabel && onRightPress);

  return (
    <View
      style={{
        paddingTop: includeSafeArea ? insets.top : 0,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: border ? 1 : 0,
        borderBottomColor: theme.colors.border.default,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.screenEdge,
          paddingVertical: theme.spacing.sm,
          minHeight: 48,
        }}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              backAccessibilityLabel ??
              (backIcon === 'close' ? t('common.close') : t('common.back'))
            }
            onPress={onBack}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => ({
              width: 40,
              alignItems: 'flex-start',
              opacity: pressed ? 0.7 : 1,
            })}>
            <Icon name={backIcon} size={24} color={theme.colors.text.primary} />
          </Pressable>
        ) : (
          <View style={{width: 40}} />
        )}

        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={{
            flex: 1,
            textAlign: 'center',
            color: theme.colors.text.primary,
            fontSize: theme.typography.heading.fontSize,
            fontWeight: theme.typography.heading.fontWeight,
          }}>
          {title}
        </Text>

        {canRight ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rightLabel}
            disabled={rightDisabled || rightLoading}
            onPress={onRightPress}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => ({
              minWidth: 40,
              alignItems: 'flex-end',
              opacity: rightDisabled || rightLoading ? 0.4 : pressed ? 0.7 : 1,
            })}>
            <Text
              style={{
                color: theme.colors.accent.primary,
                fontSize: theme.typography.body.fontSize,
                fontWeight: '700',
              }}>
              {rightLoading ? t('common.loading') : rightLabel}
            </Text>
          </Pressable>
        ) : (
          <View style={{width: 40}} />
        )}
      </View>
    </View>
  );
}
