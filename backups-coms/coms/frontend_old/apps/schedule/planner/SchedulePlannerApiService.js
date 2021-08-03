import _ from 'lodash';

export default app => {

    app.factory('SchedulePlannerApiService', (ApiService) => {


        class SchedulePlannerApi {

            getInitialData() {
                return ApiService.getData('schedule/planner/initial');
            }

            saveData(data) {
                return ApiService.postData('schedule/planner/save', {
                    'data': data,
                });
            }
        }

        return new SchedulePlannerApi();
    });
};