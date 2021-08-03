export default app => {

    app.directive('scheduleBuildPriority', (ScheduleReferenceDataService) => {
        return {
            restrict: 'E',
            replace: true,
            require: 'ngModel',
            template: require('./schedule-build-priority.html'),
            link: ($scope, $element, $attrs, ngModel) => {
                $scope.refData = ScheduleReferenceDataService;

                $scope.s = {};

                var buildPriorityId = ngModel.$viewValue || null;
                $scope.s.buildPriority = $scope.refData.buildPrioritiesLookup[buildPriorityId];

                // we are going to change the value
                $scope.onSelect = ($item) => {
                    if ($item.priorityId == buildPriorityId) return;

                    buildPriorityId = $item.priorityId;
                    ngModel.$setViewValue(buildPriorityId);
                    $scope.s.buildPriority = $scope.refData.buildPrioritiesLookup[buildPriorityId];
                    $scope.$apply();
                };

                // was changed by an external event
                ngModel.$render = () => {
                    buildPriorityId = ngModel.$viewValue;
                    $scope.s.buildPriorityId = $scope.refData.buildPrioritiesLookup[buildPriorityId];
                }
            },
        };
    });

};

