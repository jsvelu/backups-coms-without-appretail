var app = require("./config.js");

require('./apps/leads/controller')(app);

app.config(($stateProvider) => {

    $stateProvider
        .state("leads", {
            url: "",
            template: require("./apps/leads/register.html"),
            controller: "LeadsController"
        });
});
