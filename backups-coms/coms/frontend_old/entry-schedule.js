var app = require("./config.js");

require('./apps/schedule/ScheduleController')(app);

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
        .when('', '/dashboard')
        .when('/capacity', ['$cookies', '$state', ($cookies, $state) => {
            $state.go('schedule.capacity', { currentMonth: getProductionCapacityCurrentMonth($cookies) }, { reload: true });
            return true;
        }])
        .when('/transportdashboard', ['$cookies', '$state', ($cookies, $state) => {
            $state.go('schedule.transportdashboard', { currentMonth: getProductionCapacityCurrentMonth($cookies) }, { reload: true });
            return true;
        }]);


    $stateProvider
    // This is deliberately *not* part of the schedule state as it appears separately in the menu and handles its own header and styles
        .state("dealer_dashboard", {
        url: "/dealer_dashboard",
        template: require("./apps/schedule/dashboard/dealer_dashboard.html"),
        controller: "DealerScheduleDashboardController",
    })

    .state("schedule", {
        abstract: true,
        // just a container for the child states; urlRouterProvider will redirect away from this
        url: "",
        template: require("./apps/schedule/schedule.html"),
        controller: "ScheduleController",
    })

    .state("schedule.dashboard", {
        url: "/dashboard",
        template: require("./apps/schedule/dashboard/dashboard.html"),
        controller: "ScheduleDashboardController",
    })

    .state("schedule.transportdashboard", {
        url: "/transportdashboard",
        template: require("./apps/schedule/transportdashboard/dashboard.html"),
        controller: "ScheduleTransportController",
    })

    .state("schedule.statusdashboard", {
        url: "/statusdashboard",
        template: require("./apps/schedule/transportdashboard/status_dashboard.html"),
        controller: "ScheduleTransportController",
    })

    .state("schedule.delaydashboard", {
        url: "/delaydashboard",
        template: require("./apps/schedule/transportdashboard/delaydashboard.html"),
        controller: "ScheduleTransportController",
    })

    .state("combinedstatusdashboard", {
        url: "/combinedstatusdashboard",
        template: require("./apps/schedule/transportdashboard/status_complete_dashboard.html"),
        controller: "ScheduleTransportController",
    })

    .state("schedule.capacity", {
        url: "/capacity/{currentMonth:date}",
        template: require("./apps/schedule/capacity/capacity.html"),
        controller: "ScheduleCapacityController",
        params: {
            currentMonth: ['$cookies', ($cookies) => getProductionCapacityCurrentMonth($cookies)]
        }
    })

    .state("schedule.planner", {
        url: "/planner",
        template: require("./apps/schedule/planner/planner.html"),
        controller: "SchedulePlannerController",
    })

    .state("schedule.export", {
        url: "/export",
        template: require("./apps/schedule/export/export.html"),
        controller: "ScheduleExportController",
    });
});