import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Icon} from '../../../../shared/ui/Icon';

export type AuthWizardHeaderProps = {
  readonly onBack: () => void;
  readonly step?: number;
  readonly total?: number;
};

export function AuthWizardHeader({
  onBack,
  step,
  total,
}: AuthWizardHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const progress =
    step !== undefined && total !== undefined && total > 0 ? step / total : 0;
  const styles = useMemo(
    () => createStyles(theme, insets.top, progress),
    [theme, insets.top, progress],
  );

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={theme.layout.hitSlop}
          onPress={() => {
            StillHaptics.selection();
            onBack();
          }}
          style={({pressed}) => [styles.side, pressed ? styles.pressed : null]}>
          <Icon name="chevronLeft" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.brand}>
          {t('brand')}
        </Text>
        <View style={styles.sideEnd}>
          {step !== undefined && total !== undefined ? (
            <Text style={styles.step}>
              {t('createIdentity.stepOf', {current: step, total})}
            </Text>
          ) : null}
        </View>
      </View>
      {step !== undefined && total !== undefined ? (
        <View style={styles.track}>
          <View style={styles.fill} />
        </View>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

function createStyles(theme: Theme, paddingTop: number, progress: number) {
  return StyleSheet.create({
    root: {
      paddingTop,
      paddingHorizontal: theme.spacing.screenEdge,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
    },
    side: {
      width: theme.layout.headerControlSize,
      height: theme.layout.headerControlSize,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    sideEnd: {
      width: 48,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    brand: {
      flex: 1,
      textAlign: 'center',
      color: theme.colors.text.primary,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      fontStyle: 'italic',
    },
    step: {
      color: theme.colors.accent.primary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '700',
    },
    track: {
      height: 3,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.border.default,
      overflow: 'hidden',
      marginTop: theme.spacing.xs,
    },
    fill: {
      width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
      height: '100%',
      backgroundColor: theme.colors.accent.primary,
    },
    spacer: {
      height: theme.spacing.xs,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
