var app = require("./config.js");

require('./apps/all_uom/controller')(app);

app.config(($stateProvider) => {

    $stateProvider
        .state("all_uom", {
            url: "",
            template: require("./apps/all_uom/main.html"),
            controller: "AllUOMController"
        });
});
