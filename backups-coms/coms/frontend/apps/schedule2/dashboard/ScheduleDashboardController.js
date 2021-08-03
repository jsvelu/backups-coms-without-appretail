export default app => {

    require('./ScheduleDashboardApiService')(app);
    require('./ScheduleDashboardService')(app);

    app.controller('ScheduleDashboardController', function(
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
        $rootScope.permissions = {};

        $scope.monthDataLoading = false;
        $scope.assignProductionDatesLoading = false;
        $scope.orderCommentLoading = {};
        $scope.orderSortLoading = {};
        $scope.searchStr = "";
        $scope.monthList = [];
        $scope.ordersSelected = [];
        $scope.production_unit = [];
        $scope.sortableOptions = {
            axis: 'y',
            containment: '#dashboard .content table tbody, #dashboard .content table tfoot',
            forceHelperSize: true,
            forcePlaceholderSize: true,
            handle: '.drag-handle',
            placeholder: 'sortable-placeholder',
            helper: (e, tr) => {
                let originals = tr.children();
                let helper = tr.clone();
                helper.children().each((index, element) => {
                    // Set helper cell sizes to match the original sizes
                    $(element).width(originals.eq(index).outerWidth());
                });
                return helper;
            },
            stop: (event, ui) => {
                let oldPosition = ui.item.sortable.index;
                let newPosition = ui.item.sortable.dropindex;
                let order = ui.item.sortable.model;

                if (!('dropindex' in ui.item.sortable)) return; // Item wasn't moved

                // Determine the month within which the item was dropped, as well as the new position relative to their respective months
                // and the id of the previous and next order for database consistency check
                let newMonth;
                let newPositionInMonth = newPosition;
                let previousOrderId;
                let nextOrderId;

                let currentMonth;
                let currentMonthIndex;
                for (let i = 0; i < $scope.orderList.length; i++) {
                    let orderItem = $scope.orderList[i];

                    // Current item is a month header: keep the index
                    if (orderItem.month_header) {
                        currentMonth = orderItem.month;
                        currentMonthIndex = i;
                    }

                    if (orderItem.id == order.id) {
                        newPositionInMonth -= currentMonthIndex;
                        newMonth = currentMonth;
                        if (i + 1 < $scope.orderList.length) {
                            nextOrderId = $scope.orderList[i + 1].id
                        }
                        break;
                    }
                    previousOrderId = orderItem.id;
                }

                $scope.orderSortLoading[order.id] = true;

                ScheduleDashboardApiService.updateOrderPosition($scope.currentMonth, order, newMonth, newPositionInMonth, previousOrderId, nextOrderId).then((data) => {
                        $scope.orderList = data.order_list;
                        $scope.errorMessages = [];
                    })
                    .catch((e) => {
                        if (e) {
                            $scope.errorMessages = [e.data];
                        } else {
                            $scope.errorMessages = ['Error while updating the orders. Please reload the page.'];
                        }
                    })
                    .finally(() => {
                        $scope.orderSortLoading[order.id] = false;
                    });
            },
        };

        let now = DateProvider.now();
        $scope.currentMonth = new Date(now.getFullYear(), now.getMonth());

        const initialize = (date) => {
            $scope.monthDataLoading = true;
            ScheduleDashboardApiService.getInitialData(date).then((data) => {
                    $scope.orderList = data.order_list;

                    $scope.lockdownMonth = data.lockdown_month;
                    $scope.lockdownNumber = data.lockdown_number;

                    $rootScope.permissions = data.permissions;

                    if ($scope.monthList.length == 0) {
                        for (var month_str of data.month_list) {
                            var month = new Date(Date.parse(month_str));
                            $scope.monthList.push({
                                title: $filter('date')(month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS),
                                value: month,
                            });

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

        $('#chosen_month_show').MonthPicker({
            Button: false,
            MonthFormat: 'M yy',
            SelectedMonth: 0,
            AltFormat: "yy-mm-dd",
            AltField: '#chosen_month',
            OnAfterMenuClose: function() { $('#chosen_month').trigger('input'); }
        });

        $scope.$watch('currentMonth', (newValue, oldValue) => {
            if (!(newValue instanceof Date)) {
                newValue = new Date(Date.parse(newValue));
            }
            if (!(oldValue instanceof Date)) {
                oldValue = new Date(Date.parse(oldValue));
            }
            if (!ScheduleDashboardService.isSameMonth(newValue, oldValue)) {
                initialize(newValue);
            }
        });

        $scope.getStatusClass = (status) => {
            if (status == 'plans_completed')
                return 'summary_plans_completed';
            return status;
        };

        $scope.getOrderSummarySorted = (summary) => {
            /* Sort the summary in an order to displayed in dashboard summary
              So that summary is displayed as Red, Orange, Yellow, Green and White*/

            var result = Object();

            if ('not_finalized' in summary)
                result['not_finalized'] = summary['not_finalized'];

            if ('pending_draft' in summary)
                result['pending_draft'] = summary['pending_draft'];

            if ('pending_customer' in summary)
                result['pending_customer'] = summary['pending_customer'];

            if ('customer_approved' in summary)
                result['customer_approved'] = summary['customer_approved'];

            if ('plans_completed' in summary)
                result['plans_completed'] = summary['plans_completed'];

            return result;
        };

        $scope.getSpecialFeatureClass = (order) => {
            return ScheduleDashboardService.getSpecialFeatureClass(order);
        };

        $scope.onOrderCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.schedule_comments;

            if (newValue == oldValue) return;

            $scope.orderCommentLoading[order.id] = true;

            ScheduleDashboardApiService.saveCommentOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating the comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.orderCommentLoading[order.id] = false;
                });
        };

        $scope.isSortingAllowed = () => {
            return $scope.permissions.change_schedule_dashboard;
        };

        $scope.hasSequenceChangeInProgress = () => {
            return !Object.values($scope.orderSortLoading).every(v => !v);
        };

        $scope.isSortingAvailable = () => {
            return !$scope.searchStr && !$scope.hasSequenceChangeInProgress() && !$scope.moveCmdInitiated;
        };

        $scope.isOrderMovingButtonAvailable = () => {
            return !$scope.hasSequenceChangeInProgress() && !$scope.moveCmdInitiated;
        };

        $scope.filterOrders = (order) => {
            if (order.month_header) {
                return true;
            }

            return ScheduleDashboardService.containsCaseInsensitive(order.model_series, $scope.searchStr) ||
                ScheduleDashboardService.containsCaseInsensitive(order.dealership, $scope.searchStr) ||
                ScheduleDashboardService.containsCaseInsensitive(order.customer, $scope.searchStr) ||
                ScheduleDashboardService.containsCaseInsensitive(order.chassis, $scope.searchStr) ||
                ScheduleDashboardService.containsCaseInsensitive(order.order_id, $scope.searchStr) ||
                ScheduleDashboardService.containsCaseInsensitive(order.schedule_comments, $scope.searchStr);
        };


        $scope.assignProductionDates = () => {
            $scope.assignProductionDatesLoading = true;

            ScheduleDashboardApiService.assignProductionDates($scope.currentMonth).then((data) => {
                    $scope.orderList = data.order_list;
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while updating the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.onLockdown = (month, id) => {
            ScheduleDashboardApiService.saveLockdown(month, id).then((data) => {
                    $scope.errorMessages = [];
                    $scope.lockdownMonth = data.lockdown_month;
                    $scope.lockdownNumber = data.lockdown_number;
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while locking down order #' + id + ' for ' + $filter('date')(month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {});
        };

        $scope.onMoveCmd = () => {

            $scope.moveCmdInitiated = true;

            ScheduleDashboardApiService.changeOrderScheduleMonthPosition($scope.currentMonth, $scope.move_month,
                    $scope.new_position, $scope.ordersSelected).then((data) => {
                    $scope.orderList = data.order_list;
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if ((e || {}).data) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while updating the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    angular.forEach($scope.ordersSelected, (id) => $scope.orderSortLoading[id] = false);
                    $scope.moveCmdInitiated = false;
                });

            $('#moveOrderModal').modal('hide');

        };
        $scope.onMoveCmd1 = () => {

            $scope.moveCmdInitiated = true;

            ScheduleDashboardApiService.changeOrderScheduleMonthPosition1($scope.currentMonth, $scope.move_month,
                    $scope.new_position, $scope.ordersSelected, $scope.production_unit).then((data) => {
                    $scope.orderList = data.order_list;
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if ((e || {}).data) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while updating the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    angular.forEach($scope.ordersSelected, (id) => $scope.orderSortLoading[id] = false);
                    $scope.moveCmdInitiated = false;
                });

            $('#moveOrderModal2').modal('hide');
        };


        $scope.moveOrderCount = () => {
            let ordersMoveCount = 0;
            angular.forEach($scope.orderList, function(value) {
                if (value.selected) {
                    ordersMoveCount++;
                }
            });
            return ordersMoveCount;
        };

        $('#moveOrderModal.modal').on('hidden.bs.modal', function() {
            if (!$scope.moveCmdInitiated) {
                angular.forEach($scope.ordersSelected, (id) => $scope.orderSortLoading[id] = false);
                angular.forEach($scope.orderList, (order) => { if (order.selected) order.selected = false; });
                $scope.$apply();
            }


        });

        $('#moveOrderModal2.modal').on('hidden.bs.modal', function() {
            if (!$scope.moveCmdInitiated) {
                angular.forEach($scope.ordersSelected, (id) => $scope.orderSortLoading[id] = false);
                angular.forEach($scope.orderList, (order) => { if (order.selected) order.selected = false; });
                $scope.$apply();
            }

            $(this)
                .find("input")
                .val('')
                .end()
                .find("select")
                .val('')
                .end()
                .find("input[type=checkbox], input[type=radio],input[type=text]")
                .prop("checked", "")
                .end();

        });


        $scope.moveOrders = () => {
            $scope.ordersSelected = []; // Reset to calculate the id's

            angular.forEach($scope.orderList, function(order, key) {
                if (order.selected) {
                    $scope.ordersSelected.push(order.id);
                    $scope.orderSortLoading[order.id] = true;
                }
            });

            $scope.modalTitle = "Move " + $scope.ordersSelected.length + " Order";
            if ($scope.ordersSelected.length > 1)
                $scope.modalTitle += "s";

            $('#moveOrderModal.modal').modal({
                backdrop: 'static',
                keyboard: false
            });
        };
        $scope.moveOrders2 = () => {
            $scope.ordersSelected = []; // Reset to calculate the id's


            angular.forEach($scope.orderList, function(order, key) {
                if (order.selected) {
                    $scope.ordersSelected.push(order.id);
                    $scope.orderSortLoading[order.id] = true;
                }
            });

            $scope.modalTitle = "Move " + $scope.ordersSelected.length + "to Caravans";
            if ($scope.ordersSelected.length > 1)
                $scope.modalTitle += "s";

            $('#moveOrderModal2.modal').modal({
                backdrop: 'static',
                keyboard: false
            });

        };
        $scope.lockOrders = () => {
            $scope.ordersSelected = []; // Reset to calculate the id's
            $scope.lockCmdInitiated = true;

            angular.forEach($scope.orderList, function(order, key) {
                if (order.selected) {
                    $scope.ordersSelected.push(order.id);
                }
            });

            ScheduleDashboardApiService.massFinalizeOrder($scope.currentMonth, $scope.ordersSelected).then((data) => {
                    $scope.orderList = data.order_list;
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if ((e || {}).data) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while updating the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    $scope.lockCmdInitiated = false;
                });
        };

    });
}