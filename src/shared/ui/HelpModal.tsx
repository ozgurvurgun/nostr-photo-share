import React, {useMemo} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';
import {Icon} from './Icon';

export type HelpModalProps = {
  readonly visible: boolean;
  readonly title: string;
  readonly body: string;
  readonly onClose: () => void;
};

/** Simple centered sheet for short end-user explanations. */
export function HelpModal({
  visible,
  title,
  body,
  onClose,
}: HelpModalProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.top, insets.bottom),
    [theme, insets.top, insets.bottom],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        onPress={onClose}
        style={styles.backdrop}>
        <Pressable
          accessibilityRole="summary"
          onPress={event => event.stopPropagation()}
          style={styles.sheet}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
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
          <ScrollView contentContainerStyle={styles.body}>
            {body.split('\n\n').map((paragraph, index) => (
              <Text key={`p-${index}`} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: Theme, insetTop: number, insetBottom: number) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: theme.colors.overlay.scrim,
    },
    sheet: {
      marginHorizontal: theme.spacing.screenEdge,
      marginBottom: insetBottom + theme.spacing.lg,
      marginTop: insetTop + theme.spacing.lg,
      maxHeight: '80%',
      backgroundColor: theme.colors.background.elevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      overflow: 'hidden',
      ...theme.elevation.sheet,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
    },
    title: {
      flex: 1,
      color: theme.colors.text.primary,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: theme.typography.heading.fontWeight,
      paddingRight: theme.spacing.sm,
    },
    body: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    paragraph: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
