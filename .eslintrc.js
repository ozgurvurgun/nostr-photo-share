module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: [
        '**/__tests__/**',
        '**/*.{test,spec}.{js,ts,tsx}',
        'jest.setup.js',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
