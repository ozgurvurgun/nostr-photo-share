module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@d11/react-native-fast-image|react-native-safe-area-context|react-native-screens|react-native-keychain|react-native-get-random-values|react-native-url-polyfill|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-blurhash|react-native-haptic-feedback|text-encoding-polyfill|nostr-tools|@noble|@scure|@react-navigation|@tanstack)/)',
  ],
};
