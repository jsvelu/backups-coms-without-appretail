import _ from 'lodash';

export default app => {

    require('./ScheduleCapacityApiService')(app);

    app.controller('ScheduleCapacityController', function (
        $anchorScroll,
        $cookies,
        $filter,
        $rootScope,
        $scope,
        $state,
        $stateParams,
        AppSettings,
        ScheduleCapacityApiService
    ) {

        $scope.initialDataLoading = false;
        $scope.saveLoading = false;

        $scope.currentMonth = $stateParams.currentMonth;
        $cookies.putObject('scheduleCapacityCurrentMonth', $stateParams.currentMonth);

        $scope.monthList = [];

        const initialize = (date) => {
            /**
             * Initialises the page for the given date
             * @params date A JS `Date` object being the starting month to load
             * @type {boolean}
             */

            $scope.initialDataLoading = true;
            ScheduleCapacityApiService.getInitialData(date)
                .then((data) => {
                    $scope.weekList = data.week_list;
                    $rootScope.permissions = data.permissions;

                    if ($scope.monthList.length == 0) {
                        for (let monthStr of data.month_list) {
                            let month = new Date(Date.parse(monthStr));
                            let monthPlus5 = new Date(month);
                            monthPlus5.setMonth(monthPlus5.getMonth() + 5);

                            $scope.monthList.push(
                                {
                                    title: $filter('date')(month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS) + ' - ' + $filter('date')(monthPlus5, AppSettings.FORMAT_DATE_MONTH_SHORT_JS),
                                    value: month,
                                }
                            );

                            // If this month is the current month, then set the current month to this object so that Angular can match it when comparing objects by references
                            if (isSameMonth($scope.currentMonth, month)) {
                                $scope.currentMonth = month;
                            }
                        }
                    }

                    for (let week of $scope.weekList) {
                        $scope.$watch(() => week.days, (newDays, oldDays) => {
                            week.total_capacity = newDays.reduce( (a, b) => a + Number(b.capacity), 0);
                        }, true);
                    }
                })
                .finally(() => {
                    $scope.initialDataLoading = false;
                });
        };

        initialize($scope.currentMonth);

        $scope.$watch('currentMonth', (newValue, oldValue) => {
            if (!isSameMonth(newValue, oldValue)) {
                $state.go('schedule.capacity', {currentMonth: newValue}, {reload: true});
            }
        });

        $scope.duplicate = (dupeWeek) => {
            let index = 0;
            let week = $scope.weekList[index];
            while (week.start_label != dupeWeek.start_label && index < $scope.weekList.length) {
                index++;
                week = $scope.weekList[index];
            }

            if (index < $scope.weekList.length-1) {
                for (let i = 0 ; i < 7; i++) {
                    $scope.weekList[index+1].days[i].capacity = $scope.weekList[index].days[i].capacity;
                }
            }
        };

        $scope.save = () => {
            $scope.saveLoading = true;

            ScheduleCapacityApiService.saveData($scope.weekList)
                .then(
                    (data) => {
                        $scope.successMessages = ['Data saved successfully'];
                        $scope.errorMessages = [];
                    },
                    (err) => {
                        let messageList = err.data.message || err.data;
                        if (typeof(messageList) == typeof('')) {
                            messageList = [messageList];
                        }
                        $scope.errorMessages = messageList;
                    }
                )
                .finally(() => {
                    $anchorScroll('message-anchor');
                    $scope.saveLoading = false;
                });
        };

        const isSameMonth = (date1, date2) => {
            return date1.getFullYear() == date2.getFullYear() && date1.getMonth() == date2.getMonth()
        }
    });
}
