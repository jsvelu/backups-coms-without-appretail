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
        $scope.sendEmailLoading = false;
        $scope.sendReadyEmailLoading = false;

        $scope.qcstatusvar = {};
        $scope.qcshowgreen = false;
        $scope.qcshow = {};
        $scope.watershow = {};
        $scope.dispatchshow = {};

        $scope.hold_caravans_cur = false;

        $scope.qc_comm_check = {};

        $scope.testdate_dynamic = "";
        $scope.calcdate = {};
        $scope.planqcdate = {};
        $scope.waterdate = {};
        $scope.plandispdate = {};

        $scope.holdblock = {};
        $scope.prodblock = {};
        $scope.prodblock1 = {};
        $scope.prodblock2 = {};

        $scope.chassisblock = {};
        $scope.buildingblock = {};
        $scope.prewireblock = {};
        $scope.plumbingblock = {};
        $scope.aluminiumblock = {};
        $scope.finishingblock = {};

        $scope.watertestingblock = {};
        $scope.weighbridgeblock = {};
        $scope.detailingblock = {};

        $scope.qcblock = {};
        $scope.qcblock1 = {};

        $scope.waterblock = {};
        $scope.waterblock1 = {};
        $scope.weight_tare = {};
        $scope.weight_atm = {};
        $scope.weight_tow_ball = {};
        $scope.weight_chassis_gtm = {};
        $scope.weight_gas_comp = {};
        $scope.weight_payload = {};


        $scope.finalqcblock = {};

        $scope.dispatchblock1 = {};
        $scope.dispatchblock2 = {};

        $scope.completeblock = {};

        $scope.blankblock = {};

        $scope.dispshowgreen = false;
        $scope.actual_prod_date_loading = {};
        $scope.chassis_section_date_loading = {};
        $scope.onChasisSectionCommentLoading = {};
        $scope.building_date_loading = {};
        $scope.onBuildingCommentLoading = {};
        $scope.prewire_date_loading = {};
        $scope.onPrewireCommentLoading = {};
        $scope.plumbing_date_loading = {};
        $scope.onPlumbingCommentLoading = {};
        $scope.aluminium_date_loading = {};
        $scope.finishing_date_loading = {};
        $scope.watertest_date_loading = {};
        $scope.weigh_bridge_date_loading = {};
        $scope.detailing_date_loading = {};


        $scope.onAluminiumCommentLoading = {};
        $scope.onFinishingCommentLoading = {};
        $scope.onWatertestCommentLoading = {};
        $scope.onWeighBridgeCommentLoading = {};
        $scope.onDetailingCommentLoading = {};
        $scope.orderCommentLoading = {};
        $scope.actual_qc_date_loading = {};
        $scope.qcCommentLoading = {};
        $scope.ChassisCommentLoading = {};
        $scope.prodCommentLoading = {};
        $scope.actual_water_test_date_loading = {};
        $scope.waterCommentLoading = {};
        $scope.detailingCommentLoading = {};
        $scope.final_qc_date_loading = {};
        $scope.FinalQCCommentLoading = {};
        $scope.actual_dispatch_date_loading = {};
        $scope.dispatchCommentLoading = {};
        $scope.orderSortLoading = {};
        $scope.searchStr = "";
        $scope.statuscolorvar = "";

        $scope.await_chassis = 0;
        $scope.await_building = 0;
        $scope.await_prewire = 0;
        $scope.await_aluminium = 0;
        $scope.await_finishing = 0;

        $scope.await_watertesting = 0;
        $scope.await_weighbridge = 0;
        $scope.await_detailing = 0;

        $scope.dispatched_count = 0;
        $scope.ready_for_dispatch_count = 0;
        $scope.final_qc_count = 0;
        $scope.water_count = 0;
        $scope.first_qc_count = 0;

        $scope.monthList = [];
        $scope.ordersSelected = [];


        $scope.mydate = {
            date: new Date()
        };
        $scope.getTodaysDate = new Date();



        $scope.sortableOptions = {
            axis: 'y',
            containment: '#transport_dashboard .content table tbody, #transport_dashboard .content table tfoot',
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
                    $scope.countList = data.count_list;
                    $scope.lockdownMonth = data.lockdown_month;
                    $scope.lockdownNumber = data.lockdown_number;
                    $scope.finaltest = new Date();


                    $scope.calcdate = {};
                    $scope.planqcdate = {};
                    $scope.waterdate = {};
                    $scope.plandispdate = {};

                    var dispat_count = 0;


                    $scope.dispatched_count = 0;
                    $scope.ready_for_dispatch_count = 0;
                    $scope.water_count = 0;
                    $scope.await_chassis = 0;
                    $scope.await_building = 0;
                    $scope.await_prewire = 0;
                    $scope.await_aluminium = 0;
                    $scope.await_finishing = 0;
                    $scope.await_watertesting = 0;
                    $scope.await_weighbridge = 0;
                    $scope.await_detailing = 0;

                    $scope.await_qc_count_red = 0;
                    $scope.await_qc_count_yellow = -1;
                    $scope.await_water_count_red = 0;
                    $scope.await_water_count_yellow = 0;
                    $scope.final_qc_count = 0;

                 

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

        const sec_initialize = (date) => {
            $scope.monthDataLoading = true;
            ScheduleTransportDashboardApiService.getStatusInitialData().then((data) => {
                    $scope.chassis_list     = data.chassis_list;
                    $scope.building_list    = data.building_list;
                    $scope.prewire_list     = data.prewire_list;
                    $scope.plumbing_list    = data.plumbing_list;
                    $scope.aluminium_list   = data.aluminium_list;
                    $scope.finishing_list   = data.finishing_list;
                    $scope.water_test_list  = data.water_test_list;
                    $scope.weigh_bridge_list = data.weigh_bridge_list;
                    $scope.detailing_list   = data.detailing_list;
                    $scope.actual_qc_list   = data.actual_qc_list;
                    $scope.final_qc_list    = data.final_qc_list;
                    $scope.actual_dispatch_list     = data.actual_dispatch_list;
                    $scope.actual_dispatch_list1    = data.actual_dispatch_list1;
                    $scope.email_sent_green_list    = data.email_sent_green_list;
                    $scope.today_dispatched_list    = data.today_dispatched_list;
                    $scope.yesterday_dispatched_list    = data.yesterday_dispatched_list;
                    $scope.this_week_dispatched_list    = data.this_week_dispatched_list;
                    $scope.this_month_dispatched_list   = data.this_month_dispatched_list;
                    $scope.total_count = data.total_count;
                    $rootScope.permissions = data.permissions;
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
        const delay_initialize = (date) => {
            // console.log('Enter JS Delay Function');
        ScheduleTransportDashboardApiService.getDelayStatusData().then((data) => {
                    $scope.delay_list = data.delay_list;
                    $rootScope.permissions = data.permissions;
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
                    // console.log('Last Finally');
                });
            };

        initialize($scope.currentMonth);

        sec_initialize();

        delay_initialize();

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

        $scope.call_Status = () => {
            // alert('Test This');
            console.log('test this call');
            // return $scope.permissions.view_transport_dashboard;
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




        $scope.hold_order_fun = (order) => {

            let hold_value = false;
            if (order.hold_caravans == 0) {
                hold_value = true;
            } else {
                hold_value = false;

            }
            ScheduleTransportDashboardApiService.hold_Order(order, hold_value).then(() => {
                    $scope.errorMessages = [];
                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while Holding Order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.qcCommentLoading[order.id] = false;
                });

        };

        // onChasisSectionCommentChange
        $scope.onChasisSectionCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.chassis_section_comments;


            if (newValue == oldValue) return;

            if ((oldValue == null) && (newValue === "")) {
                return;
            }
            $scope.onChasisSectionCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveChassisOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Chassis  comments for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.onChasisSectionCommentLoading[order.id] = false;
                });
        };

        // onBuildingCommentChange
        $scope.onBuildingCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.building_comments;


            if (newValue == oldValue) return;

            if ((oldValue == null) && (newValue === "")) {
                return;
            }
            $scope.onBuildingCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveBuildingOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Building comments for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.onBuildingCommentLoading[order.id] = false;
                });
        };

        //on Prewire Comment Change
        $scope.onPrewireCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.prewire_comments;


            if (newValue == oldValue) return;

            if ((oldValue == null) && (newValue === "")) {
                return;
            }
            $scope.onPrewireCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.savePrewireOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Prewire comments for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.onPrewireCommentLoading[order.id] = false;
                });
        };


        //on Plumbing Comment Change
        $scope.onPlumbingCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.prewire_comments;


            if (newValue == oldValue) return;

            if ((oldValue == null) && (newValue === "")) {
                return;
            }
            $scope.onPlumbingCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.savePlumbingOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Plumbing comments for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.onPlumbingCommentLoading[order.id] = false;
                });
        };


        $scope.onAluminiumCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.chassis_section_comments;


            if (newValue == oldValue) return;

            if ((oldValue == null) && (newValue === "")) {
                return;
            }
            $scope.onAluminiumCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveAluminiumOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Aluminium comments for order # ' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.onAluminiumCommentLoading[order.id] = false;
                });
        };


        $scope.onFinishingCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.finishing_comments;


            if (newValue == oldValue) return;

            if ((oldValue == null) && (newValue === "")) {
                return;
            }
            $scope.onFinishingCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveFinishinOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Finishing comments for order # ' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.onFinishingCommentLoading[order.id] = false;
                });
        };

        $scope.onWaterTestCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.watertest_comments;


            if (newValue == oldValue) return;

            if ((oldValue == null) && (newValue === "")) {
                return;

            }
            $scope.onWatertestCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveWatertestOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Watertest comments for order # ' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.onWatertestCommentLoading[order.id] = false;
                });
        };


        $scope.onWeighBridgeCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.weigh_bridge_comments;


            if (newValue == oldValue) return;

            if ((oldValue == null) && (newValue === "")) {
                return;

            }
            $scope.onWeighBridgeCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveWeighBridgeOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Weigh Bridge comments for order # ' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.onWeighBridgeCommentLoading[order.id] = false;
                });
        };

        $scope.onDetailingCommentChange = ($event, order) => {
            // console.log('Detail Comment');
            let newValue = $event.target.value;
            let oldValue = order.detailing_comments;
            // console.log(newValue);

            if (newValue == oldValue) return;

            if ((oldValue == null) && (newValue === "")) {
                return;

            }
            $scope.onDetailingCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveDetailingOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Detailing comments for order # ' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.onDetailingCommentLoading[order.id] = false;
                });
        };

        $scope.onQCCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.qc_comments_from;



            if (newValue == oldValue) return;

            if ((oldValue == null) && (newValue === "")) {
                return;
            }
            $scope.qcCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveQCOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating QC comments for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.qcCommentLoading[order.id] = false;
                });
        };

        $scope.onProdCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.prod_comments_from;



            if (newValue == oldValue)

            {
                return;
            }
            if ((oldValue == null) && (newValue === "")) {
                return;
            }

            $scope.prodCommentLoading[order.id] = true;

            ScheduleTransportDashboardApiService.saveProdOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Production comments for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.prodCommentLoading[order.id] = false;
                });
        };

        $scope.onWaterCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.watertest_comments;

            // Cond 1
            if (newValue == oldValue) {
                return;

            }

            if ((oldValue == null) && (newValue === "")) {
                return;
            }

            $scope.waterCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveWaterOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Water comments for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.waterCommentLoading[order.id] = false;
                });
        };

        $scope.onFinalQCCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.final_qc_comments;

            // Cond 1
            if (newValue === oldValue) {
                return;

            }

            if ((oldValue === null) && (newValue === "")) {
                return;
            }

            $scope.FinalQCCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveFinalQCOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Final QC comments for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.FinalQCCommentLoading[order.id] = false;
                });
        };

        $scope.onDispatchCommentChange = ($event, order) => {
            let newValue = $event.target.value;
            let oldValue = order.dispatch_comments;

            // Cond 1
            if (newValue == oldValue) {
                return;

            }

            if ((oldValue == null) && (newValue === "")) {

                return;
            }

            $scope.dispatchCommentLoading[order.id] = true;

            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveDispatchOnOrder(order, newValue).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Dispatch comments for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    $scope.dispatchCommentLoading[order.id] = false;
                });
        };


        $scope.storeproddate = ($event, order) => {
            let newval = $scope.getTodaysDate;
            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());


            // ScheduleDashboardApiService.sa
            ScheduleTransportDashboardApiService.saveProdDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating QC comments for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    // $scope.dispatchCommentLoading[order.id] = false;
                });
        };

        $scope.storeqcdate = ($event, order) => {
            let newvalue = $scope.getTodaysDate;

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
            // $scope.currentMonth
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


        $scope.checkdatefun1 = (ord) => {
            if ($scope.getTodaysDate > ord.id) {
                $scope.watshowgreen = false;
                return true;
            }

        };

        $scope.checkwaterfun = (ord) => {

            $scope.actual_water_test_date_loading[ord.id] = true;

            let newval = new Date($scope.getTodaysDate);

            let water_formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());
            ScheduleTransportDashboardApiService.saveWaterDate(ord, water_formatted_date).then(() => {

                    $scope.errorMessages = [];
                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Water Date for order #' + ord.chassis + ' for ' + $filter('date')(ord.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(2000);
                    $scope.actual_water_test_date_loading[ord.id] = false;
                });
            $scope.actual_water_test_date_loading[ord.id] = false;

        };



        $scope.checkfinalqcfun = (ord) => {

            $scope.final_qc_date_loading[ord.id] = true;

            let newval = new Date($scope.getTodaysDate);

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());

            ScheduleTransportDashboardApiService.saveFinalQCDate(ord, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);

                })
                .catch(() => {
                    $scope.errorMessages = ['Error while final QC Date for order #' + ord.chassis + ' for ' + $filter('date')(ord.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(2000);
                    $scope.final_qc_date_loading[ord.id] = false;
                });
            $scope.final_qc_date_loading[ord.id] = false;

        };

        $scope.checkdatefun = (ord) => {

            $scope.actual_dispatch_date_loading[ord.id] = true;

            let newval = new Date($scope.getTodaysDate);

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());

            ScheduleTransportDashboardApiService.saveDispatchDate(ord, formatted_date).then(() => {
                    $scope.errorMessages = [];
                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Actual Dispatch Date for order #' + ord.chassis + ' for ' + $filter('date')(ord.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(2000);
                    $scope.actual_dispatch_date_loading[ord.id] = false;
                });

            $scope.actual_dispatch_date_loading[ord.id] = false;


        };

        $scope.checkproddate = (ord) => {
            $scope.actual_prod_date_loading[ord.id] = true;
            let newval = new Date($scope.getTodaysDate);

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());
            
            ScheduleTransportDashboardApiService.saveProdDate(ord, formatted_date).then(() => {
                    $scope.errorMessages = [];
                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Actual Production Date for order #' + ord.chassis + ' for ' + $filter('date')(ord.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(2000);
                    $scope.actual_prod_date_loading[ord.id] = false;
                });
        };

        // '!order.weight_tare' || '!order.weight_atm' || '!order.weight_tow_ball' || '!order.weight_chassis_gtm' || '!order.weight_gas_comp' || '!order.weight_payload'" > 

        $scope.checkweights = (ord) => {


            if( (!ord.weight_tare) || (!ord.weight_atm) || (!ord.weight_tow_ball) || (!ord.weight_tyres) || (!ord.weight_chassis_gtm) || (!ord.weight_gas_comp) || (! ord.weight_payload) )
            {
                $scope.dispshowgreen = true;
                // console.log(ord.id + ': weights Not Available ');
                return true;
            }
        };

        $scope.checkallweights = (ord) => {



            if( (ord.weight_tare) || (ord.weight_atm) || (ord.weight_tow_ball) || (ord.weight_tyres) || (ord.weight_chassis_gtm) || (ord.weight_gas_comp) || ( ord.weight_payload) )
            {
                $scope.dispshowgreen = false;
                // console.log(ord.id + ': All weights Available ');
                return true;
            } else {
                return false;
            }
        };

        $scope.checkwaterfun1 = (ord) => {
            if ($scope.getTodaysDate > ord.id) {
                $scope.dispshowgreen = true;
                return true;
            } else {
                $scope.dispshowgreen = false;
                return false;
            }

        };

        $scope.isSectionDateChanged = (order) => {
            $scope.chassis_section_date_loading[order.id] = true;

            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());


            ScheduleTransportDashboardApiService.saveChassisDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Chassis Section Date for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(1000);
                    $scope.chassis_section_date_loading[order.id] = false;
                });

            $scope.chassis_section_date_loading[order.id] = false;

        };




        $scope.isBuildingDateChanged = (order) => {
            $scope.building_date_loading[order.id] = true;

            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());


            ScheduleTransportDashboardApiService.saveBuildingDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Building  Date for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(1000);
                    $scope.building_date_loading[order.id] = false;
                });

            $scope.building_date_loading[order.id] = false;

        };

        $scope.isPrewireDateChanged = (order) => {
            $scope.prewire_date_loading[order.id] = true;

            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());


            ScheduleTransportDashboardApiService.savePrewireDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Prewire Date for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(1000);
                    $scope.prewire_date_loading[order.id] = false;
                });

            $scope.prewire_date_loading[order.id] = false;

        };

        $scope.isPlumbingDateChanged = (order) => {
            $scope.plumbing_date_loading[order.id] = true;

            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());


            ScheduleTransportDashboardApiService.savePlumbingDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Plumbing Date for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(1000);
                    $scope.plumbing_date_loading[order.id] = false;
                });

            $scope.plumbing_date_loading[order.id] = false;

        };


        // isAluminiumDateChanged
        $scope.isAluminiumDateChanged = (order) => {
            $scope.aluminium_date_loading[order.id] = true;

            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());

            ScheduleTransportDashboardApiService.saveAluminiumDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Aluminium Date for order #' + order.chassis + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(1000);
                    $scope.aluminium_date_loading[order.id] = false;
                });

            $scope.aluminium_date_loading[order.id] = false;

        };

        // isFinishingDateChanged
        $scope.isFinishingDateChanged = (order) => {
            $scope.finishing_date_loading[order.id] = true;

            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());


            ScheduleTransportDashboardApiService.saveFinishingDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Finishing Date for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(1000);
                    $scope.finishing_date_loading[order.id] = false;
                });

            $scope.finishing_date_loading[order.id] = false;

        };

        $scope.isWatertestDateChanged = (order) => {
            $scope.watertest_date_loading[order.id] = true;

            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());


            ScheduleTransportDashboardApiService.saveWatertestDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating Watertest Date for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(1000);
                    $scope.watertest_date_loading[order.id] = false;
                });

            $scope.watertest_date_loading[order.id] = false;

        };



        $scope.isWeighbridgeDateChanged = (order) => {
            $scope.weigh_bridge_date_loading[order.id] = true;

            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());


            ScheduleTransportDashboardApiService.saveWeighBridgeDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating  Weigh Bridge  Date for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(1000);
                    $scope.weigh_bridge_date_loading[order.id] = false;
                });

            $scope.weigh_bridge_date_loading[order.id] = false;

        };


        $scope.isDetailingDateChanged = (order) => {
            $scope.detailing_date_loading[order.id] = true;

            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());


            ScheduleTransportDashboardApiService.saveDetailingDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating  Detailing Date for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {
                    setTimeout(1000);
                    $scope.detailing_date_loading[order.id] = false;
                });

            $scope.detailing_date_loading[order.id] = false;

        };

        // This function is not used as the Actual QC column is not used in the dashboard as per client instructions.
        $scope.checkactualqc = (order) => {
            $scope.actual_qc_date_loading[order.id] = true;

            let newval = $scope.getTodaysDate;

            let formatted_date = (newval.getFullYear()) + "-" + (newval.getMonth() + 1) + "-" + (newval.getDate());

            ScheduleTransportDashboardApiService.saveQcDate(order, formatted_date).then(() => {
                    $scope.errorMessages = [];

                    initialize($scope.currentMonth);
                    setTimeout(2000);
                })
                .catch(() => {
                    $scope.errorMessages = ['Error while updating QC Canopy Date for order #' + order.index + ' for ' + $filter('date')(order.month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS)];
                })
                .finally(() => {


                    setTimeout(1000);
                    $scope.actual_qc_date_loading[order.id] = false;
                });

            $scope.actual_qc_date_loading[order.id] = false;

        };

        // $scope.isColorNotOk = () => {
        //     $scope.qcshowgreen = false;

        // };

       


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

        $scope.testfilterfun = () => {
            $scope.searchStr = 'Dispatched';
        };
        $scope.filterreadyfordispatch = () => {
            $scope.searchStr = 'Ready For Dispatch';
        };

        $scope.filterchassis = () => {
            $scope.searchStr = 'Chassis';
        };

        $scope.filterbuilding = () => {
            $scope.searchStr = 'Building';
        };

        $scope.filterprewire = () => {
            $scope.searchStr = 'Prewire';
        };

        $scope.filterplumbing = () => {
            $scope.searchStr = 'Plumbing';
        };

        $scope.filteraluminium = () => {
            $scope.searchStr = 'Aluminium';
        };

        $scope.filterfinishing = () => {
            $scope.searchStr = 'Finishing';
        };

        $scope.filteractualqc = () => {
            $scope.searchStr = 'QC Canopy';
        };

        $scope.filterwatertest = () => {
            $scope.searchStr = 'Water Testing';
        };

        $scope.filterweighbridge = () => {
            $scope.searchStr = 'Weigh Bridge';
        };

        $scope.filterdetailing = () => {
            $scope.searchStr = 'Detailing';
        };

        $scope.filterfinalqc = () => {
            $scope.searchStr = 'Final QC';
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
                ScheduleDashboardService.containsCaseInsensitive(order.order_status, $scope.searchStr)

        };

        $scope.export_delay_all = () => {
            ScheduleTransportDashboardApiService.exportDelayAll().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting All the Delayed orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_delay_chassis = () => {
            ScheduleTransportDashboardApiService.exportDelayChassis().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the Chassis Delay. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };
        $scope.export_delay_building = () => {
            ScheduleTransportDashboardApiService.exportDelayBuilding().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the Building Delay. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };
        $scope.export_delay_prewire = () => {
            ScheduleTransportDashboardApiService.exportDelayPrewire().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the Pre Wire Delay. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_delay_plumbing = () => {
            ScheduleTransportDashboardApiService.exportDelayPlumbing().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the Plumbing Delay. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_delay_aluminium = () => {
            ScheduleTransportDashboardApiService.exportDelayAluminium().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the Aluminium Delay. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_delay_finishing = () => {
            ScheduleTransportDashboardApiService.exportDelayFinishing().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the Finishing Delay. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_delay_detailing = () => {
            ScheduleTransportDashboardApiService.exportDelayDetailing().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the Detailing Delay. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_delay_watertesting = () => {
            ScheduleTransportDashboardApiService.exportDelayWatertesting().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the Watertesting Delay. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_delay_actualqc = () => {
            ScheduleTransportDashboardApiService.exportDelayActualQC().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the Actual QC Delay. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_delay_finalqc = () => {
            ScheduleTransportDashboardApiService.exportDelayFinalQC().then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the Final QC Delay. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };


        $scope.export_dispatched = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportDispatched(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_ready_dispatch = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportReadyDispatched(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_chassis = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportChassis(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };


        $scope.export_building = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportBuilding(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_prewire = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportPrewire(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_plumbing = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportPlumbing(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_aluminium = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportAluminium(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };


        $scope.export_finishing = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportFinishing(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_watertesting = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportWatertesting(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_weighbridge = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportWeighbridge(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_detailing = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportDetailing(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };



        $scope.export_actualqc = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportActualQc(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };


        $scope.export_watertest = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportWatertest(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };


        $scope.export_finalqc = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            ScheduleTransportDashboardApiService.exportFinalQC(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
        };

        $scope.export_all = () => {
            var dt_check = new Date($scope.currentMonth);
            var dpyear = dt_check.getFullYear();
            var dpmonth = ("0" + (dt_check.getMonth() + 1)).slice(-2);
            var dpdate = dpyear + '-' + dpmonth;
            // console.log('export all');
            ScheduleTransportDashboardApiService.exportAll(dpdate).then(() => {
                    $scope.errorMessages = [];
                })
                .catch((e) => {
                    if (e) {
                        $scope.errorMessages = [e.data];
                    } else {
                        $scope.errorMessages = ['Error while exporting the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    // $scope.assignProductionDatesLoading = false;
                });
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
                        $scope.errorMessages = ['Error while updating the orders. Please reload the page.'];
                    }
                })
                .finally(() => {
                    $scope.assignProductionDatesLoading = false;
                });
        };
        
        $scope.sendReadyForDispatchList = () => {
            $scope.sendReadyEmailLoading = true;
            console.log('Entering the Ready For Dispatch ! ');
            ScheduleTransportDashboardApiService.sendEmailReadyForDispatch().then((data) => {
                    // $scope.orderList = data.order_list;
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
                    $scope.sendReadyEmailLoading = false;
                });
        };
        $scope.sendActualDispatchList = () => {
            $scope.sendEmailLoading = true;
            console.log('Entering the Function');
            ScheduleTransportDashboardApiService.sendEmailActualDispatch().then((data) => {
                    // $scope.orderList = data.order_list;
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
                    $scope.sendEmailLoading = false;
                });
        };

        $scope.onLockdown = (month, id) => {
            ScheduleTransportDashboardApiService.saveLockdown(month, id).then((data) => {
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