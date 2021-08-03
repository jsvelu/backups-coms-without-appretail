export default app => {

    app.directive('scheduleCompletionOverride', () => {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                saveCompletionOverride: '&saveCompletionOverride',
                checklistCompletion: '=checklistCompletion',
            },
            template: require('./schedule-completion-override.html'),
            link: ($scope, $element, $attrs) => {
                $scope.invokeSetCompletionOverride = (overrideValue) => {
                    if (overrideValue == null) {
                        $scope.checklistCompletion.value = $scope.checklistCompletion.originalValue;
                        $scope.checklistCompletion.isOverride = false;
                    } else {
                        $scope.checklistCompletion.value = overrideValue;
                        $scope.checklistCompletion.isOverride = true;
                    }

                    $scope.saveCompletionOverride({overrideValue: overrideValue});
                };
            },
        };
    });

};

