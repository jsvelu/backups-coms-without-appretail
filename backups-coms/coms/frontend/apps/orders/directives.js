export default app => {

     app.directive('datetimepickerNeutralTimezone', function () {
        return {
            restrict: 'A',
            priority: 1,
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                ctrl.$formatters.push(function (value) {
                    if (value) {
                        var date = new Date(Date.parse(value));
                        date = new Date(date.getTime() + (60000 * date.getTimezoneOffset()));
                        return date;
                    }
                });

                ctrl.$parsers.push(function (value) {
                    if (value) {
                        var date = new Date(value.getTime() - (60000 * value.getTimezoneOffset()));
                        return date;
                    }
                    return null;
                });
            }
        };
    });

    app.directive('statusRow', function (AppSettings) {
        return {
            restrict: 'E',
            transclude: true,
            template: require('./status-row.html'),
            scope: {
                stage: '=',
                title: '@',
                permission: '=',
            },
            link: function (scope) {
                scope.AppSettings = AppSettings;  // Need to duplicate $rootScope variable for them to be accessible in directives' templates
                scope.statusClass = (stage) => {
                    if (stage) {
                        switch (stage.status) {
                            case 'Complete':
                                return 'complete';
                            case 'Optional':
                                return 'optional';
                            case 'Requires Action':
                                return 'requires-action';
                            case 'Rejected':
                                return 'rejected';
                        }
                    }
                };
            }
        };
    });

};