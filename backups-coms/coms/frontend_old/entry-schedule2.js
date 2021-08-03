var app = require("./config.js");

require('./apps/schedule2/ScheduleController')(app);

app.config(($stateProvider, $urlRouterProvider) => {

    const getProductionCapacityCurrentMonth = ($cookies) => {
        let now = new Date();
        let currentMonth = new Date(now.getFullYear(), now.getMonth());

        if ($cookies.getObject('scheduleCapacityCurrentMonth')) {
            currentMonth = new Date(Date.parse($cookies.getObject('scheduleCapacityCurrentMonth')));
        }
        return currentMonth;
    };

    $urlRouterProvider
        .when('', '/dashboard2')
        .when('/capacity2', ['$cookies', '$state', ($cookies, $state) => {
            $state.go('schedule2.capacity', { currentMonth: getProductionCapacityCurrentMonth($cookies) }, { reload: true });
            return true;
        }])
        .when('/transportdashboard2', ['$cookies', '$state', ($cookies, $state) => {
            $state.go('schedule2.transportdashboard', { currentMonth: getProductionCapacityCurrentMonth($cookies) }, { reload: true });
            return true;
        }]);


    $stateProvider
    // This is deliberately *not* part of the schedule state as it appears separately in the menu and handles its own header and styles
        .state("dealer_dashboard2", {
        url: "/dealer_dashboard2",
        template: require("./apps/schedule2/dashboard/dealer_dashboard.html"),
        controller: "DealerScheduleDashboardController",
    })

    .state("schedule2", {
        abstract: true,
        // just a container for the child states; urlRouterProvider will redirect away from this
        url: "",
        template: require("./apps/schedule2/schedule.html"),
        controller: "ScheduleController",
    })

    .state("schedule2.dashboard", {
        url: "/dashboard2",
        template: require("./apps/schedule2/dashboard/dashboard.html"),
        controller: "ScheduleDashboardController",
    })

    .state("schedule2.transportdashboard", {
        url: "/transportdashboard2",
        template: require("./apps/schedule2/transportdashboard/dashboard.html"),
        controller: "ScheduleTransportController",
    })

    .state("schedule2.statusdashboard", {
        url: "/statusdashboard2",
        template: require("./apps/schedule2/transportdashboard/status_dashboard.html"),
        controller: "ScheduleTransportController",
    })

    .state("schedule2.capacity", {
        url: "/capacity2/{currentMonth:date}",
        template: require("./apps/schedule2/capacity/capacity.html"),
        controller: "ScheduleCapacityController",
        params: {
            currentMonth: ['$cookies', ($cookies) => getProductionCapacityCurrentMonth($cookies)]
        }
    })

    .state("schedule2.planner", {
        url: "/planner2",
        template: require("./apps/schedule2/planner/planner.html"),
        controller: "SchedulePlannerController",
    })

    .state("schedule2.export", {
        url: "/export2",
        template: require("./apps/schedule2/export/export.html"),
        controller: "ScheduleExportController",
    });
});