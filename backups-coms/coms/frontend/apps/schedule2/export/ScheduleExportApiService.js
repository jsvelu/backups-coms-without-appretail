import _ from 'lodash';

export default app => {

    app.factory('ScheduleExportApiService', (ApiService) => {


        class ScheduleExportApi {

            getInitialData() {
                return ApiService.getData('schedule/export2/initial');
            }
        }

        return new ScheduleExportApi();
    });
};