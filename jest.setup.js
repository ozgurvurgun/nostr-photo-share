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
  const ACCESS_CONTROL = {
    BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BiometryAnyOrDevicePasscode',
  };

  return {
    ACCESSIBLE,
    ACCESS_CONTROL,
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
      return {
        service,
        username: entry.username,
        password: entry.password,
        storage: 'mock',
      };
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

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const {View} = require('react-native');

  const chain = () => {
    const api = {};
    const passthrough = () => api;
    [
      'activeOffsetY',
      'failOffsetX',
      'activeOffsetX',
      'failOffsetY',
      'onUpdate',
      'onEnd',
      'onStart',
      'onFinalize',
      'minDuration',
      'maxDistance',
      'numberOfTaps',
      'averageTouches',
      'enabled',
      'manualActivation',
      'onTouchesMove',
      'onTouchesDown',
      'onTouchesUp',
    ].forEach(method => {
      api[method] = passthrough;
    });
    return api;
  };

  return {
    GestureHandlerRootView: ({children, style}) =>
      React.createElement(View, {style}, children),
    State: {},
    Directions: {},
    GestureDetector: ({children}) => children ?? null,
    Gesture: {
      Tap: chain,
      Pan: chain,
      Pinch: chain,
      LongPress: chain,
      Exclusive: () => chain(),
      Simultaneous: () => chain(),
    },
  };
});

jest.mock('react-native-reanimated', () => {
  const {View} = require('react-native');
  const Animated = {
    View,
    createAnimatedComponent: Component => Component,
    Image: View,
  };
  return {
    __esModule: true,
    default: Animated,
    View,
    useSharedValue: value => ({value}),
    useAnimatedStyle: factory => factory(),
    withTiming: value => value,
    withSpring: value => value,
    withSequence: (...values) => values[values.length - 1],
    withDelay: (_ms, value) => value,
    withRepeat: value => value,
    runOnJS: fn => fn,
    Easing: {
      linear: t => t,
      out: fn => fn,
      inOut: fn => fn,
    },
    FadeIn: {},
    FadeOut: {},
  };
});

jest.mock('@d11/react-native-fast-image', () => {
  const React = require('react');
  const {Image} = require('react-native');
  const FastImage = props => React.createElement(Image, props);
  FastImage.priority = {low: 'low', normal: 'normal', high: 'high'};
  FastImage.cacheControl = {
    immutable: 'immutable',
    web: 'web',
    cacheOnly: 'cacheOnly',
  };
  FastImage.resizeMode = {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
  };
  return {__esModule: true, default: FastImage};
});

jest.mock('react-native-blurhash', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    Blurhash: props => React.createElement(View, props),
  };
});

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
  HapticFeedbackTypes: {
    selection: 'selection',
    impactLight: 'impactLight',
    impactMedium: 'impactMedium',
    impactHeavy: 'impactHeavy',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
    notificationError: 'notificationError',
  },
}));

beforeEach(() => {
  mockMemory.clear();
});
