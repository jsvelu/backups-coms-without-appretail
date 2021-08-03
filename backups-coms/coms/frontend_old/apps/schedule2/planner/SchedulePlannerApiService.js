import _ from 'lodash';

export default app => {

    app.factory('SchedulePlannerApiService', (ApiService) => {


        class SchedulePlannerApi {

            getInitialData() {
                return ApiService.getData('schedule/planner2/initial');
            }

            saveData(data) {
                return ApiService.postData('schedule/planner2/save', {
                    'data': data,
                });
            }
        }

        return new SchedulePlannerApi();
    });
};