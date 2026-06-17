module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native(-community)?|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@gorhom|@shopify|uniwind|heroui-native|react-native-worklets|tailwind-variants|tailwind-merge|clsx))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
};
