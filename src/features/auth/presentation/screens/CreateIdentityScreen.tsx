import React, {useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AuthStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Button} from '../../../../shared/ui/Button';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {useAuthSession} from '../hooks/useAuthSession';

export type CreateIdentityScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'CreateIdentity'
>;

export function CreateIdentityScreen({
  navigation,
}: CreateIdentityScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const container = useAppContainer();
  const {completeLogin} = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(): Promise<void> {
    setLoading(true);
    setError(null);
    const result = await container.createIdentity.execute();
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      container.logger.error('Create identity failed', {code: result.error.code});
      return;
    }
    await completeLogin(result.value);
  }

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
      <ScreenHeader title={t('createIdentity.title')} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        }}>
        <Text
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
          }}>
          {t('createIdentity.body')}
        </Text>

        {error ? (
          <ErrorState title={t('createIdentity.errorTitle')} message={error} onRetry={onCreate} />
        ) : null}

        <Button label={t('createIdentity.generate')} loading={loading} onPress={onCreate} />
      </ScrollView>
    </View>
  );
}
