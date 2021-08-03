export default app => {

    app.directive('scheduleCompletionPercent', () => {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                value: '=value',
            },
            template: require('./schedule-completion-percent.html'),
        };
    });

};

