import React from 'react';
import {render, screen, waitFor} from '@testing-library/react-native';
import App from '../App';

test('renders the Still welcome shell after bootstrap', async () => {
  render(<App />);

  await waitFor(() => {
    expect(screen.getByLabelText('Still')).toBeTruthy();
  });
  expect(screen.getByText(/Fotoğraflar, sakin kalsın/)).toBeTruthy();
  expect(screen.getByText('Yeni kimlik oluştur')).toBeTruthy();
});
