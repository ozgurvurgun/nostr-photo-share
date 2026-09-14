import React, {useMemo, useRef, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../../../app/navigation/types';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {Icon} from '../../../../shared/ui/Icon';
import {AuthCtaButton} from '../components/AuthCtaButton';
import {ONBOARDING_SLIDES, type OnboardingSlide} from '../onboardingSlides';

export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export function WelcomeScreen({navigation}: WelcomeScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.top, insets.bottom),
    [theme, insets.top, insets.bottom],
  );
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [index, setIndex] = useState(0);
  const lastSlide = index === ONBOARDING_SLIDES.length - 1;

  function goCreate(): void {
    StillHaptics.selection();
    navigation.navigate('CreateIdentity');
  }

  function goNext(): void {
    if (lastSlide) {
      goCreate();
      return;
    }
    StillHaptics.selection();
    listRef.current?.scrollToIndex({index: index + 1, animated: true});
  }

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={item => item.imageUri}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_data, itemIndex) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * itemIndex,
          index: itemIndex,
        })}
        renderItem={({item, index: itemIndex}) => (
          <View style={styles.page}>
            <CachedImage
              uri={item.imageUri}
              accessibilityLabel={t('welcome.slideA11y', {
                current: itemIndex + 1,
                total: ONBOARDING_SLIDES.length,
              })}
              containerStyle={styles.hero}
              resizeMode="cover"
            />
            <Svg pointerEvents="none" style={styles.fade}>
              <Defs>
                <LinearGradient id="onboardFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#12110F" stopOpacity={0} />
                  <Stop offset="0.38" stopColor="#12110F" stopOpacity={0.04} />
                  <Stop offset="0.5" stopColor="#12110F" stopOpacity={0.18} />
                  <Stop offset="0.62" stopColor="#12110F" stopOpacity={0.42} />
                  <Stop offset="0.74" stopColor="#12110F" stopOpacity={0.7} />
                  <Stop offset="0.86" stopColor="#12110F" stopOpacity={0.88} />
                  <Stop offset="1" stopColor="#12110F" stopOpacity={0.96} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#onboardFade)" />
            </Svg>
          </View>
        )}
        onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setIndex(next);
        }}
      />

      <View pointerEvents="box-none" style={styles.chrome}>
        <View style={styles.topBar}>
          <Text accessibilityRole="header" accessibilityLabel={t('brand')} style={styles.brand}>
            {t('brand')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={lastSlide ? t('welcome.start') : t('welcome.skip')}
            onPress={goCreate}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => [styles.skip, pressed ? styles.pressed : null]}>
            <Text style={styles.skipLabel}>
              {lastSlide ? t('welcome.start') : t('welcome.skip')}
            </Text>
            <Icon name="chevronRight" size={16} color="rgba(244,240,230,0.88)" />
          </Pressable>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.eyebrow}>{t(ONBOARDING_SLIDES[index]?.eyebrowKey ?? '')}</Text>
          <Text style={styles.title}>{t(ONBOARDING_SLIDES[index]?.titleKey ?? '')}</Text>
          <Text style={styles.body}>{t(ONBOARDING_SLIDES[index]?.bodyKey ?? '')}</Text>

          <View style={styles.dots}>
            {ONBOARDING_SLIDES.map((slide, dotIndex) => (
              <View
                key={slide.imageUri}
                style={[styles.dot, dotIndex === index ? styles.dotActive : null]}
              />
            ))}
          </View>

          <AuthCtaButton
            label={lastSlide ? t('welcome.createAccount') : t('welcome.continue')}
            onPress={goNext}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerMuted}>{t('welcome.hasAccount')} </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('welcome.signIn')}
              onPress={() => {
                StillHaptics.selection();
                navigation.navigate('ImportNsec');
              }}
              hitSlop={theme.layout.hitSlop}
              style={({pressed}) => (pressed ? styles.pressed : null)}>
              <Text style={styles.footerLink}>{t('welcome.signIn')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: Theme, insetTop: number, insetBottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#12110F',
    },
    page: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    },
    hero: {
      ...StyleSheet.absoluteFill,
    },
    fade: {
      ...StyleSheet.absoluteFill,
    },
    chrome: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'space-between',
    },
    topBar: {
      paddingTop: insetTop + theme.spacing.sm,
      paddingHorizontal: theme.spacing.screenEdge,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brand: {
      color: '#F4F0E6',
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      fontStyle: 'italic',
    },
    skip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    skipLabel: {
      color: 'rgba(244,240,230,0.88)',
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
    },
    bottom: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingBottom: insetBottom + theme.spacing.md,
      gap: theme.spacing.sm,
    },
    eyebrow: {
      color: theme.colors.accent.primary,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
    },
    title: {
      color: '#F4F0E6',
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      letterSpacing: -0.4,
    },
    body: {
      color: 'rgba(244,240,230,0.82)',
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: theme.spacing.sm,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: 'rgba(244,240,230,0.28)',
    },
    dotActive: {
      width: 22,
      backgroundColor: theme.colors.accent.primary,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: theme.spacing.xs,
    },
    footerMuted: {
      color: 'rgba(244,240,230,0.62)',
      fontSize: theme.typography.caption.fontSize,
    },
    footerLink: {
      color: theme.colors.accent.primary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
