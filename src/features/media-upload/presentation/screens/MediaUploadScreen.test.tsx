import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AppProviders} from '../../../../app/providers/AppProviders';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {MediaUploadScreen} from './MediaUploadScreen';

const mockPickAndUpload = jest.fn(async () => null);

jest.mock('../hooks/useImageUpload', () => ({
  useImageUpload: () => ({
    state: 'idle',
    progress: 0,
    attachment: null,
    localPreviewUri: null,
    errorMessage: null,
    pickAndUpload: mockPickAndUpload,
    uploadSelected: jest.fn(async () => null),
    reset: jest.fn(),
  }),
}));

const Stack = createNativeStackNavigator<AppStackParamList>();

describe('MediaUploadScreen', () => {
  beforeEach(() => {
    mockPickAndUpload.mockClear();
  });

  it('invokes pickAndUpload when choose photo is pressed', () => {
    render(
      <AppProviders scheme="dark">
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="MediaUpload"
              component={MediaUploadScreen}
              initialParams={{purpose: 'general'}}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProviders>,
    );

    expect(screen.getByText('Fotoğraf seç')).toBeTruthy();
    fireEvent.press(screen.getByText('Fotoğraf seç'));
    expect(mockPickAndUpload).toHaveBeenCalledTimes(1);
  });
});
