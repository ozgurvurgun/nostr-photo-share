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
import {TextField} from '../../../../shared/ui/TextField';
import {useAuthSession} from '../hooks/useAuthSession';

export type ImportNsecScreenProps = NativeStackScreenProps<AuthStackParamList, 'ImportNsec'>;

export function ImportNsecScreen({navigation}: ImportNsecScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const container = useAppContainer();
  const {completeLogin} = useAuthSession();
  const [nsec, setNsec] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      setNsec('');
    };
  }, []);

  async function onImport(): Promise<void> {
    if (!acknowledged) {
      setError(t('importNsec.confirmRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    const result = await container.importNsec.execute(nsec);
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      container.logger.error('Import nsec failed', {code: result.error.code});
      setNsec('');
      return;
    }
    setNsec('');
    await completeLogin(result.value);
  }

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
      <ScreenHeader
        title={t('importNsec.title')}
        onBack={() => navigation.goBack()}
        rightLabel={t('importNsec.import')}
        onRightPress={() => {
          void onImport();
        }}
        rightDisabled={!acknowledged || nsec.trim().length === 0 || loading}
        rightLoading={loading}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        }}>
        <View
          accessibilityRole="summary"
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.state.warning,
            gap: theme.spacing.xs,
          }}>
          <Text
            style={{
              color: theme.colors.state.warning,
              fontSize: theme.typography.heading.fontSize,
              lineHeight: theme.typography.heading.lineHeight,
              fontWeight: theme.typography.heading.fontWeight,
            }}>
            {t('importNsec.securityWarning')}
          </Text>
          <Text
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.body.fontSize,
              lineHeight: theme.typography.body.lineHeight,
            }}>
            {t('importNsec.body')}
          </Text>
        </View>

        <TextField
          label={t('importNsec.nsecLabel')}
          value={nsec}
          onChangeText={setNsec}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder={t('importNsec.nsecPlaceholder')}
          errorText={undefined}
        />

        <Button
          label={
            acknowledged ? t('importNsec.confirmAcknowledged') : t('importNsec.confirmRisk')
          }
          variant={acknowledged ? 'secondary' : 'ghost'}
          onPress={() => setAcknowledged(current => !current)}
        />

        {error ? (
          <ErrorState title={t('importNsec.errorTitle')} message={error} onRetry={onImport} />
        ) : null}

        <Button
          label={t('importNsec.import')}
          loading={loading}
          disabled={!acknowledged || nsec.trim().length === 0}
          onPress={onImport}
        />
      </ScrollView>
    </View>
  );
}
