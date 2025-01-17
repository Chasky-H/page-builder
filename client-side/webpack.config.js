const { shareAll, share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const addonConfig = require('../addon.config.json');
// const blockName = `file_${addonConfig.AddonUUID}`;
const blockName = 'page_builder';

const webpackConfig = withModuleFederationPlugin({
    name: blockName,
    filename: `${blockName}.js`,
    exposes: {
        './WebComponents': './src/bootstrap.ts',
    },
    shared: {
        ...shareAll({ strictVersion: true, requiredVersion: 'auto' }),
    }
});

module.exports = {
    ...webpackConfig,
    output: {
        ...webpackConfig.output,
        // chunkLoadingGlobal: blockName,
        uniqueName: blockName,
    }
};