import _ from 'lodash';

export default app => {

    app.factory('ScheduleApiService', (ApiService) => {



        var convertIncomingOrderDates = (order) => {
            ApiService.convertIncomingDates(order, [
                'buildDateOriginal',
                'buildDate',
                'buildStart',
                'drawingDeadline',
                'drawingOn',
                'drawingToProdOn',
                'chassisOrderedOn',
                'coilsOrderedOn',
            ]);

            for (let checklistId in order.checklistNotes) {
                for (let note of order.checklistNotes[checklistId]) {
                    ApiService.convertIncomingDates(note, ['recordedOn']);
                }
            }

            return order;
        };

        class ScheduleApi {
            getScheduleListData(dateFrom, dateTo, search) {
                // Get schedule data for a date range
                var dateFrom = ApiService.formatDate(dateFrom);
                var dateTo   = ApiService.formatDate(dateTo);
                return ApiService.getData('schedule/build/list/'+dateFrom+'/'+dateTo+'/', {search: search})
                    .then((data) => {
                        ApiService.convertIncomingDates(data, [
                            'dateFrom',
                            'dateTo',
                            'selectableBuildDateMin',
                            'selectableBuildDateMax',
                        ]);
                        for (let week of data.weeks) {
                            for (let order of week.orders) {
                                convertIncomingOrderDates(order);
                            }
                        }
                        return data;
                    });
            }

            getScheduleData(orderId) {
                // Get schedule data for one order
                return ApiService.getData('schedule/build/'+orderId+'/', {}, {debounceKey: true})
                    .then((order) => convertIncomingOrderDates(order));
            }

            setOrderPriority(orderId, buildPriorityId) {
                return ApiService.patchData('production/build/'+orderId+'/priority/', {
                    'buildPriorityId': buildPriorityId,
                });
            }

            setOrderDatePriority(orderId, buildDate, buildPriorityId) {
                return ApiService.patchData('production/build/'+orderId+'/date_priority/', {
                    'buildDate': ApiService.formatDate(buildDate),
                    'buildPriorityId': buildPriorityId,
                });
            }

            setBuildOverride(orderId, checklistId, overrideValue) {
                return ApiService.putData('production/build/'+orderId+'/override/'+checklistId+'/', {
                    'overrideValue': overrideValue,
                });
            }

            postBuildNote(orderId, checklistId, text) {
                return ApiService.post('production/build/'+orderId+'/note/'+checklistId+'/', {
                    'text': text,
                });
            }
        }

        return new ScheduleApi();
    });
};