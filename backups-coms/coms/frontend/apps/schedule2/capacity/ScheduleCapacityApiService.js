
export default app => {

    app.factory('ScheduleCapacityApiService', (ApiService) => {


        class ScheduleCapacityApi {

            getInitialData(viewMonth) {
                return ApiService.getData('schedule/capacity2/initial/' + ApiService.formatDate(viewMonth));
            }

            saveData(weekList) {
                return ApiService.postData('schedule/capacity2/save', {
                    'weekList': weekList,
                });
            }
        }

        return new ScheduleCapacityApi();
    });
};