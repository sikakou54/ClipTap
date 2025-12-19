module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@adapters': './src/adapters',
            '@components': './src/components',
            '@utils': './src/utils',
            '@mobile-types': './src/types',
            '@constants': './src/constants',
            '@providers': './src/providers',
            '@database': './src/database',
            '@i18n': './src/i18n',
            '@app': './app',
            '@assets': './assets',
            '@lib': './src',
            '@src': './src',
            '@root': './',
          },
        },
      ],
    ],
  };
};
