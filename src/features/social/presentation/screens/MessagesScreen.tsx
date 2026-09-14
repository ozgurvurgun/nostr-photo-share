import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';

export type MessagesScreenProps = NativeStackScreenProps<AppStackParamList, 'Messages'>;

export function MessagesScreen({navigation}: MessagesScreenProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <ScreenHeader title={t('messages.title')} onBack={() => navigation.goBack()} />
      <EmptyState
        title={t('messages.emptyTitle')}
        message={t('messages.emptyMessage')}
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
  });
}
