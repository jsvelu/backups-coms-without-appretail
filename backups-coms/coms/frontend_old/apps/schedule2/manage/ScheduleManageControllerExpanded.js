import _ from 'lodash';

export default app => {

    require('./ScheduleBuildPriorityDirective')(app);
    require('./ScheduleCompletionDateDirective')(app);
    require('./ScheduleCompletionOverrideDirective')(app);
    require('./ScheduleCompletionPercentDirective')(app);

    app.controller('ScheduleManageControllerExpanded', function (
        $scope,
        $state,
        $stateParams,
        StateChangeAdvancedService
    ) {
        // ------------------------
        // Selection of week to expand
        (() => {
            var weekVisibility = {};

            for (let weekKey of $stateParams.visibleWeeks.split(',')) {
                if (weekKey) weekVisibility[weekKey] = true;
            }

            $scope.$on('scheduleOrdersUpdated', () => {
                var validWeekKeys = _.keyBy($scope.weeks, 'weekKey');
                for (let weekKey in weekVisibility) {
                    if (validWeekKeys[weekKey] === undefined) delete weekVisibility[weekKey];
                }
            });

            $scope.isWeekVisible = (weekKey) => {
                return weekVisibility[weekKey];
            };

            $scope.toggleWeekVisibility = (weekKey) => {
                weekVisibility[weekKey] = !weekVisibility[weekKey];
                var newVisibleWeeks = [];
                _.forOwn(weekVisibility, (value, key) => {
                    if (value) newVisibleWeeks.push(key);
                });
                newVisibleWeeks.sort();
                newVisibleWeeks = newVisibleWeeks.join(',');
                $state.go($state.current,
                    { visibleWeeks: newVisibleWeeks },
                    { location: 'replace' }
                );
            };
        })();

        // ------------------------
        // Table column visibility

        (() => {
            $scope.showColumns = {};
            $scope.showColumns.dates = false;
            $scope.showColumns.details = false;
            $scope.showColumns.drawing = false;
            $scope.showColumns.production = false;
            $scope.showColumns.quality = false;
            $scope.showColumns.notes = false;

            // chars to use to encode true/false
            // don't make these look like numbers or they may get interpreted as ints and dropped
            var trueChar = '!';
            var falseChar = '.';

            // This handles up to 6 column sets; if you add another you'll need to update it
            var decodeColumns = (x) => {
                var keys = _.keys($scope.showColumns); keys.sort();
                var result = {};
                for (let i = 0; i < keys.length; i++) {
                    result[keys[i]] = x[i] == trueChar;
                }
                return result;
            };
            var encodeColumns = (encodeState) => {
                var keys = _.keys($scope.showColumns); keys.sort();
                var result = "";
                for (let i = 0; i < keys.length; i++) {
                    result += encodeState[keys[i]] ? trueChar : falseChar;
                }
                result = _.trimEnd(result, falseChar);
                return result;
            };

            var initialValue = $stateParams.visibleColumns;
            if (initialValue == '') initialValue = trueChar;
            _.assign($scope.showColumns, decodeColumns(initialValue));

            // at least one section should always be visible
            $scope.$watch(
                (scope) => encodeColumns(scope.showColumns),
                (encoded) => {
                    if (encoded == "") {
                        // this will trigger another $digest round
                        $scope.showColumns.dates = true;

                    } else if (encoded != $stateParams.visibleColumns) {
                        StateChangeAdvancedService.goNoReload($state, $stateParams, { visibleColumns: encoded });
                        //$state.go($state.current, { visibleColumns: encoded});
                    }
                }
            );

        })();
    });
}