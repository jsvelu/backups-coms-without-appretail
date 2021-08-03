var app = require("./config.js");

require('./apps/quotes/controller')(app);

app.config(($stateProvider) => {

    $stateProvider
        .state("quote", {
            url: "",
            template: require("./apps/quotes/main.html"),
            controller: "QuotesController"
        });
});
