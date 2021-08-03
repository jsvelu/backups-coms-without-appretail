import _ from 'lodash';

export default app => {

    app.factory('ScheduleDashboardApiService', (ApiService) => {


        class ScheduleDashboardApi {

            assignProductionDates(month) {
                return ApiService.postData('schedule/dashboard/assign-production-dates', {
                    assign_production_dates_for_month: ApiService.formatDate(month),
                });
            }

            changeOrderScheduleMonthPosition(viewMonth, newMonth, newPosition, orderIdList,orderList) {
                return ApiService.postData('schedule/dashboard/change-order-schedule-month-position', {
                    view_month: ApiService.formatDate(viewMonth),
                    order_list: orderIdList,
                    new_schedule_month: ApiService.formatDate(newMonth),
                    new_position_month: newPosition,
                    orderList:orderList,
                });
            }
            changeOrderScheduleMonthPosition1(viewMonth, newMonth, newPosition, orderIdList, production_unit) {
                // console.log('Unit Calling');
                return ApiService.postData('schedule/dashboard/change-order-schedule-unit-position', {

                    view_month: ApiService.formatDate(viewMonth),
                    order_list: orderIdList,
                    new_schedule_month: ApiService.formatDate(newMonth),
                    new_position_month: newPosition,
                    production_unit: 2,
                });
            }


            getInitialData(viewMonth) {
                return ApiService.getData('schedule/dashboard/initial/' + ApiService.formatDate(viewMonth));
            }

            getInitialData1(viewMonth) {
                return ApiService.getData('schedule/dashboard/initialdata/' + ApiService.formatDate(viewMonth));
            }


            getDealerInitialData(viewMonth) {
                return ApiService.getData('schedule/dashboard/dealer/' + ApiService.formatDate(viewMonth));
            }

            saveCommentOnOrder(order, schedule_comments) {
                return ApiService.postData('schedule/dashboard/update-order', {
                    order_id: order.id,
                    schedule_comments: schedule_comments,
                });
            }

            saveQCOnOrder(order, qc_comments_from) {
                return ApiService.postData('schedule/dashboard/update-transport-order', {
                    order_id: order.id + '',
                    qc_comments_from: qc_comments_from,
                });
            }

            saveWaterOnOrder(order, water_comments) {
                return ApiService.postData('schedule/dashboard/update-water-order', {
                    order_id: order.id + '',
                    watertest_comments: water_comments,
                });
            }

            saveDispatchOnOrder(order, dispatch_comments) {
                return ApiService.postData('schedule/dashboard/update-dispatch-order', {
                    order_id: order.id + '',
                    dispatch_comments: dispatch_comments,
                });
            }




            saveDealerCommentOnOrder(order, dealer_comments) {
                return ApiService.postData('schedule/dashboard/update-order', {
                    order_id: order.id,
                    dealer_comments: dealer_comments,
                });
            }

            saveLockdown(month, number) {
                return ApiService.postData('schedule/dashboard/update-lockdown', {
                    lockdown_number: number,
                    lockdown_month: month,
                });
            }

            updateNewPosition(listobj) {
                return ApiService.postData('schedule/dashboard/update-lockdown', {
                    lockdown_number: number,
                    lockdown_month: month,
                });
            }

            updateOrderPosition(viewMonth, order, newMonth, newPosition, previousOrderId, nextOrderId) {
                //     // return ApiService.postData('schedule/dashboard/update-order', {
                //     //     view_month: ApiService.formatDate(viewMonth),
                //     //     order_id: order.id,
                //     //     new_month: newMonth,
                //     //     new_position: newPosition,
                //     //     previous_order_id: previousOrderId,
                //     //     next_order_id: nextOrderId,
                //     // });
            }

            // updateOrderPosition(viewMonth, order, newMonth, newPosition, previousOrderId, nextOrderId) {
            //     return ApiService.postData('schedule/dashboard/update-order', {
            //         view_month: ApiService.formatDate(viewMonth),
            //         order_id: order.id,
            //         new_month: newMonth,
            //         new_position: newPosition,
            //         previous_order_id: previousOrderId,
            //         next_order_id: nextOrderId,
            //     });
            // }
            // bulkmoveorders
            bulkmoveorders(view_month, new_order_list, new_order_index) {
                // console.log('before api call');
                // console.log('Old Orders Index Check' + ori_order_index);
                // console.log('Passed View Month' + view_month);
                return ApiService.postData('schedule/dashboard/bulk-update-newlogic', {
                    view_month: ApiService.formatDate(view_month),
                    new_order_list: new_order_list,
                    new_order_index: new_order_index,
                    // ori_order_list: ori_order_list,
                    // ori_order_index: ori_order_index,
                });
            }

            massFinalizeOrder(viewMonth, orderIdList) {
                return ApiService.postData('orders/mass-finalize-orders', {
                    view_month: ApiService.formatDate(viewMonth),
                    order_list: orderIdList,
                });
            }

            massFinalizeOrder(viewMonth, orderIdList) {
                return ApiService.postData('orders/mass-finalize-orders', {
                    view_month: ApiService.formatDate(viewMonth),
                    order_list: orderIdList,
                });
            }
        }

        return new ScheduleDashboardApi();
    });
};