import React, {useMemo} from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';
import {Icon} from './Icon';

export type SearchBarProps = Omit<TextInputProps, 'style'> & {
  readonly onClear?: () => void;
};

/** Instagram-style search field with leading magnifier. */
export function SearchBar({
  value,
  onClear,
  placeholder,
  ...rest
}: SearchBarProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hasValue = typeof value === 'string' && value.length > 0;

  return (
    <View style={styles.root}>
      <Icon name="search" size={18} color={theme.colors.text.disabled} />
      <TextInput
        {...rest}
        value={value}
        placeholder={placeholder ?? t('search.placeholder')}
        placeholderTextColor={theme.colors.text.disabled}
        style={styles.input}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />
      {hasValue && onClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClear}
          hitSlop={theme.layout.hitSlop}
          style={({pressed}) => (pressed ? styles.pressed : null)}>
          <Icon name="close" size={18} color={theme.colors.text.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minHeight: 44,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
    },
    input: {
      flex: 1,
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      paddingVertical: theme.spacing.sm,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
