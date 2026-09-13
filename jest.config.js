module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-safe-area-context|react-native-screens|react-native-keychain|react-native-get-random-values|react-native-url-polyfill|text-encoding-polyfill|nostr-tools|@noble|@scure|@react-navigation|@tanstack)/)',
  ],
};
