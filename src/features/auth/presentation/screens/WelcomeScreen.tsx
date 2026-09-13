import React from 'react';
import {ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {t} from '../../../../shared/i18n';
import {Button} from '../../../../shared/ui/Button';
import type {AuthStackParamList} from '../../../../app/navigation/types';

export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({navigation}: WelcomeScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -80,
          left: -40,
          right: -40,
          height: 320,
          backgroundColor: theme.colors.background.secondary,
          opacity: 0.9,
          borderBottomLeftRadius: 48,
          borderBottomRightRadius: 48,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 40,
          alignSelf: 'center',
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: theme.colors.accent.primary,
          opacity: 0.12,
        }}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: insets.top + theme.spacing.xxl,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        }}>
        <View style={{flex: 1, justifyContent: 'center', gap: theme.spacing.sm}}>
          <Text
            accessibilityRole="header"
            accessibilityLabel={t('brand')}
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.display.fontSize + 8,
              lineHeight: theme.typography.display.lineHeight + 8,
              fontWeight: theme.typography.display.fontWeight,
              letterSpacing: theme.typography.display.letterSpacing,
            }}>
            {t('brand')}
          </Text>
          <Text
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.body.fontSize,
              lineHeight: theme.typography.body.lineHeight,
              maxWidth: 280,
            }}>
            {t('brandTagline')}
          </Text>
        </View>

        <Button
          label={t('welcome.createIdentity')}
          onPress={() => navigation.navigate('CreateIdentity')}
        />
        <Button
          label={t('welcome.importNsec')}
          variant="secondary"
          onPress={() => navigation.navigate('ImportNsec')}
        />
        <Button
          label={t('welcome.connectBunker')}
          variant="ghost"
          onPress={() => navigation.navigate('ConnectBunker')}
        />
      </ScrollView>
    </View>
  );
}
