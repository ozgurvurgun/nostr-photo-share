import React, {useCallback, useRef} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ConnectBunkerScreen} from '../../features/auth/presentation/screens/ConnectBunkerScreen';
import {CreateIdentityScreen} from '../../features/auth/presentation/screens/CreateIdentityScreen';
import {AccountScreen} from '../../features/auth/presentation/screens/AccountScreen';
import {ImportNsecScreen} from '../../features/auth/presentation/screens/ImportNsecScreen';
import {SecurityScreen} from '../../features/auth/presentation/screens/SecurityScreen';
import {WelcomeScreen} from '../../features/auth/presentation/screens/WelcomeScreen';
import {CreatePostScreen} from '../../features/feed/presentation/screens/CreatePostScreen';
import {MediaUploadScreen} from '../../features/media-upload/presentation/screens/MediaUploadScreen';
import {EditProfileScreen} from '../../features/profile/presentation/screens/EditProfileScreen';
import {ProfileScreen} from '../../features/profile/presentation/screens/ProfileScreen';
import {MessagesScreen} from '../../features/social/presentation/screens/MessagesScreen';
import {PostDetailScreen} from '../../features/social/presentation/screens/PostDetailScreen';
import {CreateStoryScreen} from '../../features/stories/presentation/screens/CreateStoryScreen';
import {StoryViewerScreen} from '../../features/stories/presentation/screens/StoryViewerScreen';
import {RelaysScreen} from '../../features/relays/presentation/screens/RelaysScreen';
import {SearchLookupScreen} from '../../features/profile/presentation/screens/SearchLookupScreen';
import {useAuthSession} from '../../features/auth/presentation/hooks/useAuthSession';
import {useDeepLinkRouting} from '../../features/auth/presentation/hooks/useDeepLinkRouting';
import {t} from '../../shared/i18n';
import {useTheme} from '../../shared/theme/ThemeProvider';
import {Button} from '../../shared/ui/Button';
import {ErrorState} from '../../shared/ui/ErrorState';
import {linking, type DeepLinkRoute} from './linking';
import {MainTabs} from './MainTabs';
import type {AppStackParamList, AuthStackParamList, RootStackParamList} from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

function AuthNavigator(): React.JSX.Element {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="CreateIdentity" component={CreateIdentityScreen} />
      <AuthStack.Screen name="ImportNsec" component={ImportNsecScreen} />
      <AuthStack.Screen name="ConnectBunker" component={ConnectBunkerScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator(): React.JSX.Element {
  return (
    <AppStack.Navigator screenOptions={{headerShown: false}}>
      <AppStack.Screen name="MainTabs" component={MainTabs} />
      <AppStack.Screen name="CreatePost" component={CreatePostScreen} />
      <AppStack.Screen name="CreateStory" component={CreateStoryScreen} />
      <AppStack.Screen name="StoryViewer" component={StoryViewerScreen} />
      <AppStack.Screen name="Account" component={AccountScreen} />
      <AppStack.Screen name="Security" component={SecurityScreen} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="EditProfile" component={EditProfileScreen} />
      <AppStack.Screen name="MediaUpload" component={MediaUploadScreen} />
      <AppStack.Screen name="PostDetail" component={PostDetailScreen} />
      <AppStack.Screen name="Messages" component={MessagesScreen} />
      <AppStack.Screen name="SearchLookup" component={SearchLookupScreen} />
      <AppStack.Screen name="Relays" component={RelaysScreen} />
    </AppStack.Navigator>
  );
}

export function RootNavigator(): React.JSX.Element {
  const theme = useTheme();
  const {identity, isRestoring, restoreError, retryRestore, clearSession} = useAuthSession();
  const pendingBunkerUri = useRef<string | null>(null);

  const navigateToBunker = useCallback((uri: string) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Auth', {
        screen: 'ConnectBunker',
        params: {uri},
      });
      return;
    }
    pendingBunkerUri.current = uri;
  }, []);

  const onDeepLink = useCallback(
    (route: DeepLinkRoute) => {
      if (route.type === 'bunker' || route.type === 'nostrconnect') {
        navigateToBunker(route.uri);
      }
      // nprofile/nevent reserved for later phases
    },
    [navigateToBunker],
  );

  useDeepLinkRouting({onRoute: onDeepLink});

  if (isRestoring) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background.primary,
        }}>
        <ActivityIndicator color={theme.colors.accent.primary} />
      </View>
    );
  }

  if (restoreError && identity === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: theme.colors.background.primary,
          padding: theme.spacing.screenEdge,
          gap: theme.spacing.md,
        }}>
        <ErrorState
          title={t('session.restoreFailed')}
          message={restoreError}
          onRetry={() => {
            void retryRestore();
          }}
        />
        <Button
          label={t('session.clearAndContinue')}
          variant="secondary"
          onPress={() => {
            void clearSession();
          }}
        />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        if (pendingBunkerUri.current) {
          const uri = pendingBunkerUri.current;
          pendingBunkerUri.current = null;
          navigateToBunker(uri);
        }
      }}>
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {identity ? (
          <RootStack.Screen name="App" component={AppNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
