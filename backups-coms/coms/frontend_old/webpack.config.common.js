"use strict";
const _ = require('lodash');

// to analyze webpack bundle size, set the following variable to true and then run
//   npm install -g webpack-bundle-size-analyzer
//   webpack -p --json | webpack-bundle-size-analyzer
//
// If you do this then output will be double-uglified, and node_modules will be processed
// by babel so the results will only be roughly accurate but more importantly will be significantly slower
// to build
const ANALYZE_SIZE = false;

/**
 * Get the common elements of dev/prod webpack config
 *
 * @param outputPath output path, eg '/dist/prod/' - used in both paths & URI, should contain leading and trailing /
 * @param extraPlugins extra plugins to load
 * @param getScssLoader scss loader entry
 * @returns webpack config
 */
module.exports = (options) => {
    //const {outputPath, getScssLoader, getCssLoader, cache} = options;
    const outputPath = options.outputPath;
    const getScssLoader = options.getScssLoader;
    const getCssLoader = options.getCssLoader;
    const cache = options.cache;

    const path = require('path');

    const webpack = require('webpack');
    const BundleTracker = require('webpack-bundle-tracker');
    //const StatsWriterPlugin = require('webpack-stats-plugin').StatsWriterPlugin;

    // Until https://github.com/owais/webpack-bundle-tracker/issues/4 is accepted,
    // we patch webpack-bundle-tracker to use relative paths
    var RelativeBundleTracker = function(options) {
        BundleTracker.call(this, options);
    };
    RelativeBundleTracker.prototype = Object.create(BundleTracker.prototype);
    RelativeBundleTracker.prototype.writeOutput = function(compiler, contents) {
        var relativePathRoot = path.join(__dirname) + path.sep;
        _.forIn(contents.chunks, (bundle) => {
            _.forEach(bundle, (chunk) => {
                if (chunk.path.startsWith(relativePathRoot)) {
                    chunk.path = chunk.path.substr(relativePathRoot.length);
                }
            });
        });
        //contents.relativePathRoot = relativePathRoot;
        BundleTracker.prototype.writeOutput.call(this, compiler, contents);
    };



    var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
    var ExtractTextPlugin = require("extract-text-webpack-plugin");
    var NoErrorsPlugin = webpack.NoErrorsPlugin;
    // new webpack.optimize.DedupePlugin()

    var bowerPath = path.resolve(__dirname, "./bower_components");


    var bootstrapAssetPath = path.resolve(bowerPath, "./bootstrap-sass/assets/stylesheets/");

    var bowerComponents = {
        "shared-bower-common":     ['./shared-bower-common.js'],
        "shared-bower-datatables": ['./shared-bower-datatables.js'],
        "shared-bower-highcharts": ['./shared-bower-highcharts.js'],
        "shared-bower-jqueryui":   ['./shared-bower-jqueryui.js'],
    };

    var styleComponents = {
        'shared-styles':    ['./shared-styles.js'],
    };

    var spaComponents = {
        'shared-spa':   ['./config.js'],
        'models':       ['./entry-models.js'],
        'edit_quote':   ['./entry-edit-quote.js'],
        'leads':        ['./entry-leads.js'],
        'orders':       ['./entry-orders.js'],
        'quality':      ['./entry-quality.js'],
        'quotes':       ['./entry-quotes.js'],
        'quotes-new':   ['./entry-quotes-new.js'],
        'schedule':     ['./entry-schedule.js'],
        'schedule2':    ['./entry-schedule2.js'],
        'uom':          ['./entry-uom.js'],
    };

    //
    var jsLoader = {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: [
            'babel?' + JSON.stringify({
                presets: [
                    'es2015',
                ],
                plugins: [
                    'add-module-exports',   // fix missing default exports with webpack require()
                    'transform-object-rest-spread',
                    'transform-runtime',
                    [ 'lodash-modularize', { 'lodashVersion': '4.0.0' } ],
                ],
            }),
        ],
    };

    var config = {
        cache: cache,

        entry: _.assign({}, bowerComponents, styleComponents, spaComponents),
            //'babel-polyfill',

        output: {
            path: __dirname + outputPath,
            filename: "[name].bundle.js",
            publicPath: '/static' + outputPath,
        },

        plugins: [
            new NoErrorsPlugin(), // don't reload if there is an error

            new ExtractTextPlugin("[name].styles.css"),

            new CommonsChunkPlugin({ name: 'shared-spa', filename: 'shared-spa.js', chunks: _.keys(spaComponents) }),

            new RelativeBundleTracker({ filename: '.' + outputPath + 'webpack-stats.json', indent: 2 }),

        ],

        module: {
            loaders: [
                { test: /\.html$/, loader: "raw" },
                { test: /\.css$/, loader: getCssLoader()},
                { test: /\.scss$/, loader: getScssLoader(bootstrapAssetPath) },
                { test: /\.js\?script-loader$/, loader: "script" },
                jsLoader,
                { test: /\.png$/, loader: "url-loader?mimetype=image/png" },
                { test: /\.gif$/, loader: "url-loader?mimetype=image/png" },
                { test: /\.woff2/, loader: "url-loader?mimetype=application/font-woff" },
                { test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?mimetype=application/font-woff" },
                { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader?name=[name].[ext]" },
            ],

            // added a whole bunch of files to noParse and it made things *slower* (!)
            // angular is the biggest file, just adding angular/angular.js makes no noticeable difference
        },
    };

    if (ANALYZE_SIZE) {
        // the default UglifyJS plugin operates globally, but we want to know the uglified sizes of individual
        // bundles
        // (even if output is double-uglified that doesn't really matter we just want a rough guide to size)
        jsLoader.loaders.unshift('uglify');

        //config['uglify-loader'] = { mangle: false, compress: false };

        // we want to include node_modules
        delete jsLoader.exclude;
    }

    return config;
};
