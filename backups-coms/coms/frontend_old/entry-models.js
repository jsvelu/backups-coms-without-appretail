var app = require("./config.js");

require('lodash');
require('./apps/models/controller')(app);

app.config(($stateProvider) => {

	$stateProvider
		.state("models", {
			url: "",
			template: require("./apps/models/models.html"),
			controller: "ModelsController"
		});
});
