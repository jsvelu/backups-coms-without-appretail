import _ from 'lodash';

export default app => {

    app.factory('ScheduleDashboardApiService', (ApiService) => {


        class ScheduleDashboardApi {

            assignProductionDates(month) {
                return ApiService.postData('schedule/dashboard2/assign-production-dates', {
                    assign_production_dates_for_month: ApiService.formatDate(month),
                });
            }

            //url to post data when Submit in Move Dialog is Cicked 
            //dashboard/change-order-schedule-unit-position

            changeOrderScheduleMonthPosition(viewMonth, newMonth, newPosition, orderIdList) {
                return ApiService.postData('schedule/dashboard2/change-order-schedule-month-position', {

                    view_month: ApiService.formatDate(viewMonth),
                    order_list: orderIdList,
                    new_schedule_month: ApiService.formatDate(newMonth),
                    new_position_month: newPosition,

                });
            }

            changeOrderScheduleMonthPosition1(viewMonth, newMonth, newPosition, orderIdList, production_unit) {
                return ApiService.postData('schedule/dashboard2/change-order-schedule-unit-position', {

                    view_month: ApiService.formatDate(viewMonth),
                    order_list: orderIdList,
                    new_schedule_month: ApiService.formatDate(newMonth),
                    new_position_month: newPosition,
                    production_unit: 1,
                });
            }


            getInitialData(viewMonth) {
                return ApiService.getData('schedule/dashboard2/initial/' + ApiService.formatDate(viewMonth));
            }

            getInitialData1(viewMonth) {
                return ApiService.getData('schedule/dashboard2/initialdata/' + ApiService.formatDate(viewMonth));
            }


            getDealerInitialData(viewMonth) {
                return ApiService.getData('schedule/dashboard2/dealer/' + ApiService.formatDate(viewMonth));
            }

            saveCommentOnOrder(order, schedule_comments) {
                return ApiService.postData('schedule/dashboard2/update-order', {
                    order_id: order.id,
                    schedule_comments: schedule_comments,
                });
            }

            saveQCOnOrder(order, qc_comments_from) {
                return ApiService.postData('schedule/dashboard2/update-transport-order', {
                    order_id: order.id + '',
                    qc_comments_from: qc_comments_from,
                });
            }

            saveWaterOnOrder(order, water_comments) {
                return ApiService.postData('schedule/dashboard2/update-water-order', {
                    order_id: order.id + '',
                    watertest_comments: water_comments,
                });
            }

            saveDispatchOnOrder(order, dispatch_comments) {
                return ApiService.postData('schedule/dashboard2/update-dispatch-order', {
                    order_id: order.id + '',
                    dispatch_comments: dispatch_comments,
                });
            }




            saveDealerCommentOnOrder(order, dealer_comments) {
                return ApiService.postData('schedule/dashboard2/update-order', {
                    order_id: order.id,
                    dealer_comments: dealer_comments,
                });
            }

            saveLockdown(month, number) {
                return ApiService.postData('schedule/dashboard2/update-lockdown', {
                    lockdown_number: number,
                    lockdown_month: month,
                });
            }

            updateOrderPosition(viewMonth, order, newMonth, newPosition, previousOrderId, nextOrderId) {
                return ApiService.postData('schedule/dashboard2/update-order', {
                    view_month: ApiService.formatDate(viewMonth),
                    order_id: order.id,
                    new_month: newMonth,
                    new_position: newPosition,
                    previous_order_id: previousOrderId,
                    next_order_id: nextOrderId,
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