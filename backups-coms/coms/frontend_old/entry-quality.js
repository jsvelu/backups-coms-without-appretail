var app = require("./config.js");

require('./apps/quality_assurance/QAController')(app);

app.config(($stateProvider, $urlRouterProvider) => {

    //$urlRouterProvider.otherwise("/production");

    $stateProvider
        .state("quality", {
            url: "/:orderId",
            template: require("./apps/quality_assurance/qa.html"),
            controller: "QAController",
            abstract: true
        })
        .state("quality.production", {
            url: "/production",
            template: require("./apps/quality_assurance/qaproduction.html"),
            controller: "QAController"
        })
        .state("quality.production.expanded", {
            url: "/{visibleGroups:[0-9,-]*}/{hiddenVerified:[0-9,-]*}",
            template: require("./apps/quality_assurance/production-expanded.html"),
            controller: "ProductionControllerExpanded",
        })
        .state("quality.quality", {
            url: "/quality",
            template: require("./apps/quality_assurance/qaproduction.html"),
            controller: "QAController"
        })
        .state("quality.quality.expanded", {
            url: "/{visibleGroups:[0-9,-]*}/{hiddenVerified:[0-9,-]*}",
            template: require("./apps/quality_assurance/production-expanded.html"),
            controller: "ProductionControllerExpanded",
        })
});
