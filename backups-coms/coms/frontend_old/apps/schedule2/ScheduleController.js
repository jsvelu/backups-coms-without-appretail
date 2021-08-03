export default app => {
    require('./dashboard/ScheduleDashboardController')(app);
    require('./transportdashboard/ScheduleTransportController')(app);
    require('./dashboard/DealerScheduleDashboardController')(app);
    require('./capacity/ScheduleCapacityController')(app);
    require('./planner/SchedulePlannerController')(app);
    require('./export/ScheduleExportController')(app);

    app.controller('ScheduleController', function() {
        require('./style.scss');
        require('../shared/style.scss');
    });

}