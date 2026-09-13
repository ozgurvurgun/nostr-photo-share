import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AppProviders} from '../../../../app/providers/AppProviders';
import type {AuthStackParamList} from '../../../../app/navigation/types';
import {WelcomeScreen} from './WelcomeScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

describe('WelcomeScreen', () => {
  it('renders Still branding and auth actions', () => {
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
    expect(screen.getByText('Yeni kimlik oluştur')).toBeTruthy();
    expect(screen.getByText('Gizli anahtar ile giriş')).toBeTruthy();
    expect(screen.getByText('Uzak imzalayıcı bağla')).toBeTruthy();
  });

  it('navigates to CreateIdentity when primary action is pressed', () => {
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

    fireEvent.press(screen.getByText('Yeni kimlik oluştur'));
    expect(onCreateIdentity).toHaveBeenCalled();
  });
});
