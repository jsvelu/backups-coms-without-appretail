export default app => {

    require('./ScheduleTransportDashboardApiService')(app);
    require('./ScheduleDashboardApiService')(app);
    require('./ScheduleDashboardService')(app);


    app.controller('ScheduleTransportController', function(
        $anchorScroll,
        $cookies,
        $filter,
        $rootScope,
        $scope,
        AppSettings,
        DateProvider,
        ScheduleTransportDashboardApiService,
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

        $scope.testdate_dynamic = "";
        $scope.calcdate = {};
        $scope.planqcdate = {};
        $scope.waterdate = {};
        $scope.plandispdate = {};

        $scope.qcblock = {};
        $scope.qcblock1 = {};
        $scope.qcblock2 = {};

        $scope.waterblock = {};
        $scope.waterblock1 = {};
        $scope.waterblock2 = {};

        $scope.dispatchblock = {};
        $scope.dispatchblock1 = {};
        $scope.dispatchblock2 = {};

        $scope.completeblock = {};

        $scope.blankblock = {};

        $scope.watshowgreen = false;
        $scope.dispshowgreen = false;
        $scope.orderCommentLoading = {};
        $scope.qcCommentLoading = {};
        $scope.prodCommentLoading = {};
        $scope.waterCommentLoading = {};
        $scope.dispatchCommentLoading = {};
        $scope.orderSortLoading = {};
        $scope.searchStr = "";
        $scope.statuscolorvar = "";
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

                ScheduleTransportDashboardApiService.updateOrderPosition($scope.currentMonth, order, newMonth, newPositionInMonth, previousOrderId, nextOrderId).then((data) => {
                        $scope.orderList = data.order_list;
                        $scope.errorMessages = [];
                    })
                    .catch((e) => {
                        if (e) {
                            // $scope.errorMessages = [e.data];
                        } else {
                            // $scope.errorMessages = ['Error while updating the orders. Please reload the page.'];
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
            ScheduleTransportDashboardApiService.getInitialData1(date).then((data) => {
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


                        if (qcdate.actual_production_date != null)
                            $scope.testdate = new Date(qcdate.actual_production_date);
                        else
                            $scope.testdate = new Date(qcdate.production_date);

                        // $scope.testdate = $scope.testdate.getDate() + 10;

                        $scope.numberOfDaysToAdd = 12;
                        $scope.busiday = new Date($scope.testdate).getDay();

                        //Calculation For Planned QC Date
                        //For Mon --1 Tue -- 2 Wed -- 3 Thu -- 4  
                        if ($scope.busiday == 1 || $scope.busiday == 2 || $scope.busiday == 3 || $scope.busiday == 4) {
                            $scope.numberOfDaysToAdd = 15;
                        }
                        //Fri -- 5      
                        if ($scope.busiday == 5) {
                            $scope.numberOfDaysToAdd = 17;
                        }

                        // var newdate = new Date();
                        // newdate.setDate(mydate.getDate() + numberOfDaysToAdd);
                        // var today = dd + '/' + mm + '/' + yyyy;
                        $scope.testdate = $scope.testdate.setDate($scope.testdate.getDate() + parseInt($scope.numberOfDaysToAdd));
                        var millidate = new Date($scope.testdate);
                        // $scope.myday = (new Date($scope.testdate.getDate())) + "-" + (new Date($scope.testdate.getMonth() + 1)) + "-" + (new Date($scope.testdate.getFullYear()));
                        $scope.planqcdate[qcdate.id] = millidate; //.toDateString("dd-mm-yyyy");


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
                        $scope.waterdate[qcdate.id] = millidate1; //.toDateString("dd-mm-yyyy");

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
                        $scope.plandispdate[qcdate.id] = millidate2; //.toDateString("dd-mm-yyyy");

                        $scope.statuscolorvar = "0";


                        //If proddate > Currdate == Do No Checks set status to white or blankblock Set to 6 White and Dont Check Others at all
                        // console.log('Prod Date');
                        var prod_date = new Date(qcdate.production_date);


                        if (prod_date > $scope.getTodaysDate) {
                            console.log(' Prod Date > today');
                            console.log(prod_date > $scope.getTodaysDate);
                            //set status Color
                            $scope.blankblock[qcdate.id] = true;

                            $scope.dispatchblock[qcdate.id] = false;
                            $scope.dispatchblock1[qcdate.id] = false;
                            $scope.qcblock[qcdate.id] = false;
                            $scope.qcblock1[qcdate.id] = false;
                            $scope.waterblock[qcdate.id] = false;
                            $scope.completeblock[qcdate.id] = false;

                            $scope.statuscolorvar = "6";
                        }

                        if ($scope.statuscolorvar != "6") {

                            //Check if Dispatched Already Set to Gray    Set to 5 and Dont Check Other Conditions
                            if (qcdate.actual_dispatch_date) {
                                console.log('Dispatched');

                                $scope.blankblock[qcdate.id] = false;
                                $scope.dispatchblock[qcdate.id] = false;
                                $scope.dispatchblock1[qcdate.id] = false;
                                $scope.qcblock[qcdate.id] = false;
                                $scope.qcblock1[qcdate.id] = false;
                                $scope.waterblock[qcdate.id] = false;

                                $scope.completeblock[qcdate.id] = true;
                                $scope.statuscolorvar = "5";
                            }

                            //Check if Not Dispatched
                            if ($scope.statuscolorvar != "5") {
                                //Condition if Actual QC is Done and Water Testing Is Done
                                if ((qcdate.actual_qc_date) && (qcdate.actual_watertest_date)) {

                                    $scope.statuscolorvar = "4";

                                    console.log('check if Water Test and QC is done');

                                    $scope.dispatchblock1[qcdate.id] = true;

                                    $scope.completeblock[qcdate.id] = false;
                                    $scope.blankblock[qcdate.id] = false;
                                    $scope.waterblock[qcdate.id] = false;
                                    $scope.qcblock[qcdate.id] = false;

                                    $scope.waterblock1[qcdate.id] = false;
                                    $scope.waterblock2[qcdate.id] = false;

                                    $scope.qcblock1[qcdate.id] = false;
                                    $scope.qcblock2[qcdate.id] = false;
                                }


                                if ($scope.statuscolorvar != "4") {

                                    $scope.dispatchblock1[qcdate.id] = false;

                                    $scope.completeblock[qcdate.id] = false;
                                    $scope.blankblock[qcdate.id] = false;
                                    $scope.waterblock1[qcdate.id] = false;
                                    $scope.qcblock[qcdate.id] = false;
                                    $scope.qcblock1[qcdate.id] = false;
                                    $scope.waterblock1[qcdate.id] = false;
                                    $scope.waterblock2[qcdate.id] = false;


                                    //Check if QC is over
                                    if (qcdate.actual_qc_date != null) {
                                        console.log('Chekcing QC Over and Water Test Not Over');
                                        $scope.statuscolorvar = "3";
                                        //But water Test Not Over
                                        if (qcdate.actual_qc_date != null) {
                                            if ($scope.actual_watertest_date == null) {
                                                $scope.statuscolorvar = "3";
                                                console.log('Chekcing Water Test Not Over');
                                                $scope.waterdate[qcdate.id].setHours(0, 0, 0, 0);
                                                $scope.getTodaysDate.setHours(0, 0, 0, 0);
                                                if ($scope.waterdate[qcdate.id] >= $scope.getTodaysDate) {
                                                    //Show Yellow Block -- Awaiting Water Test -- Time Greater 
                                                    $scope.waterblock1[qcdate.id] = true

                                                    $scope.waterblock[qcdate.id] = false
                                                } else {
                                                    // -- Awaiting Water Test -- Time Available -- Red
                                                    $scope.waterblock[qcdate.id] = true

                                                    $scope.waterblock1[qcdate.id] = false

                                                }
                                            }
                                        }
                                    }
                                    //Check if QC is Not Over
                                    if ($scope.statuscolorvar != "3") {

                                        if (qcdate.actual_qc_date == null) {
                                            if ($scope.actual_qc_date == null) {
                                                $scope.statuscolorvar = "2";
                                                console.log('Check QC Not Done !');
                                                $scope.planqcdate[qcdate.id].setHours(0, 0, 0, 0);
                                                $scope.getTodaysDate.setHours(0, 0, 0, 0);
                                                if ($scope.planqcdate[qcdate.id] >= $scope.getTodaysDate) {
                                                    //Show Yellow Block -- Awaiting QC Test -- Time Greater 
                                                    $scope.qcblock1[qcdate.id] = true

                                                    $scope.qcblock[qcdate.id] = false
                                                } else

                                                {
                                                    // -- Awaiting QC Test -- Time Available -- Red
                                                    $scope.qcblock[qcdate.id] = true

                                                    $scope.qcblock1[qcdate.id] = false

                                                }


                                            }
                                        }



                                    }
                                }
                            }

                            console.log($scope.statuscolorvar);
                            $scope.statuscolorvar = "0";
                        }


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
                        // $scope.errorMessages = [e.data];
                    } else {
                        // $scope.errorMessages = ['Error while getting the initial data.'];
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
            ScheduleTransportDashboardApiService.saveQCOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating QC comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.qcCommentLoading[order.id] = false;
                });
        };

        $scope.onProdCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.qc_comments_from;
            console.log('on Production Comment function');
            if (newValue == oldValue) return;

            $scope.prodCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveProdOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Production comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.prodCommentLoading[order.id] = false;
                });
        };

        $scope.onWaterCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.watertest_comments;
            console.log('Water comment change function');
            if (newValue == oldValue) return;

            $scope.waterCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveWaterOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Water comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
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
            ScheduleTransportDashboardApiService.saveDispatchOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Dispatch comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.dispatchCommentLoading[order.id] = false;
                });
        };


        $scope.storeproddate = ($event, order) => {
            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());
            console.log('Format Date : ');
            console.log(formatted_date);
            console.log('Production Date Store');
            console.log(order);
            // if (newValue == oldValue) return;

            // $scope.dispatchCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveProdDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating QC comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    // $scope.dispatchCommentLoading[order.id] = false;
                });
        };

        $scope.storeqcdate = ($event, order) => {
            let newvalue = $scope.getTodaysDate;
            console.log('QC DateStore');
            // if (newValue == oldValue) return;

            $scope.dispatchCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveQcDate(order, newValue).then(() => {
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

            ScheduleTransportDashboardApiService.saveCommentOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating the comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.orderCommentLoading[order.id] = false;
                });
        };

        $scope.checkdatefun3 = (ord) => {
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


            let newval = new Date($scope.getTodaysDate);
            $scope.qcshowgreen = true;
            console.log('Entering checkdatefun Save Function');
            ScheduleTransportDashboardApiService.saveWaterDate(ord, newval).then(() => {
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


            let newval = new Date($scope.getTodaysDate);

            // $scope.dispshowgreen = true;
            console.log('Entering Water Date Save Function : ');
            let water_formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());
            console.log(water_formatted_date);
            // let plan_watertest_date = new Date(plan_water_date);
            ScheduleTransportDashboardApiService.saveWaterDate(ord, water_formatted_date).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating Water Date for order #' + ord.index + ' for ' + $filter('date')(ord.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    // $scope.dispatchCommentLoading[order.id] = false;
                });


        };

        $scope.checkdatefun = (ord) => {
            console.log('inside Dispatch date ok');


            let newval = new Date($scope.getTodaysDate);

            console.log('Entering Dispatch Date Save Function : ');
            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());
            console.log('Format Date : ');
            console.log(formatted_date);
            // var curdate = new Date(newval).toISOString().slice(0, 10);
            // let plan_watertest_date = new Date(plan_water_date);
            ScheduleTransportDashboardApiService.saveDispatchDate(ord, formatted_date).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating Dispatch Date for order #' + ord.index + ' for ' + $filter('date')(ord.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    // $scope.dispatchCommentLoading[order.id] = false;
                });


        };

        $scope.checkproddate = (ord) => {
            console.log('inside Production date ok');

            let newval = new Date($scope.getTodaysDate);

            console.log('Entering Production Date Save Function : ');
            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());
            console.log('Format Date : ');
            console.log(formatted_date);
            // var curdate = new Date(newval).toISOString().slice(0, 10);
            // let plan_watertest_date = new Date(plan_water_date);
            ScheduleTransportDashboardApiService.saveProdDate(ord, formatted_date).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating Dispatch Date for order #' + ord.index + ' for ' + $filter('date')(ord.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    // $scope.dispatchCommentLoading[order.id] = false;
                });


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

            let newval = $scope.getTodaysDate;

            console.log('Entering QC Date Save Function');
            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());
            console.log('Format Date : ');
            console.log(formatted_date);


            ScheduleTransportDashboardApiService.saveQcDate(order, formatted_date).then(() => {
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

        $scope.do_datecalc = (order) => {

            console.log('Inside Dynacmic Date Calculation ');

            console.log(order.id);

            $scope.dispatchblock[order.id] = false;
            $scope.waterblock[order.id] = false;
            $scope.planqcdate[order.id] = '18-11-2019';
            $scope.waterdate[order.id] = '20-11-2019';
            $scope.plandispdate[order.id] = '30-11-2019';

            console.log($scope.getTodaysDate);
            // console.log($scope.planqcdate[order.id]);

            var t1 = new Date($scope.getTodaysDate);
            var t2 = new Date(order.production_date);


            $scope.numberOfDaysToAdd = 12;

            $scope.busiday = new Date($scope.getTodaysDate).getDay();

            $scope.business_days = new Date($scope.getTodaysDate).getDay();
            console.log($scope.business_days);

            //Calculation For Planned QC Date
            //For Mon --1 Tue -- 2 Wed -- 3 Thu -- 4  
            if ($scope.busiday == 1 || $scope.busiday == 2 || $scope.busiday == 3 || $scope.busiday == 4) {
                $scope.numberOfDaysToAdd = 15;
            }
            //Fri -- 5      
            if ($scope.busiday == 5) {
                $scope.numberOfDaysToAdd = 17;
            }
            console.log($scope.numberOfDaysToAdd);
            console.log('Hello -- 2');
            var newdate = new Date();
            newdate = newdate.setDate(t1.getDate() + $scope.numberOfDaysToAdd);
            console.log('Plan QC  Date');
            console.log(newdate);
            $scope.planqcdate[order.id] = newdate;
            console.log($scope.planqcdate[order.id]);
            // var today = dd + '/' + mm + '/' + yyyy;

            //Calculate the Water Test Date

            $scope.numberOfDaysToAdd1 = 2;
            $scope.busiday1 = new Date(newdate)
            $scope.busiday1 = $scope.busiday1.getDay();
            console.log('newdate Day');
            console.log($scope.busiday1);
            //Calculation For Planned Water Test Date
            //For Mon Tue & Wed  dont Add  days  

            // For all Other Days Add 2 days extra
            if ($scope.busiday1 == 4 || $scope.busiday1 == 5) {
                $scope.numberOfDaysToAdd1 = 4;
            }
            console.log('No of Days to Add');
            console.log($scope.numberOfDaysToAdd1);
            var waterdate = new Date(newdate);
            console.log(waterdate);
            newdate = new Date(newdate);
            waterdate = waterdate.setDate(newdate.getDate() + $scope.numberOfDaysToAdd1);
            console.log('Plan Water  Date');
            $scope.waterdate[order.id] = new Date(waterdate)
            console.log($scope.waterdate[order.id]);

            //Calculation For Actual Dispatch Date
            var dispdate = new Date($scope.waterdate[order.id]);

            $scope.numberOfDaysToAdd2 = 2;
            $scope.busiday2 = new Date(dispdate).getDay();

            //Calculation For Actual Dispatch  Date
            //For Mon Tue & Wed  dont Add  days  

            // For all Other Days Add 2 days extra
            if ($scope.busiday2 == 4 || $scope.busiday2 == 5) {
                $scope.numberOfDaysToAdd2 = 4;
            }
            console.log('Add Days');
            console.log($scope.numberOfDaysToAdd2);

            waterdate = new Date(waterdate);
            dispdate = dispdate.setDate(waterdate.getDate() + $scope.numberOfDaysToAdd2);

            console.log('Plan Dispatch  Date');
            $scope.plandispdate[order.id] = new Date(dispdate)
            console.log($scope.plandispdate[order.id]);
            console.log('Calc Over');

            let newval = $scope.getTodaysDate;

            console.log('Entering Production Date Save Function');
            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());
            console.log('Format Date : ');
            console.log(formatted_date);

            ScheduleTransportDashboardApiService.saveProdDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while updating QC comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.dispatchCommentLoading[order.id] = false;
                });

        };

        $scope.isSortingAllowed = () => {
            return $scope.permissions.view_transport_dashboard;
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

            ScheduleTransportDashboardApiService.assignProductionDates($scope.currentMonth).then((data) => {
                    $scope.orderList = data.order_list;
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        // $scope.errorMessages = ['Error while updating the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.onLockdown = (month, id) => {
            ScheduleTransportDashboardApiService.saveLockdown(month, id).then((data) => {
                    $scope.errorMessages = [];
                    $scope.lockdownMonth = data.lockdown_month;
                    $scope.lockdownNumber = data.lockdown_number;
                })
                .catch(() => {
                    // $scope.errorMessages = ['Error while locking down order #' + id + ' for ' + $filter('date')(month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {});
        };

        $scope.onMoveCmd = () => {

            $scope.moveCmdInitiated = true;

            ScheduleTransportDashboardApiService.changeOrderScheduleMonthPosition($scope.currentMonth, $scope.move_month,
                    $scope.new_position, $scope.ordersSelected).then((data) => {
                    $scope.orderList = data.order_list;
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if ((e || {}).data) {
                        // $scope.errorMessages = [e.data];
                    } else {
                        // $scope.errorMessages = ['Error while updating the orders. Please reload the page.'];
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

            ScheduleTransportDashboardApiService.massFinalizeOrder($scope.currentMonth, $scope.ordersSelected).then((data) => {
                    $scope.orderList = data.order_list;
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if ((e || {}).data) {
                        // $scope.errorMessages = [e.data];
                    } else {
                        // $scope.errorMessages = ['Error while updating the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    $scope.lockCmdInitiated = false;
                });
        };

    });
}