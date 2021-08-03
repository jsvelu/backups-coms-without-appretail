"use strict";
module.exports = function (options) {
	var webpack = require('webpack');

	var hotmod = options.hotmod;

	var getScssLoader = (bootstrapAssetPath) => {
		var ExtractTextPlugin = require("extract-text-webpack-plugin");
		// https://github.com/webpack/extract-text-webpack-plugin/issues/30
		// can't use common asset extraction with hot loading
		var styleLoader = 'style-loader';
		var cssLoaders = [
			'css-loader',
			'sass-loader?includePaths[]=' + encodeURIComponent(bootstrapAssetPath),
		].join('!');
		return (hotmod)
			? styleLoader + '!' + cssLoaders
			: ExtractTextPlugin.extract(styleLoader, cssLoaders);
	};

	var getCssLoader = () => {
		var cssLoader = 'css-loader?root=.';
		var styleLoader = 'style-loader';
		return (hotmod)
			? styleLoader + '!' + cssLoader
			: ExtractTextPlugin.extract(styleLoader, cssLoader);
	}

	var configCommon = require('./webpack.config.common');
	var config = configCommon({
		outputPath: '/dist/dev/',
		getScssLoader: getScssLoader,
		getCssLoader: getCssLoader,
		cache: true,
	});

	if (hotmod) {
		// Don't build source maps in watcher mode
		//config.devtool = 'eval-cheap-module-source-map';
		config.devtool = 'inline-source-map';
		
		var hhost = 'http://localhost:3011';
		if (process.env.LOCAL_IP_ADDR)
		    hhost = 'http://'+process.env.LOCAL_IP_ADDR+":3011";

		config.output.publicPath = hhost + config.output.publicPath;

		// TODO: Does ResolverPlugin.FileAppendPlugin effectively do this?
		for (let entry_name in config.entry) {
			config.entry[entry_name].push('webpack-dev-server/client?'+hhost);
			config.entry[entry_name].push('webpack/hot/only-dev-server');
		}

		config.plugins.push(new webpack.HotModuleReplacementPlugin());
	}

	return config;
};

