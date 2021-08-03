import _ from 'lodash';

export default app => {

    require('./SchedulePlannerApiService')(app);

    app.controller('SchedulePlannerController', function (
        $anchorScroll,
        $rootScope,
        $scope,
        SchedulePlannerApiService
    ) {

        $scope.saveLoading = false;

        $scope.defaultDate = new Date(new Date() - 1000*3600*24*3);
        $scope.successMessages = [];
        $scope.errorMessages = [];

        const setAllData = (data) => {
            let isOverloaded = false;
            for (let dataChunk of data) {
                dataChunk.initialValue = new Date(dataChunk.production_month); //Turn into a date object for date picker initial value
                isOverloaded |= dataChunk.capacity < dataChunk.total_orders;
            }
            if (isOverloaded) {
                $scope.errorMessages.push('One or more months have more orders than their allocated capacity.');
            }
            $scope.all_data = data;
            $anchorScroll('message-anchor');
        };

        SchedulePlannerApiService.getInitialData().then((data) => {
            setAllData(data.data);
            $rootScope.permissions = data.permissions;
        });

        $scope.save = () => {
            $scope.saveLoading = true;
            SchedulePlannerApiService.saveData($scope.all_data)
                .then(
                    (result) => {
                        $scope.successMessages = ['Data saved successfully'];
                        $scope.errorMessages = [];
                        setAllData(result.data);
                    },
                    (err) => {
                        let message_list = err.data;
                        if (typeof(message_list) == typeof('')) {
                            message_list = [message_list];
                        }
                        $scope.errorMessages = message_list;
                    }
                )
                .finally(() => {
                    $scope.saveLoading = false;
                })
        };
    });
}
