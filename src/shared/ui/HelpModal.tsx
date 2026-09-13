import React from 'react';
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
        style={[
          styles.backdrop,
          {backgroundColor: 'rgba(18, 17, 15, 0.72)'},
        ]}>
        <Pressable
          accessibilityRole="summary"
          onPress={event => event.stopPropagation()}
          style={{
            marginHorizontal: theme.spacing.screenEdge,
            marginBottom: insets.bottom + theme.spacing.lg,
            marginTop: insets.top + theme.spacing.lg,
            maxHeight: '80%',
            backgroundColor: theme.colors.background.elevated,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.border.default,
            overflow: 'hidden',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.default,
            }}>
            <Text
              accessibilityRole="header"
              style={{
                flex: 1,
                color: theme.colors.text.primary,
                fontSize: theme.typography.heading.fontSize,
                fontWeight: theme.typography.heading.fontWeight,
                paddingRight: theme.spacing.sm,
              }}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              hitSlop={theme.layout.hitSlop}
              style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}>
              <Icon name="close" size={22} color={theme.colors.text.primary} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{
              padding: theme.spacing.md,
              gap: theme.spacing.sm,
            }}>
            {body.split('\n\n').map((paragraph, index) => (
              <Text
                key={`p-${index}`}
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.body.fontSize,
                  lineHeight: theme.typography.body.lineHeight,
                }}>
                {paragraph}
              </Text>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
  },
});
