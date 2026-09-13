import React, {useEffect, useMemo} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {
  BottomTabBarButtonProps,
  BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FeedScreen} from '../../features/feed/presentation/screens/FeedScreen';
import {SearchScreen} from '../../features/profile/presentation/screens/SearchScreen';
import {ProfileScreen} from '../../features/profile/presentation/screens/ProfileScreen';
import {StillHaptics} from '../../shared/haptics/haptics';
import {t} from '../../shared/i18n';
import {useTheme} from '../../shared/theme/ThemeProvider';
import type {Theme} from '../../shared/theme/types';
import {Icon, type IconName} from '../../shared/ui/Icon';
import type {AppStackParamList, MainTabParamList} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<AppStackParamList>
>;

function TabIcon({
  name,
  focused,
  color,
}: {
  readonly name: IconName;
  readonly focused: boolean;
  readonly color: string;
}): React.JSX.Element {
  const scale = useSharedValue(focused ? 1.08 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, {damping: 14, stiffness: 220});
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <Animated.View style={[styles.tabIconWrap, animatedStyle]}>
      <Icon name={name} size={focused ? 24 : 22} color={color} />
    </Animated.View>
  );
}

function HomeTabIcon({
  color,
  focused,
}: {
  readonly color: string;
  readonly focused: boolean;
}): React.JSX.Element {
  return <TabIcon name="home" color={color} focused={focused} />;
}

function SearchTabIcon({
  color,
  focused,
}: {
  readonly color: string;
  readonly focused: boolean;
}): React.JSX.Element {
  return <TabIcon name="search" color={color} focused={focused} />;
}

function ProfileTabIcon({
  color,
  focused,
}: {
  readonly color: string;
  readonly focused: boolean;
}): React.JSX.Element {
  return <TabIcon name="user" color={color} focused={focused} />;
}

/** Placeholder route; tab press opens CreatePost on the parent stack. */
function CreateTabPlaceholder(): React.JSX.Element {
  return <View style={styles.placeholder} />;
}

function CreateTabButton({
  onPress,
  accessibilityState,
}: BottomTabBarButtonProps): React.JSX.Element {
  const theme = useTheme();
  const stylesLocal = useMemo(() => createCreateStyles(theme), [theme]);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={t('tabs.create')}
      accessibilityState={accessibilityState}
      onPressIn={() => {
        scale.value = withTiming(0.94, {duration: theme.motion.duration.micro});
      }}
      onPressOut={() => {
        scale.value = withSpring(1, {damping: 14});
      }}
      onPress={(event: GestureResponderEvent) => {
        onPress?.(event);
      }}
      style={[stylesLocal.wrap, animatedStyle]}>
      <View style={stylesLocal.fab}>
        <Icon name="plus" size={28} color={theme.colors.accent.onAccent} />
      </View>
    </AnimatedPressable>
  );
}

export function MainTabs(): React.JSX.Element {
  const theme = useTheme();
  const tabStyles = useMemo(() => createTabBarStyles(theme), [theme]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        tabBarActiveTintColor: theme.colors.accent.primary,
        tabBarInactiveTintColor: theme.colors.text.disabled,
        tabBarStyle: tabStyles.bar,
        tabBarLabelStyle: tabStyles.label,
      }}>
      <Tab.Screen
        name="Home"
        component={FeedScreen}
        listeners={{
          tabPress: () => {
            StillHaptics.tabChange();
          },
        }}
        options={{
          title: t('tabs.home'),
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        listeners={{
          tabPress: () => {
            StillHaptics.tabChange();
          },
        }}
        options={{
          title: t('tabs.search'),
          tabBarIcon: SearchTabIcon,
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateTabPlaceholder}
        listeners={({navigation}) => ({
          tabPress: event => {
            event.preventDefault();
            StillHaptics.selection();
            (navigation as TabNav).navigate('CreatePost');
          },
        })}
        options={{
          title: t('tabs.create'),
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: CreateTabButton,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        listeners={{
          tabPress: () => {
            StillHaptics.tabChange();
          },
        }}
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ProfileTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}

function createTabBarStyles(theme: Theme) {
  return StyleSheet.create({
    bar: {
      backgroundColor: theme.colors.background.primary,
      borderTopColor: theme.colors.border.default,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: theme.spacing.xxs,
      height: theme.layout.tabBarHeight + theme.spacing.sm,
    },
    label: {
      fontSize: theme.typography.badge.fontSize,
      fontWeight: theme.typography.badge.fontWeight,
      letterSpacing: 0.2,
      textTransform: 'none',
    },
  });
}

function createCreateStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      top: -10,
    },
    fab: {
      width: 52,
      height: 52,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent.primary,
      borderWidth: 3,
      borderColor: theme.colors.background.primary,
      ...theme.elevation.raised,
    },
  });
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    flex: 1,
  },
});
