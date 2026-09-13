import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import {Icon} from './Icon';

export type TextFieldProps = TextInputProps & {
  readonly label: string;
  readonly errorText?: string;
  /** Shows a help (?) control next to the label. */
  readonly onHelpPress?: () => void;
  readonly helpAccessibilityLabel?: string;
};

export function TextField({
  label,
  errorText,
  onHelpPress,
  helpAccessibilityLabel,
  style,
  ...rest
}: TextFieldProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
          marginBottom: theme.spacing.xs,
        }}>
        <Text
          style={{
            flexShrink: 1,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.label.fontSize,
            lineHeight: theme.typography.label.lineHeight,
            fontWeight: theme.typography.label.fontWeight,
            letterSpacing: theme.typography.label.letterSpacing,
            textTransform: theme.typography.label.textTransform,
          }}>
          {label}
        </Text>
        {onHelpPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              helpAccessibilityLabel ?? t('common.helpA11y', {topic: label})
            }
            onPress={onHelpPress}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}>
            <Icon name="help" size={18} color={theme.colors.text.secondary} />
          </Pressable>
        ) : null}
      </View>
      <TextInput
        placeholderTextColor={theme.colors.text.disabled}
        style={[
          {
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.background.elevated,
            borderColor: errorText ? theme.colors.state.error : theme.colors.border.default,
            borderWidth: 1,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
            minHeight: 48,
          },
          style,
        ]}
        {...rest}
      />
      {errorText ? (
        <Text
          style={{
            marginTop: theme.spacing.xs,
            color: theme.colors.state.error,
            fontSize: theme.typography.caption.fontSize,
            lineHeight: theme.typography.caption.lineHeight,
          }}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
