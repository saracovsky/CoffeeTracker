module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NOTE: In SDK 54, Reanimated is usually auto-detected, 
      // but if animations fail, you would add 'react-native-reanimated/plugin' here.
    ],
  };
};