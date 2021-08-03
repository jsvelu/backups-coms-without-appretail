import _ from 'lodash';

export default app => {

    app.factory('ScheduleTransportDashboardApiService', (ApiService) => {


        class ScheduleTransportDashboardApi {

            assignProductionDates(month) {
                return ApiService.postData('schedule/transportdashboard2/assign-production-dates', {
                    assign_production_dates_for_month: ApiService.formatDate(month),
                });
            }

            changeOrderScheduleMonthPosition(viewMonth, newMonth, newPosition, orderIdList) {
                return ApiService.postData('schedule/transportdashboard2/change-order-schedule-month-position', {
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
                return ApiService.getData('schedule/dashboard2/initialdata/' + ApiService.formatDate(viewMonth));
            }

            getInitialData1(viewMonth) {
                return ApiService.getData('schedule/dashboard2/initialdata/' + ApiService.formatDate(viewMonth));
            }

            getDealerInitialData(viewMonth) {
                return ApiService.getData('schedule/transportdashboard2/dealer/' + ApiService.formatDate(viewMonth));
            }

            saveCommentOnOrder(order, schedule_comments) {
                return ApiService.postData('schedule/transportdashboard2/update-order', {
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

            saveProdOnOrder(order, prod_comments_from) {
                return ApiService.postData('schedule/dashboard2/update-prodcomment-order', {
                    order_id: order.id + '',
                    prod_comments_from: prod_comments_from,
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


            saveProdDate(order, actual_production_date) {

                console.log('save Prod Date');
                console.log(actual_production_date);
                return ApiService.postData('schedule/dashboard2/update-proddate', {
                    order_id: order.id + '',
                    actual_production_date: actual_production_date,
                });
            }

            saveQcDate(order, actual_qc_date) {
                console.log('save QC Date');
                console.log(actual_qc_date);
                return ApiService.postData('schedule/dashboard2/update-qcdate', {
                    order_id: order.id + '',
                    actual_qc_date: actual_qc_date,
                });
            }

            saveWaterDate(order, act_Water_date) {
                console.log('Transport API save Water Date');
                console.log(act_Water_date);
                return ApiService.postData('schedule/dashboard2/update-waterdate', {
                    order_id: order.id + '',
                    // planned_watertest_date: plan_water_date,
                    actual_watertest_date: act_Water_date + '',

                });
            }

            saveDispatchDate(order, act_disp_date) {
                console.log('Dispatch Date Save Fun Controller ! ');
                // actual_dispatch_date = new Date(actual_dispatch_date);
                console.log(act_disp_date);
                return ApiService.postData('schedule/dashboard2/update-dispatchdate', {
                    order_id: order.id + '',
                    // planned_watertest_date: plan_water_date,
                    actual_dispatch_date: act_disp_date,

                });
            }

            saveDealerCommentOnOrder(order, dealer_comments) {
                return ApiService.postData('schedule/transportdashboard2/update-order', {
                    order_id: order.id,
                    dealer_comments: dealer_comments,
                });
            }

            saveLockdown(month, number) {
                return ApiService.postData('schedule/transportdashboard2/update-lockdown', {
                    lockdown_number: number,
                    lockdown_month: month,
                });
            }

            updateOrderPosition(viewMonth, order, newMonth, newPosition, previousOrderId, nextOrderId) {
                return ApiService.postData('schedule/transportdashboard2/update-order', {
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
        return new ScheduleTransportDashboardApi();
    });
};