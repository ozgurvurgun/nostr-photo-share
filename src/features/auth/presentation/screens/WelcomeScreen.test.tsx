import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AppProviders} from '../../../../app/providers/AppProviders';
import type {AuthStackParamList} from '../../../../app/navigation/types';
import {WelcomeScreen} from './WelcomeScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

describe('WelcomeScreen', () => {
  it('renders Still branding and onboarding actions', () => {
    render(
      <AppProviders scheme="dark">
        <NavigationContainer>
          <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProviders>,
    );

    expect(screen.getByLabelText('Still')).toBeTruthy();
    expect(screen.getByText('Devam et')).toBeTruthy();
    expect(screen.getByText('Giriş yap')).toBeTruthy();
  });

  it('navigates to CreateIdentity when skip is pressed', () => {
    const onCreateIdentity = jest.fn();

    function CreateIdentityStub(): React.JSX.Element {
      onCreateIdentity();
      return null as unknown as React.JSX.Element;
    }

    render(
      <AppProviders scheme="dark">
        <NavigationContainer>
          <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="CreateIdentity" component={CreateIdentityStub} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProviders>,
    );

    fireEvent.press(screen.getByLabelText('Atla'));
    expect(onCreateIdentity).toHaveBeenCalled();
  });
});
