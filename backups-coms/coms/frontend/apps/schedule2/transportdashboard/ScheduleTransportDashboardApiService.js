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

            getStatusInitialData() {
                return ApiService.getData('schedule/dashboard2/production_status/');
            }

            getDealerInitialData(viewMonth) {
                return ApiService.getData('schedule/transportdashboard2/dealer/' + ApiService.formatDate(viewMonth));
            }

            getStatusData(viewMonth) {
                return ApiService.getData('schedule/dashboard/production_status/' + ApiService.formatDate(viewMonth));
            }


            hold_Order(order, hold_value) {
                return ApiService.postData('schedule/dashboard2/update-hold-caravans', {
                    order_id: order.id,
                    hold_caravans: hold_value,
                });
            }

            saveCommentOnOrder(order, schedule_comments) {
                return ApiService.postData('schedule/transportdashboard2/update-order', {
                    order_id: order.id,
                    schedule_comments: schedule_comments,
                });
            }


            saveChassisOnOrder(order, chassis_section_comments) {
                return ApiService.postData('schedule/dashboard2/update-chassis-section-comments', {
                    order_id: order.id + '',
                    chassis_section_comments: chassis_section_comments,
                });
            }

            saveBuildingOnOrder(order, building_comments) {
                return ApiService.postData('schedule/dashboard2/update-building-comments', {
                    order_id: order.id + '',
                    building_comments: building_comments,
                });
            }

            savePrewireOnOrder(order, prewire_comments) {
                return ApiService.postData('schedule/dashboard2/update-prewire-comments', {
                    order_id: order.id + '',
                    prewire_comments: prewire_comments,
                });
            }


            saveAluminiumOnOrder(order, aluminium_comments) {
                return ApiService.postData('schedule/dashboard2/update-aluminium-comments', {
                    order_id: order.id + '',
                    aluminium_comments: aluminium_comments,
                });
            }


            saveFinishinOnOrder(order, finishing_comments) {
                return ApiService.postData('schedule/dashboard2/update-finishing-comments', {
                    order_id: order.id + '',
                    finishing_comments: finishing_comments,
                });
            }
            saveWatertestOnOrder(order, watertest_comments) {
                return ApiService.postData('schedule/dashboard2/update-water-comments', {
                    order_id: order.id + '',
                    watertest_comments: watertest_comments,
                });
            }


            /*
            saveQCOnOrder(order, qc_comments_from) {
                return ApiService.postData('schedule/dashboard/update-transport-order', {
                    order_id: order.id + '',
                    qc_comments_from: qc_comments_from,
                });
            }


            saveQCOnOrder(order, qc_comments_from) {
                return ApiService.postData('schedule/dashboard/update-transport-order', {
                    order_id: order.id + '',
                    qc_comments_from: qc_comments_from,
                });
            }
            

            saveBuildingOnOrder(order, building_comments) {
                return ApiService.postData('schedule/dashboard/update-building-comments', {
                    order_id: order.id + '',
                    building_comments: building_comments,
                });
            }
            */
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
            saveWeighBridgeOnOrder(order, weigh_bridge_comments) {
                return ApiService.postData('schedule/dashboard2/update-weigh-bridge-comments', {
                    order_id: order.id + '',
                    weigh_bridge_comments: weigh_bridge_comments,
                });
            }


            saveDetailingOnOrder(order, detailing_comments) {
                return ApiService.postData('schedule/dashboard2/update-detailing-comments', {
                    order_id: order.id + '',
                    detailing_comments: detailing_comments,
                });
            }
            saveFinalQCOnOrder(order, final_qc_comments) {
                return ApiService.postData('schedule/dashboard2/update-finalqc-order', {
                    order_id: order.id + '',
                    final_qc_comments: final_qc_comments,
                });
            }

            saveDispatchOnOrder(order, dispatch_comments) {

                return ApiService.postData('schedule/dashboard2/update-dispatch-order', {
                    order_id: order.id + '',
                    dispatch_comments: dispatch_comments,
                });
            }

            saveProdDate(order, actual_production_date,planned_disp_date) {
                return ApiService.postData('schedule/dashboard/update-proddate', {
                    order_id: order.id + '',
                    actual_production_date: actual_production_date,
                    planned_disp_date:planned_disp_date,

                });
            }
             

            savePlannedWaterDate(order, planned_qc_date, planned_watertest_date, planned_disp_date) {
                return ApiService.postData('schedule/dashboard2/update-planned-water-date', {
                    order_id: order.id + '',
                    planned_watertest_date: planned_watertest_date,
                    planned_qc_date: planned_qc_date,
                    planned_disp_date: planned_disp_date,

                });


            }

            saveChassisDate(order, chassis_section) {
                return ApiService.postData('schedule/dashboard2/update-chassis-section', {
                    order_id: order.id + '',
                    chassis_section: chassis_section,

                });
            }

            saveAluminiumDate(order, aluminium_date) {
                return ApiService.postData('schedule/dashboard2/update-aluminium', {
                    order_id: order.id + '',
                    aluminium: aluminium_date,

                });
            }

            saveBuildingDate(order, building_date) {
                return ApiService.postData('schedule/dashboard2/update-building', {
                    order_id: order.id + '',
                    building: building_date,

                });
            }


            savePrewireDate(order, prewire_section) {
                return ApiService.postData('schedule/dashboard2/update-prewire_section', {
                    order_id: order.id + '',
                    prewire_section: prewire_section,

                });
            }

            saveFinishingDate(order, finishing_date) {
                return ApiService.postData('schedule/dashboard2/update-finishing', {
                    order_id: order.id + '',
                    finishing: finishing_date,

                });
            }

            saveWatertestDate(order, watertest_date) {
                return ApiService.postData('schedule/dashboard2/update-waterdate', {
                    order_id: order.id + '',
                    watertest_date: watertest_date,

                });
            }

            saveWeighBridgeDate(order, weigh_bridge_date) {
                return ApiService.postData('schedule/dashboard2/update-weigh-bridge', {
                    order_id: order.id + '',
                    weigh_bridge_date: weigh_bridge_date,
                });
            }

            saveDetailingDate(order, detailing_date) {
                return ApiService.postData('schedule/dashboard2/update-detailing', {
                    order_id: order.id + '',
                    detailing_date: detailing_date,
                });
            }



            saveQcDate(order, actual_qc_date) {

                return ApiService.postData('schedule/dashboard2/update-qcdate', {
                    order_id: order.id + '',
                    actual_qc_date: actual_qc_date,

                });
            }

            saveWaterDate(order, act_Water_date) {
                return ApiService.postData('schedule/dashboard2/update-waterdate', {
                    order_id: order.id + '',
                    // planned_watertest_date: plan_water_date,
                    actual_watertest_date: act_Water_date + '',

                });
            }

            saveFinalQCDate(order, final_qc_date) {
                return ApiService.postData('schedule/dashboard2/update-finalqcdate', {
                    order_id: order.id + '',
                    // planned_watertest_date: plan_water_date,
                    final_qc_date: final_qc_date + '',

                });
            }

            saveDispatchDate(order, act_disp_date) {
                // actual_dispatch_date = new Date(actual_dispatch_date);
                return ApiService.postData('schedule/dashboard2/update-dispatchdate', {
                    order_id: order.id + '',
                    // planned_watertest_date: plan_water_date,
                    actual_dispatch_date: act_disp_date,

                });
            }

            sendEmailReadyForDispatch() {
                // actual_dispatch_date = new Date(actual_dispatch_date);
                return ApiService.postData('schedule/dashboard2/send-ReadyForDispatch', {
                    send_ReadyForDispatch: 'send_ReadyForDispatch',
                });
            }
            
            sendEmailActualDispatch() {
                // actual_dispatch_date = new Date(actual_dispatch_date);
                return ApiService.postData('schedule/dashboard2/send-ActualDispatch', {
                    send_ActualDispatch: 'send_ActualDispatch',
                });
            }

            exportDispatched(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/dispatched/' + dpdate + '/' + dpdate;
            }

            exportReadyDispatched(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/pending_for_dispatch/' + dpdate + '/' + dpdate;
            }
            exportChassis(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_chassis/' + dpdate + '/' + dpdate;
            }

            exportBuilding(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_building/' + dpdate + '/' + dpdate;
            }


            exportPrewire(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_prewire/' + dpdate + '/' + dpdate;
            }

            exportAluminium(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_aluminium/' + dpdate + '/' + dpdate;
            }

            exportFinishing(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_finishing/' + dpdate + '/' + dpdate;
            }
            exportWatertesting(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_watertest/' + dpdate + '/' + dpdate;
            }

            exportWeighbridge(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_weighbridge/' + dpdate + '/' + dpdate;
            }

            exportDetailing(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_detailing/' + dpdate + '/' + dpdate;
            }


            exportActualQc(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_qc/' + dpdate + '/' + dpdate;
            }


            exportWatertest(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_water_test/' + dpdate + '/' + dpdate;
            }



            exportFinalQC(dpdate) {
                window.location = '/export/schedule/productiondashboard-csv/2/awaiting_final_qc/' + dpdate + '/' + dpdate;
            }

            exportAll(dpdate) {
                console.log('all');
                window.location = '/export/schedule/productiondashboard-csv/2/all/' + dpdate + '/' + dpdate;
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