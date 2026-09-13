import React from 'react';
import {View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FeedScreen} from '../../features/feed/presentation/screens/FeedScreen';
import {SearchScreen} from '../../features/profile/presentation/screens/SearchScreen';
import {ProfileScreen} from '../../features/profile/presentation/screens/ProfileScreen';
import {t} from '../../shared/i18n';
import {useTheme} from '../../shared/theme/ThemeProvider';
import {Icon, type IconName} from '../../shared/ui/Icon';
import type {AppStackParamList, MainTabParamList} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

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
  return (
    <View style={{alignItems: 'center', justifyContent: 'center'}}>
      <Icon name={name} size={focused ? 24 : 22} color={color} />
    </View>
  );
}

/** Placeholder route; tab press opens CreatePost on the parent stack. */
function CreateTabPlaceholder(): React.JSX.Element {
  return <View style={{flex: 1}} />;
}

export function MainTabs(): React.JSX.Element {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        tabBarActiveTintColor: theme.colors.accent.primary,
        tabBarInactiveTintColor: theme.colors.text.disabled,
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopColor: theme.colors.border.default,
          borderTopWidth: 1,
          paddingTop: theme.spacing.xxs,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          textTransform: 'none',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={FeedScreen}
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="search" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateTabPlaceholder}
        listeners={({navigation}) => ({
          tabPress: event => {
            event.preventDefault();
            (navigation as TabNav).navigate('CreatePost');
          },
        })}
        options={{
          title: t('tabs.create'),
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="plus" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
