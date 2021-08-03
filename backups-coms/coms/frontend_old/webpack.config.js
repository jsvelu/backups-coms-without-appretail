"use strict";
var configCommon = require('./webpack.config.common');
var ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var getScssLoader = (bootstrapAssetPath) => {
    return ExtractTextPlugin.extract(
        'style-loader',
        ['css-loader', 'sass-loader?includePaths[]=' + encodeURIComponent(bootstrapAssetPath) ].join('!')
    );
};
var getCssLoader = () => {
    return ExtractTextPlugin.extract(
      'style-loader',
      'css-loader?root=.'
    );
};
var config = configCommon({
    outputPath: '/dist/prod/',
    getScssLoader: getScssLoader,
    getCssLoader: getCssLoader,
    cache: false,
});

config.plugins.push(new ngAnnotatePlugin({ add: true, }));

// Copy jquery so it can be included standalone in <head> before everything else
config.plugins.push(new CopyWebpackPlugin([
    { from: './bower_components/jquery/dist/jquery.min.js', },
]));

module.exports = config;
