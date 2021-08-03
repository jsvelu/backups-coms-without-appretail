var app = require("./config.js");

require('./apps/quotes/controller')(app);

app.config(($stateProvider) => {

    $stateProvider
        .state("new", {
            url: "",
            template: require("./apps/quotes/new.html"),
            controller: "QuotesController"
        });
});
