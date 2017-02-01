const webpack = require('webpack')
const path = require('path')
const LiveReloadPlugin = require('webpack-livereload-plugin')
const deps = require('./package.json').dependencies
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (env) => {
    const IS_PROD = env == 'prod'

    return {
        entry: {
            main: './src/main.tsx',
            //vendor: []
        },

        output: {
            path: './dist',
            filename: IS_PROD ? '[name].[hash].js' : '[name].js',
        },

        module: {
            rules: [
                {
                    test: /.js$/,
                    use: [
                        {
                            loader: 'buble-loader',
                            options: {
                                objectAssign: 'Object.assign'
                            }
                        },
                        'remove-flow-types-loader',
                    ],
                    include: [
                        path.join(__dirname, 'src'),
                    ],
                },
                {
                    test: /.tsx?$/,
                    use: [
                        {
                            loader: 'ts-loader',
                        },
                    ],
                    include: [
                        path.join(__dirname, 'src'),
                    ],
                }
            ]
        },

        resolve: {
            extensions: ['.js', '.ts'],
        },

        performance: {
        maxEntrypointSize: 400000,
        maxAssetSize: 300000
        },

        plugins: [
            new webpack.optimize.CommonsChunkPlugin({
                names: ['vendor', 'manifest'],
            }),
            new HtmlWebpackPlugin({
                template: 'index.ejs',
                filename: 'index.html',
                chunks: ['main', 'vendor', 'manifest'],
            }),
            new LiveReloadPlugin({
                appendScriptTag: true,
            }),
        ],

        devtool: 'inline-source-map'
    }
}