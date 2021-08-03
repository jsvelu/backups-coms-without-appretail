import _ from 'lodash';

export default app => {

    app.factory('ScheduleDashboardApiService', (ApiService) => {


        class ScheduleDashboardApi {

            assignProductionDates(month) {
                return ApiService.postData('schedule/transportdashboard/assign-production-dates', {
                    assign_production_dates_for_month: ApiService.formatDate(month),
                });
            }

            changeOrderScheduleMonthPosition(viewMonth, newMonth, newPosition, orderIdList) {
                return ApiService.postData('schedule/transportdashboard/change-order-schedule-month-position', {
                    view_month: ApiService.formatDate(viewMonth),
                    order_list: orderIdList,
                    new_schedule_month: ApiService.formatDate(newMonth),
                    new_position_month: newPosition,
                });
            }

            // getInitialData(viewMonth) {
            //     return ApiService.getData('schedule/transportdashboard/initial/' + ApiService.formatDate(viewMonth));
            // }

            getInitialData(viewMonth) {
                return ApiService.getData('schedule/dashboard/initialdata/' + ApiService.formatDate(viewMonth));
            }

            getDealerInitialData(viewMonth) {
                return ApiService.getData('schedule/transportdashboard/dealer/' + ApiService.formatDate(viewMonth));
            }

            saveCommentOnOrder(order, schedule_comments) {
                return ApiService.postData('schedule/transportdashboard/update-order', {
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

            saveWaterOnOrder(order, qc_comments_from) {
                return ApiService.postData('schedule/dashboard/update-water-order', {
                    order_id: order.id + '',
                    qc_comments_from: qc_comments_from,
                });
            }

            saveDispatchOnOrder(order, qc_comments_from) {
                return ApiService.postData('schedule/dashboard/update-dispatch-order', {
                    order_id: order.id + '',
                    qc_comments_from: qc_comments_from,
                });
            }

            saveDealerCommentOnOrder(order, dealer_comments) {
                return ApiService.postData('schedule/transportdashboard/update-order', {
                    order_id: order.id,
                    dealer_comments: dealer_comments,
                });
            }

            saveLockdown(month, number) {
                return ApiService.postData('schedule/transportdashboard/update-lockdown', {
                    lockdown_number: number,
                    lockdown_month: month,
                });
            }

            updateOrderPosition(viewMonth, order, newMonth, newPosition, previousOrderId, nextOrderId) {
                return ApiService.postData('schedule/transportdashboard/update-order', {
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