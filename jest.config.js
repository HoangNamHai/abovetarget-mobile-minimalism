module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest-setup-mocks.js'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native(-community)?|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@gorhom|@shopify|uniwind|heroui-native|react-native-worklets|tailwind-variants|tailwind-merge|clsx))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
  moduleNameMapper: {
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
    '^react-native-worklets$': '<rootDir>/__mocks__/react-native-worklets.js',
    '^react-native-worklets/(.*)$': '<rootDir>/__mocks__/react-native-worklets.js',
  },
};
