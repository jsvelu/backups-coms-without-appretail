export default app => {

    require('./ScheduleDashboardApiService')(app);
    require('./ScheduleDashboardService')(app);

    app.controller('DealerScheduleDashboardController', function (
        $anchorScroll,
        $cookies,
        $filter,
        $rootScope,
        $scope,
        AppSettings,
        DateProvider,
        ScheduleDashboardApiService,
        ScheduleDashboardService
    ) {
        require('../style.scss');
        require('../../shared/style.scss');

        $rootScope.permissions = {};

        $scope.monthDataLoading = false;
        $scope.searchStr = "";
        $scope.monthList = [];
        $scope.isOrderDealerCommentSaving = {};

        if ($cookies.getObject('scheduleDashboardCurrentMonth')) {
            $scope.currentMonth = new Date(Date.parse($cookies.getObject('scheduleDashboardCurrentMonth')));
            let now = DateProvider.now();
            $scope.currentMonth = new Date(now.getFullYear(), now.getMonth());
        } else {
            let now = DateProvider.now();
            $scope.currentMonth = new Date(now.getFullYear(), now.getMonth());
        }

        const initialize = (date) => {
            $scope.monthDataLoading = true;
            ScheduleDashboardApiService.getDealerInitialData(date).then((data) => {
                $scope.orderList = data.order_list;

                $rootScope.permissions = data.permissions;

                if ($scope.monthList.length == 0) {
                    for (var month_str of data.month_list) {
                        var month = new Date(Date.parse(month_str));
                        $scope.monthList.push(
                            {
                                title: $filter('date')(month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS),
                                value: month,
                            }
                        );

                        // If this month is the dashboard's current month, then set the current month to this object so that Angular can match it when comparing objects by references
                        if (ScheduleDashboardService.isSameMonth($scope.currentMonth, month)) {
                            $scope.currentMonth = month;
                        }
                    }
                }
            })
            .catch((e) => {
                if (e) {
                    $scope.errorMessages = [e.data];
                } else {
                    $scope.errorMessages = ['Error while getting the initial data.'];
                }
            })
            .finally(() => {
                $scope.monthDataLoading = false;
            });
        };

        initialize($scope.currentMonth);

        $scope.getSpecialFeatureClass = (order) => {
            return ScheduleDashboardService.getSpecialFeatureClass(order);
        };

        $scope.$watch('currentMonth', (newValue, oldValue) => {
            if (!ScheduleDashboardService.isSameMonth(newValue, oldValue)) {
                initialize(newValue);
                $cookies.putObject('scheduleDashboardCurrentMonth', newValue);
            }
        });

        $scope.onOrderDealerCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.dealer_comments;

            if (newValue == oldValue) return;

            $scope.isOrderDealerCommentSaving[order.id] = true;

            ScheduleDashboardApiService.saveDealerCommentOnOrder(order, newValue).then(() => {
                $scope.errorMessages = [];
            })
            .catch(() => {
                $scope.errorMessages = ['Error while updating the comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
            })
            .finally(() => {
                $scope.isOrderDealerCommentSaving[order.id] = false;
            });
        };

        $scope.filterOrders = (order) => {
            if (order.month_header) {
                return true;
            }

            return ScheduleDashboardService.containsCaseInsensitive(order.model_series, $scope.searchStr) ||
                ScheduleDashboardService.containsCaseInsensitive(order.customer, $scope.searchStr) ||
                ScheduleDashboardService.containsCaseInsensitive(order.chassis, $scope.searchStr) ||
                ScheduleDashboardService.containsCaseInsensitive(order.dealer_comments, $scope.searchStr);
        }

    });
}
