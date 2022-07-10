const { shareAll, share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const filename = 'page_builder';

const webpackConfig = withModuleFederationPlugin({
    name: filename,
    filename: `${filename}.js`,
    exposes: {
        './SettingsModule': './src/app/components/settings/index.ts',
        './PageBuilderModule': './src/app/components/page-builder/index.ts'
    },
    shared: {
        ...shareAll({ strictVersion: true, requiredVersion: 'auto' }),
    }
});

module.exports = {
    ...webpackConfig,
    output: {
        publicPath: 'auto', // production server,
        uniqueName: filename,
    },
};