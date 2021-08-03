var app = require("./config.js");

require('./apps/edit_quote/controller')(app);

app.config(($stateProvider) => {

    $stateProvider
        .state("edit_quote", {
            url: "",
            template: require("./apps/edit_quote/edit.html"),
            controller: "EditQuoteController"
        });
});
