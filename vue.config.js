module.exports = {
  lintOnSave: false,

  pluginOptions: {
    express: {
      shouldServeApp: true,
      serverDir: './srv'
    },
    webpackBundleAnalyzer: {
      openAnalyzer: false
    }
  },

  configureWebpack: config => {
    config.devtool = 'source-map';
    // config.devtool = process.env.NODE_ENV === 'development' ? 'source-map' : 'none';
  },

  transpileDependencies: ['vuex-module-decorators']
};
