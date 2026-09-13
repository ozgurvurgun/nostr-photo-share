const mockMemory = new Map();

jest.mock('react-native-screens', () => {
  const actual = jest.requireActual('react-native-screens');
  return {
    ...actual,
    enableScreens: jest.fn(),
    enableFreeze: jest.fn(),
  };
});

jest.mock('react-native-keychain', () => {
  const ACCESSIBLE = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  };

  return {
    ACCESSIBLE,
    setGenericPassword: jest.fn(async (username, password, options = {}) => {
      const service = options.service ?? 'default';
      mockMemory.set(service, {username, password});
      return {service, storage: 'mock'};
    }),
    getGenericPassword: jest.fn(async (options = {}) => {
      const service = options.service ?? 'default';
      const entry = mockMemory.get(service);
      if (!entry) {
        return false;
      }
      return {service, username: entry.username, password: entry.password, storage: 'mock'};
    }),
    resetGenericPassword: jest.fn(async (options = {}) => {
      const service = options.service ?? 'default';
      mockMemory.delete(service);
      return true;
    }),
  };
});

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({
    didCancel: true,
    assets: [],
  })),
}));

beforeEach(() => {
  mockMemory.clear();
});
