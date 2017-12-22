'use strict';

// --- dependencies
const webpack = require('webpack');
const path = require('path');
const StatsPlugin = require('webpack-stats-plugin').StatsWriterPlugin;
const HappyPack = require('happypack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

// --- Environment
const component = process.env.npm_config_component;

if (!component) {
    throw Error(`
        Bad command.
        Component name is missing. Try: component=folder_name
     `);
}

const NODE_ENV = process.env.NODE_ENV;
const isProduction = (NODE_ENV === 'production');

// --- Filename
const filename = process.env.npm_config_filename || 'main';
const entry = path.resolve(__dirname, `${component}/${filename}.js`);

// --- Paths
const basePath = path.resolve(__dirname, component);
const devPath = `${basePath}\\dev`;
const buildPath =`${basePath}\\src`;

// --- Base Webpack configuration
const config = {
    entry: entry,

    output: {
        path: (isProduction) ? buildPath : devPath,
        filename: filename + ((isProduction) ? '.min.js' : '.js')
    },

    devtool: (isProduction) ? false : 'cheap-module-inline-source-map',

    performance: { hints: false },

    stats: { children: false },

    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    'postcss-loader'
                ]
            },
            {
                test: /\.vue$/,
                use: {
                    loader: 'vue-loader',
                    options: {
                        postcss: [
                            require('postcss-cssnext')(),
                            require('postcss-nested')(),
                            require('postcss-simple-vars'),
                            require('postcss-mixins')
                        ],
                        autoprefixer: { browsers: ['last 2 versions'] }
                    }
                }
            },
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'happypack/loader'
                }
            }
        ]
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env': { NODE_ENV: JSON.stringify(NODE_ENV) }
        }),
        new HappyPack({
            loaders: ['babel-loader?presets[]=latest']
        }),
        new StatsPlugin({
            filename: 'manifest.json',
        })
    ],

    resolve: {
        extensions: ['.js', '.vue'],
        modules: ['node_modules'],
        alias: {
            vue: 'vue\\dist\\vue.js'
        }
    }
};

// --- Production plugins
if (isProduction) {
    config.plugins.push(
        new webpack.optimize.ModuleConcatenationPlugin(),
        new UglifyJSPlugin({ parallel: true }),
        new OptimizeCSSPlugin({ cssProcessorOptions: { safe: true } }),
        new webpack.LoaderOptionsPlugin({
            debug: false,
            options: {

            }
        }),
        new CompressionPlugin()
    )
}

module.exports = config;