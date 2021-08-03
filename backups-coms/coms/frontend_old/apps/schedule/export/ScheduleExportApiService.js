import _ from 'lodash';

export default app => {

    app.factory('ScheduleExportApiService', (ApiService) => {


        class ScheduleExportApi {

            getInitialData() {
                return ApiService.getData('schedule/export/initial');
            }
        }

        return new ScheduleExportApi();
    });
};