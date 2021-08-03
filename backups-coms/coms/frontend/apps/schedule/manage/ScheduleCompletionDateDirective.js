export default app => {

    app.directive('scheduleCompletionDate', () => {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                who: '=who',
                date: '=date',
            },
            template: require('./schedule-completion-date.html'),
        };
    });

};

