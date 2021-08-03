// import MyDateService from './MyDateService';

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
        $scope.qcstatusvar = {};
        $scope.qcshowgreen = false;
        $scope.qcshow = {};
        $scope.watershow = {};
        $scope.dispatchshow = {};

        $scope.qc_comm_check = {};

        $scope.qcblock = {};
        $scope.waterblock = {};
        $scope.dispatchblock = {};

        $scope.watshowgreen = false;
        $scope.dispshowgreen = false;
        $scope.orderCommentLoading = {};
        $scope.qcCommentLoading = {};
        $scope.waterCommentLoading = {};
        $scope.dispatchCommentLoading = {};
        $scope.orderSortLoading = {};
        $scope.searchStr = "";
        $scope.monthList = [];
        $scope.ordersSelected = [];

        //my test
        // $scope.calcdate = [];


        $scope.mydate = {
            date: new Date()
        };
        $scope.getTodaysDate = new Date();

        // ng-change="getdetails()"
        $scope.getdetails = function($scope, d1) {
            return true;
        };

        $scope.AddMe = function($scope) {
            mytestdate = new Date();
            return mytestdate;
        };

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
                    // $scope.finaltest = ['01-10-2019'];
                    $scope.finaltest = new Date();

                    $scope.vartest = 'newvar';

                    $scope.calcdate = {};
                    $scope.planqcdate = {};
                    $scope.waterdate = {};
                    $scope.plandispdate = {};

                    // angular.forEach($scope.orderList, (qcdate) => $scope.calcdate[qcdate.id] = qcdate.production_date);

                    angular.forEach($scope.orderList, (qcdate) => {

                        $scope.qc_comm_check[qcdate.id] = qcdate.qc_comments_from;

                        $scope.calcdate[qcdate.id] = qcdate.production_date;

                        $scope.testdate = new Date(qcdate.production_date);
                        // $scope.testdate = $scope.testdate.getDate() + 10;

                        $scope.numberOfDaysToAdd = 12;
                        $scope.busiday = new Date($scope.testdate).getDay();

                        //Calculation For Planned QC Date
                        //For Mon and Tue Add 2 days extra
                        if ($scope.busiday == 1 || $scope.busiday == 2 || $scope.busiday == 3 || $scope.busiday == 4) {
                            $scope.numberOfDaysToAdd = 15;
                        }

                        if ($scope.busiday == 5) {
                            $scope.numberOfDaysToAdd = 17;
                        }

                        // var newdate = new Date();
                        // newdate.setDate(mydate.getDate() + numberOfDaysToAdd);
                        // var today = dd + '/' + mm + '/' + yyyy;
                        $scope.testdate = $scope.testdate.setDate($scope.testdate.getDate() + parseInt($scope.numberOfDaysToAdd));
                        var millidate = new Date($scope.testdate);
                        // $scope.myday = (new Date($scope.testdate.getDate())) + "-" + (new Date($scope.testdate.getMonth() + 1)) + "-" + (new Date($scope.testdate.getFullYear()));
                        $scope.planqcdate[qcdate.id] = millidate.toDateString("dd-mm-yyyy");


                        //Calculation For Planned Water Testing Date
                        $scope.testdate1 = new Date($scope.planqcdate[qcdate.id]);

                        $scope.numberOfDaysToAdd1 = 2;
                        $scope.busiday1 = new Date($scope.testdate1).getDay();

                        //Calculation For Planned Water Test Date
                        //For Mon Tue & Wed  dont Add  days  

                        // For all Other Days Add 2 days extra
                        if ($scope.busiday1 == 4 || $scope.busiday1 == 5) {
                            $scope.numberOfDaysToAdd1 = 4;
                        }

                        $scope.testdate1 = $scope.testdate1.setDate($scope.testdate1.getDate() + parseInt($scope.numberOfDaysToAdd1));
                        var millidate1 = new Date($scope.testdate1);
                        $scope.waterdate[qcdate.id] = millidate1.toDateString("dd-mm-yyyy");



                        //Calculation For Actual Dispatch Date
                        $scope.testdate2 = new Date($scope.waterdate[qcdate.id]);

                        $scope.numberOfDaysToAdd2 = 2;
                        $scope.busiday2 = new Date($scope.testdate2).getDay();

                        //Calculation For Actual Dispatch  Date
                        //For Mon Tue & Wed  dont Add  days  

                        // For all Other Days Add 2 days extra
                        if ($scope.busiday2 == 4 || $scope.busiday2 == 5) {
                            $scope.numberOfDaysToAdd2 = 4;
                        }

                        $scope.testdate2 = $scope.testdate2.setDate($scope.testdate2.getDate() + parseInt($scope.numberOfDaysToAdd2));
                        var millidate2 = new Date($scope.testdate2);
                        $scope.plandispdate[qcdate.id] = millidate2.toDateString("dd-mm-yyyy");

                        // console.log(qcdate.id + ' : ' + $scope.testdate + ' = ' + $scope.planqcdate[qcdate.id] + ' => ' + $scope.waterdate[qcdate.id] + ' => ' + $scope.plandispdate[qcdate.id]);
                    });


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
                            // $scope.getdata = MyDateService.getCurrent($scope.currentMonth);
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

        $scope.onQCCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.qc_comments_from;
            console.log('on comment change function');
            if (newValue == oldValue) return;

            $scope.qcCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleDashboardApiService.saveQCOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating QC comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.qcCommentLoading[order.id] = false;
                });
        };

        $scope.onWaterCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.qc_comments_from;
            console.log('Water comment change function');
            if (newValue == oldValue) return;

            $scope.waterCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleDashboardApiService.saveWaterOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating Water comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.waterCommentLoading[order.id] = false;
                });
        };

        $scope.onDispatchCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.qc_comments_from;
            console.log('Dispatch comment change function');
            if (newValue == oldValue) return;

            $scope.dispatchCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleDashboardApiService.saveDispatchOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating QC comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.dispatchCommentLoading[order.id] = false;
                });
        };

        $scope.storeqcdate = ($event, order) => {
            let newvalue = $scope.getTodaysDate();
            console.log('QC DateStore');
            // if (newValue == oldValue) return;

            $scope.dispatchCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleDashboardApiService.saveQcDate(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating QC comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.dispatchCommentLoading[order.id] = false;
                });
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

        $scope.checkdatefun = (ord) => {
            console.log('inside color ok');

            $scope.qcblock[ord.id] = false;
            $scope.waterblock[ord.id] = false;
            $scope.dispatchblock[ord.id] = true;

            var dd1 = new Date($scope.getTodaysDate);
            var dd2 = new Date($scope.waterdate[ord.id]);
            if (dd1 > dd2) {
                $scope.dispatchshow[ord.id] = true;


            } else {
                $scope.dispatchshow[ord.id] = false;

            }
            $scope.qcstatusvar[ord.id] = 'Dispatched !';
            console.log($scope.dispatchshow[ord.id]);
            console.log(ord.id);
            console.log($scope.qcstatusvar[ord.id]);


            let newval = $scope.getTodaysDate;
            $scope.qcshowgreen = true;
            console.log('Entering checkdatefun Save Function');
            ScheduleDashboardApiService.saveWaterDate(ord, newval).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating QC comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    // $scope.dispatchCommentLoading[ord.id] = false;
                });

            if ($scope.getTodaysDate > ord.id) {
                $scope.watshowgreen = true;
                return true;
            } else {

                $scope.watshowgreen = false;
                return false;
            }

        };

        $scope.testfun = (ord) => {
            console.log('Test Function ! ' + ord.id);
            $scope.watshowgreen = true;
            if ($scope.getTodaysDate > ord.id) {
                $scope.watshowgreen = false;
                return true;
            }

        };

        $scope.checkdatefun1 = (ord) => {
            console.log('inside date ok');
            if ($scope.getTodaysDate > ord.id) {
                $scope.watshowgreen = false;
                return true;
            }

        };

        $scope.checkwaterfun = (ord) => {
            console.log('inside water date ok');

            $scope.qcblock[ord.id] = false;
            $scope.dispatchblock[ord.id] = false;
            $scope.waterblock[ord.id] = true;
            var d1 = new Date($scope.getTodaysDate);
            var d2 = new Date($scope.waterdate[ord.id]);
            if (d1 > d2) {
                $scope.watershow[ord.id] = true;


            } else {
                $scope.watershow[ord.id] = false;

            }
            $scope.qcstatusvar[ord.id] = 'Ready For Dispatch';
            console.log($scope.watershow[ord.id]);
            console.log(ord.id);
            console.log($scope.qcstatusvar[ord.id]);




            let newval = $scope.getTodaysDate;
            // $scope.dispshowgreen = true;
            console.log('Entering Water Date Save Function');
            // let plan_watertest_date = new Date(plan_water_date);
            ScheduleDashboardApiService.saveWaterDate(ord, newval).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating Water comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    // $scope.dispatchCommentLoading[order.id] = false;
                });
            if ($scope.getTodaysDate > ord.id) {
                $scope.dispshowgreen = true;
                return true;
            } else {
                $scope.dispshowgreen = false;
                return false;
            }

        };

        $scope.checkwaterfun1 = (ord) => {
            console.log('inside water ok');
            if ($scope.getTodaysDate > ord.id) {
                $scope.dispshowgreen = true;
                return true;
            } else {
                $scope.dispshowgreen = false;
                return false;
            }

        };

        $scope.isColorOk = (order) => {

            console.log('Inside  QC Data Check ');

            $scope.dispatchblock[order.id] = false;
            $scope.waterblock[order.id] = false;


            console.log($scope.getTodaysDate);
            console.log($scope.planqcdate[order.id]);
            var t1 = new Date($scope.getTodaysDate);
            var t2 = new Date($scope.planqcdate[order.id]);
            if (t1 > t2) {
                //if (getTodaysDate > planqcdate[order.id]) {
                $scope.qcshow[order.id] = true;
                $scope.qcblock[order.id] = true;
                console.log('inside  !!! ');

            } else {
                $scope.qcshow[order.id] = false;
                $scope.qcblock[order.id] = true;
                console.log('Else   !!! ');
            }
            console.log('Water Block Value : ');
            console.log($scope.qcblock[order.id]);
            $scope.qcstatusvar[order.id] = 'Ready For Water Testing';
            console.log('QC Show Value : ');
            console.log($scope.qcshow[order.id]);
            console.log(order.id);
            console.log($scope.qcstatusvar[order.id]);
            // $scope.saveQcDate();
            // if ($scope.getTodaysDate > planqc) {
            //     console.log('QC Date Exceeded');
            //     $scope.qcshowgreen = true;
            //     $scope.statusvar = 'QC Exceeded'
            // }
            let newval = $scope.getTodaysDate;

            console.log('Entering QC Date Save Function');
            ScheduleDashboardApiService.saveQcDate(order, newval).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating QC comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.dispatchCommentLoading[order.id] = false;
                });

        };

        $scope.isColorNotOk = () => {
            console.log('inside color Not ok');
            $scope.qcshowgreen = false;

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

        $scope.moveOrders = () => {
            $scope.ordersSelected = []; // Reset to calculate the id's

            angular.forEach($scope.orderList, function(order, key) {
                if (order.selected) {
                    $scope.ordersSelected.push(order.id);
                    $scope.orderSortLoading[order.id] = true;
                }
            });

            $scope.todayDate = "Test This";

            $scope.modalTitle = "Move " + $scope.ordersSelected.length + " Order";
            if ($scope.ordersSelected.length > 1)
                $scope.modalTitle += "s";

            $('#moveOrderModal.modal').modal({
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